import test from 'node:test';
import assert from 'node:assert/strict';
import { createBody, detailSchema, confirmSchema, listSchema } from '../src/modules/location-movements/location-movement.validation.js';
import { splitPortions } from '../src/shared/utils/stock.js';

const id = '123456789012345678901234';
const body = () => ({
  idempotencyKey: 'move-1', warehouseId: id, reason: 'Reorganize storage',
  lines: [{ sourceBalanceId: id, sourceBalanceVersion: 0, toLocationId: id, enteredUnit:'PIECE', enteredQty: '4' }],
});

test('1050 pieces at 100/carton: whole cartons then the whole loose lot, never a cut carton or loose lot',()=>{
  const sealed=(count)=>({packagingState:'SEALED',sealedPackCount:count,quantityBase:String(count*100),packagingSnapshot:{baseUnitsPerPackage:'100'}});
  const stock=()=>[sealed(10),{packagingState:'LOOSE',quantityBase:'50'}];
  const afterFirst=splitPortions(stock(),'500',id).kept;
  assert.deepEqual(splitPortions(afterFirst,'550',id).kept,[]);
  assert.throws(()=>splitPortions(stock(),'540',id),/nguyên thùng/);
  assert.throws(()=>splitPortions(stock(),'1030',id),/đo và tách/);
  assert.throws(()=>splitPortions(stock(),'50',id),/nguyên thùng/);
});
