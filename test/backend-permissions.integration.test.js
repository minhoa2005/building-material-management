import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';
import { syncIteration1Permissions } from '../scripts/sync-iteration1-permissions.mjs';

const enabled = process.env.RUN_NATIVE_API_TESTS === '1';
const id = () => new mongoose.Types.ObjectId();
const testUri = () => `mongodb://127.0.0.1:27017/wmsd_api_test_${id()}?replicaSet=rs0`;
const permissionDocs = PERMISSION_CATALOGUE.map(({ code }) => ({ _id: id(), code, name: code, isActive: true }));
const permissionId = code => permissionDocs.find(permission => permission.code === code)._id;
const roleDoc = (code, permissions = ROLE_PERMISSIONS[code]) => ({
  _id: id(), code, name: code, isActive: true, permissionIds: permissions.map(permissionId),
});
const evidence = id();

test('HTTP permission scope and read-only workflow selectors', { skip: !enabled, timeout: 120_000 }, async t => {
  await mongoose.connect(testUri(), { autoIndex: false, autoCreate: false });
  t.after(async () => {
    try { await mongoose.connection.dropDatabase(); } finally { await mongoose.disconnect(); }
  });
  const [warehouse, otherWarehouse, productId, otherProduct, lotId, requestId, supplierId, otherSupplier] =
    Array.from({ length: 8 }, id);
  const codes = ['OWNER', 'ACCOUNTANT', 'WAREHOUSE', 'SALES', 'ADMIN', 'WAREHOUSE_LEAD'];
  const roles = codes.map(code => roleDoc(code, code === 'WAREHOUSE_LEAD' ? ROLE_PERMISSIONS.WAREHOUSE : undefined));
  const users = Object.fromEntries(roles.map(role => [role.code, {
    _id: id(), roleId: role._id, isActive: true,
    warehouseIds: role.code === 'WAREHOUSE_LEAD' ? [] : [warehouse],
  }]));
  const secondSales = { ...users.SALES, _id: id() };
  const orderA = id(), orderB = id();
  const salesLineA = id(), salesLineB = id();
  const wirA = id(), wirB = id(), wirLineA = id(), wirLineB = id();
  const deliveryA = id(), deliveryB = id(), inconsistentDelivery = id();
  const makeOrder = (_id, line) => ({
    _id, createdBy: users.SALES._id, documentKind: 'SALES_ORDER', evidenceIds: [evidence], orderAmount: '200',
    header: { externalReferenceId: id() },
    items: [{ _id: line, lineKind: 'SALES_ORDER', productId, unitSellingPrice: '100', lineAmount: '200', evidenceIds: [evidence] }],
  });
  const makeRequest = (_id, salesOrderId, requestedWarehouseId, line, salesOrderLineId) => ({
    _id, header: { salesOrderId, requestedWarehouseId },
    items: [{ _id: line, lineKind: 'ISSUE_REQUEST', productId, details: { salesOrderLineId } }],
  });
  const makeDelivery = (_id, warehouseId, issueRequestId, issueRequestLineId) => ({
    _id, header: { warehouseId, issueRequestId },
    items: [{ _id: id(), lineKind: 'OUTBOUND_DELIVERY', productId, details: { issueRequestLineId }, evidenceIds: [evidence] }],
  });
  const makePO = (warehouseId, supplier, code, name) => ({
    _id: id(), header: { warehouseId, supplierId: supplier, supplierSnapshot: { code, name, phone: '000' } },
  });
  const fixtures = [
    [m.Permission, permissionDocs], [m.Role, roles], [m.User, [...Object.values(users), secondSales]],
    [m.Warehouse, [{ _id: warehouse, isActive: true }, { _id: otherWarehouse, isActive: true }]],
    [m.Product, [{ _id: productId, isActive: true }, { _id: otherProduct, isActive: true }]],
    [m.ProductBatch, [
      { _id: lotId, productId, manufacturerLot: 'A-01', identificationStatus: 'VERIFIED', piecesPerCarton: 4, cartonLengthMm: '300' },
      { _id: id(), productId, manufacturerLot: 'B-02', identificationStatus: 'VERIFIED', piecesPerCarton: 6 },
      { _id: id(), productId, manufacturerLot: 'UNKNOWN', identificationStatus: 'UNKNOWN', piecesPerCarton: 4 },
      { _id: id(), productId: otherProduct, manufacturerLot: 'OTHER', identificationStatus: 'VERIFIED', piecesPerCarton: 4 },
    ]],
    [m.ReplenishmentRequest, [
      { _id: requestId, createdBy: users.SALES._id, workflowStatus: 'DRAFT', header: { warehouseId: warehouse } },
    ]],
    [m.PurchaseOrder, [
      makePO(warehouse, supplierId, 'HIST', 'Historical supplier'),
      makePO(warehouse, supplierId, 'HIST', 'Historical supplier'),
      makePO(otherWarehouse, otherSupplier, 'OUT', 'Other warehouse supplier'),
    ]],
    [m.SalesOrder, [makeOrder(orderA, salesLineA), makeOrder(orderB, salesLineB)]],
    [m.Attachment, [{
      _id: evidence, ownerDocumentId: orderA, ownerDocumentType: 'sales_orders',
      storageKey: 'sep490/sales-source/synthetic', status: 'ATTACHED', mediaType: 'image/png',
    }]],
    [m.WarehouseIssueRequest, [
      makeRequest(wirA, orderA, warehouse, wirLineA, salesLineA),
      makeRequest(wirB, orderB, otherWarehouse, wirLineB, salesLineB),
    ]],
    [m.DeliveryOrder, [
      makeDelivery(deliveryA, warehouse, wirA, wirLineA),
      makeDelivery(deliveryB, otherWarehouse, wirB, wirLineB),
      makeDelivery(inconsistentDelivery, warehouse, wirB, wirLineB),
    ]],
  ];
  for (const [model, records] of fixtures) await model.collection.insertMany(records);

  process.env.JWT_SECRET = 'permission-integration-fixture';
  const { default: app } = await import('../src/app.js');
  const { cloudinary } = await import('../src/config/cloudinary.js');
  cloudinary.config({ cloud_name: 'fixture', api_key: 'fixture', api_secret: 'fixture' });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const token = actor => jwt.sign({ userId: String(actor._id) }, process.env.JWT_SECRET);
  async function api(path, actor, { method = 'GET', body, status = 200, code } = {}) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(actor && { Authorization: `Bearer ${token(actor)}` }),
        ...(body && { 'Content-Type': 'application/json' }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });
    const result = await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(result)}`);
    if (code) assert.equal(result.code, code);
    return result.data;
  }

  await t.test('public paths and business evidence guards', async () => {
    await api('/health');
    await api('/auth/login', null, { method: 'POST', body: {}, status: 400 });
    await api('/upload', null, { method: 'POST', status: 404 });
    await api('/return-workflows/options', null, { status: 401 });
    await api('/defects', users.ADMIN, { status: 403 });
    await api('/sales-orders/source-evidence', null, { method: 'POST', status: 401 });
    await api('/sales-orders/source-evidence', users.WAREHOUSE, { method: 'POST', status: 403 });
    await api('/sales-orders/source-evidence', users.SALES, { method: 'POST', status: 400 });
    await api('/roles', users.OWNER, { status: 403 });
    await api('/roles', users.ADMIN);
  });

  await t.test('RR lot options use RR permission and enforce creator and warehouse scope', async () => {
    const path = `/replenishments/options/lots?productId=${productId}&warehouseId=${warehouse}`;
    const first = await api(path + '&limit=1', users.SALES);
    assert.deepEqual(first, { items: [{ id: String(lotId), manufacturerLot: 'A-01', piecesPerCarton: 4 }], total: 2, page: 1, limit: 1 });
    assert.equal((await api(path + '&limit=1&page=2', users.SALES)).items[0].manufacturerLot, 'B-02');
    await api(path + `&requestId=${requestId}`, users.SALES);
    await api(path + `&requestId=${requestId}`, secondSales, { status: 404 });
    await api(path, users.ACCOUNTANT, { status: 403, code: 'ERR-CORE-403-001' });
    await api(path.replace(String(warehouse), String(otherWarehouse)), users.SALES, { status: 403, code: 'ERR-CORE-403-002' });
    await api('/lots', users.SALES, { status: 403 });
    await m.Role.collection.updateOne({ _id: users.SALES.roleId }, {
      $pull: { permissionIds: permissionId('replenishment_request:create') },
    });
    await api('/replenishments/options?mode=CREATE', users.SALES, { status: 403 });
    await api(`/replenishments/options?mode=CREATE&requestId=${requestId}`, users.SALES);
    await api(`/replenishments/options?mode=CREATE&requestId=${requestId}`, secondSales, { status: 404 });
    await api(path + `&requestId=${requestId}`, users.SALES);
  });

  await t.test('PO supplier options use scoped snapshots and preserve historical suppliers', async () => {
    const path = '/purchase-orders/supplier-options';
    assert.deepEqual(await api(path, users.WAREHOUSE), [{ id: String(supplierId), code: 'HIST', name: 'Historical supplier' }]);
    assert.equal((await api(path, users.ACCOUNTANT)).length, 2);
    await api(path, users.SALES, { status: 403, code: 'ERR-CORE-403-001' });
    await api(path + `?warehouseId=${otherWarehouse}`, users.WAREHOUSE, { status: 403, code: 'ERR-CORE-403-002' });
    await api('/suppliers/names', users.WAREHOUSE, { status: 403 });
  });

  await t.test('custom role uses current grants and warehouse scope across list, detail and evidence', async () => {
    const lead = users.WAREHOUSE_LEAD;
    assert.equal((await api('/outbound-deliveries', lead)).total, 0);
    await api(`/sales-orders/${orderA}`, lead, { status: 404 });
    await m.User.collection.updateOne({ _id: lead._id }, { $set: { warehouseIds: [warehouse] } });
    const list = await api('/outbound-deliveries', lead);
    assert.deepEqual(list.items.map(item => item.id), [String(deliveryA)]);
    assert.equal(list.items[0].items[0].evidenceIds, undefined);
    assert.equal((await api(`/outbound-deliveries/${deliveryA}`, lead)).id, String(deliveryA));
    await api(`/outbound-deliveries/${deliveryB}`, lead, { status: 403, code: 'ERR-CORE-403-002' });
    await api(`/outbound-deliveries/${inconsistentDelivery}`, lead, { status: 404 });
    const scopedOrder = await api(`/sales-orders/${orderA}`, lead);
    assert.equal(scopedOrder.orderAmount, undefined);
    assert.equal(scopedOrder.items[0].unitSellingPrice, undefined);
    assert.equal(scopedOrder.items[0].evidenceIds, undefined);
    assert.equal(scopedOrder.header.externalReferenceId, undefined);
    await api(`/sales-orders/${orderB}`, lead, { status: 404 });
    await api(`/sales-orders/${orderA}/evidence/${evidence}`, lead, { status: 404 });
    assert.match((await api(`/sales-orders/${orderA}/evidence/${evidence}`, users.OWNER)).url, /^https:/);
    assert.equal((await api(`/sales-orders/${orderA}`, users.OWNER)).orderAmount, '200');
    assert.equal((await api(`/sales-orders/${orderA}`, users.ACCOUNTANT)).orderAmount, '200');
    assert.equal((await api(`/sales-orders/${orderA}`, users.WAREHOUSE)).orderAmount, undefined);
    assert.equal((await api(`/sales-orders/${orderA}`, users.SALES)).orderAmount, '200');
    await api(`/sales-orders/${orderA}`, secondSales, { status: 404 });
    await api(`/sales-orders/${orderA}`, users.ADMIN, { status: 403 });
    await m.Role.collection.updateOne({ _id: lead.roleId }, { $pull: { permissionIds: permissionId('outbound_delivery:read') } });
    await api('/outbound-deliveries', lead, { status: 403, code: 'ERR-CORE-403-001' });
    await m.Permission.collection.updateOne({ _id: permissionId('sales_order:read') }, { $set: { isActive: false } });
    await api(`/sales-orders/${orderA}`, lead, { status: 403, code: 'ERR-CORE-403-001' });
  });
});

test('permission sync audits and inserts only the seven migration codes on an isolated local DB', {
  skip: !enabled, timeout: 60_000,
}, async () => {
  await assert.rejects(syncIteration1Permissions('mongodb://example.com/sep490'), /localhost/);
  await assert.rejects(syncIteration1Permissions('mongodb://127.0.0.1/admin'), /explicit name/);
  const uri = testUri();
  const connection = await mongoose.createConnection(uri).asPromise();
  try {
    const permissions = connection.db.collection('permissions');
    const roles = connection.db.collection('roles');
    await permissions.createIndex({ code: 1 }, { unique: true });
    const missing = [
      'uom:read', 'uom:create', 'uom:update', 'uom:activate',
      'purchase_custody:decide', 'purchase_custody:execute', 'stock_reversal:approve',
    ];
    const intentionallyRevoked = 'product:read';
    const inactiveCode = 'purchase_order:read';
    const absentUnrelated = 'notification:read';
    const excluded = [...missing, absentUnrelated];
    await permissions.insertMany(permissionDocs.filter(permission => !excluded.includes(permission.code))
      .map(permission => ({ ...permission, isActive: permission.code !== inactiveCode })));
    const dangling = id();
    const role = roleDoc('OWNER', [inactiveCode, 'user:read']);
    role.permissionIds.push(dangling);
    const custom = roleDoc('WAREHOUSE_LEAD', ['product:read']);
    await roles.insertMany([role, roleDoc('SALES', []), roleDoc('WAREHOUSE', []), roleDoc('ACCOUNTANT', []), custom]);

    const before = await syncIteration1Permissions(uri);
    assert.deepEqual(before.plannedInsertions, missing);
    assert.ok(before.missingPermissions.includes(absentUnrelated));
    assert.deepEqual(before.inactivePermissions, [inactiveCode]);
    assert.deepEqual(before.roles.find(row => row.role === 'OWNER').danglingPermissionRefs, [String(dangling)]);
    assert.equal(await permissions.countDocuments({ code: { $in: missing } }), 0);
    const applied = await syncIteration1Permissions(uri, { apply: true });
    assert.deepEqual(applied.insertedPermissions, missing);
    assert.deepEqual(applied.updatedRoles, ['ACCOUNTANT', 'OWNER', 'SALES', 'WAREHOUSE']);
    assert.deepEqual((await roles.findOne({ code: custom.code })).permissionIds, custom.permissionIds);
    const owner = await roles.findOne({ code: 'OWNER' });
    assert.ok(role.permissionIds.every(kept => owner.permissionIds.some(ref => ref.equals(kept))));
    assert.ok(!owner.permissionIds.some(ref => ref.equals(permissionId(intentionallyRevoked))));
    assert.equal(await permissions.countDocuments({ code: absentUnrelated }), 0);
    assert.equal((await permissions.findOne({ code: inactiveCode })).isActive, false);
    const after = await syncIteration1Permissions(uri, { apply: true });
    assert.deepEqual(after.insertedPermissions, []);
    assert.deepEqual(after.updatedRoles, []);
  } finally {
    try { await connection.dropDatabase(); } finally { await connection.close(); }
  }
});
