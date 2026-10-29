import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { BusinessDocument, DocumentLine, BusinessOperation, ExternalReference, ExternalReferenceLine,
  Party, Product, ProductUomVersion, Evidence, AuditEvent, OutboxEvent } from '../../models/index.js';
import { exact } from '../../models/model-utils.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { currentRole, rolePermissions } from '../../shared/utils/userRole.js';
import { cloudinary } from '../../config/cloudinary.js';

const secret = () => process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026';
const hash = (value) => createHash('sha256').update(value).digest('hex');
function permit(user) {
  if (!user?.isActive || currentRole(user)?.code !== 'SALES' || !rolePermissions(user).includes('sales_order:create')) throw new ApiError(403, 'Không có quyền tạo SO');
}

export async function uploadSourceEvidence(user, file) {
  permit(user);
  if (!file) throw new ApiError(400, 'Thiếu ảnh đơn nguồn');
  const bytes = file.buffer;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  if (!png && !jpeg && !webp) throw new ApiError(400, 'Chỉ nhận ảnh PNG, JPEG hoặc WebP hợp lệ');
  // Authenticated delivery prevents public access to the order evidence.
  const stored = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: 'sep490/sales-source', resource_type: 'image', type: 'authenticated', timeout: 20000 },
      (error, result) => error ? reject(new ApiError(502, 'Không lưu được bằng chứng')) : resolve(result)).end(file.buffer);
  });
  const receipt = jwt.sign({ actorId: String(user._id), objectKey: stored.public_id,
    sha256: hash(file.buffer), mediaType: `image/${stored.format}` }, secret(),
  { algorithm: 'HS256', audience: 'sales-source-evidence', expiresIn: '24h' });
  return { receipt };
}

export async function createSalesOrder(user, input) {
  permit(user);
  const key = `so:${user._id}:${input.idempotencyKey}`;
  const payloadHash = hash(JSON.stringify(input));
  const replay = async () => {
    const prior = await BusinessOperation.findOne({ idempotencyKey: key }).lean();
    if (!prior) return null;
    if (prior.payloadHash !== payloadHash) throw new ApiError(409, 'Idempotency key đã dùng với dữ liệu khác');
    return { id: String(prior.documentId), version: prior.documentVersion, replayed: true, shortageEvaluation: 'PENDING' };
  };
  const previous = await replay(); if (previous) return previous;
  let evidence;
  try { evidence = jwt.verify(input.evidenceReceipt, secret(), { algorithms: ['HS256'], audience: 'sales-source-evidence' }); }
  catch { throw new ApiError(400, 'Bằng chứng không hợp lệ hoặc hết hạn'); }
  if (evidence.actorId !== String(user._id)) throw new ApiError(403, 'Bằng chứng không thuộc người tạo');
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const customer = await Party.findOne({ _id: input.customerId, kind: 'CUSTOMER', isActive: true }).session(session);
      if (!customer) throw new ApiError(400, 'Khách hàng không hợp lệ');
      const reference = new ExternalReference({ ...input.source, referenceKind: 'SALES_ORDER', correlationId: `so:${new mongoose.Types.ObjectId()}` });
      // Recording a source is not an Accountant verification. Do not fabricate verifiedBy/At.
      await reference.save({ session });
      const document = new BusinessDocument({ documentKind: 'SALES_ORDER', documentNo: `SO-${new mongoose.Types.ObjectId()}`,
        workflowStatus: 'OPEN', createdBy: user._id, externalReferenceIds: [reference._id],
        header: { externalReferenceId: reference._id, customerId: customer._id, neededOn: input.neededOn, deliveryAddressSnapshot: input.deliveryAddress } });
      await document.save({ session });
      for (const [index, line] of input.lines.entries()) {
        const product = await Product.findOne({ _id: line.productId, isActive: true }).session(session);
        const conversion = await ProductUomVersion.findOne({ _id: line.conversionId, productId: line.productId, validFrom: { $lte: new Date() } }).session(session);
        if (!product || !conversion) throw new ApiError(400, 'Sản phẩm hoặc đơn vị quy đổi không hợp lệ');
        const currentConversion = await ProductUomVersion.findOne({ productId: product._id, uomId: conversion.uomId, validFrom: { $lte: new Date() } })
          .sort({ validFrom: -1, version: -1 }).session(session);
        if (String(currentConversion._id) !== String(conversion._id)) throw new ApiError(409, 'Quy đổi đã thay đổi, hãy tải lại đơn vị sản phẩm');
        const base = exact(line.quantity).mul(exact(conversion.basePerUnit));
        if (base.decimalPlaces() > 6 || base.gte('100000000000000') || (product.wholeBaseUnits && !base.isInteger())) throw new ApiError(400, 'Số lượng quy đổi không hợp lệ');
        const sourceLine = new ExternalReferenceLine({ referenceId: reference._id, lineKey: line.sourceLineKey, productId: product._id, eligibleQty: base.toFixed() });
        await sourceLine.save({ session });
        await new DocumentLine({ documentId: document._id, lineNo: index + 1, lineKind: 'SALES_ORDER', productId: product._id,
          conversionId: conversion._id, enteredQty: line.quantity, conversionSnapshot: conversion.basePerUnit, qtyBase: base.toFixed(), productNameSnapshot: product.name,
          details: { externalReferenceId: reference._id, externalLineId: sourceLine._id, requiredTone: line.requiredTone, requiredCalibre: line.requiredCalibre } }).save({ session });
      }
      await new Evidence({ documentId: document._id, objectKey: evidence.objectKey, sha256: evidence.sha256, mediaType: evidence.mediaType, uploadedBy: user._id, uploadedAt: new Date(evidence.iat * 1000) }).save({ session });
      await new BusinessOperation({ documentId: document._id, operation: 'CREATE_SALES_ORDER', operationKey: 'create', idempotencyKey: key, payloadHash, documentVersion: 1, performedBy: user._id }).save({ session });
      await new AuditEvent({ documentId: document._id, actorId: user._id, action: 'CREATE_SALES_ORDER', eventAt: new Date(), details: 'Source entered by Sales with uploaded evidence; no stock effect' }).save({ session });
      await new OutboxEvent({ documentId: document._id, eventType: 'SALES_ORDER_SAVED', eventKey: `sales-order:${document._id}:1`, documentVersion: 1 }).save({ session });
      return { id: String(document._id), version: 1, replayed: false, shortageEvaluation: 'PENDING' };
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } catch (error) {
    if (error.code === 11000 || error.hasErrorLabel?.('UnknownTransactionCommitResult')) {
      const prior = await replay(); if (prior) return prior;
      if (error.code === 11000) throw new ApiError(409, 'Đơn nguồn hoặc dòng đơn nguồn đã được sao chép');
    }
    throw error;
  } finally { await session.endSession(); }
}
