import test from 'node:test';
import assert from 'node:assert/strict';
import { detailParams, outboundQuery, createOrderBody } from '../src/modules/sales-orders/sales.validation.js';

test('sales read validation rejects malformed and unsupported filters', () => {
  for (const query of [{ limit: '0' }, { page: '1.5' }, { page: '-1' }, { limit: '101' },
    { warehouseId: 'bad' }, { status: 'posted' }, { unexpected: true },
    { from: '2026-10-29T00:00:00Z', to: '2026-10-28T00:00:00Z' }, { from: 'yesterday' }]) {
    assert.equal(outboundQuery.safeParse(query).success, false, JSON.stringify(query));
  }
  assert.deepEqual(outboundQuery.parse({}), { page: 1, limit: 20 });
  assert.equal(outboundQuery.parse({ page: '2', limit: '10' }).page, 2);
  assert.equal(detailParams.parse({ id: 'ABCDEF123456789012345678' }).id, 'abcdef123456789012345678');
  assert.equal(detailParams.safeParse({ id: 'not-an-id' }).success, false);
});

test('SO creation validates source identity, decimal strings and strict business input', () => {
  const id = 'abcdef123456789012345678';
  const valid = { idempotencyKey: 'test', customerId: id, neededOn: '2026-11-01T08:00:00+07:00', deliveryAddress: 'Address',
    evidenceReceipt: 'signed-receipt', source: { sourceSystem: 'PAPER', referenceNo: 'ORDER-01' },
    lines: [{ sourceLineKey: '1', productId: id, conversionId: id, quantity: '2' }] };
  assert.equal(createOrderBody.safeParse(valid).success, true);
  for (const quantity of ['0', '-1', '1e3', '1.0000001', '100000000000000', '01', 2, '', 'NaN']) {
    assert.equal(createOrderBody.safeParse({ ...valid, lines: [{ ...valid.lines[0], quantity }] }).success, false);
  }
  for (const change of [{ lines: [] }, { lines: [valid.lines[0], valid.lines[0]] }, { evidenceReceipt: '' },
    { price: '100' }, { workflowStatus: 'COMPLETED' }, { customerId: 'bad' }, { neededOn: '2026-02-30T08:00:00Z' },
    { lines: [{ ...valid.lines[0], requiredTone: 'a'.repeat(61) }] }]) {
    assert.equal(createOrderBody.safeParse({ ...valid, ...change }).success, false);
  }
});
