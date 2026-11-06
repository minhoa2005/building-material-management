import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { buildHistoricalSource } from '../src/seeds/rebuild/historical-source.js';
import { registerMigrationModels } from '../src/models/index.js';
import { transformSnapshot } from '../src/migrations/rebuild/transform.js';
import { fingerprint, validateTarget, verifyGraph } from '../src/migrations/rebuild/verify.js';
import { verifyReferences } from '../src/migrations/rebuild/references.js';

const source = buildHistoricalSource();
const models = registerMigrationModels(mongoose.createConnection());
const { target, issues } = transformSnapshot(source);

test('rebuild preserves document/item identities, sources, stock and external documents', () => {
  const result = verifyGraph(source,target);
  assert.deepEqual(verifyReferences(target,models),[]);
  assert.equal(result.documents,source.business_documents.length);
  assert.equal(result.items,source.document_lines.length);
  assert.equal(result.documentLinks,source.document_links.length);
  assert.equal(result.itemLinks,source.line_links.length);
  assert.equal(result.balances,source.stock_balances.length);
  assert.deepEqual(target.external_references,source.external_references);
  assert.deepEqual(target.external_reference_lines,source.external_reference_lines);
  for (const removed of ['uoms','product_uom_versions','parties','business_documents','document_lines','line_links','document_links']) {
    assert.equal(Object.hasOwn(target,removed),false);
  }
});

test('handover becomes a child of its dispatch and maintains its original line ID', () => {
  const old = source.business_documents.find(row => row.documentKind === 'HANDOVER');
  const dispatch = target.transfer_dispatches.find(row => row._id.equals(old.header.relatedDocumentId));
  assert.equal(dispatch.handovers.length,1);
  const handover = dispatch.handovers[0];
  assert.ok(handover._id.equals(old._id));
  const oldLine = source.document_lines.find(row => row.documentId.equals(old._id));
  assert.ok(handover.items[0]._id.equals(oldLine._id));
  assert.deepEqual(handover.items[0].sources[0].itemId, source.line_links.find(row => row.targetLineId.equals(oldLine._id)).sourceLineId);
});

test('historical conversion uses line snapshot even if master conversion has changed', () => {
  const modified = { ...source, product_uom_versions:source.product_uom_versions.map(row => ({ ...row, basePerUnit:mongoose.Types.Decimal128.fromString('999') })) };
  const changed = transformSnapshot(modified).target;
  verifyGraph(source,changed);
  assert.deepEqual(changed.sales_orders[0].items[0].baseUnitsPerUnit,target.sales_orders[0].items[0].baseUnitsPerUnit);
});

test('unknown collections and missing source references stop the migration', () => {
  assert.throws(() => transformSnapshot({ ...source, mystery_collection:[] }), /Unmapped source collection/);
  assert.throws(() => transformSnapshot({ ...source, document_lines:source.document_lines.slice(1) }), /Missing/);
});

test('wrong historical quantities and stock differences are rejected', () => {
  const changed = { ...source, document_lines:source.document_lines.map((row,i) => i ? row : { ...row, qtyBase:mongoose.Types.Decimal128.fromString('999') }) };
  assert.throws(() => transformSnapshot(changed), /Historical quantity mismatch/);
  const wrong = { ...target, inventory_balances:target.inventory_balances.map((row,i) => i ? row : { ...row, quantityBase:mongoose.Types.Decimal128.fromString('999') }) };
  assert.throws(() => verifyGraph(source,wrong),/Stock identity or balance changed/);
});

test('source snapshot stays immutable and reruns produce the same data', () => {
  const before = fingerprint(source);
  const another = transformSnapshot(source);
  assert.equal(fingerprint(source),before);
  assert.equal(fingerprint(another.target),fingerprint(target));
  const reordered = Object.fromEntries(Object.entries(source).reverse().map(([name,rows]) => [name,[...rows].reverse()]));
  assert.equal(fingerprint(reordered),before);
});

test('missing manufacturer, customer phone and historical prices are reported, never filled', async () => {
  assert.ok(issues.some(row => row.field === 'manufacturerCode'));
  assert.ok(issues.some(row => row.field === 'phone'));
  assert.ok(issues.some(row => row.field === 'items.unitPurchasePrice'));
  assert.ok(issues.some(row => row.field === 'items.unitSellingPrice'));
  const failures = await validateTarget(target,models);
  assert.deepEqual(new Set(failures.map(row => row.collection)),new Set(['products','customers','purchase_orders','sales_orders']));
});

test('rebuilt invoice calculates accepted quantities and rejects billed excess', async () => {
  const id = () => new mongoose.Types.ObjectId();
  const Invoice = models.get('sales_invoices');
  const invoice = new Invoice({
    invoiceNo:'HD-001',salesOrderId:id(),customerId:id(),customerSnapshot:{name:'Test',phone:'0900000000'},
    currencyCode:'VND',status:'ISSUED',createdBy:id(),issuedBy:id(),issuedAt:new Date(),version:1,totalAmount:'4900000',
    items:[{salesOrderItemId:id(),goodsIssueId:id(),goodsIssueItemId:id(),goodsIssueNo:'PX-001',issuedAt:new Date(),
      productId:id(),productNameSnapshot:'Tile',issuedQtyBase:'100',billedQtyBase:'98',saleUnit:'Thùng',
      baseUnitsPerSaleUnit:'4',unitSellingPrice:'200000',lineAmount:'4900000'}],
  });
  await invoice.validate();
  invoice.items[0].billedQtyBase='101';
  await assert.rejects(invoice.validate(),/Invalid invoiced quantity/);
});

test('schema changes allow custom roles and enforce ownership/dimension constraints', async () => {
  await new (models.get('roles'))({code:'WAREHOUSE_LEAD',name:'Trưởng ca kho'}).validate();
  const Warehouse = models.get('warehouses');
  await new Warehouse({code:'WH',name:'Warehouse'}).validate();
  await assert.rejects(new Warehouse({code:'WH',name:'Warehouse',lengthMm:1000}).validate(),/all three dimensions/);
  const Point = models.get('stock_holding_points');
  await assert.rejects(new Point({type:'LOCATION',dispatchLineId:new mongoose.Types.ObjectId()}).validate(),/matching location/);
});
