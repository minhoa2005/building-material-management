import mongoose from 'mongoose';
import * as m from '../../models/legacy/index.js';
import { exact } from '../../models/model-utils.js';
import { canAccessWarehouse, requirePermission } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { idString, sha256Json, sha256Text } from '../../shared/utils/domain.js';
import { ApiError, notFoundError, versionConflict, operationConflict } from '../../shared/utils/ApiError.js';
import { appendAudit } from '../../shared/utils/audit.js';

export const id = idString;
export const same = (a, b) => id(a) === id(b);
export const read = (query, session = null) => query.session(session).lean();
export const txOptions = { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } };
export const fail = (code, message, details = null, fieldErrors = []) => { throw new ApiError(409, message, { code: `ERR-REC-${code}`, details, fieldErrors }); };
export const version = (d, expected) => { if (d.version !== expected) throw versionConflict('Dữ liệu đã thay đổi', d.version); };
export const rights = (u, action, resource = 'goods_receipt_inspection', roles = ['WAREHOUSE']) => requirePermission(u, `${resource}:${action}`, roles);
export async function scoped(user, documentId, kind = null, session = null) {
  const d = await read(m.BusinessDocument.findOne({ _id: documentId, ...(kind && { documentKind: kind }) }), session);
  if (!d || !canAccessWarehouse(user, d.header?.warehouseId)) throw notFoundError();
  return d;
}
// Read-only scope for purchase documents; commands must continue to use scoped().
export async function scopedPurchaseRead(user, documentId, kind = null, session = null) {
  const d = await read(m.BusinessDocument.findOne({ _id: documentId, ...(kind && { documentKind: kind }) }), session);
  const purchaseDocument = ['PO', 'PO_INSPECTION', 'GR_PURCHASE'].includes(d?.documentKind)
    || (d?.documentKind === 'TO' && d.header?.taskKind === 'PUTAWAY' && d.header.receiptId && d.header.purchaseOrderId);
  const accountantPurchase = currentRole(user)?.code === 'ACCOUNTANT' && purchaseDocument;
  if (!d || (!accountantPurchase && !canAccessWarehouse(user, d.header?.warehouseId))) throw notFoundError();
  return d;
}
export const rows = (documentId, session = null) => read(m.DocumentLine.find({ documentId }).sort({ lineNo: 1 }), session);
export async function save(Model, fields, session) { const d = new Model(fields); await d.save({ session }); return d; }
export async function newDoc(kind, header, user, session, status = 'DRAFT') {
  const _id = new mongoose.Types.ObjectId();
  return save(m.BusinessDocument, { _id, documentNo: `${kind}-${_id}`, documentKind: kind, header, workflowStatus: status, version: 1, createdBy: user._id }, session);
}
export const link = (a, b, relationCode, session) => save(m.DocumentLink, { parentDocumentId: a._id, childDocumentId: b._id, relationCode }, session);
export const lineLink = (a, b, qty, session, relationCode = 'SOURCE') => save(m.LineLink, { sourceLineId: a, targetLineId: b, linkedQty: qty, relationCode }, session);
export async function bump(d, session, set = {}) {
  const next = await m.BusinessDocument.findOneAndUpdate({ _id: d._id, documentKind: d.documentKind, version: d.version }, { $inc: { version: 1 }, ...(Object.keys(set).length && { $set: set }) }, { session, returnDocument: 'after', runValidators: true }).lean();
  if (!next) fail('VERSION', 'Chứng từ vừa thay đổi');
  return next;
}
export function serialize(v) {
  if (v == null) return v;
  if (v instanceof Date) return v.toISOString();
  if (v._bsontype === 'Decimal128' || v._bsontype === 'ObjectId') return v.toString();
  if (Array.isArray(v)) return v.map(serialize);
  if (typeof v === 'object') return Object.fromEntries(Object.entries(v.toObject ? v.toObject() : v).map(([k, x]) => [k, serialize(x)]));
  return v;
}
export const operationKey = (user, raw) => sha256Text(`po-receiving:${id(user._id)}:${raw}`);
export function receipt(value, replayed) { const op = value.toObject ? value.toObject() : value; return serialize({ id: op.documentId, version: op.documentVersion, ...op.result, operationId: op._id, replayed }); }
export async function command(user, action, targetId, input, work) {
  const key = operationKey(user, input.creationKey ?? input.operationKey);
  const hash = sha256Json({ action, targetId: id(targetId), input });
  const replay = async (op, session = null) => {
    if (op.payloadHash !== hash || op.operation !== action || !same(op.performedBy, user._id)) throw operationConflict();
    await scoped(user, op.documentId, null, session);
    return receipt(op, true);
  };
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const prior = await read(m.BusinessOperation.findOne({ idempotencyKey: key }), session);
      if (prior) return replay(prior, session);
      const { document, ...result } = await work(session, key, hash);
      const op = await save(m.BusinessOperation, { documentId: document._id, operation: action, operationKey: key, idempotencyKey: key, payloadHash: hash, documentVersion: document.version, performedBy: user._id, result: { workflowStatus: document.workflowStatus, ...result } }, session);
      await appendAudit({ documentId: document._id, actorId: user._id, action, details: { version: document.version, operationId: id(op._id), ...(input.reason && { reason: input.reason }) }, session });
      return receipt(op, false);
    }, txOptions);
  } catch (e) {
    if (e.code === 11000 || e.hasErrorLabel?.('UnknownTransactionCommitResult')) {
      const prior = await read(m.BusinessOperation.findOne({ idempotencyKey: key }));
      if (prior) return replay(prior);
      fail('CONCURRENT', 'Nguồn đang được xử lý; tra cứu hoặc thử lại cùng key');
    }
    throw e;
  } finally { await session.endSession(); }
}
export async function location(user, locationId, warehouseId, kinds, session) {
  const l = await read(m.Location.findById(locationId), session);
  if (!l?.isActive || !same(l.warehouseId, warehouseId) || !kinds.includes(l.kind) || !canAccessWarehouse(user, warehouseId)) fail('LOCATION', 'Vị trí không phù hợp kho/loại hoặc đã ngừng hoạt động');
  return l;
}
export async function guardLocations(ids, session) {
  for (const locationId of [...new Set(ids.map(id))].sort()) {
    const changed = await m.Location.updateOne({ _id: locationId, isActive: true }, { $inc: { planningVersion: 1 } }, { session });
    if (changed.matchedCount !== 1 || await m.LocationLock.exists({ locationId }).session(session)) fail('FREEZE', 'Vị trí bị khóa kiểm kê hoặc ngừng hoạt động', { locationId });
  }
}
export async function balance(locationId, lotId, ownerPartyId, qualityCode, session) {
  let account = await read(m.StockAccount.findOne({ locationId }), session);
  if (!account) account = await save(m.StockAccount, { locationId }, session);
  let b = await read(m.StockBalance.findOne({ accountId: account._id, lotId, ownerPartyId, qualityCode }), session);
  if (!b) b = await save(m.StockBalance, { accountId: account._id, lotId, ownerPartyId, qualityCode, qtyBase: '0', version: 0 }, session);
  return b;
}
export async function adjust(b, delta, session) {
  const after = exact(b.qtyBase).plus(delta);
  if (after.isNegative()) fail('SOURCE', 'Không đủ lượng nguồn');
  const changed = await m.StockBalance.updateOne({ _id: b._id, version: b.version }, { $set: { qtyBase: after.toString() }, $inc: { version: 1 } }, { session });
  if (changed.matchedCount !== 1) fail('VERSION', 'Số dư vừa thay đổi');
  return { before: b.qtyBase.toString(), after: after.toString() };
}
export const batch = (document, user, key, hash, session, extra = {}) => save(m.PostingBatch, { documentId: document._id, operation: 'POST', operationKey: key, idempotencyKey: key, payloadHash: hash, postedBy: user._id, ...extra }, session);
export async function evidenceFor(user, documentId, ids, session, required = false) {
  if (required && !ids?.length) fail('EVIDENCE', 'Cần chứng cứ đã lưu trên hồ sơ');
  await scoped(user, documentId, null, session);
  const found = await read(m.Evidence.find({ _id: { $in: ids ?? [] }, documentId }), session);
  if (found.length !== (ids?.length ?? 0)) fail('EVIDENCE', 'Chứng cứ không thuộc đúng hồ sơ');
  return found;
}
