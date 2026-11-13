import { PurchaseOrder, PurchaseReceipt, GoodsArrival, GoodsInspection, AuditLog, ApprovalHistory, Warehouse, ReplenishmentRequest } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { requirePermission, requireWarehouseAccess } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { dto, serialize } from '../../shared/utils/persistence.js';
import { escapeRegex, calendarDateRange } from '../../shared/utils/domain.js';
import { same } from '../../shared/utils/document-command.js';
import { findPurchase } from '../po-receiving/purchase-core.js';
import { redactPrices } from '../sales-orders/sales-read.service.js';
export async function purchaseOrderQuantities(po,session){
  const receipts=await PurchaseReceipt.find({'header.purchaseOrderId':po._id,workflowStatus:{$in:['POSTED','DRAFT']}}).session(session).lean();
  return po.items.map(item=>{
    let received=exact('0'),draft=exact('0');
    for(const receipt of receipts)for(const row of receipt.items)if(same(row.purchaseOrderItemId,item._id)){if(receipt.workflowStatus==='POSTED')received=received.plus(String(row.qtyBase));else draft=draft.plus(String(row.qtyBase));}
    const cancelled=exact(item.cancelledRemainderQtyBase??'0'),outstanding=exact(item.qtyBase).minus(received).minus(cancelled);
    return {lineId:String(item._id),orderedQtyBase:String(item.qtyBase),receivedQtyBase:received.toFixed(),cancelledQtyBase:cancelled.toFixed(),
      outstandingQtyBase:outstanding.toFixed(),openDraftCommitmentQtyBase:draft.toFixed(),acceptanceHeadroomQtyBase:outstanding.minus(draft).toFixed(),quantityState:'KNOWN'};
  });
}
// PO status follows posted stock only; this flags drafts still being received.
export async function openReceivingWorkIds(orders){
  const poIds=orders.filter(o=>['OPEN','PARTIAL'].includes(o.workflowStatus)).map(o=>String(o._id??o.id));
  if(!poIds.length)return new Set();
  const [receipts,arrivals]=await Promise.all([
    PurchaseReceipt.find({'header.purchaseOrderId':{$in:poIds},workflowStatus:'DRAFT'}).select('header.purchaseOrderId').lean(),
    GoodsArrival.find({'header.purchaseOrderId':{$in:poIds}}).select('header.purchaseOrderId').lean()]);
  const owner=new Map(arrivals.map(a=>[String(a._id),String(a.header.purchaseOrderId)]));
  const drafts=owner.size?await GoodsInspection.find({'header.arrivalId':{$in:[...owner.keys()]},workflowStatus:'DRAFT'}).select('header.arrivalId').lean():[];
  return new Set([...receipts.map(r=>String(r.header.purchaseOrderId)),...drafts.map(d=>owner.get(String(d.header.arrivalId)))]);
}
const financial=user=>['OWNER','ACCOUNTANT'].includes(currentRole(user)?.code);
export async function getPurchaseOrder(user,id){
  requirePermission(user,'purchase_order:read');const po=await findPurchase(id,user,null,{kind:'PO',readOnly:true});
  const quantities=await purchaseOrderQuantities(po);
  const arrivals=await GoodsArrival.find({'header.purchaseOrderId':id}).lean();
  const receipts=await PurchaseReceipt.find({'header.purchaseOrderId':id}).lean();
  const history=await AuditLog.find({subjectType:'purchase_orders',subjectId:id}).sort({occurredAt:-1}).lean();
  const approvals=await ApprovalHistory.find({subjectType:'purchase_orders',subjectId:id}).lean();

  const warehouse = po.header?.warehouseId ? await Warehouse.findById(po.header.warehouseId).lean() : null;
  const mappedWarehouse = warehouse
    ? { id: String(warehouse._id), code: warehouse.code, name: warehouse.name }
    : null;

  let draftEdit = null;
  if (po.workflowStatus === 'DRAFT') {
    let approvalId = null;
    if (po.replenishmentRequestId) {
      const rr = await ReplenishmentRequest.findById(po.replenishmentRequestId).lean();
      if (rr?.header?.latestDecisionId) {
        approvalId = String(rr.header.latestDecisionId);
      } else {
        const appr = await ApprovalHistory.findOne({
          subjectType: 'replenishment_requests',
          subjectId: po.replenishmentRequestId,
          decision: 'APPROVE',
        }).lean();
        if (appr) approvalId = String(appr._id);
      }
    }
    draftEdit = {
      lines: (po.items || []).map((item) => ({
        id: String(item._id),
        rrLineId: item.requestItemId
          ? String(item.requestItemId)
          : item.sources?.[0]?.itemId
          ? String(item.sources[0].itemId)
          : String(item._id),
        approvalId,
        enteredQty: String(item.enteredQty ?? item.qtyBase ?? '0'),
        enteredUomCode: item.enteredUnit || item.baseUnitSnapshot || null,
        note: item.note ?? null,
      })),
    };
  }

  const result={...dto(po),warehouse:mappedWarehouse,draftEdit,hasOpenReceivingWork:(await openReceivingWorkIds([po])).has(String(po._id)),quantities,arrivals:arrivals.map(dto),receipts:receipts.map(dto),
    ...(financial(user)&&{history:history.map(dto),approvals:approvals.map(dto)})};
  return financial(user)?result:redactPrices(result);
}
function purchaseOrderScope(user, warehouseId) {
  if (warehouseId) {
    if (!financial(user)) requireWarehouseAccess(user, warehouseId);
    return { 'header.warehouseId': warehouseId };
  }
  return financial(user) ? {} : { 'header.warehouseId': { $in: user.warehouseIds || [] } };
}

export async function listPurchaseOrderSupplierOptions(user, { warehouseId }) {
  requirePermission(user, 'purchase_order:read');
  const orders = await PurchaseOrder.find(purchaseOrderScope(user, warehouseId))
    .select('header.supplierId header.supplierSnapshot.code header.supplierSnapshot.name')
    .sort({ createdAt: -1, _id: -1 }).lean();
  const suppliers = new Map();
  for (const { header } of orders) {
    const { supplierId, supplierSnapshot } = header ?? {};
    if (!supplierId || !supplierSnapshot?.code || !supplierSnapshot?.name) continue;
    const id = String(supplierId);
    if (!suppliers.has(id)) suppliers.set(id, { id, code: supplierSnapshot.code, name: supplierSnapshot.name });
  }
  return [...suppliers.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi') || a.id.localeCompare(b.id));
}

export async function listPurchaseOrders(user,query){
  requirePermission(user,'purchase_order:read');
  const filter = purchaseOrderScope(user, query.warehouseId);
  if(query.supplierId)filter['header.supplierId']=query.supplierId;if(query.status)filter.workflowStatus=query.status;
  if(query.search)filter.documentNo=new RegExp(escapeRegex(query.search),'i');
  const date=calendarDateRange(query.createdFrom,query.createdTo);if(date)filter.createdAt=date;
  const orders=await PurchaseOrder.find(filter).sort({createdAt:-1,_id:-1});
  const warehouseIds = [...new Set(orders.map((o) => String(o.header?.warehouseId)).filter(Boolean))];
  const warehouses = await Warehouse.find({ _id: { $in: warehouseIds } }).lean();
  const warehouseMap = new Map(
    warehouses.map((w) => [String(w._id), { id: String(w._id), code: w.code, name: w.name }]),
  );
  const items=[];
  for(const order of orders){
    const quantities=await purchaseOrderQuantities(order);
    const outstanding=quantities.some(row=>exact(row.outstandingQtyBase).gt(0));
    if(query.outstanding==='UNKNOWN'||(query.outstanding==='YES'&&!outstanding)||(query.outstanding==='NO'&&outstanding))continue;
    const value={...dto(order),warehouse:warehouseMap.get(String(order.header?.warehouseId))||null,quantities};items.push(financial(user)?value:redactPrices(value));
  }
  const pageItems=items.slice((query.page-1)*query.limit,query.page*query.limit);
  const working=await openReceivingWorkIds(pageItems);
  return {items:pageItems.map(row=>({...row,hasOpenReceivingWork:working.has(String(row.id))})),total:items.length,page:query.page,limit:query.limit};
}

