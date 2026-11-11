import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as m from '../src/models/runtime.js';

const baseline = JSON.parse(readFileSync(new URL('./fixtures/goods-receipt-schema-baseline.json', import.meta.url), 'utf8'));
const variants = { PURCHASE: m.PurchaseReceipt, CUSTOMER_RETURN: m.CustomerReturnReceipt,
  FAILED_DELIVERY: m.FailedDeliveryReceipt, TRANSFER: m.TransferReceipt };

function compareFields(expected, schema, prefix = '') {
  for (const [field, old] of Object.entries(expected.fields)) {
    if (field === 'ownerPartyId') {
      assert.ok(schema.path('ownerType') && schema.path('ownerId'), `${prefix}owner identity`);
      continue;
    }
    const path = schema.path(field);
    assert.ok(path, `${prefix}${field} is missing`);
    assert.equal(path.instance, path.instance==='DocumentIdentity'&&old.type==='ObjectId'?'DocumentIdentity':old.type, `${prefix}${field} type`);
    if (old.schema && path.schema) compareFields(old.schema, path.schema, `${prefix}${field}.`);
  }
}

test('all four receipt schemas retain their document, header, line and embedded fields', () => {
  for (const [kind, Model] of Object.entries(variants)) {
    const old = baseline[kind];
    compareFields({ fields: Object.fromEntries(Object.entries(old.fields).filter(([field]) => field !== 'documentKind')) }, Model.schema, `${kind}.`);
    const oldLines = old.fields.items.schema.discriminators;
    const currentLines = Model.schema.path('items').schema.discriminators;
    assert.deepEqual(Object.keys(currentLines).sort(), Object.keys(oldLines).sort());
    for (const [name, shape] of Object.entries(oldLines)) compareFields(shape, currentLines[name], `${kind}.items.${name}.`);
    assert.equal(new Model().documentKind, kind);
    if (kind !== 'TRANSFER') assert.equal(new Model({ header: { warehouseId: new m.GoodsReceipt()._id } }).header.receiptKind, kind);
    assert.equal(Model.collection.name, 'goods_receipts');
  }
  const indexes = m.GoodsReceipt.schema.indexes();
  assert.ok(indexes.some(([fields, options]) => fields.documentKind === 1 && fields.documentNo === 1 && options.unique));
  for (const name of ['demandReopenings._id', 'commitmentTransfers._id']) {
    assert.ok(m.GoodsReceipt.schema.indexes().some(([fields, options]) => fields[name] === 1 && options.unique && options.sparse));
  }
});
