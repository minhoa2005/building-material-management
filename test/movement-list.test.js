import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { movementList } from '../src/shared/utils/movement-list.js';
import { listQuery } from '../src/modules/transfers/transfer-read.validation.js';
import { listSchema } from '../src/modules/location-movements/location-movement.validation.js';
import { Warehouse } from '../src/models/runtime.js';

test('movement list validates date ranges, sort allowlist and literal search', () => {
  for (const parse of [q => listQuery.safeParse(q), q => listSchema.safeParse({ query: q })]) {
    assert.equal(parse({ q: 'TR[1]', sortBy: 'warehouse', sortOrder: 'asc' }).success, true);
    assert.equal(parse({ sortBy: 'header.secret' }).success, false);
    assert.equal(parse({ from: '2026-11-12T00:00:00Z', to: '2026-11-11T00:00:00Z' }).success, false);
  }
});

test('local Mongo: scope, full overview, filtering, dates and pagination remain consistent', { skip: !process.env.MOVEMENT_LIST_TEST_URI }, async () => {
  const uri = process.env.MOVEMENT_LIST_TEST_URI;
  assert.match(uri, /^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/wmsd_movement_list_test_[\w-]+(?:\?|$)/);
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
  try {
    const id = () => new mongoose.Types.ObjectId(), a = id(), b = id(), outside = id();
    await Warehouse.collection.insertMany([{ _id: a, code: 'ZA', name: 'Zulu' }, { _id: b, code: 'AB', name: 'Alpha' }, { _id: outside, code: 'OUT', name: 'Hidden' }]);
    const Model = mongoose.model('MovementListFixture', new mongoose.Schema({}, { strict: false }), 'movement_list_fixture');
    await Model.collection.insertMany([
      { _id: id(), documentNo: 'TR[1]', workflowStatus: 'OPEN', header: { warehouseId: a }, createdAt: new Date('2026-11-11T17:00:00Z') },
      { _id: id(), documentNo: 'TR2', workflowStatus: 'CONFIRMED', header: { warehouseId: b }, createdAt: new Date('2026-11-12T16:59:59.999Z') },
      { _id: id(), documentNo: 'TR3', workflowStatus: 'CANCELLED', header: { warehouseId: a }, createdAt: new Date('2026-11-10T00:00:00Z') },
      { _id: id(), documentNo: 'HIDDEN', workflowStatus: 'OPEN', header: { warehouseId: outside }, createdAt: new Date() },
    ]);
    const scope = { 'header.warehouseId': { $in: [a, b] } };
    const read = q => movementList(Model, scope, { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc', ...q }, ['header.warehouseId'], 'CONFIRMED');
    const all = await read({ limit: 1 });
    assert.deepEqual(all.summary, { total: 3, incomplete: 1, completed: 1, cancelled: 1 });
    assert.equal(all.items.length, 1); assert.equal(all.total, 3);
    assert.deepEqual(all.warehouses.map(w => w.name), ['Alpha', 'Zulu']);
    const literal = await read({ q: 'TR[1]' }); assert.equal(literal.total, 1); assert.equal(literal.items[0].documentNo, 'TR[1]');
    assert.deepEqual(literal.summary, all.summary);
    assert.equal((await read({ warehouseId: outside })).total, 0);
    const day = await read({ from: '2026-11-11T17:00:00.000Z', to: '2026-11-12T16:59:59.999Z' }); assert.equal(day.total, 2);
    const sorted = await read({ sortBy: 'warehouse', sortOrder: 'asc' }); assert.equal(sorted.items[0].header.warehouseId, String(b));
    const page2 = await read({ limit: '1', page: '2' }); assert.notEqual(page2.items[0].id, all.items[0].id);
  } finally {
    assert.match(mongoose.connection.name, /^wmsd_movement_list_test_/);
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  }
});
