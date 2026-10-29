import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { ExactDecimal as Decimal } from '../../models/model-utils.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { BusinessDocument, DocumentLine, BusinessOperation, AuditEvent, Evidence, Location, LocationLock, StockAccount, StockBalance, StockMovement, PostingBatch, Product } from '../../models/index.js';

export const same = (a, b) => a != null && b != null && String(a) === String(b);
export const dec = (v) => new Decimal(String(v));
export const oid = () => new mongoose.Types.ObjectId();
export const hash = (v) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function dto(v) {
  if (v == null) return v;
  if (v instanceof Date) return v.toISOString();
  if (v._bsontype === 'ObjectId' || v._bsontype === 'Decimal128') return v.toString();
  if (Array.isArray(v)) return v.map(dto);
  if (typeof v === 'object') return Object.fromEntries(Object.entries(v.toObject ? v.toObject() : v).map(([k, x]) => [k, dto(x)]));
  return v;
}
export function warehouseScope(user) {
  return currentRole(user)?.code === 'WAREHOUSE' ? { 'header.warehouseId': { $in: user.warehouseIds || [] } } : {};
}
export function requireWarehouse(user, warehouseId) {
  if (currentRole(user)?.code !== 'WAREHOUSE' || !(user.warehouseIds || []).some((id) => same(id, warehouseId))) throw new ApiError(403, 'Kho nằm ngoài phạm vi được phân công');
}
export async function scopedDocument(user, id, kind, session) {
  const document = await BusinessDocument.findOne({ _id: id, documentKind: kind, ...warehouseScope(user) }).session(session);
  if (!document) throw new ApiError(404, 'Không tìm thấy chứng từ trong phạm vi được phép');
  return document;
}
export async function document(kind, user, header, session, status = 'POSTED', note) {
  const id = oid();
  const [doc] = await BusinessDocument.create([{ _id: id, documentNo: `${kind.slice(0, 12)}-${String(id).slice(-12).toUpperCase()}`, documentKind: kind, workflowStatus: status, version: 1, createdBy: user._id, occurredAt: new Date(), ...(header ? { header } : {}), note }], { session });
  return doc;
}
export async function copyLine(source, target, qty, session, lineKind = 'STANDARD', details, lineNo = 1) {
  const product = await Product.findById(source.productId).session(session);
  if (!product || (product.wholeBaseUnits && !dec(qty).isInteger())) throw new ApiError(400, 'Sản phẩm yêu cầu số lượng nguyên theo đơn vị gốc');
  const entered = dec(qty).div(source.conversionSnapshot.toString()).toDecimalPlaces(6);
  if (!entered.mul(source.conversionSnapshot.toString()).toDecimalPlaces(6).eq(dec(qty))) throw new ApiError(400, 'Số lượng không biểu diễn được bằng quy cách gốc');
  const [line] = await DocumentLine.create([{ documentId: target._id, lineNo, lineKind, productId: source.productId, lotId: source.lotId, conversionId: source.conversionId, enteredQty: entered.toString(), conversionSnapshot: source.conversionSnapshot, qtyBase: String(qty), productNameSnapshot: source.productNameSnapshot, ...(details ? { details } : {}) }], { session });
  return line;
}
export async function evidenceFor(documentId, ids, session) {
  const rows = await Evidence.find({ _id: { $in: ids }, documentId }).session(session);
  if (!ids.length || rows.length !== ids.length) throw new ApiError(400, 'Cần chứng cứ đã tải lên thuộc đúng chứng từ');
  return rows;
}
export async function guardLocations(ids, session) {
  for (const id of [...new Set(ids.map(String))].sort()) {
    const location = await Location.findOneAndUpdate({ _id: id, isActive: true }, { $inc: { planningVersion: 1 } }, { new: true, session });
    if (!location) throw new ApiError(409, 'Vị trí không còn hoạt động');
    if (await LocationLock.exists({ locationId: id }).session(session)) throw new ApiError(409, 'Vị trí đang bị khóa kiểm kê');
  }
}
export async function targetBalance(locationId, lotId, qualityCode, ownerPartyId, session) {
  const account = await StockAccount.findOneAndUpdate({ locationId }, { $setOnInsert: { locationId } }, { upsert: true, new: true, session });
  return StockBalance.findOneAndUpdate({ accountId: account._id, lotId, qualityCode, ownerPartyId }, { $setOnInsert: { qtyBase: '0', version: 0 } }, { upsert: true, new: true, session });
}
export async function movement(batch, doc, line, from, to, qty, session) {
  const fields = { batchId: batch._id, documentId: doc._id, lineId: line._id, qtyBase: String(qty) };
  for (const [side, balance, sign] of [['from', from, -1], ['to', to, 1]]) {
    if (!balance) continue;
    const before = dec(balance.qtyBase), after = before.plus(dec(qty).mul(sign));
    if (after.lt(0)) throw new ApiError(409, 'Số lượng vượt tồn thực tế');
    const changed = await StockBalance.updateOne({ _id: balance._id, version: balance.version }, { $set: { qtyBase: after.toString() }, $inc: { version: 1 } }, { session });
    if (changed.modifiedCount !== 1) throw new ApiError(409, 'Tồn kho đã thay đổi; tải lại để kiểm tra');
    Object.assign(fields, { [`${side}BalanceId`]: balance._id, [`${side}Before`]: before.toString(), [`${side}After`]: after.toString() });
    balance.qtyBase = mongoose.Types.Decimal128.fromString(after.toString()); balance.version += 1;
  }
  await StockMovement.create([fields], { session });
}
export async function batch(doc, user, input, operation, session) {
  const [result] = await PostingBatch.create([{ documentId: doc._id, operation, operationKey: input.idempotencyKey.slice(0, 100), idempotencyKey: input.idempotencyKey, payloadHash: hash(input), postedBy: user._id }], { session });
  return result;
}
export async function command(user, id, kind, input, operation, execute) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const doc = await scopedDocument(user, id, kind, session);
      const payloadHash = hash({ id: String(id), ...input });
      const prior = await BusinessOperation.findOne({ idempotencyKey: input.idempotencyKey }).session(session);
      if (prior) {
        if (!same(prior.documentId, id) || !same(prior.performedBy, user._id) || prior.payloadHash !== payloadHash) throw new ApiError(409, 'Mã thao tác đã dùng cho nội dung khác');
        result = { documentId: String(id), repeated: true }; return;
      }
      if (doc.version !== input.expectedVersion) throw new ApiError(409, 'Chứng từ đã thay đổi; tải lại trước khi tiếp tục');
      result = await execute(doc, session);
      const changed = await BusinessDocument.updateOne({ _id: doc._id, version: input.expectedVersion }, { $set: { workflowStatus: result.status || doc.workflowStatus }, $inc: { version: 1 } }, { session });
      if (changed.modifiedCount !== 1) throw new ApiError(409, 'Chứng từ vừa được cập nhật bởi người khác');
      await BusinessOperation.create([{ documentId: doc._id, operation, operationKey: input.idempotencyKey.slice(0, 100), idempotencyKey: input.idempotencyKey, payloadHash, documentVersion: input.expectedVersion + 1, performedBy: user._id, reason: input.note }], { session });
      await AuditEvent.create([{ documentId: doc._id, actorId: user._id, action: operation, details: JSON.stringify({ ...result, operationKey: input.idempotencyKey }) }], { session });
      result = { ...result, documentId: String(id), repeated: false };
    });
    return dto(result);
  } catch (error) {
    if (error.code === 11000) throw new ApiError(409, 'Thao tác trùng hoặc dữ liệu vừa thay đổi; kiểm tra kết quả trước khi thử lại');
    throw error;
  } finally { await session.endSession(); }
}
export async function createCommand(user, input, operation, execute) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const payloadHash = hash(input);
      const prior = await BusinessOperation.findOne({ idempotencyKey: input.idempotencyKey }).session(session);
      if (prior) {
        if (!same(prior.performedBy, user._id) || prior.payloadHash !== payloadHash || prior.operation !== operation) throw new ApiError(409, 'Mã thao tác đã dùng cho nội dung khác');
        result = { documentId: prior.documentId, repeated: true }; return;
      }
      const operationId = oid();
      const doc = await execute(session, operationId);
      await BusinessOperation.create([{ _id: operationId, documentId: doc._id, operation, operationKey: input.idempotencyKey.slice(0, 100), idempotencyKey: input.idempotencyKey, payloadHash, documentVersion: 1, performedBy: user._id }], { session });
      await AuditEvent.create([{ documentId: doc._id, actorId: user._id, action: operation, details: JSON.stringify({ operationKey: input.idempotencyKey }) }], { session });
      result = { documentId: doc._id, repeated: false };
    });
    return dto(result);
  } finally { await session.endSession(); }
}
