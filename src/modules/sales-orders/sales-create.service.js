import jwt from 'jsonwebtoken';
import { SalesOrder, ExternalReference, Customer, Attachment } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { cloudinary } from '../../config/cloudinary.js';
import { requirePermission } from '../../shared/utils/access.js';
import { validationError, forbiddenError } from '../../shared/utils/ApiError.js';
import { command, hash, newId } from '../../shared/utils/document-command.js';
import { makeItem } from '../../shared/utils/document-items.js';
import { orderSource } from './sales-read.service.js';
import { createHash } from 'node:crypto';
const secret=()=>process.env.JWT_SECRET||'wmsd_default_super_secret_jwt_key_2026';
export async function uploadSourceEvidence(user,file){
  requirePermission(user,'sales_order:create');if(!file)throw validationError('Thiếu ảnh đơn nguồn');
  const bytes=file.buffer,png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpeg=bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255,webp=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
  if(!png&&!jpeg&&!webp)throw validationError('Chỉ nhận PNG, JPEG hoặc WebP');
  const stored=await new Promise((resolve,reject)=>cloudinary.uploader.upload_stream({folder:'sep490/sales-source',resource_type:'image',type:'authenticated',timeout:20000},(error,result)=>error?reject(error):resolve(result)).end(bytes));
  const receipt=jwt.sign({actorId:String(user._id),storageKey:stored.public_id,checksum:createHash('sha256').update(bytes).digest('hex'),mediaType:png?'image/png':jpeg?'image/jpeg':'image/webp',sizeBytes:bytes.length,originalName:file.originalname},secret(),{algorithm:'HS256',audience:'sales-source-evidence',expiresIn:'24h'});
  return {receipt};
}
export function createSalesOrder(user,input){
  return command(user,'CREATE_SALES_ORDER','sales_order:create',null,input,(id,actor,session)=>orderSource(actor,id,session),async(session,actor)=>{
    let evidence;
    try{evidence=jwt.verify(input.evidenceReceipt,secret(),{algorithms:['HS256'],audience:'sales-source-evidence'});}catch{throw validationError('Bằng chứng không hợp lệ hoặc hết hạn');}
    if(evidence.actorId!==String(actor._id))throw forbiddenError('Bằng chứng không thuộc người tạo');
    if(!await Customer.exists({_id:input.customerId,isActive:true}).session(session))throw validationError('Khách hàng không hợp lệ');
    const reference=new ExternalReference({...input.source,referenceKind:'SALES_ORDER',correlationId:'so:'+newId(),items:[]});
    const order=new SalesOrder({documentNo:'SO-'+newId(),workflowStatus:'OPEN',version:1,createdBy:actor._id,
      externalReferenceIds:[reference._id],header:{externalReferenceId:reference._id,customerId:input.customerId,neededOn:input.neededOn,deliveryAddressSnapshot:input.deliveryAddress},
      items:[],currencyCode:input.currencyCode,orderAmount:'0'});
    let amount=exact('0');
    for(const [index,line]of input.lines.entries()){
      const item=await makeItem({...line,enteredQty:line.quantity},index+1,session,{lineKind:'SALES_ORDER'});
      const externalLine={_id:newId(),lineKey:line.sourceLineKey,productId:item.productId,eligibleQty:item.qtyBase};reference.items.push(externalLine);
      const lineAmount=exact(line.unitSellingPrice).mul(item.enteredQty);amount=amount.plus(lineAmount);
      order.items.push({...item,unitSellingPrice:line.unitSellingPrice,lineAmount:lineAmount.toFixed(),priceRevision:1,
        details:{externalReferenceId:reference._id,externalLineId:externalLine._id}});
    }
    order.orderAmount=amount.toFixed();
    // Recording a source does not invent D07/D08 verification or its approver.
    await reference.save({session});
    const attachment=await new Attachment({ownerDocumentType:'sales_orders',ownerDocumentId:order._id,ownerRevision:1,purpose:'SOURCE_ORDER',
      originalName:evidence.originalName,mediaType:evidence.mediaType,sizeBytes:evidence.sizeBytes,storageKey:evidence.storageKey,checksum:evidence.checksum,
      uploadedBy:actor._id,uploadedAt:new Date(evidence.iat*1000),accessCategory:'SALES_PRICE',status:'ATTACHED'}).save({session});
    order.evidenceIds=[attachment._id];await order.save({session});return {document:order};
  });
}

