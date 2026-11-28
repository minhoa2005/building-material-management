import test,{afterEach,mock} from 'node:test';
import assert from 'node:assert/strict';
import { StockReservation,TransferOrder,StockTransaction,DefectReport,Warehouse,WarehouseLocation,StockHoldingPoint,InventoryBalance,StocktakeLocationLock,WarehouseTransferRequest,TransferDispatch,TransferReceipt,InternalTransferRequirement,ApprovalHistory,StockDiscrepancy } from '../src/models/runtime.js';
import { freeQuantities } from '../src/shared/utils/stock-availability-read.js';
import { freeQuantity } from '../src/shared/utils/stock.js';
import { transferOptions,getTransfer,getDispatch } from '../src/modules/transfers/transfer.service.js';
import { optionsQuery } from '../src/modules/transfers/transfer.validation.js';
afterEach(()=>mock.restoreAll());
const chain=value=>({select(){return this;},session(){return this;},lean:async()=>value,then(resolve,reject){return Promise.resolve(value).then(resolve,reject);}});
const matches=(value,filter)=>filter?.$in?filter.$in.map(String).includes(String(value)):String(value)===String(filter);
function fixture(){
  const reservations=[{balanceId:'a',reservedQty:'10',consumedQty:'2',releasedQty:'0',movedQty:'0',executionRef:{documentType:'transfer_orders',documentId:'t1'}},
    {balanceId:'b',reservedQty:'2',consumedQty:'0',releasedQty:'0',movedQty:'0',executionRef:{documentType:'transfer_orders',documentId:'t1'}}];
  const tasks=[{_id:'t1',items:[{_id:'i1',qtyBase:'30',details:{sourceBalanceId:'a'}}]},
    {_id:'t2',items:[{_id:'i2',qtyBase:'3',details:{sourceBalanceId:'b'}}]}];
  const transactions=[{sourceId:'t1',movements:[{sourceLineId:'i1',fromBalanceId:'a',quantityBase:'5'}]}];
  const reports=[{holds:[{_id:'h',status:'ACTIVE',allocations:[{balanceId:'a',quantityBase:'4'}],events:[{kind:'RELEASED',quantityBase:'1'}]}]}];
  mock.method(StockReservation,'find',q=>chain(reservations.filter(r=>matches(r.balanceId,q.balanceId)&&(!q['executionRef.documentId']||matches(r.executionRef.documentId,q['executionRef.documentId'])))));
  mock.method(TransferOrder,'find',q=>chain(tasks.filter(t=>t.items.some(i=>matches(i.details.sourceBalanceId,q['items.details.sourceBalanceId'])))));
  mock.method(StockTransaction,'find',q=>chain(transactions.filter(t=>matches(t.sourceId,q.sourceId))));
  mock.method(DefectReport,'find',q=>chain(reports.filter(r=>r.holds.some(h=>h.allocations.some(a=>matches(a.balanceId,q.holds.$elemMatch['allocations.balanceId']))))));
  return [{_id:'a',quantityBase:'100'},{_id:'b',quantityBase:'20'},{_id:'c',quantityBase:'0.125'}];
}

const wh='a'.repeat(24);
const user={isActive:true,_id:'b'.repeat(24),warehouseIds:[wh],roleId:{code:'WAREHOUSE',isActive:true,permissionIds:[{code:'stock_transfer:read'}]}};
test('destination location options do not load balances, products or design payloads and preserve warehouse scope',async()=>{
  assert.deepEqual(optionsQuery.parse({warehouseId:wh,mode:'locations'}),{warehouseId:wh,mode:'locations'});
  assert.equal(optionsQuery.safeParse({mode:'all'}).success,false);
  let projection;
  mock.method(Warehouse,'find',()=>({select(fields){projection=fields;return chain([{_id:wh,code:'W1',name:'Warehouse'}]);}}));
  mock.method(WarehouseLocation,'find',q=>{assert.equal(q.warehouseId,wh);return chain([{_id:'loc',warehouseId:wh,code:'A1'}]);});
  mock.method(StocktakeLocationLock,'find',()=>chain([])); // the destination list flags locations locked by a stocktake
  for(const model of [StockHoldingPoint,InventoryBalance])mock.method(model,'find',()=>assert.fail('locations-only must not load stock'));
  const result=await transferOptions(user,wh,'locations');assert.equal(result.locations.length,1);assert.deepEqual(result.balances,[]);
  assert.equal(projection,'_id code name isActive');
  await assert.rejects(transferOptions(user,'c'.repeat(24),'locations'),error=>error.statusCode===403);
});
