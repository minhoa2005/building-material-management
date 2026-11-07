import { GoodsArrival, GoodsInspection, PurchaseReceipt, CustodyReceipt, AuditLog, StockTransaction, User } from '../../models/runtime.js';
import { requirePermission, requireWarehouseAccess, isOwner, hasPermission, canAccessWarehouse } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { dto, serialize } from '../../shared/utils/persistence.js';
import { exact } from '../../models/model-utils.js';
import { same } from '../../shared/utils/document-command.js';
import { findPurchase, purchaseModels } from './purchase-core.js';
import { placementQuantities } from './purchase-putaway.service.js';
import { getPurchaseOrder } from '../purchase-orders/purchase-order.service.js';
import { redactPrices } from '../sales-orders/sales-read.service.js';
const financial=u=>['OWNER','ACCOUNTANT'].includes(currentRole(u)?.code);
function warehouseFilter(user,id){const all=isOwner(user)||currentRole(user)?.code==='ACCOUNTANT';if(id){if(!all)requireWarehouseAccess(user,id);return {'header.warehouseId':id};}return all?{}:{'header.warehouseId':{$in:user.warehouseIds||[]}};}
async function enriched(user,document){
  const value=dto(document),kind=document.documentKind;
  const writeWarehouse = canAccessWarehouse(user, document.header.warehouseId);
  const draft = document.workflowStatus === 'DRAFT';
  const posted = document.workflowStatus === 'POSTED';
  const canUpdate = writeWarehouse && hasPermission(user, 'goods_receipt_inspection:update');
  const canPost = writeWarehouse && hasPermission(user, 'goods_receipt_inspection:post');
  value.capabilities = {
    writeWarehouse,
    edit: draft && canUpdate,
    confirm: kind === 'INSPECTION' && draft && canUpdate,
    post: kind === 'GR_PURCHASE' && draft && canPost
      && (!document.custodyDecisionId || hasPermission(user, 'purchase_custody:execute')),
    cancel: draft && canUpdate,
    reversePreflight: kind === 'GR_PURCHASE' && posted && canPost && hasPermission(user, 'goods_receipt_inspection:reverse'),
    planPutaway: kind === 'GR_PURCHASE' && posted && writeWarehouse && hasPermission(user, 'putaway_task:create'),
  };
  if(kind==='INSPECTION'){
    value.arrival=dto(await GoodsArrival.findById(document.header.arrivalId));
    value.receipts=(await PurchaseReceipt.find({'items.inspectionId':document._id})).map(dto);
    value.custodyReceipts=(await CustodyReceipt.find({sources:{$elemMatch:{subjectCollection:'goods_inspections',documentId:document._id}}})).map(dto);
  }
  if(['GR_PURCHASE','CUSTODY_RECEIPT'].includes(kind)){
    for(const item of value.items){
      const ref=item.sources?.find(r=>r.subjectCollection==='goods_inspections');
      const inspection=await GoodsInspection.findOne({_id:item.inspectionId??ref?.documentId,'header.warehouseId':document.header.warehouseId});
      const source=inspection?.items.id(item.inspectionResultId??ref?.itemId);
      if(source)item.inspectionResult=dto(source.details);
    }
  }
  if(kind==='GR_PURCHASE'){value.reversed=!!await StockTransaction.exists({reversedTransactionId:document.stockTransactionId});if(document.workflowStatus==='POSTED')value.placements=await placementQuantities(document);}
  return financial(user)?value:redactPrices(value);
}
export async function getDocument(user,id,kind){requirePermission(user,'goods_receipt_inspection:read');return enriched(user,await findPurchase(id,user,null,{kind,readOnly:true}));}
export async function listDocuments(user,kind,query){
  requirePermission(user,'goods_receipt_inspection:read');const filter={...warehouseFilter(user,query.warehouseId),...(query.status&&{workflowStatus:query.status})};
  if(query.purchaseOrderId){if(kind==='INSPECTION'){const arrivals=await GoodsArrival.find({'header.purchaseOrderId':query.purchaseOrderId,...warehouseFilter(user,query.warehouseId)}).select('_id');filter['header.arrivalId']={$in:arrivals.map(a=>a._id)};}else filter['header.purchaseOrderId']=query.purchaseOrderId;}
  const Model=purchaseModels[kind];const [documents,total]=await Promise.all([Model.find(filter).sort({createdAt:-1,_id:-1}).skip((query.page-1)*query.limit).limit(query.limit),Model.countDocuments(filter)]);
  return {items:await Promise.all(documents.map(d=>enriched(user,d))),total,page:query.page,limit:query.limit};
}
export async function receivingSummary(user,id){
  const po=await getPurchaseOrder(user,id);const arrivals=await GoodsArrival.find({'header.purchaseOrderId':id}).select('_id');const inspections=await GoodsInspection.find({'header.arrivalId':{$in:arrivals.map(a=>a._id)}});const receipts=await PurchaseReceipt.find({'header.purchaseOrderId':id});
  const placements=(await Promise.all(receipts.filter(r=>r.workflowStatus==='POSTED').map(r=>placementQuantities(r)))).flat().filter(q=>exact(q.unplacedQtyBase).gt(0));
  return {purchaseOrder:{id:po.id,documentNo:po.documentNo,workflowStatus:po.workflowStatus,version:po.version},poVersion:po.version,computedAt:new Date().toISOString(),quantities:po.quantities.map(q=>({...q,snapshot:po.items.find(i=>same(i._id,q.lineId))})),schedules:po.items.flatMap(i=>(i.deliverySchedule||[]).map(s=>({...s,lineId:i._id}))),tripCount:arrivals.length,openWork:{draftInspections:inspections.filter(d=>d.workflowStatus==='DRAFT').length,draftReceipts:receipts.filter(d=>d.workflowStatus==='DRAFT').length,unplacedReceiptLines:placements.length,unplacedQtyBase:placements.reduce((n,q)=>n.plus(q.unplacedQtyBase),exact('0')).toFixed()}};
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

