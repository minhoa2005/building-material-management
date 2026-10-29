import crypto from 'node:crypto';
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import checkPermission from '../../middlewares/permission.js';
import { validate } from '../../middlewares/validate.js';
import { uploadSingleImage } from '../../middlewares/upload.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import { BusinessDocument, Evidence, ExternalReference } from '../../models/index.js';
import { uploadImageBuffer } from '../upload/upload.service.js';
import { cloudinary } from '../../config/cloudinary.js';
import { currentRole, rolePermissions } from '../../shared/utils/userRole.js';
import { dto, scopedDocument } from './workflow.shared.js';
import * as sr from './supplier-return.service.js';
import * as receipts from './return-receipt.service.js';
import * as read from './workflow.read.js';
import * as v from './workflow.validation.js';

const router = Router();
router.use(authenticate);
const permit = (permission, roles) => checkPermission(permission, roles);
const send = (fn) => catchAsync(async (req, res) => { res.set('Cache-Control', 'no-store'); formatApiResponse(res, { data: await fn(req) }); });
function evidenceUrl(evidence) {
  const format = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' }[evidence.mediaType];
  return cloudinary.utils.private_download_url(evidence.objectKey, format || 'png', { type: 'authenticated', resource_type: 'image', expires_at: Math.floor(Date.now() / 1000) + 60 });
}
const list = (fn) => catchAsync(async (req, res) => {
  const result = await fn(req.user, req.query);
  formatApiResponse(res, { data: result.items, meta: { total: result.total, page: result.page, limit: result.limit } });
});
const parsePayload = (req, _res, next) => {
  try { if (typeof req.body.payload === 'string') req.body = JSON.parse(req.body.payload); next(); }
  catch { next(new ApiError(400, 'Nội dung biểu mẫu không hợp lệ')); }
};
async function upload(req) {
  if (!req.file) throw new ApiError(400, 'Cần ảnh chứng cứ');
  const b = req.file.buffer;
  const stored = await uploadImageBuffer(b, 'sep490/return-workflows', 'authenticated');
  return { objectKey: stored.publicId, mediaType: `image/${stored.format === 'jpg' ? 'jpeg' : stored.format}`, sha256: crypto.createHash('sha256').update(b).digest('hex') };
}
router.get('/return-workflows/options', send(async (req) => {
  if (!['OWNER', 'WAREHOUSE', 'SALES', 'ACCOUNTANT'].includes(currentRole(req.user)?.code)) throw new ApiError(403, 'Không có quyền nghiệp vụ');
  if (!rolePermissions(req.user).some((p) => ['defect:read', 'customer_return:read', 'supplier_return:read', 'external_reference:create'].includes(p))) throw new ApiError(403, 'Không có quyền xem dữ liệu nguồn');
  return read.options(req.user);
}));
router.get('/supplier-returns', permit('supplier_return:read', ['OWNER', 'WAREHOUSE', 'ACCOUNTANT']), validate(v.listSchema), list(sr.listSupplierReturns));
router.post('/supplier-returns', permit('supplier_return:create', ['WAREHOUSE']), validate(v.supplierCreateSchema), send((req) => sr.createSupplierReturn(req.user, req.body)));
router.get('/supplier-returns/:id', permit('supplier_return:read', ['OWNER', 'WAREHOUSE', 'ACCOUNTANT']), validate(v.idSchema), send((req) => sr.supplierReturnDetail(req.user, req.params.id)));
for (const [path, permission, roles, schema, fn] of [
  ['agreement', 'supplier_return:record_agreement', ['ACCOUNTANT'], v.agreementSchema, sr.supplierAgreement],
  ['dispatch', 'supplier_return:dispatch', ['WAREHOUSE'], v.dispatchSchema, sr.dispatchSupplierReturn],
  ['acknowledgement', 'supplier_return:record_agreement', ['ACCOUNTANT'], v.ackSchema, sr.acknowledgeSupplierReturn],
  ['close', 'supplier_return:close', ['ACCOUNTANT'], v.closeSchema, sr.closeSupplierReturn],
]) router.post(`/supplier-returns/:id/${path}`, permit(permission, roles), validate(schema), send((req) => fn(req.user, req.params.id, req.body)));
router.get('/failed-deliveries', permit('customer_return:read', ['OWNER', 'WAREHOUSE', 'ACCOUNTANT']), validate(v.listSchema), list(read.listFailed));
router.post('/failed-deliveries', permit('customer_return:inspect', ['WAREHOUSE']), uploadSingleImage, parsePayload, validate(v.failedCreateSchema), send(async (req) => receipts.createFailedDelivery(req.user, req.body, await upload(req))));
router.get('/failed-deliveries/:id', permit('customer_return:read', ['OWNER', 'WAREHOUSE', 'ACCOUNTANT']), validate(v.idSchema), send((req) => read.failedDetail(req.user, req.params.id)));
router.post('/failed-deliveries/:id/inspect', permit('customer_return:inspect', ['WAREHOUSE']), validate(v.failedInspectionSchema), send((req) => receipts.inspectFailedDelivery(req.user, req.params.id, req.body)));
router.post('/failed-deliveries/:id/receipt', permit('customer_return:post', ['WAREHOUSE']), validate(v.receiptSchema), send((req) => receipts.receiveFailedDelivery(req.user, req.params.id, req.body)));
router.post('/customer-returns/:id/receipt', permit('customer_return:post', ['WAREHOUSE']), validate(v.receiptSchema), send((req) => receipts.receiveCustomerReturn(req.user, req.params.id, req.body)));
router.post('/customer-returns/:id/reassess', permit('customer_return:inspect', ['WAREHOUSE']), validate(v.reassessSchema), send((req) => receipts.reassessCustomerReturn(req.user, req.params.id, req.body)));
router.post('/customer-returns/:id/handback', permit('customer_return:post', ['WAREHOUSE']), validate(v.dispatchSchema), send((req) => receipts.handBackCustomerReturn(req.user, req.params.id, req.body)));
router.get('/lots/:id/trace', permit('stock_movement:read', ['OWNER', 'ACCOUNTANT', 'WAREHOUSE']), validate(v.idSchema), send((req) => read.traceLot(req.user, req.params.id)));
router.get('/lots/:id/trace/evidence/:evidenceId', permit('stock_movement:read', ['OWNER', 'ACCOUNTANT', 'WAREHOUSE']), validate(v.idSchema), send(async (req) => {
  const trace = await read.traceLot(req.user, req.params.id);
  if (!v.id.safeParse(req.params.evidenceId).success || !trace.evidence.some((x) => x._id === req.params.evidenceId)) throw new ApiError(404, 'Không tìm thấy chứng cứ trong phạm vi truy xuất');
  const evidence = await Evidence.findById(req.params.evidenceId);
  return { url: evidenceUrl(evidence) };
}));
router.get('/external-references', permit('external_reference:read', ['ACCOUNTANT']), validate(v.listSchema), send(async (req) => dto(await ExternalReference.find().sort({ createdAt: -1 }).skip((req.query.page - 1) * req.query.limit).limit(req.query.limit).lean())));
router.post('/external-references', permit('external_reference:create', ['ACCOUNTANT']), validate(v.externalCreateSchema), send((req) => read.recordExternalReference(req.user, req.body)));

async function evidenceParent(user, id) {
  const doc = await BusinessDocument.findById(id);
  const permission = { SUPPLIER_RETURN: 'supplier_return:read', FAILED_DELIVERY: 'customer_return:read', CUSTOMER_RETURN: 'customer_return:read', DEFECT_CASE: 'defect:read', PO: 'external_reference:create', GR_PURCHASE: 'external_reference:create', GI_SUPPLIER_RETURN: 'external_reference:create', SALES_ORDER: 'external_reference:create' }[doc?.documentKind];
  if (!permission || !rolePermissions(user).includes(permission)) throw new ApiError(404, 'Không tìm thấy chứng từ');
  if (currentRole(user)?.code === 'SALES' && String(doc.createdBy) !== String(user._id)) throw new ApiError(404, 'Không tìm thấy chứng từ');
  return scopedDocument(user, id, doc.documentKind);
}
router.post('/return-workflows/:id/evidence', validate(v.idSchema), uploadSingleImage, send(async (req) => {
  const parent = await evidenceParent(req.user, req.params.id);
  const role = currentRole(req.user)?.code;
  if (!['WAREHOUSE', 'ACCOUNTANT', 'SALES'].includes(role)) throw new ApiError(403, 'Không có quyền tải chứng cứ');
  const stored = await upload(req);
  const evidence = await Evidence.create({ documentId: parent._id, ...stored, uploadedBy: req.user._id });
  return dto(evidence);
}));
router.get('/return-workflows/:id/evidence/:evidenceId', validate(v.idSchema), send(async (req) => {
  await evidenceParent(req.user, req.params.id);
  if (!v.id.safeParse(req.params.evidenceId).success) throw new ApiError(400, 'Mã chứng cứ không hợp lệ');
  const evidence = await Evidence.findOne({ _id: req.params.evidenceId, documentId: req.params.id });
  if (!evidence) throw new ApiError(404, 'Không tìm thấy chứng cứ');
  return { url: evidenceUrl(evidence) };
}));
export default router;
