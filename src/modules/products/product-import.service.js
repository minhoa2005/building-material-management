import { AuditLog, Category, Conversion, OperationRecord, Product, ProductBatch, Uom } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { requirePermission } from '../../shared/utils/access.js';
import { duplicateError, validationError } from '../../shared/utils/ApiError.js';
import { auditEvent } from '../../shared/utils/audit.js';
import { AREA_REFERENCE, areaFactorFor } from '../../shared/utils/conversions.js';
import { hash } from '../../shared/utils/document-command.js';
import { normalizeCode } from '../../shared/utils/domain.js';
import { transaction } from '../../shared/utils/persistence.js';
import { fold, pickProduct, preloadProductsBySkus } from '../../shared/utils/product-lookup.js';
import { lotRow, productRow } from './product-import.validation.js';

// D6 compares stored text exactly (case-sensitive) after trim + NFC.
const sameText = (stored, value) => String(stored ?? '').trim().normalize('NFC') === String(value ?? '').trim().normalize('NFC');
const sameNumber = (stored, value) => stored != null && exact(String(stored)).eq(value);
const shown = value => (value == null || value === '' ? 'trống' : String(value));
const utcDay = value => (value ? new Date(value).toISOString().slice(0, 10) : undefined);
const productKey = (manufacturerCode, sku, color) => [fold(manufacturerCode), fold(normalizeCode(sku)), fold(color)].join('|');

function rowErrors(parsed) {
  return parsed.error.issues.flatMap(issue => issue.code === 'unrecognized_keys'
    ? issue.keys.map(field => ({ field, message: 'Cột không có trong mẫu' }))
    : [{ field: issue.path[0] === undefined ? undefined : String(issue.path[0]), message: issue.message }]);
}
function modelErrors(error) {
  if (error?.name !== 'ValidationError') throw error;
  return Object.entries(error.errors).map(([field, detail]) => ({ field, message: detail.message }));
}
const mismatch = (field, current) => ({ field, message: `Khác danh mục (đang là: ${shown(current)})` });

function compareProduct(product, row, category) {
  const errors = [];
  if (!sameText(product.name, row.name)) errors.push(mismatch('name', product.name));
  if (!category || String(category._id) !== String(product.categoryId)) errors.push({ field: 'categoryCode', message: 'Khác nhóm sản phẩm trong danh mục' });
  if (fold(product.baseUnit) !== fold(row.baseUnit)) errors.push(mismatch('baseUnit', product.baseUnit));
  for (const field of ['lengthMm', 'widthMm', 'heightMm']) {
    if (!sameNumber(product[field], row[field])) errors.push(mismatch(field, product[field]));
  }
  for (const field of ['material', 'surface', 'origin', 'description']) {
    if (row[field] && !sameText(product[field], row[field])) errors.push(mismatch(field, product[field]));
  }
  return errors;
}
function compareLot(batch, row) {
  const errors = [];
  for (const field of ['tone', 'calibre']) if (!sameText(batch[field], row[field])) errors.push(mismatch(field, batch[field]));
  for (const field of ['piecesPerCarton', 'cartonLengthMm', 'cartonWidthMm', 'cartonHeightMm']) {
    if (!sameNumber(batch[field], row[field])) errors.push(mismatch(field, batch[field]));
  }
  if (row.manufacturedOn && utcDay(batch.manufacturedOn) !== row.manufacturedOn) errors.push(mismatch('manufacturedOn', utcDay(batch.manufacturedOn)));
  if (row.notes && !sameText(batch.notes, row.notes)) errors.push(mismatch('notes', batch.notes));
  return errors;
}

// One generated conversion with the same operation and audit trail as conversions.js appendConversion.
function conversionRecords(scope, basePerUnit, verificationReference, user, now) {
  const row = new Conversion({ ...scope, basePerUnit, validFrom: now, verificationReference, version: 1, createdBy: user._id });
  const operationKey = hash({ conversionId: String(row._id) });
  const operation = new OperationRecord({
    actorType: 'USER', actorId: user._id, operationCode: 'CREATE_PRODUCT_CONVERSION',
    requestKey: operationKey, requestHash: hash({ scope, values: { basePerUnit, verificationReference, validFrom: now } }), operationKey,
    subjectType: 'conversions', subjectId: row._id, versionBefore: 0, versionAfter: 1, resultCode: 'CREATED', completedAt: now,
  });
  const audit = auditEvent({ operationId: operation._id, actorId: user._id, action: 'CREATE_PRODUCT_CONVERSION', entityType: 'conversions',
    entityId: row._id, changes: [{ field: 'basePerUnit', before: null, after: basePerUnit }] });
  return { row, operation, audit };
}

async function resolveImport(user, input, session, persist) {
  requirePermission(user, 'product:create');
  if (input.lots.length) requirePermission(user, 'product_lot:create');
  // Sequential: a transaction session does not support parallel operations.
  const categories = await Category.find({ isActive: { $ne: false } }).session(session ?? null);
  const allUoms = await Uom.find({}).session(session ?? null);
  const uoms = allUoms.filter(u => u.isActive);
  const skus = [...input.products, ...input.lots].map(row => (typeof row.sku === 'string' ? row.sku : '')).filter(Boolean);
  const cache = await preloadProductsBySkus(skus, session);
  const known = [...cache.values()].flat();
  const lotNames = input.lots.map(row => (typeof row.manufacturerLot === 'string' ? row.manufacturerLot.trim() : '')).filter(Boolean);
  const existingBatches = known.length && lotNames.length
    ? await ProductBatch.find({ productId: { $in: known.map(p => p._id) }, manufacturerLot: { $in: lotNames } }).session(session ?? null)
    : [];

  // Lot lookup candidates by SKU: catalogue products plus file products (new or rejected).
  const candidates = new Map();
  const candidatesFor = sku => {
    const key = normalizeCode(sku);
    if (!candidates.has(key)) candidates.set(key, (cache.get(key) ?? []).map(product => ({ product, manufacturerCode: product.manufacturerCode, color: product.color })));
    return candidates.get(key);
  };
  const addCandidate = (sku, candidate) => {
    const list = candidatesFor(sku);
    const same = list.find(item => productKey(item.manufacturerCode, sku, item.color) === productKey(candidate.manufacturerCode, sku, candidate.color));
    if (same) same.error ||= candidate.error;
    else list.push(candidate);
  };

  const now = new Date();
  const newProducts = [], newBatches = [];
  const products = input.products.map((raw, index) => {
    const result = { index, rowNo: raw.rowNo ?? index + 1, status: 'ERROR', errors: [] };
    const parsed = productRow.safeParse(raw);
    if (!parsed.success) {
      result.errors = rowErrors(parsed);
      if ([raw.sku, raw.manufacturerCode, raw.color].every(v => typeof v === 'string' && v.trim())) {
        addCandidate(raw.sku, { manufacturerCode: raw.manufacturerCode, color: raw.color, error: true });
      }
      return result;
    }
    const row = { ...parsed.data, sku: normalizeCode(parsed.data.sku) };
    result.key = productKey(row.manufacturerCode, row.sku, row.color);
    result.row = row;
    return result;
  });

  const firstProductRow = new Map();
  for (const result of products.filter(r => r.row)) {
    const first = firstProductRow.get(result.key);
    if (first) {
      first.errors.push({ field: 'sku', message: `Trùng hãng/SKU/màu với dòng ${result.rowNo}` });
      result.errors.push({ field: 'sku', message: `Trùng hãng/SKU/màu với dòng ${first.rowNo}` });
    } else firstProductRow.set(result.key, result);
  }

  for (const result of products.filter(r => r.row)) {
    const { row } = result;
    const category = categories.find(c => fold(c.code) === fold(row.categoryCode));
    const existing = (cache.get(row.sku) ?? []).find(p => productKey(p.manufacturerCode, p.sku, p.color) === result.key);
    if (existing) {
      if (!existing.isActive) result.errors.push({ field: 'sku', message: 'Sản phẩm đã ngừng hoạt động' });
      else result.errors.push(...compareProduct(existing, row, category));
      if (!result.errors.length) result.status = 'EXISTS';
      addCandidate(row.sku, { product: existing, manufacturerCode: existing.manufacturerCode, color: existing.color, error: result.errors.length > 0 });
      continue;
    }
    const unit = uoms.find(u => fold(u.code) === fold(row.baseUnit));
    if (!category) result.errors.push({ field: 'categoryCode', message: 'Mã nhóm không tồn tại hoặc đã ngừng hoạt động' });
    if (!unit) result.errors.push({ field: 'baseUnit', message: 'Đơn vị gốc không tồn tại hoặc đã ngừng hoạt động' });
    let product;
    if (category && unit) {
      product = new Product({ sku: row.sku, name: row.name, manufacturerCode: row.manufacturerCode, color: row.color,
        categoryId: category._id, baseUnit: unit.code, lengthMm: row.lengthMm, widthMm: row.widthMm, heightMm: row.heightMm,
        material: row.material, surface: row.surface, origin: row.origin, description: row.description, wholeBaseUnits: true, isActive: true });
      try { await product.validate(); } catch (error) { result.errors.push(...modelErrors(error)); }
    }
    if (!result.errors.length) { result.status = 'NEW'; newProducts.push(product); }
    addCandidate(row.sku, { product, manufacturerCode: row.manufacturerCode, color: row.color, error: result.errors.length > 0 });
  }

  const lotKeys = new Map();
  const lots = [];
  for (const [index, raw] of input.lots.entries()) {
    const result = { index, rowNo: raw.rowNo ?? index + 1, status: 'ERROR', errors: [] };
    lots.push(result);
    const parsed = lotRow.safeParse(raw);
    if (!parsed.success) { result.errors = rowErrors(parsed); continue; }
    const row = parsed.data;
    const sku = normalizeCode(row.sku);
    const found = pickProduct(candidatesFor(sku), row);
    if (found.error) { result.errors.push(found.error); continue; }
    if (found.product.error) { result.errors.push({ field: 'sku', message: 'Sản phẩm ở sheet Sản phẩm đang lỗi' }); continue; }
    const product = found.product.product;
    const key = String(product._id) + '|' + row.manufacturerLot;
    const first = lotKeys.get(key);
    if (first) {
      first.errors.push({ field: 'manufacturerLot', message: `Trùng sản phẩm và mã lô với dòng ${result.rowNo}` });
      first.status = 'ERROR';
      result.errors.push({ field: 'manufacturerLot', message: `Trùng sản phẩm và mã lô với dòng ${first.rowNo}` });
      continue;
    }
    lotKeys.set(key, result);
    const existing = existingBatches.find(b => String(b.productId) === String(product._id) && b.manufacturerLot === row.manufacturerLot);
    if (existing) {
      if (existing.identificationStatus !== 'VERIFIED') result.errors.push({ field: 'manufacturerLot', message: 'Lô đã có nhưng chưa xác minh. Xác minh ở màn Lô trước' });
      else result.errors.push(...compareLot(existing, row));
      if (!result.errors.length) result.status = 'EXISTS';
      continue;
    }
    const batch = new ProductBatch({ productId: product._id, manufacturerLot: row.manufacturerLot, identificationStatus: 'VERIFIED',
      tone: row.tone, calibre: row.calibre, piecesPerCarton: Number(row.piecesPerCarton),
      cartonLengthMm: row.cartonLengthMm, cartonWidthMm: row.cartonWidthMm, cartonHeightMm: row.cartonHeightMm,
      manufacturedOn: row.manufacturedOn, notes: row.notes, verifiedAt: now, verifiedBy: user._id });
    try { await batch.validate(); } catch (error) { result.errors.push(...modelErrors(error)); }
    if (!result.errors.length) { result.status = 'NEW'; result.batch = batch; result.product = product; }
  }
  // A lot row first accepted, then marked duplicate, must not be written.
  for (const result of lots) if (result.batch && result.status === 'NEW') newBatches.push(result);

  const strip = ({ key, row, batch, product, ...result }) => result;
  const summary = {
    newProducts: products.filter(r => r.status === 'NEW').length,
    existingProducts: products.filter(r => r.status === 'EXISTS').length,
    newLots: lots.filter(r => r.status === 'NEW').length,
    existingLots: lots.filter(r => r.status === 'EXISTS').length,
    errors: [...products, ...lots].filter(r => r.status === 'ERROR').length,
  };
  const output = { valid: summary.errors === 0, summary, products: products.map(strip), lots: lots.map(strip) };
  if (!persist) return output;
  if (!output.valid) throw validationError(`Dữ liệu import còn ${summary.errors} dòng lỗi; kiểm tra lại trước khi lưu.`);

  // Bulk writes keep a 1,000 + 1,000 row import inside the transaction time limit.
  const conversions = [];
  const uomByCode = new Map(allUoms.map(u => [u.code, u]));
  for (const product of newProducts) {
    for (const uom of uoms.filter(u => u.areaMm2 != null)) {
      const factor = areaFactorFor(uom, product, uomByCode.get(product.baseUnit));
      if (factor) conversions.push(conversionRecords({ productId: product._id, productBatchId: null, uomId: uom._id }, factor.toFixed(), AREA_REFERENCE, user, now));
    }
  }
  for (const { batch, product } of newBatches) {
    for (const uom of allUoms.filter(u => u.isCarton && u.code !== product.baseUnit)) {
      conversions.push(conversionRecords({ productId: product._id, productBatchId: batch._id, uomId: uom._id }, String(batch.piecesPerCarton),
        `Quy cách đã xác minh của lô ${batch.manufacturerLot}`, user, now));
    }
  }
  const audits = [
    ...newProducts.map(p => auditEvent({ actorId: user._id, action: 'IMPORT_PRODUCT', entityType: 'products', entityId: p._id })),
    ...newBatches.map(({ batch }) => auditEvent({ actorId: user._id, action: 'IMPORT_BATCH', entityType: 'product_batches', entityId: batch._id })),
    ...conversions.map(c => c.audit),
  ];
  if (newProducts.length) await Product.insertMany(newProducts, { session });
  if (newBatches.length) await ProductBatch.insertMany(newBatches.map(r => r.batch), { session });
  if (conversions.length) {
    await Conversion.insertMany(conversions.map(c => c.row), { session });
    await OperationRecord.insertMany(conversions.map(c => c.operation), { session });
  }
  if (audits.length) await AuditLog.insertMany(audits, { session });
  return output;
}

export function previewImport(user, input) {
  return resolveImport(user, input, null, false);
}

export async function importCatalogue(user, input) {
  try {
    return await transaction(session => resolveImport(user, input, session, true));
  } catch (error) {
    if (error.code === 11000) throw duplicateError('Sản phẩm hoặc lô vừa được tạo bởi thao tác khác; hãy kiểm tra lại.');
    throw error;
  }
}
