import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import { inventory, inventoryDetail } from '../src/modules/warehouse-stock/service.js';
import { warehouseDetail, warehouseList, locationDetail } from '../src/modules/warehouse-stock/service.js';
import { warehouseCreateBody, warehouseEditBody, createBody as createLocation } from '../src/modules/warehouse-stock/validation.js';
import { layoutSchema } from '../src/modules/warehouse-stock/layout.js';
import { createBody as createMove } from '../src/modules/location-movements/location-movement.validation.js';
import { createRequestBody } from '../src/modules/transfers/transfer.validation.js';

afterEach(() => mock.restoreAll());
const id = n => n.toString(16).padStart(24, '0');
const user = (code = 'WAREHOUSE', permissions = ['inventory:read']) => ({
  isActive: true, warehouseIds: [id(1)], roleId: { code, isActive: true, permissionIds: permissions.map(code => ({ code })) },
});
const warehouse = { _id: id(1), name: 'Warehouse', isActive: true };
const location = { _id: id(2), warehouseId: id(1), code: 'A1', isActive: true, isPickable: true };
const point = { _id: id(3), type: 'LOCATION', locationId: id(2) };
const balance = { _id: id(4), holdingPointId: id(3), quantityBase: '100.125', ownerType: 'STORE', qualityStatus: 'GOOD', version: 2,
  batch: { _id: id(5), manufacturerLot: 'LOT', identificationStatus: 'VERIFIED' },
  product: { _id: id(6), name: 'Tile', sku: 'SKU', baseUnit: 'PIECE', isActive: true } };

function setup(rows = [balance]) {
  const session = { withTransaction: async work => work(), endSession: async () => {} };
  mock.method(mongoose, 'startSession', async () => session);
  const chain = (model, value) => ({
    select(fields) { assert.ok(fields && !fields.startsWith('-'), model + ' must select consumed fields'); return this; },
    session(value) { assert.equal(value, session); return this; }, lean: async () => value,
  });
  for (const [Model, value] of [
    [m.Warehouse, [warehouse]], [m.WarehouseLocation, [location]], [m.TransferDispatch, []], [m.StockHoldingPoint, [point]],
    [m.StocktakeLocationLock, []], [m.StockReservation, []], [m.TransferOrder, []], [m.DefectReport, []], [m.StockTransaction, []],
  ]) mock.method(Model, 'find', () => chain(Model.modelName, value));
  mock.method(m.InventoryBalance, 'aggregate', pipeline => {
    assert.equal(pipeline[1].$project.packagingPortions, undefined);
    assert.equal(pipeline[1].$project.quantityBase, 1);
    for (const stage of pipeline.filter(stage => stage.$lookup)) assert.ok(stage.$lookup.pipeline[0].$project);
    const detail = !!pipeline[0].$match._id;
    return { session(value) { assert.equal(value, session); return Promise.resolve(detail ? rows.map(row => ({ ...row, warehouse, location, point })) : [{ items: rows, total: [{ value: rows.length }] }]); } };
  });
}


const reader = () => user('WAREHOUSE', ['warehouse_location:read']);
const rejectedWith = code => error => error.statusCode === code;

test('UC-55 Normal | Scoped warehouse with 3 locations and 2 active | List returns 3 total locations and 2 active', async () => {
  mock.method(m.Warehouse, 'find', filter => {
    assert.deepEqual(filter, { _id: { $in: [id(1)] } });
    return { select: () => ({ sort: () => ({ lean: async () => [warehouse] }) }) };
  });
  mock.method(m.WarehouseLocation, 'aggregate', async () => [{ _id: id(1), count: 3, activeCount: 2 }]);
  const result = await warehouseList(reader());
  assert.equal(result.total, 1);
  assert.equal(result.items[0].locationCount, 3);
  assert.equal(result.items[0].activeLocationCount, 2);
});

test('UC-56 Normal | Warehouse with assigned location A1 | Detail includes only locations queried for that warehouse', async () => {
  mock.method(m.Warehouse, 'findById', () => ({ session: async () => warehouse }));
  mock.method(m.WarehouseLocation, 'find', filter => {
    assert.deepEqual(filter, { warehouseId: warehouse._id });
    return { select: () => ({ sort: () => ({ lean: async () => [location] }) }) };
  });
  const result = await warehouseDetail(reader(), warehouse._id);
  assert.deepEqual(result.locations.map(row => row.code), ['A1']);
});

test('UC-57 Abnormal | Unknown storage location ID | Detail rejects lookup with 404', async () => {
  setup();
  mock.method(m.WarehouseLocation, 'findById', () => ({ session: async () => null }));
  await assert.rejects(locationDetail(reader(), id(99)), rejectedWith(404));
});

const warehouseInput = { code: 'W1', name: 'North', lengthMm: 4000, widthMm: 5000, clearHeightMm: 3200, isActive: true, idempotencyKey: 'r1' };
test('UC-58 Normal | Create warehouse with 4000 mm length | Valid input normalizes length to 4000 as a string', () => {
  assert.equal(warehouseCreateBody.parse(warehouseInput).lengthMm, '4000');
});
test('UC-58 Boundary | Warehouse length 0 mm | Validation rejects zero length', () => {
  assert.equal(warehouseCreateBody.safeParse({ ...warehouseInput, lengthMm: 0 }).success, false);
});
test('UC-59 Abnormal | Update warehouse without version timestamp | Validation rejects missing timestamp and accepts a valid timestamp', () => {
  assert.equal(warehouseEditBody.safeParse(warehouseInput).success, false);
  assert.equal(warehouseEditBody.safeParse({ ...warehouseInput, expectedUpdatedAt: '2026-11-28T00:00:00Z' }).success, true);
});
test('UC-60 Boundary | Valid rectangular floor then collinear floor points | Layout accepts rectangle and rejects zero-area floor', () => {
  const layout = { points: [{x:0,y:0},{x:8,y:0},{x:8,y:5},{x:0,y:5}], height: 4, doors: [] };
  assert.equal(layoutSchema.safeParse(layout).success, true);
  assert.equal(layoutSchema.safeParse({ ...layout, points: [{x:0,y:0},{x:1,y:1},{x:2,y:2}] }).success, false);
});
test('UC-61 Abnormal | Pickable STORAGE then QUARANTINE location | Validation accepts STORAGE and rejects pickable QUARANTINE', () => {
  const input = { warehouseId: id(1), code: 'B2', name: 'Bin 2', locationType: 'STORAGE', usableLengthMm: 1200,
    usableWidthMm: 900, isPickable: true, isActive: true, idempotencyKey: 'bin' };
  assert.equal(createLocation.safeParse(input).success, true);
  assert.equal(createLocation.safeParse({ ...input, locationType: 'QUARANTINE' }).success, false);
});
test('UC-64 Normal | Summary query with one balance of 13.75 pieces | One balance returned with available quantity 13.75', async () => {
  setup([{ ...balance, quantityBase: '13.75' }]);
  const result = await inventory(user(), { page: 1, limit: 10, view: 'summary' });
  assert.equal(result.total, 1);
  assert.equal(result.items[0].availableQtyBase, '13.75');
});
test('UC-65 Normal | Detail query for balance version 4 containing 7.5 pieces | Detail returns correct location, version and usable quantity', async () => {
  setup([{ ...balance, version: 4, quantityBase: '7.5' }]);
  const result = await inventoryDetail(user(), balance._id);
  assert.equal(result.locationId, location._id);
  assert.equal(result.version, 4);
  assert.equal(result.usableQtyBase, '7.5');
});
test('UC-70 Boundary | Create move for one piece then zero pieces | Validation accepts one and rejects zero', () => {
  const line = { sourceBalanceId: id(4), sourceBalanceVersion: 1, toLocationId: id(7), enteredUnit: 'PIECE', enteredQty: '1' };
  const input = { idempotencyKey: 'move', warehouseId: id(1), reason: 'Restock', lines: [line] };
  assert.equal(createMove.safeParse(input).success, true);
  assert.equal(createMove.safeParse({ ...input, lines: [{ ...line, enteredQty: '0' }] }).success, false);
});
test('UC-81 Abnormal | Create request from W1 to W2 then W1 to W1 | Validation accepts distinct warehouses and rejects identical warehouses', () => {
  const input = { idempotencyKey: 'transfer', sourceWarehouseId: id(1), destinationWarehouseId: id(2),
    reason: 'Restock', lines: [{ productId: id(6), enteredUnit: 'PIECE', enteredQty: '3' }] };
  assert.equal(createRequestBody.safeParse(input).success, true);
  assert.equal(createRequestBody.safeParse({ ...input, destinationWarehouseId: id(1) }).success, false);
});

import { saveWarehouse, saveLocation } from '../src/modules/warehouse-stock/service.js';
import { applicationIssues } from '../src/modules/warehouse-stock/layout-geometry.js';
import { createLocationMovement, getLocationMovement, listLocationMovements } from '../src/modules/location-movements/location-movement.service.js';
import { createRequest, getTransfer, listTransfers } from '../src/modules/transfers/transfer.service.js';

// Stand in for database I/O only. Production services still compute permissions,
// document numbers, quantities, statuses and receipts.
function query(value) {
  return {
    select() { return this; }, populate() { return this; }, session() { return this; },
    distinct() { return this; }, sort() { return this; }, lean: async () => value,
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}
function read(Model, method, value) {
  return mock.method(Model, method, () => query(value));
}
function commandActor(permission) {
  const actor = { ...user('WAREHOUSE', [permission]), _id: id(10) };
  const session = { inTransaction: () => true, withTransaction: fn => fn(), endSession: async () => {} };
  mock.method(mongoose, 'startSession', async () => session);
  read(m.User, 'findById', actor);
  read(m.OperationRecord, 'findOne', null);
  for (const Model of [m.OperationRecord, m.SystemEvent, m.AuditLog]) captureSaves(Model);
  return actor;
}
function captureSaves(Model) {
  const saved = [];
  mock.method(Model.prototype, 'save', async function () { saved.push(this); return this; });
  return saved;
}

for (const [uc, operation] of [[55, warehouseList], [64, inventory], [68, listLocationMovements], [79, listTransfers]]) {
  test(`UC-${uc} Abnormal | Actor lacks the read permission | Service rejects the list with 403`, async () => {
    await assert.rejects(operation(user('WAREHOUSE', []), {}), rejectedWith(403));
  });
}
test('UC-55 Boundary | Warehouse has no location-count record | Both counts default to zero', async () => {
  read(m.Warehouse, 'find', [warehouse]);
  read(m.WarehouseLocation, 'aggregate', []);
  const {items:[item]} = await warehouseList(reader());
  assert.deepEqual([item.locationCount, item.activeLocationCount], [0, 0]);
});
test('UC-56 Abnormal | Warehouse ID does not exist | Detail returns 404', async () => {
  read(m.Warehouse, 'findById', null);
  await assert.rejects(warehouseDetail(reader(), id(99)), rejectedWith(404));
});
test('UC-56 Boundary | Existing warehouse with zero locations | Detail includes an empty location list', async () => {
  read(m.Warehouse, 'findById', warehouse);
  read(m.WarehouseLocation, 'find', []);
  assert.deepEqual((await warehouseDetail(reader(), warehouse._id)).locations, []);
});
for (const [kind, qty, volume] of [['Normal','2','120'],['Boundary','0','0']]) {
  test(`UC-57 ${kind} | Location contains ${qty} pieces | Stock list and occupied volume reflect the physical quantity`, async () => {
    setup();
    read(m.WarehouseLocation,'findById',{...location,usableLengthMm:'10',usableWidthMm:'20'});
    read(m.Warehouse,'findById',{...warehouse,clearHeightMm:'30'});
    read(m.InventoryBalance,'find',[{...balance,quantityBase:qty,batchId:id(5),packagingPortions:[{quantityBase:qty,measuredVolumeMm3:volume}]}]);
    read(m.ProductBatch,'find',[balance.batch]); read(m.Product,'find',[balance.product]);
    read(m.TransferOrder,'countDocuments',0);
    const result=await locationDetail(reader(), location._id);
    assert.deepEqual(result.capacity,{capacityMm3:'6000',occupiedMm3:volume});
    assert.deepEqual(result.stock.map(row=>row.quantityBase),qty==='0'?[]:[qty]);
  });
}
test('UC-58 Normal | Authorized user creates an active warehouse | One warehouse is saved and receipt identifies its ID and ACTIVE state', async () => {
  const actor=commandActor('warehouse_location:create'), saved=captureSaves(m.Warehouse);
  const result=await saveWarehouse(actor,null,warehouseInput);
  assert.equal(saved.length,1); assert.equal(saved[0].code,'W1');
  assert.equal(result.id,String(saved[0]._id)); assert.equal(result.workflowStatus,'ACTIVE');
});
test('UC-58 Abnormal | Actor has only read permission | Create returns 403 before saving any warehouse', async () => {
  const actor=commandActor('warehouse_location:read'), saved=captureSaves(m.Warehouse);
  await assert.rejects(saveWarehouse(actor,null,warehouseInput),rejectedWith(403)); assert.equal(saved.length,0);
});
const stamp=new Date('2026-11-26T00:00:00Z');
for(const [kind,offset] of [['Normal',0],['Boundary',-1]]){
  test(`UC-59 ${kind} | Update timestamp differs by ${offset} ms | ${offset?'Stale write is rejected before persistence':'Update is conditional on the current timestamp and returns the same warehouse ID'}`,async()=>{
    const actor=commandActor('warehouse_location:update');
    const row=new m.Warehouse({_id:id(1),code:'W1',name:'North',isActive:true,updatedAt:stamp});
    read(m.Warehouse,'findById',row); read(m.WarehouseLocation,'find',[]);
    const write=mock.method(m.Warehouse,'findOneAndUpdate',async(filter,update)=>{
      assert.deepEqual(filter.updatedAt,stamp); assert.equal(update.$set.name,'Renamed');return row;
    });
    const pending=saveWarehouse(actor,id(1),{...warehouseInput,name:'Renamed',expectedUpdatedAt:new Date(+stamp+offset).toISOString()});
    if(offset){await assert.rejects(pending,/Kho đã thay đổi/);assert.equal(write.mock.callCount(),0);}
    else {assert.equal((await pending).id,id(1));assert.equal(write.mock.callCount(),1);}
  });
}
for(const [kind,x] of [['Normal',1],['Boundary',8],['Abnormal',9]]){
  test(`UC-60 ${kind} | Two-metre zone starts at x=${x} on a ten-metre floor | ${x>8?'Applying the layout reports an out-of-floor zone':'The full zone fits and layout can be applied'}`,()=>{
    const issues=applicationIssues({points:[{x:0,y:0},{x:10,y:0},{x:10,y:8},{x:0,y:8}],zones:[{x,y:1,width:2,length:2,name:'A',functionId:'storage'}]});
    if(x>8)assert.match(issues.join(' '),/nằm ngoài kho/);else assert.deepEqual(issues,[]);
  });
}
const binInput={warehouseId:id(1),code:'B2',name:'Bin 2',locationType:'STORAGE',isActive:true,isPickable:true,usableLengthMm:'1200',usableWidthMm:'900',idempotencyKey:'r1-bin'};
test('UC-61 Normal | Add first location to active warehouse without a layout | Location starts at version 1 and receipt returns its ID',async()=>{
  const actor=commandActor('warehouse_location:create'),saved=captureSaves(m.WarehouseLocation);
  read(m.Warehouse,'findOneAndUpdate',warehouse);read(m.Warehouse,'findOne',warehouse);read(m.Warehouse,'findById',warehouse);
  const result=await saveLocation(actor,null,binInput);
  assert.equal(saved.length,1);assert.equal(saved[0].version,1);assert.equal(result.id,String(saved[0]._id));
});
test('UC-61 Abnormal | Warehouse became inactive before the first location save | Warehouse guard refuses creation and no location is saved',async()=>{
  const actor=commandActor('warehouse_location:create'),saved=captureSaves(m.WarehouseLocation);
  read(m.Warehouse,'findOneAndUpdate',null);
  await assert.rejects(saveLocation(actor,null,binInput),/Kho đã ngừng hoạt động/);assert.equal(saved.length,0);
});
test('UC-61 Boundary | Location code at 50 and 51 characters | Accepts the maximum length and rejects the first excess character',()=>{
  assert.equal(createLocation.safeParse({...binInput,code:'B'.repeat(50)}).success,true);
  assert.equal(createLocation.safeParse({...binInput,code:'B'.repeat(51)}).success,false);
});
test('UC-64 Boundary | No balances match the filter | Total is zero and list is empty',async()=>{
  setup([]);const result=await inventory(user(),{page:1,limit:10,view:'summary'});
  assert.equal(result.total,0);assert.deepEqual(result.items,[]);
});
test('UC-65 Abnormal | Unknown balance ID | Detail returns 404',async()=>{
  setup([]);await assert.rejects(inventoryDetail(user(),id(90)),rejectedWith(404));
});
test('UC-65 Boundary | Balance contains zero pieces | Available and usable quantities are zero',async()=>{
  setup([{...balance,quantityBase:'0'}]);const row=await inventoryDetail(user(),balance._id);
  assert.equal(row.availableQtyBase,'0');assert.equal(row.usableQtyBase,'0');
});
for(const [uc,Model,operation,permission] of [[68,m.TransferOrder,listLocationMovements,'stock_relocation:read'],[79,m.WarehouseTransferRequest,listTransfers,'stock_transfer:read']]){
  test(`UC-${uc} Boundary | No matching documents | List and summary counts are zero`,async()=>{
    read(Model,'aggregate',[{summary:[],total:[],items:[],warehouses:[]}]);
    const result=await operation(user('WAREHOUSE',[permission]),{page:1,limit:20});
    assert.equal(result.total,0);assert.deepEqual(result.items,[]);
    assert.deepEqual(result.summary,{total:0,incomplete:0,completed:0,cancelled:0});
  });
}
test('UC-69 Abnormal | Transfer order belongs to another task type | Relocation detail returns 404',async()=>{
  read(m.TransferOrder,'findById',{header:{warehouseId:id(1),taskKind:'PUTAWAY'}});
  await assert.rejects(getLocationMovement(user('WAREHOUSE',['stock_relocation:read']),id(7)),rejectedWith(404));
});
test('UC-80 Abnormal | No transfer matches the scoped detail query | Detail returns 404',async()=>{
  read(m.WarehouseTransferRequest,'findOne',null);
  await assert.rejects(getTransfer(user('WAREHOUSE',['stock_transfer:read']),id(7)),rejectedWith(404));
});


function documentStorage(Model) {
  read(m.Warehouse,'findById',{...warehouse,code:'W1'});
  const emptyCursor=()=>({toArray:async()=>[]});
  mock.method(Model.collection,'find',emptyCursor);
  mock.method(Model.db.collection('operation_records'),'find',emptyCursor);
  return captureSaves(Model);
}
const product={...balance.product,wholeBaseUnits:true};
function productUnit() {
  read(m.Product,'findOne',product);
  read(m.Uom,'findOne',{code:'PIECE',isActive:true,decimalPlaces:0});
}
for(const [kind,pending] of [['Normal',0],['Boundary',1],['Abnormal',2]]){
  test(`UC-70 ${kind} | Request 4 of 5 pieces with ${pending} already planned | ${pending===2?'Excess demand rejected without saving a movement':'Version 1 OPEN relocation saved for four pieces'}`,async()=>{
    const actor=commandActor('stock_relocation:create'),saved=documentStorage(m.TransferOrder);
    productUnit();
    const batch={...balance.batch,piecesPerCarton:1};
    const target={...location,_id:id(7),locationType:'STORAGE'};
    const stock={...balance,batchId:batch._id,holdingPointId:point._id,quantityBase:'5',packagingPortions:[
      {_id:id(11),quantityBase:'4',packagingState:'LOOSE'},{_id:id(12),quantityBase:'1',packagingState:'LOOSE'}]};
    read(m.InventoryBalance,'findById',stock);read(m.StockHoldingPoint,'findById',point);
    read(m.ProductBatch,'findById',batch);read(m.ProductBatch,'findOne',batch);read(m.ProductBatch,'updateOne',{matchedCount:1});
    read(m.Product,'findById',product);read(m.WarehouseLocation,'findById',location);read(m.WarehouseLocation,'findOne',target);
    read(m.TransferOrder,'find',pending?[{_id:id(15),items:[{_id:id(16),qtyBase:String(pending),details:{sourceBalanceId:balance._id}}]}]:[]);
    read(m.StockTransaction,'find',[]);read(m.WarehouseLocation,'find',[location,target]);
    read(m.Warehouse,'findOneAndUpdate',warehouse);read(m.WarehouseLocation,'findOneAndUpdate',target);
    read(m.Warehouse,'exists',warehouse);read(m.StocktakeLocationLock,'exists',null);
    const result=createLocationMovement(actor,{warehouseId:id(1),idempotencyKey:'r1-move',reason:'Refill',
      lines:[{sourceBalanceId:balance._id,sourceBalanceVersion:balance.version,toLocationId:target._id,enteredQty:'4',enteredUnit:'PIECE'}]});
    if(pending===2){
      await assert.rejects(result,/Tồn nguồn đã được lập lệnh khác/);assert.equal(saved.length,0);
    } else {
      const receipt=await result;
      assert.equal(receipt.workflowStatus,'OPEN');assert.equal(receipt.version,1);
      assert.equal(saved.length,1);assert.equal(String(saved[0].items[0].qtyBase),'4');assert.equal(saved[0].header.taskKind,'RELOCATE');
    }
  });
}
for(const [kind,active] of [['Normal',2],['Boundary',1]]){
  test(`UC-81 ${kind} | ${active} of the two requested warehouses are active | ${active===2?'New transfer is pending approval with 3 pieces':'Transfer is refused before any request is saved'}`,async()=>{
    const actor=commandActor('stock_transfer:create'),saved=documentStorage(m.WarehouseTransferRequest);
    mock.method(m.Warehouse,'countDocuments',filter=>{
      assert.deepEqual(filter,{_id:{$in:[id(1),id(2)]},isActive:true});return query(active);
    });
    productUnit();
    const result=createRequest(actor,{idempotencyKey:'r1-transfer',sourceWarehouseId:id(1),destinationWarehouseId:id(2),
      reason:'Restock',lines:[{productId:product._id,enteredUnit:'PIECE',enteredQty:'3'}]});
    if(active===1){await assert.rejects(result,/hai kho hoạt động/);assert.equal(saved.length,0);}
    else {
      const receipt=await result;assert.equal(receipt.workflowStatus,'PENDING_APPROVAL');
      assert.equal(saved.length,1);assert.equal(String(saved[0].items[0].qtyBase),'3');assert.equal(String(saved[0].header.requestedBy),actor._id);
    }
  });
}

