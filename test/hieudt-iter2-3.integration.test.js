import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';
import * as stock from '../src/modules/warehouse-stock/service.js';
const enabled = process.env.RUN_HIEUDT_LATER_ITERS === '1';
const run = (name, fn) => test(name, { skip: !enabled }, fn);
const key = () => new mongoose.Types.ObjectId().toString();
let owner, worker, warehouse, binId;
test.before(async () => {
  if (!enabled) return;
  await mongoose.connect('mongodb://127.0.0.1:27326/hieudt_iter23_test_' + key() + '?replicaSet=wireframe');
  for (const model of m.models.values()) { await model.createCollection(); await model.createIndexes(); }
  const permissions = await m.Permission.insertMany(PERMISSION_CATALOGUE.map(p => ({ code: p.code, name: p.code, description: p.description })));
  warehouse = await m.Warehouse.create({ name:'Fixture', lengthMm:'10000', widthMm:'10000', clearHeightMm:'3000', code:'FIX' });
  for (const code of ['OWNER','WAREHOUSE']) {
    const role = await m.Role.create({ code, name: code, permissionIds: permissions.filter(p => ROLE_PERMISSIONS[code].includes(p.code)).map(p => p._id) });
    const user = await m.User.create({ username: code.toLowerCase(), fullName: code, passwordHash: 'test-only', roleId: role._id, warehouseIds: [warehouse._id] });
    const actor = await m.User.findById(user._id).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
    if (code === 'OWNER') owner = actor; else worker = actor;
  }
  const bin = await m.WarehouseLocation.create({ warehouseId: warehouse._id, name:'Original', code:'BIN', locationType:'STORAGE', isPickable:true, version:1 });
  binId = bin.id;
});
test.after(async () => {
  if (mongoose.connection.readyState && enabled) {
    assert.match(mongoose.connection.name, /^hieudt_iter23_test_[a-f0-9]{24}$/);
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  }
});
const binEdit = (name, version) => ({ idempotencyKey:key(), name, expectedVersion:version });
run('I2 UC-62 BASE Owner renames a storage bin', async () => {
  await stock.saveLocation(owner, binId, binEdit('Renamed', 1));
  assert.equal((await stock.locationDetail(owner, binId)).name, 'Renamed');
});
run('I2 UC-62 ERR Stale version preserves the saved name', async () => {
  await assert.rejects(stock.saveLocation(owner, binId, binEdit('Stale', 1)), {statusCode:409});
  assert.equal((await stock.locationDetail(owner, binId)).name, 'Renamed');
});
run('I2 UC-62 AUTH Warehouse Staff cannot rename the bin', async () => {
  const bin = await stock.locationDetail(owner, binId);
  await assert.rejects(stock.saveLocation(worker, binId, binEdit('Denied', bin.version)), {statusCode:403});
  assert.equal((await stock.locationDetail(owner, binId)).name, 'Renamed');
});
