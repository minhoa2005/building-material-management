import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { buildPlan, planUpgrade, applyUpgrade } from '../src/migrations/single-role.js';

const id = () => new mongoose.Types.ObjectId();
const { EJSON } = mongoose.mongo.BSON;
const clone = (value) => EJSON.parse(EJSON.stringify(value, { relaxed: false }));
const roles = [{ _id: id(), code: 'SALES' }, { _id: id(), code: 'OWNER' }];

function memory(users) {
  let state = { users: clone(users), roles: clone(roles) };
  let writes = 0, indexes = 0;
  const connection = {
    db: { collection: (name) => ({
      find: (_query, options) => ({ sort: () => ({ toArray: async () => state[name].map((item) =>
        Object.fromEntries(Object.entries(item).filter(([key]) => options.projection[key]))) }) }),
      updateOne: async (query, update) => {
        writes++;
        if (connection.failAt === writes) throw new Error('injected write failure');
        const user = state.users.find((item) => String(item._id) === String(query._id));
        if (!user) return { matchedCount: 0 };
        Object.assign(user, update.$set);
        for (const key of Object.keys(update.$unset || {})) delete user[key];
        return { matchedCount: 1 };
      },
      createIndex: async () => { indexes++; },
    }) },
    startSession: async () => ({
      withTransaction: async (fn) => {
        const before = clone(state);
        try { await fn(); } catch (error) { state = before; throw error; }
      }, endSession: async () => {},
    }),
  };
  return { connection, state: () => state, writes: () => writes, indexes: () => indexes };
}

test('role migration auto-converts a single valid reference and preserves current scalar users', () => {
  const one = { _id: id(), roleIds: [roles[0]._id] };
  const current = { _id: id(), roleId: roles[1]._id, isActive: false };
  const consistent = { _id: id(), roleId: roles[0]._id, roleIds: [roles[0]._id] };
  const plan = buildPlan([one, current, consistent], roles);
  assert.equal(plan.blocked.length, 0); assert.equal(plan.changes.length, 2);
  assert.equal(plan.changes[0].roleId, roles[0]._id);
  assert.ok(plan.changes.every((change) => change.removeRoleIds));
});

test('ambiguous, missing, dangling, malformed and conflicting old/new roles require explicit choices', () => {
  const users = [
    {}, { roleIds: [] }, { roleIds: [roles[0]._id, roles[1]._id] },
    { roleIds: [roles[0]._id, roles[0]._id] }, { roleIds: [id()] },
    { roleId: null, roleIds: [roles[0]._id] }, { roleId: id() },
    { roleId: roles[0]._id, roleIds: [roles[1]._id] },
    { roleIds: String(roles[0]._id) }, { role: 'SALES' },
    { roleId: roles[0]._id, role: 'OWNER' },
  ].map((fields) => ({ _id: id(), isActive: false, ...fields }));
  assert.equal(buildPlan(users, roles).blocked.length, users.length);
  const assignments = Object.fromEntries(users.map((user) => [String(user._id), 'SALES']));
  const resolved = buildPlan(users, roles, assignments);
  assert.equal(resolved.blocked.length, 0); assert.equal(resolved.changes.length, users.length);
  for (const mapping of [[], null, { [id()]: 'SALES' }, { [users[0]._id]: 'INVALID' }, { [users[0]._id]: ['SALES'] }]) {
    assert.throws(() => buildPlan(users, roles, mapping));
  }
  assert.throws(() => buildPlan(users, [...roles, { _id: id(), code: 'SALES' }]), /catalogue/);
});

test('migration preview does not write; apply preserves unrelated facts and is idempotent', async () => {
  const user = { _id: id(), roleIds: [roles[0]._id], passwordHash: 'unchanged', warehouseIds: [id()], updatedAt: new Date(), isActive: false };
  const db = memory([user]);
  const preview = await planUpgrade(db.connection.db);
  assert.equal(preview.changes.length, 1); assert.equal(db.writes(), 0); assert.equal(db.indexes(), 0);
  const backup = async () => ({ completed: true, path: 'test-only' });
  await applyUpgrade(db.connection, { backup });
  const migrated = db.state().users[0];
  assert.equal(migrated.roleIds, undefined); assert.equal(String(migrated.roleId), String(roles[0]._id));
  const { roleIds: _old, ...before } = user;
  const { roleId: _new, ...after } = migrated;
  assert.deepEqual(after, before);
  assert.equal((await applyUpgrade(db.connection, { backup })).applied, 0);
  assert.equal(db.writes(), 1);
});

test('unresolved users and incomplete backups prevent every database write', async () => {
  const blocked = memory([{ _id: id(), roleIds: [roles[0]._id] }, { _id: id() }]);
  await assert.rejects(applyUpgrade(blocked.connection, { backup: () => assert.fail('must preflight first') }), /blocked/);
  assert.equal(blocked.writes(), 0); assert.equal(blocked.indexes(), 0);
  for (const backup of [undefined, async () => undefined, async () => { throw new Error('backup failed'); }]) {
    const db = memory([{ _id: id(), roleIds: [roles[0]._id] }]);
    await assert.rejects(applyUpgrade(db.connection, { backup }), /backup/i);
    assert.equal(db.writes(), 0); assert.equal(db.indexes(), 0);
  }
});

test('concurrent role changes abort before writes and write failures roll back all user changes', async () => {
  const users = [1, 2].map(() => ({ _id: id(), roleIds: [roles[0]._id] }));
  const changed = memory(users);
  await assert.rejects(applyUpgrade(changed.connection, { backup: async () => {
    changed.state().users[0].roleIds = [roles[1]._id]; return { completed: true };
  } }), /changed during backup/);
  assert.equal(changed.writes(), 0);
  const failed = memory(users); failed.connection.failAt = 2;
  await assert.rejects(applyUpgrade(failed.connection, { backup: async () => ({ completed: true }) }), /injected/);
  assert.deepEqual(failed.state().users, users); assert.equal(failed.indexes(), 0);
});

test('single-role migration persists atomically on an isolated MongoDB database', {
  skip: !process.env.MONGODB_TEST_URI,
}, async () => {
  const connection = await mongoose.createConnection(process.env.MONGODB_TEST_URI, {
    dbName: `sep490_single_role_test_${id()}`, autoCreate: false, autoIndex: false,
  }).asPromise();
  try {
    await connection.db.collection('roles').insertMany(clone(roles));
    const users = [
      { _id: id(), roleIds: [roles[0]._id], warehouseIds: [id()], passwordHash: 'preserve' },
      { _id: id(), roleIds: [roles[0]._id, roles[1]._id], isActive: false },
    ];
    await connection.db.collection('users').insertMany(clone(users));
    const backup = async () => ({ completed: true, path: 'integration-test-stub' });
    await assert.rejects(applyUpgrade(connection, { backup }), /blocked/);
    const assignments = { [users[1]._id]: 'OWNER' };
    assert.equal((await applyUpgrade(connection, { assignments, backup })).applied, 2);
    const migrated = await connection.db.collection('users').findOne({ _id: users[0]._id });
    assert.equal(migrated.passwordHash, 'preserve'); assert.equal(migrated.roleIds, undefined);
    assert.equal((await applyUpgrade(connection, { backup })).applied, 0);
    assert.ok((await connection.db.collection('users').indexes()).some((index) => index.key.roleId === 1 && !index.unique));
  } finally { await connection.dropDatabase(); await connection.close(); }
});
