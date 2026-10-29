import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import * as models from '../src/models/index.js';
import { createBody } from '../src/modules/location-movements/location-movement.validation.js';
import { createLocationMovement, getLocationMovement } from '../src/modules/location-movements/location-movement.service.js';
import app from '../src/app.js';

const oid = () => new mongoose.Types.ObjectId();
const sid = (value) => String(value._id ?? value);
const rejectsStatus = (action, status) => assert.rejects(action, (error) => error.statusCode === status);

test('UC-35/36 HTTP and MongoDB transactions on an isolated replica-set database', {
  skip: !process.env.MONGODB_TEST_URI, timeout: 120000,
}, async (t) => {
  const dbName = `sep490_relocation_verification_${oid()}`;
  let server;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName, autoIndex: false, serverSelectionTimeoutMS: 5000 });
    for (const Model of Object.values(models).filter((model) => model?.modelName)) await Model.createIndexes();
    const readPermission = await models.Permission.create({ code: 'stock_relocation:read' });
    const createPermission = await models.Permission.create({ code: 'stock_relocation:create' });
    const roles = {};
    for (const code of ['WAREHOUSE', 'OWNER', 'ACCOUNTANT', 'SALES', 'ADMIN']) {
      roles[code] = await models.Role.create({ code, permissionIds: code === 'WAREHOUSE'
        ? [readPermission._id, createPermission._id] : code === 'OWNER' ? [readPermission._id] : [] });
    }
    const store = await models.Party.create({ code: 'STORE', name: 'Test store', kind: 'STORE' });
    const piece = await models.Uom.create({ code: 'PIECE', name: 'Piece' });
    const box = await models.Uom.create({ code: 'BOX', name: 'Box' });
    const loadUser = (user) => models.User.findById(user._id).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
    async function fixture() {
      const warehouse = await models.Warehouse.create({ code: `WH-${oid()}`, name: 'Warehouse' });
      const from = await models.Location.create({ warehouseId: warehouse._id, code: 'A', kind: 'STORAGE', allocatable: true });
      const to = await models.Location.create({ warehouseId: warehouse._id, code: 'B', kind: 'STORAGE', allocatable: true });
      const product = await models.Product.create({ sku: `SKU-${oid()}`, name: 'Test tile', baseUomId: piece._id });
      const lot = await models.Lot.create({ productId: product._id, manufacturerLot: 'LOT1', tone: 'A', calibre: '600', identificationStatus: 'VERIFIED' });
      const conversion = await models.ProductUomVersion.create({ productId: product._id, uomId: box._id, version: 1, basePerUnit: '4', validFrom: new Date('2020-01-01') });
      const account = await models.StockAccount.create({ locationId: from._id });
      const balance = await models.StockBalance.create({ accountId: account._id, lotId: lot._id, qualityCode: 'GOOD', ownerPartyId: store._id, qtyBase: '100' });
      const raw = await models.User.create({ username: `warehouse-${oid()}`, fullName: 'Warehouse', passwordHash: 'test-only', roleId: roles.WAREHOUSE._id, warehouseIds: [warehouse._id] });
      const user = await loadUser(raw);
      const input = createBody.parse({
        idempotencyKey: `key-${oid()}`, warehouseId: sid(warehouse), reason: 'Reorganize storage',
        lines: [{ sourceBalanceId: sid(balance), sourceBalanceVersion: 0, toLocationId: sid(to), conversionId: sid(conversion), enteredQty: '5' }],
      });
      return { warehouse, from, to, product, lot, conversion, account, balance, user, input };
    }
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const root = `http://127.0.0.1:${server.address().port}/api`;
    async function http(path, { user, body, method = 'GET' } = {}) {
      const headers = { 'Content-Type': 'application/json' };
      if (user) headers.Authorization = `Bearer ${jwt.sign({ userId: sid(user) }, process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026')}`;
      const response = await fetch(`${root}${path}`, { method, headers, body: body && JSON.stringify(body) });
      return { status: response.status, body: await response.json() };
    }

    await t.test('HTTP create/detail, decimal DTO, replay and no stock/reservation mutation', async () => {
      const f = await fixture();
      const reservation = await models.Reservation.create({ demandLineId: oid(), executionLineId: oid(), balanceId: f.balance._id, qtyBase: '90', status: 'ACTIVE' });
      const before = JSON.stringify(await models.StockBalance.findById(f.balance._id).lean());
      assert.equal((await http('/health')).status, 200);
      assert.equal((await http('/location-movements', { method: 'POST', body: f.input })).status, 401);
      const created = await http('/location-movements', { method: 'POST', user: f.user, body: f.input });
      assert.equal(created.status, 201, JSON.stringify(created.body));
      const result = created.body.data;
      assert.equal(result.workflowStatus, 'OPEN');
      const detail = await http(`/location-movements/${result.id}`, { user: f.user });
      assert.equal(detail.status, 200);
      assert.equal(detail.body.data.lines[0].plannedQtyBase, '20');
      assert.equal(detail.body.data.lines[0].actualQtyBase, '0');
      assert.equal(detail.body.data.lines[0].ownerPartyId, sid(store));
      assert.equal(detail.body.data.lines[0].enteredUomCode, 'BOX');
      assert.equal(detail.body.data.createdBy, sid(f.user));
      assert.equal(JSON.stringify(await models.StockBalance.findById(f.balance._id).lean()), before);
      assert.equal((await models.Reservation.findById(reservation._id)).status, 'ACTIVE');
      assert.equal(await models.PostingBatch.countDocuments({ documentId: result.id }), 0);
      assert.equal(await models.StockMovement.countDocuments({ documentId: result.id }), 0);
      const retry = await http('/location-movements', { method: 'POST', user: f.user, body: f.input });
      assert.equal(retry.status, 200);
      assert.equal(retry.body.data.id, result.id);
      assert.equal(retry.body.data.replayed, true);
      assert.equal(await models.AuditEvent.countDocuments({ documentId: result.id }), 1);
      assert.equal(await models.DocumentLine.countDocuments({ documentId: result.id }), 1);
      assert.equal((await http('/location-movements', { method: 'POST', user: f.user, body: { ...f.input, reason: 'Changed' } })).status, 409);
      assert.equal((await http('/location-movements/not-an-id', { user: f.user })).status, 400);
      assert.equal((await http('/location-movements', { method: 'POST', user: f.user, body: { ...f.input, workflowStatus: 'CONFIRMED' } })).status, 400);
    });

    await t.test('current role, permission, active account and assigned warehouse enforced on HTTP', async () => {
      const f = await fixture();
      const result = await createLocationMovement(f.user, f.input);
      for (const code of ['ACCOUNTANT', 'SALES', 'ADMIN']) {
        await models.User.updateOne({ _id: f.user._id }, { roleId: roles[code]._id });
        assert.equal((await http(`/location-movements/${result.id}`, { user: f.user })).status, 403);
        assert.equal((await http('/location-movements', { user: f.user, method: 'POST', body: f.input })).status, 403);
      }
      await models.User.updateOne({ _id: f.user._id }, { roleId: roles.OWNER._id });
      assert.equal((await http(`/location-movements/${result.id}`, { user: f.user })).status, 200);
      assert.equal((await http('/location-movements', { user: f.user, method: 'POST', body: f.input })).status, 403);
      await models.User.updateOne({ _id: f.user._id }, { roleId: roles.WAREHOUSE._id, warehouseIds: [] });
      assert.equal((await http(`/location-movements/${result.id}`, { user: f.user })).status, 404);
      assert.equal((await http('/location-movements', { user: f.user, method: 'POST', body: f.input })).status, 403);
      await models.User.updateOne({ _id: f.user._id }, { warehouseIds: [f.warehouse._id] });
      await models.Role.updateOne({ _id: roles.WAREHOUSE._id }, { permissionIds: [] });
      assert.equal((await http(`/location-movements/${result.id}`, { user: f.user })).status, 403);
      await models.Role.updateOne({ _id: roles.WAREHOUSE._id }, { permissionIds: [readPermission._id, createPermission._id] });
      await models.User.updateOne({ _id: f.user._id }, { isActive: false });
      assert.equal((await http(`/location-movements/${result.id}`, { user: f.user })).status, 401);
    });

    await t.test('wrong locations, locked destination, stale version and holds reject without writes', async () => {
      const f = await fixture();
      const attempt = (changes) => createLocationMovement(f.user, { ...f.input, lines: [{ ...f.input.lines[0], ...changes }] });
      await rejectsStatus(() => attempt({ toLocationId: sid(f.from) }), 400);
      const other = await fixture();
      await rejectsStatus(() => attempt({ toLocationId: sid(other.to) }), 400);
      await rejectsStatus(() => attempt({ sourceBalanceVersion: 9 }), 409);
      await rejectsStatus(() => attempt({ enteredQty: '26' }), 409);
      await rejectsStatus(() => attempt({ enteredQty: '0.1' }), 400);
      const lock = await models.LocationLock.create({ locationId: f.to._id, stocktakeId: oid() });
      await rejectsStatus(() => attempt({}), 409);
      await models.LocationLock.deleteOne({ _id: lock._id });
      await models.DefectHold.create({ balanceId: f.balance._id, defectDocumentId: oid(), evidenceId: oid(), qtyBase: '1', recordedBy: f.user._id, status: 'ACTIVE' });
      await rejectsStatus(() => attempt({}), 409);
      assert.equal(await models.BusinessDocument.countDocuments({ createdBy: f.user._id }), 0);
      assert.equal((await models.Location.findById(f.from._id)).planningVersion, 0);
    });

    await t.test('failed audit rolls back header, lines, operation and location guards', async () => {
      const f = await fixture();
      const original = models.AuditEvent.prototype.save;
      models.AuditEvent.prototype.save = async () => { throw new Error('test audit failure'); };
      try { await assert.rejects(() => createLocationMovement(f.user, f.input), /test audit failure/); }
      finally { models.AuditEvent.prototype.save = original; }
      assert.equal(await models.BusinessDocument.countDocuments({ createdBy: f.user._id }), 0);
      assert.equal(await models.BusinessOperation.countDocuments({ performedBy: f.user._id }), 0);
      assert.equal(await models.DocumentLine.countDocuments({ lotId: f.lot._id }), 0);
      assert.equal((await models.Location.findById(f.from._id)).planningVersion, 0);
    });

    await t.test('conversion, source identity, destination suitability and combined line caps', async () => {
      const f = await fixture();
      const other = await fixture();
      const attempt = (changes) => createLocationMovement(f.user, { ...f.input, lines: [{ ...f.input.lines[0], ...changes }] });
      await rejectsStatus(() => attempt({ conversionId: sid(other.conversion) }), 400);
      await models.ProductUomVersion.create({ productId: f.product._id, uomId: box._id, version: 2, basePerUnit: '6', validFrom: new Date('2021-01-01') });
      await rejectsStatus(() => attempt({}), 409);
      const fresh = await fixture();
      const third = await models.Location.create({ warehouseId: fresh.warehouse._id, code: 'C', kind: 'STORAGE', allocatable: true });
      await rejectsStatus(() => createLocationMovement(fresh.user, { ...fresh.input, lines: [
        { ...fresh.input.lines[0], enteredQty: '15' },
        { ...fresh.input.lines[0], toLocationId: sid(third), enteredQty: '15' },
      ] }), 409);
      assert.equal(await models.BusinessDocument.countDocuments({ createdBy: fresh.user._id }), 0);
      await models.Lot.updateOne({ _id: fresh.lot._id }, { identificationStatus: 'UNKNOWN' });
      await rejectsStatus(() => createLocationMovement(fresh.user, fresh.input), 409);
      await models.Lot.updateOne({ _id: fresh.lot._id }, { identificationStatus: 'VERIFIED' });
      await models.Location.updateOne({ _id: fresh.to._id }, { kind: 'QUARANTINE', allocatable: false });
      await rejectsStatus(() => createLocationMovement(fresh.user, fresh.input), 409);
      await models.Location.updateOne({ _id: fresh.to._id }, { kind: 'STORAGE', allocatable: true, isActive: false });
      await rejectsStatus(() => createLocationMovement(fresh.user, fresh.input), 400);
    });

    await t.test('concurrent duplicate requests commit once; competing plans cannot exceed source', async () => {
      const f = await fixture();
      const duplicate = await Promise.all([createLocationMovement(f.user, f.input), createLocationMovement(f.user, f.input)]);
      assert.equal(duplicate[0].id, duplicate[1].id);
      assert.equal(duplicate.filter((value) => !value.replayed).length, 1);
      const input = { ...f.input, lines: [{ ...f.input.lines[0], enteredQty: '15' }] };
      const competing = await Promise.allSettled([
        createLocationMovement(f.user, { ...input, idempotencyKey: 'compete-a' }),
        createLocationMovement(f.user, { ...input, idempotencyKey: 'compete-b' }),
      ]);
      assert.equal(competing.filter((value) => value.status === 'fulfilled').length, 1);
      assert.equal(competing.find((value) => value.status === 'rejected').reason.statusCode, 409);
      assert.equal((await models.StockBalance.findById(f.balance._id)).qtyBase.toString(), '100');
    });

    await t.test('detail uses ledger, supports inactive references and does not expose other task kinds', async () => {
      const f = await fixture();
      const result = await createLocationMovement(f.user, f.input);
      const line = await models.DocumentLine.findOne({ documentId: result.id });
      const targetAccount = await models.StockAccount.create({ locationId: f.to._id });
      const targetBalance = await models.StockBalance.create({ accountId: targetAccount._id, lotId: f.lot._id, ownerPartyId: store._id, qualityCode: 'GOOD', qtyBase: '8' });
      const batch = await models.PostingBatch.create({ documentId: result.id, operation: 'CONFIRM_RELOCATION', operationKey: 'confirm', idempotencyKey: `confirm-${oid()}`, payloadHash: 'a'.repeat(64), postedBy: f.user._id });
      await models.StockMovement.create({ batchId: batch._id, documentId: result.id, lineId: line._id, fromBalanceId: f.balance._id, toBalanceId: targetBalance._id, qtyBase: '8', fromBefore: '100', fromAfter: '92', toBefore: '0', toAfter: '8' });
      await models.Location.updateOne({ _id: f.to._id }, { isActive: false });
      const detail = await getLocationMovement(f.user, result.id);
      assert.equal(detail.lines[0].actualQtyBase, '8');
      assert.equal(detail.lines[0].remainingQtyBase, '12');
      assert.equal(detail.postings[0].movements[0].qtyBase, '8');
      const reversal = await models.PostingBatch.create({ documentId: result.id, operation: 'REVERSE_RELOCATION', operationKey: 'reverse', idempotencyKey: `reverse-${oid()}`, payloadHash: 'b'.repeat(64), postedBy: f.user._id, reversalOf: batch._id });
      await models.StockMovement.create({ batchId: reversal._id, documentId: result.id, lineId: line._id, fromBalanceId: targetBalance._id, toBalanceId: f.balance._id, qtyBase: '8', fromBefore: '8', fromAfter: '0', toBefore: '92', toAfter: '100' });
      assert.equal((await getLocationMovement(f.user, result.id)).lines[0].actualQtyBase, '0');
      const foreignWarehouse = await models.Warehouse.create({ code: `OUT-${oid()}`, name: 'Outside scope' });
      await models.Location.updateOne({ _id: f.to._id }, { warehouseId: foreignWarehouse._id });
      await rejectsStatus(() => getLocationMovement(f.user, result.id), 404);
      const pick = await models.BusinessDocument.create({ documentNo: `PICK-${oid()}`, documentKind: 'TO', createdBy: f.user._id, header: { warehouseId: f.warehouse._id, assignedTo: f.user._id, taskKind: 'PICK' } });
      await rejectsStatus(() => getLocationMovement(f.user, sid(pick)), 404);
      await rejectsStatus(() => getLocationMovement(f.user, sid(oid())), 404);
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
