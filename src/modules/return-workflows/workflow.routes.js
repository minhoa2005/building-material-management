import { evidenceStorage } from '../po-receiving/purchase-evidence.service.js';
import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import checkPermission from '../../middlewares/permission.js';
import { validate } from '../../middlewares/validate.js';
import multer from 'multer';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import * as v from './native.validation.js';
import * as service from './native.service.js';
import * as read from './native.read.js';
import { lookup } from './native.lookup.js';
import { traceRecords } from './native.trace.js';
import { resources, m, serialize, validationError } from './native.shared.js';
const uploadSingleImage = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } }).single('file');
const router=Router();router.use(authenticate);
const send=fn=>catchAsync(async(req,res)=>{res.set('Cache-Control','no-store');formatApiResponse(res,{data:await fn(req)});});
const multipart=(req,_res,next)=>{try{if(typeof req.body.payload==='string')req.body=JSON.parse(req.body.payload);next();}catch{next(validationError('Biểu mẫu không hợp lệ'));}};
router.get('/return-workflows/options',validate(v.optionsSchema),send(req=>read.options(req.user,{compact:req.validated.query.compact==='true'})));
router.get('/return-workflows/lookup',validate(v.lookupSchema),catchAsync(async(req,res)=>{const result=await lookup(req.user,req.validated.query);res.set('Cache-Control','no-store');formatApiResponse(res,{data:result.items,meta:{total:result.total,page:result.page,limit:result.limit}});}));
router.get('/return-workflows/:id/context',checkPermission('external_reference:create'),validate(v.idSchema),send(async req=>{const doc=await read.parent(req.user,req.params.id);let canUpload=true;try{await read.parent(req.user,req.params.id,undefined,true);}catch(error){if(error.statusCode!==403)throw error;canUpload=false;}return {id:String(doc._id),version:doc.version,warehouseId:String(doc.header.warehouseId),canUpload};}));
for(const [resource,[,permission]] of Object.entries(resources)){
 router.get(`/${resource}`,checkPermission(permission),validate(v.listSchema),catchAsync(async(req,res)=>{const result=await read.list(req.user,resource,req.validated.query);formatApiResponse(res,{data:result.items,meta:{total:result.total,page:result.page,limit:result.limit}});}));
 router.get(`/${resource}/:id`,checkPermission(permission),validate(v.idSchema),send(req=>read.detail(req.user,resource,req.params.id)));
}
for(const [resource,permission,schema,fn,file] of [
 ['defects','defect:create',v.defectCreateSchema,service.createDefect,true],
 ['customer-returns','customer_return:create',v.customerCreateSchema,service.createCustomerReturn,false],
 ['failed-deliveries','customer_return:inspect',v.failedCreateSchema,service.createFailedDelivery,true],
 ['supplier-returns','supplier_return:create',v.supplierCreateSchema,service.createSupplierReturn,false],
])router.post(`/${resource}`,checkPermission(permission),...(file?[uploadSingleImage,multipart]:[]),validate(schema),send(async req=>{
 if(file&&!req.file)throw validationError('Cần ảnh chứng cứ');const stored=file?await read.storeFile(req.file):undefined;
 try { const result=await fn(req.user,req.body,stored); if(result.replayed&&stored)await evidenceStorage.destroy(stored.storageKey,stored.mediaType==='application/pdf'?'raw':'image');return result; }catch(error){if(stored&&[400,403,404,409,422].includes(error.statusCode))await evidenceStorage.destroy(stored.storageKey,stored.mediaType==='application/pdf'?'raw':'image').catch(()=>{});throw error;}
}));
for(const [path,permission,schema,fn] of [
 ['defects/:id/proposals','defect:create',v.proposalSchema,service.submitDefectProposal],
 ['defects/:id/decision','defect:approve',v.decisionSchema,service.decideDefect],['defects/:id/execute','defect:execute',v.executeSchema,service.executeDefect],
 ['customer-returns/:id/inspect','customer_return:inspect',v.inspectionSchema,service.inspectCustomerReturn],
 ['customer-returns/:id/reassess','customer_return:inspect',v.reassessSchema,(u,id,b)=>service.inspectCustomerReturn(u,id,b,true)],
 ['customer-returns/:id/decision','customer_return:accept',v.decisionSchema,service.decideCustomerReturn],
 ['customer-returns/:id/exception-decision','customer_return:approve_exception',v.decisionSchema,(u,id,b)=>service.decideCustomerReturn(u,id,b,true)],
 ['customer-returns/:id/receipt','customer_return:post',v.receiptSchema,service.receiveCustomerReturn],
 ['customer-returns/:id/handback','customer_return:post',v.dispatchSchema,(u,id,b)=>service.receiveCustomerReturn(u,id,b,true)],
 ['failed-deliveries/:id/inspect','customer_return:inspect',v.failedInspectionSchema,service.inspectFailedDelivery],['failed-deliveries/:id/receipt','customer_return:post',v.receiptSchema,service.receiveFailedDelivery],
 ['supplier-returns/:id/agreement','supplier_return:record_agreement',v.agreementSchema,service.supplierAgreement],['supplier-returns/:id/dispatch','supplier_return:dispatch',v.dispatchSchema,service.dispatchSupplierReturn],
 ['supplier-returns/:id/acknowledgement','supplier_return:record_agreement',v.ackSchema,service.acknowledgeSupplierReturn],['supplier-returns/:id/close','supplier_return:close',v.closeSchema,service.closeSupplierReturn],
])router.post(`/${path}`,checkPermission(permission),validate(schema),send(req=>fn(req.user,req.params.id,req.body)));
router.post('/return-workflows/:id/evidence',validate(v.idSchema),uploadSingleImage,send(req=>read.uploadEvidence(req.user,req.params.id,req.file)));
router.get('/return-workflows/:id/evidence/:evidenceId',validate(v.idSchema),send(req=>{v.id.parse(req.params.evidenceId);return read.downloadEvidence(req.user,req.params.id,req.params.evidenceId);}));
router.get('/lots/:id/trace',validate(v.idSchema),send(req=>read.traceLot(req.user,req.params.id)));
router.get('/lots/:id/trace/records',validate(v.traceRecordsSchema),catchAsync(async(req,res)=>{const result=await traceRecords(req.user,req.params.id,req.validated.query);res.set('Cache-Control','no-store');formatApiResponse(res,{data:{items:result.items,lot:result.lot},meta:{total:result.total,page:result.page,limit:result.limit}});}));
router.get('/lots/:id/trace/evidence/:evidenceId',validate(v.idSchema),send(async req=>{v.id.parse(req.params.evidenceId);const trace=await read.traceLot(req.user,req.params.id),attachment=trace.evidence.find(e=>e._id===req.params.evidenceId);if(!attachment)throw validationError('Chứng cứ ngoài phạm vi lô');return read.downloadEvidence(req.user,attachment.ownerDocumentId,attachment._id);}));
router.get('/external-references',checkPermission('external_reference:read'),validate(v.listSchema),catchAsync(async(req,res)=>{const result=await read.listExternal(req.user,req.validated.query);res.set('Cache-Control','no-store');formatApiResponse(res,{data:result.items,meta:{total:result.total,page:result.page,limit:result.limit}});}));
router.post('/external-references/historical',checkPermission('external_reference:create'),uploadSingleImage,multipart,validate(v.historicalSchema),send(async req=>{const stored=await read.storeFile(req.file);try{const result=await read.createHistoricalSource(req.user,req.body,stored);if(result.replayed)await evidenceStorage.destroy(stored.storageKey,stored.mediaType==='application/pdf'?'raw':'image');return result;}catch(error){if([400,403,404,409,422].includes(error.statusCode))await evidenceStorage.destroy(stored.storageKey,stored.mediaType==='application/pdf'?'raw':'image').catch(()=>{});throw error;}}));
router.post('/external-references',checkPermission('external_reference:create'),(req,_res,next)=>{req.params.id=req.body.documentId;next();},validate(v.externalSchema),send(req=>read.recordExternalReference(req.user,req.body)));
export default router;
