import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import { Writable } from 'node:stream';
import app from '../src/app.js';
import * as m from '../src/models/index.js';
import { seedSalesFixtures } from '../test-support/sales-fixtures.js';
import { cloudinary } from '../src/config/cloudinary.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1WQAAAAASUVORK5CYII=', 'base64');

test('UC-47 HTTP upload, atomic create, scope, retries and quantity guards', {
  skip: !process.env.MONGODB_TEST_URI, timeout: 600000,
}, async () => {
  const dbName = `sep490_sales_create_${new mongoose.Types.ObjectId()}`;
  let server;
  const originalUpload = cloudinary.uploader.upload_stream;
  const originalDownload = cloudinary.utils.private_download_url;
  let uploadFails = false;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName, autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 5000 });
    await seedSalesFixtures();
    const users = {};
    for (const role of await m.Role.find()) users[role.code] = await m.User.findOne({ roleId: role._id });
    cloudinary.uploader.upload_stream = (options, callback) => {
      assert.equal(options.type, 'authenticated');
      return new Writable({ write(_chunk, _enc, next) { next(); }, final(next) {
        callback(uploadFails ? new Error('storage unavailable') : null,
          { public_id: `sep490/sales-source/${new mongoose.Types.ObjectId()}`, format: 'png' }); next();
      } });
    };
    cloudinary.utils.private_download_url = (key, format, options) => {
      assert.equal(options.type, 'authenticated'); assert.equal(format, 'png');
      return `https://example.test/private/${key}`;
    };
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    const call = async (method, path, data, role = 'SALES') => {
      const token = role && jwt.sign({ userId: String(users[role]._id) }, process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      if (data && !(data instanceof FormData)) headers['Content-Type'] = 'application/json';
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { method, headers, signal: AbortSignal.timeout(30000),
        body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined });
      return { status: response.status, headers: response.headers, body: await response.json() };
    };
    const form = (bytes = png, name = 'source.png') => { const f = new FormData(); f.append('file', new Blob([bytes], { type: 'image/png' }), name); return f; };
    assert.equal((await call('POST', '/sales-orders/source-evidence', form(), null)).status, 401);
    for (const role of ['OWNER', 'ACCOUNTANT', 'WAREHOUSE', 'ADMIN']) {
      assert.equal((await call('POST', '/sales-orders/source-evidence', form(), role)).status, 403);
      assert.equal((await call('POST', '/sales-orders', {}, role)).status, 403);
    }
    assert.equal((await call('POST', '/sales-orders/source-evidence', new FormData())).status, 400);
    assert.equal((await call('POST', '/sales-orders/source-evidence', form(Buffer.from('not an image')))).status, 400);
    assert.equal((await call('POST', '/sales-orders/source-evidence', form(Buffer.alloc(5 * 1024 * 1024 + 1)))).status, 400);
    uploadFails = true;
    assert.equal((await call('POST', '/sales-orders/source-evidence', form())).status, 502);
    uploadFails = false;
    const upload = await call('POST', '/sales-orders/source-evidence', form());
    assert.equal(upload.status, 201);
    const existing = await m.BusinessDocument.findOne({ documentKind: 'SALES_ORDER' });
    const sampleLine = await m.DocumentLine.findOne({ documentId: existing._id });
    const payload = { idempotencyKey: 'http-create', customerId: String(existing.header.customerId), neededOn: '2026-11-15T08:00:00+07:00', deliveryAddress: 'Test delivery address',
      evidenceReceipt: upload.body.data.receipt, source: { sourceSystem: 'PAPER', referenceNo: 'HTTP-SO-01' },
      lines: [{ sourceLineKey: '1', productId: String(sampleLine.productId), conversionId: String(sampleLine.conversionId), quantity: '2' }] };
    const unchanged = async () => JSON.stringify(await m.StockBalance.find().sort({ _id: 1 }).lean()) + JSON.stringify(await m.Reservation.find().sort({ _id: 1 }).lean());
    const before = await unchanged();
    const [first, second] = await Promise.all([call('POST', '/sales-orders', payload), call('POST', '/sales-orders', payload)]);
    assert.deepEqual([first.status, second.status].sort(), [200, 201]);
    assert.equal(first.body.data.id, second.body.data.id);
    const soId = first.body.data.id;
    assert.equal((await call('POST', '/sales-orders', { ...payload, deliveryAddress: 'changed' })).status, 409);
    assert.equal((await call('POST', '/sales-orders', { ...payload, idempotencyKey: 'different-key' })).status, 409);
    assert.equal(await m.BusinessOperation.countDocuments({ documentId: soId }), 1);
    assert.equal(await m.AuditEvent.countDocuments({ documentId: soId }), 1);
    assert.equal(await m.OutboxEvent.countDocuments({ documentId: soId, documentVersion: 1 }), 1);
    assert.equal(await m.PostingBatch.countDocuments({ documentId: soId }), 0);
    assert.equal(await unchanged(), before);
    const detail = await call('GET', `/sales-orders/${soId}`);
    assert.equal(detail.status, 200); assert.equal(detail.body.data.source.verifiedAt, null);
    assert.equal(detail.body.data.lines[0].enteredQty, '2');
    assert.equal(detail.body.data.outboundDeliveries.length, 0);
    const evidenceId = detail.body.data.evidence[0].id;
    const evidence = await call('GET', `/sales-orders/${soId}/evidence/${evidenceId}`);
    assert.equal(evidence.status, 200); assert.equal(evidence.headers.get('cache-control'), 'no-store');
    assert.equal((await call('GET', `/sales-orders/${existing._id}/evidence/${evidenceId}`)).status, 404);
    assert.equal((await call('GET', `/sales-orders/${soId}/evidence/${evidenceId}`, undefined, 'WAREHOUSE')).status, 404);
    const originalSales = users.SALES;
    users.SALES = await m.User.create({ username: 'second-sales', fullName: 'Second Sales', passwordHash: 'unused', roleId: originalSales.roleId });
    assert.equal((await call('GET', `/sales-orders/${soId}/evidence/${evidenceId}`)).status, 404);
    assert.equal((await call('POST', '/sales-orders', payload)).status, 403);
    users.SALES = originalSales;
    const invalid = [
      { ...payload, evidenceReceipt: 'invalid' },
      { ...payload, customerId: String(new mongoose.Types.ObjectId()) },
      { ...payload, lines: [{ ...payload.lines[0], productId: String(new mongoose.Types.ObjectId()) }] },
      { ...payload, lines: [payload.lines[0], payload.lines[0]] },
      { ...payload, lines: [{ ...payload.lines[0], quantity: '0' }] },
      { ...payload, lines: [{ ...payload.lines[0], quantity: 2 }] },
      { ...payload, lines: [{ ...payload.lines[0], quantity: '1.0000001' }] },
      { ...payload, lines: [{ ...payload.lines[0], quantity: '0.000001' }] },
    ];
    const count = await m.ExternalReference.countDocuments();
    for (const [index, body] of invalid.entries()) {
      const result = await call('POST', '/sales-orders', { ...body, idempotencyKey: `invalid-${index}`, source: { ...body.source, referenceNo: `INVALID-${index}` } });
      assert.equal(result.status, 400, JSON.stringify(result));
    }
    assert.equal(await m.ExternalReference.countDocuments(), count);
    assert.equal(await unchanged(), before);
    const conversion = await m.ProductUomVersion.findById(sampleLine.conversionId);
    await m.ProductUomVersion.create({ productId: conversion.productId, uomId: conversion.uomId, version: conversion.version + 10, basePerUnit: '2', validFrom: new Date() });
    assert.equal((await call('POST', '/sales-orders', { ...payload, idempotencyKey: 'stale-uom', source: { ...payload.source, referenceNo: 'STALE-UOM' } })).status, 409);
    assert.equal(await m.ExternalReference.countDocuments(), count);
  } finally {
    cloudinary.uploader.upload_stream = originalUpload;
    cloudinary.utils.private_download_url = originalDownload;
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
