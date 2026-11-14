import mongoose from 'mongoose';
import { exact, ExactDecimal } from '../models/model-utils.js';

const cartonCodes = new Set(['BOX', 'THÙNG', 'HOP', 'HỘP']);
// Legacy area unit codes: only used by backfillConversions(apply) to set uoms.areaMm2 = 1000000 once.
const legacyAreaCodes = new Set(['M2', 'M²']);
const codeOf = uom => uom.code.trim().toUpperCase();
const byId = rows => new Map(rows.map(row => [String(row._id), row]));
const scopeKey = row => [row.productId, row.productBatchId, row.uomId].join(':');
const baselineDate = row => row.createdAt ?? new Date(0);

function validFactor(value) {
  try {
    const factor = exact(value);
    if (factor.gt(0) && factor.lt('1000000000000') && factor.decimalPlaces() <= 12) return factor;
  } catch {
    // Invalid legacy values are included in the report.
  }
  return null;
}

export function planConversionBackfill({ products, batches, uoms, operations = [] }) {
  const reports = [];
  const candidates = new Map();
  const productById = byId(products);
  const uomById = byId(uoms);
  const cartons = uoms.filter(uom => uom.isCarton || cartonCodes.has(codeOf(uom)));
  const cartonIds = new Set(cartons.map(row => String(row._id)));
  const areas = uoms.filter(uom => uom.areaMm2 != null);
  const uomByCode = new Map(uoms.map(uom => [uom.code, uom]));
  if (!cartons.length) reports.push({ reason: 'NO_CARTON_UOM' });
  for (const uom of uoms) {
    if (!cartonIds.has(String(uom._id)) && cartonCodes.has(uom.name.trim().toUpperCase())) {
      reports.push({ reason: 'REVIEW_CARTON_CODE', uomId: uom._id, code: uom.code });
    }
  }

  function add(product, uom, batch, values) {
    const row = { productId: product._id, productBatchId: batch?._id ?? null, uomId: uom._id,
      version: 1, createdBy: null, ...values };
    candidates.set(scopeKey(row), row);
  }

  for (const batch of batches) {
    if (/^QC-\d+V$/i.test(batch.manufacturerLot)) {
      reports.push({ reason: 'REVIEW_SYNTHETIC_LOT', batchId: batch._id });
      continue;
    }
    if (batch.identificationStatus !== 'VERIFIED') continue;
    const product = productById.get(String(batch.productId));
    const factor = validFactor(batch.piecesPerCarton);
    if (!product || !factor?.isInteger()) {
      reports.push({ reason: 'INVALID_LOT_PACKAGING', batchId: batch._id });
      continue;
    }
    for (const uom of cartons) {
      if (product.baseUnit === uom.code) continue;
      add(product, uom, batch, { basePerUnit: factor.toFixed(), validFrom: baselineDate(batch),
        verificationReference: `Quy cách đã xác minh của lô ${batch.manufacturerLot}` });
    }
  }

  // Same rule as areaFactor() in shared/utils/conversions.js: the base unit must not be a carton or an area unit
  // (pieceCodes was dropped: it hard-coded two codes and skipped other whole-piece base units).
  for (const product of products) {
    const baseUom = uomByCode.get(product.baseUnit);
    if (!areas.length || !baseUom || cartonIds.has(String(baseUom._id)) || baseUom.areaMm2 != null) continue;
    if (product.lengthMm == null || product.widthMm == null) {
      reports.push({ reason: 'AREA_FACTOR_NO_SIZE', productId: product._id });
      continue;
    }
    const size = exact(product.lengthMm).mul(exact(product.widthMm));
    for (const uom of areas) {
      if (uom.code === product.baseUnit) continue;
      const factor = size.gt(0) ? validFactor(exact(uom.areaMm2).div(size).toDecimalPlaces(12, ExactDecimal.ROUND_HALF_UP)) : null;
      if (!factor) { reports.push({ reason: 'AREA_FACTOR_NOT_VALID', productId: product._id, uomId: uom._id }); continue; }
      add(product, uom, null, { basePerUnit: factor.toFixed(), validFrom: baselineDate(product),
        verificationReference: 'Tự tính từ kích thước sản phẩm' });
    }
  }

  const legacyGroups = new Map();
  for (const op of operations) {
    const [productId, uomId, rawFactor] = (op.requestKey ?? '').split(':');
    const product = productById.get(productId);
    const uom = uomById.get(uomId);
    const factor = validFactor(rawFactor);
    if (!product || productId !== String(op.subjectId) || !uom || uom.code === product.baseUnit || !factor ||
        !(op.completedAt instanceof Date) || !Number.isFinite(op.completedAt.getTime()) ||
        (cartonIds.has(uomId) && product.wholeBaseUnits && !factor.isInteger())) {
      reports.push({ reason: 'UNRESOLVED_LEGACY_CONVERSION', operationId: op._id });
      continue;
    }
    const key = scopeKey({ productId, productBatchId: null, uomId });
    const group = legacyGroups.get(key) ?? [];
    group.push({ op, product, uom, factor: factor.toFixed() });
    legacyGroups.set(key, group);
  }
  for (const [key, group] of legacyGroups) {
    const operationIds = group.map(({ op }) => op._id);
    if (new Set(group.map(row => row.factor)).size !== 1) {
      candidates.delete(key);
      reports.push({ reason: 'AMBIGUOUS_LEGACY_FACTORS', operationIds });
      continue;
    }
    if (group.length > 1) reports.push({ reason: 'DUPLICATE_LEGACY_FACTOR', operationIds });
    group.sort((a, b) => a.op.completedAt - b.op.completedAt || String(a.op._id).localeCompare(String(b.op._id)));
    const { op, product, uom, factor } = group[0];
    reports.push({ reason: 'LEGACY_EFFECTIVE_DATE_FROM_OPERATION', operationId: op._id });
    add(product, uom, null, { basePerUnit: factor, validFrom: op.completedAt, createdBy: op.actorId ?? null,
      verificationReference: op.correlationId || `Thao tác quy đổi ${op._id}` });
  }
  return { candidates: [...candidates.values()], cartonUomIds: cartons.map(row => row._id), reports };
}

export async function backfillConversions(models, { apply = false } = {}) {
  const Conversion = models.get('conversions');
  const Uom = models.get('uoms');
  const read = (name, filter = {}, session = null) => models.get(name).find(filter).session(session).lean();
  async function run(session) {
    const plan = planConversionBackfill({
      products: await read('products', {}, session),
      batches: await read('product_batches', {}, session),
      // Legacy M2 rows get areaMm2 in memory too, so one dry-run/apply pass plans their conversions.
      uoms: (await read('uoms', {}, session)).map(uom => uom.areaMm2 == null && legacyAreaCodes.has(codeOf(uom)) ? { ...uom, areaMm2: '1000000' } : uom),
      operations: await read('operation_records', { subjectType: 'products', operationCode: 'CREATE_PRODUCT_CONVERSION' }, session),
    });
    const existing = new Map();
    for (const row of await read('conversions', {}, session)) {
      const key = scopeKey(row);
      if (!existing.has(key) || row.version < existing.get(key).version) existing.set(key, row);
    }
    const pending = [];
    for (const row of plan.candidates) {
      const current = existing.get(scopeKey(row));
      if (!current) pending.push(row);
      else if (!exact(current.basePerUnit).eq(row.basePerUnit)) {
        plan.reports.push({ reason: 'EXISTING_CONVERSION_DIFFERS', conversionId: current._id,
          productId: row.productId, productBatchId: row.productBatchId, uomId: row.uomId });
      }
    }
    if (apply) {
      await Uom.collection.updateMany({ code: { $in: [...legacyAreaCodes] }, areaMm2: null },
        { $set: { areaMm2: mongoose.Types.Decimal128.fromString('1000000') } }, { session });
      await Uom.updateMany({ _id: { $in: plan.cartonUomIds }, isCarton: { $ne: true } }, { $set: { isCarton: true } }, { session });
      if (pending.length) await Conversion.insertMany(pending, { session });
    }
    return { apply, candidates: plan.candidates.length, pending: pending.length, inserted: apply ? pending.length : 0,
      cartonUomIds: plan.cartonUomIds, reports: plan.reports };
  }
  if (!apply) return run(null);
  await Conversion.createIndexes();
  return Conversion.db.transaction(run);
}
