import { SalesOrder, WarehouseIssueRequest, DeliveryOrder, SalesGoodsIssue, FailedDeliveryReceipt,
  StockReservation, StockTransaction, Attachment, ExternalReference, TransferOrder } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { requirePermission, requireWarehouseAccess } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { notFoundError, validationError } from '../../shared/utils/ApiError.js';
import { dto, transaction, page } from '../../shared/utils/persistence.js';
import { same } from '../../shared/utils/document-command.js';
import { escapeRegex } from '../../shared/utils/domain.js';
import { cloudinary } from '../../config/cloudinary.js';

export function redactPrices(value) {
  if(Array.isArray(value))return value.map(redactPrices);
  if(!value||typeof value!=='object')return value;
  const priceFields=new Set(['unitSellingPrice','unitPurchasePrice','lineAmount','orderAmount','totalAmount','salePriceSnapshot']);
  return Object.fromEntries(Object.entries(value).filter(([key])=>!priceFields.has(key)).map(([key,child])=>[key,redactPrices(child)]));
}
const hasNamedSalesScope = user => ['OWNER', 'ACCOUNTANT', 'SALES', 'ADMIN'].includes(currentRole(user)?.code);
const hasCustomSalesScope = user => !hasNamedSalesScope(user) && currentRole(user)?.code !== 'WAREHOUSE';
const assignedRequests = user => ({ 'header.requestedWarehouseId': { $in: user.warehouseIds || [] } });

function hideInternalReferences(value) {
  if (Array.isArray(value)) return value.map(hideInternalReferences);
  if (!value || typeof value !== 'object') return value;
  const privateFields = ['evidenceIds', 'externalReferenceIds', 'externalReferenceId', 'externalLineId', 'paymentConfirmations'];
  return Object.fromEntries(Object.entries(value).filter(([key]) => !privateFields.includes(key))
    .map(([key, child]) => [key, hideInternalReferences(child)]));
}

function scopedSalesDto(user, result) {
  if (hasNamedSalesScope(user)) return result;
  const redacted = redactPrices(result);
  return hasCustomSalesScope(user) ? hideInternalReferences(redacted) : redacted;
}

export async function orderSource(user,id,session,{ replay = false } = {}) {
  const order=await SalesOrder.findById(id).session(session);
  if(!order||(currentRole(user)?.code==='SALES'&&!same(order.createdBy,user._id)))throw notFoundError();
  // A custom-role creator can recover their own command receipt before a WIR exists.
  if (replay && hasCustomSalesScope(user)) {
    if (!same(order.createdBy, user._id)) throw notFoundError();
  } else if (!hasNamedSalesScope(user) &&
    !await WarehouseIssueRequest.exists({ 'header.salesOrderId': id, ...assignedRequests(user) }).session(session)) {
    throw notFoundError();
  }
  return order;
}
export async function effectiveQuantities(documents,session) {
  const roots=await StockTransaction.find({sourceId:{$in:documents.map(row=>row._id)},reversedTransactionId:{$exists:false}}).session(session).lean();
  const all=[...roots];let frontier=roots;
  while(frontier.length){
    const next=await StockTransaction.find({reversedTransactionId:{$in:frontier.map(row=>row._id)}}).session(session).lean();
    const seen=new Set(all.map(row=>String(row._id)));
    if(next.some(row=>seen.has(String(row._id))))throw validationError('Lịch sử đảo giao dịch có vòng lặp');
    all.push(...next);frontier=next;
  }
  const active=row=>{const child=all.find(candidate=>same(candidate.reversedTransactionId,row._id));return child?1-active(child):1;};
  const result=new Map();
  for(const root of roots)if(active(root))for(const movement of root.movements){const key=String(movement.sourceLineId);result.set(key,(result.get(key)??exact('0')).plus(String(movement.quantityBase)));}
  return result;
}
async function outbound(user,id,session){
  const document=await DeliveryOrder.findById(id).session(session);if(!document)throw notFoundError();
  if(!hasNamedSalesScope(user))requireWarehouseAccess(user,document.header.warehouseId);
  const request=await WarehouseIssueRequest.findOne({
    _id: document.header.issueRequestId,
    ...(hasCustomSalesScope(user) && assignedRequests(user)),
  }).session(session);
  if(!request)throw notFoundError();const order=await orderSource(user,request.header.salesOrderId,session);
  const ids=document.items.map(item=>item._id);
  const issues=await SalesGoodsIssue.find({'items.details.outboundDeliveryLineId':{$in:ids},'header.warehouseId':document.header.warehouseId}).session(session);
  const issueIds=issues.flatMap(row=>row.items.map(item=>item._id));
  const returns=await FailedDeliveryReceipt.find({'items.details.salesIssueLineId':{$in:issueIds},workflowStatus:'POSTED','header.warehouseId':document.header.warehouseId}).session(session);
  const issued=await effectiveQuantities(issues.filter(row=>row.workflowStatus==='POSTED'),session);
  const returned=await effectiveQuantities(returns,session);
  const confirmations=(order.deliveryConfirmations||[]).filter(row=>row.workflowStatus==='CONFIRMED');
  const items=document.items.map(item=>{
    const parent=request.items.id(item.details.issueRequestLineId);
    if(!parent||!order.items.id(parent.details.salesOrderLineId)||!same(item.productId,parent.productId))throw validationError('Dòng giao không khớp chuỗi nguồn');
    const issueItems=issues.flatMap(row=>row.items).filter(row=>same(row.details.outboundDeliveryLineId,item._id));
    const issueSet=new Set(issueItems.map(row=>String(row._id)));
    const gross=issueItems.reduce((sum,row)=>sum.plus(issued.get(String(row._id))??'0'),exact('0'));
    const back=returns.flatMap(row=>row.items).filter(row=>issueSet.has(String(row.details.salesIssueLineId))).reduce((sum,row)=>sum.plus(returned.get(String(row._id))??'0'),exact('0'));
    const accepted=confirmations.flatMap(row=>row.items).filter(row=>issueSet.has(String(row.details.salesIssueLineId))).reduce((sum,row)=>sum.plus(String(row.qtyBase)),exact('0'));
    return {...dto(item),grossIssuedQtyBase:gross.toFixed(),returnedFailedDeliveryQtyBase:back.toFixed(),netIssuedQtyBase:gross.minus(back).toFixed(),deliveredQtyBase:accepted.toFixed()};
  });
  const reservations=await StockReservation.find({'executionRef.itemId':{$in:[...ids,...issueIds]}}).session(session).lean();
  const fifo=await StockTransaction.aggregate([{ $unwind: '$movements' },{$match:{'movements.toBalanceId':{$in:reservations.map(r=>r.balanceId)}}},{$group:{_id:'$movements.toBalanceId',firstReceivedAt:{$min:'$occurredAt'}}}]).session(session);
  reservations.sort((a,b)=>(+(fifo.find(r=>same(r._id,a.balanceId))?.firstReceivedAt || 8640000000000000))-(+(fifo.find(r=>same(r._id,b.balanceId))?.firstReceivedAt || 8640000000000000)));
  const tasks=await TransferOrder.find({'items.sources.itemId':{$in:[...ids,...issueIds]},'header.warehouseId':document.header.warehouseId}).session(session).lean();
  const result={...dto(document),items,salesOrder:{id:String(order._id),documentNo:order.documentNo},issueRequest:{id:String(request._id),documentNo:request.documentNo},
    deliveryConfirmations: confirmations.map(c=>({...dto(c),items:c.items.filter(i=>issueIds.some(id=>same(id,i.details.salesIssueLineId))).map(dto)})).filter(c=>c.items.length),goodsIssues:issues.map(dto),failedDeliveryReceipts:returns.map(dto),reservations:reservations.map(r=>({...dto(r),firstReceivedAt:fifo.find(f=>same(f._id,r.balanceId))?.firstReceivedAt?.toISOString() || null})),tasks:tasks.map(dto)};
  return scopedSalesDto(user, result);
}
export async function getOutboundDelivery(user,id){requirePermission(user,'outbound_delivery:read');return transaction(session=>outbound(user,id,session));}
export async function listOutboundDeliveries(user,query){
  requirePermission(user,'outbound_delivery:read');
  const orders=await SalesOrder.find({...((currentRole(user)?.code==='SALES')&&{createdBy:user._id}),...(query.salesOrderId&&{_id:query.salesOrderId})}).distinct('_id');
  const requests=await WarehouseIssueRequest.find({'header.salesOrderId':{$in:orders},
    ...(query.issueRequestId&&{_id:query.issueRequestId}), ...(hasCustomSalesScope(user) && assignedRequests(user))}).distinct('_id');
  const filter={'header.issueRequestId':{$in:requests}};
  if(!hasNamedSalesScope(user))filter['header.warehouseId']={$in:user.warehouseIds||[]};
  if(query.warehouseId){if(!hasNamedSalesScope(user))requireWarehouseAccess(user,query.warehouseId);filter['header.warehouseId']=query.warehouseId;}
  if(query.status)filter.workflowStatus=query.status;if(query.q)filter.documentNo=new RegExp(escapeRegex(query.q),'i');
  if(query.from||query.to)filter.createdAt={...(query.from&&{$gte:new Date(query.from)}),...(query.to&&{$lte:new Date(query.to)})};
  return scopedSalesDto(user, await page(DeliveryOrder,filter,query));
}
export async function getSalesOrder(user,id){
  requirePermission(user,'sales_order:read');
  return transaction(async session=>{
    const order=await orderSource(user,id,session);
    const scoped = !hasNamedSalesScope(user);
    const requests=await WarehouseIssueRequest.find({'header.salesOrderId':id,...(scoped && assignedRequests(user))}).session(session).lean();
    const deliveries=await DeliveryOrder.find({'header.issueRequestId':{$in:requests.map(row=>row._id)},...(scoped&&{'header.warehouseId':{$in:user.warehouseIds||[]}})}).session(session).lean();
    const deliveryIds=deliveries.map(d=>d._id);
    const issues=await SalesGoodsIssue.find({'header.deliveryOrderId':{$in:deliveryIds}}).session(session);
    const issueIds=issues.flatMap(d=>d.items.map(i=>i._id));
    const returns=await FailedDeliveryReceipt.find({'items.details.salesIssueLineId':{$in:issueIds}}).session(session);
    const tasks=await TransferOrder.find({'sources.subjectCollection':'sales_goods_issues','sources.documentId':{$in:issues.map(i=>i._id)}}).session(session);
    const confirmations=(order.deliveryConfirmations||[]).map(c=>({...dto(c),items:c.items.filter(i=>issueIds.some(id=>same(id,i.details.salesIssueLineId))).map(dto)})).filter(c=>c.items.length);
    const result={...dto(order),issueRequests:requests.map(dto),outboundDeliveries:deliveries.map(dto),goodsIssues:issues.map(dto),failedDeliveryReceipts:returns.map(dto),tasks:tasks.map(dto),deliveryConfirmations:confirmations};
    if(scoped){
      const allowed=new Set(requests.flatMap(row=>row.items.map(item=>String(item.details.salesOrderLineId))));
      result.items=result.items.filter(item=>allowed.has(String(item._id)));
      delete result.paymentConfirmations;delete result.evidenceIds;delete result.externalReferenceIds;
      return scopedSalesDto(user, result);
    }
    const source=await ExternalReference.findById(order.header.externalReferenceId).session(session).lean();
    const evidence=await Attachment.find({ownerDocumentType:'sales_orders',ownerDocumentId:id,status:'ATTACHED'}).select('_id mediaType originalName uploadedAt').session(session).lean();
    const receipts=await FailedDeliveryReceipt.find({workflowStatus:'POSTED','demandReopenings.salesOrderLineId':{$in:order.items.map(i=>i._id)}}).session(session);
    const reopenedSources=receipts.flatMap(receipt=>(receipt.demandReopenings||[]).filter(r=>order.items.id(r.salesOrderLineId)).map(row=>{
      const cancelled=(order.cancellations||[]).filter(c=>same(c.reopeningReceiptLineId,row.receiptLineId)).reduce((n,c)=>n.plus(String(c.cancelledQtyBase)),exact('0'));
      const reused=(receipt.commitmentTransfers||[]).filter(c=>same(c.reopeningReceiptLineId,row.receiptLineId)).reduce((n,c)=>n.plus(String(c.quantityBase)),exact('0'));
      return {...dto(row),receiptDocumentNo:receipt.documentNo,availableQtyBase:exact(row.reopenedQtyBase).minus(cancelled).minus(reused).toFixed()};
    }));
    return {...result,source:source?dto(source):null,evidence:evidence.map(dto),reopenedSources};
  });
}
export async function getSalesEvidence(user,id,evidenceId){
  requirePermission(user,'sales_order:read');if(!hasNamedSalesScope(user))throw notFoundError();
  await orderSource(user,id);
  const evidence=await Attachment.findOne({_id:evidenceId,ownerDocumentType:'sales_orders',ownerDocumentId:id,status:'ATTACHED'});
  if(!evidence||!evidence.storageKey.startsWith('sep490/sales-source/'))throw notFoundError();
  const expiresAt=Math.floor(Date.now()/1000)+60;
  return {url:cloudinary.utils.private_download_url(evidence.storageKey,evidence.mediaType.split('/')[1],{resource_type:'image',type:'authenticated',expires_at:expiresAt}),expiresAt:new Date(expiresAt*1000).toISOString()};
}
