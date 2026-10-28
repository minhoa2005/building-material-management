import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { planUpgrade, summarizePlan, applyUpgrade } from '../src/migrations/replenishment-3.3.js';

const id = () => new mongoose.Types.ObjectId();
const decimal = (value) => mongoose.Types.Decimal128.fromString(value);
function fixture() {
  const requestId = id(), actor = id(), product = id(), warehouse = id();
  return {
    product_warehouse_policies: [{ _id: id(), productId: product, warehouseId: warehouse, minimumQty: decimal('0.123456') }],
    business_documents: [{
      _id: requestId, documentNo: 'RR-HISTORY', documentKind: 'REPLENISHMENT',
      workflowStatus: 'APPROVED', version: 4, createdBy: actor,
      header: { warehouseId: warehouse, neededOn: new Date('2026-10-01'), triggerReason: 'Recorded replenishment reason' },
    }],
    document_lines: [{
      _id: id(), documentId: requestId, lineNo: 1, lineKind: 'STANDARD', productId: product,
      conversionId: id(), enteredQty: decimal('0.3'), conversionSnapshot: decimal('1'),
      qtyBase: decimal('0.3'), productNameSnapshot: 'Historical product',
    }],
    roles: ['OWNER', 'SALES', 'WAREHOUSE', 'ACCOUNTANT', 'ADMIN'].map((code) => ({
      _id: id(), code, permissionIds: [id()],
    })),
    permissions: [], outbox_events: [],
  };
}
function readOnlyDatabase(records) {
  return { collection(name) { return {
    find() { return { async toArray() { return records[name] ?? []; } }; },
  }; } };
}

test('migration preserves quantities, document identities, existing grants and historical reasons', async () => {
  const records = fixture();
  const before = mongoose.mongo.BSON.EJSON.stringify(records);
  const plan = await planUpgrade(readOnlyDatabase(records));
  assert.equal(mongoose.mongo.BSON.EJSON.stringify(records), before, 'preview must not mutate input');
  assert.deepEqual(summarizePlan(plan), {
    updatedRecords: { product_warehouse_policies: 1, business_documents: 1, document_lines: 1 },
    insertedPermissions: 3, updatedRoles: 3,
  });
  const policy = plan.changes.find(({ collection }) => collection === 'product_warehouse_policies');
  assert.equal(policy.set.targetQty.toString(), '0.123456');
  assert.equal(policy.set.version, 1);
  assert.equal(policy.set.updatedBy, undefined);
  const request = plan.changes.find(({ collection }) => collection === 'business_documents');
  assert.deepEqual(Object.keys(request.set), ['header.creationKey']);
  const line = plan.changes.find(({ collection }) => collection === 'document_lines');
  assert.equal(String(line.id), String(records.document_lines[0]._id));
  assert.deepEqual(line.set, { lineKind: 'REPLENISHMENT', details: {
    triggerType: 'MANUAL_OTHER', reasonNote: 'Recorded replenishment reason',
  } });
  const grantedRoles = plan.roleGrants.map(({ id: roleId }) => records.roles.find(({ _id }) => _id.equals(roleId)).code);
  assert.deepEqual(grantedRoles, ['OWNER', 'SALES', 'WAREHOUSE']);
});

test('migration preview becomes a no-op after applying its planned changes', async () => {
  const records = fixture(), db = readOnlyDatabase(records);
  const first = await planUpgrade(db);
  for (const change of first.changes) {
    const record = records[change.collection].find(({ _id }) => _id.equals(change.id));
    for (const [path, value] of Object.entries(change.set)) {
      if (path.startsWith('header.')) record.header[path.slice(7)] = value;
      else record[path] = value;
    }
  }
  records.permissions.push(...first.inserts);
  for (const grant of first.roleGrants) {
    records.roles.find(({ _id }) => _id.equals(grant.id)).permissionIds.push(...grant.permissionIds);
  }
  assert.deepEqual(summarizePlan(await planUpgrade(db)), {
    updatedRecords: {}, insertedPermissions: 0, updatedRoles: 0,
  });
});

test('migration keeps configured targets and rejects invalid policies or invented event versions', async () => {
  const records = fixture(), db = readOnlyDatabase(records);
  records.product_warehouse_policies[0].targetQty = decimal('12');
  records.product_warehouse_policies[0].version = 7;
  const plan = await planUpgrade(db);
  assert.equal(plan.changes.some(({ collection }) => collection === 'product_warehouse_policies'), false);
  records.product_warehouse_policies[0].targetQty = decimal('0.01');
  await assert.rejects(planUpgrade(db), /Target quantity/);
  records.product_warehouse_policies[0].targetQty = decimal('12');
  records.outbox_events.push({ _id: id(), eventType: 'SALES_ORDER_SAVED' });
  await assert.rejects(planUpgrade(db), /actual historical documentVersion/);
});

test('migration rejects ambiguous RR details and requires a completed backup before DDL', async () => {
  const records = fixture(), db = readOnlyDatabase(records);
  records.document_lines[0].details = { unknownSource: id() };
  await assert.rejects(planUpgrade(db), /unrecognized historical details/);
  delete records.document_lines[0].details;
  db.admin = () => ({ command: async () => ({ setName: 'test-only' }) });
  await assert.rejects(applyUpgrade({ db }), /backup is required/);
  await assert.rejects(applyUpgrade({ db }, { backup: async () => { throw new Error('backup failed'); } }), /backup failed/);
});

test('replenishment migration on an isolated MongoDB database is idempotent and preserves stock/history', {
  skip: !process.env.MONGODB_TEST_URI,
}, async () => {
  const dbName = `sep490_migration_verification_${id()}`;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName, autoIndex: false, autoCreate: false });
    const connection = mongoose.connection, records = fixture();
    for (const [name, values] of Object.entries(records)) {
      if (values.length) await connection.db.collection(name).insertMany(values);
    }
    const history = { _id: id(), marker: 'must remain untouched' };
    await connection.db.collection('stock_movements').insertOne(history);
    let backups = 0;
    const backup = async () => { backups++; };
    assert.equal((await applyUpgrade(connection, { backup })).insertedPermissions, 3);
    assert.deepEqual(await applyUpgrade(connection, { backup }), {
      updatedRecords: {}, insertedPermissions: 0, updatedRoles: 0,
    });
    assert.equal(backups, 2);
    assert.deepEqual(await connection.db.collection('stock_movements').findOne({ _id: history._id }), history);
    const rr = await connection.db.collection('business_documents').findOne({ _id: records.business_documents[0]._id });
    assert.equal(rr.workflowStatus, 'APPROVED');
    assert.equal(rr.version, 4);
    assert.equal(await connection.db.collection('notifications').countDocuments(), 0);
    assert.equal(await connection.db.collection('replenishment_planning_guards').countDocuments(), 0);
  } finally {
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  }
});
