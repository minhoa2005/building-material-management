import * as m from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { ApiError, validationError, notFoundError, versionConflict } from '../../shared/utils/ApiError.js';
import { requirePermission, requireWarehouseAccess, canAccessWarehouse, hasPermission } from '../../shared/utils/access.js';
import { command, newId, same, saveVersion, checkVersion, hash } from '../../shared/utils/document-command.js';
import { transaction, serialize } from '../../shared/utils/persistence.js';
import { balanceAt, sourceContext, guardLocations, locationAt, beginStock, splitPortions, remainingReservation, pendingTaskQuantity, heldQuantity, verifyCapacity, receiveStock } from '../../shared/utils/stock.js';
export { m, exact, ApiError, validationError, notFoundError, versionConflict, requirePermission, requireWarehouseAccess, canAccessWarehouse, hasPermission, command, newId, same, saveVersion, checkVersion, hash, transaction, serialize, balanceAt, sourceContext, guardLocations, locationAt, beginStock, splitPortions, remainingReservation, pendingTaskQuantity, heldQuantity, verifyCapacity, receiveStock };
export const resources = {
 'defects': [m.DefectReport,'defect:read'], 'customer-returns': [m.CustomerReturn,'customer_return:read'],
 'failed-deliveries': [m.FailedDelivery,'customer_return:read'], 'supplier-returns': [m.SupplierReturn,'supplier_return:read'],
};
export const sum = (rows, field = 'qtyBase') => rows.reduce((n,row) => n.plus(String(row[field] ?? '0')), exact('0'));
export const source = (doc,item,relationCode='SOURCE',qty) => ({ subjectCollection: doc.constructor.collection.name, documentId:doc._id, ...(item && {itemId:item._id}), relationCode, ...(qty && {linkedQty:String(qty)}) });
export const ref = (doc,item) => ({ documentType:doc.constructor.collection.name, documentId:doc._id, ...(item && {itemId:item._id}), revision:doc.version });
export function envelope(Model,user,header,items=[],status='OPEN',note) {
 const id=newId();return new Model({_id:id,documentNo:`${Model.modelName}-${id}`,workflowStatus:status,version:1,createdBy:user._id,occurredAt:new Date(),header,items,note});
}
export function copy(sourceItem,quantity,lineNo=1,extra={}) {
 const amount=exact(quantity),factor=exact(sourceItem.baseUnitsPerUnit),entered=amount.div(factor);
 if(!amount.gt(0)||!entered.mul(factor).eq(amount)||entered.decimalPlaces()>6) throw validationError('Lượng không biểu diễn chính xác theo quy đổi lịch sử');
 return {_id:newId(),lineNo,lineKind:'STANDARD',productId:sourceItem.productId,lotId:sourceItem.lotId,enteredUnit:sourceItem.enteredUnit,baseUnitSnapshot:sourceItem.baseUnitSnapshot,baseUnitsPerUnit:String(sourceItem.baseUnitsPerUnit),packagingSnapshot:sourceItem.packagingSnapshot,enteredQty:entered.toFixed(),qtyBase:amount.toFixed(),productNameSnapshot:sourceItem.productNameSnapshot,...extra};
}
export async function fromBalance(balance,quantity,session,extra={}) {
 const batch=await m.ProductBatch.findById(balance.batchId).session(session),product=batch&&await m.Product.findById(batch.productId).session(session);
 if(!batch||!product?.isActive||batch.identificationStatus!=='VERIFIED'||(product.wholeBaseUnits&&!exact(quantity).isInteger()))throw validationError('Lô hoặc số lượng không hợp lệ');
 return {_id:newId(),lineNo:1,lineKind:'STANDARD',productId:product._id,lotId:batch._id,enteredUnit:product.baseUnit,baseUnitSnapshot:product.baseUnit,baseUnitsPerUnit:'1',enteredQty:String(quantity),qtyBase:String(quantity),productNameSnapshot:product.name,...extra};
}
export async function scoped(Model,id,user,session,permission) {
 if(permission)requirePermission(user,permission);
 const doc=await Model.findById(id).session(session);
 if(!doc)throw notFoundError();
 let warehouse=doc.header?.warehouseId;
 if(!warehouse&&Model===m.DefectReport){
  const balances=await m.InventoryBalance.find({_id:{$in:doc.items.map(i=>i.balanceId).filter(Boolean)}}).session(session);
  const points=await m.StockHoldingPoint.find({_id:{$in:balances.map(b=>b.holdingPointId)}}).session(session);
  const locations=await m.WarehouseLocation.find({_id:{$in:points.map(p=>p.locationId).filter(Boolean)}}).session(session);
  const ids=[...new Set(locations.map(l=>String(l.warehouseId)))];if(ids.length===1)warehouse=ids[0];
 }
 if(!warehouse&&Model===m.SalesOrder){const requests=await m.WarehouseIssueRequest.find({'header.salesOrderId':doc._id}).session(session);const accessible=requests.find(r=>canAccessWarehouse(user,r.header.requestedWarehouseId));warehouse=accessible?.header.requestedWarehouseId;}
 if(!warehouse&&Model===m.SalesOrder){const requests=await m.WarehouseIssueRequest.find({'header.salesOrderId':doc._id}).session(session);warehouse=requests.find(r=>canAccessWarehouse(user,r.header.requestedWarehouseId))?.header.requestedWarehouseId;}
 if(!warehouse)throw notFoundError('Không xác định được kho của hồ sơ');
 requireWarehouseAccess(user,warehouse);
 if(Model===m.CustomerReturn && hasPermission(user,'customer_return:create')&&!hasPermission(user,'customer_return:inspect')&&!hasPermission(user,'customer_return:approve_exception')&&!same(doc.createdBy,user._id))throw notFoundError();
 return doc;
}
export const replay = Model => (id,user,session) => scoped(Model,id,user,session);
export async function evidence(doc,ids,session) {
 if(!ids?.length)throw validationError('Cần chứng cứ đã tải lên');
 const rows=await m.Attachment.find({_id:{$in:ids},ownerDocumentId:doc._id,status:'ATTACHED',accessCategory:'BUSINESS'}).session(session);
 if(rows.length!==new Set(ids.map(String)).size)throw validationError('Chứng cứ không thuộc hồ sơ hoặc chưa được lưu');
 return rows;
}
export async function itemById(Model,itemId,user,session) {
 const doc=await Model.findOne({'items._id':itemId}).session(session);if(!doc)throw notFoundError();
 if(doc.header?.warehouseId)requireWarehouseAccess(user,doc.header.warehouseId);
 return {doc,item:doc.items.id(itemId)};
}
export async function lockSource(doc,item,session) {
 const sourceKey=`${doc.constructor.collection.name}:${doc._id}:${item._id}`;
 await m.ReturnSourceLock.updateOne({sourceKey},{$setOnInsert:{sourceKind:doc.constructor.collection.name,sourceDocumentId:doc._id,sourceItemId:item._id},$inc:{version:1}},{session,upsert:true});
}
export const remainingClaim = claim => exact(claim.claimedQtyBase).minus(sum(claim.events.filter(e=>['RECEIVED','RELEASED'].includes(e.kind)),'quantityBase'));
export async function claimTotal(sourceId,kind,session) {
 const claims=await m.ReturnQuantityClaim.find({sourceLineId:sourceId,claimKind:kind}).session(session);
 // Received claims remain charged to the original source; released portions do not.
 return claims.reduce((n,c)=>n.plus(exact(c.claimedQtyBase).minus(sum(c.events.filter(e=>e.kind==='RELEASED'),'quantityBase'))),exact('0'));
}
export async function resolveClaim(itemId,quantity,kind,document,user,session) {
 const claim=await m.ReturnQuantityClaim.findOne({requestLineId:itemId}).session(session);
 if(!claim||exact(quantity).gt(remainingClaim(claim)))throw validationError('Vượt hạn mức trả còn lại');
 const before=claim.version;claim.events.push({kind,quantityBase:String(quantity),sourceRef:ref(document),performedBy:user._id,performedAt:new Date()});claim.version++;
 await claim.validate();const result=await m.ReturnQuantityClaim.updateOne({_id:claim._id,version:before},{$set:{events:claim.events},$inc:{version:1}},{session});if(result.matchedCount!==1)throw versionConflict();
}
export async function effectivePosted(doc,itemId,session) {
 if(doc.workflowStatus!=='POSTED')return exact('0');
 const roots=await m.StockTransaction.find({sourceId:doc._id,reversedTransactionId:{$exists:false}}).session(session);
 let total=exact('0');
 for(const root of roots){let active=true,current=root,seen=new Set();while(current){if(seen.has(String(current._id)))throw validationError('Lịch sử đảo có vòng lặp');seen.add(String(current._id));const next=await m.StockTransaction.findOne({reversedTransactionId:current._id}).session(session);if(!next)break;active=!active;current=next;}if(active)total=total.plus(sum(root.movements.filter(x=>same(x.sourceLineId,itemId)&&(['GI_SALE','GI_SUPPLIER_RETURN'].includes(doc.documentKind)?x.fromBalanceId:x.toBalanceId)),'quantityBase'));}
 return total;
}
export async function issueSource(itemId,user,session) {
 const {doc,item}=await itemById(m.SalesGoodsIssue,itemId,user,session);
 const od=await m.DeliveryOrder.findOne({'items._id':item.details.outboundDeliveryLineId}).session(session);
 const odItem=od?.items.id(item.details.outboundDeliveryLineId);
 const wir=odItem&&await m.WarehouseIssueRequest.findOne({'items._id':odItem.details.issueRequestLineId}).session(session);
 const wirItem=wir?.items.id(odItem.details.issueRequestLineId);
 const so=wirItem&&await m.SalesOrder.findById(wir.header.salesOrderId).session(session);
 const soItem=so?.items.id(wirItem.details.salesOrderLineId);
 if(!soItem||!same(od.header.issueRequestId,wir._id)||![odItem,wirItem,soItem].every(i=>same(i.productId,item.productId)))throw validationError('Chuỗi SO/WIR/OD/GI không hợp lệ');
 await lockSource(doc,item,session);
 const issued=await effectivePosted(doc,itemId,session);
 const delivered=sum(so.deliveryConfirmations.filter(c=>c.workflowStatus==='CONFIRMED').flatMap(c=>c.items).filter(i=>same(i.details.salesIssueLineId,itemId)));
 return {doc,item,od,odItem,wir,wirItem,so,soItem,issued,delivered};
}
export async function takeStock(balanceId,quantity,itemId,posting,user,session,{holdId,reservationDocumentId}={}) {
 const ctx=await sourceContext(balanceId,session),{balance,location,product}=ctx;
 if(!location)throw validationError('Tồn nguồn không nằm trong ô kho');requireWarehouseAccess(user,location.warehouseId);await guardLocations([location._id],session);
 const amount=exact(quantity),before=exact(balance.quantityBase);
 if(!amount.gt(0)||(product.wholeBaseUnits&&!amount.isInteger()))throw validationError('Lượng thực hiện không hợp lệ');
 const reservations=await m.StockReservation.find({balanceId}).session(session);
 const own=reservations.filter(r=>same(r.demandRef.documentId,reservationDocumentId)),other=reservations.filter(r=>!same(r.demandRef.documentId,reservationDocumentId));
 const blocked=await heldQuantity(balanceId,session,holdId),pending=await pendingTaskQuantity(balanceId,session);
 if(amount.plus(sum(other.map(r=>({qtyBase:remainingReservation(r)})))).plus(blocked).plus(pending).gt(before))throw validationError('Không đủ tồn tự do hoặc tồn đang bị chặn');
 const {kept,taken}=splitPortions(balance.packagingPortions,amount,user._id);balance.quantityBase=before.minus(amount).toFixed();balance.packagingPortions=kept;await balance.validate();
 const result=await m.InventoryBalance.updateOne({_id:balance._id,version:balance.version},{$set:{quantityBase:balance.quantityBase,packagingPortions:kept},$inc:{version:1}},{session});if(result.matchedCount!==1)throw versionConflict();
 let consume=amount;for(const r of own){const available=remainingReservation(r),q=available.lt(consume)?available:consume;if(!q.gt(0))continue;const result=await m.StockReservation.updateOne({_id:r._id,version:r.version},{$set:{consumedQty:exact(r.consumedQty).plus(q).toFixed()},$inc:{version:1}},{session});if(result.matchedCount!==1)throw versionConflict();consume=consume.minus(q);}
 posting.movements.push({transactionId:posting._id,lineNo:posting.movements.length+1,sourceLineId:itemId,fromBalanceId:balance._id,quantityBase:amount.toFixed(),fromBefore:before.toFixed(),fromAfter:balance.quantityBase});
 return {ctx,portions:taken};
}
export async function postIn(doc,item,user,session,posting,{locationId,qualityCode,ownerType='STORE',ownerId=null,portions}={}) {
 const loc=await locationAt(locationId,doc.header.warehouseId,qualityCode==='GOOD'?['RECEIVING','STORAGE','CUSTODY']:['QUARANTINE','CUSTODY'],session);
 if(ownerType==='STORE'&&loc.locationType==='CUSTODY')throw validationError('Hàng sở hữu không nhập vào ô giữ hộ');
 await guardLocations([loc._id],session);
 const balance=await balanceAt({type:'LOCATION',locationId:loc._id},{batchId:item.lotId,ownerType,ownerId},qualityCode,session);
 await receiveStock(balance,item,portions,posting,user,session);await verifyCapacity([loc._id],session);return balance;
}
export async function savePosted(doc,posting,user,session) {
 await posting.save({session});doc.stockTransactionId=posting._id;doc.postedBy=user._id;doc.postedAt=new Date();doc.workflowStatus='POSTED';await doc.save({session});return doc;
}
export async function assertWholeQuantity(productId, quantity, session) {
 const product = await m.Product.findById(productId).select('wholeBaseUnits').session(session);
 if (!product || product.wholeBaseUnits && !exact(quantity).isInteger()) throw validationError('Số lượng phải nguyên theo đơn vị gốc của sản phẩm');
}
