import { PurchaseOrder, PurchaseReceipt, GoodsArrival, GoodsInspection, AuditLog, ApprovalHistory } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { requirePermission, requireWarehouseAccess, isOwner } from '../../shared/utils/access.js';
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
const financial=user=>['OWNER','ACCOUNTANT'].includes(currentRole(user)?.code);
export async function getPurchaseOrder(user,id){
  requirePermission(user,'purchase_order:read');const po=await findPurchase(id,user,null,{kind:'PO',readOnly:true});
  const quantities=await purchaseOrderQuantities(po);
  const arrivals=await GoodsArrival.find({'header.purchaseOrderId':id}).lean();
  const receipts=await PurchaseReceipt.find({'header.purchaseOrderId':id}).lean();
  const history=await AuditLog.find({subjectType:'purchase_orders',subjectId:id}).sort({occurredAt:-1}).lean();
  const approvals=await ApprovalHistory.find({subjectType:'purchase_orders',subjectId:id}).lean();
  const result={...dto(po),quantities,arrivals:arrivals.map(dto),receipts:receipts.map(dto),
    ...(financial(user)&&{history:history.map(dto),approvals:approvals.map(dto)})};
  return financial(user)?result:redactPrices(result);
}
export async function listPurchaseOrders(user,query){
  requirePermission(user,'purchase_order:read');
  const filter={};
  if(!isOwner(user)&&currentRole(user)?.code!=='ACCOUNTANT')filter['header.warehouseId']={$in:user.warehouseIds||[]};
  if(query.warehouseId){if(!financial(user))requireWarehouseAccess(user,query.warehouseId);filter['header.warehouseId']=query.warehouseId;}
  if(query.supplierId)filter['header.supplierId']=query.supplierId;if(query.status)filter.workflowStatus=query.status;
  if(query.search)filter.documentNo=new RegExp(escapeRegex(query.search),'i');
  const date=calendarDateRange(query.createdFrom,query.createdTo);if(date)filter.createdAt=date;
  const orders=await PurchaseOrder.find(filter).sort({createdAt:-1,_id:-1});
  const items=[];
  for(const order of orders){
    const quantities=await purchaseOrderQuantities(order);
    const outstanding=quantities.some(row=>exact(row.outstandingQtyBase).gt(0));
    if(query.outstanding==='UNKNOWN'||(query.outstanding==='YES'&&!outstanding)||(query.outstanding==='NO'&&outstanding))continue;
    const value={...dto(order),quantities};items.push(financial(user)?value:redactPrices(value));
  }
  return {items:items.slice((query.page-1)*query.limit,query.page*query.limit),total:items.length,page:query.page,limit:query.limit};
}

