import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import app from '../src/app.js';
import * as m from '../src/models/index.js';
import { seedSalesFixtures } from '../test-support/sales-fixtures.js';

test('FE-06 iteration 1 reads: source chain, FD net fulfilment, roles and immutable GET', {
  skip: !process.env.MONGODB_TEST_URI, timeout: 600000,
}, async () => {
  const dbName = `sep490_sales_iteration1_${new mongoose.Types.ObjectId()}`;
  let server;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName, autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 5000 });
    await seedSalesFixtures();
    const roles = await m.Role.find().lean();
    const users = {};
    for (const role of roles) users[role.code] = await m.User.findOne({ roleId: role._id }).lean();
    const orders = await m.BusinessDocument.find({ documentKind: 'SALES_ORDER' }).lean();
    const completed = orders.find((order) => order.workflowStatus === 'COMPLETED');
    const failed = orders.find((order) => order.workflowStatus === 'IN_PROGRESS');
    assert.ok(completed); assert.ok(failed);
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    const call = async (path, code = 'OWNER') => {
      const token = code && jwt.sign({ userId: String(users[code]._id) }, process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026');
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(30000) });
      return { status: response.status, body: await response.json() };
    };
    const before = JSON.stringify(await m.BusinessDocument.find().sort({ _id: 1 }).lean());
    const balanceBefore = JSON.stringify(await m.StockBalance.find().sort({ _id: 1 }).lean());
    assert.equal((await call('/outbound-deliveries', null)).status, 401);
    assert.equal((await call('/outbound-deliveries', 'ADMIN')).status, 403);
    assert.equal((await call('/outbound-deliveries?limit=999')).status, 400);
    assert.equal((await call('/sales-orders/bad')).status, 400);
    const list = await call('/outbound-deliveries');
    assert.equal(list.status, 200, JSON.stringify(list.body));
    assert.ok(list.body.data.total > 0);
    const literalSearch = await call('/outbound-deliveries?q=.*');
    assert.equal(literalSearch.body.data.total, 0);
    assert.equal((await call(`/outbound-deliveries?q=${encodeURIComponent(list.body.data.items[0].documentNo)}`)).body.data.total, 1);
    assert.equal((await call('/outbound-deliveries?page=999')).body.data.items.length, 0);
    const done = await call(`/sales-orders/${completed._id}`);
    assert.equal(done.status, 200, JSON.stringify(done.body));
    assert.equal(done.body.data.outboundDeliveries[0].lines[0].deliveredQtyBase, '12');
    assert.equal(done.body.data.outboundDeliveries[0].lines[0].grossIssuedQtyBase, '12');
    assert.equal(done.body.data.paymentConfirmations.length, 1);
    assert.equal(JSON.stringify(done.body).includes('objectKey'), false);
    const fd = await call(`/sales-orders/${failed._id}`, 'SALES');
    assert.equal(fd.status, 200, JSON.stringify(fd.body));
    const original = fd.body.data.outboundDeliveries.find((delivery) => delivery.lines[0].grossIssuedQtyBase === '10');
    assert.ok(original);
    assert.equal(original.lines[0].returnedFailedDeliveryQtyBase, '4');
    assert.equal(original.lines[0].netIssuedQtyBase, '6');
    assert.equal(original.commitmentTransfers[0].qtyBase, '4');
    assert.equal(fd.body.data.reopenings[0].qtyBase, '4');
    assert.equal((await call(`/outbound-deliveries/${original.id}`, 'ACCOUNTANT')).status, 200);
    assert.equal((await call(`/outbound-deliveries/${completed._id}`)).status, 404);
    const originalWarehouses = users.WAREHOUSE.warehouseIds;
    await m.User.updateOne({ _id: users.WAREHOUSE._id }, { warehouseIds: [] });
    assert.equal((await call(`/sales-orders/${completed._id}`, 'WAREHOUSE')).status, 404);
    assert.equal((await call(`/outbound-deliveries/${original.id}`, 'WAREHOUSE')).status, 404);
    assert.equal((await call('/outbound-deliveries', 'WAREHOUSE')).body.data.total, 0);
    await m.User.updateOne({ _id: users.WAREHOUSE._id }, { warehouseIds: originalWarehouses });
    const warehouseDetail = await call(`/sales-orders/${failed._id}`, 'WAREHOUSE');
    assert.equal(warehouseDetail.status, 200);
    assert.equal(warehouseDetail.body.data.source, null);
    assert.deepEqual(warehouseDetail.body.data.evidence, []);
    assert.equal(Object.hasOwn(warehouseDetail.body.data.lines[0], 'externalLineId'), false);
    const salesId = users.SALES._id;
    users.SALES = await m.User.create({ username: 'other-sales', fullName: 'Other Sales', passwordHash: 'test', roleId: users.SALES.roleId });
    assert.equal((await call(`/sales-orders/${completed._id}`, 'SALES')).status, 404);
    assert.equal((await call(`/outbound-deliveries/${original.id}`, 'SALES')).status, 404);
    assert.equal((await call('/outbound-deliveries', 'SALES')).body.data.total, 0);
    assert.equal(JSON.stringify(await m.BusinessDocument.find().sort({ _id: 1 }).lean()), before);
    assert.equal(JSON.stringify(await m.StockBalance.find().sort({ _id: 1 }).lean()), balanceBefore);
    // A WIR can execute in several warehouses: one visible OD must not expose
    // other SO lines belonging only to the other warehouse's execution.
    const foreignWarehouse = await m.Warehouse.create({ code: 'OTHER-SCOPE', name: 'Other scope' });
    const wir = await m.BusinessDocument.findById(original.issueRequest.id);
    const soLine = await m.DocumentLine.findOne({ documentId: failed._id });
    const hiddenSoId = new mongoose.Types.ObjectId();
    const hiddenWirId = new mongoose.Types.ObjectId();
    const hiddenSourceId = new mongoose.Types.ObjectId();
    await m.DocumentLine.collection.insertMany([
      { ...soLine.toObject(), _id: hiddenSoId, lineNo: 99, details: { ...soLine.details.toObject(), externalLineId: hiddenSourceId } },
      { ...soLine.toObject(), _id: hiddenWirId, documentId: wir._id, lineNo: 99, lineKind: 'ISSUE_REQUEST',
        details: { salesOrderLineId: hiddenSoId, releaseKey: 'hidden-test-line' } },
    ]);
    await m.BusinessDocument.updateOne({ _id: wir._id, documentKind: 'ISSUE_REQUEST' }, { $set: { 'header.requestedWarehouseId': foreignWarehouse._id } });
    const scoped = await call(`/sales-orders/${failed._id}`, 'WAREHOUSE');
    assert.equal(scoped.status, 200);
    assert.equal(scoped.body.data.lines.some((line) => line.id === String(hiddenSoId)), false);
    // A posted GI reversal cancels the original issue quantity even though its
    // immutable document remains POSTED.
    const batch = await m.PostingBatch.findOne({ documentId: original.goodsIssues[0].id });
    await m.PostingBatch.create({ documentId: new mongoose.Types.ObjectId(), operation: 'REVERSE', operationKey: 'test-reverse', idempotencyKey: 'test-reverse', payloadHash: 'a'.repeat(64), postedBy: salesId, reversalOf: batch._id });
    const reversed = await call(`/outbound-deliveries/${original.id}`);
    assert.equal(reversed.body.data.lines[0].grossIssuedQtyBase, '0');
    const actor = await m.User.findById(salesId).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
    const { createSalesOrder } = await import('../src/modules/sales-orders/sales-create.service.js');
    const receipt = jwt.sign({ actorId: String(salesId), objectKey: 'test/private-source', sha256: 'b'.repeat(64), mediaType: 'image/png' },
      process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026', { audience: 'sales-source-evidence', expiresIn: '1h' });
    const payload = { idempotencyKey: 'create-test', customerId: String(failed.header.customerId), neededOn: new Date().toISOString(), deliveryAddress: 'Test address',
      evidenceReceipt: receipt, source: { sourceSystem: 'PAPER', referenceNo: 'NEW-SOURCE' },
      lines: [{ sourceLineKey: '1', productId: String(soLine.productId), conversionId: String(soLine.conversionId), quantity: '2' }] };
    const saved = await createSalesOrder(actor, payload);
    assert.equal(saved.replayed, false);
    assert.equal((await createSalesOrder(actor, payload)).id, saved.id);
    assert.equal(await m.OutboxEvent.countDocuments({ documentId: saved.id, eventType: 'SALES_ORDER_SAVED' }), 1);
    assert.equal(await m.DocumentLine.countDocuments({ documentId: saved.id }), 1);
    assert.equal(await m.PostingBatch.countDocuments({ documentId: saved.id }), 0);
    await assert.rejects(createSalesOrder(actor, { ...payload, deliveryAddress: 'changed' }), { statusCode: 409 });
    await assert.rejects(createSalesOrder(actor, { ...payload, idempotencyKey: 'duplicate-source' }), { statusCode: 409 });
    const refsBefore = await m.ExternalReference.countDocuments();
    await assert.rejects(createSalesOrder(actor, { ...payload, idempotencyKey: 'invalid-product', source: { ...payload.source, referenceNo: 'ROLLBACK' },
      lines: [{ ...payload.lines[0], productId: String(new mongoose.Types.ObjectId()) }] }));
    assert.equal(await m.ExternalReference.countDocuments(), refsBefore);
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
