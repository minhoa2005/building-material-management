import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from '../src/models/index.js';
import { createUserSchema, updateUserSchema } from '../src/modules/users/user.validation.js';
import * as users from '../src/modules/users/user.service.js';
import * as auth from '../src/modules/auth/auth.service.js';
import { listRoles } from '../src/modules/roles/role.service.js';
import { authenticate, authorize } from '../src/middlewares/auth.js';
import checkPermission from '../src/middlewares/permission.js';
import { currentRole, rolePermissions } from '../src/shared/utils/userRole.js';
import { seedUsers } from '../src/seeds/user.seed.js';

const id = () => new mongoose.Types.ObjectId();
const role = (code, permissions) => ({ _id: id(), code, permissionIds: permissions.map((code) => ({ code })) });
const invoke = (middleware, request) => new Promise((resolve) => middleware(request, {}, resolve));
const restore = (t, object, key, replacement) => {
  const original = object[key]; object[key] = replacement; t.after(() => { object[key] = original; });
};

test('User requires exactly one scalar role reference and permits shared roles', async () => {
  const fields = { username: 'person', fullName: 'Person', passwordHash: 'hash' };
  const assigned = id();
  for (const roleId of [undefined, null, [], [assigned], [assigned, id()], 'invalid']) {
    await assert.rejects(new User({ ...fields, roleId }).validate());
  }
  assert.throws(() => new User({ ...fields, roleIds: [assigned] }), /strict mode/);
  await new User({ ...fields, roleId: assigned }).validate();
  await new User({ ...fields, username: 'other', roleId: assigned, isActive: false }).validate();
  const index = User.schema.indexes().find(([keys]) => keys.roleId === 1);
  assert.ok(index && !index[1].unique);
});

test('account write contracts reject plural role payloads instead of silently ignoring them', () => {
  const body = { username: 'person', fullName: 'Person', password: 'password123', roleCode: 'SALES' };
  assert.ok(createUserSchema.safeParse({ body }).success);
  for (const extra of [{ roleCode: ['SALES'] }, { roleCode: 'UNKNOWN' }, { roles: ['SALES'] }, { roleIds: [String(id())] }, { roleId: [String(id())] }]) {
    assert.equal(createUserSchema.safeParse({ body: { ...body, ...extra } }).success, false);
    assert.equal(updateUserSchema.safeParse({ params: { id: String(id()) }, body: extra }).success, false);
  }
  const { roleCode: _removed, ...missing } = body;
  assert.equal(createUserSchema.safeParse({ body: missing }).success, false);
});

test('permissions use only the current role and never give ADMIN business operations', async () => {
  const user = { roleId: role('SALES', ['sales_order:create', 'goods_issue:post']), roleIds: [role('OWNER', ['defect:approve'])] };
  assert.deepEqual(rolePermissions(user), ['sales_order:create']);
  assert.equal(await invoke(checkPermission('sales_order:create', ['SALES']), { user }), undefined);
  assert.equal((await invoke(checkPermission('defect:approve'), { user })).statusCode, 403);
  assert.equal((await invoke(authorize(['OWNER']), { user })).statusCode, 403);
  user.roleId = role('ADMIN', ['user:read', 'goods_issue:post']);
  assert.deepEqual(rolePermissions(user), ['user:read']);
  assert.equal((await invoke(checkPermission('goods_issue:post'), { user })).statusCode, 403);
  assert.equal(currentRole({ roleIds: user.roleIds }), null);
  assert.equal((await invoke(checkPermission('user:read'), {})).statusCode, 403);
});

test('login, refresh and me expose one lowercase role; old tokens reload current rights', async (t) => {
  const user = { _id: id(), username: 'person', fullName: 'Person', isActive: true,
    passwordHash: await bcrypt.hash('password123', 4), roleId: role('SALES', ['sales_order:create']) };
  const query = () => ({ select: () => query(), populate: async (population) => {
    assert.equal(population.path, 'roleId'); return user;
  } });
  restore(t, User, 'findOne', query); restore(t, User, 'findById', query);
  const login = await auth.loginUser(' PERSON ', 'password123');
  const me = await auth.getCurrentUser(user._id);
  const refresh = await auth.refreshToken(user._id);
  assert.deepEqual(login.user, me); assert.deepEqual(refresh.user, me);
  assert.equal(me.role, 'sales'); assert.equal(me.primaryRole, 'sales'); assert.deepEqual(me.roles, ['sales']);
  assert.deepEqual(jwt.decode(login.accessToken).roles, ['sales']);
  user.roleId = role('WAREHOUSE', ['goods_issue:post']);
  const request = { headers: { authorization: `Bearer ${login.accessToken}` } };
  assert.equal(await invoke(authenticate, request), undefined);
  assert.deepEqual(rolePermissions(request.user), ['goods_issue:post']);
  assert.equal((await invoke(checkPermission('sales_order:create'), request)).statusCode, 403);
  assert.equal((await auth.refreshToken(user._id)).user.role, 'warehouse');
  await assert.rejects(auth.loginUser('person', 'wrong'), { statusCode: 401 });
  user.roleId = null;
  await assert.rejects(auth.getCurrentUser(user._id), { statusCode: 401 });
  await assert.rejects(auth.refreshToken(user._id), { statusCode: 401 });
  assert.equal((await invoke(authenticate, request)).statusCode, 401);
  user.isActive = false;
  await assert.rejects(auth.loginUser('person', 'password123'), { statusCode: 401 });
});

test('account create/update replace a scalar role, filtering and counts group by roleId', async (t) => {
  const assigned = role('SALES', []);
  const stored = { _id: id(), username: 'person', fullName: 'Person', roleId: assigned, isActive: true, save: async () => {} };
  let created, filter, pipeline;
  restore(t, Role, 'findOne', async () => assigned);
  restore(t, User, 'create', async (data) => { created = data; return stored; });
  restore(t, User, 'findOne', async () => null);
  restore(t, User, 'findById', () => ({ ...stored, populate: () => ({ lean: async () => ({ ...stored, roleId: assigned }) }), then: (resolve) => resolve(stored) }));
  await users.createUser({ username: 'person', fullName: 'Person', password: 'password123', roleCode: 'SALES' });
  assert.equal(created.roleId, assigned._id); assert.equal(created.roleIds, undefined);
  await users.updateUser(stored._id, { roleCode: 'SALES' });
  assert.equal(stored.roleId, assigned._id);
  stored.roleId = assigned;
  restore(t, User, 'find', (query) => {
    filter = query;
    return { populate: () => ({ sort: () => ({ skip: () => ({ limit: () => ({ lean: async () => [stored] }) }) }) }) };
  });
  restore(t, User, 'countDocuments', async () => 1);
  const result = await users.listUsers({ role: 'sales' });
  assert.equal(filter.roleId, assigned._id); assert.deepEqual(result.items[0].roles, ['sales']);
  restore(t, User, 'aggregate', async (stages) => { pipeline = stages; return [{ _id: assigned._id, count: 2 }]; });
  restore(t, Role, 'find', () => ({ populate: () => ({ lean: async () => [assigned] }) }));
  assert.equal((await listRoles())[0].userCount, 2);
  assert.deepEqual(pipeline, [{ $group: { _id: '$roleId', count: { $sum: 1 } } }]);
});

test('legacy account seed rejects a missing role catalogue before querying or inserting users', async (t) => {
  restore(t, User, 'findOne', () => { assert.fail('must validate catalogue first'); });
  await assert.rejects(seedUsers(new Map()), /Missing role/);
});
