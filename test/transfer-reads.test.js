import test from 'node:test';
import assert from 'node:assert/strict';
import { listQuery, detailParams } from '../src/modules/transfers/transfer-read.validation.js';

test('transfer filters are bounded and reject operators, unknown fields and invalid dates', () => {
  assert.deepEqual(listQuery.parse({}), { page: 1, limit: 20 });
  assert.equal(listQuery.parse({ page: '2', limit: '10' }).page, 2);
  for (const input of [{ page: '0' }, { limit: '101' }, { status: { $ne: 'DRAFT' } }, { sort: '$where' },
    { sourceWarehouseId: 'bad-id' }, { from: 'yesterday' },
    { from: '2026-10-29T12:00:00Z', to: '2026-10-28T12:00:00Z' }]) {
    assert.equal(listQuery.safeParse(input).success, false);
  }
  assert.equal(detailParams.safeParse({ id: 'invalid' }).success, false);
});
