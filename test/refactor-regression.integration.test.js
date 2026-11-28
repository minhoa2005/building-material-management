import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { PNG } from 'pngjs';
import * as m from '../src/models/runtime.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';

const JWT_SECRET = process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026';
const id = () => new mongoose.Types.ObjectId();
const key = () => String(id());
const tokenFor = user => jwt.sign({ userId: String(user._id) }, JWT_SECRET);

const makePopulatedUser = (code, permissionCodes, warehouseIds = []) => ({
  _id: id(),
  isActive: true,
  warehouseIds,
  roleId: {
    _id: id(),
    code,
    permissionIds: permissionCodes.map(permission => ({ code: permission })),
  },
});

afterEach(() => mock.restoreAll());

test('A1/A2/contract HTTP checks without DB: auth dedupe, Symbol guard, opening-stock validation and dual permissions', async t => {
  const { default: app } = await import('../src/app.js');
  const { authenticate } = await import('../src/middlewares/auth.js');
  const { errorHandler } = await import('../src/middlewares/errorHandler.js');

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve()))));
  const base = `http://127.0.0.1:${server.address().port}/api`;

  let currentActor = makePopulatedUser('OWNER', PERMISSION_CATALOGUE.map(p => p.code));
  const findUser = mock.method(m.User, 'findById', () => ({
    populate: async () => currentActor,
  }));

  const call = async (method, path, { actor = currentActor, body } = {}) => {
    findUser.mock.resetCalls();
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(actor && { Authorization: `Bearer ${tokenFor(actor)}` }),
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json(), authLoads: findUser.mock.callCount() };
  };

  // A2: multi-mounted prefixes only load User once per request.
  for (const [method, path, body] of [
    ['GET', '/purchase-orders/bad-id/receiving-summary', undefined],
    ['POST', '/purchase-orders', {}],
    ['GET', '/goods-receipts/purchase?page=abc', undefined],
    ['GET', '/warehouse-transfers?page=abc', undefined],
  ]) {
    const res = await call(method, path, { body });
    assert.equal(res.status, 400, `${method} ${path}: ${JSON.stringify(res.body)}`);
    assert.equal(res.authLoads, 1, `${method} ${path} should load user once, got ${res.authLoads}`);
  }

  // A2 security guard: pre-populated req.user without private Symbol cannot bypass authenticate.
  const spoofApp = express();
  spoofApp.use((req, _res, next) => { req.user = currentActor; next(); });
  spoofApp.get('/protected', authenticate, (_req, res) => res.json({ ok: true }));
  spoofApp.use(errorHandler);
  const spoofServer = spoofApp.listen(0, '127.0.0.1');
  await once(spoofServer, 'listening');
  t.after(() => new Promise((resolve, reject) => spoofServer.close(err => (err ? reject(err) : resolve()))));
  const spoofed = await fetch(`http://127.0.0.1:${spoofServer.address().port}/protected`);
  assert.equal(spoofed.status, 401);

  // A1: malformed opening-stock ID returns 400 on GET, post and cancel.
  assert.equal((await call('GET', '/opening-stocks/abc')).status, 400);
  assert.equal((await call('POST', '/opening-stocks/abc/post', { body: {} })).status, 400);
  assert.equal((await call('POST', '/opening-stocks/abc/cancel', { body: {} })).status, 400);

  // Opening-stock preview: structural errors return 400 before any DB query; rows are checked by the service.
  const openingFind = mock.method(m.OpeningStock, 'find', () => {
    throw new Error('OpeningStock.find should not run for structural errors');
  });
  const basePreview = { warehouseId: key(), openingAt: '2026-11-16T00:00:00Z' };
  const openingRowBody = { sku: 'SKU1', manufacturerLot: 'L1', locationCode: 'A-01', enteredQty: '5', enteredUnit: 'PIECE' };
  const structuralErr = await call('POST', '/opening-stocks/preview', { body: { ...basePreview, rows: [] } });
  assert.equal(structuralErr.status, 400, JSON.stringify(structuralErr.body));
  assert.equal(structuralErr.body.message, 'Nhập ít nhất một dòng hàng.');
  const futureErr = await call('POST', '/opening-stocks/preview', {
    body: { ...basePreview, openingAt: new Date(Date.now() + 3_600_000).toISOString(), rows: [openingRowBody] },
  });
  assert.equal(futureErr.status, 400);
  assert.equal(futureErr.body.message, 'Mốc tồn đầu không được ở tương lai.');
  assert.equal(openingFind.mock.callCount(), 0);

  // Non-Owner with opening_stock:create still gets 403.
  currentActor = makePopulatedUser('WAREHOUSE', ['opening_stock:create']);
  const nonOwnerPreview = await call('POST', '/opening-stocks/preview', { body: { ...basePreview, rows: [openingRowBody] } });
  assert.equal(nonOwnerPreview.status, 403);
  currentActor = makePopulatedUser('OWNER', PERMISSION_CATALOGUE.map(p => p.code));

  // Import routes accept bodies up to 8 MB; every other route keeps 1 MiB, each with its own message.
  const filler = size => ({ ...basePreview, rows: [openingRowBody], padding: 'x'.repeat(size) });
  const importSized = await call('POST', '/opening-stocks/preview', { body: filler(2 * 1024 * 1024) });
  assert.equal(importSized.status, 400, 'a 2 MB import body passes the parser and fails validation');
  const importTooLarge = await call('POST', '/opening-stocks/preview/', { body: filler(9 * 1024 * 1024) });
  assert.equal(importTooLarge.status, 413);
  assert.equal(importTooLarge.body.message, 'Dữ liệu gửi lên vượt quá giới hạn 8 MB, hãy tách file');
  const ordinaryTooLarge = await call('POST', '/purchase-orders', { body: filler(2 * 1024 * 1024) });
  assert.equal(ordinaryTooLarge.status, 413);
  assert.equal(ordinaryTooLarge.body.message, 'Dữ liệu gửi lên vượt quá giới hạn 1 MiB');
  const productImportSized = await call('POST', '/products/import/preview', { body: { products: [], lots: [], padding: 'x'.repeat(2 * 1024 * 1024) } });
  assert.equal(productImportSized.status, 400);

  // Dual-permission reversal routes return 403 when missing either permission.
  const validId = key();
  for (const perms of [['goods_receipt_inspection:reverse'], ['goods_receipt_inspection:post']]) {
    currentActor = makePopulatedUser('WAREHOUSE', perms);
    for (const [method, path] of [
      ['GET', `/goods-receipts/purchase/${validId}/reversal-preflight`],
      ['POST', `/goods-receipts/purchase/${validId}/reverse`],
      ['GET', `/custody-receipts/${validId}/reversal-preflight`],
      ['POST', `/custody-receipts/${validId}/reverse`],
    ]) {
      const res = await call(method, path, { body: method === 'POST' ? {} : undefined });
      assert.equal(res.status, 403, `${method} ${path} with ${perms.join(',')}`);
    }
  }
  for (const perms of [['goods_receipt_other:read'], ['goods_receipt_other:reverse']]) {
    currentActor = makePopulatedUser('WAREHOUSE', perms);
    const res = await call('GET', `/goods-receipts/other/${validId}/reversal-preflight`);
    assert.equal(res.status, 403, `other preflight with ${perms.join(',')}`);
  }

  // Single static permission routes: read-only actors get 403 before body validation (empty body would be 400).
  for (const [perms, method, path] of [
    [['purchase_order:read'], 'POST', '/purchase-orders'],
    [['purchase_order:read'], 'PUT', `/purchase-orders/${validId}`],
    [['purchase_order:read'], 'POST', `/purchase-orders/${validId}/cancel`],
    [['goods_receipt_inspection:read'], 'POST', `/purchase-orders/${validId}/inspections`],
    [['goods_receipt_inspection:read'], 'POST', `/goods-inspections/${validId}/confirm`],
    [['goods_receipt_inspection:read'], 'POST', `/goods-receipts/purchase/${validId}/post`],
    [['goods_receipt_inspection:read'], 'POST', `/custody-receipts/${validId}/resolution-decisions`],
    [['goods_receipt_other:read'], 'POST', '/goods-receipts/other'],
  ]) {
    currentActor = makePopulatedUser('WAREHOUSE', perms);
    const res = await call(method, path, { body: {} });
    assert.equal(res.status, 403, `${method} ${path} with ${perms.join(',')}`);
  }
  currentActor = makePopulatedUser('OWNER', ['opening_stock:read', 'opening_stock:create']);
  assert.equal((await call('POST', `/opening-stocks/${validId}/post`, { body: {} })).status, 403);
  // With the permission, the same empty body reaches validation.
  currentActor = makePopulatedUser('ACCOUNTANT', ['purchase_order:create']);
  assert.equal((await call('POST', '/purchase-orders', { body: {} })).status, 400);
});

const mongoEnabled = process.env.RUN_NATIVE_API_TESTS === '1';

test('A1/A3/PO-200/replay MongoDB integration checks', { skip: !mongoEnabled, timeout: 120_000 }, async t => {
  const database = `wmsd_refactor_reg_${key()}`;
  await mongoose.connect(`mongodb://127.0.0.1:27017/${database}?replicaSet=rs0`, { serverSelectionTimeoutMS: 5000 });
  t.after(async () => {
    if (mongoose.connection.name !== database) throw new Error('Unsafe test DB');
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  for (const Model of m.models.values()) {
    await Model.createCollection();
    await Model.createIndexes();
  }

  const permissions = await m.Permission.insertMany(
    PERMISSION_CATALOGUE.map(p => ({ code: p.code, name: p.code, description: p.description })),
  );
  const permIds = codes => permissions.filter(p => codes.includes(p.code)).map(p => p._id);

  const warehouse = await m.Warehouse.create({ code: 'K01', name: 'Kho 1', isActive: true, lengthMm: '10000', widthMm: '10000', clearHeightMm: '3000' });
  const supplier = await m.Supplier.create({ code: 'NCC01', name: 'NCC 1', status: 'ACTIVE', phone: '0900000000' });
  const category = await m.Category.create({ code: 'TILE', name: 'Gạch' });
  await m.Uom.create([{ code: 'PIECE', name: 'Viên' }]);
  const product = await m.Product.create({
    sku: 'SKU-HIST', manufacturerCode: 'M1', color: 'White', name: 'Gạch lịch sử',
    categoryId: category._id, baseUnit: 'PIECE', wholeBaseUnits: true, isActive: true,
    lengthMm: '600', widthMm: '600', heightMm: '10',
  });
  const batch = await m.ProductBatch.create({
    productId: product._id, manufacturerLot: 'LOT-1', identificationStatus: 'VERIFIED',
    piecesPerCarton: 4, cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50',
  });

  const makeUser = async code => {
    const role = await m.Role.create({ code, name: code, permissionIds: permIds(ROLE_PERMISSIONS[code]) });
    return m.User.create({ username: `${code}-${key()}`, fullName: code, passwordHash: 'unused', roleId: role._id, warehouseIds: [warehouse._id] });
  };
  const owner = await makeUser('OWNER');
  const accountant = await makeUser('ACCOUNTANT');
  const worker = await makeUser('WAREHOUSE');

  const { default: app } = await import('../src/app.js');
  const { evidenceStorage } = await import('../src/shared/utils/evidence-storage.js');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve()))));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const api = async (method, path, user, body) => {
    const response = await fetch(base + path, {
      method,
      headers: {
        Authorization: `Bearer ${tokenFor(user)}`,
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };

  // A1: valid-format nonexistent opening-stock ID returns 404.
  assert.equal((await api('GET', `/opening-stocks/${key()}`, owner)).status, 404);

  // A3: historical PO with ObjectId _id and distinct documentNo.
  const poId = id();
  const poNo = 'ĐMH-K01-261101-000001';
  const poLineId = id();
  const arrivalId = id();
  const arrivalLineId = id();
  const inspectionId = id();
  const receiptId = id();
  const opKey = `op-${key()}`;

  await m.PurchaseOrder.collection.insertOne({
    _id: poId, documentNo: poNo, workflowStatus: 'PARTIAL', version: 1, createdBy: accountant._id,
    currency: 'VND', totalAmount: '1000',
    header: { warehouseId: warehouse._id, supplierId: supplier._id, supplierSnapshot: { code: supplier.code, name: supplier.name, phone: supplier.phone } },
    items: [{ _id: poLineId, lineNo: 1, lineKind: 'STANDARD', productId: product._id, productNameSnapshot: product.name, enteredUnit: 'PIECE', baseUnitSnapshot: 'PIECE', baseUnitsPerUnit: '1', enteredQty: '10', qtyBase: '10', unitPurchasePrice: '100', lineAmount: '1000' }],
    evidenceIds: [], createdAt: new Date(), updatedAt: new Date(),
  });
  await m.GoodsArrival.collection.insertOne({
    _id: arrivalId, documentNo: 'HĐK-K01-261101-000001', workflowStatus: 'RECORDED', version: 1, createdBy: worker._id,
    header: { purchaseOrderId: poId, warehouseId: warehouse._id, supplierId: supplier._id, arrivedAt: new Date() },
    items: [{ _id: arrivalLineId, lineNo: 1, lineKind: 'STANDARD', productId: product._id, lotId: batch._id, purchaseOrderItemId: poLineId, productNameSnapshot: product.name, enteredUnit: 'PIECE', baseUnitSnapshot: 'PIECE', baseUnitsPerUnit: '1', enteredQty: '4', qtyBase: '4' }],
    createdAt: new Date(), updatedAt: new Date(),
  });
  await m.GoodsInspection.collection.insertOne({
    _id: inspectionId, documentNo: 'PKN-K01-261101-000001', documentKind: 'INSPECTION', workflowStatus: 'CONFIRMED', version: 1, createdBy: worker._id,
    header: { arrivalId, warehouseId: warehouse._id },
    items: [{ _id: id(), lineNo: 1, lineKind: 'INSPECTION', productId: product._id, lotId: batch._id, productNameSnapshot: product.name, enteredUnit: 'PIECE', baseUnitSnapshot: 'PIECE', baseUnitsPerUnit: '1', enteredQty: '4', qtyBase: '4', details: { inspectedSourceLineId: arrivalLineId, qualityCode: 'GOOD', ownershipDecision: 'ACCEPT', packagingCondition: 'SEALED' } }],
    createdAt: new Date(), updatedAt: new Date(),
  });
  await m.PurchaseReceipt.collection.insertOne({
    _id: receiptId, documentNo: 'PNM-K01-261101-000001', documentKind: 'PURCHASE', workflowStatus: 'DRAFT', version: 1, createdBy: worker._id,
    header: { purchaseOrderId: poId, arrivalId, warehouseId: warehouse._id, supplierId: supplier._id },
    items: [{ _id: id(), lineNo: 1, lineKind: 'STANDARD', productId: product._id, lotId: batch._id, purchaseOrderItemId: poLineId, arrivalItemId: arrivalLineId, inspectionId, productNameSnapshot: product.name, enteredUnit: 'PIECE', baseUnitSnapshot: 'PIECE', baseUnitsPerUnit: '1', enteredQty: '4', qtyBase: '4' }],
    createdAt: new Date(), updatedAt: new Date(),
  });
  await m.AuditLog.collection.insertOne({
    _id: id(), actorId: accountant._id, action: 'CREATE_PURCHASE_ORDER', subjectType: 'purchase_orders', subjectId: poId, occurredAt: new Date(),
  });
  await m.ApprovalHistory.collection.insertOne({
    _id: id(), decisionKey: key(), subjectType: 'purchase_orders', subjectId: poId, subjectRevision: 1,
    decisionScope: 'PO', decision: 'APPROVE', requestedBy: accountant._id, decidedBy: owner._id, decidedAt: new Date(), recordedAt: new Date(),
  });
  await m.OperationRecord.collection.insertOne({
    _id: id(), actorType: 'USER', actorId: worker._id, operationCode: 'CREATE_GOODS_INSPECTION',
    requestKey: opKey, requestHash: 'h', operationKey: key(),
    subjectType: 'goods_receipts', subjectId: receiptId, versionBefore: 0, versionAfter: 1, resultCode: 'DRAFT', completedAt: new Date(),
  });

  const png = PNG.sync.write(new PNG({ width: 1, height: 1 }));
  const attachedKey = `sep490/purchase-evidence/${key()}`;
  const tempKey = `sep490/purchase-evidence/${key()}`;
  mock.method(evidenceStorage, 'exists', async storageKey => ({ public_id: storageKey, type: 'authenticated' }));
  mock.method(evidenceStorage, 'download', async () => `data:image/png;base64,${png.toString('base64')}`);
  const attachedEv = await m.Attachment.create({
    _id: id(), ownerDocumentType: 'purchase_orders', ownerDocumentId: poId, purpose: 'PURCHASE_EVIDENCE',
    originalName: 'invoice.png', mediaType: 'image/png', sizeBytes: png.length, storageKey: attachedKey,
    checksum: 'a'.repeat(64), uploadedBy: accountant._id, uploadedAt: new Date(), accessCategory: 'BUSINESS', status: 'ATTACHED',
  });
  const tempEv = await m.Attachment.create({
    _id: id(), ownerDocumentType: 'purchase_orders', ownerDocumentId: poId, purpose: 'PURCHASE_EVIDENCE',
    originalName: 'proof.png', mediaType: 'image/png', sizeBytes: png.length, storageKey: tempKey,
    checksum: 'b'.repeat(64), uploadedBy: accountant._id, uploadedAt: new Date(), accessCategory: 'BUSINESS',
    status: 'TEMPORARY', uploadSessionId: key(), expiresAt: new Date(Date.now() + 60_000),
  });

  const encodedNo = encodeURIComponent(poNo);
  const poDetail = await api('GET', `/purchase-orders/${encodedNo}`, owner);
  assert.equal(poDetail.status, 200, JSON.stringify(poDetail.body));
  assert.equal(poDetail.body.data.arrivals.length, 1);
  assert.equal(poDetail.body.data.receipts.length, 1);
  assert.equal(poDetail.body.data.history.length, 1);
  assert.equal(poDetail.body.data.approvals.length, 1);

  const summary = await api('GET', `/purchase-orders/${encodedNo}/receiving-summary`, owner);
  assert.equal(summary.status, 200, JSON.stringify(summary.body));
  assert.equal(summary.body.data.tripCount, 1);
  assert.deepEqual(new Set(summary.body.data.documents.map(d => d.kind)), new Set(['INSPECTION', 'GR_PURCHASE']));

  const trips = await api('GET', `/purchase-orders/${encodedNo}/receiving-trips`, worker);
  assert.equal(trips.status, 200, JSON.stringify(trips.body));
  assert.equal(trips.body.data.items.length, 1);
  assert.equal(trips.body.data.items[0].id, String(inspectionId));

  // List filters given the historical PO documentNo resolve to its ObjectId _id.
  for (const [path, expectedId] of [
    [`/goods-inspections?purchaseOrderId=${encodedNo}`, inspectionId],
    [`/goods-receipts/purchase?purchaseOrderId=${encodedNo}`, receiptId],
    [`/purchase-receiving/queue?stage=AWAITING_POST&purchaseOrderId=${encodedNo}`, receiptId],
    [`/goods-receipts?purchaseOrderId=${encodedNo}`, receiptId],
  ]) {
    const listed = await api('GET', path, worker);
    assert.equal(listed.status, 200, `${path}: ${JSON.stringify(listed.body)}`);
    assert.deepEqual(listed.body.data.items.map(item => item.id), [String(expectedId)], path);
  }

  const op = await api('GET', `/purchase-orders/${encodedNo}/receiving-operations/${opKey}`, worker);
  assert.equal(op.status, 200, JSON.stringify(op.body));
  assert.equal(op.body.data.subjectId, String(receiptId));

  const evList = await api('GET', `/purchase-documents/${encodedNo}/evidence`, accountant);
  assert.equal(evList.status, 200, JSON.stringify(evList.body));
  assert.equal(evList.body.data.items.length, 1);
  assert.equal(evList.body.data.items[0].id, String(attachedEv._id));

  const evDownload = await api('GET', `/purchase-documents/${encodedNo}/evidence/${attachedEv._id}/download`, accountant);
  assert.equal(evDownload.status, 200, JSON.stringify(evDownload.body));
  assert.match(evDownload.body.data.url, /^data:image\/png;base64,/);

  const attachPayload = { expectedVersion: 1, operationKey: key(), attachmentId: String(tempEv._id) };
  const attached = await api('POST', `/purchase-documents/${encodedNo}/evidence/attach`, accountant, attachPayload);
  assert.equal(attached.status, 200, JSON.stringify(attached.body));
  assert.equal(attached.body.data.replayed, false);
  const attachReplay = await api('POST', `/purchase-documents/${encodedNo}/evidence/attach`, accountant, attachPayload);
  assert.equal(attachReplay.status, 200, JSON.stringify(attachReplay.body));
  assert.equal(attachReplay.body.data.replayed, true);

  // PO create returns HTTP 200 and supports idempotent replay.
  const rrId = 'YCBS-K01-261125-000001';
  const rrLineId = id();
  const approvalId = id();
  await m.ReplenishmentRequest.collection.insertOne({
    _id: rrId, documentNo: rrId, workflowStatus: 'APPROVED', version: 2, createdBy: worker._id,
    header: { warehouseId: warehouse._id, approvedRevision: 1, latestDecisionId: approvalId },
    items: [{ _id: rrLineId, lineNo: 1, lineKind: 'STANDARD', productId: product._id, productNameSnapshot: product.name, enteredUnit: 'PIECE', baseUnitSnapshot: 'PIECE', baseUnitsPerUnit: '1', enteredQty: '10', qtyBase: '10' }],
    createdAt: new Date(), updatedAt: new Date(),
  });
  await m.ApprovalHistory.collection.insertOne({
    _id: approvalId, decisionKey: key(), subjectType: 'replenishment_requests', subjectId: rrId,
    subjectRevision: 1, decisionScope: 'REPLENISHMENT', decision: 'APPROVE',
    requestedBy: worker._id, decidedBy: owner._id, decidedAt: new Date(), recordedAt: new Date(),
    itemDecisions: [{ itemId: rrLineId, approvedQtyBase: '10', outcome: 'APPROVE' }],
  });
  const poCreateBody = {
    creationKey: key(),
    warehouseId: String(warehouse._id),
    supplierId: String(supplier._id),
    currency: 'VND',
    lines: [{ rrLineId: String(rrLineId), approvalId: String(approvalId), enteredQty: '10', unitPurchasePrice: '100' }],
  };
  const createdPo = await api('POST', '/purchase-orders', accountant, poCreateBody);
  assert.equal(createdPo.status, 200, JSON.stringify(createdPo.body));
  assert.equal(createdPo.body.data.replayed, false);
  const replayedPo = await api('POST', '/purchase-orders', accountant, poCreateBody);
  assert.equal(replayedPo.status, 200, JSON.stringify(replayedPo.body));
  assert.equal(replayedPo.body.data.replayed, true);
  assert.equal(replayedPo.body.data.id, createdPo.body.data.id);
});
