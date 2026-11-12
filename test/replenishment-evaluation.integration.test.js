import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import { evaluateLines } from '../src/modules/replenishments/replenishment.evaluation.js';
import { PERMISSION_CATALOGUE } from '../src/seeds/data/permissions.data.js';

const enabled = process.env.RUN_NATIVE_API_TESTS === '1';
const id = () => new mongoose.Types.ObjectId();
let user, warehouse, otherWarehouse, product, batch, storage;
const date = '2026-12-01';
const item = (qty = '20', extra = {}) => ({ _id: id(), lineNo: 1, lineKind: 'STANDARD', productId: product._id,
  enteredUnit: 'PIECE', baseUnitSnapshot: 'PIECE', baseUnitsPerUnit: '1', enteredQty: qty, qtyBase: qty, productNameSnapshot: 'Test tile', ...extra });
const sourceLine = order => ({ productId: String(product._id), source: { triggerType: 'SALES_SHORTAGE', documentType: 'sales_orders', documentId: String(order._id), itemId: String(order.items[0]._id), version: order.version } });
const evaluate = (lines, extra = {}) => evaluateLines(user, { warehouseId: String(warehouse._id), neededOn: date, lines, ...extra });

test.before(async () => {
  if (!enabled) return;
  await mongoose.connect('mongodb://127.0.0.1:27017/wmsd_replenishment_eval_test_' + id() + '?replicaSet=rs0', { serverSelectionTimeoutMS: 5000 });
  for (const Model of m.models.values()) { await Model.createCollection(); await Model.createIndexes(); }
  await m.Uom.create({ code: 'PIECE', name: 'Viên' });
  const permissions = await m.Permission.insertMany(PERMISSION_CATALOGUE.map(p => ({ code: p.code, name: p.code, description: p.description })));
  const role = await m.Role.create({ code: 'OWNER', name: 'Test owner', permissionIds: permissions.map(p => p._id) });
  const record = await m.User.create({ username: 'eval-owner', fullName: 'Evaluation owner', passwordHash: 'test-unused', roleId: role._id, warehouseIds: [] });
  user = await m.User.findById(record._id).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
  warehouse = await m.Warehouse.create({ code: 'EVAL', name: 'Evaluation warehouse', lengthMm: '10000', widthMm: '10000', clearHeightMm: '3000' });
  otherWarehouse = await m.Warehouse.create({ code: 'EVAL2', name: 'Second evaluation warehouse', lengthMm: '10000', widthMm: '10000', clearHeightMm: '3000' });
  const category = await m.Category.create({ code: 'EVAL', name: 'Evaluation tiles' });
  product = await m.Product.create({ sku: 'EVAL', manufacturerCode: 'TEST', name: 'Test tile', categoryId: category._id, color: 'White', baseUnit: 'PIECE', wholeBaseUnits: true, lengthMm: '600', widthMm: '600', heightMm: '10', stockThresholds: [{ warehouseId: warehouse._id, minimumQty: '50', targetQty: '50' }] });
  batch = await m.ProductBatch.create({ productId: product._id, manufacturerLot: 'EVAL', identificationStatus: 'VERIFIED', piecesPerCarton: 4, cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50' });
  storage = await m.WarehouseLocation.create({ warehouseId: warehouse._id, code: 'ST', locationType: 'STORAGE', isPickable: true, usableLengthMm: '5000', usableWidthMm: '5000' });
});
test.after(async () => {
  if (!enabled) return;
  if (!mongoose.connection.name.startsWith('wmsd_replenishment_eval_test_')) throw Error('Unsafe test DB');
  await mongoose.connection.dropDatabase(); await mongoose.disconnect();
});
test.beforeEach(async () => {
  if (!enabled) return;
  // Only reset synthetic fixtures in this random, loopback-only test database.
  for (const Model of [
    m.ReplenishmentRequest, m.PurchaseOrder, m.PurchaseReceipt, m.StockHoldingPoint,
    m.InventoryBalance, m.SalesOrder, m.WarehouseIssueRequest, m.StockReservation,
    m.DefectReport, m.Stocktake, m.StocktakeLocationLock,
  ]) await Model.collection.deleteMany({});
});

async function order(qty = '20', neededOn = date) {
  return m.SalesOrder.create({ documentNo: 'SO-' + id(), workflowStatus: 'OPEN', version: 1, createdBy: user._id,
    header: { externalReferenceId: id(), customerId: id(), neededOn: new Date(neededOn), deliveryAddressSnapshot: 'Test address' }, items: [item(qty, { unitSellingPrice: '0', lineAmount: '0' })], orderAmount: '0', currencyCode: 'VND' });
}
async function stock(qty = '18', location = storage, ownership = 'STORE') {
  const point = await m.StockHoldingPoint.create({ type: 'LOCATION', locationId: location._id });
  return m.InventoryBalance.create({ holdingPointId: point._id, batchId: batch._id, ownerType: ownership, ownerId: ownership === 'STORE' ? null : id(), qualityStatus: 'GOOD', quantityBase: qty, version: 0 });
}
async function request(qty = '10', target = warehouse, status = 'APPROVED') {
  return m.ReplenishmentRequest.create({ documentNo: 'RR-' + id(), workflowStatus: status, version: 1, createdBy: user._id,
    header: { warehouseId: target._id, neededOn: new Date(date), triggerReason: 'Evaluation test', creationKey: String(id()) },
    items: [item(qty, { lineKind: 'REPLENISHMENT', approvedQtyBase: qty, details: {
      triggerType: 'MANUAL_OTHER', source: { triggerType: 'MANUAL_OTHER' }, evaluatedAt: new Date(),
    } })] });
}
async function purchase(rr, qty = '10', status = 'OPEN', expectedOn = date) {
  return m.PurchaseOrder.create({ documentNo: 'PO-' + id(), workflowStatus: status, version: 1, createdBy: user._id, replenishmentRequestId: rr._id,
    header: { warehouseId: rr.header.warehouseId, supplierId: id(), expectedOn: expectedOn ? new Date(expectedOn) : undefined },
    items: [item(qty, { requestItemId: rr.items[0]._id, unitPurchasePrice: '0', lineAmount: '0' })], totalAmount: '0', currency: 'VND' });
}

async function partialPurchase(expectedOn) {
  const rr = await request('20');
  const po = await purchase(rr, '20', 'PARTIAL', expectedOn);
  po.items[0].cancelledRemainderQtyBase = '2';
  await po.save();
  await m.PurchaseReceipt.create({
    documentNo: 'GR-' + id(), workflowStatus: 'POSTED', version: 1, createdBy: user._id,
    header: { warehouseId: warehouse._id, purchaseOrderId: po._id },
    items: [item('8', { purchaseOrderItemId: po.items[0]._id })],
  });
  await stock('8');
  return po;
}

const run = (name, fn) => test(name, { skip: !enabled }, fn);
const manual = (fields = {}) => ({ productId: String(product._id), ...fields });

run('stock below the configured minimum, with no open RR or PO, has no warnings', async () => {
  await stock('18');
  const [evaluation] = await evaluate([manual({ enteredQty: '1' })]);
  assert.deepEqual(evaluation.warnings, []);
  assert.equal(evaluation.warningRequired, false);
  assert.equal(evaluation.availableQtyBase, '18');
  assert.equal(evaluation.minimumQtyBase, '50');
  assert.equal(evaluation.targetQtyBase, '50');
  assert.equal(evaluation.pendingRequestQtyBase, '0');
  assert.equal(evaluation.incomingQtyBase, '0');
});

run('stock equal to the configured minimum warns for manual and sourced RR', async () => {
  await stock('50');
  const so = await order('1');
  const results = await evaluate([manual(), sourceLine(so)]);
  for (const row of results) {
    assert.deepEqual(row.warnings, ['STOCK_SUFFICIENT']);
    assert.equal(row.warningRequired, true);
  }
});

run('without a threshold the warning compares the entered quantity after conversion', async () => {
  const location = await m.WarehouseLocation.create({
    warehouseId: otherWarehouse._id, code: 'FALLBACK-ST', locationType: 'STORAGE',
    isPickable: true, usableLengthMm: '5000', usableWidthMm: '5000',
  });
  await stock('12', location);
  const uom = await m.Uom.create({ code: 'PACK', name: 'Gói' });
  await m.Conversion.create({ productId: product._id, uomId: uom._id, version: 1,
    basePerUnit: '4', validFrom: new Date('2020-01-01'), createdBy: user._id, verificationReference: 'Test pack' });
  const results = await evaluate([
    manual({ enteredUnit: 'PACK', enteredQty: '3' }),
    manual({ enteredUnit: 'PACK', enteredQty: '4' }),
    manual({ enteredUnit: 'PACK' }),
  ], { warehouseId: String(otherWarehouse._id) });
  assert.deepEqual(results.map((row) => row.warnings), [['STOCK_SUFFICIENT'], [], []]);
  assert.equal(results[0].minimumQtyBase, null);
  assert.equal(results[0].targetQtyBase, null);
});

run('a zero minimum does not warn on empty stock and falls back to the entered quantity', async () => {
  const zero = await m.Product.create({ sku: 'EVAL-ZERO', manufacturerCode: 'TEST', name: 'Zero minimum tile', categoryId: product.categoryId,
    color: 'White', baseUnit: 'PIECE', wholeBaseUnits: true, lengthMm: '600', widthMm: '600', heightMm: '10',
    stockThresholds: [{ warehouseId: warehouse._id, minimumQty: '0', targetQty: '0' }] });
  let [evaluation] = await evaluate([{ productId: String(zero._id), enteredQty: '5' }]);
  assert.deepEqual(evaluation.warnings, []);
  assert.equal(evaluation.minimumQtyBase, '0');
  const zeroBatch = await m.ProductBatch.create({ productId: zero._id, manufacturerLot: 'EVAL-ZERO', identificationStatus: 'VERIFIED',
    piecesPerCarton: 4, cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50' });
  const point = await m.StockHoldingPoint.create({ type: 'LOCATION', locationId: storage._id });
  await m.InventoryBalance.create({ holdingPointId: point._id, batchId: zeroBatch._id, ownerType: 'STORE', ownerId: null,
    qualityStatus: 'GOOD', quantityBase: '5', version: 0 });
  [evaluation] = await evaluate([{ productId: String(zero._id), enteredQty: '5' }]);
  assert.deepEqual(evaluation.warnings, ['STOCK_SUFFICIENT']);
  [evaluation] = await evaluate([{ productId: String(zero._id), enteredQty: '6' }]);
  assert.deepEqual(evaluation.warnings, []);
});

run('open request warning counts only other active same-warehouse requests and remaining approval', async () => {
  const draft = await request('2', warehouse, 'DRAFT');
  const submitted = await request('3', warehouse, 'SUBMITTED');
  const approved = await request('10');
  await request('90', otherWarehouse, 'DRAFT');
  await request('90', warehouse, 'REVISION_REQUIRED');
  const options = { requestId: String(draft._id) };
  let [evaluation] = await evaluate([manual()], options);
  assert.deepEqual(evaluation.warnings, ['OPEN_REQUEST']);
  assert.equal(evaluation.pendingRequestQtyBase, '13');
  assert.deepEqual(evaluation.relatedRequests.map((row) => row.id).sort(),
    [String(submitted._id), String(approved._id)].sort());
  const po = await purchase(approved, '6', 'DRAFT');
  [evaluation] = await evaluate([manual()], options);
  assert.equal(evaluation.pendingRequestQtyBase, '13');
  po.workflowStatus = 'OPEN';
  await po.save();
  [evaluation] = await evaluate([manual()], options);
  assert.equal(evaluation.pendingRequestQtyBase, '7');
  po.items[0].enteredQty = '10';
  po.items[0].qtyBase = '10';
  await po.save();
  [evaluation] = await evaluate([manual()], options);
  assert.equal(evaluation.pendingRequestQtyBase, '3');
  assert.equal(evaluation.relatedRequests.length, 1);
  const [editingApproved] = await evaluate([manual()], { requestId: String(approved._id) });
  assert.equal(editingApproved.incomingQtyBase, '0');
});

run('incoming PO warning uses posted receipts and cancelled remainder regardless of expected date', async () => {
  const po = await partialPurchase('2026-12-09');
  const open = await purchase(await request('4'), '4', 'OPEN', null);
  await purchase(await request('60', otherWarehouse), '60', 'OPEN');
  await purchase(await request('50'), '50', 'COMPLETED');
  await purchase(await request('40'), '40', 'CLOSED');
  await m.PurchaseReceipt.create({
    documentNo: 'GR-DRAFT-' + id(), workflowStatus: 'DRAFT', version: 1, createdBy: user._id,
    header: { warehouseId: warehouse._id, purchaseOrderId: po._id },
    items: [item('2', { purchaseOrderItemId: po.items[0]._id })],
  });
  const [evaluation] = await evaluate([manual()]);
  assert.deepEqual(evaluation.warnings, ['INCOMING_PO']);
  assert.equal(evaluation.incomingQtyBase, '14');
  assert.deepEqual(evaluation.incomingPurchaseOrders.sort((a, b) => a.id.localeCompare(b.id)), [
    { id: String(po._id), documentNo: po.documentNo, workflowStatus: 'PARTIAL',
      expectedOn: '2026-12-09T00:00:00.000Z', outstandingQtyBase: '10' },
    { id: String(open._id), documentNo: open.documentNo, workflowStatus: 'OPEN',
      expectedOn: null, outstandingQtyBase: '4' },
  ].sort((a, b) => a.id.localeCompare(b.id)));
});

run('source references are verified without computing demand from the document', async () => {
  const so = await order('1');
  const [evaluation] = await evaluate([sourceLine(so)]);
  assert.deepEqual(evaluation.warnings, []);
  assert.deepEqual(evaluation.source, {
    ...sourceLine(so).source,
    salesOrderId: String(so._id),
    salesOrderItemId: String(so.items[0]._id),
    salesOrderVersion: so.version,
  });

  const otherProduct = await m.Product.create({
    sku: 'EVAL-OTHER', manufacturerCode: 'TEST', name: 'Other tile',
    categoryId: product.categoryId, color: 'White', baseUnit: 'PIECE',
    lengthMm: '600', widthMm: '600', heightMm: '10',
  });
  await assert.rejects(evaluate([{ ...sourceLine(so), productId: String(otherProduct._id) }]),
    (error) => error.statusCode === 400 && /không khớp/.test(error.message));

  const countId = id();
  await m.Stocktake.collection.insertOne({ _id: countId, documentKind: 'STOCKTAKE',
    workflowStatus: 'COMPLETED', version: 1, createdBy: user._id,
    header: { warehouseId: otherWarehouse._id, completedAt: new Date() }, items: [item()] });
  const count = manual({ source: { triggerType: 'STOCKTAKE_LOW_STOCK', documentType: 'stocktakes',
    documentId: String(countId), version: 1 } });
  await assert.rejects(evaluate([count]), (error) => error.statusCode === 400 && /không thuộc kho/.test(error.message));
  const [fromCount] = await evaluate([count], { warehouseId: String(otherWarehouse._id) });
  assert.deepEqual(fromCount.source, count.source);
});

run('available stock excludes reservations, defect holds, locked storage and receiving stock', async () => {
  const so = await order();
  const balance = await stock('60');
  const receiving = await m.WarehouseLocation.create({
    warehouseId: warehouse._id, code: 'IN', locationType: 'RECEIVING',
    usableLengthMm: '5000', usableWidthMm: '5000',
  });
  await stock('90', receiving);
  await m.StockReservation.create({
    demandRef: { documentType: 'sales_orders', documentId: so._id, itemId: so.items[0]._id },
    balanceId: balance._id, reservedQty: '6', creationKey: String(id()), createdBy: user._id,
  });
  let [evaluation] = await evaluate([sourceLine(so)]);
  assert.equal(evaluation.availableQtyBase, '54');
  assert.deepEqual(evaluation.warnings, ['STOCK_SUFFICIENT']);
  await m.DefectReport.collection.insertOne({ holds: [{ status: 'ACTIVE', events: [],
    allocations: [{ balanceId: balance._id, quantityBase: mongoose.Types.Decimal128.fromString('5') }],
  }] });
  [evaluation] = await evaluate([sourceLine(so)]);
  assert.equal(evaluation.availableQtyBase, '49');
  assert.deepEqual(evaluation.warnings, []);
  await m.StocktakeLocationLock.collection.insertOne({ locationId: storage._id, status: 'LOCKED' });
  [evaluation] = await evaluate([sourceLine(so)]);
  assert.equal(evaluation.availableQtyBase, '0');
  assert.deepEqual(evaluation.warnings, []);
});

run('WIR sources resolve to their sales order line and reject inactive or mismatched references', async () => {
  const so = await order('5');
  const wirId = id(), wirItemId = id();
  const insertWir = (status, extra = {}) => m.WarehouseIssueRequest.collection.insertOne({
    _id: wirId, documentKind: 'ISSUE_REQUEST', workflowStatus: status, version: 3, createdBy: user._id,
    header: { requestedWarehouseId: warehouse._id },
    items: [{ _id: wirItemId, lineNo: 1, productId: product._id,
      sources: [{ _id: id(), subjectCollection: 'sales_orders', documentId: so._id, itemId: so.items[0]._id }], ...extra }],
  });
  const wirLine = (documentId = String(wirId), itemId = String(wirItemId)) => manual({ source: {
    triggerType: 'SALES_SHORTAGE', documentType: 'warehouse_issue_requests', documentId, itemId, version: 1,
  } });

  await assert.rejects(evaluate([wirLine(String(id()))]), (error) => error.statusCode === 404 && /WIR/.test(error.message));
  await insertWir('CANCELLED');
  await assert.rejects(evaluate([wirLine()]), (error) => error.statusCode === 409 && /WIR không còn hiệu lực/.test(error.message));
  await m.WarehouseIssueRequest.collection.deleteMany({});
  await insertWir('OPEN');
  await assert.rejects(evaluate([wirLine(String(wirId), String(id()))]), (error) => error.statusCode === 400 && /Dòng WIR/.test(error.message));

  const [evaluation] = await evaluate([wirLine()]);
  assert.equal(evaluation.source.version, 3);
  assert.equal(evaluation.source.salesOrderId, String(so._id));
  assert.equal(evaluation.source.salesOrderItemId, String(so.items[0]._id));
  assert.equal(evaluation.source.salesOrderVersion, so.version);

  await assert.rejects(evaluate([manual({ source: { triggerType: 'SALES_SHORTAGE', documentType: 'stocktakes',
    documentId: String(so._id), itemId: String(so.items[0]._id), version: 1 } })]),
  (error) => error.statusCode === 400 && /chứng từ nguồn bán/.test(error.message));
  await assert.rejects(evaluate([manual({ source: { triggerType: 'UNKNOWN' } })]),
    (error) => error.statusCode === 400 && /chưa được hỗ trợ/.test(error.message));
});

run('a completed sales order no longer qualifies as a shortage source', async () => {
  const so = await order('5');
  await m.SalesOrder.updateOne({ _id: so._id }, { $set: { workflowStatus: 'COMPLETED' } });
  await assert.rejects(evaluate([sourceLine(so)]),
    (error) => error.statusCode === 409 && /SO không còn hiệu lực/.test(error.message));
  await assert.rejects(evaluate([{ ...sourceLine(so), source: { ...sourceLine(so).source, documentId: String(id()) } }]),
    (error) => error.statusCode === 404 && /nguồn SO/.test(error.message));
});

run('stocktake sources must be closed and contain the requested product', async () => {
  const countId = id();
  const insertCount = (fields) => m.Stocktake.collection.insertOne({ _id: countId, documentKind: 'STOCKTAKE',
    version: 2, createdBy: user._id, items: [], ...fields });
  const line = manual({ source: { triggerType: 'STOCKTAKE_LOW_STOCK', documentType: 'stocktakes',
    documentId: String(countId), version: 1 } });

  await assert.rejects(evaluate([line]), (error) => error.statusCode === 404 && /kiểm kê/.test(error.message));
  await insertCount({ workflowStatus: 'IN_PROGRESS', header: { warehouseId: warehouse._id } });
  await assert.rejects(evaluate([line]), (error) => error.statusCode === 409 && /đã chốt/.test(error.message));
  await m.Stocktake.collection.deleteMany({});
  await insertCount({ workflowStatus: 'COMPLETED', header: { warehouseId: warehouse._id, completedAt: new Date() } });
  await assert.rejects(evaluate([line]), (error) => error.statusCode === 400 && /ngữ cảnh kiểm kê/.test(error.message));

  await m.StocktakeSnapshot.collection.insertOne({ stocktakeId: countId, batchId: batch._id });
  const [evaluation] = await evaluate([line]);
  assert.equal(evaluation.source.version, 2);
  await m.StocktakeSnapshot.collection.deleteMany({});
});

run('stock in warehouses outside the user scope is totalled but not offered', async () => {
  const permissions = await m.Permission.find({});
  const role = await m.Role.create({ code: 'ACCOUNTANT', name: 'Scoped accountant ' + id(), permissionIds: permissions.map((p) => p._id) });
  const record = await m.User.create({ username: 'eval-scoped-' + id(), fullName: 'Scoped', passwordHash: 'test-unused',
    roleId: role._id, warehouseIds: [warehouse._id] });
  const scoped = await m.User.findById(record._id).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
  const otherStorage = await m.WarehouseLocation.create({ warehouseId: otherWarehouse._id, code: 'ST2-' + id(),
    locationType: 'STORAGE', isPickable: true, usableLengthMm: '5000', usableWidthMm: '5000' });
  await stock('7', otherStorage);

  const [restricted] = await evaluateLines(scoped, { warehouseId: String(warehouse._id), neededOn: date, lines: [manual()] });
  assert.equal(restricted.otherWarehouseAvailableQtyBase, '7');
  assert.equal(restricted.restrictedOtherWarehouseQtyBase, '7');
  assert.deepEqual(restricted.otherWarehouseOptions, []);

  const [visible] = await evaluate([manual()]);
  assert.equal(visible.restrictedOtherWarehouseQtyBase, '0');
  assert.deepEqual(visible.otherWarehouseOptions, [{ warehouseId: String(otherWarehouse._id), qtyBase: '7' }]);
});
