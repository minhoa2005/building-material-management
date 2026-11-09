import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';
import * as rr from '../src/modules/replenishments/replenishment.commands.js';
import * as po from '../src/modules/purchase-orders/purchase-order.commands.js';
import * as receiving from '../src/modules/po-receiving/po-receiving.service.js';
import * as putaway from '../src/modules/po-receiving/purchase-putaway.service.js';
import * as correction from '../src/modules/po-receiving/purchase-correction.service.js';
import { reconcilePurchasing } from '../src/modules/po-receiving/purchase-reconciliation.js';
const enabled=process.env.RUN_NATIVE_API_TESTS==='1';
const run=(name,fn)=>test(name,{skip:!enabled},fn);
let owner,worker,accountant,warehouse,product,batch,supplier,receivingLocation,storageLocation;
const key=()=>new mongoose.Types.ObjectId().toString();
const input=()=>({operationKey:key()});
test.before(async()=>{
 if(!enabled)return;
 // A new isolated test database each run. Never use the application's URI.
 await mongoose.connect('mongodb://127.0.0.1:27017/wmsd_api_test_'+key()+'?replicaSet=rs0',{serverSelectionTimeoutMS:5000});
 for(const Model of m.models.values()){await Model.createCollection();await Model.createIndexes();}
 await m.Uom.create([{code:'PIECE',name:'Viên'},{code:'BOX',name:'Thùng'},{code:'M2',name:'Mét vuông'}]);
 const permissions=await m.Permission.insertMany(PERMISSION_CATALOGUE.map(p=>({code:p.code,description:p.description,name:p.code})));
 const roles=[];for(const code of ['OWNER','WAREHOUSE','ACCOUNTANT'])roles.push(await m.Role.create({code,name:code,permissionIds:permissions.filter(p=>ROLE_PERMISSIONS[code].includes(p.code)).map(p=>p._id)}));
 warehouse=await m.Warehouse.create({code:'TEST',name:'Test warehouse',lengthMm:'10000',widthMm:'10000',clearHeightMm:'3000'});
 const users=[];for(const role of roles){const u=await m.User.create({username:role.code.toLowerCase(),fullName:role.code,passwordHash:'test-only-unused',roleId:role._id,warehouseIds:[warehouse._id]});users.push(await m.User.findById(u._id).populate({path:'roleId',populate:{path:'permissionIds'}}));}[owner,worker,accountant]=users;
 const category=await m.Category.create({code:'TILE',name:'Tile'});
 product=await m.Product.create({sku:'TEST',name:'Test tile',manufacturerCode:'TEST',categoryId:category._id,color:'White',baseUnit:'PIECE',wholeBaseUnits:true,lengthMm:'600',widthMm:'600',heightMm:'10'});
 batch=await m.ProductBatch.create({productId:product._id,manufacturerLot:'B1',identificationStatus:'VERIFIED',piecesPerCarton:4,cartonLengthMm:'620',cartonWidthMm:'620',cartonHeightMm:'50'});
 supplier=await m.Supplier.create({code:'SUP',name:'Supplier',status:'ACTIVE'});
 receivingLocation=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:'IN',locationType:'RECEIVING',usableLengthMm:'5000',usableWidthMm:'5000'});
 storageLocation=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:'ST',locationType:'STORAGE',isPickable:true,usableLengthMm:'5000',usableWidthMm:'5000'});
});
test.after(async()=>{if(enabled){if(!mongoose.connection.name.startsWith('wmsd_api_test_'))throw Error('Unsafe test DB');await mongoose.connection.dropDatabase();await mongoose.disconnect();}});

async function acknowledgeIndependentNeed(body) {
 const assessments=await rr.evaluateReplenishment(worker,body);
 body.lines=body.lines.map((line,index)=>assessments[index].warningRequired?{...line,evaluationKey:assessments[index].evaluationKey,independentNeedConfirmed:true,independentNeedReason:'Separate independent fixture need'}:line);
}
async function postedReceipt(packagingCondition='SEALED',custodyOnly=false,qualityCode='GOOD'){
 const requestInput={creationKey:key(),action:'SUBMIT',warehouseId:String(warehouse._id),neededOn:'2026-12-01',triggerReason:'Test',lines:[{productId:String(product._id),lotId:String(batch._id),enteredUnit:'BOX',enteredQty:'2',reasonNote:'Test'}]};
 await acknowledgeIndependentNeed(requestInput);
 const created=await rr.createReplenishment(worker,requestInput);const replay=await rr.createReplenishment(worker,requestInput);assert.equal(replay.id,created.id);assert.equal(replay.replayed,true);
 let request=await m.ReplenishmentRequest.findById(created.id);
 await assert.rejects(rr.reviewReplenishment(worker,created.id,{...input(),expectedVersion:request.version,decision:'APPROVE',reason:'Test',lines:request.items.map(i=>({lineId:String(i._id),approvedQtyBase:'8'}))}));
 await assert.rejects(rr.reviewReplenishment(owner,created.id,{...input(),expectedVersion:request.version,decision:'APPROVE',reason:'Test fractional approval',lines:request.items.map(i=>({lineId:String(i._id),approvedQtyBase:'1.5'}))}),/đơn vị gốc/);
 await rr.reviewReplenishment(owner,created.id,{...input(),expectedVersion:request.version,decision:'APPROVE',reason:'Test',lines:request.items.map(i=>({lineId:String(i._id),approvedQtyBase:'8'}))});request=await m.ReplenishmentRequest.findById(created.id);
 const order=await po.createPurchaseOrder(accountant,{creationKey:key(),warehouseId:String(warehouse._id),supplierId:String(supplier._id),expectedOn:'2026-12-01',currency:'VND',lines:[{rrLineId:String(request.items[0]._id),approvalId:String(request.header.latestDecisionId),enteredQty:'2',unitPurchasePrice:'100000'}]});
 await po.confirmPurchaseOrder(accountant,order.id,{...input(),expectedVersion:1});let orderDoc=await m.PurchaseOrder.findById(order.id);
 const inspection=await receiving.createInspection(worker,order.id,{creationKey:key(),expectedPoVersion:orderDoc.version,arrivedAt:new Date().toISOString(),lines:[{poLineId:String(orderDoc.items[0]._id),lotId:String(batch._id),enteredQty:'2',qualityCode,ownershipDecision:custodyOnly?'CUSTODY':'ACCEPT',packagingCondition}]});
 let inspected=await m.GoodsInspection.findById(inspection.id);
 const confirmed=await receiving.confirmInspection(worker,inspection.id,{...input(),expectedVersion:inspected.version,expectedPoVersion:orderDoc.version,destinations:custodyOnly?[]:[{inspectionItemId:String(inspected.items[0]._id),locationId:String(receivingLocation._id)}]});
 if(custodyOnly){const ref=confirmed.resultRefs.find(r=>r.documentType==='custody_receipts');const d=await m.CustodyReceipt.findById(ref.documentId);const loc=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:key(),locationType:'CUSTODY',usableLengthMm:'5000',usableWidthMm:'5000'});await receiving.postCustodyReceipt(worker,d._id,{...input(),expectedVersion:d.version,handedOverBy:'Supplier',destinations:[{lineId:String(d.items[0]._id),locationId:String(loc._id)}]});return m.CustodyReceipt.findById(d._id);}
 const receiptId=confirmed.resultRefs.find(r=>r.documentType==='goods_receipts').documentId;orderDoc=await m.PurchaseOrder.findById(order.id);
 const post={...input(),expectedVersion:1,expectedPoVersion:orderDoc.version};
 if(packagingCondition!=='SEALED'){
   await assert.rejects(receiving.postReceipt(worker,receiptId,post),/thực đo/);
   assert.equal(await m.StockTransaction.countDocuments({sourceId:receiptId}),0);
   assert.equal((await m.PurchaseReceipt.findById(receiptId)).workflowStatus,'DRAFT');
   const draft=await m.PurchaseReceipt.findById(receiptId);
   post.packaging=[{lineId:String(draft.items[0]._id),portions:[{packagingState:'OPEN',quantityBase:'8',measuredVolumeMm3:'38440000'}]}];
 }
 await receiving.postReceipt(worker,receiptId,post);await receiving.postReceipt(worker,receiptId,post);
 const receipt=await m.PurchaseReceipt.findById(receiptId);assert.equal(await m.StockTransaction.countDocuments({sourceId:receipt._id}),1);return receipt;
}
run('native RR → PO → inspection → receipt → partial putaway preserves stock, sources and replay',async()=>{
 const receipt=await postedReceipt();const context=await putaway.putawayContext(worker,receipt._id);
 const task=await putaway.createPutaway(worker,receipt._id,{creationKey:key(),expectedVersion:receipt.version,lines:[{receiptLineId:String(receipt.items[0]._id),expectedSourceVersion:context.items[0].sourceBalanceVersion,qtyBase:'8',toLocationId:String(storageLocation._id)}]});
 let taskDoc=await m.TransferOrder.findById(task.id);await putaway.confirmPutaway(worker,task.id,{...input(),expectedVersion:taskDoc.version,lines:[{taskLineId:String(taskDoc.items[0]._id),actualQtyBase:'4'}]});
 taskDoc=await m.TransferOrder.findById(task.id);assert.equal(taskDoc.workflowStatus,'PARTIAL');await putaway.confirmPutaway(worker,task.id,{...input(),expectedVersion:taskDoc.version,lines:[{taskLineId:String(taskDoc.items[0]._id),actualQtyBase:'4'}]});
 assert.equal((await m.TransferOrder.findById(task.id)).workflowStatus,'CONFIRMED');assert.equal((await putaway.placementQuantities(receipt))[0].unplacedQtyBase,'0');const report=await reconcilePurchasing();assert.deepEqual(report.issues,[]);
 const preflight=await correction.reversalPreflight(worker,receipt._id);assert.equal(preflight.eligible,false);
});
run('Warehouse reversal restores PO headroom once without separate approval',async()=>{
 const receipt=await postedReceipt();const attachment=await m.Attachment.create({ownerDocumentType:'goods_receipts',ownerDocumentId:receipt._id,purpose:'TEST',originalName:'test.png',mediaType:'image/png',sizeBytes:10,storageKey:'local-test',checksum:'a'.repeat(64),uploadedBy:worker._id,uploadedAt:new Date(),accessCategory:'BUSINESS',status:'ATTACHED'});
 const order=await m.PurchaseOrder.findById(receipt.header.purchaseOrderId);const payload={...input(),expectedVersion:receipt.version,expectedPoVersion:order.version,reason:'Wrong entry',evidenceIds:[String(attachment._id)]};
 const reversal=await correction.reverseReceipt(worker,receipt._id,payload);await correction.reverseReceipt(worker,receipt._id,payload);
 assert.equal((await m.StockReversal.findById(reversal.id)).workflowStatus,'POSTED');assert.equal(await m.StockTransaction.countDocuments({reversedTransactionId:receipt.stockTransactionId}),1);assert.equal((await m.PurchaseReceipt.findById(receipt._id)).workflowStatus,'REVERSED');assert.deepEqual((await reconcilePurchasing()).issues,[]);
});
run('native transfer dispatch, independent receipt and putaway reconcile all movement legs',async()=>{
 const transfers=await import('../src/modules/transfers/transfer-write.service.js');
 const destination=await m.Warehouse.create({code:'DEST',name:'Destination',lengthMm:'10000',widthMm:'10000',clearHeightMm:'3000'});
 const staging=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:'OUT',locationType:'STAGING',usableLengthMm:'5000',usableWidthMm:'5000'});
 const inbound=await m.WarehouseLocation.create({warehouseId:destination._id,code:'IN',locationType:'RECEIVING',usableLengthMm:'5000',usableWidthMm:'5000'});
 const target=await m.WarehouseLocation.create({warehouseId:destination._id,code:'ST',locationType:'STORAGE',usableLengthMm:'5000',usableWidthMm:'5000'});
 const customRole=await m.Role.create({code:'TRANSFER_OPERATOR',name:'Custom transfer operator',permissionIds:worker.roleId.permissionIds.map(p=>p._id),isSystemRole:false});
 const recipient=await m.User.create({username:'receiver',fullName:'Receiver',passwordHash:'unused',roleId:customRole._id,warehouseIds:[destination._id]});
 const actor=await m.User.findById(recipient._id).populate({path:'roleId',populate:{path:'permissionIds'}});
 const request=await transfers.createRequest(worker,{idempotencyKey:key(),sourceWarehouseId:String(warehouse._id),destinationWarehouseId:String(destination._id),reason:'Transfer test',lines:[{productId:String(product._id),enteredUnit:'PIECE',enteredQty:'8'}]});
 await transfers.reviewRequest(owner,request.id,{idempotencyKey:key(),expectedVersion:1,decision:'APPROVE',reason:'Approved test'});
 const req=await m.WarehouseTransferRequest.findById(request.id),point=await m.StockHoldingPoint.findOne({locationId:storageLocation._id}),balance=await m.InventoryBalance.findOne({holdingPointId:point._id,batchId:batch._id});
 const dispatch=await transfers.createDispatch(worker,request.id,{idempotencyKey:key(),expectedVersion:req.version,lines:[{requestLineId:String(req.items[0]._id),sourceBalanceId:String(balance._id),stagingLocationId:String(staging._id),qtyBase:'8'}]});
 const pick=await transfers.createRequirement(worker,dispatch.id,{idempotencyKey:key(),expectedVersion:1});
 await transfers.confirmTask(worker,pick.id,{idempotencyKey:key(),expectedVersion:1,recipientName:'Transporter'});
 let shipped=await m.TransferDispatch.findById(dispatch.id);assert.equal(shipped.handovers.length,1);
 const received=await transfers.receiveTransfer(actor,dispatch.id,{idempotencyKey:key(),expectedVersion:shipped.version,lines:[{dispatchLineId:String(shipped.items[0]._id),locationId:String(inbound._id),qtyBase:'8',qualityCode:'GOOD'}]});
 const receivingDoc=await m.TransferReceipt.findById(received.id);
 const putting=await transfers.createRequirement(actor,received.id,{idempotencyKey:key(),expectedVersion:1,destinations:[{receiptLineId:String(receivingDoc.items[0]._id),locationId:String(target._id)}]});
 await transfers.confirmTask(actor,putting.id,{idempotencyKey:key(),expectedVersion:1});
 const current=await m.WarehouseTransferRequest.findById(request.id);await transfers.closeRequest(actor,request.id,{idempotencyKey:key(),expectedVersion:current.version});
 assert.equal((await m.WarehouseTransferRequest.findById(request.id)).workflowStatus,'COMPLETED');assert.deepEqual((await reconcilePurchasing()).issues,[]);
});

run('opened cartons require measured packaging and failed posting leaves no stock transaction',async()=>{const receipt=await postedReceipt('OPENED');assert.equal(receipt.workflowStatus,'POSTED');assert.deepEqual((await reconcilePurchasing()).issues,[]);});

import * as custody from '../src/modules/po-receiving/purchase-custody.service.js';
run('custody acceptance, ownership reversal and return preserve physical stock and sources',async()=>{
 let held=await postedReceipt('SEALED',true);const item=held.items[0];
 const evidence=await m.Attachment.create({ownerDocumentType:'custody_receipts',ownerDocumentId:held._id,purpose:'TEST',originalName:'test.png',mediaType:'image/png',sizeBytes:10,storageKey:'local-test',checksum:'a'.repeat(64),uploadedBy:worker._id,uploadedAt:new Date(),accessCategory:'BUSINESS',status:'ATTACHED'});
 const decision=await custody.decideCustody(accountant,held._id,{...input(),expectedVersion:held.version,decision:'ACCEPT',reason:'Agreed',evidenceIds:[String(evidence._id)],lines:[{custodyItemId:String(item._id),qtyBase:'4'}]});held=await m.CustodyReceipt.findById(held._id);
 const inspection=await m.GoodsInspection.findById(held.items[0].sources[0].documentId);const arrival=await m.GoodsArrival.findById(inspection.header.arrivalId);let order=await m.PurchaseOrder.findById(arrival.header.purchaseOrderId);
 const created=await custody.createCustodyResolution(worker,held._id,{...input(),expectedVersion:held.version,expectedPoVersion:order.version,decisionId:decision.decisionId,lines:[{custodyItemId:String(item._id),qtyBase:'4',destinationLocationId:String(receivingLocation._id)}]},'ACCEPT');
 order=await m.PurchaseOrder.findById(order._id);const gr=await m.PurchaseReceipt.findById(created.id);const post={...input(),expectedVersion:gr.version,expectedPoVersion:order.version};await receiving.postReceipt(worker,gr._id,post);await receiving.postReceipt(worker,gr._id,post);
 const txn=await m.StockTransaction.findOne({sourceId:gr._id});assert.ok(txn.movements[0].fromBalanceId);const balance=await m.InventoryBalance.findById(txn.movements[0].fromBalanceId);assert.equal(String(balance.quantityBase),'4');
 const ev=await m.Attachment.create({ownerDocumentType:'goods_receipts',ownerDocumentId:gr._id,purpose:'TEST',originalName:'test.png',mediaType:'image/png',sizeBytes:10,storageKey:'local-test',checksum:'a'.repeat(64),uploadedBy:worker._id,uploadedAt:new Date(),accessCategory:'BUSINESS',status:'ATTACHED'});order=await m.PurchaseOrder.findById(order._id);
 await correction.reverseReceipt(worker,gr._id,{...input(),expectedVersion:2,expectedPoVersion:order.version,reason:'Correction',evidenceIds:[String(ev._id)]});assert.equal(String((await m.InventoryBalance.findById(balance._id)).quantityBase),'8');
 held=await m.CustodyReceipt.findById(held._id);const ret=await custody.decideCustody(accountant,held._id,{...input(),expectedVersion:held.version,decision:'RETURN',reason:'Return agreed',evidenceIds:[String(evidence._id)],lines:[{custodyItemId:String(item._id),qtyBase:'8'}]});held=await m.CustodyReceipt.findById(held._id);
 const release=await custody.createCustodyResolution(worker,held._id,{...input(),expectedVersion:held.version,decisionId:ret.decisionId,lines:[{custodyItemId:String(item._id),qtyBase:'8'}]},'RETURN');await custody.postCustodyRelease(worker,release.id,{...input(),expectedVersion:1,recipientName:'Supplier'});assert.equal(String((await m.InventoryBalance.findById(balance._id)).quantityBase),'0');
});
run('RR replay enforces current warehouse scope and payload hash',async()=>{
 const body={creationKey:key(),action:'SAVE_DRAFT',warehouseId:String(warehouse._id),neededOn:'2026-12-01',triggerReason:'Scope',lines:[{productId:String(product._id),enteredUnit:'PIECE',enteredQty:'2',reasonNote:'scope'}]};await acknowledgeIndependentNeed(body);const created=await rr.createReplenishment(worker,body);
 await m.User.updateOne({_id:worker._id},{$set:{warehouseIds:[]}});try{await assert.rejects(rr.createReplenishment(worker,body));}finally{await m.User.updateOne({_id:worker._id},{$set:{warehouseIds:worker.warehouseIds}});}assert.equal((await rr.createReplenishment(worker,body)).id,created.id);await assert.rejects(rr.createReplenishment(worker,{...body,triggerReason:'changed'}));
});

import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { getPurchaseOrder } from '../src/modules/purchase-orders/purchase-order.service.js';
run('HTTP catalogue contracts enforce permissions, immutable codes and concurrency tokens',async()=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const root='http://127.0.0.1:'+server.address().port+'/api';
 const api=async(method,path,user,body)=>{const response=await fetch(root+path,{method,headers:{'content-type':'application/json',...(user&&{authorization:'Bearer '+jwt.sign({userId:String(user._id)},process.env.JWT_SECRET||'wmsd_default_super_secret_jwt_key_2026')})},...(body&&{body:JSON.stringify(body)})});return {status:response.status,body:await response.json()};};
 try{
 assert.equal((await api('GET','/uoms')).status,401);assert.equal((await api('POST','/uoms',worker,{code:'TEST',name:'Test'})).status,403);
 const created=await api('POST','/uoms',owner,{code:'CUSTOM',name:'Custom'});assert.equal(created.status,200);const unit=created.body.data;
 assert.equal((await api('POST','/uoms',owner,{code:'CUSTOM',name:'Duplicate'})).status,409);
 assert.equal((await api('PUT','/uoms/'+unit.id,owner,{expectedUpdatedAt:unit.updatedAt,name:'Changed',code:'NEW'})).status,400);
 assert.equal((await api('PATCH','/uoms/'+unit.id+'/status',owner,{expectedUpdatedAt:unit.updatedAt,isActive:false,reason:'Stop'})).status,200);
 assert.equal((await api('PUT','/uoms/'+unit.id,owner,{expectedUpdatedAt:unit.updatedAt,name:'Stale'})).status,409);
 assert.equal((await api('GET','/suppliers/names',worker)).status,403);assert.equal((await api('GET','/suppliers/names',accountant)).status,200);
 const category=await m.Category.findOne();const body={sku:key(),name:'New',manufacturerCode:'TEST',categoryId:String(category._id),baseUnit:'PIECE',wholeBaseUnits:true,lengthMm:'600.125',widthMm:'600',heightMm:'10',color:'White',surface:'Matte',origin:'VN',description:'Description'};
 const productResult=await api('POST','/products',owner,body);assert.equal(productResult.status,201);assert.equal(productResult.body.data.nominalSize,'600.125x600');
 assert.equal((await api('POST','/products',owner,{...body,sku:key(),baseUnit:'CUSTOM'})).status,400);
 const sup=await api('POST','/suppliers',accountant,{code:key(),name:'NCC',contactName:'Contact',taxCode:'TAX',notes:'Note'});assert.equal(sup.status,201);assert.equal(sup.body.data.status,'ACTIVE');
 assert.equal((await api('PATCH','/suppliers/'+sup.body.data.id+'/status',owner,{expectedUpdatedAt:sup.body.data.updatedAt,status:'SUSPENDED',reason:'Pause'})).status,200);
 const receipt=await postedReceipt();const order=await getPurchaseOrder(worker,String(receipt.header.purchaseOrderId));assert.ok(!('unitPurchasePrice' in order.items[0]));assert.ok(!('totalAmount' in order));
 }finally{await new Promise((r,e)=>server.close(err=>err?e(err):r()));}
});

run('custody reinspection, stale decisions, wrong roles and concurrent claims are guarded',async()=>{
 await assert.rejects(postedReceipt('SEALED',false,'DAMAGED'),/GOOD/);
 let held=await postedReceipt('SEALED',true,'DAMAGED');const row=held.items[0];const ev=await m.Attachment.create({ownerDocumentType:'custody_receipts',ownerDocumentId:held._id,purpose:'TEST',originalName:'test.png',mediaType:'image/png',sizeBytes:10,storageKey:'local-test',checksum:'a'.repeat(64),uploadedBy:worker._id,uploadedAt:new Date(),accessCategory:'BUSINESS',status:'ATTACHED'});
 const body={...input(),expectedVersion:held.version,decision:'ACCEPT',reason:'Agreed',evidenceIds:[String(ev._id)],lines:[{custodyItemId:String(row._id),qtyBase:'4'}]};
 await assert.rejects(custody.decideCustody(worker,held._id,body));await assert.rejects(custody.decideCustody(accountant,held._id,{...body,evidenceIds:[]}));await assert.rejects(custody.decideCustody(accountant,held._id,body),/GOOD/);
 const check=await custody.reinspectCustody(worker,held._id,{...input(),expectedVersion:held.version,reason:'Rechecked',evidenceIds:[String(ev._id)],lines:[{custodyItemId:String(row._id),qtyBase:'8',qualityCode:'GOOD'}]});held=await m.CustodyReceipt.findById(held._id);
 const decision=await custody.decideCustody(accountant,held._id,{...body,operationKey:key(),expectedVersion:held.version,lines:[{custodyItemId:String(row._id),qtyBase:'4',reinspectionId:check.id}]});held=await m.CustodyReceipt.findById(held._id);
 const inspection=await m.GoodsInspection.findById(row.sources[0].documentId),arrival=await m.GoodsArrival.findById(inspection.header.arrivalId),order=await m.PurchaseOrder.findById(arrival.header.purchaseOrderId);
 const create={...input(),expectedVersion:held.version,expectedPoVersion:order.version,decisionId:decision.decisionId,lines:[{custodyItemId:String(row._id),qtyBase:'4',destinationLocationId:String(receivingLocation._id)}]};
 const results=await Promise.allSettled([custody.createCustodyResolution(worker,held._id,create,'ACCEPT'),custody.createCustodyResolution(worker,held._id,{...create,operationKey:key()},'ACCEPT')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);
 const gr=await m.PurchaseReceipt.findById(results.find(r=>r.status==='fulfilled').value.id);const before=await m.StockTransaction.countDocuments({sourceId:gr._id});const livePo=await m.PurchaseOrder.findById(order._id);
 await assert.rejects(receiving.postReceipt(worker,gr._id,{...input(),expectedVersion:gr.version,expectedPoVersion:livePo.version-1}));assert.equal(await m.StockTransaction.countDocuments({sourceId:gr._id}),before);
});

run('one RR cannot create concurrent POs and freeze rolls back receipt posting',async()=>{
 const body={creationKey:key(),action:'SUBMIT',warehouseId:String(warehouse._id),neededOn:'2026-12-01',triggerReason:'Concurrency',lines:[{productId:String(product._id),enteredUnit:'PIECE',enteredQty:'8',reasonNote:'Test'}]};await acknowledgeIndependentNeed(body);const created=await rr.createReplenishment(worker,body);let req=await m.ReplenishmentRequest.findById(created.id);await rr.reviewReplenishment(owner,created.id,{...input(),expectedVersion:req.version,decision:'APPROVE',reason:'OK',lines:[{lineId:String(req.items[0]._id),approvedQtyBase:'8'}]});req=await m.ReplenishmentRequest.findById(created.id);
 const orderBody={creationKey:key(),warehouseId:String(warehouse._id),supplierId:String(supplier._id),currency:'VND',lines:[{rrLineId:String(req.items[0]._id),approvalId:String(req.header.latestDecisionId),enteredQty:'8',unitPurchasePrice:'1000'}]};
 const orders=await Promise.allSettled([po.createPurchaseOrder(accountant,orderBody),po.createPurchaseOrder(accountant,{...orderBody,creationKey:key()})]);assert.equal(orders.filter(r=>r.status==='fulfilled').length,1);assert.equal(await m.PurchaseOrder.countDocuments({replenishmentRequestId:req._id}),1);
 const order=orders.find(r=>r.status==='fulfilled').value;await po.confirmPurchaseOrder(accountant,order.id,{...input(),expectedVersion:1});let orderDoc=await m.PurchaseOrder.findById(order.id);
 const check=await receiving.createInspection(worker,order.id,{creationKey:key(),expectedPoVersion:orderDoc.version,arrivedAt:new Date().toISOString(),lines:[{poLineId:String(orderDoc.items[0]._id),lotId:String(batch._id),enteredQty:'8',qualityCode:'GOOD',ownershipDecision:'ACCEPT',packagingCondition:'SEALED'}]});const inspection=await m.GoodsInspection.findById(check.id);const confirmation=await receiving.confirmInspection(worker,check.id,{...input(),expectedVersion:1,expectedPoVersion:orderDoc.version,destinations:[{inspectionItemId:String(inspection.items[0]._id),locationId:String(receivingLocation._id)}]});
 const receiptId=confirmation.resultRefs[0].documentId;orderDoc=await m.PurchaseOrder.findById(order.id);const lock=await m.StocktakeLocationLock.create({stocktakeId:new mongoose.Types.ObjectId(),locationId:receivingLocation._id,scopeVersion:1,lockedAt:new Date(),lockedBy:worker._id,status:'LOCKED',version:1});
 try{await assert.rejects(receiving.postReceipt(worker,receiptId,{...input(),expectedVersion:1,expectedPoVersion:orderDoc.version}),/khóa/);assert.equal(await m.StockTransaction.countDocuments({sourceId:receiptId}),0);assert.equal((await m.PurchaseReceipt.findById(receiptId)).workflowStatus,'DRAFT');}finally{await m.StocktakeLocationLock.deleteOne({_id:lock._id});}
});
