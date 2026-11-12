import test from 'node:test';
let app;
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import * as m from '../src/models/runtime.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';
import * as sales from '../src/modules/sales-orders/sales-execution.service.js';
import { createSalesOrder } from '../src/modules/sales-orders/sales-create.service.js';
import { getOutboundDelivery, getSalesOrder } from '../src/modules/sales-orders/sales-read.service.js';
import { closeStocktake, approvalContent } from '../src/modules/stocktake-closure/stocktake-closure.service.js';
import { operationalReport } from '../src/modules/operational-reports/operational-reports.service.js';
import { newId } from '../src/shared/utils/document-command.js';
import { exact } from '../src/models/model-utils.js';
const enabled = process.env.RUN_HIEUDT_TESTS === '1';
const run = (name, fn) => test(name, { skip: !enabled }, fn);
const key = () => String(newId());
let owner, worker, seller, warehouse, storage, staging, product, batch, balance, customer, so, wir, od, pick;
test.before(async () => {
    if (!enabled)
        return;
    process.env.JWT_SECRET = 'isolated-hieudt-test-secret';
    app = (await import('../src/app.js')).default;
    await mongoose.connect('mongodb://127.0.0.1:27018/hieudt_test_' + key() + '?replicaSet=hieudt-test', { serverSelectionTimeoutMS: 5000 });
    for (const Model of m.models.values()) {
        await Model.createCollection();
        await Model.createIndexes();
    }
    const permissions = await m.Permission.insertMany(PERMISSION_CATALOGUE.map(p => ({ code: p.code, name: p.code, description: p.description })));
    warehouse = await m.Warehouse.create({ code: 'TEST', name: 'Test', lengthMm: '10000', widthMm: '10000', clearHeightMm: '3000' });
    const users = [];
    for (const code of ['OWNER', 'WAREHOUSE', 'SALES']) {
        const role = await m.Role.create({ code, name: code, permissionIds: permissions.filter(p => ROLE_PERMISSIONS[code].includes(p.code)).map(p => p._id) });
        const u = await m.User.create({ username: code.toLowerCase(), fullName: code, passwordHash: 'unused', roleId: role._id, warehouseIds: [warehouse._id] });
        users.push(await m.User.findById(u._id).populate({ path: 'roleId', populate: { path: 'permissionIds' } }));
    }
    [owner, worker, seller] = users;
    await m.Uom.create({ code: 'PIECE', name: 'Viên' });
    await m.Uom.create({ code: 'BOX', name: 'Thùng' });
    const category = await m.Category.create({ code: 'TILE', name: 'Tile' });
    product = await m.Product.create({ sku: 'TEST', name: 'Tile', manufacturerCode: 'TEST', categoryId: category._id, color: 'White', baseUnit: 'PIECE', wholeBaseUnits: true, lengthMm: '600', widthMm: '600', heightMm: '10' });
    batch = await m.ProductBatch.create({ productId: product._id, manufacturerLot: 'B1', identificationStatus: 'VERIFIED', piecesPerCarton: 4, cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50' });
    storage = await m.WarehouseLocation.create({ warehouseId: warehouse._id, code: 'ST', locationType: 'STORAGE', isPickable: true, usableLengthMm: '5000', usableWidthMm: '5000' });
    staging = await m.WarehouseLocation.create({ warehouseId: warehouse._id, code: 'OUT', locationType: 'STAGING', usableLengthMm: '5000', usableWidthMm: '5000' });
    const point = await m.StockHoldingPoint.create({ type: 'LOCATION', locationId: storage._id });
    balance = await m.InventoryBalance.create({ holdingPointId: point._id, batchId: batch._id, qualityStatus: 'GOOD', ownerType: 'STORE', quantityBase: '12', version: 1, packagingPortions: [{ packagingState: 'SEALED', sealedPackCount: 3, quantityBase: '12', packagingSnapshot: { packageUnit: 'BOX', baseUnitsPerPackage: '4', outerLengthMm: '620', outerWidthMm: '620', outerHeightMm: '50' }, createdBy: worker._id }] });
    customer = await m.Customer.create({ code: 'CUS', name: 'Customer', phone: '0900000000' });
});
test.after(async () => { if (enabled && mongoose.connection.readyState) {
    assert.match(mongoose.connection.name, /^hieudt_test_[a-f0-9]+$/);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
} });
run('SO creation/source uniqueness, WIR, OD reservation, partial picking and retry preserve stock', async () => {
    const evidenceReceipt = jwt.sign({ actorId: String(seller._id), storageKey: 'sep490/sales-source/test', checksum: 'a'.repeat(64), mediaType: 'image/png', sizeBytes: 12, originalName: 'source.png' }, process.env.JWT_SECRET, { audience: 'sales-source-evidence', expiresIn: '1h' });
    const body = { idempotencyKey: key(), customerId: String(customer._id), neededOn: '2026-12-01T00:00:00Z', deliveryAddress: 'Test address', currencyCode: 'VND', evidenceReceipt, source: { sourceSystem: 'PAPER', referenceNo: 'TEST-SO' }, lines: [{ sourceLineKey: '1', productId: String(product._id), lotId: String(batch._id), enteredUnit: 'PIECE', quantity: '12', unitSellingPrice: '1000' }] };
    const created = await createSalesOrder(seller, body);
    assert.equal((await createSalesOrder(seller, body)).replayed, true);
    await assert.rejects(createSalesOrder(seller, { ...body, idempotencyKey: key() }));
    so = await m.SalesOrder.findById(created.id);
    const request = await sales.createIssueRequest(seller, so._id, { idempotencyKey: key(), expectedVersion: so.version, warehouseId: String(warehouse._id), neededOn: body.neededOn, lines: [{ lineId: String(so.items[0]._id), qtyBase: '8' }] });
    wir = await m.WarehouseIssueRequest.findById(request.id);
    const deliveryBody = { idempotencyKey: key(), expectedVersion: wir.version, issueRequestId: String(wir._id), warehouseId: String(warehouse._id), plannedOn: body.neededOn, recipientName: 'Recipient', recipientPhone: '0900000000', deliveryAddress: 'Test', lines: [{ lineId: String(wir.items[0]._id), sourceBalanceId: String(balance._id), sourceBalanceVersion: balance.version, qtyBase: '8' }] };
    const delivery = await sales.createDelivery(seller, deliveryBody);
    assert.equal((await sales.createDelivery(seller, deliveryBody)).replayed, true);
    od = await m.DeliveryOrder.findById(delivery.id);
    assert.equal(String((await m.InventoryBalance.findById(balance._id)).quantityBase), '12');
    const reservation = await m.StockReservation.findOne({ 'executionRef.documentId': od._id });
    const task = await sales.createPicking(worker, od._id, { idempotencyKey: key(), expectedVersion: od.version, lines: [{ reservationId: String(reservation._id), qtyBase: '8', toLocationId: String(staging._id) }] });
    pick = await m.TransferOrder.findById(task.id);
    const partial = { idempotencyKey: key(), expectedVersion: pick.version, lines: [{ lineId: String(pick.items[0]._id), qtyBase: '4' }] };
    await sales.confirmPicking(worker, pick._id, partial);
    assert.equal((await sales.confirmPicking(worker, pick._id, partial)).replayed, true);
    pick = await m.TransferOrder.findById(pick._id);
    assert.equal(pick.workflowStatus, 'PARTIAL');
    await sales.confirmPicking(worker, pick._id, { ...partial, idempotencyKey: key(), expectedVersion: pick.version });
    pick = await m.TransferOrder.findById(pick._id);
    assert.equal(pick.workflowStatus, 'CONFIRMED');
    assert.equal(await m.StockTransaction.countDocuments({ operation: 'SALES_PICK' }), 2);
    assert.equal((await m.InventoryBalance.find()).reduce((s, b) => s.plus(String(b.quantityBase)), exact('0')).toFixed(), '12');
    assert.equal(await m.StockTransaction.countDocuments({ sourceType: 'sales_goods_issues' }), 0);
    const detail = await getOutboundDelivery(worker, od._id);
    assert.equal(detail.items[0].grossIssuedQtyBase, '0');
    assert.equal(detail.goodsIssues[0].salePriceSnapshot, undefined);
    const taskDetail = await sales.getPicking(worker, pick._id);
    const salesDetail = await getSalesOrder(seller, so._id);
    assert.equal(salesDetail.goodsIssues[0].workflowStatus, 'PICKED');
    assert.equal(salesDetail.tasks[0].id, String(pick._id));
    assert.deepEqual(salesDetail.deliveryConfirmations, []);
    assert.equal(taskDetail.items[0].actualQtyBase, '8');
    assert.equal(taskDetail.issue.items[0].salePriceSnapshot, undefined);
});
run('SO remainder rejects committed reductions, stale versions, wrong actor and over-cancellation', async () => {
    so = await m.SalesOrder.findById(so._id);
    const change = { idempotencyKey: key(), expectedVersion: so.version, reason: 'Customer change', lines: [{ lineId: String(so.items[0]._id), quantity: '4' }] };
    await assert.rejects(sales.updateSalesOrder(seller, so._id, change));
    await assert.rejects(sales.updateSalesOrder(worker, so._id, { ...change, lines: [{ lineId: String(so.items[0]._id), quantity: '16' }] }));
    await sales.updateSalesOrder(seller, so._id, { ...change, lines: [{ lineId: String(so.items[0]._id), quantity: '16' }] });
    await assert.rejects(sales.updateSalesOrder(seller, so._id, { ...change, idempotencyKey: key() }));
    so = await m.SalesOrder.findById(so._id);
    const cancel = { idempotencyKey: key(), expectedVersion: so.version, reason: 'Customer cancelled', lines: [{ lineId: String(so.items[0]._id), qtyBase: '8' }] };
    await sales.cancelSalesRemainder(seller, so._id, cancel);
    assert.equal((await sales.cancelSalesRemainder(seller, so._id, cancel)).replayed, true);
    so = await m.SalesOrder.findById(so._id);
    assert.equal(so.cancellations.length, 1);
    await assert.rejects(sales.cancelSalesRemainder(seller, so._id, { ...cancel, idempotencyKey: key(), expectedVersion: so.version }));
});
async function stocktakeFixture(counted, source = balance, location = storage) {
    const b = await m.InventoryBalance.findById(source._id), now = new Date();
    const st = await m.Stocktake.create({ documentNo: 'ST-' + key(), workflowStatus: 'COUNTING', version: 1, createdBy: owner._id, header: { warehouseId: warehouse._id, scopeLocationIds: [location._id], scopeVersion: 1, cutoffAt: now, assignedCounterIds: [worker._id] } });
    await m.StocktakeLocationLock.create({ stocktakeId: st._id, scopeVersion: 1, locationId: location._id, lockedAt: now, lockedBy: worker._id, status: 'LOCKED', version: 1 });
    const snapshot = await m.StocktakeSnapshot.create({ stocktakeId: st._id, scopeVersion: 1, cutoffAt: now, capturedAt: now, sourceBalanceId: b._id, sourceBalanceVersion: b.version, locationId: location._id, batchId: batch._id, ownerType: 'STORE', qualityStatus: 'GOOD', bookQtyBase: String(b.quantityBase), baseUnitSnapshot: 'PIECE', origin: 'BOOK' });
    const count = await m.StocktakeCount.create({ stocktakeId: st._id, scopeVersion: 1, locationId: location._id, targetType: 'STOCK', snapshotId: snapshot._id, attemptNo: 1, quantityEntries: [{ enteredQty: counted, enteredUnit: 'PIECE', baseUnitsPerUnit: '1', quantityBase: counted }], countedQtyBase: counted, baseUnitSnapshot: 'PIECE', countedBy: worker._id, countedAt: now, recordedAt: now });
    // Close requires a completed reconciliation, as produced by the reconcile command.
    st.header.selectedCounts = [{ snapshotId: snapshot._id, countId: count._id }];
    st.header.lastReconciledBy = worker._id;
    st.header.lastReconciledAt = now;
    await st.save();
    return { st, snapshot, count, b };
}
run('zero-difference closure requires actual counts, writes no zero adjustment and retries safely', async () => {
    const { st, snapshot, count } = await stocktakeFixture('4');
    const body = { idempotencyKey: key(), expectedVersion: 1, reason: 'Matched', selectedCounts: [{ snapshotId: String(snapshot._id), countId: String(count._id) }] };
    await assert.rejects(closeStocktake(worker, st._id, body));
    await assert.rejects(closeStocktake(owner, st._id, { ...body, selectedCounts: [] }));
    await closeStocktake(owner, st._id, body);
    assert.equal((await closeStocktake(owner, st._id, body)).replayed, true);
    assert.equal(await m.StockAdjustment.countDocuments({}), 0);
    assert.equal(await m.StocktakeLocationLock.countDocuments({ stocktakeId: st._id, status: 'LOCKED' }), 0);
});
run('approved delta closure is atomic, verifies evidence/content and retains locks after failure', async () => {
    const { st, snapshot, count, b } = await stocktakeFixture('0');
    const planId = newId(), itemId = newId(), approvalId = newId(), now = new Date();
    const evidence = await m.Attachment.create({ ownerDocumentType: 'stocktakes', ownerDocumentId: st._id, purpose: 'EXECUTION', originalName: 'count.png', mediaType: 'image/png', sizeBytes: 12, storageKey: 'local-test', checksum: 'b'.repeat(64), uploadedBy: worker._id, uploadedAt: now, accessCategory: 'BUSINESS', status: 'ATTACHED' });
    st.resolutionPlans.push({ _id: planId, documentNo: 'PLAN-' + key(), workflowStatus: 'APPROVED', version: 1, createdBy: worker._id, header: { stocktakeId: st._id, planVersion: 1, scopeVersion: 1, approvalId, reason: 'Four missing' }, selectedCounts: [{ snapshotId: snapshot._id, countId: count._id }], items: [{ _id: itemId, lineNo: 1, lineKind: 'ST_RESOLUTION', productId: product._id, lotId: batch._id, enteredUnit: 'PIECE', baseUnitSnapshot: 'PIECE', baseUnitsPerUnit: '1', enteredQty: '4', qtyBase: '4', productNameSnapshot: 'Tile', details: { countId: count._id, actionKind: 'DELTA', fromBalanceId: b._id, deltaQty: '-4' } }], executionRecords: [{ itemId, performedBy: worker._id, performedAt: now, quantityBase: '4', evidenceIds: [evidence._id] }] });
    await st.save();
    await m.ApprovalHistory.create({ _id: approvalId, decisionKey: key(), subjectType: 'stocktake_resolution_plans', subjectId: planId, subjectRevision: 1, decisionScope: 'STOCKTAKE', reviewedContent: approvalContent(st.resolutionPlans.id(planId)), decision: 'APPROVE', reason: 'Verified', requestedBy: worker._id, decidedBy: owner._id, decidedAt: new Date(now.getTime() - 1000), recordedAt: now });
    const body = { idempotencyKey: key(), expectedVersion: 1, planId: String(planId), expectedPlanVersion: 2, reason: 'Close' };
    await assert.rejects(closeStocktake(owner, st._id, body));
    assert.equal(await m.StocktakeLocationLock.countDocuments({ stocktakeId: st._id, status: 'LOCKED' }), 1);
    assert.equal(String((await m.InventoryBalance.findById(b._id)).quantityBase), '4');
    await closeStocktake(owner, st._id, { ...body, expectedPlanVersion: 1 });
    assert.equal(String((await m.InventoryBalance.findById(b._id)).quantityBase), '0');
    assert.equal(await m.StockAdjustment.countDocuments({}), 1);
    assert.equal(await m.StocktakeLocationLock.countDocuments({ stocktakeId: st._id, status: 'LOCKED' }), 0);
});
run('reports read real inventory with warehouse scope and never expose prices', async () => {
    const report = await operationalReport(owner, { group: 'inventory' });
    assert.equal(report.rows.reduce((n, r) => n.plus(r.physicalQtyBase), exact('0')).toFixed(), '8');
    assert.equal(report.rows.reduce((n, r) => n.plus(r.reservedQtyBase), exact('0')).toFixed(), '8');
    const orders = await operationalReport(owner, { group: 'sales' });
    assert.equal(orders.rows.length, 1);
    assert.ok(!JSON.stringify(orders).includes('unitSellingPrice'));
    await assert.rejects(operationalReport(worker, { group: 'inventory', warehouseId: key() }));
});

async function extraSource(quantity) {
    const loc = await m.WarehouseLocation.create({ warehouseId: warehouse._id, code: key(), locationType: 'STORAGE', isPickable: true, usableLengthMm: '5000', usableWidthMm: '5000' });
    const point = await m.StockHoldingPoint.create({ type: 'LOCATION', locationId: loc._id });
    const stock = await m.InventoryBalance.create({ holdingPointId: point._id, batchId: batch._id, qualityStatus: 'GOOD', ownerType: 'STORE', quantityBase: quantity, version: 1, packagingPortions: [{ packagingState: 'SEALED', sealedPackCount: Number(quantity) / 4, quantityBase: quantity, packagingSnapshot: { packageUnit: 'BOX', baseUnitsPerPackage: '4', outerLengthMm: '620', outerWidthMm: '620', outerHeightMm: '50' }, createdBy: worker._id }] });
    const evidenceReceipt = jwt.sign({ actorId: String(seller._id), storageKey: 'sep490/sales-source/test', checksum: 'a'.repeat(64), mediaType: 'image/png', sizeBytes: 12, originalName: 'source.png' }, process.env.JWT_SECRET, { audience: 'sales-source-evidence', expiresIn: '1h' });
    const created = await createSalesOrder(seller, { idempotencyKey: key(), customerId: String(customer._id), neededOn: '2026-12-01T00:00:00Z', deliveryAddress: 'Test', currencyCode: 'VND', evidenceReceipt, source: { sourceSystem: 'PAPER', referenceNo: key() }, lines: [{ sourceLineKey: '1', productId: String(product._id), lotId: String(batch._id), enteredUnit: 'PIECE', quantity, unitSellingPrice: '1000' }] });
    const order = await m.SalesOrder.findById(created.id);
    const requested = await sales.createIssueRequest(seller, order._id, { idempotencyKey: key(), expectedVersion: order.version, warehouseId: String(warehouse._id), neededOn: '2026-12-01T00:00:00Z', lines: [{ lineId: String(order.items[0]._id), qtyBase: quantity }] });
    const request = await m.WarehouseIssueRequest.findById(requested.id);
    const deliveryBody = { idempotencyKey: key(), expectedVersion: request.version, issueRequestId: String(request._id), warehouseId: String(warehouse._id), plannedOn: '2026-12-01T00:00:00Z', recipientName: 'Recipient', recipientPhone: '0900000000', deliveryAddress: 'Test', lines: [{ lineId: String(request.items[0]._id), sourceBalanceId: String(stock._id), sourceBalanceVersion: stock.version, qtyBase: quantity }] };
    return { loc, stock, order, request, deliveryBody };
}

run('concurrent OD release cannot over-reserve; two picking tasks do not double-count their reservations', async () => {
    const { stock, deliveryBody } = await extraSource('8');
    const outcomes = await Promise.allSettled([sales.createDelivery(seller, deliveryBody), sales.createDelivery(seller, { ...deliveryBody, idempotencyKey: key() })]);
    assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
    const outcome = outcomes.find(r => r.status === 'fulfilled').value;
    let delivery = await m.DeliveryOrder.findById(outcome.id);
    const reservation = await m.StockReservation.findOne({ 'executionRef.documentId': delivery._id });
    const tasks = [];
    for (let i = 0; i < 2; i++) {
        const result = await sales.createPicking(worker, delivery._id, { idempotencyKey: key(), expectedVersion: delivery.version, lines: [{ reservationId: String(reservation._id), qtyBase: '4', toLocationId: String(staging._id) }] });
        tasks.push(await m.TransferOrder.findById(result.id));
        delivery = await m.DeliveryOrder.findById(delivery._id);
    }
    for (const task of tasks) await sales.confirmPicking(worker, task._id, { idempotencyKey: key(), expectedVersion: task.version, lines: [{ lineId: String(task.items[0]._id), qtyBase: '4' }] });
    assert.equal(String((await m.InventoryBalance.findById(stock._id)).quantityBase), '0');
    assert.equal(await m.TransferOrder.countDocuments({ _id: { $in: tasks.map(t => t._id) }, workflowStatus: 'CONFIRMED' }), 2);
});

run('freeze, fractional base quantities and wrong assignment reject picking without partial writes', async () => {
    const { loc, stock, deliveryBody } = await extraSource('4');
    await assert.rejects(sales.createDelivery(seller, { ...deliveryBody, lines: [{ ...deliveryBody.lines[0], qtyBase: '0.5' }] }), /đơn vị gốc/);
    const result = await sales.createDelivery(seller, deliveryBody);
    const delivery = await m.DeliveryOrder.findById(result.id), reservation = await m.StockReservation.findOne({ 'executionRef.documentId': delivery._id });
    const taskResult = await sales.createPicking(worker, delivery._id, { idempotencyKey: key(), expectedVersion: delivery.version, lines: [{ reservationId: String(reservation._id), qtyBase: '4', toLocationId: String(staging._id) }] });
    const task = await m.TransferOrder.findById(taskResult.id), body = { idempotencyKey: key(), expectedVersion: task.version, lines: [{ lineId: String(task.items[0]._id), qtyBase: '4' }] };
    const raw = await m.User.create({ username: key(), fullName: 'Other picker', passwordHash: 'unused', roleId: worker.roleId._id, warehouseIds: [warehouse._id] });
    const other = await m.User.findById(raw._id).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
    await assert.rejects(sales.confirmPicking(other, task._id, body), /người được giao/);
    const lock = await m.StocktakeLocationLock.create({ stocktakeId: newId(), scopeVersion: 1, locationId: loc._id, lockedAt: new Date(), lockedBy: worker._id, status: 'LOCKED', version: 1 });
    try {
        await assert.rejects(sales.confirmPicking(worker, task._id, body), /khóa kiểm kê/);
        assert.equal(String((await m.InventoryBalance.findById(stock._id)).quantityBase), '4');
        assert.equal(await m.StockTransaction.countDocuments({ sourceId: task._id }), 0);
        assert.equal((await m.TransferOrder.findById(task._id)).version, 1);
    } finally { await m.StocktakeLocationLock.deleteOne({ _id: lock._id }); }
    await sales.confirmPicking(worker, task._id, body);
});

run('failed-delivery reopening requires a posted receipt and shares its cap across redelivery and cancellation', async () => {
    const { order, request, stock, deliveryBody } = await extraSource('12');
    const first = await sales.createDelivery(seller, deliveryBody), firstDoc = await m.DeliveryOrder.findById(first.id);
    // Fixture represents previously issued stock and its received return. These
    // upstream milestones have separate return-module integration coverage.
    await m.StockReservation.updateMany({ 'executionRef.documentId': firstDoc._id }, { $set: { consumedQty: '12' } });
    const receipt = new m.FailedDeliveryReceipt({ documentNo: 'FD-GR-' + key(), workflowStatus: 'POSTED', version: 1, createdBy: worker._id, header: { warehouseId: warehouse._id }, items: [{ lineNo: 1, lineKind: 'FAILED_DELIVERY_RECEIPT', productId: product._id, lotId: batch._id, enteredUnit: 'PIECE', baseUnitSnapshot: 'PIECE', baseUnitsPerUnit: '1', enteredQty: '12', qtyBase: '12', productNameSnapshot: 'Tile', details: { failedDeliveryLineId: newId(), salesIssueLineId: newId(), inspectionLineId: newId() } }] });
    const txn = new m.StockTransaction({ sourceType: 'goods_receipts', sourceId: receipt._id, operation: 'GR_FD', eventKey: '1', requestKey: key(), requestHash: 'c'.repeat(64), performedBy: worker._id, occurredAt: new Date(), recordedAt: new Date(), movements: [{ transactionId: newId(), lineNo: 1, sourceLineId: receipt.items[0]._id, toBalanceId: stock._id, quantityBase: '12', toBefore: '0', toAfter: '12' }] });
    txn.movements[0].transactionId = txn._id;
    receipt.stockTransactionId = txn._id;
    receipt.demandReopenings.push({ receiptLineId: receipt.items[0]._id, stockTransactionId: txn._id, salesOrderLineId: order.items[0]._id, issueRequestLineId: request.items[0]._id, deliveryOrderLineId: firstDoc.items[0]._id, goodsIssueLineId: receipt.items[0].details.salesIssueLineId, reopenedQtyBase: '12', sourceVersion: 1 });
    await receipt.save();
    const backId = String(receipt.items[0]._id);
    let currentOrder = await m.SalesOrder.findById(order._id);
    await assert.rejects(sales.cancelSalesRemainder(seller, order._id, { idempotencyKey: key(), expectedVersion: currentOrder.version, reason: 'No posting', lines: [{ lineId: String(order.items[0]._id), qtyBase: '4', reopeningReceiptLineId: backId }] }), /chưa ghi tồn/);
    await txn.save();
    for (let i = 0; i < 2; i++) {
        const currentRequest = await m.WarehouseIssueRequest.findById(request._id), currentStock = await m.InventoryBalance.findById(stock._id);
        await sales.createDelivery(seller, { ...deliveryBody, idempotencyKey: key(), expectedVersion: currentRequest.version, lines: [{ ...deliveryBody.lines[0], qtyBase: '4', sourceBalanceVersion: currentStock.version, reopeningReceiptLineId: backId }] });
    }
    currentOrder = await m.SalesOrder.findById(order._id);
    await sales.cancelSalesRemainder(seller, order._id, { idempotencyKey: key(), expectedVersion: currentOrder.version, reason: 'Customer cancels last four', lines: [{ lineId: String(order.items[0]._id), qtyBase: '4', reopeningReceiptLineId: backId }] });
    currentOrder = await m.SalesOrder.findById(order._id);
    await assert.rejects(sales.cancelSalesRemainder(seller, order._id, { idempotencyKey: key(), expectedVersion: currentOrder.version, reason: 'Too much', lines: [{ lineId: String(order.items[0]._id), qtyBase: '1', reopeningReceiptLineId: backId }] }), /Vượt lượng/);
    assert.equal((await m.FailedDeliveryReceipt.findById(receipt._id)).commitmentTransfers.length, 2);
});

run('RECLASS closure rejects a superseded count then changes quality without a net adjustment', async () => {
    const { stock, loc } = await extraSource('4');
    const { st, snapshot, count } = await stocktakeFixture('0', stock, loc);
    const damaged = await m.InventoryBalance.create({ holdingPointId: stock.holdingPointId, batchId: batch._id, qualityStatus: 'DAMAGED', ownerType: 'STORE', quantityBase: '0', version: 1, packagingPortions: [] });
    const snapshot2 = await m.StocktakeSnapshot.create({ ...snapshot.toObject(), _id: newId(), sourceBalanceId: damaged._id, sourceBalanceVersion: 1, qualityStatus: 'DAMAGED', bookQtyBase: '0' });
    const count2 = await m.StocktakeCount.create({ ...count.toObject(), _id: newId(), snapshotId: snapshot2._id, countedQtyBase: '4', quantityEntries: [{ enteredQty: '4', enteredUnit: 'PIECE', baseUnitsPerUnit: '1', quantityBase: '4' }] });
    st.header.selectedCounts.push({ snapshotId: snapshot2._id, countId: count2._id });
    const planId = newId(), approvalId = newId(), itemId = newId(), now = new Date();
    const evidence = await m.Attachment.create({ ownerDocumentType: 'stocktakes', ownerDocumentId: st._id, purpose: 'EXECUTION', originalName: 'damage.png', mediaType: 'image/png', sizeBytes: 12, storageKey: 'local-test', checksum: 'b'.repeat(64), uploadedBy: worker._id, uploadedAt: now, accessCategory: 'BUSINESS', status: 'ATTACHED' });
    st.resolutionPlans.push({ _id: planId, documentNo: 'PLAN-' + key(), workflowStatus: 'APPROVED', version: 1, createdBy: worker._id, header: { stocktakeId: st._id, planVersion: 1, scopeVersion: 1, approvalId, reason: 'Observed damage' }, selectedCounts: [{ snapshotId: snapshot._id, countId: count._id }, { snapshotId: snapshot2._id, countId: count2._id }], items: [{ _id: itemId, lineNo: 1, lineKind: 'ST_RESOLUTION', productId: product._id, lotId: batch._id, enteredUnit: 'PIECE', baseUnitSnapshot: 'PIECE', baseUnitsPerUnit: '1', enteredQty: '4', qtyBase: '4', productNameSnapshot: 'Tile', details: { countId: count._id, actionKind: 'RECLASS', fromBalanceId: stock._id, toBalanceId: damaged._id } }], executionRecords: [{ itemId, performedBy: worker._id, performedAt: now, quantityBase: '4', evidenceIds: [evidence._id] }] });
    await st.save();
    await m.ApprovalHistory.create({ _id: approvalId, decisionKey: key(), subjectType: 'stocktake_resolution_plans', subjectId: planId, subjectRevision: 1, decisionScope: 'STOCKTAKE', reviewedContent: approvalContent(st.resolutionPlans.id(planId)), decision: 'APPROVE', reason: 'Verified', requestedBy: worker._id, decidedBy: owner._id, decidedAt: new Date(now.getTime() - 1000), recordedAt: now });
    const newer = await m.StocktakeCount.create({ ...count.toObject(), _id: newId(), attemptNo: 2, previousCountId: count._id, recountReason: 'Check again' });
    const body = { idempotencyKey: key(), expectedVersion: 1, planId: String(planId), expectedPlanVersion: 1, reason: 'Close reclassification' };
    await assert.rejects(closeStocktake(owner, st._id, body), /lần đếm mới/);
    assert.equal(await m.StocktakeLocationLock.countDocuments({ stocktakeId: st._id, status: 'LOCKED' }), 1);
    const revised = st.resolutionPlans.id(planId);
    revised.version = 2;
    revised.selectedCounts[0].countId = newer._id;
    revised.items[0].details.countId = newer._id;
    revised.header.approvalId = newId();
    st.header.selectedCounts[0].countId = newer._id;
    const revisedTime = new Date();
    revised.executionRecords[0].performedAt = revisedTime;
    await st.save();
    await m.ApprovalHistory.create({ _id: revised.header.approvalId, decisionKey: key(), subjectType: 'stocktake_resolution_plans', subjectId: planId, subjectRevision: 2, decisionScope: 'STOCKTAKE', reviewedContent: approvalContent(revised), decision: 'APPROVE', reason: 'Recount reviewed', requestedBy: worker._id, decidedBy: owner._id, decidedAt: revisedTime, recordedAt: revisedTime });
    body.expectedPlanVersion = 2;
    const adjustmentsBefore = await m.StockAdjustment.countDocuments();
    await closeStocktake(owner, st._id, body);
    assert.equal(String((await m.InventoryBalance.findById(stock._id)).quantityBase), '0');
    assert.equal(String((await m.InventoryBalance.findById(damaged._id)).quantityBase), '4');
    assert.equal(await m.StockAdjustment.countDocuments(), adjustmentsBefore);
    assert.equal(await m.StockTransaction.countDocuments({ sourceId: st._id }), 1);
});

run('HTTP sales, picking, stocktake and report routes enforce native DTOs, authentication and strict commands', async () => {
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const root = 'http://127.0.0.1:' + server.address().port + '/api';
    const api = async (path, user, body) => {
        const response = await fetch(root + path, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', ...(user && { authorization: 'Bearer ' + jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET) }) }, ...(body && { body: JSON.stringify(body) }) });
        return { status: response.status, body: await response.json() };
    };
    try {
        assert.equal((await api('/sales-orders')).status, 401);
        for (const path of ['/sales-orders', '/sales-orders/options', '/outbound-deliveries', '/picking-tasks', '/stocktakes', '/reports/options', '/reports?group=inventory']) {
            const response = await api(path, path === '/sales-orders/options' ? seller : owner);
            assert.equal(response.status, 200, path + ': ' + JSON.stringify(response.body));
            assert.ok(response.body.data);
        }
        const result = await api('/picking-tasks/' + pick._id, worker);
        assert.equal(result.status, 200);
        assert.equal(result.body.data.workflowStatus, 'CONFIRMED');
        assert.equal((await api('/outbound-deliveries', seller, { idempotencyKey: key(), expectedVersion: 1, unknown: true })).status, 400);
        assert.equal((await api('/reports?group=inventory&warehouseId=' + key(), worker)).status, 403);
        assert.equal((await api('/stocktakes/' + key() + '/close', worker, { idempotencyKey: key(), expectedVersion: 1, reason: 'Invalid role', selectedCounts: [] })).status, 403);
    } finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});

run('FIFO rejects a newer compatible source without a recorded exception and retries safely', async () => {
    const older = await extraSource('4'), newer = await extraSource('4');
    for (const [fixture, occurredAt] of [[older, '2026-01-01T00:00:00Z'], [newer, '2026-02-01T00:00:00Z']]) {
        const transactionId = newId();
        await m.StockTransaction.create({ _id: transactionId, sourceType: 'opening_stocks', sourceId: newId(), operation: 'OPENING', eventKey: key(), requestKey: key(), requestHash: 'd'.repeat(64), performedBy: worker._id, occurredAt: new Date(occurredAt), recordedAt: new Date(), movements: [{ transactionId, lineNo: 1, sourceLineId: newId(), toBalanceId: fixture.stock._id, quantityBase: '4', toBefore: '0', toAfter: '4' }] });
    }
    await assert.rejects(sales.createDelivery(seller, newer.deliveryBody), /FIFO/);
    assert.equal(await m.StockReservation.countDocuments({ balanceId: newer.stock._id }), 0);
    const body = { ...newer.deliveryBody, fifoExceptionReason: 'Customer requires the newer manufacturer lot placement for this handover' };
    await sales.createDelivery(seller, body);
    assert.equal((await sales.createDelivery(seller, body)).replayed, true);
});
