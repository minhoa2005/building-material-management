import test from 'node:test';
import assert from 'node:assert/strict';
import { createBody, detailSchema } from '../src/modules/location-movements/location-movement.validation.js';
import { splitPortions } from '../src/shared/utils/stock.js';

const id = '123456789012345678901234';
const body = () => ({
  idempotencyKey: 'move-1', warehouseId: id, reason: 'Reorganize storage',
  lines: [{ sourceBalanceId: id, sourceBalanceVersion: 0, toLocationId: id, enteredUnit:'PIECE', enteredQty: '4' }],
});

test('UC-36 validates integer quantity strings and rejects client-controlled business fields', () => {
  assert.equal(createBody.parse(body()).lines[0].enteredQty, '4');
  for (const quantity of [1.5, '2.5', '4.0', '0', '-1', '1e3', 'Infinity', '0.0000001', '100000000000000']) {
    const input = body(); input.lines[0].enteredQty = quantity;
    assert.equal(createBody.safeParse(input).success, false);
  }
  for (const field of ['createdBy', 'workflowStatus', 'qtyBase', 'approvedBy']) {
    assert.equal(createBody.safeParse({ ...body(), [field]: id }).success, false);
  }
  const duplicate = body(); duplicate.lines.push({ ...duplicate.lines[0] });
  assert.equal(createBody.safeParse(duplicate).success, false);
  const invalid = body(); invalid.lines[0].sourceBalanceVersion = -1;
  assert.equal(createBody.safeParse(invalid).success, false);
  assert.equal(createBody.safeParse({ ...body(), lines: [] }).success, false);
  assert.equal(createBody.safeParse({ ...body(), warehouseId: { $ne: null } }).success, false);
  assert.equal(detailSchema.safeParse({ params: { id: 'not-an-id' } }).success, false);
});

test('sealed portions split exactly and loose packaging requires measurement',()=>{
  const portions=[{_id:'original',packagingState:'SEALED',sealedPackCount:3,quantityBase:'12',packagingSnapshot:{baseUnitsPerPackage:'4'}}];
  const split=splitPortions(portions,'4',id);assert.equal(split.kept[0].quantityBase,'8');assert.equal(split.taken[0].quantityBase,'4');assert.equal(split.kept[0]._id,'original');assert.notEqual(String(split.taken[0]._id),'original');
  assert.throws(()=>splitPortions(portions,'3',id),/nguyên thùng/);
  assert.throws(()=>splitPortions([{packagingState:'LOOSE',quantityBase:'4'}],'2',id),/đo và tách/);
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
