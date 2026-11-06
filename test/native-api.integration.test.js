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
 await mongoose.connect('mongodb://127.0.0.1:27028/wmsd_api_test_'+key()+'?replicaSet=wmsd_model_tests',{serverSelectionTimeoutMS:5000});
 for(const Model of m.models.values()){await Model.createCollection();await Model.createIndexes();}
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
test.after(async()=>{if(enabled)await mongoose.disconnect();});
async function postedReceipt(packagingCondition='SEALED'){
 const requestInput={creationKey:key(),action:'SUBMIT',warehouseId:String(warehouse._id),neededOn:'2026-12-01',triggerReason:'Test',lines:[{productId:String(product._id),lotId:String(batch._id),enteredUnit:'BOX',enteredQty:'2',reasonNote:'Test'}]};
 const created=await rr.createReplenishment(worker,requestInput);const replay=await rr.createReplenishment(worker,requestInput);assert.equal(replay.id,created.id);assert.equal(replay.replayed,true);
 let request=await m.ReplenishmentRequest.findById(created.id);
 await assert.rejects(rr.reviewReplenishment(worker,created.id,{...input(),expectedVersion:request.version,decision:'APPROVE',reason:'Test',lines:request.items.map(i=>({lineId:String(i._id),approvedQtyBase:'8'}))}));
 await assert.rejects(rr.reviewReplenishment(owner,created.id,{...input(),expectedVersion:request.version,decision:'APPROVE',reason:'Test fractional approval',lines:request.items.map(i=>({lineId:String(i._id),approvedQtyBase:'1.5'}))}),/đơn vị gốc/);
 await rr.reviewReplenishment(owner,created.id,{...input(),expectedVersion:request.version,decision:'APPROVE',reason:'Test',lines:request.items.map(i=>({lineId:String(i._id),approvedQtyBase:'8'}))});request=await m.ReplenishmentRequest.findById(created.id);
 const order=await po.createPurchaseOrder(accountant,{creationKey:key(),warehouseId:String(warehouse._id),supplierId:String(supplier._id),expectedOn:'2026-12-01',currency:'VND',lines:[{rrLineId:String(request.items[0]._id),approvalId:String(request.header.latestDecisionId),enteredQty:'2',unitPurchasePrice:'100000'}]});
 await po.confirmPurchaseOrder(accountant,order.id,{...input(),expectedVersion:1});let orderDoc=await m.PurchaseOrder.findById(order.id);
 const inspection=await receiving.createInspection(worker,order.id,{creationKey:key(),expectedPoVersion:orderDoc.version,arrivedAt:new Date().toISOString(),lines:[{poLineId:String(orderDoc.items[0]._id),lotId:String(batch._id),enteredQty:'2',qualityCode:'GOOD',ownershipDecision:'ACCEPT',packagingCondition}]});
 let inspected=await m.GoodsInspection.findById(inspection.id);
 const confirmed=await receiving.confirmInspection(worker,inspection.id,{...input(),expectedVersion:inspected.version,expectedPoVersion:orderDoc.version,destinations:[{inspectionItemId:String(inspected.items[0]._id),locationId:String(receivingLocation._id)}]});
 const receiptId=confirmed.resultRefs.find(r=>r.documentType==='purchase_receipts').documentId;orderDoc=await m.PurchaseOrder.findById(order.id);
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
run('receipt reversal needs independent approval and restores PO headroom once',async()=>{
 const receipt=await postedReceipt();const attachment=await m.Attachment.create({ownerDocumentType:'purchase_receipts',ownerDocumentId:receipt._id,purpose:'TEST',originalName:'test.png',mediaType:'image/png',sizeBytes:10,storageKey:'local-test',checksum:'a'.repeat(64),uploadedBy:worker._id,uploadedAt:new Date(),accessCategory:'BUSINESS',status:'ATTACHED'});
 const order=await m.PurchaseOrder.findById(receipt.header.purchaseOrderId);const reversal=await correction.reverseReceipt(worker,receipt._id,{...input(),expectedVersion:receipt.version,expectedPoVersion:order.version,reason:'Wrong entry',evidenceIds:[String(attachment._id)]});
 assert.equal(await m.StockTransaction.countDocuments({reversedTransactionId:receipt.stockTransactionId}),0);
 await correction.reviewReversal(owner,reversal.id,{...input(),expectedVersion:1,decision:'APPROVE',reason:'Verified'});
 const post={...input(),expectedVersion:2,expectedPoVersion:order.version};await correction.postReversal(owner,reversal.id,post);await correction.postReversal(owner,reversal.id,post);
 assert.equal(await m.StockTransaction.countDocuments({reversedTransactionId:receipt.stockTransactionId}),1);assert.equal((await m.PurchaseReceipt.findById(receipt._id)).workflowStatus,'REVERSED');assert.deepEqual((await reconcilePurchasing()).issues,[]);
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
