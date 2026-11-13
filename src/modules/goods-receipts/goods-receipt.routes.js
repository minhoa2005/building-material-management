import { documentIdentifier } from '../../shared/utils/document-id.validation.js';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import { requirePermission, requireWarehouseAccess, isOwner, hasPermission } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { notFoundError } from '../../shared/utils/ApiError.js';
import { dto } from '../../shared/utils/persistence.js';
import { PurchaseReceipt, CustomerReturnReceipt, FailedDeliveryReceipt, TransferReceipt, OtherGoodsReceipt, CustomerReturn, TransferDispatch, WarehouseTransferRequest } from '../../models/runtime.js';
import { receiptRouter as purchaseRouter, empty, schema, pagination, ver, key, qty, reason, evidenceIds, handle } from '../po-receiving/po-receiving.routes.js';
import * as other from './other-receipt.service.js';

const definitions = [
  ['purchase', PurchaseReceipt, 'goods_receipt_inspection:read'],
  ['customer-return', CustomerReturnReceipt, 'customer_return:read'],
  ['failed-delivery', FailedDeliveryReceipt, 'failed_delivery:read'],
  ['transfer', TransferReceipt, 'stock_transfer:read'],
  ['other', OtherGoodsReceipt, 'goods_receipt_other:read'],
];

const query = z.object({ ...pagination, warehouseId: z.string().regex(/^[a-f\d]{24}$/i).optional(), status: z.string().max(40).optional() }).strict();
const response = (receipt, user) => {
  const value = dto(receipt);
  if (receipt.documentKind === 'OTHER') {
    const warehouse = currentRole(user)?.code === 'WAREHOUSE';
    const owner = currentRole(user)?.code === 'OWNER';
    value.capabilities = {
      submit: warehouse && hasPermission(user, 'goods_receipt_other:create') && receipt.workflowStatus === 'DRAFT',
      cancel: warehouse && hasPermission(user, 'goods_receipt_other:create') && receipt.workflowStatus === 'DRAFT',
      approve: owner && hasPermission(user, 'goods_receipt_other:approve') && receipt.workflowStatus === 'PENDING_APPROVAL',
      post: warehouse && hasPermission(user, 'goods_receipt_other:post') && receipt.workflowStatus === 'APPROVED' && receipt.approvedVersion === receipt.version,
      reverse: warehouse && hasPermission(user, 'goods_receipt_other:reverse') && receipt.workflowStatus === 'POSTED',
    };
  }
  return value;
};
const router = Router();
router.use(authenticate);

for (const [path, Model, permission] of definitions) {
  if (path === 'purchase') { router.use('/purchase', purchaseRouter); continue; }
  if (path === 'transfer') {
    const scoped = Router();
    scoped.get('/', validate(schema(empty, empty, query)), catchAsync(async (req, res) => {
      requirePermission(req.user, permission);
      const { page, limit, warehouseId, status } = req.validated.query;
      if (warehouseId) requireWarehouseAccess(req.user, warehouseId);
      const filter = { 'header.warehouseId': warehouseId ?? { $in: req.user.warehouseIds ?? [] }, ...(status && { workflowStatus: status }) };
      if (isOwner(req.user) && !warehouseId) delete filter['header.warehouseId'];
      const [rows, total] = await Promise.all([
        Model.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
        Model.countDocuments(filter),
      ]);
      const dispatches = await TransferDispatch.find({ _id: { $in: rows.map(row => row.header.dispatchId).filter(Boolean) } }).select('_id header.requestId').lean();
      const requests = await WarehouseTransferRequest.find({ _id: { $in: dispatches.map(row => row.header.requestId).filter(Boolean) } }).select('_id documentNo header').lean();
      const dispatchById = new Map(dispatches.map(row => [String(row._id), row]));
      const requestById = new Map(requests.map(row => [String(row._id), row]));
      const items = rows.map(row => {
        const dispatch = dispatchById.get(String(row.header.dispatchId));
        const request = dispatch && requestById.get(String(dispatch.header.requestId));
        return { ...response(row, req.user), transferId: request ? String(request._id) : undefined, transferDocumentNo: request?.documentNo, dispatchId: String(row.header.dispatchId) };
      });
      formatApiResponse(res, { data: { items, total, page, limit } });
    }));
    router.use('/transfer', scoped);
    continue;
  }
  const scoped = Router();
  if (path === 'other') {
    const command = { expectedVersion: ver, operationKey: key };
    const line = z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), lotId: z.string().regex(/^[a-f\d]{24}$/i),
      enteredUnit: z.string().min(1).max(60), enteredQty: qty, destinationLocationId: z.string().regex(/^[a-f\d]{24}$/i),
      qualityCode: z.enum(['GOOD', 'DAMAGED', 'PENDING', 'BLOCKED']) }).strict();
    const id = z.string().regex(/^[a-f\d]{24}$/i);
    scoped.post('/', validate(schema(z.object({ operationKey: key, warehouseId: id, reason,
      originalReceiptId: documentIdentifier.optional(), note: z.string().max(2000).optional(), lines: z.array(line).min(1).max(100).optional() }).strict(), empty)), handle((u,v) => other.createOtherReceipt(u,v.body)));
    scoped.post('/:id/submit', validate(schema(z.object(command).strict())), handle((u,v) => other.submitOtherReceipt(u,v.params.id,v.body)));
    scoped.post('/:id/approve', validate(schema(z.object({ ...command, decision: z.enum(['APPROVE','REJECT']), reason }).strict())), handle((u,v) => other.approveOtherReceipt(u,v.params.id,v.body)));
    scoped.post('/:id/post', validate(schema(z.object({ ...command, packaging: z.array(z.object({ lineId: id,
      portions: z.array(z.object({ packagingState: z.enum(['SEALED','OPEN','LOOSE']), quantityBase: qty,
        sealedPackCount: z.number().int().nonnegative().optional(), measuredVolumeMm3: qty.optional(),
        extraOccupiedVolumeMm3: qty.optional(), packagingSnapshot: z.object({ packageUnit: z.string().min(1).max(60),
          baseUnitsPerPackage: qty, outerLengthMm: qty, outerWidthMm: qty, outerHeightMm: qty }).strict().optional() }).strict()).min(1).max(100) }).strict()).max(100).optional() }).strict())), handle((u,v) => other.postOtherReceipt(u,v.params.id,v.body)));
    scoped.post('/:id/reverse', validate(schema(z.object({ ...command, reason, evidenceIds }).strict())), handle((u,v) => other.reverseOtherReceipt(u,v.params.id,v.body)));
    scoped.post('/:id/cancel', validate(schema(z.object({ ...command, reason }).strict())), handle((u,v) => other.cancelOtherReceipt(u,v.params.id,v.body)));
    scoped.get('/:id/reversal-preflight', validate(schema()), handle((u,v) => other.otherReversalPreflight(u,v.params.id)));
  }
  scoped.get('/', validate(schema(empty, empty, query)), catchAsync(async (req, res) => {
    requirePermission(req.user, permission);
    const { page, limit, warehouseId, status } = req.validated.query;
    if (warehouseId) requireWarehouseAccess(req.user, warehouseId);
    const filter = { 'header.warehouseId': warehouseId ?? { $in: req.user.warehouseIds ?? [] }, ...(status && { workflowStatus: status }) };
    if (isOwner(req.user) && !warehouseId) delete filter['header.warehouseId'];
    if (path === 'customer-return' && currentRole(req.user)?.code === 'SALES') {
      const sources = await CustomerReturn.find({ createdBy: req.user._id }).select('_id');
      filter['header.returnId'] = { $in: sources.map(row => row._id) };
    }
    const [rows, total] = await Promise.all([Model.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit), Model.countDocuments(filter)]);
    formatApiResponse(res, { data: { items: rows.map(row => response(row, req.user)), total, page, limit } });
  }));
  scoped.get('/:id', validate(schema()), catchAsync(async (req, res) => {
    requirePermission(req.user, permission);
    const receipt = await Model.findById(req.validated.params.id);
    if (!receipt) throw notFoundError();
    requireWarehouseAccess(req.user, receipt.header.warehouseId);
    if (path === 'customer-return' && currentRole(req.user)?.code === 'SALES'
      && !await CustomerReturn.exists({ _id: receipt.header.returnId, createdBy: req.user._id })) throw notFoundError();
    formatApiResponse(res, { data: response(receipt, req.user) });
  }));
  router.use(`/${path}`, scoped);
}

export default router;
