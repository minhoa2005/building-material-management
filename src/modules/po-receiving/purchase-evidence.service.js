import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import { PDFDocument } from 'pdf-lib';
import { cloudinary } from '../../config/cloudinary.js';
import { Attachment } from '../../models/runtime.js';
import { requirePermission, hasPermission } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { ApiError, notFoundError, validationError } from '../../shared/utils/ApiError.js';
import { newId, command, checkVersion, saveVersion } from '../../shared/utils/document-command.js';
import { dto } from '../../shared/utils/persistence.js';
import { findPurchase, replayPurchase } from './purchase-core.js';
const MAX_BYTES = 5 * 1024 * 1024;
export const evidenceStorage = {
  upload: (buffer, options) => new Promise((resolve, reject) => cloudinary.uploader.upload_stream({ ...options, timeout: 20000 }, (e, r) => e ? reject(new ApiError(502, 'Không lưu được chứng cứ')) : resolve(r)).end(buffer)),
  exists: (key, resourceType) => cloudinary.api.resource(key, { resource_type: resourceType, type: 'authenticated' }),
  destroy: (key, resourceType) => cloudinary.uploader.destroy(key, { resource_type: resourceType, type: 'authenticated', invalidate: true }),
  download: (key, format, resourceType, expiresAt) => cloudinary.utils.private_download_url(key, format, { resource_type: resourceType, type: 'authenticated', expires_at: expiresAt, attachment: true }),
};
export async function inspectFile(file) {
  if (!file?.buffer?.length) throw validationError('Thiếu tệp chứng cứ');
  const bytes = file.buffer;
  if (bytes.length > MAX_BYTES) throw new ApiError(413, 'Chứng cứ tối đa 5 MB', { code: 'ERR-REC-FILE_SIZE' });
  try {
    if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
      if (bytes.length < 24 || bytes.readUInt32BE(16) * bytes.readUInt32BE(20) > 10000000) throw new Error('Image too large');
      PNG.sync.read(bytes, { checkCRC: true }); return { mediaType: 'image/png', resourceType: 'image', format: 'png' };
    }
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217) {
      jpeg.decode(bytes, { maxResolutionInMP: 10, maxMemoryUsageInMB: 64, tolerantDecoding: false });
      return { mediaType: 'image/jpeg', resourceType: 'image', format: 'jpg' };
    }
    if (bytes.subarray(0, 5).toString() === '%PDF-' && bytes.subarray(Math.max(0, bytes.length - 1024)).includes(Buffer.from('%%EOF'))) {
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
      if (pdf.getPageCount() < 1 || pdf.getPageCount() > 2000) throw new Error('Invalid page count');
      return { mediaType: 'application/pdf', resourceType: 'raw', format: 'pdf' };
    }
  } catch { throw validationError('Nội dung JPEG/PNG/PDF không hợp lệ'); }
  throw validationError('Chỉ nhận nội dung JPEG, PNG hoặc PDF thật');
}
async function parent(user,id,write=false,session){
  const document=await findPurchase(id,user,session,{readOnly:!write});
  const permission=document.documentKind==='PO'?'purchase_order:'+ (write?'update':'read'):document.documentKind==='TO'?'putaway_task:'+(write?'confirm':'read'):document.documentKind==='OTHER'?'goods_receipt_other:'+(write?'create':'read'):'goods_receipt_inspection:'+(write?'update':'read');
  if(write&&document.documentKind==='CUSTODY_RECEIPT'&&hasPermission(user,'purchase_custody:decide')) return {document,permission:'purchase_custody:decide'};
  if(write&&document.documentKind==='PO'&&!hasPermission(user,permission))requirePermission(user,'purchase_order:approve_exception');else requirePermission(user,permission);
  return {document,permission:write&&document.documentKind==='PO'&&!hasPermission(user,permission)?'purchase_order:approve_exception':permission};
}
const resourceType=attachment=>attachment.mediaType==='application/pdf'?'raw':'image';
const format=attachment=>attachment.mediaType==='application/pdf'?'pdf':attachment.mediaType==='image/png'?'png':'jpg';
export async function uploadEvidence(user,id,file,lineId){
  const {document}=await parent(user,id,true);if(lineId&&!document.items.id(lineId))throw notFoundError();
  const type=await inspectFile(file),uploadId=newId(),storageKey='sep490/purchase-evidence/'+uploadId+(type.resourceType==='raw'?'.pdf':'');
  const attachment=await new Attachment({_id:uploadId,ownerDocumentType:document.constructor.collection.name,ownerDocumentId:document._id,ownerItemId:lineId,
    purpose:'PURCHASE_EVIDENCE',originalName:file.originalname,mediaType:type.mediaType,sizeBytes:file.buffer.length,storageKey,checksum:createHash('sha256').update(file.buffer).digest('hex'),uploadedBy:user._id,uploadedAt:new Date(),
    accessCategory:document.documentKind==='PO'?'PURCHASE_PRICE':'BUSINESS',status:'TEMPORARY',uploadSessionId:String(uploadId),expiresAt:new Date(Date.now()+86400000)}).save();
  try{const stored=await evidenceStorage.upload(file.buffer,{public_id:storageKey,resource_type:type.resourceType,type:'authenticated',overwrite:false});
    if(stored.public_id!==storageKey||stored.type!=='authenticated')throw new ApiError(502,'Storage chưa xác nhận tệp riêng tư');
    return {attachmentId:String(attachment._id),expiresAt:attachment.expiresAt.toISOString(),mediaType:type.mediaType,sizeBytes:file.buffer.length};
  }catch(error){await Attachment.updateOne({_id:attachment._id,status:'TEMPORARY'},{$set:{expiresAt:new Date()}});throw error;}
}
export async function attachEvidence(user,id,input){
  const {permission}=await parent(user,id,true);
  const upload=await Attachment.findOne({_id:input.attachmentId,ownerDocumentId:id,uploadedBy:user._id});
  if(!upload)throw notFoundError();
  if(upload.status==='TEMPORARY'){try{await evidenceStorage.exists(upload.storageKey,resourceType(upload));}catch{throw new ApiError(502,'Không xác minh được tệp trên storage');}}
  return command(user,'ATTACH_PURCHASE_EVIDENCE',permission,id,input,replayPurchase,async(session,actor)=>{
    const {document}=await parent(actor,id,true,session);checkVersion(document,input.expectedVersion);
    const attachment=await Attachment.findOne({_id:input.attachmentId,ownerDocumentId:id,uploadedBy:actor._id,status:'TEMPORARY',expiresAt:{$gt:new Date()}}).session(session);
    if(!attachment)throw validationError('Tệp đã gắn, hết hạn hoặc đang dọn');
    if(attachment.ownerItemId&&!document.items.id(attachment.ownerItemId))throw validationError('Dòng gốc không còn tồn tại');
    const write=await Attachment.updateOne({_id:attachment._id,status:'TEMPORARY',expiresAt:{$gt:new Date()}},{$set:{status:'ATTACHED',ownerRevision:document.version+1},$unset:{expiresAt:1,uploadSessionId:1}},{session,runValidators:true});
    if(write.matchedCount!==1)throw validationError('Tệp vừa được xử lý');
    document.evidenceIds.addToSet(attachment._id);
    return {document:await saveVersion(document,input.expectedVersion,session),versionBefore:input.expectedVersion};
  });
}
const priceAccess=user=>['OWNER','ACCOUNTANT'].includes(currentRole(user)?.code);
export async function listEvidence(user,id){
  await parent(user,id);return {items:(await Attachment.find({ownerDocumentId:id,status:'ATTACHED',...(!priceAccess(user)&&{accessCategory:{$ne:'PURCHASE_PRICE'}})}).select('-storageKey -checksum -uploadSessionId').lean()).map(dto)};
}
export async function downloadEvidence(user,id,evidenceId){
  await parent(user,id);const attachment=await Attachment.findOne({_id:evidenceId,ownerDocumentId:id,status:'ATTACHED',...(!priceAccess(user)&&{accessCategory:{$ne:'PURCHASE_PRICE'}})});
  if(!attachment)throw notFoundError();const expiresAt=Math.floor(Date.now()/1000)+60;
  return {url:evidenceStorage.download(attachment.storageKey,format(attachment),resourceType(attachment),expiresAt),expiresAt:new Date(expiresAt*1000).toISOString()};
}
export async function cleanupPurchaseEvidence({now=new Date(),limit=100}={}){
  let removed=0;
  for(let i=0;i<limit;i++){
    const token='cleanup:'+newId();const attachment=await Attachment.findOneAndUpdate({purpose:'PURCHASE_EVIDENCE',expiresAt:{$lte:now},$or:[{status:'TEMPORARY'},{status:'SUPERSEDED',uploadSessionId:/^cleanup:/}]},
      {$set:{status:'SUPERSEDED',uploadSessionId:token,expiresAt:new Date(now.getTime()+300000)}},{returnDocument:'after'});
    if(!attachment)break;const result=await evidenceStorage.destroy(attachment.storageKey,resourceType(attachment));
    if(!['ok','not found'].includes(result.result))throw new ApiError(502,'Không dọn được tệp hết hạn');
    await Attachment.updateOne({_id:attachment._id,status:'SUPERSEDED',uploadSessionId:token},{$unset:{expiresAt:1,uploadSessionId:1}});removed++;
  }
  return {removed};
}

