import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import { ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';
import { createSalesOrder } from '../src/modules/sales-orders/sales-create.service.js';
import { createIssue, postIssue } from '../src/modules/goods-issues/goods-issue.service.js';
import { complete, setDeliveredQuantities } from '../src/modules/goods-issues/direct-sales.service.js';
import { createCustomerReturn } from '../src/modules/return-workflows/native.service.js';
import { traceRecords } from '../src/modules/return-workflows/native.trace.js';
import { detail, traceLot } from '../src/modules/return-workflows/native.read.js';
import { lookup } from '../src/modules/return-workflows/native.lookup.js';

const key = () => new mongoose.Types.ObjectId().toString();
test('two shipments of one purchase request supply one return with independent receipt and lot caps', { skip: process.env.RUN_GOODS_ISSUE_TESTS !== '1' }, async () => {
 const port = process.env.MONGODB_TEST_PORT || 27018, repl = process.env.MONGODB_TEST_REPLICA_SET || 'hieudt-test';
 await mongoose.connect(`mongodb://127.0.0.1:${port}/return_order_test_${key()}?replicaSet=${repl}`);
 try {
  for (const model of new Set(Object.values(m).filter(value => value?.modelName))) { await model.createCollection(); await model.createIndexes(); }
  const permissions = await m.Permission.insertMany([...new Set([...ROLE_PERMISSIONS.SALES, ...ROLE_PERMISSIONS.WAREHOUSE])].map(code => ({ code, name: code })));
  const warehouse = await m.Warehouse.create({ code: 'W1', name: 'Test', lengthMm: '10000', widthMm: '10000', clearHeightMm: '3000' });
  async function actor(code) {
   const role = await m.Role.create({ code, name: code, permissionIds: permissions.filter(p => ROLE_PERMISSIONS[code].includes(p.code)).map(p => p._id) });
   const user = await m.User.create({ username: code.toLowerCase(), fullName: code, passwordHash: 'test', roleId: role._id, warehouseIds: [warehouse._id] });
   return user.populate({ path: 'roleId', populate: { path: 'permissionIds' } });
  }
  const sales = await actor('SALES'), worker = await actor('WAREHOUSE');
  await m.Uom.create({ code: 'PIECE', name: 'Viên' });
  const category = await m.Category.create({ code: 'TILE', name: 'Tiles' });
  const product = await m.Product.create({ sku: 'TILE', name: 'Tiles', manufacturerCode: 'T', categoryId: category._id, color: 'White', baseUnit: 'PIECE', wholeBaseUnits: true, lengthMm: '600', widthMm: '600', heightMm: '10' });
  const batch = await m.ProductBatch.create({ productId: product._id, manufacturerLot: 'LOT-A', identificationStatus: 'VERIFIED', piecesPerCarton: 4, cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50' });
  const bin = await m.WarehouseLocation.create({ warehouseId: warehouse._id, code: 'B1', locationType: 'STORAGE', isPickable: true, usableLengthMm: '5000', usableWidthMm: '5000' });
  const point = await m.StockHoldingPoint.create({ type: 'LOCATION', locationId: bin._id });
  const balance = await m.InventoryBalance.create({ holdingPointId: point._id, batchId: batch._id, ownerType: 'STORE', qualityStatus: 'GOOD', quantityBase: '16', version: 1,
   packagingPortions: [{ packagingState: 'SEALED', sealedPackCount: 4, quantityBase: '16', packagingSnapshot: { packageUnit: 'BOX', baseUnitsPerPackage: '4', outerLengthMm: '620', outerWidthMm: '620', outerHeightMm: '50' }, createdBy: worker._id }] });
  const makeOrder = () => createSalesOrder(sales, { idempotencyKey: key(), customerName: 'A', currencyCode: 'VND', lines: [{ productId: product.id, lotId: batch.id, quantity: '8', unitSellingPrice: '1' }] });
  const order = await makeOrder(), other = await makeOrder();
  async function ship(orderId) {
   const doc = await m.SalesOrder.findById(orderId);
   const created = await createIssue(worker, { idempotencyKey: key(), expectedVersion: doc.version, warehouseId: warehouse.id, salesOrderId: orderId, lines: [{ salesOrderLineId: doc.items[0].id, sourceBalanceId: balance.id, qtyBase: '4' }] });
   let issue = await m.SalesGoodsIssue.findById(created.id);
   await postIssue(worker, issue.id, { expectedVersion: issue.version, idempotencyKey: key(), recipientName: 'Driver' });
   issue = await m.SalesGoodsIssue.findById(created.id);
   await setDeliveredQuantities(worker, issue.id, { expectedVersion: issue.version, idempotencyKey: key(), lines: [{ lineId: String(issue.items[0]._id), qtyBase: '3' }] });
   issue = await m.SalesGoodsIssue.findById(created.id);
   await complete(worker, issue.id, { expectedVersion: issue.version, idempotencyKey: key() });
   return issue;
  }
  const first = await ship(order.id), second = await ship(order.id), unrelated = await ship(other.id);
  const trace = await traceRecords(worker,batch.id,{section:'documents',page:1,limit:25});
  assert.ok(trace.items.some(row=>row._id===order.id));
  assert.ok((await traceLot(worker,batch.id)).documents.some(row=>row._id===order.id));
  const filters = { warehouseId: warehouse.id, page: 1, limit: 10 };
  const orders = await lookup(sales, { ...filters, kind: 'return-orders' });
  assert.equal(orders.total, 2);
  const otherSeller = await m.User.create({ username: 'sales2', fullName: 'Other', passwordHash: 'test', roleId: sales.roleId._id, warehouseIds: [warehouse._id] });
  await otherSeller.populate({ path: 'roleId', populate: { path: 'permissionIds' } });
  assert.equal((await lookup(otherSeller, { ...filters, kind: 'return-orders' })).total, 0);
  const sources = await lookup(sales, { ...filters, kind: 'sources', purpose: 'customer-returns', salesOrderId: order.id });
  assert.deepEqual(sources.items.map(r => r.documentId).sort(), [first.id, second.id].sort());
  const independent = await lookup(sales, { ...filters, kind: 'sources', purpose: 'customer-returns', withoutSalesOrder: 'true' });
  assert.equal(independent.total, 0);
  const line = issue => ({ salesIssueLineId: String(issue.items[0]._id), lotId: batch.id, qtyBase: '2', reason: 'Returned' });
  const input = { warehouseId: warehouse.id, salesOrderId: order.id, lines: [line(first), line(second)], idempotencyKey: key() };
  await assert.rejects(createCustomerReturn(sales, { ...input, lines: [line(first), line(unrelated)] }), /không thuộc yêu cầu/);
  await assert.rejects(createCustomerReturn(sales, { ...input, lines: [line(first), { ...line(second), qtyBase: '4' }] }), /Vượt lượng/);
  await assert.rejects(createCustomerReturn(otherSeller, input));
  await assert.rejects(createCustomerReturn(sales, { ...input, warehouseId: key() }));
  await assert.rejects(createCustomerReturn(sales, { ...input, lines: [line(first), { ...line(second), lotId: key() }] }), /Chọn đúng lô/);
  assert.equal(await m.ReturnQuantityClaim.countDocuments(), 0);
  const created = await createCustomerReturn(sales, input);
  assert.equal((await createCustomerReturn(sales, input)).id, created.id);
  const result = await detail(sales, 'customer-returns', created.id);
  assert.deepEqual(result.sourceOrders.map(o => o.id), [order.id]);
  assert.deepEqual(result.sourceIssues.map(i => i.id).sort(), [first.id, second.id].sort());
  assert.equal(await m.ReturnQuantityClaim.countDocuments(), 2);
  const lastUnit = { ...input, lines: [{ ...line(first), qtyBase: '1' }, { ...line(second), qtyBase: '1' }] };
  const attempts = await Promise.allSettled([key(),key()].map(idempotencyKey => createCustomerReturn(sales, { ...lastUnit, idempotencyKey })));
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(await m.ReturnQuantityClaim.countDocuments(), 4);
 } finally { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); }
});
