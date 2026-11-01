import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import * as m from '../src/models/index.js';
import app from '../src/app.js';

test('UC-38/39 HTTP read scope, posted quantities and side-effect-free detail', { skip: !process.env.MONGODB_TEST_URI, timeout: 120000 }, async () => {
  const oid = () => new mongoose.Types.ObjectId();
  const dbName = `sep490_transfer_read_${oid()}`;
  let server;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName, autoCreate: false, autoIndex: false, serverSelectionTimeoutMS: 5000 });
    const permission = await m.Permission.create({ code: 'stock_transfer:read' });
    const users = {};
    const source = await m.Warehouse.create({ code: 'A', name: 'Source' });
    const destination = await m.Warehouse.create({ code: 'B', name: 'Destination' });
    for (const code of ['OWNER', 'ACCOUNTANT', 'WAREHOUSE', 'SALES', 'ADMIN']) {
      const role = await m.Role.create({ code, permissionIds: [permission._id] });
      users[code] = await m.User.create({ username: code, fullName: code, passwordHash: 'test', roleId: role._id, warehouseIds: [source._id] });
    }
    const request = await m.BusinessDocument.create({ documentKind: 'TRANSFER_REQUEST', documentNo: 'TR-1', workflowStatus: 'APPROVED', createdBy: users.WAREHOUSE._id,
      header: { sourceWarehouseId: source._id, destinationWarehouseId: destination._id } });
    const productId = oid(), lotId = oid(), conversionId = oid();
    const line = (documentId, qtyBase, extra = {}) => ({ documentId, lineNo: 1, productId, lotId, conversionId, enteredQty: qtyBase, conversionSnapshot: '1', qtyBase, productNameSnapshot: 'Tile', ...extra });
    const requestLine = await m.DocumentLine.create(line(request._id, '100'));
    await m.Approval.create({ documentId: request._id, documentVersion: 1, decisionKind: 'TRANSFER_APPROVAL', decision: 'APPROVE', requestedBy: users.WAREHOUSE._id, decidedBy: users.OWNER._id, reason: 'Approved', lines: [{ lineId: requestLine._id, approvedQty: '100', outcome: 'APPROVE' }] });
    const dispatch = await m.BusinessDocument.create({ documentKind: 'TRANSFER_DISPATCH', documentNo: 'TD-1', workflowStatus: 'POSTED', createdBy: users.WAREHOUSE._id,
      header: { requestId: request._id, dispatchedBy: users.WAREHOUSE._id, dispatchedAt: new Date() } });
    const dispatchLine = await m.DocumentLine.create(line(dispatch._id, '60'));
    const receipt = await m.BusinessDocument.create({ documentKind: 'MWTR', documentNo: 'MWTR-1', workflowStatus: 'POSTED', createdBy: users.WAREHOUSE._id,
      header: { dispatchId: dispatch._id, receivedBy: oid(), receivedAt: new Date() } });
    await m.DocumentLine.create(line(receipt._id, '55', { lineKind: 'TRANSFER_RECEIPT', details: { dispatchLineId: dispatchLine._id, qualityCode: 'GOOD' } }));
    const draft = await m.BusinessDocument.create({ documentKind: 'TRANSFER_DISPATCH', documentNo: 'TD-DRAFT', workflowStatus: 'DRAFT', createdBy: users.WAREHOUSE._id,
      header: { requestId: request._id, dispatchedBy: users.WAREHOUSE._id, dispatchedAt: new Date() } });
    await m.DocumentLine.create(line(draft._id, '40'));
    const transit = await m.StockAccount.create({ transitDispatchLineId: dispatchLine._id });
    await m.StockBalance.create({ accountId: transit._id, lotId, qualityCode: 'GOOD', ownerPartyId: oid(), qtyBase: '5' });
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    const url = `http://127.0.0.1:${server.address().port}/api/warehouse-transfers`;
    const call = async (path, code) => {
      const token = code && jwt.sign({ userId: String(users[code]._id) }, process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026');
      const response = await fetch(`${url}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      return { status: response.status, body: await response.json() };
    };
    assert.equal((await call('', null)).status, 401);
    assert.equal((await call('', 'ADMIN')).status, 403);
    assert.equal((await call('?limit=999', 'OWNER')).status, 400);
    assert.equal((await call('/invalid', 'OWNER')).status, 400);
    for (const code of ['OWNER', 'ACCOUNTANT', 'WAREHOUSE']) {
      const result = await call('', code); assert.equal(result.status, 200);
      assert.equal(result.body.data.total, 1);
      assert.equal(result.body.data.items[0].dispatchedQtyBase, '60');
      assert.equal(result.body.data.items[0].receivedQtyBase, '55');
    }
    const before = JSON.stringify(await m.BusinessDocument.findById(request._id).lean());
    const detail = await call(`/${request._id}`, 'WAREHOUSE');
    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.lines[0].approvedQtyBase, '100');
    assert.equal(detail.body.data.inTransitQtyBase, '5');
    assert.equal(detail.body.data.status, 'APPROVED');
    assert.equal(detail.body.data.dispatches.length, 2);
    assert.equal(detail.body.data.receipts.length, 1);
    assert.equal(JSON.stringify(await m.BusinessDocument.findById(request._id).lean()), before);
    assert.equal(await m.AuditEvent.countDocuments(), 0);
    assert.equal(await m.PostingBatch.countDocuments(), 0);
    assert.equal((await call(`/${dispatch._id}`, 'OWNER')).status, 404);
    assert.equal((await call(`/${request._id}`, 'SALES')).status, 404);
    assert.equal((await call('', 'SALES')).body.data.total, 0);
    const order = await m.BusinessDocument.create({ documentKind: 'SALES_ORDER', documentNo: 'SO-1', createdBy: users.SALES._id,
      header: { externalReferenceId: oid(), customerId: oid(), neededOn: new Date(), deliveryAddressSnapshot: 'Test address' } });
    const salesLine = await m.DocumentLine.create(line(order._id, '100', { lineKind: 'SALES_ORDER', details: { externalReferenceId: order.header.externalReferenceId, externalLineId: oid() } }));
    await m.DemandSupplyAllocation.create({ demandLineId: salesLine._id, supplyLineId: requestLine._id, qtyBase: '100', status: 'PLANNED' });
    const salesDetail = await call(`/${request._id}`, 'SALES');
    assert.equal(salesDetail.status, 200);
    assert.equal(salesDetail.body.data.dispatchedQtyBase, '60');
    assert.equal(salesDetail.body.data.evidence, undefined);
    assert.equal(salesDetail.body.data.reason, undefined);
    await m.DocumentLine.create(line(request._id, '5', { lineNo: 2 }));
    const mixed = await call(`/${request._id}`, 'SALES');
    assert.equal(mixed.status, 200);
    assert.equal(mixed.body.data.requestedQtyBase, '105');
    assert.equal((await call('', 'SALES')).body.data.total, 1);
    for (const field of ['reason', 'createdBy', 'lines', 'dispatches', 'receipts', 'handovers', 'lineLinks', 'differences', 'tasks', 'evidence']) {
      assert.equal(mixed.body.data[field], undefined, `Sales must not receive ${field}`);
    }
    await m.DemandSupplyAllocation.updateMany({ demandLineId: salesLine._id }, { status: 'CANCELLED' });
    assert.equal((await call(`/${request._id}`, 'SALES')).status, 404);
    assert.equal((await call('?status=DRAFT', 'OWNER')).body.data.total, 0);
    assert.equal((await call('?page=2&limit=1', 'OWNER')).body.data.items.length, 0);
    await m.User.updateOne({ _id: users.WAREHOUSE._id }, { warehouseIds: [] });
    assert.equal((await call(`/${request._id}`, 'WAREHOUSE')).status, 404);
    assert.equal((await call('', 'WAREHOUSE')).body.data.total, 0);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
