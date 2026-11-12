import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { buildReviewedDemo,decimalValue } from '../src/seeds/rebuild/data.js';
import { registerReviewedModels } from '../src/models/index.js';
import { validateReviewedDemo } from '../src/seeds/rebuild/validate.js';
import { assertDemoTarget,writeDemoDatabase,seedFingerprint } from '../src/seeds/rebuild/database.js';

const connection=mongoose.createConnection();
const models=registerReviewedModels(connection);
const data=await buildReviewedDemo();
const clone=()=>mongoose.mongo.BSON.EJSON.parse(mongoose.mongo.BSON.EJSON.stringify(data));

test('complete reviewed demo validates all schemas, links, balances and approved scenarios',async()=>{
  const result=await validateReviewedDemo(data,models);
  assert.equal(result.collections,58);
  assert.equal(result.records,661 + data.conversions.length);
  assert.ok(data.conversions.some(row => row.productBatchId && data.uoms.some(unit =>
    String(unit._id) === String(row.uomId) && unit.isCarton)));
  assert.equal(data.roles.filter(row=>!row.isSystemRole).length,1);
  assert.equal(data.sales_invoices[0].items.length,2);
  assert.notEqual(+data.sales_invoices[0].items[0].issuedAt,+data.sales_invoices[0].items[1].issuedAt);
  assert.equal(data.stocktake_counts.filter(row=>row.attemptNo===2).length,1);
  for(const old of ['product_uom_versions','business_documents','document_lines','line_links']) assert.ok(!Object.hasOwn(data,old));
});
test('MongoDB read order does not affect stock reconciliation',async()=>{
  const sample=clone();sample.stock_transactions.forEach(row=>row.movements.reverse());sample.inventory_balances.reverse();
  await validateReviewedDemo(sample,models);
});
test('tile shop has three warehouses, surveyed staff counts and separate batches',()=>{
  assert.equal(data.warehouses.length,3);
  assert.equal(data.products.length,18);
  assert.equal(data.product_batches.length,39);
  assert.ok(data.products.every(row=>row.name.startsWith('Gạch')));
  assert.equal(data.customers.length,20);
  assert.equal(data.suppliers.length,3);
  assert.ok(!Object.hasOwn(data,'delivery_teams'));
  assert.ok(data.transfer_dispatches.flatMap(row=>row.handovers??[]).every(row=>row.header.vehiclePlate));
  const people=code=>data.users.filter(u=>String(u.roleId)===String(data.roles.find(r=>r.code===code)._id)).length;
  assert.equal(people('WAREHOUSE'),3);assert.equal(people('SALES'),7);assert.equal(people('ACCOUNTANT'),3);
  assert.ok(data.inventory_balances.flatMap(b=>b.packagingPortions).some(r=>r.packagingState==='SEALED'));
  assert.ok(data.inventory_balances.flatMap(b=>b.packagingPortions).some(r=>r.packagingState==='LOOSE'));
  for(const product of data.products)assert.ok(data.product_batches.filter(b=>String(b.productId)===String(product._id)).length>=2);
});
test('cartons keep their batch and exact conversion and cannot contain another product',async()=>{
  const sample=clone();
  const item=sample.opening_stocks.flatMap(d=>d.items).find(i=>i.enteredUnit==='Thùng');
  item.lotId=sample.product_batches.find(b=>String(b.productId)!==String(item.productId))._id;
  await assert.rejects(validateReviewedDemo(sample,models),/batch\/product mismatch/);
});
test('carton packaging cannot disagree with the entered quantity conversion',async()=>{
  const sample=clone();
  const item=sample.opening_stocks.flatMap(d=>d.items).find(i=>i.enteredUnit==='Thùng');
  item.packagingSnapshot.baseUnitsPerPackage=decimalValue('999');
  await assert.rejects(validateReviewedDemo(sample,models),/carton conversion mismatch/);
});
test('BSON field order does not change the demo fingerprint but values do',()=>{
  const reordered=Object.fromEntries(Object.entries(data).reverse().map(([name,rows])=>[name,[...rows].reverse().map(row=>
    Object.fromEntries(Object.entries(row).reverse()))]));
  assert.equal(seedFingerprint(data),seedFingerprint(reordered));
  const changed=clone();changed.customers[0].phone='0900000099';
  assert.notEqual(seedFingerprint(data),seedFingerprint(changed));
});
test('rejects an inconsistent ending stock balance',async()=>{
  const sample=clone();sample.inventory_balances[0].quantityBase=decimalValue('999');
  await assert.rejects(validateReviewedDemo(sample,models),/ledger|Packaging quantity/);
});
test('rejects a source link whose item belongs to a different document',async()=>{
  const sample=clone();sample.transfer_dispatches[0].items[0].sources[0].itemId=sample.sales_orders[0].items[0]._id;
  await assert.rejects(validateReviewedDemo(sample,models),/item parent/);
});
test('rejects occupied volume above the bin capacity using shared warehouse height',async()=>{
  const sample=clone();sample.warehouses.forEach(w=>w.clearHeightMm=1);
  await assert.rejects(validateReviewedDemo(sample,models),/capacity exceeded|dimensions do not fit/);
});
test('rejects active reservation above remaining physical stock',async()=>{
  const sample=clone();sample.stock_reservations[0].consumedQty=decimalValue('0');
  await assert.rejects(validateReviewedDemo(sample,models),/reservation exceeds/);
});
test('reservation counters cannot consume and release the same amount twice',async()=>{
  const row={...data.stock_reservations[0],releasedQty:decimalValue('1')};
  await assert.rejects(new (models.get('stock_reservations'))(row).validate(),/reservedQty/);
});
test('dispatches cannot exceed the approved TR line quantity',async()=>{
  const sample=clone();sample.warehouse_transfer_requests[0].items[0].approvedQtyBase=decimalValue('1');
  await assert.rejects(validateReviewedDemo(sample,models),/approved quantity exceeded/);
});
test('destination receiver cannot be the source dispatcher',async()=>{
  const sample=clone();sample.goods_receipts.find(row=>row.documentKind==='TRANSFER').header.receivedBy=sample.transfer_dispatches[0].header.dispatchedBy;
  await assert.rejects(validateReviewedDemo(sample,models),/dispatcher cannot receive/);
});
test('invoice keeps 100 issued units while billing only 98 accepted units',async()=>{
  const invoice=clone().sales_invoices[0];
  invoice.items[0].issuedQtyBase=decimalValue('100');invoice.items[0].billedQtyBase=decimalValue('98');
  invoice.items[0].saleUnit='Thùng';invoice.items[0].baseUnitsPerSaleUnit=decimalValue('4');
  invoice.items[0].unitSellingPrice=decimalValue('200000');invoice.items[0].lineAmount=decimalValue('4900000');
  invoice.items=invoice.items.slice(0,1);invoice.totalAmount=decimalValue('4900000');
  await new (models.get('sales_invoices'))(invoice).validate();
  invoice.items[0].billedQtyBase=decimalValue('101');
  await assert.rejects(new (models.get('sales_invoices'))(invoice).validate(),/Invalid invoiced quantity/);
});
test('invoice cannot change historical accepted quantity just to match a total',async()=>{
  const sample=clone(),invoice=sample.sales_invoices[0];
  invoice.items[0].billedQtyBase=decimalValue('5');invoice.items[0].lineAmount=decimalValue('250000');invoice.totalAmount=decimalValue('550000');
  await assert.rejects(validateReviewedDemo(sample,models),/accepted quantity mismatch/);
});
test('extension fields remain present on discriminated SO and GI items',async()=>{
  const so=new (models.get('sales_orders'))(data.sales_orders[0]);
  const gi=new (models.get('sales_goods_issues'))(data.sales_goods_issues[0]);
  await so.validate();await gi.validate();
  assert.equal(so.items[0].priceRevision,1);
  assert.equal(String(gi.items[0].salePriceSnapshot.unitSellingPrice),'50000');
});
test('one current registry is reused per connection',()=>{
  assert.equal(registerReviewedModels(connection),models);
});
test('only separate demo database names are allowed',()=>{
  for(const name of ['sep490','admin','sep490_rebuild_20261102','wmsd_demo_v2']) assert.throws(()=>assertDemoTarget(name,name));
  assert.throws(()=>assertDemoTarget('sep490','another'));
  assert.doesNotThrow(()=>assertDemoTarget('wmsd_demo_v2','sep490'));
});
test('occupied unmarked target is refused before any write',async()=>{
  const db={databaseName:'wmsd_demo_v2',listCollections:()=>({toArray:async()=>[{name:'users'}]}),
    createCollection:()=>assert.fail('must not create or overwrite anything')};
  const client={db:()=>({databaseName:'sep490'})};
  await assert.rejects(writeDemoDatabase(client,db,data,models),/Unexpected or missing/);
});
test('sample event queue cannot trigger an outbound email',async()=>{
  const sample=clone();sample.notifications[0].emailDelivery.status='PENDING';
  await assert.rejects(validateReviewedDemo(sample,models),/email must be skipped/);
});

