import test from 'node:test';
import assert from 'node:assert/strict';
import { supplierCreateSchema, agreementSchema, receiptSchema, ackSchema, externalCreateSchema } from '../src/modules/return-workflows/workflow.validation.js';
import { DocumentLine } from '../src/models/index.js';
const id = 'a'.repeat(24);
const base = { expectedVersion: 1, idempotencyKey: 'test-operation-0001', note: 'Recorded physical facts' };
test('supplier proposal does not fabricate an agreement; verified supplier lines still require evidence', async () => {
  const fields = { documentId: id, productId: id, lotId: id, conversionId: id, lineNo: 1, enteredQty: '2', conversionSnapshot: '1', qtyBase: '2', productNameSnapshot: 'Tile', lineKind: 'SUPPLIER_RETURN' };
  await new DocumentLine({ ...fields, details: { phase: 'PROPOSED', originLineId: id, ownerPartyId: id, sourceBalanceId: id } }).validate();
  await assert.rejects(new DocumentLine({ ...fields, details: { phase: 'VERIFIED', originLineId: id, ownerPartyId: id } }).validate());
});
test('supplier and receipt commands reject duplicate source lines, float quantities and missing evidence', () => {
  const body = { ...base, warehouseId: id, supplierId: id, lines: [{ originLineId: id, balanceId: id, qtyBase: '2' }] }; delete body.expectedVersion;
  assert.ok(supplierCreateSchema.safeParse({ body }).success);
  assert.equal(supplierCreateSchema.safeParse({ body: { ...body, lines: [...body.lines, ...body.lines] } }).success, false);
  assert.equal(receiptSchema.safeParse({ params: { id }, body: { ...base, evidenceIds: [], lines: [{ lineId: id, qtyBase: '2', locationId: id, qualityCode: 'GOOD' }] } }).success, false);
  assert.equal(ackSchema.safeParse({ params: { id }, body: { ...base, evidenceIds: [id], lines: [{ lineId: id, qtyBase: 2, outcome: 'ACCEPTED' }] } }).success, false);
  assert.ok(agreementSchema.safeParse({ params: { id }, body: { ...base, evidenceIds: [id], reference: 'NCC refusal', lines: [{ lineId: id, qtyBase: '0' }] } }).success);
  assert.equal(externalCreateSchema.safeParse({ body: {} }).success, false);
});
