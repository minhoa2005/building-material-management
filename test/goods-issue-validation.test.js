import test from 'node:test';
import assert from 'node:assert/strict';
import { createBody, updateBody, postBody, listQuery, pickingBody } from '../src/modules/goods-issues/goods-issue.validation.js';
const id = '507f1f77bcf86cd799439011';
const operation = { idempotencyKey: 'gi-test', expectedVersion: 1 };

test('manual references validate quantities for OTHER and SALE', () => {
  const create = { ...operation, warehouseId: id, issueKind: 'OTHER', reasonText: 'Sample withdrawal', referenceNo: 'EXTERNAL-OTHER', lines: [{ productId: id, qtyBase: '4', note: 'Manual cross-check' }] };
  assert.ok(createBody.safeParse(create).success);
  assert.ok(createBody.safeParse({ ...create, issueKind: 'OTHER', reasonText: 'Sample withdrawal' }).success);
  assert.ok(createBody.safeParse({ ...create, lines: [{ productId: id, quantity: '1.5', conversionId: id }] }).success);
  assert.equal(createBody.safeParse({ ...create, lines: [{ productId: id, qtyBase: '4', conversionId: id }] }).success, false);
  for (const change of [{ referenceNo: ' ' }, { issueKind: 'TRANSFER' }, { workflowStatus: 'DRAFT' }, { approvedBy: id }, { lines: [...create.lines, ...create.lines] }, { expectedVersion: 2 }]) assert.equal(createBody.safeParse({ ...create, ...change }).success, false);
  assert.equal(createBody.safeParse({ ...create, reasonText: undefined }).success, false);
  assert.ok(createBody.safeParse({ ...create, issueKind: 'SALE', reasonText: undefined }).success);
  assert.ok(pickingBody.safeParse({ ...operation, allocations: [{ lineId: id, sourceBalanceId: id, locationId: id, qtyBase: '4' }] }).success);
});

test('direct sales require order, warehouse and unique order-line/balance pairs', () => {
 const create={...operation,salesOrderId:id,warehouseId:id,lines:[{salesOrderLineId:id,sourceBalanceId:id,qtyBase:'4'}]};
 assert.equal(createBody.safeParse(create).success,true);
 assert.equal(createBody.safeParse({...create,lines:[...create.lines,...create.lines]}).success,false);
 assert.equal(createBody.safeParse({...create,lines:[{...create.lines[0],qtyBase:'0'}]}).success,false);
 assert.equal(createBody.safeParse({...create,header:{fulfillmentMode:'DIRECT'}}).success,false);
});
