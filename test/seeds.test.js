import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import * as models from '../src/models/index.js';
import { exact } from '../src/models/model-utils.js';
import { buildDemoData } from '../src/seeds/data/demo.data.js';
import { SEED_ACCOUNTS } from '../src/seeds/data/accounts.data.js';
import { databaseHasData, runSeeds, syncExistingRolePermissions } from '../src/seeds/index.js';

const dataset = buildDemoData();
const byName = async () => new Map((await dataset).map(({ Model, documents }) => [Model.modelName, documents]));

test('demo seed covers all 37 collections, 35 document kinds and 18 line kinds with valid schemas', async () => {
  const groups = await dataset;
  assert.equal(groups.length, 37);
  for (const { Model, documents } of groups) {
    assert.ok(documents.length > 0, Model.modelName);
    for (const document of documents) await document.validate();
  }
  const data = await byName();
  assert.deepEqual(new Set(data.get('BusinessDocument').map((item) => item.documentKind)), new Set(models.DOCUMENT_KINDS));
  assert.deepEqual(new Set(data.get('DocumentLine').map((item) => item.lineKind)), new Set(models.LINE_KINDS));
});

test('every seed reference resolves, including typed headers, line details and embedded approvals', async () => {
  const groups = await dataset;
  const ids = new Map(groups.map(({ Model, documents }) => [Model.modelName, new Set(documents.map((item) => String(item._id)))]));
  function check(schema, value, label) {
    schema.eachPath((path, type) => {
      const field = value?.[path];
      if (field == null) return;
      const ref = type.options.ref ?? type.caster?.options.ref ?? type.$embeddedSchemaType?.options.ref;
      if (ref) {
        for (const entry of Array.isArray(field) ? field : [field]) {
          assert.ok(ids.get(ref)?.has(String(entry)), `${label}.${path} -> ${ref}:${entry}`);
        }
      }
      if (type.schema) {
        for (const entry of Array.isArray(field) ? field : [field]) check(type.schema, entry, `${label}.${path}`);
      }
    });
  }
  for (const { Model, documents } of groups) {
    for (const document of documents) check(document.schema, document.toObject(), Model.modelName);
  }
});

test('seed keeps existing demo credentials, hashes passwords and assigns actual warehouse scopes', async () => {
  const data = await byName();
  for (const account of SEED_ACCOUNTS) {
    const user = data.get('User').find((item) => item.username === account.username);
    assert.ok(await bcrypt.compare(account.password, user.passwordHash));
    assert.equal(user.warehouseIds.length, account.warehouseCodes.length);
    assert.notEqual(user.passwordHash, account.password);
  }
  const dispatch = data.get('BusinessDocument').find((item) => item.documentKind === 'TRANSFER_DISPATCH');
  const receipt = data.get('BusinessDocument').find((item) => item.documentKind === 'MWTR');
  assert.notEqual(String(dispatch.header.dispatchedBy), String(receipt.header.receivedBy));
});

test('ledger replays in time order to every balance; frozen stock is not adjusted by draft plans', async () => {
  const data = await byName();
  const batches = new Map(data.get('PostingBatch').map((item) => [String(item._id), item]));
  const running = new Map();
  const movements = [...data.get('StockMovement')].sort((a, b) =>
    batches.get(String(a.batchId)).postedAt - batches.get(String(b.batchId)).postedAt);
  for (const movement of movements) {
    for (const side of ['from', 'to']) {
      const endpoint = movement[`${side}BalanceId`];
      if (!endpoint) continue;
      const key = String(endpoint);
      assert.ok(exact(running.get(key) ?? '0').eq(exact(movement[`${side}Before`])), `${movement._id}: ${side}Before`);
      running.set(key, movement[`${side}After`]);
      assert.ok(exact(movement[`${side}After`]).gte(0));
    }
  }
  for (const balance of data.get('StockBalance')) {
    assert.ok(exact(running.get(String(balance._id)) ?? '0').eq(exact(balance.qtyBase)));
  }
  const snapshot = data.get('StocktakeSnapshot')[0];
  const frozen = data.get('StockBalance').find((item) => item._id.equals(snapshot.balanceId));
  assert.equal(frozen.qtyBase.toString(), '60');
  assert.equal(snapshot.bookQty.toString(), '60');
  assert.equal(data.get('CountAttempt')[0].countedQty.toString(), '58');
  assert.equal(data.get('DefectHold')[0].status, 'ACTIVE');
  const transit = data.get('StockAccount').find((item) => item.transitDispatchLineId);
  assert.equal(data.get('StockBalance').find((item) => item.accountId.equals(transit._id)).qtyBase.toString(), '2');
  for (const kind of ['DELIVERY_CONFIRMATION', 'PAYMENT_CONFIRMATION', 'ADJUSTMENT', 'ST_RESOLUTION']) {
    const documents = data.get('BusinessDocument').filter((item) => item.documentKind === kind);
    assert.ok(documents.every((document) => !data.get('PostingBatch').some((batch) => batch.documentId.equals(document._id))));
  }
});

test('empty database check includes unknown collections and ignores empty collections/system metadata', async () => {
  const calls = [];
  const fakeDb = (names, populated = []) => ({
    listCollections: () => ({ toArray: async () => names.map((name) => ({ name })) }),
    collection: (name) => ({ findOne: async () => { calls.push(name); return populated.includes(name) ? { _id: 1 } : null; } }),
  });
  assert.equal(await databaseHasData(fakeDb([])), false);
  assert.equal(await databaseHasData(fakeDb(['users', 'legacy_records', 'system.views'])), false);
  assert.equal(await databaseHasData(fakeDb(['users', 'legacy_records'], ['legacy_records'])), true);
  assert.ok(!calls.includes('system.views'));
  const session = {};
  await databaseHasData({ collection: () => ({ findOne: async (filter, options) => {
    assert.equal(options.session, session);
    assert.deepEqual(options.projection, { _id: 1 });
    return null;
  } }) }, { collectionNames: ['users'], session });
  await assert.rejects(databaseHasData({ listCollections: () => { throw new Error('DB unavailable'); } }), /DB unavailable/);
});

test('runSeeds skips a partially populated database before any inserts, indexes or permission updates', async (t) => {
  const connection = mongoose.connection;
  for (const [key, value] of Object.entries({ readyState: 1, db: {
    listCollections: () => ({ toArray: async () => [{ name: 'legacy_records' }] }),
    collection: () => ({ findOne: async () => ({ _id: 1 }) }),
  } })) {
    const descriptor = Object.getOwnPropertyDescriptor(connection, key);
    Object.defineProperty(connection, key, { configurable: true, value });
    t.after(() => descriptor ? Object.defineProperty(connection, key, descriptor) : delete connection[key]);
  }
  assert.deepEqual(await runSeeds(), { seeded: false, reason: 'DATABASE_NOT_EMPTY' });
});

test('standalone MongoDB is rejected before any inserts', async (t) => {
  const connection = mongoose.connection;
  for (const [key, value] of Object.entries({ readyState: 1, db: {
    listCollections: () => ({ toArray: async () => [] }),
    admin: () => ({ command: async () => ({ ok: 1 }) }),
  } })) {
    const descriptor = Object.getOwnPropertyDescriptor(connection, key);
    Object.defineProperty(connection, key, { configurable: true, value });
    t.after(() => descriptor ? Object.defineProperty(connection, key, descriptor) : delete connection[key]);
  }
  await assert.rejects(runSeeds(), /requires MongoDB Atlas or a replica set/);
});

test('explicit permission sync only updates existing roles; missing catalogue fails before saving', async (t) => {
  const saved = [];
  const admin = { code: 'ADMIN', permissionIds: [], save: async () => saved.push('ADMIN') };
  t.mock.method(models.Permission, 'find', () => ({ lean: async () => [] }));
  t.mock.method(models.Role, 'find', async () => [admin]);
  await assert.rejects(syncExistingRolePermissions(), /missing permission/);
  assert.deepEqual(saved, []);
});

test('explicit permission sync restores the catalogue on existing roles', async (t) => {
  const data = await byName();
  let saves = 0;
  const existing = { code: 'OWNER', permissionIds: [], save: async () => { saves += 1; } };
  t.mock.method(models.Permission, 'find', () => ({ lean: async () => data.get('Permission') }));
  t.mock.method(models.Role, 'find', async () => [existing]);
  assert.deepEqual(await syncExistingRolePermissions(), { seeded: false, syncedRoles: 1 });
  assert.equal(saves, 1);
  assert.deepEqual(existing.permissionIds.map(String), data.get('Role').find(({ code }) => code === 'OWNER').permissionIds.map(String));
});
