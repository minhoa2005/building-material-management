import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import { PDFDocument } from 'pdf-lib';
import { cloudinary } from '../../config/cloudinary.js';
import * as m from '../../models/index.js';
import { requirePermission } from '../../shared/utils/access.js';
import { ApiError, notFoundError, validationError } from '../../shared/utils/ApiError.js';
import { id, same, scoped, scopedPurchaseRead, read, rows, fail, command, bump, save, serialize } from './purchase-core.js';

const MAX_BYTES = 5 * 1024 * 1024;
export const evidenceStorage = {
  upload: (buffer, options) => new Promise((resolve, reject) => cloudinary.uploader.upload_stream({ ...options, timeout: 20000 }, (e, r) => e ? reject(new ApiError(502, 'Không lưu được chứng cứ')) : resolve(r)).end(buffer)),
  exists: (key, resourceType) => cloudinary.api.resource(key, { resource_type: resourceType, type: 'authenticated' }),
  destroy: (key, resourceType) => cloudinary.uploader.destroy(key, { resource_type: resourceType, type: 'authenticated', invalidate: true }),
  download: (key, format, resourceType, expiresAt) => cloudinary.utils.private_download_url(key, format, { resource_type: resourceType, type: 'authenticated', expires_at: expiresAt, attachment: true }),
};
async function parent(user, documentId, write = false, session = null) {
  const d = await (write ? scoped(user, documentId, null, session) : scopedPurchaseRead(user, documentId, null, session));
  if (d.documentKind === 'PO') requirePermission(user, 'purchase_order:' + (write ? 'update' : 'read'), write ? ['ACCOUNTANT','OWNER'] : ['OWNER','ACCOUNTANT','WAREHOUSE']);
  else if (['PO_INSPECTION','GR_PURCHASE'].includes(d.documentKind)) requirePermission(user, 'goods_receipt_inspection:' + (write ? 'update' : 'read'), write ? ['WAREHOUSE'] : ['OWNER','ACCOUNTANT','WAREHOUSE']);
  else if (d.documentKind === 'TO' && d.header.receiptId) requirePermission(user, 'putaway_task:' + (write ? 'confirm' : 'read'), write ? ['WAREHOUSE'] : ['OWNER','ACCOUNTANT','WAREHOUSE']);
  else throw notFoundError();
  // Owner can attach evidence to a PO exception only through the explicit exception authority.
  return d;
}
async function writableParent(user, documentId, session) {
  const d = await scoped(user, documentId, null, session);
  if (d.documentKind === 'PO') {
    try { requirePermission(user, 'purchase_order:update', ['ACCOUNTANT']); }
    catch { requirePermission(user, 'purchase_order:approve_exception', ['OWNER']); }
    return d;
  }
  return parent(user, documentId, true, session);
}
export async function inspectFile(file) {
  if (!file?.buffer?.length) throw validationError('Thiếu tệp chứng cứ');
  const bytes = file.buffer;
  if (bytes.length > MAX_BYTES) throw new ApiError(413, 'Chứng cứ tối đa 5 MB', { code: 'ERR-REC-FILE_SIZE' });
  try {
    if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
      if (bytes.length < 24 || bytes.readUInt32BE(16) * bytes.readUInt32BE(20) > 10000000) throw new Error('Image too large');
      PNG.sync.read(bytes, { checkCRC: true }); return { mediaType: 'image/png', resourceType: 'image', format: 'png' };
    }
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217) {
      jpeg.decode(bytes, { maxResolutionInMP: 10, maxMemoryUsageInMB: 64, tolerantDecoding: false });
      return { mediaType: 'image/jpeg', resourceType: 'image', format: 'jpg' };
    }
    if (bytes.subarray(0, 5).toString() === '%PDF-' && bytes.subarray(Math.max(0, bytes.length - 1024)).includes(Buffer.from('%%EOF'))) {
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
      if (pdf.getPageCount() < 1 || pdf.getPageCount() > 2000) throw new Error('Invalid page count');
      return { mediaType: 'application/pdf', resourceType: 'raw', format: 'pdf' };
    }
  } catch { throw validationError('Nội dung JPEG/PNG/PDF không hợp lệ'); }
  throw validationError('Chỉ nhận nội dung JPEG, PNG hoặc PDF thật');
}
export async function uploadEvidence(user, documentId, file, lineId = null) {
  await writableParent(user, documentId);
  if (lineId && !(await rows(documentId)).some(l => same(l._id, lineId))) throw notFoundError();
  const type = await inspectFile(file);
  const uploadId = new mongoose.Types.ObjectId();
  const objectKey = 'sep490/purchase-evidence/' + uploadId + (type.resourceType === 'raw' ? '.pdf' : '');
  const intent = await save(m.PurchaseEvidenceUpload, { _id: uploadId, documentId, ...(lineId && { lineId }), actorId: user._id, objectKey,
    ...type, sha256: createHash('sha256').update(file.buffer).digest('hex'), bytes: file.buffer.length, status: 'UPLOADING', expiresAt: new Date(Date.now() + 86400000) });
  try {
    const stored = await evidenceStorage.upload(file.buffer, { public_id: objectKey, resource_type: type.resourceType, type: 'authenticated', overwrite: false });
    if (stored.public_id !== objectKey || stored.type !== 'authenticated') throw new ApiError(502, 'Storage không xác nhận tệp private');
    await m.PurchaseEvidenceUpload.updateOne({ _id: intent._id, status: 'UPLOADING' }, { $set: { status: 'READY' } });
    return { uploadIntentId: id(intent._id), expiresAt: intent.expiresAt.toISOString(), mediaType: type.mediaType, bytes: file.buffer.length };
  } catch (e) {
    // Keep a traceable orphan for cleanup even when the provider response was lost.
    await m.PurchaseEvidenceUpload.updateOne({ _id: intent._id, status: 'UPLOADING' }, { $set: { expiresAt: new Date() } });
    throw e;
  }
}
export async function attachEvidence(user, documentId, input) {
  await writableParent(user, documentId);
  const upload = await read(m.PurchaseEvidenceUpload.findOne({ _id: input.uploadIntentId, documentId, actorId: user._id }));
  if (!upload) throw notFoundError();
  // No external I/O inside the transaction. READY/actor/parent are checked again atomically below.
  if (upload.status === 'READY') {
    try { await evidenceStorage.exists(upload.objectKey, upload.resourceType); }
    catch { throw new ApiError(502, 'Tệp chưa tồn tại trên storage'); }
  }
  return command(user, 'ATTACH_PURCHASE_EVIDENCE', documentId, input, async session => {
    const d = await writableParent(user, documentId, session); versionCheck(d, input.expectedVersion);
    const intent = await read(m.PurchaseEvidenceUpload.findOne({ _id: input.uploadIntentId, documentId, actorId: user._id, status: 'READY', expiresAt: { $gt: new Date() } }), session);
    if (!intent) fail('EVIDENCE', 'Upload đã hết hạn, đang dọn hoặc đã gắn vào hồ sơ');
    if (intent.lineId && !(await rows(documentId, session)).some(l => same(l._id, intent.lineId))) fail('EVIDENCE', 'Dòng nguồn không còn tồn tại');
    const evidence = await save(m.Evidence, { documentId, ...(intent.lineId && { lineId: intent.lineId }), objectKey: intent.objectKey, sha256: intent.sha256, mediaType: intent.mediaType, uploadedBy: user._id }, session);
    const changed = await m.PurchaseEvidenceUpload.updateOne({ _id: intent._id, status: 'READY' }, { $set: { status: 'ATTACHED', evidenceId: evidence._id } }, { session });
    if (changed.matchedCount !== 1) fail('EVIDENCE', 'Upload vừa được xử lý');
    return { document: await bump(d, session), evidenceId: evidence._id };
  });
}
function versionCheck(d, expected) { if (d.version !== expected) fail('VERSION', 'Hồ sơ đã thay đổi', { currentVersion: d.version }); }
export async function listEvidence(user, documentId) {
  await parent(user, documentId);
  const found = await m.Evidence.find({ documentId }).select('_id lineId mediaType uploadedBy uploadedAt').lean();
  return serialize({ items: found });
}
export async function downloadEvidence(user, documentId, evidenceId) {
  await parent(user, documentId);
  const intent = await read(m.PurchaseEvidenceUpload.findOne({ documentId, evidenceId, status: 'ATTACHED' }));
  if (!intent || !await m.Evidence.exists({ _id: evidenceId, documentId })) throw notFoundError();
  const expiresAt = Math.floor(Date.now() / 1000) + 60;
  return { url: evidenceStorage.download(intent.objectKey, intent.format, intent.resourceType, expiresAt), expiresAt: new Date(expiresAt * 1000).toISOString() };
}
export async function cleanupPurchaseEvidence({ now = new Date(), limit = 100 } = {}) {
  let removed = 0;
  for (let i = 0; i < limit; i += 1) {
    const intent = await m.PurchaseEvidenceUpload.findOneAndUpdate({ status: { $in: ['UPLOADING','READY','DELETING'] }, expiresAt: { $lte: now } }, { $set: { status: 'DELETING', expiresAt: new Date(now.getTime() + 300000) } }, { returnDocument: 'after' }).lean();
    if (!intent) break;
    // A failed destroy leaves DELETING for a later retry. ATTACHED can never match the claim.
    const result = await evidenceStorage.destroy(intent.objectKey, intent.resourceType);
    if (!['ok','not found'].includes(result.result)) throw new ApiError(502, 'Không dọn được upload mồ côi');
    await m.PurchaseEvidenceUpload.updateOne({ _id: intent._id, status: 'DELETING' }, { $set: { status: 'DELETED' } });
    removed += 1;
  }
  return { removed };
}
