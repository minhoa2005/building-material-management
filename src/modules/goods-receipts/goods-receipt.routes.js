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
import { GoodsReceipt, Warehouse, WarehouseLocation, ProductBatch, Supplier, TransferDispatch, StockTransaction, InventoryBalance, StockHoldingPoint, PurchaseReceipt, CustomerReturnReceipt, FailedDeliveryReceipt, TransferReceipt, OtherGoodsReceipt, CustomerReturn, WarehouseTransferRequest } from '../../models/runtime.js';
import { receiptRouter as purchaseRouter, empty, schema, pagination, ver, key, qty, reason, evidenceIds, handle } from '../po-receiving/po-receiving.routes.js';
import { GOODS_RECEIPT_KINDS } from '../../models/goods-receipt.model.js';
import { databaseId } from '../../models/document-identity.js';
import { exact } from '../../models/model-utils.js';
import { validDateRange, escapeRegex } from '../../shared/utils/movement-list.js';
import { getDocument } from '../po-receiving/purchase-read.service.js';
import * as other from './other-receipt.service.js';

const definitions = [
  ['purchase', 'PURCHASE', PurchaseReceipt, 'goods_receipt_inspection:read'],
  ['customer-return', 'CUSTOMER_RETURN', CustomerReturnReceipt, 'customer_return:read'],
  ['failed-delivery', 'FAILED_DELIVERY', FailedDeliveryReceipt, 'failed_delivery:read'],
  ['transfer', 'TRANSFER', TransferReceipt, 'stock_transfer:read'],
  ['other', 'OTHER', OtherGoodsReceipt, 'goods_receipt_other:read'],
];

const query = z.object({ ...pagination, warehouseId: z.string().regex(/^[a-f\d]{24}$/i).optional(), status: z.string().max(40).optional() }).strict();
const response = (receipt, user) => {
  const value = dto(receipt);
  if (receipt.documentKind === 'OTHER') {
    const warehouse = currentRole(user)?.code === 'WAREHOUSE';
    const owner = currentRole(user)?.code === 'OWNER';
    value.capabilities = {
      edit: warehouse && hasPermission(user, 'goods_receipt_other:create') && receipt.workflowStatus === 'DRAFT',
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

for (const [path, , Model, permission] of definitions) {
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
    scoped.put('/:id', validate(schema(z.object({ ...command, reason,
      originalReceiptId: documentIdentifier.nullable().optional(), note: z.string().max(2000).optional(),
      lines: z.array(line).min(1).max(100) }).strict())), handle((u,v) => other.updateOtherReceipt(u,v.params.id,v.body)));
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
    formatApiResponse(res, { data: await scopedDetail(req.user, receipt) });
  }));
  router.use(`/${path}`, scoped);
}

async function scopedDetail(user, receipt) {
  requireWarehouseAccess(user, receipt.header.warehouseId);
  if (receipt.documentKind === 'CUSTOMER_RETURN' && currentRole(user)?.code === 'SALES'
    && !await CustomerReturn.exists({ _id: receipt.header.returnId, createdBy: user._id })) throw notFoundError();
  const value = response(receipt, user);
  const warehouse = await Warehouse.findById(receipt.header.warehouseId).select('name').lean();
  value.header.warehouseName = warehouse?.name;
  if (receipt.documentKind === 'TRANSFER') {
    const dispatch = await TransferDispatch.findById(receipt.header.dispatchId).select('header.requestId').lean();
    if (dispatch) value.header.transferRequestId = String(dispatch.header.requestId);
  }
  if (['CUSTOMER_RETURN', 'FAILED_DELIVERY'].includes(receipt.documentKind) && receipt.stockTransactionId) {
    const posting = await StockTransaction.findById(receipt.stockTransactionId).select('movements').lean();
    const moves = posting?.movements.filter(row => row.toBalanceId) ?? [];
    const balances = await InventoryBalance.find({ _id: { $in: moves.map(row => row.toBalanceId) } }).select('holdingPointId qualityStatus').lean();
    const points = await StockHoldingPoint.find({ _id: { $in: balances.map(row => row.holdingPointId) } }).select('locationId').lean();
    for (const item of value.items) {
      const movement = moves.find(row => String(row.sourceLineId) === item._id);
      const balance = balances.find(row => movement && String(row._id) === String(movement.toBalanceId));
      const point = points.find(row => balance && String(row._id) === String(balance.holdingPointId));
      if (point?.locationId) item.destinationLocationId = String(point.locationId);
      if (balance) item.qualityCode = balance.qualityStatus;
    }
  }
  const [locations, lots] = await Promise.all([
    WarehouseLocation.find({ _id: { $in: value.items.map(item => item.destinationLocationId ?? item.details?.receivingLocationId).filter(Boolean) } }).select('code').lean(),
    ProductBatch.find({ _id: { $in: value.items.map(item => item.lotId).filter(Boolean) } }).select('manufacturerLot').lean(),
  ]);
  for (const item of value.items) {
    const locationId = item.destinationLocationId ?? item.details?.receivingLocationId;
    item.destinationLocationCode = locations.find(location => String(location._id) === locationId)?.code;
    item.lotLabelSnapshot ??= lots.find(lot => String(lot._id) === item.lotId)?.manufacturerLot;
  }
  return value;
}

const unifiedQuery = query.extend({
  kind: z.enum(GOODS_RECEIPT_KINDS).optional(),
  purchaseOrderId: documentIdentifier.optional(),
  q: z.string().trim().min(1).max(100).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
}).refine(validDateRange);

router.get('/', validate(schema(empty, empty, unifiedQuery)), handle(async (user, { query }) => {
  const { page, limit, kind, status, warehouseId, purchaseOrderId, q, from, to } = query;
  const role = currentRole(user)?.code;
  const allowed = definitions.filter(([, , , permission]) => hasPermission(user, permission));
  if (!allowed.length) requirePermission(user, definitions[0][3]);

  // The discriminator base lacks the variant header schema. Cast header IDs
  // explicitly here, as well as the historical PO document identity.
  const visible = allowed.filter(([, value]) => (!kind || value === kind) && (!purchaseOrderId || value === 'PURCHASE'));
  const clauses = [];
  for (const [, value] of visible) {
    const global = isOwner(user) || (value === 'PURCHASE' && role === 'ACCOUNTANT');
    if (warehouseId && !global && !(user.warehouseIds ?? []).some(id => String(id) === warehouseId)) continue;
    const scope = warehouseId ? { 'header.warehouseId': databaseId(warehouseId) }
      : global ? {} : { 'header.warehouseId': { $in: (user.warehouseIds ?? []).map(id => databaseId(String(id))) } };
    if (value === 'CUSTOMER_RETURN' && role === 'SALES') {
      scope['header.returnId'] = { $in: await CustomerReturn.find({ createdBy: user._id }).distinct('_id') };
    }
    if (purchaseOrderId) scope['header.purchaseOrderId'] = databaseId(purchaseOrderId);
    clauses.push({ documentKind: value, ...scope });
  }
  if (!clauses.length) return { items: [], total: 0, page, limit };

  const filter = {
    $or: clauses,
    ...(status && { workflowStatus: status }),
    ...(q && { documentNo: { $regex: escapeRegex(q), $options: 'i' } }),
    ...((from || to) && { createdAt: { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(to) }) } }),
  };
  const [rows, total] = await Promise.all([
    GoodsReceipt.find(filter).setOptions({ strictQuery: false }).sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit).limit(limit).select('documentKind documentNo workflowStatus createdAt occurredAt header items.qtyBase items.baseUnitSnapshot').lean(),
    GoodsReceipt.countDocuments(filter).setOptions({ strictQuery: false }),
  ]);
  const [warehouses, suppliers] = await Promise.all([
    Warehouse.find({ _id: { $in: rows.map(row => row.header?.warehouseId).filter(Boolean) } }).select('name').lean(),
    Supplier.find({ _id: { $in: rows.map(row => row.header?.supplierId).filter(Boolean) } }).select('name').lean(),
  ]);
  const items = rows.map(({ items, header, ...receipt }) => {
    const totals = new Map();
    for (const row of items ?? []) {
      const unit = row.baseUnitSnapshot || null;
      totals.set(unit, (totals.get(unit) ?? exact('0')).plus(String(row.qtyBase)));
    }
    return dto({
    ...receipt,
    header: { ...header, warehouseName: warehouses.find(row => String(row._id) === String(header?.warehouseId))?.name,
      supplierName: suppliers.find(row => String(row._id) === String(header?.supplierId))?.name },
    lineCount: items?.length ?? 0,
    totalQtyBase: (items ?? []).reduce((sum, row) => sum.plus(String(row.qtyBase)), exact('0')).toFixed(),
    totalsByBaseUnit: [...totals].map(([unit, quantity]) => ({ unit, quantity: quantity.toFixed() })),
  }); });
  return { items, total, page, limit };
}));

router.get('/:id', validate(schema()), handle(async (user, { params }) => {
  const receipt = await GoodsReceipt.findById(params.id).lean();
  const definition = definitions.find(([, kind]) => kind === receipt?.documentKind);
  if (!definition) throw notFoundError();
  requirePermission(user, definition[3]);
  if (receipt.documentKind === 'PURCHASE') return getDocument(user, params.id, 'GR_PURCHASE');
  return scopedDetail(user, receipt);
}));

export default router;
