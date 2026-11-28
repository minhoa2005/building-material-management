import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import * as models from '../src/models/runtime.js';
import { createApp } from '../src/app.js';
import { discoverRoutes } from '../src/shared/utils/routeRegistry.js';
import { normalizePath, errorFingerprint } from '../src/shared/utils/errorLog.js';
import { initialEmailDelivery, notificationEmailEnabled, processNotificationEmails } from '../src/modules/notifications/email.js';
import { evaluateThresholds } from '../src/modules/stock-alerts/stock-alert.service.js';

// Mocked-model tests for the 23/11/2026 administration features. No database or SMTP connection is opened.
const { User, AuditLog, ApiEndpoint, Product, Notification, AppSetting } = models;
const JWT_SECRET = process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026';
const ownerId = 'a'.repeat(24);
const adminId = 'b'.repeat(24);
const salesId = 'c'.repeat(24);

const role = (code, permissions) => ({ code, isActive: true, permissionIds: permissions.map((p) => ({ code: p, isActive: true })) });
const users = {
  [ownerId]: { _id: ownerId, username: 'owner', fullName: 'Chủ', isActive: true, warehouseIds: [], roleId: role('OWNER', ['dashboard:read', 'audit_log:read', 'product:read', 'inventory:read', 'system_setting:read']) },
  [adminId]: { _id: adminId, username: 'admin', fullName: 'Quản trị', isActive: true, warehouseIds: [], roleId: role('ADMIN', ['user:read', 'api_catalogue:read', 'api_catalogue:update', 'system_monitor:read', 'audit_log:read', 'system_setting:read', 'system_setting:update']) },
  [salesId]: { _id: salesId, username: 'sales', fullName: 'Bán hàng', isActive: true, warehouseIds: [], roleId: role('SALES', ['product:read']) },
};
const query = (value) => ({
  select: () => query(value), session: () => query(value), populate: () => query(value), sort: () => query(value), limit: () => query(value), skip: () => query(value),
  lean: async () => value, then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
});

function stubAuth() {
  mock.method(User, 'findById', (id) => query(users[String(id)] ?? null));
  mock.method(User, 'find', () => query([]));
  mock.method(AuditLog.prototype, 'save', async function save() { return this; });
}

async function api(t) {
  const app = createApp({ logRequests: false });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  return (as, path, method = 'GET', body) => fetch(base + path, {
    method, headers: { authorization: `Bearer ${jwt.sign({ userId: as }, JWT_SECRET, { expiresIn: '5m' })}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => ({ status: r.status, body: await r.json() }));
}

afterEach(() => mock.restoreAll());

test('quick search labels document status from the status code, falling back to the code', async (t) => {
  stubAuth();
  users[salesId].roleId.permissionIds.push({ code: 'replenishment_request:read', isActive: true });
  t.after(() => users[salesId].roleId.permissionIds.pop());
  mock.method(Product, 'find', () => query([]));
  mock.method(models.ReplenishmentRequest, 'find', () => query([
    { _id: 'YCBS-KHO1-261125-000001', documentNo: 'YCBS-KHO1-261125-000001', workflowStatus: 'SUBMITTED' },
    { _id: 'YCBS-KHO1-261125-000002', documentNo: 'YCBS-KHO1-261125-000002', workflowStatus: 'UNKNOWN_STATUS' },
  ]));
  const res = await (await api(t))(salesId, '/search?q=YCBS');
  const group = res.body.data.groups.find((g) => g.key === 'replenishment_requests');
  assert.deepEqual(group.items.map((i) => i.subtitle), ['Chờ duyệt', 'UNKNOWN_STATUS']);
});
