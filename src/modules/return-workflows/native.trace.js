import * as s from './native.shared.js';
import { currentRole } from '../../shared/utils/userRole.js';
const { m, same, serialize } = s;
const itemIdsFor = lot => ({ $map: { input: { $filter: { input: '$items', as: 'item', cond: { $eq: ['$$item.lotId', lot] } } }, as: 'item', in: '$$item._id' } });
async function paginate(Model, stages, query) {
  const [result] = await Model.aggregate([...stages, { $sort: { occurredAt: -1, createdAt: -1, _id: -1 } }, { $facet: { items: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }], count: [{ $count: 'total' }] } }]);
  return { items: result?.items || [], total: result?.count[0]?.total || 0, page: query.page, limit: query.limit };
}
export async function traceRecords(user, id, query) {
  s.requirePermission(user, 'stock_movement:read');
  const lot = await m.ProductBatch.findById(id).select('manufacturerLot productId');
  if (!lot) throw s.notFoundError();
  const purchasingOnly = currentRole(user)?.code === 'ACCOUNTANT';
  const models = purchasingOnly ? [m.PurchaseOrder, m.GoodsArrival, m.GoodsInspection, m.PurchaseReceipt, m.SupplierReturn, m.SupplierReturnIssue, m.CustodyReceipt, m.CustodyRelease]
    : [m.PurchaseOrder, m.GoodsArrival, m.GoodsInspection, m.PurchaseReceipt, m.SupplierReturn, m.SupplierReturnIssue, m.CustodyReceipt, m.CustodyRelease, m.DefectReport, m.CustomerReturn, m.CustomerReturnReceipt, m.FailedDelivery, m.FailedDeliveryReceipt, m.SalesGoodsIssue, m.TransferOrder, m.TransferReceipt, m.StockQualityChange, m.StockScrapRecord];
  const scope = currentRole(user)?.code === 'OWNER' ? {} : { 'header.warehouseId': { $in: user.warehouseIds || [] } };
  const graph = new Map();
  for (const Model of models) {
    const rows = await Model.aggregate([{ $match: { ...scope, 'items.lotId': lot._id } }, { $project: { itemIds: itemIdsFor(lot._id), ...(Model === m.SalesGoodsIssue && { outboundItemIds: '$items.details.outboundDeliveryLineId' }) } }]);
    if (rows.length) graph.set(Model, rows);
  }
  // Follow only source identities here; full document histories stay out of the graph scan.
  if (!purchasingOnly) {
    const outboundIds = (graph.get(m.SalesGoodsIssue) || []).flatMap(row => row.outboundItemIds || []);
    if (outboundIds.length) {
      const deliveries = await m.DeliveryOrder.find({ 'items._id': { $in: outboundIds } }).select('_id header.issueRequestId items._id items.lotId');
      const requests = await m.WarehouseIssueRequest.find({ _id: { $in: deliveries.map(row => row.header.issueRequestId) } }).select('_id header.salesOrderId items._id items.lotId');
      const orders = await m.SalesOrder.find({ _id: { $in: requests.map(row => row.header.salesOrderId) } }).select('_id items._id items.lotId');
      for (const [Model, rows] of [[m.DeliveryOrder, deliveries], [m.WarehouseIssueRequest, requests], [m.SalesOrder, orders]]) {
        if (rows.length) graph.set(Model, rows.map(row => ({ _id: row._id, itemIds: row.items.filter(item => same(item.lotId, lot._id)).map(item => item._id) })));
      }
    }
  }
  const ids = [...graph.values()].flatMap(rows => rows.map(row => row._id));
  const itemIds = [...graph.values()].flatMap(rows => rows.flatMap(row => row.itemIds));
  let result;
  if (query.section === 'documents') {
    const entries = [...graph];
    if (!entries.length) result = { items: [], total: 0, page: query.page, limit: query.limit };
    else {
      const projection = { documentNo: 1, documentKind: 1, workflowStatus: 1, createdAt: 1, occurredAt: 1 };
      const [Model, rows] = entries[0];
      result = await paginate(Model, [{ $match: { _id: { $in: rows.map(row => row._id) } } }, { $project: projection }, ...entries.slice(1).map(([model, docs]) => ({ $unionWith: { coll: model.collection.name, pipeline: [{ $match: { _id: { $in: docs.map(row => row._id) } } }, { $project: projection }] } }))], query);
    }
  } else if (query.section === 'movements') {
    result = await paginate(m.StockTransaction, [{ $match: { sourceId: { $in: ids } } }, { $unwind: '$movements' }, { $match: { 'movements.sourceLineId': { $in: itemIds } } },
      { $project: { _id: { $concat: [{ $toString: '$_id' }, ':', { $toString: '$movements.lineNo' }] }, occurredAt: 1, quantityBase: '$movements.quantityBase', fromBefore: '$movements.fromBefore', fromAfter: '$movements.fromAfter', toBefore: '$movements.toBefore', toAfter: '$movements.toAfter' } }], query);
  } else if (query.section === 'reservations') {
    result = await paginate(m.StockReservation, [{ $match: { 'demandRef.documentId': { $in: ids }, 'demandRef.itemId': { $in: itemIds } } }, { $project: { reservedQty: 1, consumedQty: 1, releasedQty: 1, movedQty: 1, createdAt: 1 } }], query);
  } else if (query.section === 'evidence') {
    result = await paginate(m.Attachment, [{ $match: { ownerDocumentId: { $in: ids }, status: 'ATTACHED', accessCategory: 'BUSINESS' } }, { $project: { originalName: 1, mediaType: 1, uploadedAt: 1, ownerDocumentId: 1, createdAt: 1 } }], query);
  } else {
    result = await paginate(m.AuditLog, [{ $match: { subjectId: { $in: ids } } }, { $project: { action: 1, occurredAt: 1, createdAt: 1, reason: 1 } }], query);
  }
  return serialize({ ...result, lot });
}
