import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import * as models from '../src/models/runtime.js';
import userRouter from '../src/modules/users/user.routes.js';
import { updateUserSchema } from '../src/modules/users/user.validation.js';
import { updateUser } from '../src/modules/users/user.service.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';

// Mocked-model tests only: no database connection is opened.
const { User, Warehouse } = models;
const JWT_SECRET = process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026';
const actorId = 'a'.repeat(24);
const targetId = 'b'.repeat(24);
const warehouseA = 'c'.repeat(24);
const warehouseB = 'd'.repeat(24);

const role = (code, permissions) => ({ code, isActive: true, permissionIds: permissions.map((permission) => ({ code: permission, isActive: true })) });
const actor = (permissions) => ({ _id: actorId, isActive: true, warehouseIds: [], roleId: role('ADMIN', permissions) });
const target = (overrides = {}) => {
  const doc = {
    _id: targetId, username: 'staff', fullName: 'Nguyen Van A', email: 'old@example.test', phone: '0900000001',
    isActive: true, lockReason: undefined, warehouseIds: [warehouseA], roleId: role('SALES', ['user:read']),
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02'), ...overrides,
  };
  doc.save = mock.fn(async () => doc);
  return doc;
};

// A query that can be awaited directly or chained through populate().lean().
const query = (value) => ({
  populate: () => query(value),
  lean: async () => value,
  then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
});

function stubUsers(actorDoc, targetDoc) {
  return mock.method(User, 'findById', (id) => {
    if (String(id) === actorId) return query(actorDoc);
    if (String(id) === targetId) return query(targetDoc);
    return query(null);
  });
}

async function withServer(t) {
  const app = express();
  app.use(express.json());
  app.use('/api/users', userRouter);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}/api/users`;
  const token = jwt.sign({ userId: actorId }, JWT_SECRET, { expiresIn: '5m' });
  return (path, method, body) => fetch(`${base}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const targetLookups = () => User.findById.mock.calls.filter((call) => String(call.arguments[0]) === targetId).length;
const parse = (body) => updateUserSchema.safeParse({ params: { id: targetId }, body });

afterEach(() => mock.restoreAll());

test('profile schema accepts name and phone, rejects invalid values and any email (OTP flow only, 23/11/2026)', () => {
  assert.equal(parse({ fullName: 'Nguyen Van B', phone: '0900000002' }).success, true);
  assert.equal(parse({ fullName: 'B' }).success, false);
  assert.equal(parse({ email: 'new@example.test' }).success, false);
  assert.equal(parse({ email: 'not-an-email' }).success, false);
  assert.equal(parse({ phone: '9'.repeat(31) }).success, false);
});

test('profile schema rejects status fields instead of ignoring them', () => {
  assert.equal(parse({ isActive: false }).success, false);
  assert.equal(parse({ isActive: true }).success, false);
  assert.equal(parse({ fullName: 'Nguyen Van B', isActive: false }).success, false);
  assert.equal(parse({ lockReason: 'sneaky' }).success, false);
});

// Owner decision pending (tasks 7.2): documents the CURRENT contract, not a business decision.
test('profile schema currently also accepts roleCode and warehouseIds', () => {
  assert.equal(parse({ roleCode: 'WAREHOUSE' }).success, true);
  assert.equal(parse({ warehouseIds: [warehouseA, warehouseB] }).success, true);
  assert.equal(parse({ warehouseIds: [warehouseA, warehouseA] }).success, false);
});

test('updateUser saves new name and phone, ignores email and leaves status and lock reason unchanged', async () => {
  const lockedDoc = target({ isActive: false, lockReason: 'Nghi viec' });
  stubUsers(actor(['user:update']), lockedDoc);
  const result = await updateUser(targetId, { fullName: '  Nguyen Van B  ', email: 'new@example.test', phone: '0900000002' });
  assert.equal(lockedDoc.save.mock.callCount(), 1);
  assert.equal(lockedDoc.fullName, 'Nguyen Van B');
  assert.equal(lockedDoc.email, 'old@example.test');
  assert.equal(lockedDoc.phone, '0900000002');
  assert.equal(lockedDoc.isActive, false);
  assert.equal(lockedDoc.lockReason, 'Nghi viec');
  assert.equal(result.fullName, 'Nguyen Van B');
  assert.equal(result.email, 'old@example.test');
  assert.equal(result.phone, '0900000002');
  assert.equal(result.status, 'inactive');
  assert.equal(result.lockReason, 'Nghi viec');
});

test('updateUser on an active account keeps it active', async () => {
  const doc = target();
  stubUsers(actor(['user:update']), doc);
  const result = await updateUser(targetId, { fullName: 'Nguyen Van B' });
  assert.equal(doc.isActive, true);
  assert.equal(doc.lockReason, undefined);
  assert.equal(result.status, 'active');
});

test('updateUser does not touch status even when a caller passes it directly to the service', async () => {
  const doc = target();
  stubUsers(actor(['user:update']), doc);
  await updateUser(targetId, { fullName: 'Nguyen Van B', isActive: false, lockReason: 'x' });
  assert.equal(doc.isActive, true);
  assert.equal(doc.lockReason, undefined);
});

test('updateUser rejects an unknown account without saving', async () => {
  const doc = target();
  stubUsers(actor(['user:update']), doc);
  await assert.rejects(updateUser('f'.repeat(24), { fullName: 'Nguyen Van B' }), (error) => error.statusCode === 404);
  assert.equal(doc.save.mock.callCount(), 0);
});

test('PUT /users/:id with user:update saves the profile and returns the new values', async (t) => {
  const doc = target();
  stubUsers(actor(['user:read', 'user:update']), doc);
  const call = await withServer(t);
  const response = await call(`/${targetId}`, 'PUT', { fullName: 'Nguyen Van B', phone: '0900000002' });
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.equal(data.fullName, 'Nguyen Van B');
  assert.equal(data.email, 'old@example.test');
  assert.equal(data.phone, '0900000002');
  assert.equal(data.status, 'active');
  assert.equal(doc.save.mock.callCount(), 1);
});

test('PUT /users/:id with a status value is a validation error and nothing is saved', async (t) => {
  const doc = target();
  stubUsers(actor(['user:read', 'user:update']), doc);
  const call = await withServer(t);
  const response = await call(`/${targetId}`, 'PUT', { fullName: 'Nguyen Van B', isActive: false });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).success, false);
  assert.equal(targetLookups(), 0);
  assert.equal(doc.save.mock.callCount(), 0);
  assert.equal(doc.isActive, true);
  assert.equal(doc.fullName, 'Nguyen Van A');
});

test('PUT /users/:id with one invalid field saves no part of the profile', async (t) => {
  const doc = target();
  stubUsers(actor(['user:read', 'user:update']), doc);
  const call = await withServer(t);
  const response = await call(`/${targetId}`, 'PUT', { fullName: 'Nguyen Van B', email: 'not-an-email' });
  assert.equal(response.status, 400);
  assert.equal(targetLookups(), 0);
  assert.equal(doc.save.mock.callCount(), 0);
  assert.equal(doc.fullName, 'Nguyen Van A');
});

test('PUT /users/:id without user:update is forbidden and nothing is read or saved', async (t) => {
  const doc = target();
  stubUsers(actor(['user:read']), doc);
  const call = await withServer(t);
  const response = await call(`/${targetId}`, 'PUT', { fullName: 'Nguyen Van B' });
  assert.equal(response.status, 403);
  assert.equal(targetLookups(), 0);
  assert.equal(doc.save.mock.callCount(), 0);
  assert.equal(doc.fullName, 'Nguyen Van A');
});

test('a user without user:update can still read the account (read-only profile)', async (t) => {
  stubUsers(actor(['user:read']), target());
  const call = await withServer(t);
  const response = await call(`/${targetId}`, 'GET');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.fullName, 'Nguyen Van A');
});

test('role and warehouse changes through the profile update validate warehouses before saving', async () => {
  const doc = target();
  stubUsers(actor(['user:update']), doc);
  mock.method(Warehouse, 'countDocuments', async () => 1);
  await assert.rejects(updateUser(targetId, { warehouseIds: [warehouseA, warehouseB] }), (error) => error.statusCode === 400);
  assert.equal(doc.save.mock.callCount(), 0);
});
