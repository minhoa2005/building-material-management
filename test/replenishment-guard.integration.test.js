import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as m from '../src/models/runtime.js';
import { transaction } from '../src/shared/utils/persistence.js';
import { guardReplenishment, completeReplenishmentGuards, guardCommandCoverage } from '../src/shared/utils/replenishment-guard.js';

const enabled = process.env.RUN_NATIVE_API_TESTS === '1';
const id = () => new mongoose.Types.ObjectId();
test('planning guards serialize first creation, rollback and cover referenced products', { skip: !enabled }, async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/wmsd_rr_guard_test_' + id() + '?replicaSet=rs0', { serverSelectionTimeoutMS: 5000 });
  try {
    for (const Model of [m.ReplenishmentLock,m.SalesOrder,m.Warehouse,m.ProductBatch,m.InventoryBalance]) { await Model.createCollection(); await Model.createIndexes(); }
    const warehouseId = id(), productId = id(), soId = id(), operationId = id();
    await m.Warehouse.collection.insertOne({ _id: warehouseId });
    await m.SalesOrder.collection.insertOne({ _id: soId, header: {}, version: 4, items: [{ _id: id(), productId }], replenishmentPlanningVersion: 0 });
    const pair = { warehouseId, productId };
    await Promise.all([1,2].map(() => transaction(async session => {
      await guardReplenishment({ salesOrderIds:[soId], pairs:[pair,pair] }, session);
      await completeReplenishmentGuards(session, operationId);
    })));
    let lock = await m.ReplenishmentLock.findOne(pair);
    assert.equal(lock.version, 2); assert.equal(String(lock.lastOperationId), String(operationId));
    let so = await m.SalesOrder.findById(soId);
    assert.equal(so.version, 4); assert.equal(so.replenishmentPlanningVersion, 2);
    await assert.rejects(transaction(async session => {
      await guardReplenishment({ salesOrderIds:[soId], pairs:[pair] }, session);
      throw new Error('simulated write failure');
    }), /simulated write failure/);
    assert.equal((await m.ReplenishmentLock.findOne(pair)).version, 2);
    await transaction(session => guardCommandCoverage(soId, {}, session));
    lock = await m.ReplenishmentLock.findOne(pair);
    assert.equal(lock.version, 3);
    so = await m.SalesOrder.findById(soId); assert.equal(so.replenishmentPlanningVersion, 3);
    const collectionsBefore = (await mongoose.connection.db.listCollections({}, {nameOnly:true}).toArray()).map(c=>c.name).sort();
    const audit = await promisify(execFile)(process.execPath, ['scripts/audit-replenishment-coverage.mjs','--uri',
      'mongodb://127.0.0.1:27017/'+mongoose.connection.name+'?replicaSet=rs0']);
    const report=JSON.parse(audit.stdout);
    assert.equal(report.mode,'DRY_RUN_READ_ONLY');assert.equal(report.uniqueWarehouseProductIndex,true);
    assert.equal((await m.ReplenishmentLock.findOne(pair)).version,3);
    assert.deepEqual((await mongoose.connection.db.listCollections({}, {nameOnly:true}).toArray()).map(c=>c.name).sort(),collectionsBefore);
  } finally {
    if (!mongoose.connection.name.startsWith('wmsd_rr_guard_test_')) throw new Error('Unsafe test database');
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  }
});
