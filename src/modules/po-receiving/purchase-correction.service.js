import { StockReversal, StockTransaction, InventoryBalance, StockReservation, TransferOrder, GoodsInspection, GoodsArrival, PurchaseReceipt, PurchaseOrder, StocktakeCount, models } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { requirePermission, requireWarehouseAccess } from '../../shared/utils/access.js';
import { validationError, notFoundError, versionConflict } from '../../shared/utils/ApiError.js';
import { command, checkVersion, saveVersion, same, newId } from '../../shared/utils/document-command.js';
import { dto } from '../../shared/utils/persistence.js';
import { copyItem, sourceLink } from '../../shared/utils/document-copy.js';
import { guardLocations, sourceContext, splitPortions, beginStock, remainingReservation, verifyCapacity } from '../../shared/utils/stock.js';
import { purchaseOrderQuantities } from '../purchase-orders/purchase-order.service.js';
import { findPurchase, newDocument, evidenceFor, replayPurchase } from './purchase-core.js';
import { transferCustodyStock } from './purchase-custody.service.js';
import { balanceAt } from '../../shared/utils/stock.js';
import { prepare, activePo, inspectionSource } from './po-receiving.service.js';

export async function eligible(gr,user,session){
  if(gr.workflowStatus!=='POSTED')throw validationError('Phiếu chưa ghi hoặc đã đảo');
  const original=await StockTransaction.findById(gr.stockTransactionId).session(session);
  if(!original||original.reversedTransactionId||await StockTransaction.exists({reversedTransactionId:original._id}).session(session))throw validationError('Giao dịch gốc không đủ điều kiện đảo');
  const locations=[];
  for(const move of original.movements){
    if((move.fromBalanceId&&!gr.items.id(move.sourceLineId)?.custodyBalanceId)||!move.toBalanceId)throw validationError('Giao dịch không phải nhập mua thuần');
    const ctx=await sourceContext(move.toBalanceId,session);if(!ctx.location||!same(ctx.location.warehouseId,gr.header.warehouseId))throw validationError('Sai phạm vi nguồn nhập');locations.push(ctx.location._id);
    const later=await StockTransaction.findOne({_id:{$ne:original._id},$or:[{'movements.fromBalanceId':move.toBalanceId},{'movements.toBalanceId':move.toBalanceId}],recordedAt:{$gte:original.recordedAt}}).session(session);
    if(later)throw validationError('Đã có giao dịch phụ thuộc: '+later._id);
    const reservations=await StockReservation.find({balanceId:move.toBalanceId}).session(session);if(reservations.some(r=>remainingReservation(r).gt(0)))throw validationError('Hàng đã được giữ');
    if(await TransferOrder.exists({$or:[{workflowStatus:{$in:['DRAFT','OPEN','PARTIAL']}},{workflowStatus:'CONFIRMED',updatedAt:{$gte:original.recordedAt}}],'items.details.sourceBalanceId':move.toBalanceId}).session(session))throw validationError('Đã lập lệnh sử dụng nguồn tồn');
    if(await StocktakeCount.exists({locationId:ctx.location._id,recordedAt:{$gte:original.recordedAt}}).session(session))throw validationError('Nguồn đã được kiểm kê sau nhập');
    if(!exact(ctx.balance.quantityBase).eq(String(move.toAfter)))throw validationError('Tồn không còn đúng trạng thái sau nhập');
  }
  // Any document using a receipt row prevents reversing the source behind it.
  for(const [collection,Model] of models){if(!Model.schema.path('items')||collection==='stock_reversals')continue;
    if(await Model.exists({workflowStatus:{$nin:['CANCELLED','REJECTED']},$or:[{'sources.documentId':gr._id},{'items.sources.documentId':gr._id}]}).session(session))throw validationError('Có chứng từ phụ thuộc trong '+collection);
  }
  return {original,locations};
}
export async function reversalPreflight(user,id){
  requirePermission(user,'goods_receipt_inspection:reverse');requirePermission(user,'goods_receipt_inspection:post');
  const gr=await findPurchase(id,user,null,{kind:'GR_PURCHASE'});try{await eligible(gr,user);return {eligible:true,receiptVersion:gr.version};}catch(error){if(error.statusCode>=500)throw error;return {eligible:false,reason:error.message,receiptVersion:gr.version};}
}
async function replayReversal(id,user,session){const d=await StockReversal.findById(id).session(session);if(!d)throw notFoundError();for(const wh of d.header.warehouseIds)requireWarehouseAccess(user,wh);return d;}
export async function getReversal(user,id){requirePermission(user,'goods_receipt_inspection:read');return dto(await replayReversal(id,user));}
export function reverseReceipt(user,id,input){return command(user,'REVERSE_PURCHASE_RECEIPT','goods_receipt_inspection:reverse',id,input,replayReversal,async(session,actor)=>{
 requirePermission(actor,'goods_receipt_inspection:post');requireWarehouseAccess(actor,(await findPurchase(id,actor,session,{kind:'GR_PURCHASE'})).header.warehouseId);
 const source=await findPurchase(id,actor,session,{kind:'GR_PURCHASE'});checkVersion(source,input.expectedVersion);await evidenceFor(actor,source,input.evidenceIds,session,true);
 const originalSource=await eligible(source,actor,session);
 const d=newDocument(StockReversal,'REV',actor,{originalTransactionId:originalSource.original._id,sourceDocument:{documentType:'goods_receipts',documentId:source._id,revision:source.version},sourceVersion:source.version,warehouseIds:[source.header.warehouseId],requestedBy:actor._id,requestedAt:new Date(),reason:input.reason},originalSource.original.movements.map((m,i)=>copyItem(source.items.id(m.sourceLineId),m.quantityBase,{lineNo:i+1,sources:[{subjectCollection:'stock_transactions',documentId:originalSource.original._id,itemId:m._id,linkedQty:String(m.quantityBase),relationCode:'REVERSES'}]})));
 d.evidenceIds=input.evidenceIds;
  const gr=await findPurchase(d.header.sourceDocument.documentId,actor,session,{kind:'GR_PURCHASE'});checkVersion(gr,d.header.sourceVersion);const {original,locations}=await eligible(gr,actor,session);await guardLocations(locations,session);
  const po=await findPurchase(gr.header.purchaseOrderId,actor,session,{kind:'PO'});checkVersion(po,input.expectedPoVersion);

  const posting=beginStock(d,actor,'REVERSAL',input);posting.reversedTransactionId=original._id;
  for(const move of [...original.movements].reverse()){
 const item=gr.items.id(move.sourceLineId);const reversalItem=d.items.find(i=>i.sources.some(s=>same(s.itemId,move._id)));
 let target=null;if(item.custodyBalanceId){const ctx=await sourceContext(item.custodyBalanceId,session);if(ctx.balance.ownerType!=='SUPPLIER'||!same(ctx.balance.ownerId,gr.header.supplierId))throw validationError('Sai nguồn chủ hàng');target=ctx.balance;await guardLocations([ctx.location._id],session);locations.push(ctx.location._id);}
 await transferCustodyStock(move.toBalanceId,target,{...reversalItem.toObject(),qtyBase:String(move.quantityBase)},posting,actor,session,move.packagingPortionIds);
 }
  await verifyCapacity(locations,session);await posting.save({session});gr.workflowStatus='REVERSED';await saveVersion(gr,gr.version,session);const quantities=await purchaseOrderQuantities(po,session);po.workflowStatus=quantities.some(q=>exact(q.receivedQtyBase).gt(0))?'PARTIAL':'OPEN';await saveVersion(po,po.version,session);
  d.workflowStatus='POSTED';d.stockTransactionId=posting._id;d.postedBy=actor._id;d.postedAt=new Date();await d.save({session});return {document:d,versionBefore:0,stockTransactionId:posting._id};
});}
export function replaceInspection(user,id,input){return command(user,'REPLACE_GOODS_INSPECTION','goods_receipt_inspection:update',id,input,replayPurchase,async(session,actor)=>{
  const {inspection,arrival}=await inspectionSource(actor,id,session);checkVersion(inspection,input.expectedVersion);if(inspection.workflowStatus!=='CONFIRMED')throw validationError('Chỉ thay kết quả đã xác nhận');
  await evidenceFor(actor,inspection,input.evidenceIds,session,true);
  if(await PurchaseReceipt.exists({'items.inspectionId':id,workflowStatus:{$nin:['REVERSED','CANCELLED']}}).session(session))throw validationError('Phải xử lý các phiếu nhập phụ thuộc trước');
  for(const [collection,Model] of models){if(!['custody_receipts','supplier_returns'].includes(collection))continue;if(await Model.exists({'items.sources.documentId':id,workflowStatus:{$ne:'CANCELLED'}}).session(session))throw validationError('Còn chứng từ giữ hộ hoặc trả hàng phụ thuộc');}
  if(await GoodsInspection.exists({'header.previousInspectionId':id,workflowStatus:{$ne:'CANCELLED'}}).session(session))throw validationError('Đã có bản thay thế');
  const po=await activePo(actor,arrival.header.purchaseOrderId,input.expectedPoVersion,session);
  const newArrival=newDocument(GoodsArrival,'ARR',actor,{...arrival.header.toObject(),recordedAt:undefined});
  const document=newDocument(GoodsInspection,'INS',actor,{arrivalId:newArrival._id,warehouseId:arrival.header.warehouseId,previousInspectionId:inspection._id,correctionReason:input.reason,participants:[actor._id]});
  newArrival.sources=[sourceLink(po),sourceLink(arrival,null,null,'CORRECTION')];document.sources=[sourceLink(newArrival),sourceLink(inspection,null,null,'REPLACES')];
  await prepare(po,input,actor,session,newArrival,document);await newArrival.save({session});await document.save({session});await saveVersion(inspection,inspection.version,session);
  return {document,reason:input.reason};
});}

