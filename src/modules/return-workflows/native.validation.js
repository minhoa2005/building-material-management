import { z } from 'zod';
import { exact } from '../../models/model-utils.js';
export const id=z.string().regex(/^[a-f\d]{24}$/i);
export const qty=z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/).refine(v=>exact(v).gt(0)&&exact(v).lt('100000000000000'));
const factor=z.string().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,12})?$/).refine(v=>exact(v).gt(0)&&exact(v).lt('1000000000000'));
const zero=qty.or(z.literal('0'));
const note=z.string().trim().min(1).max(2000),key=z.string().trim().min(16).max(120);
const evidenceIds=z.array(id).min(1).max(20).refine(v=>new Set(v).size===v.length);
const base={expectedVersion:z.number().int().min(1),idempotencyKey:key,note};
const unique=(shape)=>z.array(z.object(shape).strict()).min(1).max(100).refine(rows=>new Set(rows.map(r=>r.lineId??r.returnLineId??r.originLineId??r.salesIssueLineId??r.historicalExternalLineId)).size===rows.length,'Dòng nguồn bị lặp');
const portions=z.array(z.object({packagingState:z.enum(['SEALED','OPEN','LOOSE']),quantityBase:qty,sealedPackCount:z.number().int().positive().optional(),measuredVolumeMm3:qty.optional(),packagingSnapshot:z.object({packageUnit:z.string(),baseUnitsPerPackage:qty,outerLengthMm:z.number().int().positive(),outerWidthMm:z.number().int().positive(),outerHeightMm:z.number().int().positive()}).strict().optional()}).strict()).min(1).max(50).optional();
export const params=z.object({id});
export const listSchema=z.object({query:z.object({page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(100).optional(),status:z.string().max(40).optional(),supplierId:id.optional(),warehouseId:id.optional(),lotId:id.optional(),locationId:id.optional(),ownerPartyId:id.optional(),hasEvidence:z.enum(['yes','no']).optional(),unresolvedOnly:z.enum(['yes','no']).optional(),disposition:z.enum(['RELEASE','REGRADE','SCRAP','RETURN_SUPPLIER']).optional(),sourceKind:z.string().max(30).optional()}).strict()});
export const idSchema=z.object({params});
export const optionsSchema=z.object({query:z.object({compact:z.enum(['true','false']).optional()}).strict()});
export const traceRecordsSchema=z.object({params,query:z.object({section:z.enum(['documents','movements','reservations','evidence','history']),page:z.coerce.number().int().min(1).max(10000).default(1),limit:z.coerce.number().int().min(1).max(25).default(10)}).strict()});
export const lookupSchema=z.object({query:z.object({
 kind:z.enum(['customers','suppliers','parties','lots','locations','balances','sources','documents','document-lines','evidence','stocktakes','holds']),
 page:z.coerce.number().int().min(1).max(10000).default(1),limit:z.coerce.number().int().min(1).max(25).default(10),
 search:z.string().trim().max(100).optional(),warehouseId:id.optional(),customerId:id.optional(),supplierId:id.optional(),lotId:id.optional(),balanceId:id.optional(),documentId:id.optional(),
 purpose:z.enum(['customer-returns','failed-deliveries','supplier-returns','defects','external-references']).optional(),
 sourceKind:z.enum(['RECEIPT','ISSUE','TRANSFER','CUSTOMER_RETURN']).optional(),locationKinds:z.string().regex(/^(RECEIVING|STORAGE|QUARANTINE|CUSTODY)(,(RECEIVING|STORAGE|QUARANTINE|CUSTODY))*$/).optional(),
}).strict().refine(query=>query.kind!=='sources'||Boolean(query.purpose&&query.purpose!=='external-references'&&(query.purpose!=='defects'||query.sourceKind)),'Chọn mục đích và loại nguồn hợp lệ')});
const mutation=body=>z.object({params,body:z.object(body).strict()});
export const supplierCreateSchema=z.object({body:z.object({idempotencyKey:key,warehouseId:id,supplierId:id,note,lines:unique({originLineId:id,balanceId:id,defectHoldId:id.optional(),qtyBase:qty})}).strict()});
export const agreementSchema=mutation({...base,evidenceIds,reference:note,lines:unique({lineId:id,qtyBase:zero})});
export const dispatchSchema=mutation({...base,evidenceIds,recipientName:note,lines:unique({lineId:id,qtyBase:qty})});
export const ackSchema=mutation({...base,evidenceIds,supersedesAcknowledgementId:id.optional(),lines:unique({lineId:id,qtyBase:qty,outcome:z.enum(['ACCEPTED','REJECTED','DAMAGED'])})});
export const closeSchema=mutation(base);
export const receiptSchema=mutation({...base,evidenceIds,lines:unique({lineId:id,qtyBase:qty,locationId:id,qualityCode:z.enum(['GOOD','DAMAGED','BLOCKED']),portions})});
export const failedCreateSchema=z.object({body:z.object({idempotencyKey:key,warehouseId:id,note,lines:unique({salesIssueLineId:id,qtyBase:qty,holderName:note.optional()})}).strict()});
export const failedInspectionSchema=mutation({...base,evidenceIds,lines:unique({lineId:id,qtyBase:qty,qualityCode:z.enum(['GOOD','DAMAGED','BLOCKED']),packagingCondition:z.enum(['SEALED','OPENED','TORN','UNKNOWN'])})});
export const assessment={returnLineId:id,qtyReceived:zero,packagingCondition:z.enum(['SEALED','OPENED','TORN','UNKNOWN']),installationStatus:z.enum(['UNUSED','INSTALLED','UNKNOWN']),damageCause:z.enum(['NONE','CUSTOMER','SUPPLIER','OTHER','UNKNOWN']),deadlineStatus:z.enum(['WITHIN','EXCEEDED','NOT_APPLICABLE','UNKNOWN']),deadlineReference:note.optional(),assessmentReason:note,portions};
export const inspectionSchema=mutation({...base,evidenceIds,custodyLocationId:id,lines:unique(assessment)});
export const reassessSchema=mutation({...base,evidenceIds,lines:unique(assessment)});
export const customerCreateSchema=z.object({body:z.object({idempotencyKey:key,warehouseId:id,customerId:id,lines:unique({salesIssueLineId:id.optional(),historicalExternalLineId:id.optional(),qtyBase:qty,reason:note}).refine(rows=>rows.every(r=>Boolean(r.salesIssueLineId)!==Boolean(r.historicalExternalLineId)),'Chọn đúng một nguồn')}).strict()});
export const decisionSchema=mutation({expectedVersion:base.expectedVersion,idempotencyKey:key,decision:z.enum(['APPROVE','REJECT']),reason:note,lines:unique({lineId:id,qtyBase:zero}).optional(),approvedQty:qty.optional(),planId:id.optional()});
export const executeSchema=mutation({...base,evidenceIds,planId:id.optional(),lines:unique({lineId:id,qtyBase:qty,locationId:id.optional()}).optional()});
export const defectCreateSchema=z.object({body:z.object({idempotencyKey:key,warehouseId:id,balanceId:id,quantity:qty,sourceKind:z.enum(['RECEIPT','ISSUE','STOCKTAKE','TRANSFER','CUSTOMER_RETURN','MANUAL']),sourceLineId:id.optional(),stocktakeId:id.optional(),reason:note,disposition:z.object({outcome:z.enum(['RELEASE','REGRADE','SCRAP']),targetQuality:z.enum(['GOOD','DAMAGED','BLOCKED']).optional(),quantity:qty,reason:note}).strict().optional()}).strict().refine(v=>v.sourceKind==='STOCKTAKE'?!!v.stocktakeId&&!v.disposition:true,'Phương án không đúng phạm vi kiểm kê').refine(v=>!v.disposition||exact(v.quantity).eq(v.disposition.quantity),'Lượng phương án khác lượng chặn')});
export const externalSchema=mutation({...base,documentId:id,sourceSystem:z.string().trim().min(1).max(50),referenceKind:z.enum(['INVOICE','CREDIT_NOTE','REFUND','RECONCILIATION','HISTORICAL_DELIVERY']),referenceNo:z.string().trim().min(1).max(100),referenceDate:z.iso.datetime(),sourceVersion:z.string().max(100).optional(),correlationId:z.string().trim().min(1).max(100),evidenceId:id,status:z.enum(['RECORDED','VERIFIED','DISPUTED']),customerId:id.optional(),warehouseId:id.optional(),lines:unique({lineId:id,qtyBase:qty,lotId:id.optional(),baseUnitsPerUnit:factor.optional(),enteredUnit:z.string().max(60).optional(),returnedQty:zero.optional()})});
export const historicalSchema=z.object({body:z.object({idempotencyKey:key,sourceSystem:z.string().trim().min(1).max(50),referenceNo:z.string().trim().min(1).max(100),referenceDate:z.iso.datetime(),correlationId:z.string().trim().min(1).max(100),customerId:id,warehouseId:id,note,lines:z.array(z.object({lineKey:z.string().max(100).optional(),productId:id,lotId:id,qtyBase:qty,enteredUnit:z.string().trim().min(1).max(60),baseUnitsPerUnit:factor,returnedQty:zero.optional()}).strict()).min(1).max(100).refine(rows=>new Set(rows.map(r=>r.lineKey??r.lotId)).size===rows.length)}).strict()});
export const proposalSchema=mutation({...base,evidenceIds,lines:unique({lineId:id,qtyBase:qty,outcome:z.enum(['RELEASE','REGRADE','SCRAP']),targetQuality:z.enum(['GOOD','DAMAGED','BLOCKED']).optional()})});
