import { StockReversal, StockTransaction, InventoryBalance, StockReservation, TransferOrder, GoodsInspection, GoodsArrival, PurchaseReceipt, PurchaseOrder, ApprovalHistory, StocktakeCount, models } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { requirePermission, requireWarehouseAccess } from '../../shared/utils/access.js';
import { validationError, forbiddenError, notFoundError, versionConflict } from '../../shared/utils/ApiError.js';
import { command, checkVersion, saveVersion, same, newId, hash } from '../../shared/utils/document-command.js';
import { dto } from '../../shared/utils/persistence.js';
import { copyItem, sourceLink } from '../../shared/utils/document-copy.js';
import { guardLocations, sourceContext, splitPortions, beginStock, remainingReservation, verifyCapacity } from '../../shared/utils/stock.js';
import { purchaseOrderQuantities } from '../purchase-orders/purchase-order.service.js';
import { findPurchase, newDocument, evidenceFor, replayPurchase } from './purchase-core.js';
import { prepare, activePo, inspectionSource } from './po-receiving.service.js';

async function eligible(gr,user,session){
  if(gr.workflowStatus!=='POSTED')throw validationError('Phiếu chưa ghi hoặc đã đảo');
  const original=await StockTransaction.findById(gr.stockTransactionId).session(session);
  if(!original||original.reversedTransactionId||await StockTransaction.exists({reversedTransactionId:original._id}).session(session))throw validationError('Giao dịch gốc không đủ điều kiện đảo');
  const locations=[];
  for(const move of original.movements){
    if(move.fromBalanceId||!move.toBalanceId)throw validationError('Giao dịch không phải nhập mua thuần');
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
export function reverseReceipt(user,id,input){return command(user,'REQUEST_PURCHASE_REVERSAL','goods_receipt_inspection:reverse',id,input,replayReversal,async(session,actor)=>{
  requirePermission(actor,'goods_receipt_inspection:post');const gr=await findPurchase(id,actor,session,{kind:'GR_PURCHASE'});checkVersion(gr,input.expectedVersion);
  const po=await findPurchase(gr.header.purchaseOrderId,actor,session,{kind:'PO'});checkVersion(po,input.expectedPoVersion);
  await evidenceFor(actor,gr,input.evidenceIds,session,true);const {original,locations}=await eligible(gr,actor,session);await guardLocations(locations,session);
  if(await StockReversal.exists({'header.originalTransactionId':original._id,workflowStatus:{$in:['PENDING_APPROVAL','APPROVED','POSTED']}}).session(session))throw validationError('Giao dịch đã có yêu cầu đảo');
  const document=newDocument(StockReversal,'REV',actor,{originalTransactionId:original._id,sourceDocument:{documentType:'purchase_receipts',documentId:gr._id,revision:gr.version},sourceVersion:gr.version,warehouseIds:[gr.header.warehouseId],requestedBy:actor._id,requestedAt:new Date(),reason:input.reason},original.movements.map((move,i)=>{
    const item=gr.items.id(move.sourceLineId);if(!item)throw validationError('Thiếu dòng nhập gốc');
    return copyItem(item,move.quantityBase,{lineNo:i+1,sources:[{subjectCollection:'stock_transactions',documentId:original._id,itemId:move._id,linkedQty:String(move.quantityBase),relationCode:'REVERSES'}]});
  }),'PENDING_APPROVAL');document.evidenceIds=input.evidenceIds;await document.save({session});return {document,reason:input.reason};
});}
async function replayReversal(id,user,session){const d=await StockReversal.findById(id).session(session);if(!d)throw notFoundError();for(const wh of d.header.warehouseIds)requireWarehouseAccess(user,wh);return d;}
export async function getReversal(user,id){requirePermission(user,'goods_receipt_inspection:read');return dto(await replayReversal(id,user));}
export function reviewReversal(user,id,input){return command(user,'REVIEW_STOCK_REVERSAL','stock_reversal:approve',id,input,replayReversal,async(session,actor)=>{
  const d=await replayReversal(id,actor,session);checkVersion(d,input.expectedVersion);if(d.workflowStatus!=='PENDING_APPROVAL')throw validationError('Yêu cầu không còn chờ duyệt');if(same(actor._id,d.header.requestedBy))throw forbiddenError('Người đề nghị không tự duyệt');
  const decision=await new ApprovalHistory({decisionKey:hash({id,version:d.version}),subjectType:'stock_reversals',subjectId:d._id,subjectRevision:d.version,decisionScope:'STOCK_REVERSAL',reviewedContent:d.toObject(),decision:input.decision,reason:input.reason,requestedBy:d.header.requestedBy,decidedBy:actor._id,decidedAt:new Date(),recordedAt:new Date(),evidenceIds:d.evidenceIds}).save({session});
  d.approvalDecision={decisionId:decision._id,revision:d.version,reviewedBy:actor._id,reviewedAt:decision.decidedAt,decision:input.decision,reason:input.reason};d.workflowStatus=input.decision==='APPROVE'?'APPROVED':'REJECTED';
  return {document:await saveVersion(d,input.expectedVersion,session),versionBefore:input.expectedVersion,decisionId:decision._id,reason:input.reason};
});}
export function postReversal(user,id,input){return command(user,'POST_STOCK_REVERSAL','stock_reversal:approve',id,input,replayReversal,async(session,actor)=>{
  const d=await replayReversal(id,actor,session);checkVersion(d,input.expectedVersion);if(d.workflowStatus!=='APPROVED'||same(d.header.requestedBy,actor._id))throw forbiddenError('Cần duyệt độc lập trước khi ghi đảo');
  const approval=await ApprovalHistory.findById(d.approvalDecision?.decisionId).session(session);if(!approval||approval.decision!=='APPROVE'||approval.subjectRevision!==d.version-1)throw validationError('Quyết định không đúng phiên bản');
  const gr=await findPurchase(d.header.sourceDocument.documentId,actor,session,{kind:'GR_PURCHASE'});checkVersion(gr,d.header.sourceVersion);const {original,locations}=await eligible(gr,actor,session);await guardLocations(locations,session);
  const po=await findPurchase(gr.header.purchaseOrderId,actor,session,{kind:'PO'});checkVersion(po,input.expectedPoVersion);
  if(po.workflowStatus==='CLOSED')throw validationError('PO đã đóng; cần xử lý quyết định đóng trước khi đảo');
  const posting=beginStock(d,actor,'REVERSAL',input);posting.reversedTransactionId=original._id;
  for(const move of [...original.movements].reverse()){
    const balance=await InventoryBalance.findById(move.toBalanceId).session(session);const before=exact(balance.quantityBase);if(before.lt(String(move.quantityBase)))throw validationError('Không đủ tồn đảo');
    const {kept}=splitPortions(balance.packagingPortions,move.quantityBase,actor._id);balance.packagingPortions=kept;balance.quantityBase=before.minus(String(move.quantityBase)).toFixed();await balance.validate();
    const write=await InventoryBalance.updateOne({_id:balance._id,version:balance.version},{$set:{quantityBase:balance.quantityBase,packagingPortions:balance.packagingPortions},$inc:{version:1}},{session});if(write.matchedCount!==1)throw versionConflict('Tồn vừa thay đổi');
    posting.movements.push({transactionId:posting._id,lineNo:posting.movements.length+1,sourceLineId:d.items.find(i=>i.sources.some(s=>same(s.itemId,move._id)))._id,fromBalanceId:balance._id,quantityBase:move.quantityBase,fromBefore:before.toFixed(),fromAfter:balance.quantityBase});
  }
  await verifyCapacity(locations,session);await posting.save({session});gr.workflowStatus='REVERSED';await saveVersion(gr,gr.version,session);const quantities=await purchaseOrderQuantities(po,session);po.workflowStatus=quantities.some(q=>exact(q.receivedQtyBase).gt(0))?'PARTIAL':'OPEN';await saveVersion(po,po.version,session);
  d.workflowStatus='POSTED';d.stockTransactionId=posting._id;d.postedBy=actor._id;d.postedAt=new Date();return {document:await saveVersion(d,input.expectedVersion,session),versionBefore:input.expectedVersion,stockTransactionId:posting._id};
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

