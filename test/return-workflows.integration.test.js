import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import * as service from '../src/modules/return-workflows/native.service.js';
import * as reads from '../src/modules/return-workflows/native.read.js';
import * as issues from '../src/modules/goods-issues/goods-issue.service.js';
import * as salesExecution from '../src/modules/sales-orders/sales-execution.service.js';
import { lookup } from '../src/modules/return-workflows/native.lookup.js';
import { processNotificationEvent } from '../src/modules/notifications/worker.js';
import { buildReviewedDemo } from '../src/seeds/rebuild/data.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';
const enabled=process.env.RUN_RETURNS_NATIVE_TESTS==='1',id=()=>new mongoose.Types.ObjectId(),sid=v=>String(v._id??v),key=()=>String(id());
const stored={storageKey:'isolated-test/evidence',checksum:'a'.repeat(64),mediaType:'image/png',sizeBytes:100,originalName:'test.png'};
let users,warehouse,location,balance,receipt,batch,supplier,customer,receiving,custody,quarantine;
const input=()=>({idempotencyKey:key(),note:'Actual test facts'});
async function attachment(doc,user){return m.Attachment.create({...stored,ownerDocumentType:doc.constructor.collection.name,ownerDocumentId:doc._id,purpose:'RETURN_EVIDENCE',uploadedBy:user._id,uploadedAt:new Date(),accessCategory:'BUSINESS',status:'ATTACHED'});}
async function legacyHistoricalSource(qtyBase) {
 const verifier=users.ACCOUNTANT;
 const external=new m.ExternalReference({
  sourceSystem:'LEGACY-DELIVERY',referenceKind:'HISTORICAL_DELIVERY',referenceNo:key(),referenceDate:new Date(),
  correlationId:key(),customerId:customer._id,warehouseId:warehouse._id,status:'VERIFIED',verifiedBy:verifier._id,verifiedAt:new Date(),
  items:[{lineKey:'1',productId:batch.productId,lotId:batch._id,eligibleQty:qtyBase,enteredUnit:'PIECE',baseUnitSnapshot:receipt.items[0].baseUnitSnapshot,baseUnitsPerUnit:'1'}],
 });
 await reads.attachStored(external,stored,verifier);
 return external.save();
}
test.before(async()=>{
 if(!enabled)return;await mongoose.connect(`mongodb://127.0.0.1:${process.env.RUN_HIEUDT_TESTS === '1' ? 27018 : 27017}/returns_test_${id()}?replicaSet=${process.env.RUN_HIEUDT_TESTS === '1' ? 'hieudt-test' : 'rs0'}`,{serverSelectionTimeoutMS:10000});
 const data=await buildReviewedDemo();for(const [name,Model]of m.models){await Model.createCollection();if(data[name]?.length)await Model.collection.insertMany(data[name]);await Model.createIndexes();}
 users={};for(const code of ['OWNER','WAREHOUSE','SALES','ACCOUNTANT']){const role=await m.Role.findOne({code});const u=await m.User.findOne({roleId:role._id});u.warehouseIds=(await m.Warehouse.find()).map(w=>w._id);await u.save();users[code]=await m.User.findById(u._id).populate({path:'roleId',populate:{path:'permissionIds'}});}
 warehouse=await m.Warehouse.findOne({code:'WH01'});if(!warehouse)warehouse=await m.Warehouse.findOne();
 location=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:'RET-TEST',locationType:'STORAGE',isPickable:true,usableLengthMm:5000,usableWidthMm:5000});
 receipt=await m.PurchaseReceipt.findOne();batch=await m.ProductBatch.findById(receipt.items[0].lotId);const product=await m.Product.findById(batch.productId);
 const point=await m.StockHoldingPoint.create({type:'LOCATION',locationId:location._id});balance=await m.InventoryBalance.create({holdingPointId:point._id,batchId:batch._id,qualityStatus:'GOOD',ownerType:'STORE',ownerId:null,quantityBase:'40',version:0,packagingPortions:[{packagingState:'SEALED',quantityBase:'40',sealedPackCount:40/batch.piecesPerCarton,packagingSnapshot:{packageUnit:'BOX',baseUnitsPerPackage:String(batch.piecesPerCarton),outerLengthMm:batch.cartonLengthMm,outerWidthMm:batch.cartonWidthMm,outerHeightMm:batch.cartonHeightMm},createdBy:users.WAREHOUSE._id}]});
 supplier=await m.Supplier.findOne();customer=await m.Customer.findOne();
 for(const [name,kind]of [['receiving','RECEIVING'],['custody','CUSTODY'],['quarantine','QUARANTINE']]){const loc=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:`RET-${name}`,locationType:kind,usableLengthMm:5000,usableWidthMm:5000});if(name==='receiving')receiving=loc;if(name==='custody')custody=loc;if(name==='quarantine')quarantine=loc;}
});
test.after(async()=>{if(enabled){if(!/^returns_test_[a-f\d]{24}$/.test(mongoose.connection.name))throw new Error('Unsafe test DB');await mongoose.connection.dropDatabase();await mongoose.disconnect();}});
const run=(name,fn)=>test(name,{skip:!enabled},fn);
run('defect proposal, independent review, partial execution, replay and scope',async()=>{
 const body={...input(),warehouseId:sid(warehouse),balanceId:sid(balance),quantity:'8',sourceKind:'MANUAL',reason:'Cracked tiles',disposition:{outcome:'SCRAP',quantity:'8',reason:'Unsafe'}};
 const created=await service.createDefect(users.WAREHOUSE,body,stored);assert.equal((await service.createDefect(users.WAREHOUSE,body,stored)).id,created.id);
 let doc=await m.DefectReport.findById(created.id);await assert.rejects(service.decideDefect(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,decision:'APPROVE',reason:'Review'}));
 await service.decideDefect(users.OWNER,doc.id,{...input(),expectedVersion:doc.version,decision:'APPROVE',reason:'Review'});doc=await m.DefectReport.findById(doc.id);
 const evidence=await attachment(doc,users.WAREHOUSE),execution={...input(),expectedVersion:doc.version,evidenceIds:[evidence.id],lines:[{lineId:sid(doc.resolutionPlans[0].items[0]),qtyBase:'4'}]};
 await service.executeDefect(users.WAREHOUSE,doc.id,execution);await service.executeDefect(users.WAREHOUSE,doc.id,execution);assert.equal(String((await m.InventoryBalance.findById(balance._id)).quantityBase),'36');
 doc=await m.DefectReport.findById(doc.id);await service.executeDefect(users.WAREHOUSE,doc.id,{...execution,...input(),expectedVersion:doc.version});assert.equal(String((await m.InventoryBalance.findById(balance._id)).quantityBase),'32');
 assert.equal((await m.DefectReport.findById(doc.id)).workflowStatus,'CLOSED');
 const outsider={...users.WAREHOUSE.toObject(),warehouseIds:[]};await assert.rejects(reads.detail(outsider,'defects',doc.id));
});
run('supplier proposal, agreement, dispatch, acknowledgement and close do not double-post',async()=>{
 const body={...input(),warehouseId:sid(warehouse),supplierId:sid(supplier),lines:[{originLineId:sid(receipt.items[0]),balanceId:sid(balance),qtyBase:'4'}]};
 const created=await service.createSupplierReturn(users.WAREHOUSE,body);let doc=await m.SupplierReturn.findById(created.id);const ev=await attachment(doc,users.ACCOUNTANT);
 assert.equal((await reads.detail(users.WAREHOUSE,'supplier-returns',doc.id)).counterpartyName,supplier.name);
 await service.supplierAgreement(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],reference:'Supplier confirmed four',lines:[{lineId:sid(doc.items[0]),qtyBase:'4'}]});doc=await m.SupplierReturn.findById(doc.id);
 const stockBeforeDispatch=Number((await m.InventoryBalance.findById(balance._id)).quantityBase);
 const dispatch={...input(),expectedVersion:doc.version,evidenceIds:[ev.id],recipientName:'Actual carrier',lines:[{lineId:sid(doc.items[0]),qtyBase:'4'}]};await service.dispatchSupplierReturn(users.WAREHOUSE,doc.id,dispatch);await service.dispatchSupplierReturn(users.WAREHOUSE,doc.id,dispatch);
 assert.equal(Number((await m.InventoryBalance.findById(balance._id)).quantityBase),stockBeforeDispatch-4);doc=await m.SupplierReturn.findById(doc.id);const issue=await m.SupplierReturnIssue.findOne({'header.supplierReturnId':doc._id});
 await service.acknowledgeSupplierReturn(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],lines:[{lineId:sid(issue.items[0]),qtyBase:'4',outcome:'ACCEPTED'}]});doc=await m.SupplierReturn.findById(doc.id);
 await service.closeSupplierReturn(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version});assert.equal((await m.SupplierReturn.findById(doc.id)).workflowStatus,'COMPLETED');assert.equal(Number((await m.InventoryBalance.findById(balance._id)).quantityBase),stockBeforeDispatch-4);
 while(await processNotificationEvent(new Date(0))){}
 const notices=await m.Notification.find({sourceType:'supplier_returns',sourceId:doc._id,recipientId:users.WAREHOUSE._id});
 assert.equal(notices.filter(notice=>notice.type==='ACK_SR').length,1);
 assert.equal(notices.filter(notice=>notice.type==='CLOSE_SR').length,1);
});
run('standalone sale 8, customer return 4 and supplier return 4 use separate lots',async()=>{
 const product=await m.Product.findById(batch.productId);
 const saleBatch=await m.ProductBatch.create({productId:product._id,manufacturerLot:'DEMO-SALE-LOT',identificationStatus:'VERIFIED',piecesPerCarton:4,cartonLengthMm:'620',cartonWidthMm:'620',cartonHeightMm:'50'});
 const saleStorage=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:'DEMO-SALE-STORAGE',locationType:'STORAGE',isPickable:true,usableLengthMm:5000,usableWidthMm:5000});
 const saleStaging=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:'DEMO-SALE-STAGING',locationType:'STAGING',usableLengthMm:5000,usableWidthMm:5000});
 const salePoint=await m.StockHoldingPoint.create({type:'LOCATION',locationId:saleStorage._id});
 const saleBalance=await m.InventoryBalance.create({holdingPointId:salePoint._id,batchId:saleBatch._id,qualityStatus:'GOOD',ownerType:'STORE',quantityBase:'8',version:0,packagingPortions:[{packagingState:'SEALED',quantityBase:'8',sealedPackCount:2,packagingSnapshot:{packageUnit:'BOX',baseUnitsPerPackage:'4',outerLengthMm:'620',outerWidthMm:'620',outerHeightMm:'50'},createdBy:users.WAREHOUSE._id}]});
 const stockTotal=async batchId=>(await m.InventoryBalance.find({batchId,ownerType:'STORE'})).reduce((total,row)=>total+Number(String(row.quantityBase)),0);
 const beforeSale=await stockTotal(saleBatch._id);
 const created=await issues.createIssue(users.WAREHOUSE,{...input(),expectedVersion:1,issueKind:'SALE',warehouseId:sid(warehouse),referenceNo:'SO-001',customerName:'Demo customer',customerPhone:'0900000000',lines:[{productId:sid(product),qtyBase:'8'}]});
 let sale=await m.SalesGoodsIssue.findById(created.id);assert.equal(sale.workflowStatus,'DRAFT');assert.equal(await stockTotal(saleBatch._id),beforeSale);
 const picking=await issues.createIssuePicking(users.WAREHOUSE,sale.id,{...input(),expectedVersion:sale.version,allocations:[{lineId:sid(sale.items[0]),sourceBalanceId:sid(saleBalance),qtyBase:'8',locationId:sid(saleStaging)}]});
 let task=await m.TransferOrder.findById(picking.id);await salesExecution.confirmPicking(users.WAREHOUSE,task.id,{...input(),expectedVersion:task.version,lines:task.items.map(item=>({lineId:sid(item),qtyBase:'8'}))});
 sale=await m.SalesGoodsIssue.findById(sale.id);assert.equal(sale.workflowStatus,'PICKED');await issues.postIssue(users.WAREHOUSE,sale.id,{...input(),expectedVersion:sale.version,recipientName:'Demo carrier'});
 sale=await m.SalesGoodsIssue.findById(sale.id);assert.equal(sale.workflowStatus,'POSTED');assert.equal(await stockTotal(saleBatch._id),beforeSale-8);
 const source=await lookup(users.SALES,{kind:'sources',purpose:'customer-returns',warehouseId:sid(warehouse),search:'SO-001',page:1,limit:10});
 const sourceRow=source.items.find(row=>row.documentId===sid(sale));assert.equal(sourceRow?.availableQty,'8');assert.equal(sourceRow?.referenceNo,'SO-001');assert.equal(sourceRow?.sourceLots?.[0]?.manufacturerLot,'DEMO-SALE-LOT');
 const returned=await service.createCustomerReturn(users.SALES,{...input(),warehouseId:sid(warehouse),lines:[{salesIssueLineId:sid(sale.items[0]),qtyBase:'4',reason:'Customer returned one carton'}]});
 let customerReturn=await m.CustomerReturn.findById(returned.id);const evidence=await attachment(customerReturn,users.WAREHOUSE);
 await service.inspectCustomerReturn(users.WAREHOUSE,customerReturn.id,{...input(),expectedVersion:customerReturn.version,evidenceIds:[sid(evidence)],lines:[{returnLineId:sid(customerReturn.items[0]),qtyReceived:'4',packagingCondition:'SEALED',installationStatus:'UNUSED',damageCause:'NONE',deadlineStatus:'WITHIN',deadlineReference:'Demo policy',assessmentReason:'One returned carton'}]});
 customerReturn=await m.CustomerReturn.findById(customerReturn.id);await service.decideCustomerReturn(users.SALES,customerReturn.id,{...input(),expectedVersion:customerReturn.version,decision:'APPROVE',reason:'Eligible demo return',lines:[{lineId:sid(customerReturn.items[0]),qtyBase:'4'}]});
 customerReturn=await m.CustomerReturn.findById(customerReturn.id);const beforeReturn=await stockTotal(saleBatch._id);await service.receiveCustomerReturn(users.WAREHOUSE,customerReturn.id,{...input(),expectedVersion:customerReturn.version,evidenceIds:[sid(evidence)],lines:[{lineId:sid(customerReturn.items[0]),qtyBase:'4',locationId:sid(receiving),qualityCode:'GOOD'}]});
 assert.equal(await stockTotal(saleBatch._id),beforeReturn+4);const afterReturn=await lookup(users.SALES,{kind:'sources',purpose:'customer-returns',warehouseId:sid(warehouse),documentId:sid(sale),page:1,limit:10});assert.equal(afterReturn.items.find(row=>row.documentId===sid(sale))?.availableQty,'4');
 await assert.rejects(service.createCustomerReturn(users.SALES,{...input(),warehouseId:sid(warehouse),lines:[{salesIssueLineId:sid(sale.items[0]),qtyBase:'5',reason:'Exceeds remaining source allowance'}]}),/Vượt lượng khách đã nhận còn được trả/);
 const supplierReturn=await service.createSupplierReturn(users.WAREHOUSE,{...input(),warehouseId:sid(warehouse),supplierId:sid(supplier),lines:[{originLineId:sid(receipt.items[0]),balanceId:sid(balance),qtyBase:'4'}]});
 let supplierDoc=await m.SupplierReturn.findById(supplierReturn.id);const supplierEvidence=await attachment(supplierDoc,users.ACCOUNTANT);
 await service.supplierAgreement(users.ACCOUNTANT,supplierDoc.id,{...input(),expectedVersion:supplierDoc.version,evidenceIds:[sid(supplierEvidence)],reference:'Demo supplier agreement',lines:[{lineId:sid(supplierDoc.items[0]),qtyBase:'4'}]});supplierDoc=await m.SupplierReturn.findById(supplierDoc.id);
 await service.dispatchSupplierReturn(users.WAREHOUSE,supplierDoc.id,{...input(),expectedVersion:supplierDoc.version,evidenceIds:[sid(supplierEvidence)],recipientName:'Supplier representative',lines:[{lineId:sid(supplierDoc.items[0]),qtyBase:'4'}]});supplierDoc=await m.SupplierReturn.findById(supplierDoc.id);const supplierIssue=await m.SupplierReturnIssue.findOne({'header.supplierReturnId':supplierDoc._id,workflowStatus:'POSTED'});assert.equal(String(supplierIssue.items[0].lotId),sid(batch));assert.notEqual(String(supplierIssue.items[0].lotId),sid(saleBatch));
 await service.acknowledgeSupplierReturn(users.ACCOUNTANT,supplierDoc.id,{...input(),expectedVersion:supplierDoc.version,evidenceIds:[sid(supplierEvidence)],lines:[{lineId:sid(supplierIssue.items[0]),qtyBase:'4',outcome:'ACCEPTED'}]});supplierDoc=await m.SupplierReturn.findById(supplierDoc.id);await service.closeSupplierReturn(users.ACCOUNTANT,supplierDoc.id,{...input(),expectedVersion:supplierDoc.version});assert.equal((await m.SupplierReturn.findById(supplierDoc.id)).workflowStatus,'COMPLETED');
});
run('customer custody, current inspection decision and receipt preserve physical quantity',async()=>{
 const issue=await m.SalesGoodsIssue.findOne({documentNo:{$exists:true}}).sort({occurredAt:1});const source=issue.items[0];
 const od=await m.DeliveryOrder.findOne({'items._id':source.details.outboundDeliveryLineId});const wir=await m.WarehouseIssueRequest.findById(od.header.issueRequestId);const order=await m.SalesOrder.findById(wir.header.salesOrderId);
 const legacyCustomer=await m.Customer.findById(order.header.customerId);assert.ok(legacyCustomer?.name);order.header.customerName=undefined;await order.save();
 const sales=await m.User.findById(order.createdBy).populate({path:'roleId',populate:{path:'permissionIds'}});sales.warehouseIds=[issue.header.warehouseId];await sales.save();
 const c=await service.createCustomerReturn(sales,{...input(),warehouseId:sid(issue.header.warehouseId),lines:[{salesIssueLineId:sid(source),qtyBase:'4',reason:'Unused cartons'}]});let doc=await m.CustomerReturn.findById(c.id);assert.equal(doc.header.customerName,legacyCustomer.name);const ev=await attachment(doc,users.WAREHOUSE);
 const inspection={...input(),expectedVersion:doc.version,evidenceIds:[ev.id],custodyLocationId:custody.id,lines:[{returnLineId:sid(doc.items[0]),qtyReceived:'4',packagingCondition:'SEALED',installationStatus:'UNUSED',damageCause:'NONE',deadlineStatus:'WITHIN',deadlineReference:'Verified contract',assessmentReason:'Unused intact goods'}]};
 await service.inspectCustomerReturn(users.WAREHOUSE,doc.id,inspection);doc=await m.CustomerReturn.findById(doc.id);
 await service.decideCustomerReturn(sales,doc.id,{...input(),expectedVersion:doc.version,decision:'APPROVE',reason:'Ordinary eligible return'});doc=await m.CustomerReturn.findById(doc.id);
 const { listSchema } = await import('../src/modules/return-workflows/native.validation.js');
 const listQuery = listSchema.parse({ query: { status: 'ACCEPTED,PARTIAL', receivable: 'true' } }).query;
 assert.ok((await reads.list(users.WAREHOUSE, 'customer-returns', listQuery)).items.some(row => row._id === doc.id));
 assert.equal((await reads.detail(users.WAREHOUSE, 'customer-returns', doc.id)).receivableLines[0].remainingQtyBase, '4');
 const ownedBefore=await m.InventoryBalance.find({ownerType:'STORE',batchId:batch._id}),totalBefore=ownedBefore.reduce((n,b)=>n+Number(String(b.quantityBase)),0);
 const receive={...input(),expectedVersion:doc.version,evidenceIds:[ev.id],lines:[{lineId:sid(doc.items[0]),qtyBase:'4',locationId:receiving.id,qualityCode:'GOOD'}]};await service.receiveCustomerReturn(users.WAREHOUSE,doc.id,receive);await service.receiveCustomerReturn(users.WAREHOUSE,doc.id,receive);
 const ownedAfter=await m.InventoryBalance.find({ownerType:'STORE',batchId:batch._id});assert.equal(ownedAfter.reduce((n,b)=>n+Number(String(b.quantityBase)),0),totalBefore+4);assert.equal((await m.CustomerReturn.findById(doc.id)).workflowStatus,'COMPLETED');
 const claim=await m.ReturnQuantityClaim.findOne({requestLineId:doc.items[0]._id});assert.equal(claim.events.at(-1).kind,'RECEIVED');
});
run('customer return stores and returns plain-text order reference without a Sales Order',async()=>{
 const external=await legacyHistoricalSource('8');
 for(const salesOrderReference of [undefined,'EXT-SO-019']){
  const result=await service.createCustomerReturn(users.SALES,{idempotencyKey:key(),warehouseId:warehouse.id,salesOrderReference,lines:[{historicalExternalLineId:sid(external.items[0]),qtyBase:'2',reason:'Unused cartons'}]});
  const doc=await reads.detail(users.SALES,'customer-returns',result.id);
  assert.equal(doc.header.salesOrderReference,salesOrderReference);
  assert.equal(doc.header.salesOrderId,undefined);
 }
});
run('multiple customer custody arrivals retain later packaging timestamps on receipt',async()=>{
 const location=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:'RET-MULTI-CUSTODY',locationType:'CUSTODY',usableLengthMm:5000,usableWidthMm:5000});
 const external=await legacyHistoricalSource('8'),returns=[];
 for(let i=0;i<2;i++){
  const created=await service.createCustomerReturn(users.SALES,{...input(),warehouseId:warehouse.id,lines:[{historicalExternalLineId:sid(external.items[0]),qtyBase:'4',reason:'Unused cartons'}]});let doc=await m.CustomerReturn.findById(created.id);assert.equal(doc.header.customerName,customer.name);const ev=await attachment(doc,users.WAREHOUSE);
  await service.inspectCustomerReturn(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],custodyLocationId:location.id,lines:[{returnLineId:sid(doc.items[0]),qtyReceived:'4',packagingCondition:'SEALED',installationStatus:'UNUSED',damageCause:'NONE',deadlineStatus:'WITHIN',deadlineReference:'Actual terms',assessmentReason:'Intact goods'}]});
  doc=await m.CustomerReturn.findById(doc.id);await service.decideCustomerReturn(users.SALES,doc.id,{...input(),expectedVersion:doc.version,decision:'APPROVE',reason:'Ordinary return'});returns.push({id:doc.id,evidenceId:ev.id});
 }
 const point=await m.StockHoldingPoint.findOne({locationId:location._id}),before=await m.InventoryBalance.findOne({holdingPointId:point._id});const retained=before.packagingPortions[1].toObject();
 const doc=await m.CustomerReturn.findById(returns[0].id);await service.receiveCustomerReturn(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[returns[0].evidenceId],lines:[{lineId:sid(doc.items[0]),qtyBase:'4',locationId:receiving.id,qualityCode:'GOOD'}]});
 const after=await m.InventoryBalance.findById(before._id);assert.equal(String(after.quantityBase),'4');assert.equal(after.packagingPortions.length,1);assert.equal(sid(after.packagingPortions[0]),sid(retained));assert.equal(after.packagingPortions[0].createdAt.getTime(),retained.createdAt.getTime());
});
run('failed delivery receives actual stock and reopens demand atomically with replay',async()=>{
 const original=await m.SalesGoodsIssue.findOne();const originalOd=await m.DeliveryOrder.findOne({'items._id':original.items[0].details.outboundDeliveryLineId});const originalWir=await m.WarehouseIssueRequest.findById(originalOd.header.issueRequestId);const originalSo=await m.SalesOrder.findById(originalWir.header.salesOrderId);
 const clone=doc=>{const x=doc.toObject();x._id=id();x.documentNo='TEST-'+id();x.version=1;x.items=x.items.map(i=>({...i,_id:id()}));delete x.createdAt;delete x.updatedAt;return x;};
 const so=clone(originalSo);so.header.externalReferenceId=id();so.deliveryConfirmations=[];so.paymentConfirmations=[];so.workflowStatus='OPEN';const order=await m.SalesOrder.create(so);
 const w=clone(originalWir);w.header.salesOrderId=order._id;w.items[0].details.salesOrderLineId=order.items[0]._id;const request=await m.WarehouseIssueRequest.create(w);
 const o=clone(originalOd);o.header.issueRequestId=request._id;o.items[0].details.issueRequestLineId=request.items[0]._id;const delivery=await m.DeliveryOrder.create(o);
 const g=clone(original);g.items[0].details.outboundDeliveryLineId=delivery.items[0]._id;g.items[0].qtyBase='4';g.items[0].enteredQty='4';g.items[0].baseUnitsPerUnit='1';g.items[0].enteredUnit='PIECE';const issue=await m.SalesGoodsIssue.create(g);
 const transactionId=id();await m.StockTransaction.create({_id:transactionId,sourceType:'sales_goods_issues',sourceId:issue._id,operation:'PGI',eventKey:'1',requestKey:key(),requestHash:'f'.repeat(64),performedBy:users.WAREHOUSE._id,occurredAt:new Date(),recordedAt:new Date(),movements:[{transactionId,lineNo:1,sourceLineId:issue.items[0]._id,fromBalanceId:balance._id,quantityBase:'4',fromBefore:'32',fromAfter:'28'}]}).catch(async error=>{throw error;});
 const created=await service.createFailedDelivery(users.WAREHOUSE,{...input(),warehouseId:sid(issue.header.warehouseId),lines:[{salesIssueLineId:sid(issue.items[0]),qtyBase:'4'}]},stored);let doc=await m.FailedDelivery.findById(created.id);const ev=await attachment(doc,users.WAREHOUSE);
 await service.inspectFailedDelivery(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],lines:[{lineId:sid(doc.items[0]),qtyBase:'4',qualityCode:'GOOD',packagingCondition:'SEALED'}]});doc=await m.FailedDelivery.findById(doc.id);
 const available = (await reads.detail(users.WAREHOUSE, 'failed-deliveries', doc.id)).receivableLines;
 assert.deepEqual(available.map(row => [row.remainingQtyBase, row.packagingCondition]), [['4', 'SEALED']]);
 const receive={...input(),expectedVersion:doc.version,evidenceIds:[ev.id],lines:[{lineId:sid(doc.items[0]),qtyBase:'4',locationId:receiving.id,qualityCode:'GOOD'}]};await service.receiveFailedDelivery(users.WAREHOUSE,doc.id,receive);await service.receiveFailedDelivery(users.WAREHOUSE,doc.id,receive);
 const receipt=await m.FailedDeliveryReceipt.findOne({'items.details.failedDeliveryLineId':doc.items[0]._id});assert.equal(String(receipt.demandReopenings[0].reopenedQtyBase),'4');assert.equal((await m.SalesOrder.findById(order._id)).version,2);assert.equal(await m.FailedDeliveryReceipt.countDocuments({'items.details.failedDeliveryLineId':doc.items[0]._id}),1);
});
run('historical delivery verification has evidence, exact claims and concurrent caps without stock posting',async()=>{
 const before=await m.StockTransaction.countDocuments(),body={...input(),sourceSystem:'ACTUAL-EXTERNAL',referenceNo:'HISTORY-TEST',referenceDate:new Date().toISOString(),correlationId:key(),customerName:'Historical customer',warehouseId:warehouse.id,lines:[{productId:sid(batch.productId),lotId:batch.id,qtyBase:'12',enteredUnit:'PIECE',baseUnitsPerUnit:'1',returnedQty:'4'}]};
 await assert.rejects(reads.createHistoricalSource(users.WAREHOUSE,body,stored));
 const result=await reads.createHistoricalSource(users.ACCOUNTANT,body,stored);assert.equal((await reads.createHistoricalSource(users.ACCOUNTANT,body,stored)).id,result.id);const external=await m.ExternalReference.findById(result.id);assert.equal(external.status,'VERIFIED');assert.equal(external.evidenceIds.length,1);
 const make=()=>service.createCustomerReturn(users.SALES,{...input(),warehouseId:warehouse.id,lines:[{historicalExternalLineId:sid(external.items[0]),qtyBase:'8',reason:'Historical unused return'}]});
 const outcomes=await Promise.allSettled([make(),make()]);assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);assert.equal(await m.StockTransaction.countDocuments(),before);
 const created=await m.CustomerReturn.findOne({'items.details.historicalExternalLineId':external.items[0]._id});
 assert.equal(created.header.intakeMode,'DIRECT');assert.equal(created.header.customerName,body.customerName);assert.equal(created.header.customerId,undefined);
 assert.equal((await m.ReturnQuantityClaim.findOne({requestLineId:created.items[0]._id})).sourceKind,'EXTERNAL');
 const operation=await m.OperationRecord.findOne({operationCode:'VERIFY_HISTORICAL_DELIVERY',subjectId:external._id});assert.equal(operation.actorId.toString(),users.ACCOUNTANT.id);
});
run('failed stocktake posting rolls back every write and stale operations cannot bypass permission',async()=>{
 const created=await service.createDefect(users.WAREHOUSE,{...input(),warehouseId:warehouse.id,balanceId:balance.id,quantity:'4',sourceKind:'MANUAL',reason:'Test freeze',disposition:{outcome:'SCRAP',quantity:'4',reason:'Test freeze'}},stored);let doc=await m.DefectReport.findById(created.id);
 await service.decideDefect(users.OWNER,doc.id,{...input(),expectedVersion:doc.version,decision:'APPROVE',reason:'Independent review'});doc=await m.DefectReport.findById(doc.id);const ev=await attachment(doc,users.WAREHOUSE);
 const lock=await m.StocktakeLocationLock.create({stocktakeId:id(),locationId:location._id,scopeVersion:1,lockedAt:new Date(),lockedBy:users.WAREHOUSE._id,status:'LOCKED',version:1});const count=await m.StockTransaction.countDocuments(),before=String((await m.InventoryBalance.findById(balance._id)).quantityBase),operationInput={...input(),expectedVersion:doc.version,evidenceIds:[ev.id],lines:[{lineId:sid(doc.resolutionPlans.at(-1).items[0]),qtyBase:'4'}]};
 await assert.rejects(service.executeDefect(users.WAREHOUSE,doc.id,operationInput));assert.equal(await m.StockTransaction.countDocuments(),count);assert.equal(String((await m.InventoryBalance.findById(balance._id)).quantityBase),before);assert.equal((await m.DefectReport.findById(doc.id)).version,doc.version);
 await m.StocktakeLocationLock.deleteOne({_id:lock._id});await assert.rejects(service.executeDefect(users.WAREHOUSE,doc.id,{...operationInput,expectedVersion:1}));
 await service.executeDefect(users.WAREHOUSE,doc.id,operationInput);await assert.rejects(service.executeDefect(users.SALES,doc.id,operationInput));
});
run('split use case allows a fresh disposition after rejection without duplicating the hold',async()=>{
 const created=await service.createDefect(users.WAREHOUSE,{...input(),warehouseId:warehouse.id,balanceId:balance.id,quantity:'4',sourceKind:'MANUAL',reason:'Release after recheck'},stored);let doc=await m.DefectReport.findById(created.id);const ev=await attachment(doc,users.WAREHOUSE);
 await service.submitDefectProposal(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],lines:[{lineId:sid(doc.items[0]),qtyBase:'4',outcome:'RELEASE',targetQuality:'GOOD'}]});doc=await m.DefectReport.findById(doc.id);
 await service.decideDefect(users.OWNER,doc.id,{...input(),expectedVersion:doc.version,decision:'REJECT',reason:'Need recheck'});doc=await m.DefectReport.findById(doc.id);
 await service.submitDefectProposal(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],lines:[{lineId:sid(doc.items[0]),qtyBase:'4',outcome:'RELEASE',targetQuality:'GOOD'}]});doc=await m.DefectReport.findById(doc.id);assert.equal(doc.holds.length,1);assert.equal(doc.resolutionPlans.length,2);
});
run('rejected customer goods remain customer-owned until a real, bounded handback',async()=>{
 const external=await legacyHistoricalSource('4');
 const created=await service.createCustomerReturn(users.SALES,{...input(),warehouseId:warehouse.id,lines:[{historicalExternalLineId:sid(external.items[0]),qtyBase:'4',reason:'Inspection required'}]});let doc=await m.CustomerReturn.findById(created.id);const ev=await attachment(doc,users.WAREHOUSE);
 await service.inspectCustomerReturn(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],custodyLocationId:custody.id,lines:[{returnLineId:sid(doc.items[0]),qtyReceived:'4',packagingCondition:'SEALED',installationStatus:'INSTALLED',damageCause:'CUSTOMER',deadlineStatus:'WITHIN',deadlineReference:'Actual terms',assessmentReason:'Installed goods'}]});doc=await m.CustomerReturn.findById(doc.id);
 await assert.rejects(service.decideCustomerReturn(users.OWNER,doc.id,{...input(),expectedVersion:doc.version,decision:'APPROVE',reason:'Attempted exception'},true));
 await service.decideCustomerReturn(users.SALES,doc.id,{...input(),expectedVersion:doc.version,decision:'REJECT',reason:'Installed goods'});doc=await m.CustomerReturn.findById(doc.id);
 const before=await m.CustomerReturnReceipt.countDocuments(),body={...input(),expectedVersion:doc.version,evidenceIds:[ev.id],recipientName:'Actual customer',lines:[{lineId:sid(doc.items[0]),qtyBase:'4'}]};
 await assert.rejects(service.receiveCustomerReturn(users.WAREHOUSE,doc.id,{...body,lines:[{lineId:sid(doc.items[0]),qtyBase:'8'}]},true));await service.receiveCustomerReturn(users.WAREHOUSE,doc.id,body,true);assert.equal(await m.CustomerReturnReceipt.countDocuments(),before);
 const handback=await m.CustodyRelease.findOne({'items.sources.documentId':doc._id});assert.equal(handback.header.ownerType,'CUSTOMER');assert.equal(sid(handback.header.ownerId),customer.id);assert.equal(handback.header.recipientName,'Actual customer');
});
run('custom operation permissions work without inheriting named-role business access',async()=>{
 const permissions=users.WAREHOUSE.roleId.permissionIds.filter(p=>['defect:read','defect:create'].includes(p.code));const role=await m.Role.create({code:'QUALITY_ASSISTANT',name:'Quality assistant',permissionIds:permissions.map(p=>p._id)});const user=await m.User.create({username:key(),fullName:'Independent quality assistant',passwordHash:'test-only',roleId:role._id,warehouseIds:[warehouse._id]});const actor=await m.User.findById(user._id).populate({path:'roleId',populate:{path:'permissionIds'}});
 const doc=await service.createDefect(actor,{...input(),warehouseId:warehouse.id,balanceId:balance.id,quantity:'4',sourceKind:'MANUAL',reason:'Quality observation'},stored);assert.ok((await reads.detail(actor,'defects',doc.id))._id);await assert.rejects(service.decideDefect(actor,doc.id,{...input(),expectedVersion:1,decision:'APPROVE',reason:'No approval grant'}));
});
run('HTTP routes enforce authentication, validation and native DTOs',async()=>{
 process.env.JWT_SECRET='isolated-returns-http-secret';const {default:app}=await import('../src/app.js');const {default:jwt}=await import('jsonwebtoken');const {once}=await import('node:events');const server=app.listen(0,'127.0.0.1');await once(server,'listening');const url=`http://127.0.0.1:${server.address().port}/api`;
 try{assert.equal((await fetch(url+'/defects')).status,401);const headers={Authorization:'Bearer '+jwt.sign({userId:users.WAREHOUSE.id},process.env.JWT_SECRET)};
  const response=await fetch(url+'/return-workflows/options',{headers});assert.equal(response.status,200);const options=await response.json();assert.ok(options.data.holdingPoints);assert.ok(options.data.permissions.includes('defect:create'));assert.equal(options.data.conversions,undefined);
  for(const resource of ['customer-returns','supplier-returns']){
   const list=await fetch(url+`/${resource}?limit=1`,{headers});assert.equal(list.status,200);const body=await list.json();assert.ok(Array.isArray(body.data));assert.equal(body.meta.limit,1);
  }
  const invalidDispatch=await fetch(url+`/supplier-returns/${id()}/dispatch`,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:'{}'});
  assert.equal(invalidDispatch.status,400);
  assert.equal((await fetch(url+'/defects?page=0',{headers})).status,400);const trace=await fetch(url+`/lots/${batch.id}/trace`,{headers});assert.equal(trace.status,200);const data=await trace.json();assert.ok(data.data.movements);assert.equal(JSON.stringify(data.data).includes('unitSellingPrice'),false);
 }finally{await new Promise(resolve=>server.close(resolve));server.closeAllConnections();}
});
run('supplier disputes stay open until an evidenced acknowledgement correction',async()=>{
 const created=await service.createSupplierReturn(users.WAREHOUSE,{...input(),warehouseId:warehouse.id,supplierId:supplier.id,lines:[{originLineId:sid(receipt.items[0]),balanceId:balance.id,qtyBase:'4'}]});let doc=await m.SupplierReturn.findById(created.id);const ev=await attachment(doc,users.ACCOUNTANT);
 await service.supplierAgreement(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],reference:'Four agreed',lines:[{lineId:sid(doc.items[0]),qtyBase:'4'}]});doc=await m.SupplierReturn.findById(doc.id);
 await service.dispatchSupplierReturn(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],recipientName:'Carrier',lines:[{lineId:sid(doc.items[0]),qtyBase:'4'}]});doc=await m.SupplierReturn.findById(doc.id);let issue=await m.SupplierReturnIssue.findOne({'header.supplierReturnId':doc._id});
 await service.acknowledgeSupplierReturn(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],lines:[{lineId:sid(issue.items[0]),qtyBase:'4',outcome:'REJECTED'}]});doc=await m.SupplierReturn.findById(doc.id);await assert.rejects(service.closeSupplierReturn(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version}));issue=await m.SupplierReturnIssue.findById(issue._id);
 await service.acknowledgeSupplierReturn(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],supersedesAcknowledgementId:sid(issue.acknowledgements[0]),lines:[{lineId:sid(issue.items[0]),qtyBase:'4',outcome:'ACCEPTED'}]});doc=await m.SupplierReturn.findById(doc.id);await service.closeSupplierReturn(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version});issue=await m.SupplierReturnIssue.findById(issue._id);assert.equal(issue.acknowledgements.length,2);assert.equal(issue.acknowledgements[0].workflowStatus,'SUPERSEDED');
});
run('supplier returns consume only the explicitly selected defect hold',async()=>{
 const created=await service.createDefect(users.WAREHOUSE,{...input(),warehouseId:warehouse.id,balanceId:balance.id,quantity:'4',sourceKind:'MANUAL',reason:'Supplier defect'},stored);const defect=await m.DefectReport.findById(created.id);const hold=defect.holds[0];const others=await m.DefectReport.find({_id:{$ne:defect._id},'holds.status':'ACTIVE'});const statuses=others.flatMap(d=>d.holds.map(h=>[d.id,String(h._id),h.status]));
 const result=await service.createSupplierReturn(users.WAREHOUSE,{...input(),warehouseId:warehouse.id,supplierId:supplier.id,lines:[{originLineId:sid(receipt.items[0]),balanceId:balance.id,defectHoldId:sid(hold),qtyBase:'4'}]});let doc=await m.SupplierReturn.findById(result.id);const ev=await attachment(doc,users.ACCOUNTANT);
 await service.supplierAgreement(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],reference:'Four defective pieces',lines:[{lineId:sid(doc.items[0]),qtyBase:'4'}]});doc=await m.SupplierReturn.findById(doc.id);await service.dispatchSupplierReturn(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],recipientName:'Supplier carrier',lines:[{lineId:sid(doc.items[0]),qtyBase:'4'}]});
 assert.equal((await m.DefectReport.findById(defect._id)).workflowStatus,'CLOSED');
 assert.equal((await m.DefectReport.findById(defect._id)).holds[0].status,'RESOLVED');for(const [docId,holdId,status]of statuses)assert.equal((await m.DefectReport.findById(docId)).holds.id(holdId).status,status);
});
run('supplier-owned custody uses a custody release and embedded acknowledgement',async()=>{
 const s=await import('../src/modules/return-workflows/native.shared.js');let custodyReceipt;
 await s.transaction(async session=>{custodyReceipt=await s.envelope(m.CustodyReceipt,users.WAREHOUSE,{warehouseId:warehouse._id,ownerType:'SUPPLIER',ownerId:supplier._id,receivedAt:new Date(),receivedBy:users.WAREHOUSE._id},[s.copy(receipt.items[0],'4')],'DRAFT','Actual supplier custody');const posting=s.beginStock(custodyReceipt,users.WAREHOUSE,'TEST_CUSTODY',input());await s.postIn(custodyReceipt,custodyReceipt.items[0],users.WAREHOUSE,session,posting,{locationId:custody._id,qualityCode:'PENDING',ownerType:'SUPPLIER',ownerId:supplier._id});await s.savePosted(custodyReceipt,posting,users.WAREHOUSE,session);});
 const point=await m.StockHoldingPoint.findOne({locationId:custody._id}),sourceBalance=await m.InventoryBalance.findOne({holdingPointId:point._id,ownerType:'SUPPLIER',ownerId:supplier._id,batchId:batch._id});
 const result=await service.createSupplierReturn(users.WAREHOUSE,{...input(),warehouseId:warehouse.id,supplierId:supplier.id,lines:[{originLineId:sid(custodyReceipt.items[0]),balanceId:sourceBalance.id,qtyBase:'4'}]});let doc=await m.SupplierReturn.findById(result.id);const ev=await attachment(doc,users.ACCOUNTANT);
 await service.supplierAgreement(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],reference:'Supplier-owned handback',lines:[{lineId:sid(doc.items[0]),qtyBase:'4'}]});doc=await m.SupplierReturn.findById(doc.id);const send=async()=>{await service.dispatchSupplierReturn(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],recipientName:'Supplier recipient',lines:[{lineId:sid(doc.items[0]),qtyBase:'2'}]});doc=await m.SupplierReturn.findById(doc.id);};
 await send();
 await assert.rejects(service.supplierAgreement(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],reference:'Below actual dispatch',lines:[{lineId:sid(doc.items[0]),qtyBase:'1'}]}),/thấp hơn/);
 const confirm=async release=>{await service.acknowledgeSupplierReturn(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],lines:[{lineId:sid(release.items[0]),qtyBase:'2',outcome:'ACCEPTED'}]});doc=await m.SupplierReturn.findById(doc.id);};
 let release=await m.CustodyRelease.findOne({'sources.documentId':doc._id});await confirm(release);
 assert.equal(doc.workflowStatus,'PARTIAL');await send();
 await confirm(await m.CustodyRelease.findOne({'sources.documentId':doc._id,_id:{$ne:release._id}}));await service.closeSupplierReturn(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version});release=await m.CustodyRelease.findById(release._id);assert.equal(release.acknowledgements.length,1);assert.equal(String((await m.InventoryBalance.findById(sourceBalance._id)).quantityBase),'0');
});
run('one supplier handover can post store stock and supplier custody without key collisions',async()=>{
 const s=await import('../src/modules/return-workflows/native.shared.js');let custodyReceipt;
 await s.transaction(async session=>{custodyReceipt=await s.envelope(m.CustodyReceipt,users.WAREHOUSE,{warehouseId:warehouse._id,ownerType:'SUPPLIER',ownerId:supplier._id},[s.copy(receipt.items[0],'4')],'DRAFT','Mixed handover source');const posting=s.beginStock(custodyReceipt,users.WAREHOUSE,'TEST_CUSTODY',input());await s.postIn(custodyReceipt,custodyReceipt.items[0],users.WAREHOUSE,session,posting,{locationId:custody._id,qualityCode:'PENDING',ownerType:'SUPPLIER',ownerId:supplier._id});await s.savePosted(custodyReceipt,posting,users.WAREHOUSE,session);});
 const point=await m.StockHoldingPoint.findOne({locationId:custody._id}),supplierBalance=await m.InventoryBalance.findOne({holdingPointId:point._id,ownerType:'SUPPLIER',ownerId:supplier._id,batchId:batch._id});
 const result=await service.createSupplierReturn(users.WAREHOUSE,{...input(),warehouseId:warehouse.id,supplierId:supplier.id,lines:[{originLineId:sid(receipt.items[0]),balanceId:balance.id,qtyBase:'4'},{originLineId:sid(custodyReceipt.items[0]),balanceId:supplierBalance.id,qtyBase:'4'}]});let doc=await m.SupplierReturn.findById(result.id);const ev=await attachment(doc,users.ACCOUNTANT);
 const storeLine=sid(doc.items[0]), custodyLine=sid(doc.items[1]);
 await service.supplierAgreement(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],reference:'First line agreed',lines:[{lineId:storeLine,qtyBase:'2'}]});
 doc=await m.SupplierReturn.findById(doc.id);
 await service.dispatchSupplierReturn(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],recipientName:'First carrier',lines:[{lineId:storeLine,qtyBase:'2'}]});
 doc=await m.SupplierReturn.findById(doc.id);
 assert.equal(doc.workflowStatus,'PARTIAL');
 await service.supplierAgreement(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],reference:'Both owners agreed',lines:[{lineId:storeLine,qtyBase:'4'},{lineId:custodyLine,qtyBase:'4'}]});
 doc=await m.SupplierReturn.findById(doc.id);
 const body={...input(),expectedVersion:doc.version,evidenceIds:[ev.id],recipientName:'Carrier received both',lines:[{lineId:storeLine,qtyBase:'2'},{lineId:custodyLine,qtyBase:'4'}]};
 const sent=await service.dispatchSupplierReturn(users.WAREHOUSE,doc.id,body);
 assert.equal((await service.dispatchSupplierReturn(users.WAREHOUSE,doc.id,body)).replayed,true);
 const refs=sent.resultRefs.map(row=>row.documentId);
 assert.equal(await m.SupplierReturnIssue.countDocuments({_id:{$in:refs}}),1);
 assert.equal(await m.CustodyRelease.countDocuments({_id:{$in:refs}}),1);
 assert.equal(await m.StockTransaction.countDocuments({sourceId:{$in:refs}}),2);
});
run('supplier agreements and acknowledgements keep whole units and allow closing after a reduction to accepted dispatch',async()=>{
 const testLocation=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:'RET-WHOLE-UNITS',locationType:'STORAGE',usableLengthMm:5000,usableWidthMm:5000});
 const point=await m.StockHoldingPoint.create({type:'LOCATION',locationId:testLocation._id});
 const testBalance=await m.InventoryBalance.create({holdingPointId:point._id,batchId:batch._id,qualityStatus:'GOOD',ownerType:'STORE',quantityBase:'4',version:0,packagingPortions:[{packagingState:'LOOSE',quantityBase:'4',measuredVolumeMm3:'100000',createdBy:users.WAREHOUSE._id}]});
 const created=await service.createSupplierReturn(users.WAREHOUSE,{...input(),warehouseId:warehouse.id,supplierId:supplier.id,lines:[{originLineId:sid(receipt.items[0]),balanceId:testBalance.id,qtyBase:'4'}]});
 const load=()=>m.SupplierReturn.findById(created.id);
 const initial=await load();
 const ev=await attachment(initial,users.ACCOUNTANT);
 const agreement=async qtyBase=>{
  const doc=await load();
  return service.supplierAgreement(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],reference:'Agreed quantity',lines:[{lineId:sid(doc.items[0]),qtyBase}]});
 };
 await assert.rejects(agreement('3.5'),/Số lượng phải nguyên/);
 assert.equal((await load()).version,initial.version);
 await agreement('4');
 const ready=await load();
 await service.dispatchSupplierReturn(users.WAREHOUSE,ready.id,{...input(),expectedVersion:ready.version,evidenceIds:[ev.id],recipientName:'Supplier',lines:[{lineId:sid(ready.items[0]),qtyBase:'2'}]});
 const issue=await m.SupplierReturnIssue.findOne({'header.supplierReturnId':created.id});
 const acknowledge=async qtyBase=>{
  const doc=await load();
  return service.acknowledgeSupplierReturn(users.ACCOUNTANT,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],lines:[{lineId:sid(issue.items[0]),qtyBase,outcome:'ACCEPTED'}]});
 };
 const partial=await load();
 await assert.rejects(acknowledge('0.5'),/Số lượng phải nguyên/);
 assert.equal((await load()).version,partial.version);
 await acknowledge('2');
 await agreement('2');
 const settled=await load();
 assert.equal(settled.workflowStatus,'ACKNOWLEDGED');
 await service.closeSupplierReturn(users.ACCOUNTANT,settled.id,{...input(),expectedVersion:settled.version});
 assert.equal((await load()).workflowStatus,'COMPLETED');
});
run('whole-unit source claims reject fractional quantities before reserving',async(t)=>{
 const verified=await reads.createHistoricalSource(users.ACCOUNTANT,{...input(),sourceSystem:'WHOLE-UNIT',referenceNo:key(),referenceDate:new Date().toISOString(),correlationId:key(),customerName:'Historical customer',warehouseId:warehouse.id,lines:[{productId:sid(batch.productId),lotId:batch.id,qtyBase:'4',enteredUnit:'PIECE',baseUnitsPerUnit:'1'}]},stored);const external=await m.ExternalReference.findById(verified.id);
 await t.test('customer claim',()=>assert.rejects(service.createCustomerReturn(users.SALES,{...input(),warehouseId:warehouse.id,lines:[{historicalExternalLineId:sid(external.items[0]),qtyBase:'0.5',reason:'Fractional piece is invalid'}]}),/Số lượng phải nguyên/));
 await t.test('supplier reservation',()=>assert.rejects(service.createSupplierReturn(users.WAREHOUSE,{...input(),warehouseId:warehouse.id,supplierId:supplier.id,lines:[{originLineId:sid(receipt.items[0]),balanceId:balance.id,qtyBase:'0.5'}]})));
});

run('split customer return preserves the source cap and returns only refused custody',async()=>{
 const external=await legacyHistoricalSource('8'),source=sid(external.items[0]);
 await assert.rejects(service.createCustomerReturn(users.SALES,{...input(),warehouseId:warehouse.id,lines:[{historicalExternalLineId:source,qtyBase:'5',reason:'First'},{historicalExternalLineId:source,qtyBase:'4',reason:'Second'}]}),/Vượt/);
 const created=await service.createCustomerReturn(users.SALES,{...input(),warehouseId:warehouse.id,lines:[{historicalExternalLineId:source,qtyBase:'4',reason:'Intact'},{historicalExternalLineId:source,qtyBase:'4',reason:'Cracked'}]});
 let doc=await m.CustomerReturn.findById(created.id);const ev=await attachment(doc,users.WAREHOUSE);
 await service.inspectCustomerReturn(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],custodyLocationId:custody.id,lines:doc.items.map((item,index)=>({returnLineId:sid(item),qtyReceived:'4',packagingCondition:'SEALED',installationStatus:'UNUSED',damageCause:index?'SUPPLIER':'NONE',deadlineStatus:'WITHIN',deadlineReference:'Verified terms',assessmentReason:'Actual inspection'}))});
 doc=await m.CustomerReturn.findById(doc.id);
 await assert.rejects(service.decideCustomerReturn(users.SALES,doc.id,{...input(),expectedVersion:doc.version,decision:'APPROVE',reason:'Incomplete decision',lines:[{lineId:sid(doc.items[1]),qtyBase:'0'}]}),/đủ các dòng/);
 await service.decideCustomerReturn(users.SALES,doc.id,{...input(),expectedVersion:doc.version,decision:'APPROVE',reason:'Accept intact part',lines:doc.items.map((item,index)=>({lineId:sid(item),qtyBase:index?'0':'4'}))});
 doc=await m.CustomerReturn.findById(doc.id);
 await service.receiveCustomerReturn(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],lines:[{lineId:sid(doc.items[0]),qtyBase:'4',qualityCode:'GOOD',locationId:receiving.id}]});
 doc=await m.CustomerReturn.findById(doc.id);
 const before=await reads.detail(users.WAREHOUSE,'customer-returns',doc.id);assert.equal(before.items[1].progress.handbackAvailable,'4');
 await assert.rejects(service.receiveCustomerReturn(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],recipientName:'Customer',lines:[{lineId:sid(doc.items[0]),qtyBase:'4'}]},true),/remaining customer custody/);
 await service.receiveCustomerReturn(users.WAREHOUSE,doc.id,{...input(),expectedVersion:doc.version,evidenceIds:[ev.id],recipientName:'Customer',lines:[{lineId:sid(doc.items[1]),qtyBase:'4'}]},true);
 const after=await reads.detail(users.WAREHOUSE,'customer-returns',doc.id);assert.equal(after.items[1].progress.custodyRemaining,'0');
});
run('split defect plans enforce combined quantities before any execution',async()=>{
 const location=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:key(),locationType:'STORAGE',usableLengthMm:5000,usableWidthMm:5000});
 const point=await m.StockHoldingPoint.create({type:'LOCATION',locationId:location._id});
 const source=await m.InventoryBalance.create({holdingPointId:point._id,batchId:batch._id,qualityStatus:'GOOD',ownerType:'STORE',quantityBase:'4',version:0,packagingPortions:[{packagingState:'LOOSE',quantityBase:'4',measuredVolumeMm3:'1000',createdBy:users.WAREHOUSE._id}]});
 const created=await service.createDefect(users.WAREHOUSE,{...input(),warehouseId:warehouse.id,balanceId:source.id,quantity:'4',sourceKind:'MANUAL',reason:'Inspect pieces'},stored);
 let doc=await m.DefectReport.findById(created.id);const ev=await attachment(doc,users.WAREHOUSE);
 const proposal=()=>({...input(),expectedVersion:doc.version,evidenceIds:[ev.id],lines:[{lineId:sid(doc.items[0]),qtyBase:'3',outcome:'SCRAP'},{lineId:sid(doc.items[0]),qtyBase:'2',outcome:'RELEASE',targetQuality:'GOOD'}]});
 await assert.rejects(service.submitDefectProposal(users.WAREHOUSE,doc.id,proposal()),/committed/);
 const valid=proposal();valid.lines[0].qtyBase='2';await service.submitDefectProposal(users.WAREHOUSE,doc.id,valid);
 doc=await m.DefectReport.findById(doc.id);assert.equal(doc.resolutionPlans[0].items.length,2);
 await assert.rejects(service.decideDefect(users.OWNER,doc.id,{...input(),expectedVersion:doc.version,decision:'APPROVE',reason:'Incomplete decision',lines:[{lineId:sid(doc.resolutionPlans[0].items[0]),qtyBase:'1'}]}),/đủ các dòng/);
 assert.equal((await reads.detail(users.WAREHOUSE,'defects',doc.id)).items[0].progress.proposable,'0');
});
