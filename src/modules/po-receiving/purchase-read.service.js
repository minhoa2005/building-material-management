import { GoodsArrival, GoodsInspection, PurchaseReceipt, CustodyReceipt, AuditLog, StockTransaction, Supplier, User, Warehouse, PurchaseOrder, TransferOrder, InventoryBalance, StockHoldingPoint, WarehouseLocation } from '../../models/runtime.js';
import { requirePermission, hasPermission, canAccessWarehouse } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { dto, serialize } from '../../shared/utils/persistence.js';
import { exact } from '../../models/model-utils.js';
import { same } from '../../shared/utils/document-command.js';
import { findPurchase, purchaseModels } from './purchase-core.js';
import { placementQuantities, purchaseWarehouseFilter as warehouseFilter } from './purchase-putaway.service.js';
import { getPurchaseOrder } from '../purchase-orders/purchase-order.service.js';
import { redactPrices } from '../sales-orders/sales-read.service.js';
const financial=u=>['OWNER','ACCOUNTANT'].includes(currentRole(u)?.code);
const fromInspections = ids => ({ sources: { $elemMatch: {
  subjectCollection: 'goods_inspections', documentId: { $in: ids },
} } });

async function custodyMetadata(document, value) {
  const { warehouseId, ownerType, ownerId } = document.header;
  const ref = document.sources?.find(ref => ref.subjectCollection === 'goods_inspections');
  const [inspection, supplier, warehouse, posting] = await Promise.all([
    ref && GoodsInspection.findOne({ _id: ref.documentId, 'header.warehouseId': warehouseId }).select('documentNo header.arrivalId'),
    ownerType === 'SUPPLIER' && Supplier.findById(ownerId).select('name').lean(),
    Warehouse.findById(warehouseId).select('name').lean(),
    document.stockTransactionId && StockTransaction.findById(document.stockTransactionId).select('movements').lean(),
  ]);
  const arrival = inspection?.header.arrivalId && await GoodsArrival.findOne({
    _id: inspection.header.arrivalId, 'header.warehouseId': warehouseId,
  }).select('header.purchaseOrderId').lean();
  const purchaseOrderId = arrival?.header.purchaseOrderId;
  const po = purchaseOrderId && await PurchaseOrder.findById(purchaseOrderId).select('documentNo').lean();
  Object.assign(value.header, serialize({
    purchaseOrderId, purchaseOrderNo: po?.documentNo, supplierName: supplier?.name, warehouseName: warehouse?.name,
  }));
  if (inspection) value.sourceInspection = { id: String(inspection._id), documentNo: inspection.documentNo };
  if (!posting) return;
  const balances = await InventoryBalance.find({ _id: { $in: posting.movements.map(row => row.toBalanceId).filter(Boolean) } }).select('holdingPointId').lean();
  const points = await StockHoldingPoint.find({ _id: { $in: balances.map(row => row.holdingPointId) } }).select('locationId').lean();
  const locationByLine = new Map(posting.movements.map(row => {
    const balance = balances.find(balance => same(balance._id, row.toBalanceId));
    return [String(row.sourceLineId), points.find(point => same(point._id, balance?.holdingPointId))?.locationId];
  }));
  const locations = await WarehouseLocation.find({ _id: { $in: [...locationByLine.values()].filter(Boolean) }, warehouseId }).select('code').lean();
  for (const item of value.items) {
    const location = locationByLine.get(item._id);
    if (!location) continue;
    item.holdingLocationId = String(location);
    item.holdingLocationCode = locations.find(row => same(row._id, location))?.code;
  }
}
async function enriched(user,document){
  const value=dto(document),kind=document.documentKind;
  let warehouseId = document.header?.warehouseId;
  if(kind==='INSPECTION'){
    const arrivalId = document.header?.arrivalId ?? document.sources?.find(s => s.subjectCollection === 'goods_arrivals')?.documentId;
    const arrival = arrivalId ? await GoodsArrival.findById(arrivalId) : null;
    if (arrival) {
      const poId = arrival.header?.purchaseOrderId ?? arrival.sources?.find(s => s.subjectCollection === 'purchase_orders')?.documentId;
      if (poId && !arrival.header?.purchaseOrderId) {
        arrival.header.purchaseOrderId = poId;
      }
    }
    value.arrival = arrival ? dto(arrival) : null;
    value.header = value.header || {};
    if (value.arrival) {
      if (!value.header.arrivalId) value.header.arrivalId = String(value.arrival._id ?? value.arrival.id);
      if (!value.header.warehouseId && value.arrival.header?.warehouseId) {
        value.header.warehouseId = String(value.arrival.header.warehouseId);
      }
      if (!value.header.purchaseOrderId && value.arrival.header?.purchaseOrderId) {
        value.header.purchaseOrderId = String(value.arrival.header.purchaseOrderId);
      }
    }
    warehouseId = warehouseId ?? value.arrival?.header?.warehouseId;
    value.receipts=(await PurchaseReceipt.find({'items.inspectionId':document._id})).map(dto).filter(Boolean);
    value.custodyReceipts=(await CustodyReceipt.find({sources:{$elemMatch:{subjectCollection:'goods_inspections',documentId:document._id}}})).map(dto).filter(Boolean);
  }
  const writeWarehouse = canAccessWarehouse(user, warehouseId);
  const draft = document.workflowStatus === 'DRAFT';
  const posted = document.workflowStatus === 'POSTED';
  const canUpdate = writeWarehouse && hasPermission(user, 'goods_receipt_inspection:update');
  const canPost = writeWarehouse && hasPermission(user, 'goods_receipt_inspection:post');
  value.capabilities = {
    writeWarehouse,
    edit: draft && canUpdate,
    confirm: kind === 'INSPECTION' && draft && canUpdate,
    post: draft && canPost && (kind === 'PURCHASE'
      ? (!document.custodyDecisionId || hasPermission(user, 'purchase_custody:execute'))
      : kind === 'CUSTODY_RECEIPT' && document.header?.ownerType === 'SUPPLIER'),
    cancel: draft && canUpdate,
    reversePreflight: kind === 'PURCHASE' && posted && canPost && hasPermission(user, 'goods_receipt_inspection:reverse'),
    planPutaway: kind === 'PURCHASE' && posted && writeWarehouse && hasPermission(user, 'putaway_task:create'),
  };
  if(['PURCHASE','CUSTODY_RECEIPT'].includes(kind)){
    for(const item of value.items){
      const ref=item.sources?.find(r=>r.subjectCollection==='goods_inspections');
      const inspection=await GoodsInspection.findOne({_id:item.inspectionId??ref?.documentId,'header.warehouseId':document.header?.warehouseId});
      const source=inspection?.items.id(item.inspectionResultId??ref?.itemId);
      if(source)item.inspectionResult={...serialize(source.details),handlingNote:source.note};
    }
  }
  if (kind === 'CUSTODY_RECEIPT') await custodyMetadata(document, value);
  if(kind==='PURCHASE'){value.header.postedAt=value.postedAt;value.reversed=!!document.stockTransactionId&&!!await StockTransaction.exists({reversedTransactionId:document.stockTransactionId});if(document.workflowStatus==='POSTED')value.placements=await placementQuantities(document);}
  return financial(user)?value:redactPrices(value);
}
export async function getDocument(user, id, kind) {
  requirePermission(user, 'goods_receipt_inspection:read');
  const document = await findPurchase(id, user, null, { kind, readOnly: true });
  if (document.documentKind !== 'PURCHASE') return enriched(user, document);

  const { supplierId, warehouseId, arrivalId, purchaseOrderId } = document.header;
  const [value, supplier, warehouse, poster, arrival] = await Promise.all([
    enriched(user, document),
    supplierId && Supplier.findById(supplierId).select('name').lean(),
    warehouseId && Warehouse.findById(warehouseId).select('name').lean(),
    document.postedBy && User.findById(document.postedBy).select('fullName').lean(),
    arrivalId && GoodsArrival.findOne({
      _id: arrivalId,
      'header.warehouseId': warehouseId,
      ...(purchaseOrderId && { 'header.purchaseOrderId': purchaseOrderId }),
    }).select('header.arrivedAt header.deliveredBy header.deliveryReference items._id items.lotId items.lotLabelSnapshot').lean(),
  ]);

  value.header.supplierName = supplier?.name;
  value.header.warehouseName = warehouse?.name;
  value.header.postedAt = value.postedAt;
  value.header.postedBy = value.postedBy;
  value.header.postedByName = poster?.fullName;
  if (arrival) {
    value.arrival = { header: serialize(arrival.header) };
    const arrivalItems = new Map((arrival.items ?? []).map(item => [String(item._id), item]));
    for (const item of value.items) {
      const source = arrivalItems.get(item.arrivalItemId);
      if (!item.lotLabelSnapshot && source?.lotLabelSnapshot && same(source.lotId, item.lotId)) {
        item.lotLabelSnapshot = source.lotLabelSnapshot;
      }
    }
  }
  return value;
}
export async function listDocuments(user,kind,query){
  requirePermission(user,'goods_receipt_inspection:read');const filter={...warehouseFilter(user,query.warehouseId),...(query.status&&{workflowStatus:query.status})};
  if (kind === 'CUSTODY_RECEIPT') filter['header.ownerType'] = 'SUPPLIER';
  if (query.purchaseOrderId) {
    if (['INSPECTION', 'CUSTODY_RECEIPT'].includes(kind)) {
      const scope = warehouseFilter(user, query.warehouseId);
      const arrivals = await GoodsArrival.find({
        ...scope,
        $or: [
          { 'header.purchaseOrderId': query.purchaseOrderId },
          { sources: { $elemMatch: { subjectCollection: 'purchase_orders', documentId: query.purchaseOrderId } } },
        ],
      }).distinct('_id');
      const byArrival = {
        $or: [
          { 'header.arrivalId': { $in: arrivals } },
          { sources: { $elemMatch: { subjectCollection: 'goods_arrivals', documentId: { $in: arrivals } } } },
        ],
      };
      if (kind === 'INSPECTION') Object.assign(filter, byArrival);
      else Object.assign(filter, fromInspections(await GoodsInspection.find({ ...scope, ...byArrival }).distinct('_id')));
    } else filter['header.purchaseOrderId'] = query.purchaseOrderId;
  }
  const Model=purchaseModels[kind];const [documents,total]=await Promise.all([Model.find(filter).sort({createdAt:-1,_id:-1}).skip((query.page-1)*query.limit).limit(query.limit),Model.countDocuments(filter)]);
  return {items:await Promise.all(documents.map(d=>enriched(user,d))),total,page:query.page,limit:query.limit};
}
function receivingDocument(kind, document, poLineId) {
  return serialize({
    kind,
    id: document._id,
    documentNo: document.documentNo,
    workflowStatus: document.workflowStatus,
    occurredAt: document.occurredAt,
    createdAt: document.createdAt,
    lines: document.items.map(item => ({ poLineId: poLineId(item) ?? null, qtyBase: item.qtyBase })),
  });
}
export async function receivingSummary(user, id) {
  const po = await getPurchaseOrder(user, id);
  const arrivals = await GoodsArrival.find({ 'header.purchaseOrderId': id }).select('items._id items.purchaseOrderItemId');
  const [inspections, receipts] = await Promise.all([
    GoodsInspection.find({ 'header.arrivalId': { $in: arrivals.map(a => a._id) } }),
    PurchaseReceipt.find({ 'header.purchaseOrderId': id }),
  ]);
  const arrivalsById = new Map(arrivals.map(arrival => [String(arrival._id), arrival]));
  const [custody, tasks] = await Promise.all([
    CustodyReceipt.find({ ...fromInspections(inspections.map(d => d._id)), 'header.ownerType': 'SUPPLIER' }),
    TransferOrder.find({ 'header.taskKind': 'PUTAWAY', sources: { $elemMatch: {
      subjectCollection: 'goods_receipts', documentId: { $in: receipts.map(d => d._id) },
    } } }),
  ]);
  const poLineByInspection = new Map(inspections.flatMap(inspection => inspection.items.map(item => [
    String(item._id), arrivalsById.get(String(inspection.header.arrivalId))?.items.id(item.details?.inspectedSourceLineId)?.purchaseOrderItemId,
  ])));
  const poLineByReceipt = new Map(receipts.flatMap(receipt => receipt.items.map(item => [String(item._id), item.purchaseOrderItemId])));
  const documents = [
    ...inspections.map(inspection => {
      const arrival = arrivalsById.get(String(inspection.header.arrivalId));
      return receivingDocument('INSPECTION', inspection, item =>
        arrival?.items.id(item.details?.inspectedSourceLineId)?.purchaseOrderItemId);
    }),
    ...receipts.map(receipt => receivingDocument('GR_PURCHASE', receipt, item => item.purchaseOrderItemId)),
    ...custody.map(document => receivingDocument('CUSTODY_RECEIPT', document, item =>
      poLineByInspection.get(String(item.sources?.find(ref => ref.subjectCollection === 'goods_inspections')?.itemId)))),
    ...tasks.map(document => receivingDocument('PUTAWAY', document, item =>
      poLineByReceipt.get(String(item.sources?.find(ref => ref.subjectCollection === 'goods_receipts')?.itemId)))),
  ].sort((a, b) => (b.occurredAt ?? b.createdAt ?? '').localeCompare(a.occurredAt ?? a.createdAt ?? '')
    || b.id.localeCompare(a.id));
  const placements = (await Promise.all(receipts.filter(r => r.workflowStatus === 'POSTED').map(r => placementQuantities(r))))
    .flat().filter(q => exact(q.unplacedQtyBase).gt(0));
  const summary = {
    purchaseOrder: { id: po.id, documentNo: po.documentNo, workflowStatus: po.workflowStatus, version: po.version },
    poVersion: po.version,
    computedAt: new Date().toISOString(),
    quantities: po.quantities.map(q => ({ ...q, snapshot: po.items.find(i => same(i._id, q.lineId)) })),
    documents,
    tripCount: arrivals.length,
    openWork: {
      draftInspections: inspections.filter(d => d.workflowStatus === 'DRAFT').length,
      draftReceipts: receipts.filter(d => d.workflowStatus === 'DRAFT').length,
      unplacedReceiptLines: placements.length,
      unplacedQtyBase: placements.reduce((n, q) => n.plus(q.unplacedQtyBase), exact('0')).toFixed(),
    },
  };
  return financial(user) ? summary : redactPrices(summary);
}
export async function receivingTrips(user,id,query){await findPurchase(id,user,null,{kind:'PO',readOnly:true});return listDocuments(user,'INSPECTION',{...query,purchaseOrderId:id});}
export async function receivingQueue(user,query){
  const kind=query.stage==='DRAFT_INSPECTION'||query.stage==='CORRECTION'?'INSPECTION':'GR_PURCHASE';const status=query.stage==='AWAITING_PUTAWAY'?'POSTED':'DRAFT';
  // Filter computed remaining quantities before paging so page totals stay correct.
  const all=await listDocuments(user,kind,{...query,status,page:1,limit:Number.MAX_SAFE_INTEGER});
  const rows=all.items.filter(d=>query.stage==='AWAITING_PUTAWAY'?d.placements?.some(q=>exact(q.unplacedQtyBase).gt(0)):query.stage==='CORRECTION'?!!d.header.previousInspectionId:true);
  return {items:rows.slice((query.page-1)*query.limit,query.page*query.limit),total:rows.length,page:query.page,limit:query.limit,stage:query.stage};
}
export async function receivingHistory(user,id,query){
  requirePermission(user,'goods_receipt_inspection:read');const d=await findPurchase(id,user,null,{readOnly:true});const filter={subjectId:d._id,subjectType:d.constructor.collection.name};
  const [events,total]=await Promise.all([AuditLog.find(filter).sort({occurredAt:-1,_id:-1}).skip((query.page-1)*query.limit).limit(query.limit).lean(),AuditLog.countDocuments(filter)]);const actors=await User.find({_id:{$in:events.map(e=>e.actorId)}}).select('_id fullName').lean();
  const items=events.map(e=>({...dto(e),actorName:actors.find(u=>same(u._id,e.actorId))?.fullName??null}));return {items:financial(user)?items:redactPrices(items),total,page:query.page,limit:query.limit};
}

