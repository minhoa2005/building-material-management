import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';
import * as stock from '../src/modules/warehouse-stock/service.js';
import { saveLayout } from '../src/modules/warehouse-stock/layout.js';
import * as transfers from '../src/modules/transfers/transfer.service.js';
const enabled=process.env.RUN_HIEUDT_ITER1==='1';
const run=(name,fn)=>test(name,{skip:!enabled},fn);
const key=()=>new mongoose.Types.ObjectId().toString();
let owner,a,b,sales,wa,wb,source,stage,receiving,storage,quarantine,product,batch,balance;
const page={page:1,limit:20};
test.before(async()=>{
 if(!enabled)return;
 await mongoose.connect('mongodb://127.0.0.1:27326/wmsd_hieudt_scope_test_'+key()+'?replicaSet=wireframe',{serverSelectionTimeoutMS:5000});
 const models=[...m.models.values()];for(let start=0;start<models.length;start+=6)await Promise.all(models.slice(start,start+6).map(async Model=>{await Model.createCollection();await Model.createIndexes();}));
 const permissions=await m.Permission.insertMany(PERMISSION_CATALOGUE.map(p=>({code:p.code,name:p.code,description:p.description})));
 const roles={};for(const code of ['OWNER','WAREHOUSE','SALES'])roles[code]=await m.Role.create({code,name:code,permissionIds:permissions.filter(p=>ROLE_PERMISSIONS[code].includes(p.code)).map(p=>p._id)});
 [wa,wb]=await m.Warehouse.create([{code:'A',name:'Kho A',lengthMm:'10000',widthMm:'10000',clearHeightMm:'3000'},{code:'B',name:'Kho B',lengthMm:'10000',widthMm:'10000',clearHeightMm:'3000'}]);
 const user=async(name,role,warehouse)=>{const u=await m.User.create({username:name,fullName:name,passwordHash:'test-only',roleId:roles[role]._id,warehouseIds:[warehouse._id]});return m.User.findById(u._id).populate({path:'roleId',populate:{path:'permissionIds'}});};
 owner=await user('owner','OWNER',wa);a=await user('source','WAREHOUSE',wa);b=await user('destination','WAREHOUSE',wb);sales=await user('sales','SALES',wa);
 const loc=async(warehouse,code,type)=>m.WarehouseLocation.create({warehouseId:warehouse._id,code,name:code,locationType:type,isPickable:type==='STORAGE',usableLengthMm:'5000',usableWidthMm:'5000'});
 source=await loc(wa,'SRC','STORAGE');stage=await loc(wa,'STAGE','STAGING');receiving=await loc(wb,'IN','RECEIVING');storage=await loc(wb,'STORE','STORAGE');quarantine=await loc(wb,'Q','QUARANTINE');
 await m.Uom.create({code:'PIECE',name:'Viên'});const category=await m.Category.create({code:'TEST',name:'Test'});
 product=await m.Product.create({sku:'TILE',name:'Gạch thử',manufacturerCode:'TEST',categoryId:category._id,color:'White',baseUnit:'PIECE',wholeBaseUnits:true,lengthMm:'600',widthMm:'600',heightMm:'10'});
 batch=await m.ProductBatch.create({productId:product._id,manufacturerLot:'LOT',identificationStatus:'VERIFIED',piecesPerCarton:4,cartonLengthMm:'620',cartonWidthMm:'620',cartonHeightMm:'50'});
 const point=await m.StockHoldingPoint.create({type:'LOCATION',locationId:source._id});balance=await m.InventoryBalance.create({holdingPointId:point._id,batchId:batch._id,qualityStatus:'GOOD',ownerType:'STORE',quantityBase:'40',version:0,packagingPortions:[{packagingState:'SEALED',sealedPackCount:10,quantityBase:'40',createdBy:a._id,packagingSnapshot:{packageUnit:'BOX',baseUnitsPerPackage:'4',outerLengthMm:'620',outerWidthMm:'620',outerHeightMm:'50'}}]});
});
test.after(async()=>{if(enabled){assert.match(mongoose.connection.name,/^wmsd_hieudt_scope_test_/);await mongoose.connection.dropDatabase();await mongoose.disconnect();}});
import * as moves from '../src/modules/location-movements/location-movement.service.js';
let moveId, transferId;
const bin=()=>({idempotencyKey:key(),warehouseId:wa.id,code:'NEW',name:'New bin',areaCode:'A',locationType:'STORAGE',isActive:true,isPickable:true,usableLengthMm:'2000',usableWidthMm:'2000'});
run('UC-55 List assigned warehouses and compare with Owner scope',async()=>{
  const staff=await stock.warehouseList(a);
   assert.deepEqual(staff.items.map(r=>r.code),['A']);
   assert.equal(staff.items[0].locationCount,2);
   assert.equal((await stock.warehouseList(owner)).total,2);
  
});
run('UC-57 Read capacity, active status and lot-level stock at SRC',async()=>{
  const row=await stock.locationDetail(a,source.id);
   assert.ok(row.capacity);
   assert.equal(row.isActive,true);
   assert.equal(row.stock[0].batch,'LOT');
   assert.equal(row.stock[0].quantityBase,'40');
  
});
run('UC-61 Create an empty storage bin and replay the same request',async()=>{
  const body={...bin(),idempotencyKey:key()};
   const result=await stock.saveLocation(owner,null,body);
   const newBin=result.id;
   assert.equal((await stock.saveLocation(owner,null,body)).id,newBin);
   assert.equal(await m.WarehouseLocation.countDocuments({code:'NEW'}),1);
  
});
run('UC-64 Filter inventory by lot, quality and owner within warehouse scope',async()=>{
  const q={...page,batchId:batch.id,quality:'GOOD',ownerType:'STORE'};
  assert.equal((await stock.inventory(a,q)).total,1);
  assert.equal((await stock.inventory(b,q)).total,0);
  assert.equal((await stock.inventory(a,{...q,quality:'DAMAGED'})).total,0);
  
});
run('UC-65 Read physical, usable and available quantities and check access',async()=>{
  const row=await stock.inventoryDetail(a,balance.id);
  for(const k of ['physicalQtyBase','availableQtyBase','usableQtyBase'])assert.equal(row[k],'40');
  await assert.rejects(stock.inventoryDetail(b,balance.id));
  
});
run('UC-70 Create a same-warehouse relocation of four pieces',async()=>{
  const result=await moves.createLocationMovement(a,{idempotencyKey:key(),warehouseId:wa.id,reason:'Round 1 relocation',lines:[{sourceBalanceId:balance.id,sourceBalanceVersion:0,toLocationId:stage.id,enteredUnit:'PIECE',enteredQty:'4'}]});
  moveId=result.id;
  const row=await m.TransferOrder.findById(moveId);
  assert.equal(row.workflowStatus,'OPEN');
  assert.equal(String(row.items[0].qtyBase),'4');
  assert.equal(await m.StockTransaction.countDocuments(),0);
  
});
run('UC-68 Search open relocations by lot and check warehouse scope',async()=>{
  const q={...page,q:'LOT',status:'OPEN'};
  assert.equal((await moves.listLocationMovements(a,q)).items[0].id,moveId);
  assert.equal((await moves.listLocationMovements(b,q)).items.length,0);
  
});
run('UC-69 Read source, destination and posting history of open relocation',async()=>{
  const row=await moves.getLocationMovement(a,moveId);
  assert.equal(String(row.items[0].details.fromLocationId),source.id);
  assert.equal(String(row.items[0].details.toLocationId),stage.id);
  assert.equal(row.transactions.length,0);
  
});
run('UC-81 Request eight pieces from A to B and check persisted allocation',async()=>{
  const result=await transfers.createRequest(a,{idempotencyKey:key(),sourceWarehouseId:wa.id,destinationWarehouseId:wb.id,reason:'Round 1 transfer',lines:[{productId:product.id,lotId:batch.id,enteredUnit:'PIECE',enteredQty:'8',sourceLocations:[{sourceBalanceId:balance.id,qtyBase:'8'}]}]});
  transferId=result.id;
  const r=await m.WarehouseTransferRequest.findById(transferId);
  assert.equal(String(r.header.destinationWarehouseId),wb.id);
  assert.equal(String(r.items[0].qtyBase),'8');
  
});
run('UC-79 List transfer from sending and receiving warehouses',async()=>{
  for(const actor of [a,b])assert.equal((await transfers.listTransfers(actor,page)).items[0].id,transferId);
  assert.equal((await transfers.listTransfers(sales,page)).items.length,0);
  
});
run('UC-80 Read request line and allocated source bin',async()=>{
  const row=await transfers.getTransfer(a,transferId);
  assert.equal(row.items[0].sourceLocations[0].locationCode,'SRC');
  assert.equal(row.items[0].sourceLocations[0].qtyBase,'8');
  
});
const denied = operation => assert.rejects(operation, { statusCode: 403 });
const missing = operation => assert.rejects(operation, { statusCode: 404 });
const invalid = operation => assert.rejects(operation, { statusCode: 400 });
const noRead = () => ({ ...a.toObject(), roleId: { code: 'CUSTOM', isActive: true, permissionIds: [] } });
const relocation = enteredQty => ({
  idempotencyKey: key(), warehouseId: wa.id, reason: 'Round 1 relocation',
  lines: [{ sourceBalanceId: balance.id, sourceBalanceVersion: 0, toLocationId: stage.id, enteredUnit: 'PIECE', enteredQty }],
});
const transferRequest = () => ({
  idempotencyKey: key(), sourceWarehouseId: wa.id, destinationWarehouseId: wb.id, reason: 'Round 1 transfer',
  lines: [{ productId: product.id, lotId: batch.id, enteredUnit: 'PIECE', enteredQty: '8', sourceLocations: [{ sourceBalanceId: balance.id, qtyBase: '8' }] }],
});

run('UC-55 ALT List warehouses for staff with no assignments', async () => {
  const result = await stock.warehouseList({ ...a.toObject(), warehouseIds: [] });
  assert.deepEqual(result.items, []);
  assert.equal(result.total, 0);
});

run('UC-55 AUTH Read catalogue without warehouse read permission', async () => {
  await denied(stock.warehouseList(noRead()));
});

run('UC-57 ERR Read a nonexistent storage location', async () => {
  await missing(stock.locationDetail(a, key()));
});

run('UC-57 AUTH Read SRC using a worker assigned only to B', async () => {
  await denied(stock.locationDetail(b, source.id));
});

run('UC-61 ERR Create a location under a nonexistent warehouse', async () => {
  await invalid(stock.saveLocation(owner, null, { ...bin(), warehouseId: key(), code: 'NO-WH' }));
  assert.equal(await m.WarehouseLocation.countDocuments({ code: 'NO-WH' }), 0);
});

run('UC-61 AUTH Create a bin as Warehouse Staff', async () => {
  await denied(stock.saveLocation(a, null, { ...bin(), code: 'NO-GRANT' }));
  assert.equal(await m.WarehouseLocation.countDocuments({ code: 'NO-GRANT' }), 0);
});



run('UC-64 ALT Filter inventory for an absent product', async () => {
  const result = await stock.inventory(a, { ...page, productId: key() });
  assert.equal(result.total, 0);
  assert.deepEqual(result.items, []);
});

run('UC-64 AUTH Query inventory without inventory read permission', async () => {
  await denied(stock.inventory(noRead(), page));
});

run('UC-65 ERR Open a nonexistent balance', async () => {
  await missing(stock.inventoryDetail(a, key()));
});

run('UC-65 AUTH Read the same balance as Sales', async () => {
  const row = await stock.inventoryDetail(sales, balance.id);
  assert.equal(row.physicalQtyBase, undefined);
  assert.ok(row.availableQtyBase !== undefined);
});

run('UC-68 ALT Search relocations for a nonexistent lot', async () => {
  const result = await moves.listLocationMovements(a, { ...page, q: 'ABSENT-LOT' });
  assert.equal(result.total, 0);
  assert.deepEqual(result.items, []);
});

run('UC-68 AUTH Filter relocations explicitly for an unassigned warehouse', async () => {
  await denied(moves.listLocationMovements(b, { ...page, warehouseId: wa.id }));
});

run('UC-69 ERR Open a nonexistent relocation', async () => {
  await missing(moves.getLocationMovement(a, key()));
});

run('UC-69 AUTH Open an existing relocation from another warehouse', async () => {
  await denied(moves.getLocationMovement(b, moveId));
});

run('UC-70 ERR Request a relocation larger than physical stock', async () => {
  const before = await m.TransferOrder.countDocuments();
  await invalid(moves.createLocationMovement(a, relocation('400')));
  assert.equal(await m.TransferOrder.countDocuments(), before);
});

run('UC-70 AUTH Create a relocation in A as a worker assigned to B', async () => {
  const before = await m.TransferOrder.countDocuments();
  await denied(moves.createLocationMovement(b, relocation('4')));
  assert.equal(await m.TransferOrder.countDocuments(), before);
});

run('UC-70 LOCK Create a relocation from a stocktake-locked bin', async () => {
  const before = await m.TransferOrder.countDocuments();
  const lock = await m.StocktakeLocationLock.create({ stocktakeId: key(), locationId: source.id, scopeVersion: 1, lockedAt: new Date(), lockedBy: a._id, status: 'LOCKED' });
  try {
    await invalid(moves.createLocationMovement(a, relocation('4')));
    assert.equal(await m.TransferOrder.countDocuments(), before);
  } finally {
    await lock.deleteOne();
  }
});

run('UC-79 ALT Filter pending requests by completed status', async () => {
  const result = await transfers.listTransfers(a, { ...page, status: 'COMPLETED' });
  assert.equal(result.total, 0);
  assert.deepEqual(result.items, []);
});

run('UC-79 AUTH List transfer requests without transfer read permission', async () => {
  await denied(transfers.listTransfers(noRead(), page));
});

run('UC-80 ERR Open a nonexistent transfer request', async () => {
  await missing(transfers.getTransfer(a, key()));
});

run('UC-80 AUTH Open an existing request as Sales without linked demand', async () => {
  await missing(transfers.getTransfer(sales, transferId));
});

run('UC-81 ERR Request a transfer from A back to A', async () => {
  const before = await m.WarehouseTransferRequest.countDocuments();
  await invalid(transfers.createRequest(a, { ...transferRequest(), destinationWarehouseId: wa.id }));
  assert.equal(await m.WarehouseTransferRequest.countDocuments(), before);
});

run('UC-81 AUTH Create a warehouse transfer request as Sales', async () => {
  const before = await m.WarehouseTransferRequest.countDocuments();
  await denied(transfers.createRequest(sales, transferRequest()));
  assert.equal(await m.WarehouseTransferRequest.countDocuments(), before);
});

run('UC-81 ALLOC Allocate more than the requested quantity', async () => {
  const before = await m.WarehouseTransferRequest.countDocuments();
  const input = transferRequest();
  input.lines[0].sourceLocations[0].qtyBase = '12';
  await invalid(transfers.createRequest(a, input));
  assert.equal(await m.WarehouseTransferRequest.countDocuments(), before);
});

import jwt from 'jsonwebtoken';
let server;
async function readApi(path) {
  if (!server) {
    process.env.JWT_SECRET = 'isolated-round1-test-secret';
    const { default: app } = await import('../src/app.js');
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
  }
  const token = jwt.sign({ userId: a.id }, process.env.JWT_SECRET);
  return fetch('http://127.0.0.1:' + server.address().port + '/api' + path, {
    headers: { authorization: 'Bearer ' + token },
  });
}
test.after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
});

run('UC-55 HTTP Reject page zero at the catalogue endpoint', async () => {
  const response = await readApi('/warehouse-catalogue?page=0');
  assert.equal(response.status, 400);
});

run('UC-64 HTTP Reject an invalid inventory lot identifier', async () => {
  const response = await readApi('/inventory?batchId=bad-id');
  assert.equal(response.status, 400);
});

run('UC-68 HTTP Reject invalid pagination on the relocation list', async () => {
  const response = await readApi('/location-movements?page=0');
  assert.equal(response.status, 400);
});

run('UC-79 HTTP Reject invalid pagination on the transfer list', async () => {
  const response = await readApi('/warehouse-transfers?page=0');
  assert.equal(response.status, 400);
});
 
run('UC-56 BASE Read warehouse A with its assigned storage locations', async () => {
  const row = await stock.warehouseDetail(a, wa.id);
  assert.equal(row.code, 'A');
  assert.deepEqual(row.locations.map(location => location.code), ['NEW', 'SRC', 'STAGE']);
});
run('UC-56 ERR Read a nonexistent warehouse', async () => {
  await missing(stock.warehouseDetail(owner, key()));
});
run('UC-56 AUTH Read warehouse A as a worker assigned to B', async () => {
  await denied(stock.warehouseDetail(b, wa.id));
});

let roundOneWarehouseId;
const readWarehouse = () => m.Warehouse.findById(roundOneWarehouseId);
const warehouseBody = () => ({
  code: 'R1NEW', name: 'Round 1 warehouse', lengthMm: '10000',
  widthMm: '10000', clearHeightMm: '3000', isActive: true, idempotencyKey: key(),
});
run('UC-58 BASE Owner creates a warehouse and replays the request', async () => {
  const body = warehouseBody();
  const result = await stock.saveWarehouse(owner, null, body);
  roundOneWarehouseId = result.id;
  assert.equal((await stock.saveWarehouse(owner, null, body)).id, result.id);
  assert.equal((await m.Warehouse.findById(result.id)).name, body.name);
  assert.equal(await m.Warehouse.countDocuments({code:body.code}), 1);
});
run('UC-58 ERR Duplicate warehouse code is rejected', async () => {
  await assert.rejects(stock.saveWarehouse(owner, null, warehouseBody()), e => e.statusCode === 409 || e.code === 11000);
  assert.equal(await m.Warehouse.countDocuments({code:'R1NEW'}), 1);
});
run('UC-58 AUTH Warehouse Staff cannot create a warehouse', async () => {
  await assert.rejects(stock.saveWarehouse(a, null, {...warehouseBody(),code:'DENIED'}), {statusCode:403});
  assert.equal(await m.Warehouse.countDocuments({code:'DENIED'}),0);
});
const edit = async name => ({...warehouseBody(),code:'R1NEW',name,expectedUpdatedAt:(await readWarehouse()).updatedAt.toISOString()});
run('UC-59 BASE Owner updates warehouse information', async () => {
  await stock.saveWarehouse(owner, roundOneWarehouseId, await edit('Updated warehouse'));
  assert.equal((await readWarehouse()).name,'Updated warehouse');
});
run('UC-59 ERR Stale warehouse update is rejected', async () => {
  const body = {...await edit('Stale'),expectedUpdatedAt:'2000-01-01T00:00:00Z'};
  await assert.rejects(stock.saveWarehouse(owner, roundOneWarehouseId, body), {statusCode:400});
  assert.equal((await readWarehouse()).name,'Updated warehouse');
});
run('UC-59 AUTH Warehouse Staff cannot update warehouse information', async () => {
  await assert.rejects(stock.saveWarehouse(a, roundOneWarehouseId, await edit('Denied')), {statusCode:403});
  assert.equal((await readWarehouse()).name,'Updated warehouse');
});
const layout = {points:[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}],height:3,doors:[],functions:[{id:'staging',name:'Staging'}]};
const layoutBody = async () => ({layout,apply:true,expectedUpdatedAt:(await readWarehouse()).updatedAt.toISOString()});
run('UC-60 BASE Owner applies a layout and reads it back', async () => {
  await saveLayout(owner, roundOneWarehouseId, await layoutBody());
  assert.deepEqual((await stock.warehouseDetail(owner,roundOneWarehouseId)).layout3dApplied.functions,layout.functions);
});
run('UC-60 ERR Stale layout cannot overwrite applied design', async () => {
  await assert.rejects(saveLayout(owner,roundOneWarehouseId,{...await layoutBody(),expectedUpdatedAt:'2000-01-01T00:00:00Z'}),{statusCode:400});
  assert.deepEqual((await stock.warehouseDetail(owner,roundOneWarehouseId)).layout3dApplied.functions,layout.functions);
});
run('UC-60 AUTH Warehouse Staff cannot apply a layout', async () => {
  await assert.rejects(saveLayout(a,roundOneWarehouseId,await layoutBody()),{statusCode:403});
  assert.deepEqual((await stock.warehouseDetail(owner,roundOneWarehouseId)).layout3dApplied.functions,layout.functions);
});

