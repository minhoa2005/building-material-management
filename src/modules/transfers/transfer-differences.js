import { documentIdentifier } from '../../shared/utils/document-id.validation.js';
import { z } from 'zod';
import { StockDiscrepancy,TransferDispatch,TransferReceipt,WarehouseTransferRequest,ApprovalHistory,StockHoldingPoint,InventoryBalance } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { command,same,checkVersion,saveVersion,hash } from '../../shared/utils/document-command.js';
import { requireWarehouseAccess } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { sourceLink,copyItem } from '../../shared/utils/document-copy.js';
import { nextDocumentFields } from '../../shared/utils/document-number.js';
import { validationError,notFoundError } from '../../shared/utils/ApiError.js';
import { effectiveQuantities } from '../sales-orders/sales-read.service.js';
const oid=z.string().regex(/^[a-f\d]{24}$/i),key=z.string().min(1).max(64),reason=z.string().trim().min(1).max(2000),qty=z.string().regex(/^\d{1,14}(\.\d{1,6})?$/).refine(v=>exact(v).gt(0));
export const proposalBody=z.object({idempotencyKey:key,expectedVersion:z.number().int().min(1),reason,lines:z.array(z.object({dispatchLineId:oid,qtyBase:qty}).strict()).min(1).max(100).refine(rows=>new Set(rows.map(r=>r.dispatchLineId)).size===rows.length)}).strict();
export const reviewBody=z.object({idempotencyKey:key,expectedVersion:z.number().int().min(1),decision:z.enum(['APPROVE','REJECT','REVISE']),reason,receiptId:documentIdentifier.optional()}).strict();
async function replay(id,user,session){const row=await StockDiscrepancy.findById(id).session(session);if(!row)throw notFoundError();requireWarehouseAccess(user,row.header.warehouseId);return row;}
export function proposeDifference(user,id,input){return command(user,'REPORT_TRANSFER_DIFFERENCE','stock_transfer:update',id,input,replay,async(session,actor)=>{
 const dispatch=await TransferDispatch.findById(id).session(session);if(!dispatch)throw notFoundError();checkVersion(dispatch,input.expectedVersion);const request=await WarehouseTransferRequest.findById(dispatch.header.requestId).session(session);requireWarehouseAccess(actor,request.header.destinationWarehouseId);if(dispatch.workflowStatus!=='POSTED'||request.workflowStatus!=='APPROVED')throw validationError('Chỉ báo chênh lệch trên phiếu đã xuất còn mở');
 const fields=await nextDocumentFields(StockDiscrepancy,'DISC',request.header.destinationWarehouseId,session);
 const row=new StockDiscrepancy({...fields,workflowStatus:'OPEN',version:1,createdBy:actor._id,occurredAt:new Date(),note:input.reason,header:{warehouseId:request.header.destinationWarehouseId,reportedBy:actor._id,reportedAt:new Date(),sourceRef:{documentType:'transfer_dispatches',documentId:dispatch._id,revision:dispatch.version}},sources:[sourceLink(dispatch)],items:[]});
 for(const [i,line]of input.lines.entries()){const original=dispatch.items.id(line.dispatchLineId);if(!original)throw validationError('Dòng không thuộc phiếu xuất');const point=await StockHoldingPoint.findOne({dispatchLineId:original._id}).session(session);const balance=point&&await InventoryBalance.findOne({holdingPointId:point._id,batchId:original.lotId,ownerType:'STORE'}).session(session);if(!balance||exact(line.qtyBase).gt(String(balance.quantityBase)))throw validationError('Chênh lệch không được vượt lượng đang chuyển');const open=await StockDiscrepancy.find({'header.sourceRef.documentId':dispatch._id,workflowStatus:{$ne:'RESOLVED'}}).session(session);const committed=open.flatMap(d=>d.items).filter(i=>same(i.details.sourceLineId,original._id)).reduce((n,i)=>n.plus(String(i.qtyBase)),exact('0'));if(committed.plus(line.qtyBase).gt(String(balance.quantityBase)))throw validationError('Lượng này đã có hồ sơ chênh lệch');row.items.push(copyItem(original,line.qtyBase,{lineNo:i+1,lineKind:'DISCREPANCY',sources:[sourceLink(dispatch,original,line.qtyBase)],details:{sourceLineId:original._id,discrepancyKind:'SHORT',resolutionStatus:'OPEN'}}));}
 await dispatch.updateOne({$inc:{version:1}},{session});await row.save({session});return {document:row};
});}
export function reviewDifference(user,id,input){return command(user,'REVIEW_TRANSFER_DIFFERENCE','stock_transfer:approve_variance',id,input,replay,async(session,actor)=>{
 const row=await replay(id,actor,session);checkVersion(row,input.expectedVersion);if(row.workflowStatus==='RESOLVED'||same(row.createdBy,actor._id))throw validationError('Không được tự duyệt hoặc sửa hồ sơ đã giải quyết');
 let receipt;
 if(input.decision==='APPROVE'){
 receipt=await TransferReceipt.findById(input.receiptId).session(session);if(!receipt||receipt.workflowStatus!=='POSTED'||!same(receipt.header.dispatchId,row.header.sourceRef.documentId)||receipt.createdAt<row.createdAt)throw validationError('Cần phiếu nhận đã ghi sau báo chênh lệch, cùng phiếu xuất');
 const effective=await effectiveQuantities([receipt],session);const used=await StockDiscrepancy.find({_id:{$ne:row._id},workflowStatus:'RESOLVED','items.details.resolutionDocumentId':receipt._id}).session(session);
 for(const item of row.items){const received=receipt.items.filter(i=>same(i.details.dispatchLineId,item.details.sourceLineId)).reduce((n,i)=>n.plus(effective.get(String(i._id))??'0'),exact('0'));const allocated=used.flatMap(d=>d.items).filter(i=>same(i.details.sourceLineId,item.details.sourceLineId)).reduce((n,i)=>n.plus(String(i.qtyBase)),exact('0'));if(allocated.plus(String(item.qtyBase)).gt(received))throw validationError('Phiếu nhận chưa đủ lượng giải quyết hoặc đã dùng cho hồ sơ khác');item.details.resolutionStatus='RESOLVED';item.details.resolutionDocumentId=receipt._id;row.resolutionEvents.push({itemId:item._id,performedBy:actor._id,performedAt:new Date(),quantityBase:item.qtyBase,transactionId:receipt.stockTransactionId,note:input.reason});}
 await receipt.updateOne({$inc:{version:1}},{session});row.workflowStatus='RESOLVED';
 }
 const approval=await new ApprovalHistory({decisionKey:hash({id,key:input.idempotencyKey}),subjectType:'stock_discrepancies',subjectId:row._id,subjectRevision:row.version,decisionScope:'TRANSFER_DIFFERENCE',reviewedContent:row.toObject(),decision:input.decision,reason:input.reason,requestedBy:row.createdBy,decidedBy:actor._id,decidedAt:new Date(),recordedAt:new Date(),authoritySnapshot:{roleCode:currentRole(actor).code,permissionCode:'stock_transfer:approve_variance',warehouseIds:actor.warehouseIds},basisRefs:receipt?[{documentType:'goods_receipts',documentId:receipt._id}]:[]}).save({session});
 return {document:await saveVersion(row,input.expectedVersion,session),versionBefore:input.expectedVersion,decisionId:approval._id};
});}
