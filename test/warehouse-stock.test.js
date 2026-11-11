import test from 'node:test';
import assert from 'node:assert/strict';
import { listQuery, createBody, editBody, warehouseCreateBody, warehouseEditBody } from '../src/modules/warehouse-stock/validation.js';
import { proposalBody, reviewBody } from '../src/modules/transfers/transfer-differences.js';
test('warehouse-stock queries reject operators, unknown fields, oversized pages and reversed dates',()=>{
 assert.deepEqual(listQuery.parse({}),{page:1,limit:20});
 for(const input of [{q:{$ne:''}},{limit:101},{page:0},{locationId:'bad'},{sort:'$where'},{from:'2026-11-12T00:00:00Z',to:'2026-11-11T00:00:00Z'}])assert.equal(listQuery.safeParse(input).success,false);
 assert.equal(listQuery.safeParse({productId:'a'.repeat(24),batchId:'b'.repeat(24),operation:'RELOCATE',limit:100}).success,true);
});
test('location input has real positive dimensions, compatible pickability and mandatory edit version',()=>{
 const body={warehouseId:'a'.repeat(24),code:'A1',name:'Ô A1',locationType:'STORAGE',usableLengthMm:'2000',usableWidthMm:'2000',isPickable:true,isActive:true,idempotencyKey:'location-test'};
 assert.equal(createBody.safeParse(body).success,true);
 for(const change of [{usableLengthMm:'0'},{usableWidthMm:'-1'},{locationType:'QUARANTINE'},{capacityPallets:20}])assert.equal(createBody.safeParse({...body,...change}).success,false);
 assert.equal(editBody.safeParse(body).success,false);
 assert.equal(editBody.safeParse({...body,expectedVersion:1}).success,true);
 assert.equal(editBody.safeParse({...body,usableLengthMm:2000,usableWidthMm:2000,isActive:false,expectedVersion:1}).success,true);
});
test('transfer differences require actual line quantities and explicit review decisions',()=>{
 const body={idempotencyKey:'difference',expectedVersion:1,reason:'Chưa nhận',lines:[{dispatchLineId:'a'.repeat(24),qtyBase:'4'}]};
 assert.equal(proposalBody.safeParse(body).success,true);
 assert.equal(proposalBody.safeParse({...body,lines:[...body.lines,...body.lines]}).success,false);
 assert.equal(proposalBody.safeParse({...body,lines:[{...body.lines[0],qtyBase:'0'}]}).success,false);
 assert.equal(reviewBody.safeParse({idempotencyKey:'review',expectedVersion:1,decision:'AUTO_CLOSE',reason:'X'}).success,false);
});
test('warehouse master input validates code, dimensions and optimistic updatedAt',()=>{
 const body={code:'KHO-01',name:'Kho trung tâm',address:'Địa chỉ',description:'Mô tả',lengthMm:'10000',widthMm:'8000',clearHeightMm:'3000',isActive:true,idempotencyKey:'warehouse-test'};
 assert.equal(warehouseCreateBody.safeParse(body).success,true);
 assert.equal(warehouseCreateBody.safeParse({...body,lengthMm:'0'}).success,false);
 assert.equal(warehouseCreateBody.safeParse({...body,unknownField:'x'}).success,false);
 assert.equal(warehouseEditBody.safeParse({...body,expectedUpdatedAt:'2026-11-12T10:00:00+07:00'}).success,true);
 assert.equal(warehouseEditBody.safeParse({...body,lengthMm:10000,widthMm:8000,clearHeightMm:3000,isActive:false,expectedUpdatedAt:'2026-11-12T10:00:00+07:00'}).success,true);
});
