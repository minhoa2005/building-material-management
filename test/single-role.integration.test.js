import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role, Permission, ROLE_CODES } from '../src/models/index.js';
import { ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';

test('HTTP account writes, auth profiles and existing tokens enforce one current role in MongoDB', {
  skip: !process.env.MONGODB_TEST_URI,
}, async () => {
  const dbName = `sep490_single_role_http_${new mongoose.Types.ObjectId()}`;
  let server;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName, autoIndex: false, autoCreate: false });
    const codes = [...new Set(Object.values(ROLE_PERMISSIONS).flat())];
    const permissions = await Permission.insertMany(codes.map((code) => ({ code })));
    const permissionMap = new Map(permissions.map((item) => [item.code, item._id]));
    const roles = await Role.insertMany(ROLE_CODES.map((code) => ({ code,
      permissionIds: ROLE_PERMISSIONS[code].map((permission) => permissionMap.get(permission)),
    })));
    const byCode = new Map(roles.map((role) => [role.code, role]));
    const password = 'Password123';
    await User.create({ username: 'admin', fullName: 'Admin', passwordHash: await bcrypt.hash(password, 4), roleId: byCode.get('ADMIN')._id });
    process.env.JWT_SECRET = 'single-role-http-test-only';
    const { default: app } = await import('../src/app.js');
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}/api`;
    async function request(path, { method = 'GET', body, token, cookie } = {}) {
      const response = await fetch(base + path, { method,
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(cookie ? { cookie } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
    }
    const admin = await request('/auth/login', { method: 'POST', body: { username: 'admin', password } });
    assert.equal(admin.status, 200);
    const token = admin.body.data.accessToken;
    const account = { username: 'person', fullName: 'Person', password, roleCode: 'SALES' };
    for (const invalid of [{ ...account, roles: ['SALES', 'OWNER'] }, { ...account, roleCode: ['SALES'] }]) {
      assert.equal((await request('/users', { method: 'POST', token, body: invalid })).status, 400);
    }
    const created = await request('/users', { method: 'POST', token, body: account });
    assert.equal(created.status, 201); assert.deepEqual(created.body.data.roles, ['sales']);
    const userId = created.body.data.id;
    const stored = await User.collection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    assert.equal(String(stored.roleId), String(byCode.get('SALES')._id));
    assert.equal(stored.roleIds, undefined);
    const login = await request('/auth/login', { method: 'POST', body: { username: 'person', password } });
    assert.equal(login.status, 200);
    const oldToken = login.body.data.accessToken;
    assert.deepEqual(jwt.decode(oldToken).roles, ['sales']);
    const me = await request('/auth/me', { token: oldToken });
    assert.deepEqual(me.body.data, login.body.data.user);
    const refresh = await request('/auth/refresh', { method: 'POST', cookie: login.cookie });
    assert.deepEqual(refresh.body.data.user, me.body.data);
    assert.equal((await request(`/users/${userId}`, { method: 'PUT', token, body: { roleCode: 'WAREHOUSE' } })).status, 200);
    const after = await request('/auth/me', { token: oldToken });
    assert.equal(after.body.data.role, 'warehouse');
    assert.ok(after.body.data.permissions.includes('goods_issue:post'));
    assert.ok(!after.body.data.permissions.includes('sales_order:create'));
    assert.equal((await request('/auth/refresh', { method: 'POST', cookie: login.cookie })).body.data.user.primaryRole, 'warehouse');
    const counts = await request('/roles', { token });
    assert.equal(counts.body.data.find((role) => role.code === 'WAREHOUSE').userCount, 1);
    assert.equal(counts.body.data.find((role) => role.code === 'SALES').userCount, 0);
    const filtered = await request('/users?role=warehouse', { token });
    assert.deepEqual(filtered.body.data.items.map((user) => user.id), [userId]);
    await User.collection.updateOne({ _id: stored._id }, { $unset: { roleId: '' }, $set: { roleIds: [byCode.get('OWNER')._id] } });
    assert.equal((await request('/auth/me', { token: oldToken })).status, 401);
    assert.equal((await request('/auth/refresh', { method: 'POST', cookie: login.cookie })).status, 401);
    assert.equal((await request('/auth/login', { method: 'POST', body: { username: 'person', password } })).status, 401);
  } finally {
    if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
    if (mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
