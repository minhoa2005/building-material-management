import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';
import * as rr from '../src/modules/replenishments/replenishment.commands.js';
import * as po from '../src/modules/purchase-orders/purchase-order.commands.js';
import * as receiving from '../src/modules/po-receiving/po-receiving.service.js';
import { getDocument, listDocuments, receivingQueue, receivingSummary } from '../src/modules/po-receiving/purchase-read.service.js';
import * as putaway from '../src/modules/po-receiving/purchase-putaway.service.js';
import * as correction from '../src/modules/po-receiving/purchase-correction.service.js';
import * as productService from '../src/modules/products/product.service.js';
import { createLot, getLot, getLotMovements, listLots, updateLot } from '../src/modules/lots/lot.service.js';
import { backfillConversions } from '../src/migrations/conversions.js';
import { makeItem } from '../src/shared/utils/document-items.js';
import { transaction } from '../src/shared/utils/persistence.js';
import { reconcilePurchasing } from '../src/modules/po-receiving/purchase-reconciliation.js';
const enabled=process.env.RUN_NATIVE_API_TESTS==='1';
const run=(name,fn)=>test(name,{skip:!enabled},fn);
let owner,worker,accountant,warehouse,product,batch,supplier,receivingLocation,storageLocation;
const key=()=>new mongoose.Types.ObjectId().toString();
const input=()=>({operationKey:key()});
test.before(async()=>{
 if(!enabled)return;
 // A new isolated test database each run. Never use the application's URI.
 const isolated=process.env.RUN_HIEUDT_TESTS==='1';
 await mongoose.connect(`mongodb://127.0.0.1:${isolated?27018:27017}/wmsd_api_test_${key()}?replicaSet=${isolated?'hieudt-test':'rs0'}`,{serverSelectionTimeoutMS:5000});
 // Collection/index initialization is independent; keep all constraints while
 // batching each model's indexes into one server command.
 const allModels=[...m.models.values()];
 for(let start=0;start<allModels.length;start+=4)await Promise.all(allModels.slice(start,start+4).map(async Model=>{
  await Model.createCollection();
  const indexes=Model.schema.indexes().map(([key,options])=>({key,...options}));
  if(indexes.length)await Model.collection.createIndexes(indexes);
 }));
 await m.Uom.create([{code:'PIECE',name:'Viên'},{code:'BOX',name:'Thùng'},{code:'M2',name:'Mét vuông'}]);
 const permissions=await m.Permission.insertMany(PERMISSION_CATALOGUE.map(p=>({code:p.code,description:p.description,name:p.code})));
 const roles=[];for(const code of ['OWNER','WAREHOUSE','ACCOUNTANT'])roles.push(await m.Role.create({code,name:code,permissionIds:permissions.filter(p=>ROLE_PERMISSIONS[code].includes(p.code)).map(p=>p._id)}));
 warehouse=await m.Warehouse.create({code:'TEST',name:'Test warehouse',lengthMm:'10000',widthMm:'10000',clearHeightMm:'3000'});
 const users=[];for(const role of roles){const u=await m.User.create({username:role.code.toLowerCase(),fullName:role.code,passwordHash:'test-only-unused',roleId:role._id,warehouseIds:[warehouse._id]});users.push(await m.User.findById(u._id).populate({path:'roleId',populate:{path:'permissionIds'}}));}[owner,worker,accountant]=users;
 const category=await m.Category.create({code:'TILE',name:'Tile'});
 product=await m.Product.create({sku:'TEST',name:'Test tile',manufacturerCode:'TEST',categoryId:category._id,color:'White',baseUnit:'PIECE',wholeBaseUnits:true,lengthMm:'600',widthMm:'600',heightMm:'10'});
 batch=await m.ProductBatch.create({productId:product._id,manufacturerLot:'B1',identificationStatus:'VERIFIED',piecesPerCarton:4,cartonLengthMm:'620',cartonWidthMm:'620',cartonHeightMm:'50'});
 const dryRun=await backfillConversions(m.models);
 assert.equal(dryRun.pending,2); // BOX lot conversion + M2 area conversion (600x600 is no longer skipped)
 assert.equal(await m.Conversion.countDocuments(),0);
 assert.equal((await backfillConversions(m.models,{apply:true})).inserted,2);
 await m.Uom.create({code:'ROLL',name:'Cuộn'});
 assert.equal((await backfillConversions(m.models,{apply:true})).inserted,0);
 supplier=await m.Supplier.create({code:'SUP',name:'Supplier',status:'ACTIVE'});
 receivingLocation=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:'IN',locationType:'RECEIVING',usableLengthMm:'5000',usableWidthMm:'5000'});
 storageLocation=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:'ST',locationType:'STORAGE',isPickable:true,usableLengthMm:'5000',usableWidthMm:'5000'});
});
test.after(async()=>{if(enabled){if(!mongoose.connection.name.startsWith('wmsd_api_test_'))throw Error('Unsafe test DB');await mongoose.connection.dropDatabase();await mongoose.disconnect();}});

async function acknowledgeIndependentNeed(body) {
 const assessments=await rr.evaluateReplenishment(worker,body);
 body.lines=body.lines.map((line,index)=>assessments[index].warningRequired?{...line,independentNeedConfirmed:true,independentNeedReason:'Separate independent fixture need'}:line);
}

run('conversion versions use the right scope and preserve document snapshots', async () => {
 const box = await m.Uom.findOne({ code: 'BOX' });
 const custom = await m.Uom.create({ code: 'PACK', name: 'Pack' });
 const pid = String(product._id);
 const lotId = String(batch._id);
 const baseOnly = await rr.getReplenishmentOptions(worker, 'CREATE');
 assert.deepEqual(baseOnly.products.find(row => row.id === pid).units.map(row => row.code).sort(), ['M2', 'PIECE']);
 const payload = { uomId: String(box._id), basePerUnit: '6', validFrom: '2020-01-01', verificationReference: 'Supplier' };
 await productService.createConversion(owner, pid, payload);
 const withoutRef = await productService.createConversion(owner, pid, { uomId: String(box._id), basePerUnit: '9', validFrom: '2099-01-01' });
 assert.equal(withoutRef.verificationReference, 'Cập nhật quy cách thủ công');
 await productService.createConversion(owner, pid, {
   uomId: String(custom._id), basePerUnit: '3', validFrom: '2020-01-01', verificationReference: 'Supplier pack',
 });
 const batchEight = await m.ProductBatch.create({
   productId: product._id, manufacturerLot: 'DETAIL-8', identificationStatus: 'VERIFIED',
   piecesPerCarton: 8, cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50',
 });
 await m.Conversion.create({
   productId: product._id, productBatchId: batchEight._id, uomId: box._id, basePerUnit: '8',
   version: 1, validFrom: new Date('2020-01-01T00:00:00Z'), verificationReference: 'Verified batch factor',
   createdBy: owner._id,
 });
 await m.ProductBatch.create({
   productId: product._id, manufacturerLot: 'DETAIL-UNKNOWN', identificationStatus: 'UNKNOWN',
   piecesPerCarton: 2, cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50',
 });
 const batchDetail = await productService.getProduct(owner, pid);
 assert.equal(batchDetail.currentConversions.length, 1);
 assert.equal(batchDetail.currentConversions[0].basePerUnit, '8');
 assert.equal(batchDetail.currentConversions[0].productBatchId, String(batchEight._id));
 for (const mode of ['CREATE', 'FILTER']) {
   const options = await rr.getReplenishmentOptions(worker, mode);
   const option = options.products.find(row => row.id === pid);
   assert.deepEqual(Object.fromEntries(option.units.map(row => [row.code, row.basePerUnit])), {
     PIECE: '1', M2: '2.777777777778', BOX: '6', PACK: '3',
   });
   assert.equal(option.units.find(row => row.code === 'BOX').name, 'Thùng');
   assert.equal(option.units.find(row => row.code === 'BOX').isCarton, true);
   assert.deepEqual(options.sources, []);
 }
 const records = await productService.listConversions(owner, pid, { uomId: String(box._id), productBatchId: 'null', limit: 1 });
 assert.equal(records.total, 2);
 assert.equal(records.items[0].isCurrent, false);
 assert.equal((await productService.listConversions(owner, pid, { uomId: String(box._id), productBatchId: 'null', page: 2, limit: 1 })).items[0].isCurrent, true);
 const make = (enteredUnit, selectedLot, previous) => transaction(session =>
   makeItem({ productId: pid, lotId: selectedLot, enteredUnit, enteredQty: '2' }, 1, session, { previous }));
 assert.equal((await make('BOX')).qtyBase, '12');
 assert.equal((await make('BOX', lotId)).qtyBase, '8');
 await assert.rejects(productService.createConversion(owner, pid, { ...payload, productBatchId: key() }), /không thuộc/);
 await m.ProductBatch.create({
   productId: product._id, manufacturerLot: 'DETAIL-NO-CONVERSION', identificationStatus: 'VERIFIED',
   piecesPerCarton: 8, cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50',
 });
 assert.deepEqual((await productService.getProduct(owner, pid)).currentConversions.map(row => row.basePerUnit).sort(), ['2.777777777778', '3', '6']);
 const concurrent = { ...payload, uomId: String(custom._id), validFrom: '2025-01-01' };
 const writes = await Promise.allSettled([
   productService.createConversion(owner, pid, concurrent),
   productService.createConversion(owner, pid, concurrent),
 ]);
 assert.equal(writes.filter(row => row.status === 'fulfilled').length, 1);
 assert.equal(writes.find(row => row.status === 'rejected').reason.statusCode, 409);
 const original = await make('PACK');
 await m.Uom.updateOne({ _id: custom._id }, { $set: { isActive: false } });
 const activeOptions = await rr.getReplenishmentOptions(worker, 'CREATE');
 assert.deepEqual(activeOptions.products.find(row => row.id === pid).units.map(row => row.code).sort(), ['BOX', 'M2', 'PIECE']);
 assert.deepEqual((await productService.getProduct(owner, pid)).currentConversions.map(row => row.basePerUnit).sort(), ['2.777777777778', '6']);
 await assert.rejects(make('PACK'), /ngừng hoạt động/);
 assert.equal((await make('PACK', undefined, original)).qtyBase, original.qtyBase);
 assert.equal((await make('M2')).qtyBase, '6'); // 2 m2 of 600x600 = 5.56 pieces, rounded up
 await assert.rejects(make('ROLL'), /Thiếu quy đổi/);
});

run('area units auto-generate conversions and round up to whole pieces', async () => {
 const sqm = await m.Uom.create({ code: 'SQM', name: 'Mét vuông test', areaMm2: '1000000' });
 try {
  const base = { name: 'Area tile', manufacturerCode: 'TEST', categoryId: String(product.categoryId), baseUnit: 'PIECE',
    wholeBaseUnits: true, heightMm: '10', lengthMm: '600', widthMm: '600' };
  const created = await productService.createProduct(owner, { ...base, sku: `AREA-${key().slice(0, 8)}`, color: 'Area' });
  assert.equal(created.conversions.find(row => row.uom.code === 'SQM').basePerUnit, '2.777777777778');
  const make = (enteredQty, enteredUnit = 'SQM') => transaction(session =>
    makeItem({ productId: created.id, enteredUnit, enteredQty }, 1, session));
  assert.equal((await make('100')).qtyBase, '278');
  assert.equal((await make('0.36')).qtyBase, '1');
  await assert.rejects(make('1.5', 'BOX'), /Thiếu quy đổi/);
  const latest = await productService.getProduct(owner, created.id);
  await productService.updateProduct(owner, created.id, { ...base, categoryId: String(product.categoryId), expectedUpdatedAt: latest.updatedAt,
    lengthMm: '500', widthMm: '500', color: 'Area' });
  const rows = await productService.listConversions(owner, created.id, { uomId: String(sqm._id), productBatchId: 'null', limit: 10 });
  assert.deepEqual(rows.items.map(row => row.basePerUnit).sort(), ['2.777777777778', '4']);
  assert.equal((await make('10.1')).qtyBase, '41');
 } finally {
  await m.Uom.updateOne({ _id: sqm._id }, { $set: { isActive: false } }); // keep later tests' conversion lists unchanged
 }
});

run('lot list, detail and movement queries apply filters and expose stock history', async () => {
 const location=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:key(),locationType:'STORAGE',isPickable:true,usableLengthMm:'5000',usableWidthMm:'5000'});
 const point=await m.StockHoldingPoint.create({type:'LOCATION',locationId:location._id});
 const balance=await m.InventoryBalance.create({holdingPointId:point._id,batchId:batch._id,qualityStatus:'GOOD',ownerType:'STORE',quantityBase:'2',version:0,packagingPortions:[{packagingState:'LOOSE',quantityBase:'2',createdBy:owner._id}]});
 const listed=await listLots(owner,{productId:String(product._id),identificationStatus:'VERIFIED',manufacturerLot:'b1',warehouseId:String(warehouse._id),page:1,limit:10});
 assert.equal(listed.total,1);
 assert.equal(String(listed.items[0]._id),String(batch._id));
 const detail=await getLot(owner,String(batch._id));
 assert.equal(detail.balances.length,1);
 assert.equal(detail.balances[0].id,String(balance._id));

 const transactionId=new mongoose.Types.ObjectId();
 await m.StockTransaction.create({_id:transactionId,sourceType:'test',sourceId:new mongoose.Types.ObjectId(),operation:'TEST',eventKey:key(),requestKey:key(),requestHash:'a'.repeat(64),performedBy:owner._id,occurredAt:new Date(),recordedAt:new Date(),movements:[{_id:new mongoose.Types.ObjectId(),transactionId,lineNo:1,sourceLineId:new mongoose.Types.ObjectId(),toBalanceId:balance._id,quantityBase:'2',toBefore:'0',toAfter:'2'}]});
 const movements=await getLotMovements(owner,String(batch._id),{page:1,limit:10});
 assert.equal(movements.total,1);
 assert.equal(movements.items[0].toBalanceId,String(balance._id));
 assert.equal(movements.items[0].fromBalanceId,null);
});

run('planned PO conversion and actual lot conversion remain separate through receipt', async () => {
 const receivedLot = await createLot(owner, {
   productId: product._id, manufacturerLot: 'CONVERSION-TEST', identificationStatus: 'UNKNOWN',
   piecesPerCarton: 4, cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50',
 });
 const verified = await updateLot(owner, receivedLot.id, {
   expectedUpdatedAt: receivedLot.updatedAt, identificationStatus: 'VERIFIED', piecesPerCarton: 8,
 });
 const requestInput = {
   creationKey: key(), action: 'SUBMIT', warehouseId: String(warehouse._id), neededOn: '2026-12-01',
   triggerReason: 'Conversion test', lines: [{ productId: String(product._id), enteredUnit: 'BOX', enteredQty: '10', reasonNote: 'Test' }],
 };
 await acknowledgeIndependentNeed(requestInput);
 const created = await rr.createReplenishment(worker, requestInput);
 let request = await m.ReplenishmentRequest.findById(created.id);
 assert.equal(String(request.items[0].qtyBase), '60');
 await rr.reviewReplenishment(owner, created.id, {
   ...input(), expectedVersion: request.version, decision: 'APPROVE', reason: 'Test',
   lines: [{ lineId: String(request.items[0]._id), approvedQtyBase: '60' }],
 });
 request = await m.ReplenishmentRequest.findById(created.id);
 const order = await po.createPurchaseOrder(accountant, {
   creationKey: key(), warehouseId: String(warehouse._id), supplierId: String(supplier._id), expectedOn: '2026-12-01',
   currency: 'VND', lines: [{ rrLineId: String(request.items[0]._id), approvalId: String(request.header.latestDecisionId), enteredQty: '10', unitPurchasePrice: '100000' }],
 });
 await po.confirmPurchaseOrder(accountant, order.id, { ...input(), expectedVersion: 1 });
 let orderDoc = await m.PurchaseOrder.findById(order.id);
 const inspect = async enteredQty => {
   const createdInspection = await receiving.createInspection(worker, order.id, {
     creationKey: key(), expectedPoVersion: orderDoc.version, arrivedAt: new Date().toISOString(),
     lines: [{ poLineId: String(orderDoc.items[0]._id), lotId: verified.id, enteredQty, qualityCode: 'GOOD', ownershipDecision: 'ACCEPT', packagingCondition: 'SEALED' }],
   });
   return m.GoodsInspection.findById(createdInspection.id);
 };
 const confirm = inspection => receiving.confirmInspection(worker, inspection._id, {
   ...input(), expectedVersion: inspection.version, expectedPoVersion: orderDoc.version,
   destinations: [{ inspectionItemId: String(inspection.items[0]._id), locationId: String(receivingLocation._id) }],
 });
 const over = await inspect('8');
 await assert.rejects(confirm(over), /vượt/i);
 const inspection = await inspect('7');
 assert.equal(String(inspection.items[0].baseUnitsPerUnit), '8');
 assert.equal(String(inspection.items[0].qtyBase), '56');
 const confirmed = await confirm(inspection);
 const receiptId = confirmed.resultRefs.find(ref => ref.documentType === 'goods_receipts').documentId;
 orderDoc = await m.PurchaseOrder.findById(order.id);
 await receiving.postReceipt(worker, receiptId, { ...input(), expectedVersion: 1, expectedPoVersion: orderDoc.version });
 const receipt = await m.PurchaseReceipt.findById(receiptId);
 assert.equal(String(receipt.items[0].baseUnitsPerUnit), '8');
 assert.equal(String(receipt.items[0].qtyBase), '56');
 const [balance] = await receiving.commitments(await m.PurchaseOrder.findById(order.id));
 assert.equal(balance.outstandingQtyBase, '4');
 assert.equal(String(orderDoc.items[0].baseUnitsPerUnit), '6');
});
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
 const inspection=await receiving.createInspection(worker,order.id,{creationKey:key(),expectedPoVersion:orderDoc.version,arrivedAt:new Date().toISOString(),deliveredBy:'Người giao A - 0901234567',deliveryReference:'PG-001',lines:[{poLineId:String(orderDoc.items[0]._id),lotId:String(batch._id),enteredQty:'2',qualityCode,ownershipDecision:custodyOnly?'CUSTODY':'ACCEPT',packagingCondition}]});
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
run('product image URLs create, list, detail, update, audit and legacy defaults',async()=>{
 const suffix=key().slice(0,8);const imageUrls=[`https://images.example.com/${suffix}-front.webp`,`https://images.example.com/${suffix}-texture.webp`];
 const created=await productService.createProduct(owner,{sku:`IMG-${suffix}`,name:'Image URL test tile',manufacturerCode:'TEST',categoryId:String(product.categoryId),baseUnit:'PIECE',wholeBaseUnits:true,lengthMm:'600',widthMm:'600',heightMm:'10',color:`Image ${suffix}`,imageUrls});
 assert.deepEqual(created.imageUrls,imageUrls);
 const legacyCreated=await productService.createProduct(owner,{sku:`IMG-OLD-${suffix}`,name:'Legacy image client tile',manufacturerCode:'TEST',categoryId:String(product.categoryId),baseUnit:'PIECE',wholeBaseUnits:true,lengthMm:'600',widthMm:'600',heightMm:'10',color:`Legacy ${suffix}`});
 assert.deepEqual(legacyCreated.imageUrls,[]);
 assert.deepEqual((await productService.getProduct(owner,created.id)).imageUrls,imageUrls);
 const listed=await productService.listProducts(owner,{page:1,limit:100,sortBy:'createdAt',sortOrder:'desc'});
 assert.deepEqual(listed.items.find(item=>item.id===created.id).imageUrls,imageUrls);

 const id=new mongoose.Types.ObjectId(created.id);let current=await m.Product.findById(id).lean();
 const editable={name:current.name,manufacturerCode:current.manufacturerCode,categoryId:String(current.categoryId),material:current.material??null,surface:current.surface??null,origin:current.origin??null,description:current.description??null,baseUnit:current.baseUnit,wholeBaseUnits:current.wholeBaseUnits,lengthMm:String(current.lengthMm),widthMm:String(current.widthMm),heightMm:String(current.heightMm),color:current.color};
 const update=async(expectedUpdatedAt,extra={})=>productService.updateProduct(owner,String(id),{...editable,expectedUpdatedAt:expectedUpdatedAt.toISOString(),...extra});
 const reordered=[imageUrls[1],imageUrls[0]];
 let updated=await update(current.updatedAt,{imageUrls:reordered});
 assert.deepEqual(updated.imageUrls,reordered);
 const audit=await m.AuditLog.findOne({subjectType:'products',subjectId:id,action:'UPDATE_PRODUCT'}).sort({recordedAt:-1}).lean();
 const imageChange=audit.changes.find(change=>change.field==='imageUrls');
 assert.deepEqual(imageChange.before,imageUrls);
 assert.deepEqual(imageChange.after,reordered);

 current=await m.Product.findById(id).lean();
 updated=await update(current.updatedAt);
 assert.deepEqual(updated.imageUrls,reordered,'omitting imageUrls must preserve saved images');
 await assert.rejects(update(new Date(created.updatedAt),{imageUrls:[]}));
 current=await m.Product.findById(id).lean();
 updated=await update(current.updatedAt,{imageUrls:[]});
 assert.deepEqual(updated.imageUrls,[]);
 await assert.rejects(productService.updateProduct(worker,String(id),{...editable,expectedUpdatedAt:current.updatedAt.toISOString(),imageUrls}),/quyền/i);

 await m.Product.collection.updateOne({_id:product._id},{$unset:{imageUrls:''}});
 assert.deepEqual((await productService.getProduct(owner,String(product._id))).imageUrls,[]);
 const legacyList=await productService.listProducts(owner,{page:1,limit:100,sortBy:'createdAt',sortOrder:'desc'});
 assert.deepEqual(legacyList.items.find(item=>item.id===String(product._id)).imageUrls,[]);
});
run('native RR → PO → inspection → receipt → partial putaway preserves stock, sources and replay',async()=>{
 const receipt=await postedReceipt();const context=await putaway.putawayContext(worker,receipt._id);
 const detail = await getDocument(worker, receipt._id, 'GR_PURCHASE');
 assert.equal(detail.header.supplierName, supplier.name);
 assert.equal(detail.header.warehouseName, warehouse.name);
 assert.equal(detail.header.postedBy, String(worker._id));
 assert.equal(detail.header.postedByName, worker.fullName);
 assert.equal(detail.header.postedAt, receipt.postedAt.toISOString());
 const arrival = await m.GoodsArrival.findById(receipt.header.arrivalId);
 assert.deepEqual(detail.arrival.header, {
   arrivedAt: arrival.header.arrivedAt.toISOString(),
   deliveredBy: 'Người giao A - 0901234567',
   deliveryReference: 'PG-001',
 });
 assert.equal(detail.items[0].inspectionResult.qualityCode, 'GOOD');
 assert.equal(detail.items[0].lotLabelSnapshot, batch.manufacturerLot);
 const task=await putaway.createPutaway(worker,receipt._id,{creationKey:key(),expectedVersion:receipt.version,lines:[{receiptLineId:String(receipt.items[0]._id),expectedSourceVersion:context.items[0].sourceBalanceVersion,qtyBase:'8',toLocationId:String(storageLocation._id)}]});
 const taskDetail=await putaway.getPutaway(worker,task.id);assert.equal(taskDetail.header.receiptId,String(receipt._id));assert.deepEqual([taskDetail.items[0].actualQtyBase,taskDetail.items[0].remainingQtyBase],['0','8']);
 let taskDoc=await m.TransferOrder.findById(task.id);await putaway.confirmPutaway(worker,task.id,{...input(),expectedVersion:taskDoc.version,lines:[{taskLineId:String(taskDoc.items[0]._id),actualQtyBase:'4'}]});
 const taskQuery = { page: 1, limit: 1, status: 'PARTIAL', purchaseOrderId: String(receipt.header.purchaseOrderId) };
 const taskList = await putaway.listPutaway(worker, { ...taskQuery, q: taskDoc.documentNo.slice(0, -1).toLowerCase() });
 assert.equal(taskList.total, 1);
 assert.deepEqual([taskList.items[0].plannedQtyBase, taskList.items[0].actualQtyBase, taskList.items[0].remainingQtyBase], ['8','4','4']);
 assert.equal(taskList.items[0].sourceReceipt.id, String(receipt._id));
 assert.equal((await putaway.listPutaway(worker, { ...taskQuery, q: '.*' })).total, 0);
 const queueQuery = { page: 1, limit: 1, stage: 'AWAITING_PUTAWAY', purchaseOrderId: taskQuery.purchaseOrderId };
 const queue = await receivingQueue(worker, { ...queueQuery, q: receipt.documentNo.slice(0, -1).toLowerCase() });
 assert.equal(queue.total, 1);
 assert.equal(queue.items[0]._id, String(receipt._id));
 assert.equal((await receivingQueue(worker, { ...queueQuery, q: '.*' })).total, 0);
 assert.ok((await receivingSummary(worker, String(receipt.header.purchaseOrderId))).documents.some(row => row.kind === 'PUTAWAY' && row.id === task.id));
 taskDoc=await m.TransferOrder.findById(task.id);assert.equal(taskDoc.workflowStatus,'PARTIAL');await putaway.confirmPutaway(worker,task.id,{...input(),expectedVersion:taskDoc.version,lines:[{taskLineId:String(taskDoc.items[0]._id),actualQtyBase:'4'}]});
 assert.equal((await m.TransferOrder.findById(task.id)).workflowStatus,'CONFIRMED');assert.equal((await putaway.placementQuantities(receipt))[0].unplacedQtyBase,'0');const report=await reconcilePurchasing();assert.deepEqual(report.issues,[]);
 const preflight=await correction.reversalPreflight(worker,receipt._id);assert.equal(preflight.eligible,false);
});
run('BF03 confirms one complete relocation only and an idempotent retry posts once',async()=>{
 const relocations=await import('../src/modules/location-movements/location-movement.service.js');
 const overflow=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:'BF03-ALT',locationType:'STORAGE',usableLengthMm:'5000',usableWidthMm:'5000'});
 const point=await m.StockHoldingPoint.findOne({locationId:storageLocation._id});
 const balance=await m.InventoryBalance.findOne({holdingPointId:point._id,batchId:batch._id});
 const options=await relocations.locationMovementOptions(worker,String(warehouse._id));
 assert.ok(options.balances.some(row=>String(row._id)===String(balance._id)));
 for(const enteredQty of ['0.5','1']) await assert.rejects(relocations.createLocationMovement(worker,{idempotencyKey:key(),warehouseId:String(warehouse._id),reason:'Reject fractional or broken carton',lines:[{sourceBalanceId:String(balance._id),sourceBalanceVersion:balance.version,toLocationId:String(overflow._id),enteredUnit:'PIECE',enteredQty}]}),/nguyên|Không tự/);
 const created=await relocations.createLocationMovement(worker,{idempotencyKey:key(),warehouseId:String(warehouse._id),reason:'BF03 full confirmation',lines:[{sourceBalanceId:String(balance._id),sourceBalanceVersion:balance.version,toLocationId:String(overflow._id),enteredUnit:'PIECE',enteredQty:'4'}]});
 const otherRaw=await m.User.create({username:'other-warehouse',fullName:'Other warehouse',passwordHash:'unused',roleId:worker.roleId._id,warehouseIds:[warehouse._id]});
 const other=await m.User.findById(otherRaw._id).populate({path:'roleId',populate:{path:'permissionIds'}});
 await assert.rejects(relocations.confirmLocationMovement(other,created.id,{idempotencyKey:key(),expectedVersion:1,lines:[{lineId:String((await m.TransferOrder.findById(created.id)).items[0]._id),actualQtyBase:'4'}]}),/người lập/);
 const open=await m.TransferOrder.findById(created.id);
 await assert.rejects(relocations.confirmLocationMovement(worker,created.id,{idempotencyKey:key(),expectedVersion:open.version,lines:[{lineId:String(open.items[0]._id),actualQtyBase:'1'}]}),/bằng lượng lệnh/);
 const confirmInput={idempotencyKey:key(),expectedVersion:open.version,lines:[{lineId:String(open.items[0]._id),actualQtyBase:'4'}]};
 await relocations.confirmLocationMovement(worker,created.id,confirmInput);
 await relocations.confirmLocationMovement(worker,created.id,confirmInput);
 assert.equal((await m.TransferOrder.findById(created.id)).workflowStatus,'CONFIRMED');
 assert.equal(await m.StockTransaction.countDocuments({sourceId:created.id,operation:'RELOCATE'}),1);
 const destinationPoint=await m.StockHoldingPoint.findOne({locationId:overflow._id});
 const destinationBalance=await m.InventoryBalance.findOne({holdingPointId:destinationPoint._id,batchId:batch._id});
 const reverse=await relocations.createLocationMovement(worker,{idempotencyKey:key(),warehouseId:String(warehouse._id),reason:'Restore test stock',lines:[{sourceBalanceId:String(destinationBalance._id),sourceBalanceVersion:destinationBalance.version,toLocationId:String(storageLocation._id),enteredUnit:'PIECE',enteredQty:'4'}]});
 const reverseDoc=await m.TransferOrder.findById(reverse.id);
 await relocations.confirmLocationMovement(worker,reverse.id,{idempotencyKey:key(),expectedVersion:reverseDoc.version,lines:[{lineId:String(reverseDoc.items[0]._id),actualQtyBase:'4'}]});
});
run('Warehouse reversal restores PO headroom once without separate approval',async()=>{
 const receipt=await postedReceipt();const attachment=await m.Attachment.create({ownerDocumentType:'goods_receipts',ownerDocumentId:receipt._id,purpose:'TEST',originalName:'test.png',mediaType:'image/png',sizeBytes:10,storageKey:'local-test',checksum:'a'.repeat(64),uploadedBy:worker._id,uploadedAt:new Date(),accessCategory:'BUSINESS',status:'ATTACHED'});
 const order=await m.PurchaseOrder.findById(receipt.header.purchaseOrderId);const payload={...input(),expectedVersion:receipt.version,expectedPoVersion:order.version,reason:'Wrong entry',evidenceIds:[String(attachment._id)]};
 const reversal=await correction.reverseReceipt(worker,receipt._id,payload);await correction.reverseReceipt(worker,receipt._id,payload);
 assert.equal((await m.StockReversal.findById(reversal.id)).workflowStatus,'POSTED');assert.equal(await m.StockTransaction.countDocuments({reversedTransactionId:receipt.stockTransactionId}),1);assert.equal((await m.PurchaseReceipt.findById(receipt._id)).workflowStatus,'REVERSED');assert.deepEqual((await reconcilePurchasing()).issues,[]);
});
run('reversal reopens a COMPLETED PO but keeps a CLOSED PO terminal',async()=>{
 const reverse=async(status)=>{
  const receipt=await postedReceipt();const attachment=await m.Attachment.create({ownerDocumentType:'goods_receipts',ownerDocumentId:receipt._id,purpose:'TEST',originalName:'test.png',mediaType:'image/png',sizeBytes:10,storageKey:'local-test',checksum:'a'.repeat(64),uploadedBy:worker._id,uploadedAt:new Date(),accessCategory:'BUSINESS',status:'ATTACHED'});
  if(status)await m.PurchaseOrder.collection.updateOne({_id:receipt.header.purchaseOrderId},{$set:{workflowStatus:status}});
  const order=await m.PurchaseOrder.findById(receipt.header.purchaseOrderId);
  await correction.reverseReceipt(worker,receipt._id,{...input(),expectedVersion:receipt.version,expectedPoVersion:order.version,reason:'Wrong entry',evidenceIds:[String(attachment._id)]});
  return (await m.PurchaseOrder.findById(order._id)).workflowStatus;
 };
 assert.equal(await reverse(null),'OPEN');
 assert.equal(await reverse('COMPLETED'),'OPEN');
 assert.equal(await reverse('CLOSED'),'CLOSED');
});
run('PO exposes hasOpenReceivingWork for draft inspections without changing its status',async()=>{
 const receipt=await postedReceipt();const poId=receipt.header.purchaseOrderId;
 await m.PurchaseOrder.collection.updateOne({_id:poId},{$set:{workflowStatus:'PARTIAL'}});
 const flag=async()=>(await getPurchaseOrder(accountant,String(poId))).hasOpenReceivingWork;
 assert.equal(await flag(),false);
 const arrivalId=new mongoose.Types.ObjectId();
 await m.GoodsArrival.collection.insertOne({_id:arrivalId,header:{purchaseOrderId:poId}});
 const inspectionId=new mongoose.Types.ObjectId();
 await m.GoodsInspection.collection.insertOne({_id:inspectionId,workflowStatus:'DRAFT',header:{arrivalId}});
 assert.equal(await flag(),true);
 assert.equal((await getPurchaseOrder(accountant,String(poId))).workflowStatus,'PARTIAL');
 const listed=await listPurchaseOrders(accountant,{page:1,limit:100});
 assert.equal(listed.items.find(row=>row.id===String(poId)).hasOpenReceivingWork,true);
 await m.GoodsInspection.collection.updateOne({_id:inspectionId},{$set:{workflowStatus:'CONFIRMED'}});
 assert.equal(await flag(),false);
 await m.PurchaseOrder.collection.updateOne({_id:poId},{$set:{workflowStatus:'COMPLETED'}});
 await m.GoodsInspection.collection.updateOne({_id:inspectionId},{$set:{workflowStatus:'DRAFT'}});
 assert.equal(await flag(),false);
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
 const reads=await import('../src/modules/transfers/transfer-read.service.js');
 const selections=await reads.transferOptions(actor,String(destination._id));
 assert.ok(selections.warehouses.some(row=>String(row._id)===String(destination._id)));
 assert.ok(selections.warehouses.some(row=>String(row._id)===String(warehouse._id)));
 assert.deepEqual(selections.sourceWarehouseIds,[String(destination._id)]);
 await assert.rejects(reads.transferOptions(actor,String(warehouse._id)));
 const request=await transfers.createRequest(worker,{idempotencyKey:key(),sourceWarehouseId:String(warehouse._id),destinationWarehouseId:String(destination._id),reason:'Transfer test',lines:[{productId:String(product._id),enteredUnit:'PIECE',enteredQty:'8'}]});
 await transfers.reviewRequest(owner,request.id,{idempotencyKey:key(),expectedVersion:1,decision:'APPROVE',reason:'Approved test'});
 const req=await m.WarehouseTransferRequest.findById(request.id),point=await m.StockHoldingPoint.findOne({locationId:storageLocation._id}),balance=await m.InventoryBalance.findOne({holdingPointId:point._id,batchId:batch._id});
 const dispatch=await transfers.createDispatch(worker,request.id,{idempotencyKey:key(),expectedVersion:req.version,lines:[{requestLineId:String(req.items[0]._id),sourceBalanceId:String(balance._id),stagingLocationId:String(staging._id),qtyBase:'8'}]});
 const pick=await transfers.createRequirement(worker,dispatch.id,{idempotencyKey:key(),expectedVersion:1});
 await transfers.confirmTask(worker,pick.id,{idempotencyKey:key(),expectedVersion:1,recipientName:'Transporter'});
 let shipped=await m.TransferDispatch.findById(dispatch.id);assert.equal(shipped.handovers.length,1);
 const eligible = { receivable: 'true', page: 1, limit: 10, destinationWarehouseId: String(destination._id), status: ['POSTED', 'DRAFT'] };
 assert.deepEqual((await reads.listDispatches(actor, eligible)).items.map(row => row._id), [dispatch.id]);
 assert.equal((await reads.listDispatches(worker, eligible)).total, 0);
 assert.equal((await reads.getDispatch(actor, dispatch.id)).receivableLines[0].remainingQtyBase, '8');
 const { listQuery } = await import('../src/modules/transfers/transfer-read.validation.js');
 assert.ok((await reads.listTransfers(actor, listQuery.parse({ status: 'APPROVED,OPEN' }))).items.some(row => row._id === request.id));
 const received=await transfers.receiveTransfer(actor,dispatch.id,{idempotencyKey:key(),expectedVersion:shipped.version,lines:[{dispatchLineId:String(shipped.items[0]._id),locationId:String(inbound._id),qtyBase:'8',qualityCode:'GOOD'}]});
 assert.equal((await reads.listDispatches(actor, eligible)).total, 0);
 const receivingDoc=await m.TransferReceipt.findById(received.id);
 const putting=await transfers.createRequirement(actor,received.id,{idempotencyKey:key(),expectedVersion:1,destinations:[{receiptLineId:String(receivingDoc.items[0]._id),locationId:String(target._id)}]});
 await transfers.confirmTask(actor,putting.id,{idempotencyKey:key(),expectedVersion:1});
 const current=await m.WarehouseTransferRequest.findById(request.id);await transfers.closeRequest(actor,request.id,{idempotencyKey:key(),expectedVersion:current.version});
 assert.equal((await m.WarehouseTransferRequest.findById(request.id)).workflowStatus,'COMPLETED');assert.deepEqual((await reconcilePurchasing()).issues,[]);
 const reverseStaging=await m.WarehouseLocation.create({warehouseId:destination._id,code:'BACK-OUT',locationType:'STAGING',usableLengthMm:'5000',usableWidthMm:'5000'});
 const quarantine=await m.WarehouseLocation.create({warehouseId:warehouse._id,code:'BF04-Q',locationType:'QUARANTINE',usableLengthMm:'5000',usableWidthMm:'5000'});
 const reverseRequest=await transfers.createRequest(actor,{idempotencyKey:key(),sourceWarehouseId:String(destination._id),destinationWarehouseId:String(warehouse._id),reason:'Damaged receipt completion',lines:[{productId:String(product._id),enteredUnit:'PIECE',enteredQty:'4'}]});
 await transfers.reviewRequest(owner,reverseRequest.id,{idempotencyKey:key(),expectedVersion:1,decision:'APPROVE',reason:'Approved damaged path'});
 const reverseDoc=await m.WarehouseTransferRequest.findById(reverseRequest.id),targetPoint=await m.StockHoldingPoint.findOne({locationId:target._id}),targetBalance=await m.InventoryBalance.findOne({holdingPointId:targetPoint._id,batchId:batch._id});
 const reverseDispatch=await transfers.createDispatch(actor,reverseRequest.id,{idempotencyKey:key(),expectedVersion:reverseDoc.version,lines:[{requestLineId:String(reverseDoc.items[0]._id),sourceBalanceId:String(targetBalance._id),stagingLocationId:String(reverseStaging._id),qtyBase:'4'}]});
 const reversePick=await transfers.createRequirement(actor,reverseDispatch.id,{idempotencyKey:key(),expectedVersion:1});
 await transfers.confirmTask(actor,reversePick.id,{idempotencyKey:key(),expectedVersion:1,recipientName:'Return carrier'});
 const reverseShipped=await m.TransferDispatch.findById(reverseDispatch.id);
 const damagedReceipt=await transfers.receiveTransfer(worker,reverseDispatch.id,{idempotencyKey:key(),expectedVersion:reverseShipped.version,lines:[{dispatchLineId:String(reverseShipped.items[0]._id),locationId:String(quarantine._id),qtyBase:'4',qualityCode:'DAMAGED',damageReason:'Damaged in test'}]});
 await assert.rejects(transfers.createRequirement(worker,damagedReceipt.id,{idempotencyKey:key(),expectedVersion:1,destinations:[]}),/không cần lệnh xếp hàng/);
 assert.equal(await m.InternalTransferRequirement.countDocuments({'header.sourceDocumentId':damagedReceipt.id}),0);
 const requestToClose=await m.WarehouseTransferRequest.findById(reverseRequest.id);
 await transfers.closeRequest(worker,reverseRequest.id,{idempotencyKey:key(),expectedVersion:requestToClose.version});
 assert.equal((await m.WarehouseTransferRequest.findById(reverseRequest.id)).workflowStatus,'COMPLETED');
});

run('opened cartons require measured packaging and failed posting leaves no stock transaction',async()=>{const receipt=await postedReceipt('OPENED');assert.equal(receipt.workflowStatus,'POSTED');assert.deepEqual((await reconcilePurchasing()).issues,[]);});

import * as custody from '../src/modules/po-receiving/purchase-custody.service.js';
run('custody acceptance, ownership reversal and return preserve physical stock and sources',async()=>{
 let held=await postedReceipt('SEALED',true);const item=held.items[0];
 const heldInspection = await m.GoodsInspection.findById(held.sources[0].documentId);
 const heldArrival = await m.GoodsArrival.findById(heldInspection.header.arrivalId);
 const custodyList = await listDocuments(worker, 'CUSTODY_RECEIPT', { page: 1, limit: 10, status: 'POSTED',
   purchaseOrderId: String(heldArrival.header.purchaseOrderId) });
 assert.equal(custodyList.total, 1);
 assert.equal(custodyList.items[0].sourceInspection.id, String(heldInspection._id));
 assert.equal(custodyList.items[0].header.warehouseName, warehouse.name);
 assert.ok(custodyList.items[0].items[0].holdingLocationId);
 assert.ok((await receivingSummary(worker, String(heldArrival.header.purchaseOrderId))).documents.some(row =>
   row.kind === 'CUSTODY_RECEIPT' && row.id === String(held._id)));
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
import { getPurchaseOrder, listPurchaseOrders } from '../src/modules/purchase-orders/purchase-order.service.js';

run('PO keeps one line per RR line; area-unit lines round up to whole pieces', async () => {
 const requestBody = {
   creationKey: key(), action: 'SUBMIT', warehouseId: String(warehouse._id), neededOn: '2026-12-01',
   triggerReason: 'Area purchase order',
   lines: [{ productId: String(product._id), enteredUnit: 'M2', enteredQty: '100', reasonNote: 'Fixture' }],
 };
 await acknowledgeIndependentNeed(requestBody);
 const createdRequest = await rr.createReplenishment(worker, requestBody);
 const request = await m.ReplenishmentRequest.findById(createdRequest.id);
 assert.equal(request.items[0].qtyBase.toString(), '278');
 const rrLineId = String(request.items[0]._id);
 const approval = await rr.reviewReplenishment(owner, createdRequest.id, {
   ...input(), expectedVersion: request.version, decision: 'APPROVE', reason: 'Approved',
   lines: [{ lineId: rrLineId, approvedQtyBase: '278' }],
 });
 const form = { warehouseId: String(warehouse._id), supplierId: String(supplier._id), currency: 'VND' };
 const source = { rrLineId, approvalId: approval.decisionId, unitPurchasePrice: '1000' };
 // Lots are split at inspection and receipt, not on the PO.
 await assert.rejects(po.createPurchaseOrder(accountant, { ...form, creationKey: key(),
   lines: [{ ...source, enteredQty: '50' }, { ...source, enteredQty: '50' }] }), /Gộp lượng của cùng dòng RR/);
 // 100.09 m2 rounds up to 279 pieces > 278 approved.
 await assert.rejects(po.createPurchaseOrder(accountant, { ...form, creationKey: key(),
   lines: [{ ...source, enteredQty: '100.09' }] }), /vượt nguồn được duyệt/);
 const created = await po.createPurchaseOrder(accountant, { ...form, creationKey: key(),
   lines: [{ ...source, enteredQty: '100.08', note: 'Lô NCC báo giao' }] });
 const detail = await getPurchaseOrder(accountant, created.id);
 assert.deepEqual(detail.items.map(item => [item.enteredQty, item.qtyBase, item.lineAmount, item.note]),
   [['100.08', '278', '100080', 'Lô NCC báo giao']]);
 const confirmed = await po.confirmPurchaseOrder(accountant, created.id, { ...input(), expectedVersion: created.version });
 assert.equal(confirmed.workflowStatus, 'OPEN');
});


run('HTTP PO lifecycle supports draft edits, expected-date changes, receiving history and closure', async () => {
 const requestBody = {
   creationKey: key(), action: 'SUBMIT', warehouseId: String(warehouse._id), neededOn: '2026-12-01',
   triggerReason: 'PO draft lifecycle test',
   lines: [{ productId: String(product._id), enteredUnit: 'PIECE', enteredQty: '8', reasonNote: 'Fixture' }],
 };
 await acknowledgeIndependentNeed(requestBody);
 const createdRequest = await rr.createReplenishment(worker, requestBody);
 const request = await m.ReplenishmentRequest.findById(createdRequest.id);
 const rrLineId = String(request.items[0]._id);
 const approval = await rr.reviewReplenishment(owner, createdRequest.id, {
   ...input(), expectedVersion: request.version, decision: 'APPROVE', reason: 'Approved',
   lines: [{ lineId: rrLineId, approvedQtyBase: '8' }],
 });
 const server = app.listen(0, '127.0.0.1');
 try {
   await new Promise(resolve => server.once('listening', resolve));
   const base = 'http://127.0.0.1:' + server.address().port + '/api/purchase-orders';
   const api = async (method, path = '', body, user = accountant) => {
     const token = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026');
     const response = await fetch(base + path, {
       method, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
       body: JSON.stringify(body),
     });
     return { status: response.status, body: await response.json() };
   };
   const line = { rrLineId, approvalId: approval.decisionId, enteredQty: '8', unitPurchasePrice: '1000', note: '  Lô NCC  ' };
   const expectedOn = '2026-11-30T00:00:00.000Z';
   const form = { warehouseId: String(warehouse._id), supplierId: String(supplier._id), currency: 'VND', expectedOn };
   assert.equal((await api('POST', '', { ...form, creationKey: key(), lines: [{ ...line, note: '' }] })).status, 400);
   const created = await api('POST', '', { ...form, creationKey: key(), lines: [line] });
   assert.equal(created.status, 200, created.body.message);
   assert.equal(created.body.data.workflowStatus, 'DRAFT');
   const { id, version } = created.body.data;
   const path = '/' + id;
   const expectedOnPath = path + '/expected-on';
   const reschedule = expectedVersion => ({
     ...input(), expectedVersion, expectedOn: '2026-12-03T09:00:00+07:00', reason: 'Supplier changed the delivery date',
   });
   assert.equal((await api('POST', expectedOnPath, reschedule(version))).status, 400);
   const detail = await api('GET', path);
   assert.equal(detail.body.data.items[0].note, 'Lô NCC');
   const poLineId = detail.body.data.items[0]._id;
   const edit = expectedVersion => ({
     ...form, ...input(), expectedVersion, lines: [{ ...line, id: poLineId, enteredQty: '4' }],
   });
   const updated = await api('PUT', path, edit(version));
   assert.equal(updated.status, 200, updated.body.message);
   assert.equal(updated.body.data.workflowStatus, 'DRAFT');
   const issued = await api('POST', path + '/confirm', { ...input(), expectedVersion: updated.body.data.version });
   assert.equal(issued.status, 200, issued.body.message);
   assert.equal(issued.body.data.workflowStatus, 'OPEN');
   const issuedVersion = issued.body.data.version;
   const rejected = await api('PUT', path, edit(issuedVersion));
   assert.equal(rejected.status, 400);
   assert.equal(rejected.body.message, 'Chỉ sửa trực tiếp PO nháp');
   for (const route of ['/supplier-confirmations', '/amendments']) {
     assert.equal((await api('POST', path + route, { ...input(), expectedVersion: issuedVersion })).status, 404);
   }

   // Simulate an older stored PO without backfilling or rewriting MongoDB records.
   const expectedAt = new Date(expectedOn);
   const quantityBase = mongoose.Types.Decimal128.fromString('4');
   await m.PurchaseOrder.collection.updateOne({ _id: id }, { $set: {
     'header.supplierConfirmation': 'Legacy confirmation',
     'items.0.supplierConfirmedQtyBase': quantityBase,
     'items.0.supplierConfirmedBy': accountant._id,
     'items.0.supplierConfirmedAt': expectedAt,
     'items.0.deliverySchedule': [{ quantityBase, expectedAt, supplierReference: 'LEGACY-SCHEDULE' }],
   } });
   const summary = await api('GET', path + '/receiving-summary');
   assert.equal(summary.status, 200);
   assert.deepEqual(summary.body.data.documents, []);
   assert.ok(!Object.hasOwn(summary.body.data, 'schedules'));
   assert.equal(summary.body.data.quantities[0].orderedQtyBase, '4');
   assert.ok(!Object.hasOwn(summary.body.data.quantities[0].snapshot, 'deliverySchedule'));
   const legacyDetail = (await api('GET', path)).body.data;
   assert.ok(legacyDetail.header.issuedAt);
   assert.equal(legacyDetail.version, issuedVersion);
   assert.ok(!Object.hasOwn(legacyDetail.header, 'supplierConfirmation'));
   const retiredFields = ['supplierConfirmedQtyBase', 'supplierConfirmedBy', 'supplierConfirmedAt', 'deliverySchedule'];
   for (const field of retiredFields) {
     assert.ok(!Object.hasOwn(legacyDetail.items[0], field));
   }

   const change = reschedule(issuedVersion);
   assert.equal((await api('POST', expectedOnPath, change, worker)).status, 403);
   assert.equal((await api('POST', expectedOnPath, { ...change, expectedOn: '2026-12-03' })).status, 400);
   const rescheduled = await api('POST', expectedOnPath, change);
   assert.equal(rescheduled.status, 200, rescheduled.body.message);
   assert.equal(rescheduled.body.data.workflowStatus, 'OPEN');
   assert.equal(rescheduled.body.data.version, issuedVersion + 1);
   const newExpectedOn = '2026-12-03T02:00:00.000Z';
   assert.equal((await api('GET', path)).body.data.header.expectedOn, newExpectedOn);
   const replayed = await api('POST', expectedOnPath, change);
   assert.equal(replayed.body.data.replayed, true);
   assert.equal(replayed.body.data.version, rescheduled.body.data.version);
   assert.equal((await api('POST', expectedOnPath, reschedule(issuedVersion))).status, 409);
   const audits = await m.AuditLog.find({ subjectId: id, action: 'RESCHEDULE_PO_EXPECTED_ON' }).lean();
   assert.equal(audits.length, 1);
   assert.equal(audits[0].reason, change.reason);
   assert.equal(audits[0].versionBefore, issuedVersion);
   assert.equal(audits[0].versionAfter, issuedVersion + 1);
   assert.deepEqual(audits[0].changes.map(({ field, before, after }) => ({ field, before, after })), [
     { field: 'header.expectedOn', before: expectedOn, after: newExpectedOn },
   ]);

   const inspection = await receiving.createInspection(worker, id, {
     creationKey: key(), expectedPoVersion: rescheduled.body.data.version, arrivedAt: new Date().toISOString(),
     lines: [{ poLineId, lotId: String(batch._id), enteredQty: '2', qualityCode: 'GOOD', ownershipDecision: 'ACCEPT', packagingCondition: 'OPENED' }],
   });
   const inspectionDoc = await m.GoodsInspection.findById(inspection.id);
   const confirmed = await receiving.confirmInspection(worker, inspection.id, {
     ...input(), expectedVersion: inspection.version, expectedPoVersion: rescheduled.body.data.version,
     destinations: [{ inspectionItemId: String(inspectionDoc.items[0]._id), locationId: String(receivingLocation._id) }],
   });
   const receiptId = confirmed.resultRefs.find(ref => ref.documentType === 'goods_receipts').documentId;
   const beforePosting = await m.PurchaseOrder.findById(id);
   const draftReceipt = await m.PurchaseReceipt.findById(receiptId);
   await receiving.postReceipt(worker, receiptId, {
     ...input(), expectedVersion: draftReceipt.version, expectedPoVersion: beforePosting.version,
     packaging: [{ lineId: String(draftReceipt.items[0]._id), portions: [{ packagingState: 'OPEN', quantityBase: '2', measuredVolumeMm3: '7688000' }] }],
   });
   const partial = await m.PurchaseOrder.findById(id);
   const rescheduledPartial = await api('POST', expectedOnPath, {
     ...reschedule(partial.version), expectedOn: '2026-12-04T02:00:00.000Z',
   });
   assert.equal(rescheduledPartial.status, 200, rescheduledPartial.body.message);
   assert.equal(rescheduledPartial.body.data.workflowStatus, 'PARTIAL');

   const receivedSummary = await api('GET', path + '/receiving-summary', undefined, worker);
   assert.equal(receivedSummary.status, 200);
   const { documents, quantities } = receivedSummary.body.data;
   assert.equal(quantities[0].receivedQtyBase, '2');
   assert.equal(quantities[0].outstandingQtyBase, '2');
   assert.ok(!Object.hasOwn(quantities[0].snapshot, 'unitPurchasePrice'));
   assert.deepEqual(documents.map(({ kind, id, workflowStatus, lines }) => ({ kind, id, workflowStatus, lines })), [
     { kind: 'GR_PURCHASE', id: receiptId, workflowStatus: 'POSTED', lines: [{ poLineId, qtyBase: '2' }] },
     { kind: 'INSPECTION', id: inspection.id, workflowStatus: 'CONFIRMED', lines: [{ poLineId, qtyBase: '2' }] },
   ]);
   assert.ok(documents.every(row => row.documentNo && row.createdAt));

   const evidence = await m.Attachment.create({
     ownerDocumentType: 'purchase_orders', ownerDocumentId: id, purpose: 'TEST', originalName: 'test.png',
     mediaType: 'image/png', sizeBytes: 10, storageKey: 'local-test', checksum: 'a'.repeat(64),
     uploadedBy: accountant._id, uploadedAt: new Date(), accessCategory: 'BUSINESS', status: 'ATTACHED',
   });
   const closeBody = { reason: 'Stop receiving remaining items', evidenceIds: [String(evidence._id)] };
   const close = await api('POST', path + '/close-requests', {
     ...closeBody, ...input(), expectedVersion: rescheduledPartial.body.data.version, lines: [{ poLineId, qtyBase: '2' }],
   });
   assert.equal(close.status, 200, close.body.message);
   const audit = await m.AuditLog.findOne({ subjectId: id, action: 'REQUEST_PO_CLOSE' });
   const approved = await api('POST', path + '/close-approvals', {
     ...closeBody, ...input(), expectedVersion: close.body.data.version, requestId: String(audit._id),
   }, owner);
   assert.equal(approved.status, 200, approved.body.message);
   const closed = await api('POST', path + '/close-executions', {
     reason: closeBody.reason, ...input(), expectedVersion: approved.body.data.version, approvalId: approved.body.data.decisionId,
   });
   assert.equal(closed.status, 200, closed.body.message);
   assert.equal(closed.body.data.workflowStatus, 'CLOSED');
   assert.equal((await api('POST', expectedOnPath, reschedule(closed.body.data.version))).status, 400);
   assert.deepEqual((await api('GET', path + '/receiving-summary')).body.data.documents, documents);

   // Versioned writes replace the items array without retired fields.
   const stored = await m.PurchaseOrder.collection.findOne({ _id: id });
   assert.ok(!Object.hasOwn(stored.header, 'supplierConfirmation'));
   for (const field of retiredFields) {
     assert.ok(!Object.hasOwn(stored.items[0], field), field + ' should be removed after a versioned write');
   }
 } finally {
   await new Promise(resolve => server.close(resolve));
 }
});

run('HTTP catalogue contracts enforce permissions, immutable codes and concurrency tokens',async()=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const root='http://127.0.0.1:'+server.address().port+'/api';
 const api=async(method,path,user,body)=>{const response=await fetch(root+path,{method,headers:{'content-type':'application/json',...(user&&{authorization:'Bearer '+jwt.sign({userId:String(user._id)},process.env.JWT_SECRET||'wmsd_default_super_secret_jwt_key_2026')})},...(body&&{body:JSON.stringify(body)})});return {status:response.status,body:await response.json()};};
 try{
 assert.equal((await api('GET','/uoms')).status,401);assert.equal((await api('POST','/uoms',worker,{code:'TEST',name:'Test'})).status,403);
 const created=await api('POST','/uoms',owner,{code:'CUSTOM',name:'Custom'});assert.equal(created.status,200);const unit=created.body.data;
 assert.equal((await api('POST','/uoms',owner,{code:'CUSTOM',name:'Duplicate'})).status,409);
 const areaUnit=await api('POST','/uoms',owner,{code:'AREA2',name:'Area 2',areaMm2:'1000000'});assert.equal(areaUnit.status,200);assert.equal(areaUnit.body.data.areaMm2,'1000000');
 assert.equal((await api('POST','/uoms',owner,{code:'AREA3',name:'Area 3',areaMm2:'0'})).status,400);
 assert.equal((await api('PUT','/uoms/'+areaUnit.body.data.id,owner,{expectedUpdatedAt:areaUnit.body.data.updatedAt,name:'Area',areaMm2:'5'})).status,400);
 await m.Uom.updateOne({_id:areaUnit.body.data.id},{$set:{isActive:false}}); // keep later conversion lists unchanged
 assert.equal((await api('PUT','/uoms/'+unit.id,owner,{expectedUpdatedAt:unit.updatedAt,name:'Changed',code:'NEW'})).status,400);
 assert.equal((await api('PATCH','/uoms/'+unit.id+'/status',owner,{expectedUpdatedAt:unit.updatedAt,isActive:false,reason:'Stop'})).status,200);
 assert.equal((await api('PUT','/uoms/'+unit.id,owner,{expectedUpdatedAt:unit.updatedAt,name:'Stale'})).status,409);
 assert.equal((await api('GET','/suppliers/names',worker)).status,403);assert.equal((await api('GET','/suppliers/names',accountant)).status,200);
 const category=await m.Category.findOne();const body={sku:key(),name:'New',manufacturerCode:'TEST',categoryId:String(category._id),baseUnit:'PIECE',wholeBaseUnits:true,lengthMm:'600.125',widthMm:'600',heightMm:'10',color:'White',surface:'Matte',origin:'VN',description:'Description'};
 const box = await m.Uom.findOne({code:'BOX'});
 const initialConversion = {uomId:String(box._id),basePerUnit:'6',validFrom:'2020-01-01'};
 const productResult=await api('POST','/products',owner,{...body,conversions:[{...initialConversion,verificationReference:null}]});assert.equal(productResult.status,201);assert.equal(productResult.body.data.nominalSize,'600.125x600');
 const productId=productResult.body.data.id;
 assert.equal(await m.ProductBatch.countDocuments({productId}),0);
 assert.equal(productResult.body.data.conversions[0].basePerUnit,'6');
 assert.equal(productResult.body.data.conversions[0].verificationReference,'Khai báo khi tạo sản phẩm');
 const conversionPath='/products/'+productId+'/conversions';
 const detailPath='/products/'+productId;
 assert.equal((await api('GET',detailPath+'?batchId=null',owner)).status,400);
 assert.equal((await api('GET',detailPath+'?batchId='+String(batch._id),owner)).status,400);
 await m.ProductBatch.create({
   productId: new mongoose.Types.ObjectId(productId), manufacturerLot: key(), identificationStatus: 'UNKNOWN',
   piecesPerCarton: 1, cartonLengthMm: '600', cartonWidthMm: '600', cartonHeightMm: '10',
 });
 const workerDetail = await api('GET',detailPath,worker);
 assert.equal(workerDetail.status,200);
 assert.equal(workerDetail.body.data.currentConversions.find(row=>row.uom.code==='BOX').basePerUnit,'6');
 const verifiedBatch = await m.ProductBatch.create({
   productId, manufacturerLot: key(), identificationStatus: 'VERIFIED',
   piecesPerCarton: 8, cartonLengthMm: '600', cartonWidthMm: '600', cartonHeightMm: '10',
 });
 const fallbackDetail = await api('GET', detailPath, worker);
 assert.deepEqual(fallbackDetail.body.data.currentConversions, workerDetail.body.data.currentConversions);
 assert.equal(fallbackDetail.body.data.currentConversions[0].productBatchId, null);
 const noConversionProduct = await api('POST','/products',owner,{
   ...body, sku:key(), name:'No conversion product',
 });
 assert.equal(noConversionProduct.status,201);
 // Only the auto-generated M2 factor (1e6 / (600.125 x 600)); nothing user-declared.
 assert.deepEqual((await api('GET','/products/'+noConversionProduct.body.data.id,owner)).body.data.currentConversions.map(row=>[row.uom.code,row.basePerUnit,row.verificationReference]),[['M2','2.777199194612','Tự tính từ kích thước sản phẩm']]);
 const orphanedConversion = await m.Conversion.create({
   productId, productBatchId: verifiedBatch._id, uomId: new mongoose.Types.ObjectId(), basePerUnit: '4',
   version: 1, validFrom: new Date('2020-02-01'), verificationReference: 'Legacy unit',
 });
 const historyWithMissingUnit = await api('GET', conversionPath, worker);
 assert.equal(historyWithMissingUnit.status, 200, historyWithMissingUnit.body.message);
 assert.equal(historyWithMissingUnit.body.data.total, 3) // BOX, auto M2 and the orphan;
 const orphanedItem = historyWithMissingUnit.body.data.items.find(row => row.id === String(orphanedConversion._id));
 assert.equal(orphanedItem.uom, null);
 assert.equal(orphanedItem.basePerUnit, '4');
 assert.deepEqual((await api('GET', detailPath, worker)).body.data.currentConversions, fallbackDetail.body.data.currentConversions);
 assert.equal((await api('POST',conversionPath,worker,initialConversion)).status,403);
 assert.equal((await api('POST',conversionPath,owner,initialConversion)).status,409);
 const futureConversion = {...initialConversion,basePerUnit:'8',validFrom:'2099-01-01'};
 assert.equal((await api('POST',conversionPath,owner,{...futureConversion,verificationReference:'a'.repeat(501)})).status,400);
 const references = [undefined, '', '   ', null, '  Công văn số 99/TB-NM  '];
 for (const [index, reference] of references.entries()) {
   const created = await api('POST', conversionPath, owner, {
     ...futureConversion, validFrom: `2099-01-0${index + 1}`, verificationReference: reference,
   });
   assert.equal(created.status, 201);
   const expected = reference?.trim() || 'Cập nhật quy cách thủ công';
   assert.equal(created.body.data.verificationReference, expected);
   assert.equal((await m.Conversion.findById(created.body.data.id)).verificationReference, expected);
 }
 const lotConversion = await api('POST', conversionPath, owner, {
   ...initialConversion, productBatchId: String(verifiedBatch._id), basePerUnit:'8',
 });
 assert.equal(lotConversion.status, 201);
 assert.equal(lotConversion.body.data.verificationReference, 'Quy cách gắn theo lô');
 const history=await api('GET',conversionPath+'?limit=1&productBatchId=null',owner);
 assert.equal(history.status,200);assert.equal(history.body.data.total,7);assert.equal(history.body.data.items[0].isCurrent,false);
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
run('BF03 additive seed supplies selectable stock and rerun never restores consumed quantity',async()=>{
 const {seedBF03}=await import('../scripts/seed-bf03.mjs');
 const relocations=await import('../src/modules/location-movements/location-movement.service.js');
 const preview=await seedBF03(mongoose.connection,{warehouseCode:warehouse.code});
 assert.equal(preview.status,'PREVIEW');
 assert.equal(await m.Product.countDocuments({sku:'BF03-DEMO-6060'}),0);
 const seeded=await seedBF03(mongoose.connection,{warehouseCode:warehouse.code,apply:true});
 assert.equal(seeded.status,'SEEDED');
 const options=await relocations.locationMovementOptions(worker,String(warehouse._id));
 const demoProduct=options.products.find(p=>p.sku==='BF03-DEMO-6060');
 assert.equal(demoProduct.baseUnit,'Viên');
 const demoBatch=options.batches.find(b=>b.productId===demoProduct.id);
 const sourcePoint=options.holdingPoints.find(p=>options.locations.find(l=>l.id===p.locationId)?.code==='BF03-A');
 const source=options.balances.find(b=>b.holdingPointId===sourcePoint.id&&b.batchId===demoBatch.id);
 assert.equal(source.quantityBase,'40');
 const destination=options.locations.find(l=>l.code==='BF03-B');
 const created=await relocations.createLocationMovement(worker,{idempotencyKey:key(),warehouseId:String(warehouse._id),reason:'Seed smoke',lines:[{sourceBalanceId:source.id,sourceBalanceVersion:source.version,toLocationId:destination.id,enteredUnit:'Thùng',enteredQty:'1'}]});
 const document=await m.TransferOrder.findById(created.id);
 await relocations.confirmLocationMovement(worker,created.id,{idempotencyKey:key(),expectedVersion:document.version,lines:[{lineId:String(document.items[0]._id),actualQtyBase:'4'}]});
 const rerun=await seedBF03(mongoose.connection,{warehouseCode:warehouse.code,apply:true});
 assert.equal(rerun.status,'ALREADY_SEEDED');assert.equal(rerun.currentSourceQty,'36');
 assert.equal(await m.OpeningStock.countDocuments({documentNo:'BF03-OPENING-'+warehouse.code}),1);
});
