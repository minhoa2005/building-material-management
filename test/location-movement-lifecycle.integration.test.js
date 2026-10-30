import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import * as m from '../src/models/index.js';
import app from '../src/app.js';
import { createLocationMovement, getLocationMovement } from '../src/modules/location-movements/location-movement.service.js';
import { editLocationMovement, cancelLocationMovement, confirmLocationMovement } from '../src/modules/location-movements/location-movement.lifecycle.js';

const oid = () => new mongoose.Types.ObjectId();
const sid = (value) => String(value._id ?? value);
const rejectsStatus = (action, status) => assert.rejects(action, (error) => error.statusCode === status);

test('BF03 creator edit, confirm and cancel preserve stock and reservations', {
  skip: !process.env.MONGODB_TEST_URI, timeout: 120000,
}, async () => {
  const dbName = `sep490_relocation_lifecycle_${oid()}`;
  let server;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName, autoCreate: false, autoIndex: false, serverSelectionTimeoutMS: 5000 });
    for (const Model of [m.BusinessDocument, m.DocumentLine, m.BusinessOperation, m.StockAccount, m.StockBalance,
      m.PostingBatch, m.StockMovement, m.Reservation, m.AuditEvent, m.OutboxEvent, m.LocationLock]) {
      await Model.createCollection(); await Model.createIndexes();
    }
    const permissions = await m.Permission.insertMany(['create', 'read', 'confirm'].map((action) => ({ code: `stock_relocation:${action}` })));
    const role = await m.Role.create({ code: 'WAREHOUSE', permissionIds: permissions.map((item) => item._id) });
    const store = await m.Party.create({ code: 'STORE', name: 'Store', kind: 'STORE' });
    const piece = await m.Uom.create({ code: 'PIECE', name: 'Piece' });
    const box = await m.Uom.create({ code: 'BOX', name: 'Box' });
    const warehouse = await m.Warehouse.create({ code: 'WH', name: 'Warehouse' });
    const from = await m.Location.create({ warehouseId: warehouse._id, code: 'A', kind: 'STORAGE', allocatable: true });
    const to = await m.Location.create({ warehouseId: warehouse._id, code: 'B', kind: 'STORAGE', allocatable: true });
    const product = await m.Product.create({ sku: 'SKU-1', name: 'Tile', baseUomId: piece._id });
    const lot = await m.Lot.create({ productId: product._id, manufacturerLot: 'LOT-1', tone: 'A', calibre: '600', identificationStatus: 'VERIFIED' });
    const conversion = await m.ProductUomVersion.create({ productId: product._id, uomId: box._id, version: 1, basePerUnit: '4', validFrom: new Date('2020-01-01') });
    const account = await m.StockAccount.create({ locationId: from._id });
    const source = await m.StockBalance.create({ accountId: account._id, lotId: lot._id, qualityCode: 'GOOD', ownerPartyId: store._id, qtyBase: '100' });
    const creatorRaw = await m.User.create({ username: 'creator', fullName: 'Creator', passwordHash: 'test-only', roleId: role._id, warehouseIds: [warehouse._id] });
    const otherRaw = await m.User.create({ username: 'other', fullName: 'Other', passwordHash: 'test-only', roleId: role._id, warehouseIds: [warehouse._id] });
    const loadUser = (user) => m.User.findById(user._id).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
    const creator = await loadUser(creatorRaw);
    const other = await loadUser(otherRaw);
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const call = async (path, method = 'GET', body) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ userId: sid(creator) }, process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026')}` },
        body: body && JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    };
    const options = await call(`/location-movements/options?warehouseId=${sid(warehouse)}`);
    assert.equal(options.status, 200, JSON.stringify(options.body));
    assert.ok(options.body.data.balances.some((item) => item.id === sid(source)));
    const input = { idempotencyKey: 'create-1', warehouseId: sid(warehouse), reason: 'Rearrange',
      lines: [{ sourceBalanceId: sid(source), sourceBalanceVersion: 0, toLocationId: sid(to), conversionId: sid(conversion), enteredQty: '5' }] };
    const created = await createLocationMovement(creator, input);
    assert.equal(created.workflowStatus, 'OPEN');
    const list = await call('/location-movements?page=1&limit=20');
    assert.equal(list.status, 200, JSON.stringify(list.body));
    assert.ok(list.body.data.items.some((item) => item.id === created.id));
    assert.equal((await call(`/location-movements/${created.id}`)).status, 200);
    await rejectsStatus(() => editLocationMovement(other, created.id, { ...input, expectedVersion: 1, idempotencyKey: 'edit-other' }), 404);
    const edited = await editLocationMovement(creator, created.id, { ...input, expectedVersion: 1, idempotencyKey: 'edit-1', reason: 'New reason',
      lines: [{ ...input.lines[0], enteredQty: '6' }] });
    assert.equal(edited.version, 2);
    assert.equal((await getLocationMovement(creator, created.id)).lines[0].plannedQtyBase, '24');
    assert.equal((await m.StockBalance.findById(source._id)).qtyBase.toString(), '100');
    await rejectsStatus(() => confirmLocationMovement(other, created.id, { expectedVersion: 2, idempotencyKey: 'confirm-other', lines: [] }), 404);
    const lineId = (await getLocationMovement(creator, created.id)).lines[0].id;
    const reservation = await m.Reservation.create({ demandLineId: oid(), executionLineId: oid(), balanceId: source._id, qtyBase: '90', status: 'ACTIVE' });
    const first = await confirmLocationMovement(creator, created.id, { expectedVersion: 2, idempotencyKey: 'confirm-1',
      lines: [{ lineId, actualQtyBase: '16' }] });
    assert.equal(first.workflowStatus, 'PARTIAL');
    assert.equal((await m.StockBalance.findById(source._id)).qtyBase.toString(), '84');
    const target = await m.StockBalance.findOne({ lotId: lot._id, accountId: { $ne: account._id } });
    assert.equal(target.qtyBase.toString(), '16');
    assert.equal((await m.Reservation.findById(reservation._id)).qtyBase.toString(), '84');
    assert.equal((await m.Reservation.findOne({ balanceId: target._id })).qtyBase.toString(), '6');
    const replay = await confirmLocationMovement(creator, created.id, { expectedVersion: 2, idempotencyKey: 'confirm-1',
      lines: [{ lineId, actualQtyBase: '16' }] });
    assert.equal(replay.replayed, true);
    assert.equal(await m.StockMovement.countDocuments({ documentId: created.id }), 1);
    await rejectsStatus(() => editLocationMovement(creator, created.id, { ...input, expectedVersion: 3, idempotencyKey: 'edit-after' }), 409);
    const cancelled = await cancelLocationMovement(creator, created.id, { expectedVersion: 3, idempotencyKey: 'cancel-1', reason: 'No more goods' });
    assert.equal(cancelled.workflowStatus, 'CANCELLED');
    assert.equal((await m.StockBalance.findById(source._id)).qtyBase.toString(), '84');
    assert.equal(await m.StockMovement.countDocuments({ documentId: created.id }), 1);
    await rejectsStatus(() => confirmLocationMovement(creator, created.id, { expectedVersion: 4, idempotencyKey: 'confirm-late',
      lines: [{ lineId, actualQtyBase: '8' }] }), 409);

    const second = await createLocationMovement(creator, { ...input, idempotencyKey: 'create-2',
      lines: [{ ...input.lines[0], sourceBalanceVersion: 1, enteredQty: '2' }] });
    const secondLineId = (await getLocationMovement(creator, second.id)).lines[0].id;
    const lock = await m.LocationLock.create({ locationId: to._id, stocktakeId: oid() });
    await rejectsStatus(() => confirmLocationMovement(creator, second.id, { expectedVersion: 1, idempotencyKey: 'confirm-locked',
      lines: [{ lineId: secondLineId, actualQtyBase: '8' }] }), 409);
    assert.equal(await m.PostingBatch.countDocuments({ documentId: second.id }), 0);
    await m.LocationLock.deleteOne({ _id: lock._id });
    const complete = await confirmLocationMovement(creator, second.id, { expectedVersion: 1, idempotencyKey: 'confirm-2',
      lines: [{ lineId: secondLineId, actualQtyBase: '8' }] });
    assert.equal(complete.workflowStatus, 'CONFIRMED');
    assert.equal((await m.StockBalance.findById(source._id)).qtyBase.toString(), '76');
    assert.equal((await m.StockBalance.findById(target._id)).qtyBase.toString(), '24');
    await rejectsStatus(() => cancelLocationMovement(creator, second.id, { expectedVersion: 2, idempotencyKey: 'cancel-confirmed', reason: 'No' }), 409);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
