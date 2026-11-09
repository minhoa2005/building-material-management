import { Conversion, OperationRecord, ProductBatch, Uom } from '../../models/runtime.js';
import { exact, sameId } from '../../models/model-utils.js';
import { duplicateError, validationError, versionConflict } from './ApiError.js';
import { appendAudit } from './audit.js';
import { hash } from './document-command.js';
import { lockLotIdentity } from './lotIdentity.js';

export async function resolveConversion(product, batch, enteredUnit, session, { allowInactiveUom = false } = {}) {
  const uom = await Uom.findOne({ code: enteredUnit, ...(!allowInactiveUom && { isActive: true }) }).session(session);
  if (!uom) throw validationError(`Đơn vị ${enteredUnit} không tồn tại hoặc đã ngừng hoạt động`);
  if (enteredUnit === product.baseUnit) return exact('1');

  const scope = { productId: product._id, uomId: uom._id, validFrom: { $lte: new Date() } };
  let conversion = batch && await Conversion.findOne({ ...scope, productBatchId: batch._id })
    .sort({ validFrom: -1 }).session(session);
  if (!conversion && (!batch || !uom.isCarton)) {
    conversion = await Conversion.findOne({ ...scope, productBatchId: null })
      .sort({ validFrom: -1 }).session(session);
  }
  if (!conversion) {
    throw validationError(`Thiếu quy đổi cho sản phẩm ${product._id}, đơn vị ${enteredUnit}, lô ${batch?._id ?? 'chưa chọn'}`);
  }
  return exact(conversion.basePerUnit);
}

export function conversionDto(row, uom, creator, isCurrent) {
  return {
    id: String(row._id),
    productId: String(row.productId),
    productBatchId: row.productBatchId ? String(row.productBatchId) : null,
    version: row.version,
    productVersion: 1,
    uom: { id: String(uom._id), code: uom.code, name: uom.name },
    basePerUnit: exact(row.basePerUnit).toFixed(),
    validFrom: row.validFrom.toISOString(),
    verificationReference: row.verificationReference,
    createdBy: creator ? { id: String(creator._id), fullName: creator.fullName || creator.username } : null,
    isCurrent,
  };
}

async function appendConversion(scope, values, latest, user, session) {
  if (latest && values.validFrom <= latest.validFrom) {
    throw versionConflict('Mốc hiệu lực phải sau phiên bản quy đổi mới nhất', latest.version);
  }
  try {
    const row = await new Conversion({
      ...scope, ...values, version: (latest?.version ?? 0) + 1, createdBy: user._id,
    }).save({ session });
    const operationKey = hash({ conversionId: String(row._id) });
    const operation = await new OperationRecord({
      actorType: 'USER', actorId: user._id, operationCode: 'CREATE_PRODUCT_CONVERSION',
      requestKey: operationKey, requestHash: hash({ scope, values }), operationKey,
      subjectType: 'conversions', subjectId: row._id,
      versionBefore: latest?.version ?? 0, versionAfter: row.version,
      resultCode: 'CREATED', completedAt: new Date(),
    }).save({ session });
    await appendAudit({
      operationId: operation._id, actorId: user._id, action: 'CREATE_PRODUCT_CONVERSION',
      entityType: 'conversions', entityId: row._id, session,
      changes: [{ field: 'basePerUnit', before: latest ? exact(latest.basePerUnit).toFixed() : null, after: values.basePerUnit }],
    });
    return row;
  } catch (error) {
    if (error.code === 11000) throw duplicateError('Phiên bản quy đổi đã tồn tại');
    throw error;
  }
}

export async function configureConversion(product, input, user, session) {
  if (!product.isActive) throw validationError('Sản phẩm đã ngừng sử dụng');
  if (input.productId && !sameId(input.productId, product._id)) {
    throw validationError('Sản phẩm trên yêu cầu không khớp đường dẫn');
  }
  const uom = await Uom.findOne({ _id: input.uomId, isActive: true }).session(session);
  if (!uom) throw validationError('Đơn vị quy đổi không tồn tại hoặc đã ngừng hoạt động');
  if (uom.code === product.baseUnit) throw validationError('Đơn vị quy đổi trùng đơn vị gốc');

  const validFrom = input.validFrom ? new Date(input.validFrom) : new Date();
  const factor = exact(input.basePerUnit);
  if (uom.isCarton && product.wholeBaseUnits && !factor.isInteger()) {
    throw validationError('Quy đổi thùng phải ra số nguyên đơn vị gốc');
  }
  if (input.productBatchId) {
    const batch = await ProductBatch.findOne({
      _id: input.productBatchId, productId: product._id, identificationStatus: 'VERIFIED',
    }).session(session);
    if (!batch) throw validationError('Lô chưa xác minh hoặc không thuộc sản phẩm');
    if (uom.isCarton && (!factor.eq(batch.piecesPerCarton) || validFrom > new Date())) {
      throw validationError('Quy đổi thùng của lô phải khớp quy cách đã xác minh và không đặt lịch trước');
    }
    await lockLotIdentity(batch._id, session);
  }

  const scope = { productId: product._id, productBatchId: input.productBatchId ?? null, uomId: uom._id };
  const latest = await Conversion.findOne(scope).sort({ version: -1 }).session(session);
  const row = await appendConversion(scope, {
    basePerUnit: factor.toFixed(), validFrom,
    verificationReference: input.verificationReference ?? 'Khai báo khi tạo sản phẩm',
  }, latest, user, session);
  return conversionDto(row, uom, user, row.validFrom <= new Date());
}

export async function syncLotConversions(batch, product, user, session) {
  if (batch.identificationStatus !== 'VERIFIED') return;
  const cartons = await Uom.find({ isCarton: true, code: { $ne: product.baseUnit } }).session(session);
  for (const uom of cartons) {
    const scope = { productId: product._id, productBatchId: batch._id, uomId: uom._id };
    const latest = await Conversion.findOne(scope).sort({ version: -1 }).session(session);
    if (latest && exact(latest.basePerUnit).eq(batch.piecesPerCarton)) continue;
    await appendConversion(scope, {
      basePerUnit: String(batch.piecesPerCarton),
      validFrom: new Date(Math.max(Date.now(), (latest?.validFrom.getTime() ?? 0) + 1)),
      verificationReference: `Quy cách đã xác minh của lô ${batch.manufacturerLot}`,
    }, latest, user, session);
  }
}
