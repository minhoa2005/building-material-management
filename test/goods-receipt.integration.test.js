import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import * as m from '../src/models/runtime.js';
import { buildReviewedDemo } from '../src/seeds/rebuild/data.js';
import app from '../src/app.js';

const enabled = process.env.RUN_GOODS_RECEIPT_TESTS === '1';
const id = () => new mongoose.Types.ObjectId();
const key = () => String(id());

test('five receipt APIs, per-kind rights and OTHER correction flow', { skip: !enabled, timeout: 120_000 }, async t => {
  const database = 'wmsd_goods_receipt_test_' + key();
  await mongoose.connect(`mongodb://127.0.0.1:27017/${database}?replicaSet=rs0`, { serverSelectionTimeoutMS: 5000 });
  t.after(async () => {
    if (mongoose.connection.name !== database) throw Error('Unsafe test database');
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  });
  const data = await buildReviewedDemo();
  for (const [name, Model] of m.models) {
    await Model.createCollection();
    if (data[name]?.length) await Model.collection.insertMany(data[name]);
    await Model.createIndexes();
  }
  const role = async code => m.Role.findOne({ code });
  const worker = await m.User.findOne({ roleId: (await role('WAREHOUSE'))._id });
  const owner = await m.User.findOne({ roleId: (await role('OWNER'))._id });
  const warehouse = await m.Warehouse.findById(worker.warehouseIds[0]);
  const category = await m.Category.findOne();
  const product = await m.Product.create({ sku: key(), name: 'Test receipt tile', manufacturerCode: 'TEST', categoryId: category._id,
    color: 'White', baseUnit: 'Viên', wholeBaseUnits: true, lengthMm: '600', widthMm: '600', heightMm: '10' });
  const batch = await m.ProductBatch.create({ productId: product._id, manufacturerLot: key(), identificationStatus: 'VERIFIED',
    piecesPerCarton: 4, cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50' });
  const location = await m.WarehouseLocation.create({ warehouseId: warehouse._id, code: 'GR-' + key().slice(0, 8),
    locationType: 'RECEIVING', usableLengthMm: '5000', usableWidthMm: '5000' });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const api = async (method, path, user, body) => {
    const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json',
      authorization: 'Bearer ' + jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026') },
      ...(body && { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() };
  };
  const unified = await api('GET', '/goods-receipts?limit=100', owner);
  assert.equal(unified.status, 200, JSON.stringify(unified.body));
  assert.deepEqual(new Set(unified.body.data.items.map(row => row.documentKind)), new Set(['PURCHASE', 'CUSTOMER_RETURN', 'FAILED_DELIVERY', 'TRANSFER']));
  const paths = ['purchase', 'customer-return', 'failed-delivery', 'transfer', 'other'];
  for (const path of paths) assert.equal((await api('GET', `/goods-receipts/${path}`, owner)).status, 200, path);
  assert.equal((await api('GET', '/purchase-receipts', owner)).status, 404);
  const purchase = await m.PurchaseReceipt.findOne();
  const purchaseLine = purchase.items[0];
  const optionalIds = ['purchaseOrderItemId', 'arrivalItemId', 'inspectionId', 'inspectionResultId', 'custodyBalanceId', 'supplierScheduleId'];
  for (const field of optionalIds) purchaseLine[field] = id();
  purchaseLine.destinationLocationId = location._id;
  purchaseLine.custodyReceiptRef = { documentType: 'custody_receipts', documentId: id(), itemId: id(), revision: 1 };
  purchase.custodyDecisionId = id();
  await purchase.save();
  const roundTrip = await m.PurchaseReceipt.findById(purchase._id);
  assert.equal(String(roundTrip.items[0]._id), String(purchaseLine._id));
  for (const field of optionalIds) assert.equal(String(roundTrip.items[0][field]), String(purchaseLine[field]), field);
  assert.equal(String(roundTrip.items[0].custodyReceiptRef.documentId), String(purchaseLine.custodyReceiptRef.documentId));
  assert.equal(String(roundTrip.custodyDecisionId), String(purchase.custodyDecisionId));
  for (const Model of [m.CustomerReturnReceipt, m.FailedDeliveryReceipt, m.TransferReceipt]) {
    const row = await Model.findOne(); const lineId = String(row.items[0]._id);
    row.note = 'Mongo round trip'; await row.save();
    const restored = await Model.findById(row._id);
    assert.equal(String(restored.items[0]._id), lineId);
    assert.equal(String(restored.items[0].qtyBase), String(row.items[0].qtyBase));
    if (Model === m.FailedDeliveryReceipt) {
      assert.deepEqual(restored.demandReopenings.map(x => String(x._id)), row.demandReopenings.map(x => String(x._id)));
      assert.deepEqual(restored.commitmentTransfers.map(x => String(x._id)), row.commitmentTransfers.map(x => String(x._id)));
    }
  }
  await assert.rejects(new m.PurchaseReceipt({ documentNo: 'INVALID', workflowStatus: 'DRAFT', version: 1,
    createdBy: worker._id, header: { warehouseId: warehouse._id, returnId: id() }, items: [] }).validate(), /header/);
  assert.equal((await api('GET', `/goods-receipts/customer-return/${purchase._id}`, owner)).status, 404);
  assert.equal((await api('GET', `/goods-receipts/purchase/${purchase._id}`, owner)).status, 200);
  const genericPurchase = await api('GET', '/goods-receipts/' + encodeURIComponent(purchase._id), owner);
  assert.equal(genericPurchase.status, 200, JSON.stringify(genericPurchase.body));
  assert.equal(genericPurchase.body.data.documentKind, 'PURCHASE');
  const purchaseSearch = await api('GET', '/goods-receipts?kind=PURCHASE&q=' + encodeURIComponent(purchase.documentNo), owner);
  assert.equal(purchaseSearch.body.data.items[0]._id, String(purchase._id));
  const narrowRole = await m.Role.create({ code: 'GR-RETURN-ONLY', name: 'Return only',
    permissionIds: [(await m.Permission.findOne({ code: 'customer_return:read' }))._id], isSystemRole: false });
  const narrow = await m.User.create({ username: 'return-' + key(), fullName: 'Return only', passwordHash: 'unused',
    roleId: narrowRole._id, warehouseIds: [warehouse._id] });
  assert.equal((await api('GET', '/goods-receipts/customer-return', narrow)).status, 200);
  assert.equal((await api('GET', '/goods-receipts/failed-delivery', narrow)).status, 403);
  const narrowReceipts = await api('GET', '/goods-receipts?limit=100', narrow);
  assert.equal(narrowReceipts.status, 200);
  assert.ok(narrowReceipts.body.data.items.every(row => row.documentKind === 'CUSTOMER_RETURN'));
  assert.equal((await api('GET', '/goods-receipts?kind=FAILED_DELIVERY', narrow)).body.data.total, 0);
  assert.equal((await api('GET', '/goods-receipts/' + encodeURIComponent(purchase._id), narrow)).status, 403);
  const outsider = await m.User.create({ username: 'outsider-' + key(), fullName: 'Outsider', passwordHash: 'unused',
    roleId: worker.roleId, warehouseIds: [] });
  assert.equal((await api('GET', `/goods-receipts/purchase/${purchase._id}`, outsider)).status, 403);

  const createBody = { operationKey: key(), warehouseId: String(warehouse._id), reason: 'Bổ sung tồn có chứng cứ',
    lines: [{ productId: String(product._id), lotId: String(batch._id), enteredUnit: 'Viên', enteredQty: '4',
      destinationLocationId: String(location._id), qualityCode: 'GOOD' }] };
  const created = await api('POST', '/goods-receipts/other', worker, createBody);
  assert.equal(created.status, 200, JSON.stringify(created.body));
  let receipt = await m.OtherGoodsReceipt.findById(created.body.data.id);
  assert.equal(receipt.documentKind, 'OTHER');
  const editPath = '/goods-receipts/other/' + encodeURIComponent(receipt._id);
  const draft = { expectedVersion: 1, operationKey: key(), reason: 'Lý do cập nhật', note: 'Ghi chú mới', originalReceiptId: null, lines: createBody.lines };
  const edited = await api('PUT', editPath, worker, draft);
  assert.equal(edited.status, 200, JSON.stringify(edited.body));
  assert.equal(edited.body.data.version, 2);
  assert.equal((await api('PUT', editPath, worker, draft)).body.data.replayed, true);
  assert.equal((await api('PUT', editPath, worker, { ...draft, operationKey: key() })).status, 409);
  assert.equal((await api('PUT', editPath, outsider, { ...draft, expectedVersion: 2, operationKey: key() })).status, 403);
  const generic = await api('GET', '/goods-receipts/' + encodeURIComponent(receipt._id), worker);
  assert.equal(generic.status, 200, JSON.stringify(generic.body));
  assert.equal(generic.body.data.header.reason, draft.reason);
  assert.equal(generic.body.data.items[0]._id, String(receipt.items[0]._id));
  const listedOther = (await api('GET', '/goods-receipts?kind=OTHER&warehouseId=' + warehouse._id, worker)).body.data.items[0];
  assert.equal(listedOther.totalQtyBase, '4');
  assert.deepEqual(listedOther.totalsByBaseUnit, [{ unit: 'Viên', quantity: '4' }]);
  receipt = await m.OtherGoodsReceipt.findById(receipt._id);
  const attachment = await m.Attachment.create({ ownerDocumentType: 'goods_receipts', ownerDocumentId: receipt._id,
    purpose: 'TEST_EVIDENCE', originalName: 'proof.png', mediaType: 'image/png', sizeBytes: 100,
    storageKey: 'isolated-test/' + key(), checksum: 'a'.repeat(64), uploadedBy: worker._id, uploadedAt: new Date(),
    accessCategory: 'BUSINESS', status: 'ATTACHED' });
  receipt.evidenceIds.addToSet(attachment._id); await receipt.save();
  const submit = await api('POST', `/goods-receipts/other/${receipt._id}/submit`, worker, { expectedVersion: 2, operationKey: key() });
  assert.equal(submit.status, 200, JSON.stringify(submit.body));
  assert.equal((await api('PUT', editPath, worker, { ...draft, expectedVersion: 3, operationKey: key() })).status, 400);
  assert.equal((await api('POST', `/goods-receipts/other/${receipt._id}/approve`, worker,
    { expectedVersion: 3, operationKey: key(), decision: 'APPROVE', reason: 'Duyệt' })).status, 403);
  const approved = await api('POST', `/goods-receipts/other/${receipt._id}/approve`, owner,
    { expectedVersion: 3, operationKey: key(), decision: 'APPROVE', reason: 'Duyệt' });
  assert.equal(approved.status, 200, JSON.stringify(approved.body));
  const postBody = { expectedVersion: 4, operationKey: key() };
  const posted = await api('POST', `/goods-receipts/other/${receipt._id}/post`, worker, postBody);
  assert.equal(posted.status, 200, JSON.stringify(posted.body));
  assert.equal((await api('POST', `/goods-receipts/other/${receipt._id}/post`, worker, postBody)).body.data.replayed, true);
  receipt = await m.OtherGoodsReceipt.findById(receipt._id);
  const transaction = await m.StockTransaction.findById(receipt.stockTransactionId);
  const targetId = transaction.movements[0].toBalanceId;
  assert.equal(String((await m.InventoryBalance.findById(targetId)).quantityBase), '4');
  const dependencyId = id();
  await m.TransferOrder.collection.insertOne({ _id: dependencyId, workflowStatus: 'OPEN',
    sources: [{ subjectCollection: 'goods_receipts', documentId: receipt._id }] });
  const blocked = await api('GET', `/goods-receipts/other/${receipt._id}/reversal-preflight`, worker);
  assert.equal(blocked.body.data.eligible, false);
  assert.match(blocked.body.data.reason, /chứng từ phụ thuộc/);
  await m.TransferOrder.collection.deleteOne({ _id: dependencyId });
  const reversed = await api('POST', `/goods-receipts/other/${receipt._id}/reverse`, worker,
    { expectedVersion: 5, operationKey: key(), reason: 'Ghi nhầm', evidenceIds: [String(attachment._id)] });
  assert.equal(reversed.status, 200, JSON.stringify(reversed.body));
  assert.equal(String((await m.InventoryBalance.findById(targetId)).quantityBase), '0');
  assert.equal((await m.OtherGoodsReceipt.findById(receipt._id)).workflowStatus, 'REVERSED');
  const replacement = await api('POST', '/goods-receipts/other', worker,
    { operationKey: key(), warehouseId: String(warehouse._id), originalReceiptId: String(receipt._id), reason: 'Thay phiếu', note: 'Sửa diễn giải' });
  assert.equal(replacement.status, 200, JSON.stringify(replacement.body));
  let replacementDoc = await m.OtherGoodsReceipt.findById(replacement.body.data.id);
  const proof2 = await m.Attachment.create({ ownerDocumentType: 'goods_receipts', ownerDocumentId: replacementDoc._id,
    purpose: 'TEST_EVIDENCE', originalName: 'proof.png', mediaType: 'image/png', sizeBytes: 100,
    storageKey: 'isolated-test/' + key(), checksum: 'b'.repeat(64), uploadedBy: worker._id, uploadedAt: new Date(),
    accessCategory: 'BUSINESS', status: 'ATTACHED' });
  replacementDoc.evidenceIds.addToSet(proof2._id); await replacementDoc.save();
  const replacementSubmit = await api('POST', `/goods-receipts/other/${replacementDoc._id}/submit`, worker,
    { expectedVersion: 1, operationKey: key() });
  assert.equal(replacementSubmit.status, 200, JSON.stringify(replacementSubmit.body));
  replacementDoc = await m.OtherGoodsReceipt.findById(replacementDoc._id);
  assert.equal(replacementDoc.workflowStatus, 'APPROVED');
  assert.equal((await api('POST', `/goods-receipts/other/${replacementDoc._id}/post`, worker,
    { expectedVersion: 2, operationKey: key() })).status, 200);
  const replacedReverse = await api('POST', `/goods-receipts/other/${replacementDoc._id}/reverse`, worker,
    { expectedVersion: 3, operationKey: key(), reason: 'Điều chỉnh lượng', evidenceIds: [String(proof2._id)] });
  assert.equal(replacedReverse.status, 200, JSON.stringify(replacedReverse.body));
  const changed = await api('POST', '/goods-receipts/other', worker,
    { ...createBody, operationKey: key(), originalReceiptId: String(replacementDoc._id),
      lines: [{ ...createBody.lines[0], enteredQty: '8' }] });
  assert.equal(changed.status, 200, JSON.stringify(changed.body));
  let changedDoc = await m.OtherGoodsReceipt.findById(changed.body.data.id);
  const proof3 = await m.Attachment.create({ ownerDocumentType: 'goods_receipts', ownerDocumentId: changedDoc._id,
    purpose: 'TEST_EVIDENCE', originalName: 'proof.png', mediaType: 'image/png', sizeBytes: 100,
    storageKey: 'isolated-test/' + key(), checksum: 'c'.repeat(64), uploadedBy: worker._id, uploadedAt: new Date(),
    accessCategory: 'BUSINESS', status: 'ATTACHED' });
  changedDoc.evidenceIds.addToSet(proof3._id); await changedDoc.save();
  assert.equal((await api('POST', `/goods-receipts/other/${changedDoc._id}/submit`, worker,
    { expectedVersion: 1, operationKey: key() })).status, 200);
  changedDoc = await m.OtherGoodsReceipt.findById(changedDoc._id);
  assert.equal(changedDoc.workflowStatus, 'PENDING_APPROVAL');
  assert.equal((await api('POST', `/goods-receipts/other/${changedDoc._id}/post`, worker,
    { expectedVersion: 2, operationKey: key() })).status, 400);
  assert.equal((await api('POST', `/goods-receipts/other/${changedDoc._id}/approve`, owner,
    { expectedVersion: 2, operationKey: key(), decision: 'APPROVE', reason: 'Duyệt lượng mới' })).status, 200);
  assert.equal((await api('POST', `/goods-receipts/other/${changedDoc._id}/post`, worker,
    { expectedVersion: 3, operationKey: key() })).status, 200);
  assert.equal(String((await m.InventoryBalance.findById(targetId)).quantityBase), '8');
});
