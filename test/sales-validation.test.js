import test from 'node:test';
import assert from 'node:assert/strict';
import { detailParams, outboundQuery, createOrderBody } from '../src/modules/sales-orders/sales.validation.js';

test('SO creation validates source identity, decimal strings and strict business input', () => {
  const id = 'abcdef123456789012345678';
  const valid = { idempotencyKey: 'test', customerName: 'Nguyễn Văn An', customerPhone: '0900000000', neededOn: '2026-11-01T08:00:00+07:00', deliveryAddress: 'Address',
    evidenceReceipt: 'signed-receipt', currencyCode:'VND', source: { sourceSystem: 'PAPER', referenceNo: 'ORDER-01' },
    lines: [{ sourceLineKey: '1', productId: id, lotId: id, enteredUnit:'PIECE', unitSellingPrice:'1000', quantity: '2' }], deliveries: [{ plannedOn: '2026-11-02T00:00:00+07:00', warehouseId: id, lines: [{ lineKey: '1', quantity: '2' }] }] };
  assert.equal(createOrderBody.safeParse(valid).success, true);
  // 26/11/2026: a request copied from the customer's slip needs only name, phone, address and priced lines.
  const slip = { idempotencyKey: 'slip', customerName: 'Nguyễn Văn An', customerPhone: '0900000000', lines: [{ productId: id, unitSellingPrice: '155000', quantity: '80' }] };
  const parsed = createOrderBody.safeParse(slip);
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.currencyCode, 'VND');
  assert.equal(createOrderBody.safeParse({ ...slip, lines: [] }).success, false);
  for (const quantity of ['0', '-1', '1e3', '1.0000001', '100000000000000', '01', 2, '', 'NaN']) {
    assert.equal(createOrderBody.safeParse({ ...valid, lines: [{ ...valid.lines[0], quantity }] }).success, false);
  }
  for (const change of [{ deliveries: [] }, { lines: [] }, { lines: [valid.lines[0], valid.lines[0]] }, { evidenceReceipt: '' },
    { price: '100' }, { workflowStatus: 'COMPLETED' }, { customerName: '' }, { customerName: ' '.repeat(10) }, { customerPhone: '1'.repeat(31) }, { customerId: id }, { neededOn: '2026-02-30T08:00:00Z' },
    { lines: [{ ...valid.lines[0], requiredTone: 'a'.repeat(61) }] }]) {
    assert.equal(createOrderBody.safeParse({ ...valid, ...change }).success, false);
  }
});
