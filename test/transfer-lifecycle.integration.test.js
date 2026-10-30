import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import app from '../src/app.js';
import * as m from '../src/models/index.js';
import * as service from '../src/modules/transfers/transfer-write.service.js';
import { getTransfer } from '../src/modules/transfers/transfer-read.service.js';
const id = (v) => String(v._id ?? v);
const oid = () => new mongoose.Types.ObjectId();
test('BF04 approved request -> automatic picking TO -> transit -> receipt -> automatic putaway TO -> close', {
  skip: !process.env.MONGODB_TEST_URI, timeout: 180000,
}, async () => {
  const dbName = `sep490_bf04_${oid()}`;
  let server;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName, autoCreate: false, autoIndex: false, serverSelectionTimeoutMS: 5000 });
    for (const model of [m.BusinessDocument, m.DocumentLine, m.BusinessOperation, m.AuditEvent, m.Approval,
      m.DocumentLink, m.LineLink, m.StockAccount, m.StockBalance, m.StockMovement, m.PostingBatch]) {
      await model.createCollection(); await model.createIndexes();
    }
    const permissions = await m.Permission.insertMany(['create', 'approve', 'dispatch', 'receive', 'read'].map((v) => ({ code: `stock_transfer:${v}` })));
    const wr = await m.Role.create({ code: 'WAREHOUSE', permissionIds: permissions.map((v) => v._id) });
    const ownerRole = await m.Role.create({ code: 'OWNER', permissionIds: permissions.map((v) => v._id) });
    const warehouses = await m.Warehouse.insertMany([{ code: 'A', name: 'Source' }, { code: 'B', name: 'Destination' }]);
    const source = await m.Location.create({ warehouseId: warehouses[0]._id, code: 'A1', kind: 'STORAGE', allocatable: true });
    const staging = await m.Location.create({ warehouseId: warehouses[0]._id, code: 'A2', kind: 'STAGING' });
    const receiving = await m.Location.create({ warehouseId: warehouses[1]._id, code: 'B1', kind: 'RECEIVING' });
    const storage = await m.Location.create({ warehouseId: warehouses[1]._id, code: 'B2', kind: 'STORAGE', allocatable: true });
    const quarantine = await m.Location.create({ warehouseId: warehouses[1]._id, code: 'B3', kind: 'QUARANTINE' });
    const user = async (name, role, warehouse) => {
      const raw = await m.User.create({ username: name, fullName: name, passwordHash: 'test-only', roleId: role._id, warehouseIds: warehouse ? [warehouse._id] : [] });
      return m.User.findById(raw._id).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
    };
    const sender = await user('sender', wr, warehouses[0]);
    const receiver = await user('receiver', wr, warehouses[1]);
    const owner = await user('owner', ownerRole);
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const post = async (actor, path, body) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/warehouse-transfers${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json',
          ...(actor && { Authorization: `Bearer ${jwt.sign({ userId: id(actor) }, process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026')}` }) },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    };
    const uom = await m.Uom.create({ code: 'PIECE', name: 'Piece' });
    const product = await m.Product.create({ sku: 'P1', name: 'Tile', baseUomId: uom._id });
    const conversion = await m.ProductUomVersion.create({ productId: product._id, uomId: uom._id, basePerUnit: '1', version: 1, validFrom: new Date('2020-01-01') });
    const lot = await m.Lot.create({ productId: product._id, manufacturerLot: 'L1', tone: 'A', calibre: '600', identificationStatus: 'VERIFIED' });
    const store = await m.Party.create({ code: 'STORE', name: 'Store', kind: 'STORE' });
    const account = await m.StockAccount.create({ locationId: source._id });
    const balance = await m.StockBalance.create({ accountId: account._id, lotId: lot._id, ownerPartyId: store._id, qualityCode: 'GOOD', qtyBase: '100' });
    const requestInput = { idempotencyKey: 'request', sourceWarehouseId: id(warehouses[0]), destinationWarehouseId: id(warehouses[1]), reason: 'Move tiles',
      lines: [{ productId: id(product), conversionId: id(conversion), enteredQty: '20' }] };
    assert.equal((await post(null, '/', requestInput)).status, 401);
    assert.equal((await post(sender, '/', { ...requestInput, unexpected: true })).status, 400);
    const created = await post(sender, '/', requestInput);
    assert.equal(created.status, 200, JSON.stringify(created.body));
    const request = created.body.data;
    assert.equal((await service.createRequest(sender, requestInput)).replayed, true);
    await assert.rejects(() => service.reviewRequest(sender, request.id, { expectedVersion: 1, idempotencyKey: 'bad-approval', decision: 'APPROVE', reason: 'Approved' }), (e) => e.statusCode === 403);
    await service.reviewRequest(owner, request.id, { expectedVersion: 1, idempotencyKey: 'approval', decision: 'APPROVE', reason: 'Approved' });
    const requestLine = await m.DocumentLine.findOne({ documentId: request.id });
    const outbound = await service.createDispatch(sender, request.id, { expectedVersion: 2, idempotencyKey: 'dispatch',
      lines: [{ requestLineId: id(requestLine), sourceBalanceId: id(balance), stagingLocationId: id(staging), qtyBase: '20' }] });
    const task = await service.createRequirement(sender, outbound.id, { expectedVersion: 1, idempotencyKey: 'pick' });
    assert.equal((await m.StockBalance.findById(balance._id)).qtyBase.toString(), '100');
    await service.confirmTask(sender, task.id, { expectedVersion: 1, idempotencyKey: 'confirm-pick' });
    assert.equal((await m.StockBalance.findById(balance._id)).qtyBase.toString(), '80');
    assert.equal((await service.confirmTask(sender, task.id, { expectedVersion: 1, idempotencyKey: 'confirm-pick' })).replayed, true);
    await assert.rejects(() => service.closeRequest(receiver, request.id, { expectedVersion: 2, idempotencyKey: 'early-close' }), (e) => e.statusCode === 409);
    const outboundLine = await m.DocumentLine.findOne({ documentId: outbound.id });
    const beforeInvalid = await m.StockMovement.countDocuments();
    await assert.rejects(() => service.receiveTransfer(receiver, outbound.id, { expectedVersion: 2, idempotencyKey: 'overreceipt', lines: [
      { dispatchLineId: id(outboundLine), locationId: id(receiving), qtyBase: '21', qualityCode: 'GOOD' },
    ] }), (e) => e.statusCode === 409);
    assert.equal(await m.StockMovement.countDocuments(), beforeInvalid);
    assert.equal(await m.BusinessDocument.countDocuments({ documentKind: 'MWTR' }), 0);
    const receipt = await service.receiveTransfer(receiver, outbound.id, { expectedVersion: 2, idempotencyKey: 'receipt', lines: [
      { dispatchLineId: id(outboundLine), locationId: id(receiving), qtyBase: '18', qualityCode: 'GOOD' },
      { dispatchLineId: id(outboundLine), locationId: id(quarantine), qtyBase: '2', qualityCode: 'DAMAGED', damageReason: 'Broken during transport' },
    ] });
    const good = await m.DocumentLine.findOne({ documentId: receipt.id, 'details.qualityCode': 'GOOD' });
    await assert.rejects(() => service.closeRequest(receiver, request.id, { expectedVersion: 2, idempotencyKey: 'before-putaway' }), (e) => e.statusCode === 409);
    const putaway = await service.createRequirement(receiver, receipt.id, { expectedVersion: 1, idempotencyKey: 'putaway', destinations: [{ receiptLineId: id(good), locationId: id(storage) }] });
    await service.confirmTask(receiver, putaway.id, { expectedVersion: 1, idempotencyKey: 'confirm-putaway' });
    const closed = await service.closeRequest(receiver, request.id, { expectedVersion: 2, idempotencyKey: 'close' });
    assert.equal(closed.status, 'COMPLETED');
    assert.equal(await m.AuditEvent.countDocuments({ action: 'TRANSFER_DAMAGE_REPORT' }), 1);
    const balances = await m.StockBalance.find({ lotId: lot._id });
    assert.equal(balances.reduce((total, row) => total + Number(row.qtyBase.toString()), 0), 100);
    const detail = await getTransfer(receiver, request.id);
    assert.equal(detail.tasks.length, 2);
    assert.equal(detail.internalRequirements.length, 2);
    assert.equal(detail.lines[0].approvedQtyBase, '20');
    assert.equal(detail.dispatches[0].lines[0].requestLineId, id(requestLine));
    const senderWithoutWarehouse = sender.toObject(); senderWithoutWarehouse.warehouseIds = [];
    await assert.rejects(() => service.confirmTask(senderWithoutWarehouse, task.id, { expectedVersion: 1, idempotencyKey: 'confirm-pick' }), (e) => e.statusCode === 403);

    // A second request is fulfilled by two dispatches; an all-damaged receipt is already put away in quarantine.
    const split = await service.createRequest(sender, { ...requestInput, idempotencyKey: 'split-request', lines: [{ ...requestInput.lines[0], enteredQty: '4' }] });
    await service.reviewRequest(owner, split.id, { expectedVersion: 1, idempotencyKey: 'split-approve', decision: 'APPROVE', reason: 'Approved' });
    const splitLine = await m.DocumentLine.findOne({ documentId: split.id });
    for (let n = 0; n < 2; n++) {
      const out = await service.createDispatch(sender, split.id, { expectedVersion: 2, idempotencyKey: `split-out-${n}`,
        lines: [{ requestLineId: id(splitLine), sourceBalanceId: id(balance), stagingLocationId: id(staging), qtyBase: '2' }] });
      const pick = await service.createRequirement(sender, out.id, { expectedVersion: 1, idempotencyKey: `split-pick-${n}` });
      const confirmed = await post(sender, `/tasks/${pick.id}/confirm`, { expectedVersion: 1, idempotencyKey: `split-confirm-${n}` });
      assert.equal(confirmed.status, 200, JSON.stringify(confirmed.body));
      const outLine = await m.DocumentLine.findOne({ documentId: out.id });
      const received = await service.receiveTransfer(receiver, out.id, { expectedVersion: 2, idempotencyKey: `split-receive-${n}`, lines: [
        { dispatchLineId: id(outLine), locationId: id(quarantine), qtyBase: '2', qualityCode: 'DAMAGED', damageReason: 'Cracked' },
      ] });
      const done = await service.createRequirement(receiver, received.id, { expectedVersion: 1, idempotencyKey: `split-putaway-${n}` });
      assert.equal(done.status, 'CONFIRMED');
      if (n === 0) await assert.rejects(() => service.closeRequest(receiver, split.id, { expectedVersion: 2, idempotencyKey: 'split-early-close' }), (e) => e.statusCode === 409);
    }
    assert.equal((await service.closeRequest(receiver, split.id, { expectedVersion: 2, idempotencyKey: 'split-close' })).status, 'COMPLETED');
    assert.equal((await getTransfer(receiver, split.id)).tasks.length, 4);
    const duplicateInput = { ...requestInput, idempotencyKey: 'concurrent-request' };
    const concurrent = await Promise.all([service.createRequest(sender, duplicateInput), service.createRequest(sender, duplicateInput)]);
    assert.equal(concurrent[0].id, concurrent[1].id);
    assert.equal(concurrent.filter((v) => !v.replayed).length, 1);
    await service.reviewRequest(owner, concurrent[0].id, { expectedVersion: 1, idempotencyKey: 'reject-request', decision: 'REJECT', reason: 'Not needed' });
    await assert.rejects(() => service.createDispatch(sender, concurrent[0].id, { expectedVersion: 2, idempotencyKey: 'rejected-outbound', lines: [] }), (e) => e.statusCode === 409);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
