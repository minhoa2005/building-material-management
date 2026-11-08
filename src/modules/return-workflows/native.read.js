import { redactPrices } from '../sales-orders/sales-read.service.js';
import { createHash } from 'node:crypto';
import * as s from './native.shared.js';
import { inspectFile, evidenceStorage } from '../po-receiving/purchase-evidence.service.js';
import { currentRole } from '../../shared/utils/userRole.js';
const {m,serialize,scoped,hasPermission,requirePermission,requireWarehouseAccess,canAccessWarehouse,notFoundError,validationError,same,exact,newId,source,ref,command,saveVersion,checkVersion}=s;
const rootEntries=[...Object.values(s.resources),[m.SupplierReturnIssue,'supplier_return:read'],[m.CustodyRelease,'supplier_return:read'],[m.PurchaseOrder,'external_reference:create'],[m.PurchaseReceipt,'external_reference:create'],[m.SalesOrder,'external_reference:create']];
const scope=user=>currentRole(user)?.code==='OWNER'?{}:{'header.warehouseId':{$in:user.warehouseIds??[]}};
export async function parent(user,id,session,write=false){
 for(const [Model,permission] of rootEntries){const found=await Model.exists({_id:id}).session(session);if(!found)continue;if(!hasPermission(user,permission)&&!hasPermission(user,'stock_movement:read'))requirePermission(user,permission);const doc=await scoped(Model,id,user,session);
  if(write){const permissions=Model===m.DefectReport?['defect:create','defect:execute']:Model===m.CustomerReturn?['customer_return:create','customer_return:inspect']:Model===m.FailedDelivery?['customer_return:inspect']:Model===m.SupplierReturn?['supplier_return:create','supplier_return:record_agreement','supplier_return:dispatch']:['external_reference:create'];if(!permissions.some(p=>hasPermission(user,p)))throw new s.ApiError(403,'Không có quyền ghi chứng cứ');}
  return doc;
 }throw notFoundError();
}
export async function list(user,resource,query){
 const [Model,permission]=s.resources[resource];requirePermission(user,permission);const filter={...scope(user)};
 if(resource==='customer-returns'&&hasPermission(user,'customer_return:create')&&!hasPermission(user,'customer_return:inspect')&&!hasPermission(user,'customer_return:approve_exception'))filter.createdBy=user._id;
 if(query.warehouseId){requireWarehouseAccess(user,query.warehouseId);filter['header.warehouseId']=query.warehouseId;}
 if(query.status)filter.workflowStatus=query.status;if(query.supplierId)filter['header.supplierId']=query.supplierId;
 if(query.search){const re=query.search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');filter.$or=[{documentNo:{$regex:re,$options:'i'}},{note:{$regex:re,$options:'i'}},{'header.agreementReference':{$regex:re,$options:'i'}}];}
 if(query.lotId)filter['items.lotId']=query.lotId;if(query.hasEvidence)filter['evidenceIds.0']={$exists:query.hasEvidence==='yes'};
 if(query.unresolvedOnly)filter.workflowStatus=query.unresolvedOnly==='yes'?{$nin:['CLOSED','COMPLETED']}:{$in:['CLOSED','COMPLETED']};
 if(query.disposition)filter['resolutionPlans.items.details.outcome']=query.disposition;
 if(query.sourceKind)filter['header.sourceKind']=query.sourceKind;
 if(query.locationId){const points=await m.StockHoldingPoint.find({locationId:query.locationId});const balances=await m.InventoryBalance.find({holdingPointId:{$in:points.map(p=>p._id)}});filter['items.balanceId']={$in:balances.map(b=>b._id)};}
 if(query.ownerPartyId)filter.items={$elemMatch:{ownerId:query.ownerPartyId}};
 const page=query.page??1,limit=query.limit??25;const [items,total]=await Promise.all([Model.find(filter).sort({createdAt:-1,_id:-1}).skip((page-1)*limit).limit(limit),Model.countDocuments(filter)]);return {items:items.map(serialize),total,page,limit};
}
export async function detail(user,resource,id){
 const [Model,permission]=s.resources[resource],doc=await scoped(Model,id,user,undefined,permission);
 const related=[];for(const Related of [m.StockScrapRecord,m.StockQualityChange,m.CustomerReturnReceipt,m.FailedDeliveryReceipt,m.SupplierReturnIssue,m.CustodyReceipt,m.CustodyRelease,m.GoodsInspection]){
  const rows=await Related.find({...scope(user),$or:[{'items.sources.documentId':doc._id},{'sources.documentId':doc._id},{'header.returnId':doc._id},{'header.supplierReturnId':doc._id},{'header.planId':{$in:(doc.resolutionPlans??[]).map(p=>p._id)}}]});related.push(...rows.map(serialize));
 }
 const attachments=await m.Attachment.find({ownerDocumentId:doc._id,status:'ATTACHED',accessCategory:'BUSINESS'}).select('-storageKey -checksum -uploadSessionId');
 const history=await m.AuditLog.find({subjectId:doc._id}).sort({createdAt:1}).select('-changes');const lots=await m.ProductBatch.find({_id:{$in:doc.items.map(item=>item.lotId).filter(Boolean)}}).select('manufacturerLot');const products=await m.Product.find({_id:{$in:doc.items.map(item=>item.productId)}}).select('wholeBaseUnits');const result={...serialize(doc),items:doc.items.map(item=>({...serialize(item),wholeBaseUnits:products.find(product=>same(product._id,item.productId))?.wholeBaseUnits,lotCode:lots.find(lot=>same(lot._id,item.lotId))?.manufacturerLot})),...(Model===m.DefectReport&&{unresolvedQty:doc.holds.filter(h=>h.status==='ACTIVE').reduce((n,h)=>n.plus(s.sum(h.allocations,'quantityBase').minus(s.sum(h.events,'quantityBase'))),exact('0')).toFixed()}),relatedDocuments:related,evidence:attachments.map(serialize),history:history.map(serialize)};return ['OWNER','ACCOUNTANT'].includes(currentRole(user)?.code)?result:redactPrices(result);
}
export async function listExternal(user,query){
 requirePermission(user,'external_reference:read');const filter=currentRole(user)?.code==='OWNER'?{}:{warehouseId:{$in:user.warehouseIds??[]}};
 if(query.search){const re=query.search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');filter.$or=['sourceSystem','referenceNo','correlationId'].map(field=>({[field]:{$regex:re,$options:'i'}}));}
 if(query.status)filter.status=query.status;const page=query.page??1,limit=query.limit??25;
 const [items,total]=await Promise.all([m.ExternalReference.find(filter).select('-items -evidenceIds').sort({createdAt:-1,_id:-1}).skip((page-1)*limit).limit(limit),m.ExternalReference.countDocuments(filter)]);
 return {items:items.map(serialize),total,page,limit};
}
export async function options(user,{compact=false}={}){
 if(!Object.values(s.resources).some(([,p])=>hasPermission(user,p))&&!hasPermission(user,'external_reference:create'))throw new s.ApiError(403,'Không có quyền');
 const warehouses=await m.Warehouse.find({isActive:true,...(currentRole(user)?.code!=='OWNER'&&{_id:{$in:user.warehouseIds??[]}})});
 if(compact)return {warehouses:warehouses.map(serialize),permissions:user.roleId.permissionIds.map(p=>p.code),locations:[],holdingPoints:[],balances:[],lots:[],customers:[],suppliers:[],sourceDocuments:[],sourceLines:[],holds:[]};
 const locations=await m.WarehouseLocation.find({warehouseId:{$in:warehouses.map(w=>w._id)},isActive:true});const points=await m.StockHoldingPoint.find({type:'LOCATION',locationId:{$in:locations.map(l=>l._id)}});const balances=await m.InventoryBalance.find({holdingPointId:{$in:points.map(p=>p._id)},quantityBase:{$gt:0}});
 const [lots,customers,suppliers]=await Promise.all([m.ProductBatch.find({identificationStatus:'VERIFIED'}),m.Customer.find({}).select('code name'),m.Supplier.find({status:'ACTIVE'}).select('code name')]);
 const sourceDocuments=[];if(hasPermission(user,'defect:create'))sourceDocuments.push(...await m.Stocktake.find(scope(user)));
 if(hasPermission(user,'supplier_return:create')||hasPermission(user,'external_reference:create')){for(const Model of [m.PurchaseReceipt,m.CustodyReceipt,m.PurchaseOrder,m.SupplierReturnIssue])sourceDocuments.push(...await Model.find(scope(user)).select('-header.unitPurchasePrice'));}
 if(hasPermission(user,'customer_return:create')||hasPermission(user,'customer_return:inspect')){const issues=await m.SalesGoodsIssue.find({...scope(user),workflowStatus:'POSTED'});for(const issue of issues){if(hasPermission(user,'customer_return:create')&&!hasPermission(user,'customer_return:inspect')){const item=issue.items[0];if(!item)continue;const od=await m.DeliveryOrder.findOne({'items._id':item.details.outboundDeliveryLineId}),wir=od&&await m.WarehouseIssueRequest.findById(od.header.issueRequestId),so=wir&&await m.SalesOrder.findById(wir.header.salesOrderId);if(!so||!same(so.createdBy,user._id))continue;}sourceDocuments.push(issue);}}
 const defects=hasPermission(user,'supplier_return:create')?await m.DefectReport.find(scope(user)):[];const holds=defects.flatMap(d=>d.holds.filter(h=>h.status==='ACTIVE'&&!h.stocktakeId).flatMap(h=>h.allocations.map(a=>({_id:String(h._id),balanceId:String(a.balanceId),name:d.documentNo,qtyBase:String(a.quantityBase)}))));
 const historical=hasPermission(user,'customer_return:create')?await m.ExternalReference.find({referenceKind:'HISTORICAL_DELIVERY',status:'VERIFIED',warehouseId:{$in:warehouses.map(w=>w._id)}}):[];
 const historicalLines=historical.flatMap(d=>d.items.map(i=>({...serialize(i),documentId:String(d._id),qtyBase:String(i.eligibleQty),details:{historicalExternalLineId:String(i._id)}})));
 const sourceLines=sourceDocuments.flatMap(d=>d.items.map(i=>({...serialize(i),documentId:String(d._id)})));
 // Options never expose financial snapshots or internal attachment storage keys.
 const safe=value=>Array.isArray(value)?value.map(safe):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!['unitPurchasePrice','unitSellingPrice','lineAmount','orderAmount','totalAmount','salePriceSnapshot','storageKey','checksum'].includes(key)).map(([k,v])=>[k,safe(v)])):value;
 return safe({holds,warehouses:warehouses.map(serialize),locations:locations.map(serialize),balances:balances.map(serialize),holdingPoints:points.map(serialize),lots:lots.map(serialize),customers:customers.map(serialize),suppliers:suppliers.map(serialize),sourceDocuments:sourceDocuments.map(serialize),sourceLines:[...sourceLines,...historicalLines],permissions:user.roleId.permissionIds.map(p=>p.code)});
}
export async function storeFile(file){const type=await inspectFile(file);const stored=await evidenceStorage.upload(file.buffer,{public_id:`sep490/returns/${newId()}`,resource_type:type.resourceType,type:'authenticated',overwrite:false});if(stored.type!=='authenticated')throw validationError('Chưa xác nhận lưu riêng tư');return {storageKey:stored.public_id,checksum:createHash('sha256').update(file.buffer).digest('hex'),mediaType:type.mediaType,sizeBytes:file.buffer.length,originalName:file.originalname};}
export async function attachStored(doc,stored,user,session){
 const attachment=await new m.Attachment({...stored,ownerDocumentType:doc.constructor.collection.name,ownerDocumentId:doc._id,ownerRevision:doc.version,purpose:'RETURN_EVIDENCE',uploadedBy:user._id,uploadedAt:new Date(),accessCategory:'BUSINESS',status:'ATTACHED'}).save({session});doc.evidenceIds.addToSet(attachment._id);return attachment;
}
export async function uploadEvidence(user,id,file){
 await parent(user,id,undefined,true);const stored=await storeFile(file);try{return await s.transaction(async session=>{const doc=await parent(user,id,session,true);const attachment=await attachStored(doc,stored,user,session);await saveVersion(doc,doc.version,session);return serialize(attachment);});}catch(error){// A network/unknown-commit error can follow a committed attachment; retain that asset.
 if([400,403,404,409,422].includes(error.statusCode))await evidenceStorage.destroy(stored.storageKey,stored.mediaType==='application/pdf'?'raw':'image').catch(()=>{});throw error;}
}
export async function downloadEvidence(user,id,evidenceId){await parent(user,id);const attachment=await m.Attachment.findOne({_id:evidenceId,ownerDocumentId:id,status:'ATTACHED',accessCategory:'BUSINESS'});if(!attachment)throw notFoundError();return {url:evidenceStorage.download(attachment.storageKey,attachment.mediaType==='application/pdf'?'pdf':attachment.mediaType==='image/png'?'png':'jpg',attachment.mediaType==='application/pdf'?'raw':'image',Math.floor(Date.now()/1000)+60)};}
export async function traceLot(user,id){
 requirePermission(user,'stock_movement:read');const lot=await m.ProductBatch.findById(id);if(!lot)throw notFoundError();const purchasingOnly=currentRole(user)?.code==='ACCOUNTANT';
 const Models=purchasingOnly?[m.PurchaseOrder,m.GoodsArrival,m.GoodsInspection,m.PurchaseReceipt,m.SupplierReturn,m.SupplierReturnIssue,m.CustodyReceipt,m.CustodyRelease]:[m.PurchaseOrder,m.GoodsArrival,m.GoodsInspection,m.PurchaseReceipt,m.SupplierReturn,m.SupplierReturnIssue,m.CustodyReceipt,m.CustodyRelease,m.DefectReport,m.CustomerReturn,m.CustomerReturnReceipt,m.FailedDelivery,m.FailedDeliveryReceipt,m.SalesGoodsIssue,m.TransferOrder,m.TransferReceipt,m.StockQualityChange,m.StockScrapRecord];
 const documents=[];for(const Model of Models)documents.push(...await Model.find({...scope(user),'items.lotId':id}));if(!purchasingOnly){for(const issue of documents.filter(d=>d.constructor===m.SalesGoodsIssue)){for(const item of issue.items.filter(i=>same(i.lotId,id))){const od=await m.DeliveryOrder.findOne({'items._id':item.details.outboundDeliveryLineId});const wir=od&&await m.WarehouseIssueRequest.findById(od.header.issueRequestId);const so=wir&&await m.SalesOrder.findById(wir.header.salesOrderId);for(const doc of [od,wir,so])if(doc&&!documents.some(d=>same(d._id,doc._id)))documents.push(doc);}}}
 const ids=documents.map(d=>d._id),itemIds=documents.flatMap(d=>d.items.filter(i=>same(i.lotId,id)).map(i=>i._id));
 const transactions=await m.StockTransaction.find({sourceId:{$in:ids}});const attachments=await m.Attachment.find({ownerDocumentId:{$in:ids},status:'ATTACHED',accessCategory:'BUSINESS'}).select('-storageKey -checksum -uploadSessionId');
 const history=await m.AuditLog.find({subjectId:{$in:ids}}).select('-changes');const reservations=await m.StockReservation.find({'demandRef.documentId':{$in:ids}});
 const result={lot:serialize(lot),documents:documents.map(serialize),items:documents.flatMap(d=>d.items.filter(i=>same(i.lotId,id)).map(serialize)),movements:transactions.flatMap(t=>t.movements.filter(v=>itemIds.some(id=>same(id,v.sourceLineId))).map(serialize)),reservations:reservations.map(serialize),evidence:attachments.map(serialize),history:history.map(serialize)};return ['OWNER','ACCOUNTANT'].includes(currentRole(user)?.code)?result:redactPrices(result);
}
export async function recordExternalReference(user,input){
 const root=await parent(user,input.documentId);const permission='external_reference:create';
 return command(user,'RECORD_EXTERNAL_REFERENCE',permission,input.documentId,input,async(id,actor,session)=>parent(actor,id,session),async(session,actor)=>{
 const doc=await parent(actor,root._id,session);checkVersion(doc,input.expectedVersion);await s.evidence(doc,[input.evidenceId],session);
 if(input.warehouseId)requireWarehouseAccess(actor,input.warehouseId);const historical=input.referenceKind==='HISTORICAL_DELIVERY';if(historical&&(!input.customerId||!input.warehouseId||input.status!=='VERIFIED'))throw validationError('Nguồn lịch sử cần khách, kho và xác minh');
 if(historical&&await m.SalesOrder.exists({'header.externalReferenceId':{$in:doc.externalReferenceIds??[]}}).session(session))throw validationError('Đã có chuỗi WMS cạnh tranh');
 const external=new m.ExternalReference({sourceSystem:input.sourceSystem,referenceKind:input.referenceKind,referenceNo:input.referenceNo,referenceDate:input.referenceDate,sourceVersion:input.sourceVersion,correlationId:input.correlationId,status:input.status,customerId:input.customerId,warehouseId:input.warehouseId??doc.header.warehouseId,evidenceIds:[input.evidenceId],note:input.note,...(input.status==='VERIFIED'&&{verifiedBy:actor._id,verifiedAt:new Date()}),items:[]});
 for(const row of input.lines){const item=doc.items.id(row.lineId);if(!item)throw validationError('Dòng không thuộc chứng từ');const matched=await m.ExternalReference.find({referenceKind:input.referenceKind,'items.lineKey':String(item._id)}).session(session);const alreadyMatched=s.sum(matched.flatMap(r=>r.items).filter(i=>i.lineKey===String(item._id)),'eligibleQty');if(!historical&&exact(row.qtyBase).plus(alreadyMatched).gt(String(item.qtyBase)))throw validationError('Vượt lượng nguồn');const lot=await m.ProductBatch.findById(row.lotId??item.lotId).session(session);if(!lot||!same(lot.productId,item.productId))throw validationError('Lô sai sản phẩm');const factor=row.baseUnitsPerUnit??String(item.baseUnitsPerUnit);if(exact(row.returnedQty??'0').gt(row.qtyBase))throw validationError('Lượng đã trả vượt nguồn');
  external.items.push({_id:newId(),lineKey:String(item._id),productId:item.productId,eligibleQty:row.qtyBase,lotId:lot._id,enteredUnit:row.enteredUnit??item.enteredUnit,baseUnitSnapshot:item.baseUnitSnapshot,baseUnitsPerUnit:factor,previouslyReturnedQty:row.returnedQty??'0'});
 }await external.save({session});doc.externalReferenceIds.addToSet(external._id);return {document:await saveVersion(doc,input.expectedVersion,session),versionBefore:input.expectedVersion,resultRefs:[ref(external)]};
 });
}
export async function createHistoricalSource(user,input,stored){
 if(!stored)throw validationError('Historical verification requires an uploaded file');
 const payload={...input,evidenceChecksum:stored.checksum};
 return command(user,'VERIFY_HISTORICAL_DELIVERY','external_reference:create',null,payload,async(id,actor,session)=>{const reference=await m.ExternalReference.findById(id).session(session);if(!reference)throw notFoundError();requireWarehouseAccess(actor,reference.warehouseId);},async(session,actor)=>{
  requireWarehouseAccess(actor,input.warehouseId);if(!await m.Customer.exists({_id:input.customerId}).session(session))throw validationError('Unknown customer');
  if(await m.SalesOrder.exists({'header.externalReferenceId':{$in:(await m.ExternalReference.find({sourceSystem:input.sourceSystem,referenceNo:input.referenceNo}).session(session)).map(r=>r._id)}}).session(session))throw validationError('An existing WMS order already represents this source');
  const external=new m.ExternalReference({sourceSystem:input.sourceSystem,referenceKind:'HISTORICAL_DELIVERY',referenceNo:input.referenceNo,referenceDate:input.referenceDate,correlationId:input.correlationId,customerId:input.customerId,warehouseId:input.warehouseId,note:input.note,status:'VERIFIED',verifiedBy:actor._id,verifiedAt:new Date(),items:[]});
  for(const [index,row] of input.lines.entries()){const batch=await m.ProductBatch.findOne({_id:row.lotId,identificationStatus:'VERIFIED'}).session(session),product=batch&&await m.Product.findById(batch.productId).session(session);if(!product||!same(batch.productId,row.productId)||(product.wholeBaseUnits&&(!exact(row.qtyBase).isInteger()||!exact(row.returnedQty??'0').isInteger()))||exact(row.returnedQty??'0').gt(row.qtyBase))throw validationError('Historical product, batch or quantity is invalid');
   external.items.push({_id:newId(),lineKey:row.lineKey??String(index+1),productId:product._id,lotId:batch._id,eligibleQty:row.qtyBase,enteredUnit:row.enteredUnit,baseUnitSnapshot:product.baseUnit,baseUnitsPerUnit:row.baseUnitsPerUnit,previouslyReturnedQty:row.returnedQty??'0'});
  }await attachStored(external,stored,actor,session);await external.save({session});return {document:external};
 });
}
