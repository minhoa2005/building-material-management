import { documentIdentifier } from '../../shared/utils/document-id.validation.js';
import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { objectIdString as oid, decimalStringSchema } from '../../shared/utils/domain.js';
import * as service from './po-receiving.service.js';
import * as reads from './purchase-read.service.js';
import * as tasks from './purchase-putaway.service.js';
import * as correction from './purchase-correction.service.js';
import * as custody from './purchase-custody.service.js';
import * as evidence from './purchase-evidence.service.js';

export const empty = z.object({}).strict();
export const key = z.string().trim().min(1).max(160);
export const ver = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
export const qty = decimalStringSchema({ positive: true });
export const reason = z.string().trim().min(1).max(2000);
export const evidenceIds = z.array(oid).min(1).max(20).refine(a => new Set(a).size === a.length);
const optionalText = max => z.string().trim().min(1).max(max).optional();
const searchText = optionalText(100);
const iso = z.string().datetime({ offset: true }).refine(v => Date.parse(v) <= Date.now(), 'Thời điểm đến không được ở tương lai');
const line = z.object({ id: oid.optional(), poLineId: oid, lotId: oid, enteredQty: qty, qualityCode: z.enum(['GOOD','DAMAGED','PENDING','BLOCKED']), ownershipDecision: z.enum(['ACCEPT','CUSTODY','REJECT']), packagingCondition: z.enum(['SEALED','OPENED','TORN','UNKNOWN']), handlingNote: optionalText(2000), receivingLocationId: oid.optional() }).strict();
const form = { expectedPoVersion: ver, arrivedAt: iso, deliveryReference: optionalText(100), deliveredBy: optionalText(160), lines: z.array(line).max(100) };
const pager = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().safe());
export const pagination = { page: pager.default(1), limit: pager.pipe(z.number().max(100)).default(10) };
export const paged = fields => z.object({ ...pagination, ...fields }).strict().refine(q => Number.isSafeInteger((q.page - 1) * q.limit));
const query = status => paged({ purchaseOrderId: documentIdentifier.optional(), warehouseId: oid.optional(), status: z.enum(status).optional() });
export const schema = (body = empty, params = z.object({ id: documentIdentifier }).strict(), query = empty) => z.object({ body, params, query });
export const handle = fn => catchAsync(async (req, res) => { const data = await fn(req.user, req.validated); formatApiResponse(res, { data }); });
export const commandBody = { expectedVersion: ver, operationKey: key };
export const inspectionRouter = Router(); inspectionRouter.use(authenticate);
inspectionRouter.get('/:id/history', validate(schema(empty, undefined, paged({}))), handle((u,v) => reads.receivingHistory(u,v.params.id,v.query)));
inspectionRouter.post('/:id/cancel', validate(schema(z.object({ ...commandBody, reason }).strict())), handle((u,v) => service.cancelDraft(u,v.params.id,'INSPECTION',v.body)));
inspectionRouter.post('/:id/corrections', validate(schema(z.object({ ...form, ...commandBody, reason, evidenceIds }).strict())), handle((u,v) => correction.replaceInspection(u,v.params.id,v.body)));
inspectionRouter.get('/', validate(schema(empty,empty,query(['DRAFT','CONFIRMED','CANCELLED']))), handle((u,v) => reads.listDocuments(u,'INSPECTION',v.query)));
inspectionRouter.get('/:id', validate(schema()), handle((u,v) => reads.getDocument(u,v.params.id,'INSPECTION')));
inspectionRouter.put('/:id', validate(schema(z.object({ ...form, ...commandBody }).strict())), handle((u,v) => service.updateInspection(u,v.params.id,v.body)));
inspectionRouter.post('/:id/confirm', validate(schema(z.object({ ...commandBody, expectedPoVersion: ver, destinations: z.array(z.object({inspectionItemId:oid,locationId:oid}).strict()).max(100) }).strict())), handle((u,v) => service.confirmInspection(u,v.params.id,v.body)));
const portion=z.object({packagingState:z.enum(['SEALED','OPEN','LOOSE']),sealedPackCount:z.number().int().nonnegative().optional(),quantityBase:qty,measuredVolumeMm3:qty.optional(),extraOccupiedVolumeMm3:decimalStringSchema().optional(),packagingSnapshot:z.object({packageUnit:z.string().min(1).max(60),baseUnitsPerPackage:qty,outerLengthMm:decimalStringSchema({positive:true,scale:3}),outerWidthMm:decimalStringSchema({positive:true,scale:3}),outerHeightMm:decimalStringSchema({positive:true,scale:3})}).strict().optional()}).strict();
const packaging=z.array(z.object({lineId:oid,portions:z.array(portion).min(1).max(100)}).strict()).max(100).optional();
export const receiptRouter = Router(); receiptRouter.use(authenticate);
receiptRouter.post('/:id/cancel', validate(schema(z.object({ ...commandBody, expectedPoVersion: ver, reason }).strict())), handle((u,v) => service.cancelDraft(u,v.params.id,'GR_PURCHASE',v.body)));
receiptRouter.patch('/:id/destinations', validate(schema(z.object({ ...commandBody, reason, lines: z.array(z.object({ lineId: oid, receivingLocationId: oid }).strict()).min(1).max(100) }).strict())), handle((u,v) => service.changeDestinations(u,v.params.id,v.body)));
receiptRouter.get('/:id/putaway-context', validate(schema()), handle((u,v) => tasks.putawayContext(u,v.params.id)));
receiptRouter.post('/:id/putaway-tasks', validate(schema(z.object({ expectedVersion: ver, creationKey: key, lines: z.array(z.object({ receiptLineId: oid, expectedPlacementVersion: z.number().int().min(0).optional(), expectedSourceVersion: z.number().int().min(0), qtyBase: qty, toLocationId: oid }).strict()).min(1).max(100) }).strict())), handle((u,v) => tasks.createPutaway(u,v.params.id,v.body)));
receiptRouter.get('/:id/reversal-preflight', validate(schema()), handle((u,v) => correction.reversalPreflight(u,v.params.id)));
receiptRouter.post('/:id/reverse', validate(schema(z.object({ ...commandBody, expectedPoVersion: ver, reason, evidenceIds }).strict())), handle((u,v) => correction.reverseReceipt(u,v.params.id,v.body)));
receiptRouter.get('/', validate(schema(empty,empty,query(['DRAFT','POSTED','REVERSED','CANCELLED']))), handle((u,v) => reads.listDocuments(u,'GR_PURCHASE',v.query)));
receiptRouter.get('/:id', validate(schema()), handle((u,v) => reads.getDocument(u,v.params.id,'GR_PURCHASE')));
receiptRouter.post('/:id/post', validate(schema(z.object({ ...commandBody, expectedPoVersion: ver, packaging }).strict())), handle((u,v) => service.postReceipt(u,v.params.id,v.body)));
export const purchaseReceivingRouter = Router(); purchaseReceivingRouter.use(authenticate);
purchaseReceivingRouter.get('/:id/receiving-operations/:key', validate(schema(empty,z.object({ id: documentIdentifier, key }).strict())), handle((u,v) => service.receivingOperation(u,v.params.id,v.params.key)));
purchaseReceivingRouter.get('/:id/receiving-summary', validate(schema()), handle((u,v) => reads.receivingSummary(u,v.params.id)));
purchaseReceivingRouter.get('/:id/receiving-trips', validate(schema(empty,undefined,paged({ status: z.enum(['DRAFT','CONFIRMED','CANCELLED']).optional() }))), handle((u,v) => reads.receivingTrips(u,v.params.id,v.query)));
purchaseReceivingRouter.get('/:id/inspection-context', validate(schema()), handle((u,v) => service.inspectionContext(u,v.params.id)));
purchaseReceivingRouter.post('/:id/inspections', validate(schema(z.object({ ...form, creationKey: key }).strict())), handle((u,v) => service.createInspection(u,v.params.id,v.body)));
export const putawayRouter = Router(); putawayRouter.use(authenticate);
putawayRouter.get('/', validate(schema(empty, empty, paged({
  q: searchText,
  status: z.enum(['OPEN', 'PARTIAL', 'CONFIRMED', 'CANCELLED']).optional(),
  warehouseId: oid.optional(), receiptId: documentIdentifier.optional(), purchaseOrderId: documentIdentifier.optional(),
}))), handle((u, v) => tasks.listPutaway(u, v.query)));
putawayRouter.get('/:id', validate(schema()), handle((u,v) => tasks.getPutaway(u,v.params.id)));
putawayRouter.post('/:id/confirm', validate(schema(z.object({ ...commandBody, lines: z.array(z.object({ taskLineId: oid, actualQtyBase: qty }).strict()).min(1).max(100) }).strict())), handle((u,v) => tasks.confirmPutaway(u,v.params.id,v.body)));
putawayRouter.post('/:id/cancel-remainder', validate(schema(z.object({ ...commandBody, reason }).strict())), handle((u,v) => tasks.cancelPutaway(u,v.params.id,v.body)));
export const queueRouter = Router(); queueRouter.use(authenticate);
queueRouter.get('/', validate(schema(empty, empty, paged({
  q: searchText,
  warehouseId: oid.optional(),
  purchaseOrderId: documentIdentifier.optional(),
  stage: z.enum(['DRAFT_INSPECTION', 'AWAITING_POST', 'AWAITING_PUTAWAY', 'CORRECTION']),
}))), handle((u, v) => reads.receivingQueue(u, v.query)));
export const purchaseDocumentRouter = Router(); purchaseDocumentRouter.use(authenticate);
purchaseDocumentRouter.get('/:id/history', validate(schema(empty,undefined,paged({}))), handle((u,v) => reads.receivingHistory(u,v.params.id,v.query)));
purchaseDocumentRouter.get('/:id/evidence', validate(schema()), handle((u,v) => evidence.listEvidence(u,v.params.id)));
const multipart = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1 } }).single('file');
purchaseDocumentRouter.post('/:id/evidence/uploads', (req,res,next) => multipart(req,res,e => next(e ? new ApiError(e.code === 'LIMIT_FILE_SIZE' ? 413 : 400,'Một tệp JPEG/PNG/PDF tối đa 5 MB') : undefined)), validate(schema(z.object({ lineId: oid.optional() }).strict())), catchAsync(async (req,res) => formatApiResponse(res,{ data: await evidence.uploadEvidence(req.user,req.validated.params.id,req.file,req.validated.body.lineId) })));
purchaseDocumentRouter.post('/:id/evidence/attach', validate(schema(z.object({ ...commandBody, attachmentId: oid }).strict())), handle((u,v) => evidence.attachEvidence(u,v.params.id,v.body)));
purchaseDocumentRouter.get('/:id/evidence/:evidenceId/download', validate(schema(empty,z.object({ id: documentIdentifier,evidenceId: oid }).strict())), handle((u,v) => evidence.downloadEvidence(u,v.params.id,v.params.evidenceId)));

export const reversalRouter=Router();reversalRouter.use(authenticate);
reversalRouter.get('/:id',validate(schema()),handle((u,v)=>correction.getReversal(u,v.params.id)));
export const custodyRouter=Router();custodyRouter.use(authenticate);
custodyRouter.get('/', validate(schema(empty, empty, query(['DRAFT', 'POSTED', 'CLOSED']))),
  handle((u, v) => reads.listDocuments(u, 'CUSTODY_RECEIPT', v.query)));
custodyRouter.get('/:id',validate(schema()),handle((u,v)=>reads.getDocument(u,v.params.id,'CUSTODY_RECEIPT')));
custodyRouter.post('/:id/post',validate(schema(z.object({...commandBody,handedOverBy:z.string().trim().max(160).nullish(),destinations:z.array(z.object({lineId:oid,locationId:oid}).strict()).min(1).max(100),packaging}).strict())),handle((u,v)=>service.postCustodyReceipt(u,v.params.id,v.body)));



const custodyLines=(shape)=>z.array(z.object(shape).strict()).min(1).max(100).refine(rows=>new Set(rows.map(r=>r.custodyItemId)).size===rows.length,'Trùng dòng giữ hộ');
custodyRouter.post('/:id/reinspections',validate(schema(z.object({...commandBody,reason,evidenceIds,lines:custodyLines({custodyItemId:oid,qtyBase:qty,qualityCode:z.enum(['GOOD','DAMAGED','PENDING','BLOCKED'])})}).strict())),handle((u,v)=>custody.reinspectCustody(u,v.params.id,v.body)));
custodyRouter.post('/:id/resolution-decisions',validate(schema(z.object({...commandBody,reason,evidenceIds,decision:z.enum(['ACCEPT','RETURN']),lines:custodyLines({custodyItemId:oid,qtyBase:qty,reinspectionId:oid.optional()})}).strict())),handle((u,v)=>custody.decideCustody(u,v.params.id,v.body)));
custodyRouter.post('/:id/purchase-receipts',validate(schema(z.object({...commandBody,decisionId:oid,expectedPoVersion:ver,lines:custodyLines({custodyItemId:oid,qtyBase:qty,destinationLocationId:oid})}).strict())),handle((u,v)=>custody.createCustodyResolution(u,v.params.id,v.body,'ACCEPT')));
custodyRouter.post('/:id/releases',validate(schema(z.object({...commandBody,decisionId:oid,lines:custodyLines({custodyItemId:oid,qtyBase:qty})}).strict())),handle((u,v)=>custody.createCustodyResolution(u,v.params.id,v.body,'RETURN')));
export const custodyReleaseRouter=Router();custodyReleaseRouter.use(authenticate);
custodyReleaseRouter.get('/:id',validate(schema()),handle((u,v)=>reads.getDocument(u,v.params.id,'CUSTODY_RELEASE')));
custodyReleaseRouter.post('/:id/post',validate(schema(z.object({...commandBody,recipientName:reason}).strict())),handle((u,v)=>custody.postCustodyRelease(u,v.params.id,v.body)));
