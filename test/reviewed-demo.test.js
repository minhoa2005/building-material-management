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
  assert.equal(result.collections,62);
  assert.equal(result.records,669 + data.conversions.length); // Includes the seven scheduled delivery permissions
  assert.ok(data.permissions.every(p => !p.code.startsWith('putaway_task:')));
  assert.equal(data.transfer_orders.find(task => task.documentNo === 'TO-202610-001').header.taskKind, 'RELOCATE');
  assert.ok(data.transfer_orders.some(task => task.header.requirementId && task.header.taskKind === 'PUTAWAY'));
  assert.deepEqual(data.uoms.map(({ code, name, isCarton }) => ({ code, name, isCarton })), [
    { code: 'Viên', name: 'Viên', isCarton: false },
    { code: 'Thùng', name: 'Thùng', isCarton: true },
    { code: 'Mét vuông', name: 'Mét vuông', isCarton: false },
  ]);
  assert.equal(String(data.uoms[2].areaMm2), '1000000');
  const cartons = data.conversions.filter(row => row.productBatchId);
  assert.equal(cartons.length, data.product_batches.filter(batch => batch.identificationStatus === 'VERIFIED').length);
  assert.ok(cartons.every(row => String(row.uomId) === String(data.uoms[1]._id)));
  const [po] = data.purchase_orders;
  const rr = data.replenishment_requests.find(row => String(row._id) === String(po.replenishmentRequestId));
  const approval = data.approval_history.find(row => String(row._id) === String(rr.header.latestDecisionId));
  assert.equal(String(approval.itemDecisions[0].approvedQtyBase), '120');
  assert.equal(String(rr.items[0].approvedQtyBase), '120');
  assert.equal(po.items[0].enteredUnit, po.items[0].baseUnitSnapshot);
  assert.equal(String(po.items[0].enteredQty), '120');
  assert.equal(String(po.items[0].lineAmount), '4200000');
  assert.equal(data.roles.filter(row=>!row.isSystemRole).length,1);
  assert.equal(data.sales_invoices[0].items.length,2);
  assert.notEqual(+data.sales_invoices[0].items[0].issuedAt,+data.sales_invoices[0].items[1].issuedAt);
  assert.equal(data.stocktake_counts.filter(row=>row.attemptNo===2).length,1);
  for(const old of ['product_uom_versions','business_documents','document_lines','line_links']) assert.ok(!Object.hasOwn(data,old));
});

test('destination receiver cannot be the source dispatcher',async()=>{
  const sample=clone();sample.goods_receipts.find(row=>row.documentKind==='TRANSFER').header.receivedBy=sample.transfer_dispatches[0].header.dispatchedBy;
  await assert.rejects(validateReviewedDemo(sample,models),/dispatcher cannot receive/);
});
