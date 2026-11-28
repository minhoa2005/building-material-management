import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Notification, Permission, Product, Role, User } from '../src/models/runtime.js';

test('marks all visible unread notifications across pages for the authenticated recipient', {
  skip: process.env.RUN_NOTIFICATION_TESTS !== '1',
}, async t => {
  const secret = process.env.JWT_SECRET = 'notification-integration-test-secret';
  const { createApp } = await import('../src/app.js');
  const id = () => new mongoose.Types.ObjectId();
  await mongoose.connect('mongodb://127.0.0.1:27017/notifications_test_' + id());
  t.after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  const warehouse = id();
  const permissions = await Permission.insertMany(['notification:read', 'notification:mark_read', 'inventory:read']
    .map(code => ({ code, name: code })));
  const makeUser = async (code, grants) => {
    const role = await Role.create({ code, name: code, permissionIds: grants.map(permission => permission._id) });
    return User.create({ username: code.toLowerCase(), fullName: code, passwordHash: 'unused', roleId: role._id, warehouseIds: [warehouse] });
  };
  const recipient = await makeUser('WAREHOUSE', permissions);
  const readOnly = await makeUser('VIEWER', [permissions[0], permissions[2]]);
  const product = await Product.create({
    sku: 'TILE-1', manufacturerCode: 'TEST', name: 'Tile', categoryId: id(), baseUnit: 'PIECE',
    lengthMm: '600', widthMm: '600', heightMm: '10', color: 'White',
  });
  const notice = (key, overrides = {}) => ({
    recipientId: recipient._id, type: 'LOW_STOCK', eventKey: key, dedupKey: key,
    sourceType: 'products', sourceId: product._id, sourceVersion: 1, warehouseIds: [warehouse],
    title: 'Low stock', message: 'Restock tile', occurredAt: new Date(), ...overrides,
  });
  const firstReadAt = new Date('2026-11-20T08:00:00Z');
  const [alreadyRead, ...excluded] = await Notification.insertMany([
    notice('read', { readAt: firstReadAt }),
    notice('other-recipient', { recipientId: readOnly._id }),
    notice('archived', { archivedAt: firstReadAt }),
    notice('outside-warehouse', { warehouseIds: [id()] }),
    notice('missing-source', { sourceId: id() }),
  ]);
  await Notification.insertMany(Array.from({ length: 16 }, (_, i) => notice('unread-' + i)));

  const server = createApp({ logRequests: false }).listen(0, '127.0.0.1');
  t.after(() => new Promise(resolve => server.close(resolve)));
  await once(server, 'listening');
  const request = (user, path, method = 'GET') => fetch(
    'http://127.0.0.1:' + server.address().port + '/api/notifications' + path,
    { method, headers: { authorization: 'Bearer ' + jwt.sign({ userId: String(user._id) }, secret) } },
  );
  const readAll = user => request(user, '/read-all', 'POST');
  const unreadCount = async user => (await (await request(user, '/unread-count')).json()).data.count;

  assert.equal(await unreadCount(recipient), 16);
  assert.equal((await readAll(readOnly)).status, 403);
  const result = await readAll(recipient);
  assert.equal(result.status, 200);
  assert.equal((await result.json()).data.markedCount, 16);
  assert.equal(await unreadCount(recipient), 0);
  assert.equal((await (await request(recipient, '?unread=true')).json()).data.total, 0);
  assert.equal((await (await readAll(recipient)).json()).data.markedCount, 0);
  assert.equal(+(await Notification.findById(alreadyRead._id)).readAt, +firstReadAt);
  assert.equal(await Notification.countDocuments({ _id: { $in: excluded.map(item => item._id) }, readAt: null }), excluded.length);
});
