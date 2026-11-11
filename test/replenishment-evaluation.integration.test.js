import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import { evaluateLines } from '../src/modules/replenishments/replenishment.evaluation.js';
import { rescheduleExpectedOn } from '../src/modules/purchase-orders/purchase-order.commands.js';
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
  for (const Model of [m.ReplenishmentRequest,m.PurchaseOrder,m.PurchaseReceipt,m.StockHoldingPoint,m.InventoryBalance,m.SalesOrder,m.WarehouseIssueRequest,m.DeliveryOrder,m.SalesGoodsIssue,m.StockReservation,m.SupplyAllocation,m.WarehouseTransferRequest,m.TransferDispatch,m.TransferReceipt,m.FailedDeliveryReceipt,m.StockTransaction,m.DefectReport,m.Stocktake,m.StocktakeSnapshot,m.StocktakeLocationLock]) await Model.collection.deleteMany({});
});

async function order(qty = '20', neededOn = date) {
  return m.SalesOrder.create({ documentNo: 'SO-' + id(), workflowStatus: 'OPEN', version: 1, createdBy: user._id,
    header: { externalReferenceId: id(), customerId: id(), neededOn: new Date(neededOn), deliveryAddressSnapshot: 'Test address' }, items: [item(qty, { unitSellingPrice: '0', lineAmount: '0' })], orderAmount: '0', currencyCode: 'VND' });
}
async function stock(qty = '18', location = storage, ownership = 'STORE') {
  const point = await m.StockHoldingPoint.create({ type: 'LOCATION', locationId: location._id });
  return m.InventoryBalance.create({ holdingPointId: point._id, batchId: batch._id, ownerType: ownership, ownerId: ownership === 'STORE' ? null : id(), qualityStatus: 'GOOD', quantityBase: qty, version: 0 });
}
async function request(qty = '10', key, target = warehouse, status = 'APPROVED') {
  // The test fixture uses native source metadata with server evaluation fields.
  return m.ReplenishmentRequest.create({ documentNo: 'RR-' + id(), workflowStatus: status, version: 1, createdBy: user._id,
    header: { warehouseId: target._id, neededOn: new Date(date), triggerReason: 'Evaluation test', creationKey: String(id()) },
    items: [item(qty, { lineKind: 'REPLENISHMENT', approvedQtyBase: qty, details: key ? {
      triggerType: key.startsWith('SO:') ? 'SALES_SHORTAGE' : 'STOCK_THRESHOLD', canonicalSourceKey: key,
      source: { triggerType: key.startsWith('SO:') ? 'SALES_SHORTAGE' : 'STOCK_THRESHOLD', ...(key.startsWith('SO:') ? { documentType: 'sales_orders', documentId: key.split(':')[1], itemId: key.split(':')[2], version: 1 } : {}) },
      evaluationKey: 'fixture', evaluatedAt: new Date(), reasonNote: 'Test need' } : { triggerType: 'MANUAL_OTHER', reasonNote: 'Independent test need' } })] });
}
async function purchase(rr, qty = '10', status = 'OPEN', expectedOn = date) {
  return m.PurchaseOrder.create({ documentNo: 'PO-' + id(), workflowStatus: status, version: 1, createdBy: user._id, replenishmentRequestId: rr._id,
    header: { warehouseId: rr.header.warehouseId, supplierId: id(), expectedOn: expectedOn ? new Date(expectedOn) : undefined },
    items: [item(qty, { requestItemId: rr.items[0]._id, unitPurchasePrice: '0', lineAmount: '0' })], totalAmount: '0', currency: 'VND' });
}

test('thresholds include unallocated PO supply and use RR-to-PO transition once', { skip: !enabled }, async () => {
  await stock('18');
  const rr = await request('10', `THRESHOLD:${warehouse._id}:${product._id}`);
  const threshold = { productId: String(product._id), source: { triggerType: 'STOCK_THRESHOLD' } };
  let [evaluation] = await evaluate([threshold]);
  assert.equal(evaluation.suggestedQtyBase, '22');
  const po = await purchase(rr, '10', 'DRAFT');
  [evaluation] = await evaluate([threshold]);
  assert.equal(evaluation.suggestedQtyBase, '22');
  assert.equal(evaluation.pendingRequestCoverageQtyBase, '10');
  po.workflowStatus = 'OPEN'; await po.save();
  [evaluation] = await evaluate([threshold]);
  assert.equal(evaluation.pendingRequestCoverageQtyBase, '0');
  assert.equal(evaluation.incomingCoverageQtyBase, '10');
  assert.equal(evaluation.suggestedQtyBase, '22');
  po.workflowStatus = 'CLOSED'; await po.save();
  [evaluation] = await evaluate([threshold]);
  assert.equal(evaluation.suggestedQtyBase, '32');
});

test('terminal PO releases the unpurchased approval remainder instead of keeping a permanent RR proposal', {skip:!enabled}, async()=>{
  await stock('18');
  const rr=await request('20',`THRESHOLD:${warehouse._id}:${product._id}`);
  const po=await purchase(rr,'10','OPEN');
  const lines=[{productId:String(product._id),source:{triggerType:'STOCK_THRESHOLD'}}];
  let [evaluation]=await evaluate(lines);assert.equal(evaluation.pendingRequestCoverageQtyBase,'10');assert.equal(evaluation.suggestedQtyBase,'12');
  po.workflowStatus='CLOSED';await po.save();
  [evaluation]=await evaluate(lines);assert.equal(evaluation.pendingRequestCoverageQtyBase,'0');assert.equal(evaluation.suggestedQtyBase,'32');
});

test('SO and WIR share a global pending ceiling across warehouses', { skip: !enabled }, async () => {
  const so = await order();
  await request('15', `SO:${so._id}:${so.items[0]._id}`, otherWarehouse, 'DRAFT');
  const wir = await m.WarehouseIssueRequest.create({ documentNo: 'WIR-' + id(), workflowStatus: 'OPEN', version: 1, createdBy: user._id,
    header: { salesOrderId: so._id, requestedWarehouseId: warehouse._id, neededOn: new Date(date), deliveryAddressSnapshot: 'Test address' },
    items: [item('20', { lineKind: 'ISSUE_REQUEST', details: { salesOrderLineId: so.items[0]._id, releaseKey: String(id()) } })] });
  const [direct, viaWir] = await evaluate([sourceLine(so), { productId: String(product._id), source: { triggerType: 'SALES_SHORTAGE', documentType: 'warehouse_issue_requests', documentId: String(wir._id), itemId: String(wir.items[0]._id), version: 1 } }]);
  assert.equal(direct.canonicalKey, viaWir.canonicalKey);
  assert.equal(direct.suggestedQtyBase, '5'); assert.equal(viaWir.suggestedQtyBase, '5');
});

test('free stock is allocated once across independent sales and reserve needs', { skip: !enabled }, async () => {
  const earlier = await order('20', '2026-11-30');
  const later = await order('20');
  await stock('20');
  const [first, second, reserve] = await evaluate([sourceLine(earlier), sourceLine(later), { productId: String(product._id), source: { triggerType: 'STOCK_THRESHOLD' } }]);
  assert.equal(first.suggestedQtyBase, '0');
  assert.equal(second.suggestedQtyBase, '20');
  assert.equal(reserve.onHandCoverageQtyBase, '0');
  assert.equal(reserve.suggestedQtyBase, '50');
});

test('owned receiving stock prevents rebuying while supplier custody does not', { skip: !enabled }, async () => {
  const receiving = await m.WarehouseLocation.create({ warehouseId: warehouse._id, code: 'IN-' + id(), locationType: 'RECEIVING', usableLengthMm: '5000', usableWidthMm: '5000' });
  const balance = await stock('20', receiving, 'SUPPLIER');
  const so = await order();
  let [evaluation] = await evaluate([sourceLine(so)]);
  assert.equal(evaluation.suggestedQtyBase, '20');
  balance.ownerType = 'STORE'; balance.ownerId = null; await balance.save();
  [evaluation] = await evaluate([sourceLine(so)]);
  assert.equal(evaluation.availableQtyBase, '0'); assert.equal(evaluation.onHandCoverageQtyBase, '20'); assert.equal(evaluation.suggestedQtyBase, '0');
});

test('late supply is excluded, missing arrival dates fail closed, and PO self-exclusion works', { skip: !enabled }, async () => {
  const so = await order();
  const rr = await request('20', `SO:${so._id}:${so.items[0]._id}`);
  const po = await purchase(rr, '20', 'OPEN', '2026-12-02');
  let [evaluation] = await evaluate([sourceLine(so)]);
  assert.equal(evaluation.suggestedQtyBase, '20');
  po.header.expectedOn = undefined; await po.save();
  await assert.rejects(evaluate([sourceLine(so)]), error => error.code === 'ERR-RR-409-004');
  [evaluation] = await evaluate([sourceLine(so)], { requestId: String(rr._id), excludePurchaseOrderId: String(po._id) });
  assert.equal(evaluation.suggestedQtyBase, '20');
});

async function partialPurchase(expectedOn) {
  const so = await order();
  const rr = await request('20', `SO:${so._id}:${so.items[0]._id}`);
  const po = await purchase(rr, '20', 'PARTIAL', expectedOn);
  po.items[0].cancelledRemainderQtyBase = '2';
  await po.save();
  await m.PurchaseReceipt.create({
    documentNo: 'GR-' + id(), workflowStatus: 'POSTED', version: 1, createdBy: user._id,
    header: { warehouseId: warehouse._id, purchaseOrderId: po._id },
    items: [item('8', { purchaseOrderItemId: po.items[0]._id })],
  });
  await stock('8');
  return { so, po };
}

test('partially received PO counts only its outstanding quantity on expectedOn', { skip: !enabled }, async () => {
  const { so } = await partialPurchase(date);
  const [evaluation] = await evaluate([sourceLine(so)]);
  assert.equal(evaluation.onHandCoverageQtyBase, '8');
  assert.equal(evaluation.incomingCoverageQtyBase, '10');
  assert.equal(evaluation.suggestedQtyBase, '2');
});

test('late expectedOn excludes the PO remainder even when a legacy schedule was due on time', { skip: !enabled }, async () => {
  const { so, po } = await partialPurchase('2026-12-02');
  await m.PurchaseOrder.collection.updateOne({ _id: po._id }, { $set: {
    'items.0.deliverySchedule': [{ quantityBase: po.items[0].qtyBase, expectedAt: new Date(date) }],
  } });
  const [evaluation] = await evaluate([sourceLine(so)]);
  assert.equal(evaluation.incomingCoverageQtyBase, '0');
  assert.equal(evaluation.suggestedQtyBase, '12');
});

test('rescheduling expectedOn moves the PO remainder in and out of coverage', { skip: !enabled }, async () => {
  const { so, po } = await partialPurchase('2026-12-02');
  let [evaluation] = await evaluate([sourceLine(so)]);
  assert.equal(evaluation.incomingCoverageQtyBase, '0');
  const reschedule = (version, expectedOn) => rescheduleExpectedOn(user, String(po._id), {
    operationKey: String(id()), expectedVersion: version, expectedOn, reason: 'Supplier moved the delivery',
  });
  const earlier = await reschedule(po.version, '2026-11-30T00:00:00.000Z');
  assert.equal(earlier.workflowStatus, 'PARTIAL');
  [evaluation] = await evaluate([sourceLine(so)]);
  assert.equal(evaluation.incomingCoverageQtyBase, '10');
  assert.equal(evaluation.suggestedQtyBase, '2');
  await reschedule(earlier.version, '2026-12-05T00:00:00.000Z');
  [evaluation] = await evaluate([sourceLine(so)]);
  assert.equal(evaluation.incomingCoverageQtyBase, '0');
  assert.equal(evaluation.suggestedQtyBase, '12');
});

test('only posted effective failed-delivery receipts reopen demand and valid reversals release it once', { skip: !enabled }, async () => {
  const so = await order();
  const wirId=id(), wirLine=id(), deliveryId=id(), deliveryLine=id(), issueId=id(), issueLine=id(), issueTx=id();
  const d = value => mongoose.Types.Decimal128.fromString(value);
  await m.WarehouseIssueRequest.collection.insertOne({_id:wirId,documentKind:'ISSUE_REQUEST',version:1,workflowStatus:'OPEN',header:{salesOrderId:so._id,requestedWarehouseId:warehouse._id},items:[{...item(),_id:wirLine,lineKind:'ISSUE_REQUEST',details:{salesOrderLineId:so.items[0]._id}}]});
  await m.DeliveryOrder.collection.insertOne({_id:deliveryId,workflowStatus:'OPEN',header:{issueRequestId:wirId,warehouseId:warehouse._id},items:[{...item(),_id:deliveryLine,lineKind:'OUTBOUND_DELIVERY',details:{issueRequestLineId:wirLine}}]});
  await m.SalesGoodsIssue.collection.insertOne({_id:issueId,workflowStatus:'POSTED',header:{warehouseId:warehouse._id},stockTransactionId:issueTx,items:[{...item('18'),_id:issueLine,lineKind:'SALES_GOODS_ISSUE',details:{outboundDeliveryLineId:deliveryLine}}]});
  await m.StockTransaction.collection.insertOne({requestKey:String(id()),_id:issueTx,sourceId:issueId,sourceType:'sales_goods_issues',movements:[{sourceLineId:issueLine,quantityBase:d('18')}]});
  let [evaluation]=await evaluate([sourceLine(so)]);assert.equal(evaluation.suggestedQtyBase,'2');
  const receiptId=id(), receiptLine=id(), returnTx=id();
  await m.FailedDeliveryReceipt.collection.insertOne({_id:receiptId,documentKind:'FAILED_DELIVERY',workflowStatus:'DRAFT',stockTransactionId:returnTx,header:{warehouseId:warehouse._id},items:[],demandReopenings:[{receiptLineId:receiptLine,salesOrderLineId:so.items[0]._id,reopenedQtyBase:d('4')}]});
  [evaluation]=await evaluate([sourceLine(so)]);assert.equal(evaluation.suggestedQtyBase,'2');
  await m.FailedDeliveryReceipt.collection.updateOne({_id:receiptId},{$set:{workflowStatus:'POSTED'}});
  await m.StockTransaction.collection.insertOne({requestKey:String(id()),_id:returnTx,sourceId:receiptId,sourceType:'failed_delivery_receipts',movements:[{sourceLineId:receiptLine,quantityBase:d('4')}]});
  [evaluation]=await evaluate([sourceLine(so)]);assert.equal(evaluation.suggestedQtyBase,'6');
  await m.StockTransaction.collection.insertOne({requestKey:String(id()),_id:id(),sourceId:id(),reversedTransactionId:returnTx,movements:[]});
  [evaluation]=await evaluate([sourceLine(so)]);assert.equal(evaluation.suggestedQtyBase,'2');
  await m.StockTransaction.collection.insertOne({requestKey:String(id()),_id:id(),sourceId:id(),reversedTransactionId:issueTx,movements:[]});
  [evaluation]=await evaluate([sourceLine(so)]);assert.equal(evaluation.suggestedQtyBase,'20');
});

test('reserved goods blocked by defects or stocktake do not hide a current shortage', { skip: !enabled }, async () => {
  const so=await order(), balance=await stock('20');
  await m.StockReservation.create({demandRef:{documentType:'sales_orders',documentId:so._id,itemId:so.items[0]._id},balanceId:balance._id,reservedQty:'20',creationKey:String(id()),createdBy:user._id});
  let [evaluation]=await evaluate([sourceLine(so)]);assert.equal(evaluation.suggestedQtyBase,'0');
  const reportId=id();
  await m.DefectReport.collection.insertOne({_id:reportId,holds:[{status:'ACTIVE',allocations:[{balanceId:balance._id,quantityBase:mongoose.Types.Decimal128.fromString('5')}]}]});
  [evaluation]=await evaluate([sourceLine(so)]);assert.equal(evaluation.reservedForDemandQtyBase,'15');assert.equal(evaluation.suggestedQtyBase,'5');
  await m.StocktakeLocationLock.collection.insertOne({_id:id(),locationId:storage._id,status:'LOCKED'});
  [evaluation]=await evaluate([sourceLine(so)]);assert.equal(evaluation.reservedForDemandQtyBase,'0');assert.equal(evaluation.suggestedQtyBase,'20');
});
