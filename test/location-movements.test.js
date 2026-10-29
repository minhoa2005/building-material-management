import test from 'node:test';
import assert from 'node:assert/strict';
import { createBody, detailSchema } from '../src/modules/location-movements/location-movement.validation.js';
import { netMovedQuantity } from '../src/modules/location-movements/location-movement.service.js';

const id = '123456789012345678901234';
const body = () => ({
  idempotencyKey: 'move-1', warehouseId: id, reason: 'Reorganize storage',
  lines: [{ sourceBalanceId: id, sourceBalanceVersion: 0, toLocationId: id, conversionId: id, enteredQty: '2.500000' }],
});

test('UC-36 validates decimal strings and rejects client-controlled business fields', () => {
  assert.equal(createBody.parse(body()).lines[0].enteredQty, '2.5');
  for (const quantity of [1.5, '0', '-1', '1e3', 'Infinity', '0.0000001', '100000000000000']) {
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

test('UC-35 derives actual movement once per ledger row, including reversals', () => {
  const batches = [{ _id: 'a' }, { _id: 'b' }, { _id: 'r', reversalOf: 'a' }];
  const movements = [
    { batchId: 'a', qtyBase: '0.1' }, { batchId: 'b', qtyBase: '0.2' },
    { batchId: 'r', qtyBase: '0.1' }, { batchId: 'uncommitted', qtyBase: '99' },
  ];
  assert.equal(netMovedQuantity(movements, batches).toFixed(), '0.2');
  assert.equal(netMovedQuantity([], []).toFixed(), '0');
  assert.equal(netMovedQuantity([
    { batchId: 'a', qtyBase: '2' }, { batchId: 'r', qtyBase: '2' }, { batchId: 'rr', qtyBase: '2' },
  ], [{ _id: 'a' }, { _id: 'r', reversalOf: 'a' }, { _id: 'rr', reversalOf: 'r' }]).toFixed(), '2');
});
