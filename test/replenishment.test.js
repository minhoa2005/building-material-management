import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/index.js';
import { buildDemoData } from '../src/seeds/data/demo.data.js';
import { ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';

const id = () => new mongoose.Types.ObjectId();
const when = new Date('2026-10-27T01:00:00Z');
const invalid = async (doc, path) => assert.rejects(doc.validate(), (error) => {
  assert.equal(error.name, 'ValidationError');
  if (path) assert.ok(error.errors[path], `${path}: ${Object.keys(error.errors)}`);
  return true;
});
const rr = (extra = {}) => new m.BusinessDocument({
  documentKind: 'REPLENISHMENT', documentNo: 'RR-TEST', createdBy: id(),
  header: { warehouseId: id(), neededOn: when, triggerReason: 'Source-backed replenishment',
    creationKey: 'stable-command', ...extra },
});
const evaluated = () => ({ evaluationKey: 'source:version:coverage', evaluatedAt: when,
  availableQtySnapshot: '18', incomingCoverageQtySnapshot: '10', pendingRequestCoverageQtySnapshot: '0',
  suggestedQty: '22', reasonNote: '18 available + 10 incoming, target 50' });
const lowStock = () => ({ ...evaluated(), triggerType: 'STOCKTAKE_LOW_STOCK',
  sourceStocktakeId: id(), sourceStocktakeVersion: 2, policyId: id(), policyVersion: 1,
  minimumQtySnapshot: '50', targetQtySnapshot: '50' });
const salesShortage = () => ({ ...evaluated(), triggerType: 'SALES_SHORTAGE',
  sourceSalesOrderLineId: id(), sourceSalesOrderVersion: 1, remainingDemandQtySnapshot: '50',
  reservedForDemandQtySnapshot: '0', onHandCoverageQtySnapshot: '18', otherWarehouseCoverageQtySnapshot: '0' });
const line = (details, qtyBase = '22') => new m.DocumentLine({
  documentId: id(), lineNo: 1, lineKind: 'REPLENISHMENT', productId: id(), conversionId: id(),
  enteredQty: qtyBase, conversionSnapshot: '1', qtyBase, productNameSnapshot: 'Tile', details,
});
const notice = (extra = {}) => new m.Notification({
  recipientId: id(), type: 'LOW_STOCK_AFTER_STOCKTAKE', warehouseId: id(),
  title: 'Low stock after count', message: 'Open to reevaluate current coverage',
  sourceDocumentId: id(), sourceDocumentVersion: 2, eventKey: 'count:closed:2', evaluatedAt: when, ...extra,
});

test('policy defaults target to minimum and enforces exact nonnegative target >= minimum', async () => {
  const policy = (extra = {}) => new m.ProductWarehousePolicy({ productId: id(), warehouseId: id(), minimumQty: '0.123456', ...extra });
  const minimumOnly = policy();
  await minimumOnly.validate();
  assert.equal(minimumOnly.targetQty.toString(), '0.123456');
  assert.equal(minimumOnly.version, 1);
  await invalid(policy({ targetQty: '0.123455' }), 'targetQty');
  await invalid(policy({ minimumQty: '-1' }), 'minimumQty');
  await invalid(policy({ targetQty: '0.1234567' }), 'targetQty');
  await invalid(policy({ version: 1.5 }), 'version');
});

test('RR creation uses one form with a real actor, stable key, reason and paired submission facts', async () => {
  await rr().validate();
  for (const field of ['creationKey', 'triggerReason']) await invalid(rr({ [field]: undefined }), `header.${field}`);
  await invalid(rr({ unexpectedField: 'invalid' }), 'header');
  await invalid(rr({ creationKey: ' ' }), 'header.creationKey');
  await invalid(rr({ submittedBy: id() }), 'header.submittedAt');
  await rr({ submittedBy: id(), submittedAt: when }).validate();
  const missingActor = rr();
  missingActor.createdBy = undefined;
  await invalid(missingActor, 'createdBy');
});

test('evaluated RR sources are required, typed and independent of WIR existence', async () => {
  await line(salesShortage()).validate();
  await line(lowStock()).validate();
  for (const field of ['sourceSalesOrderLineId', 'sourceSalesOrderVersion', 'evaluatedAt', 'suggestedQty']) {
    await invalid(line({ ...salesShortage(), [field]: undefined }), `details.${field}`);
  }
  for (const field of ['sourceStocktakeId', 'sourceStocktakeVersion', 'policyId', 'policyVersion']) {
    await invalid(line({ ...lowStock(), [field]: undefined }), `details.${field}`);
  }
  await invalid(line({ ...salesShortage(), sourceIssueRequestLineId: id() }), 'details.sourceIssueRequestVersion');
  await line({ ...salesShortage(), sourceIssueRequestLineId: id(), sourceIssueRequestVersion: 1 }).validate();
  await invalid(line({ ...salesShortage(), sourceStocktakeId: id() }), 'details.sourceStocktakeId');
  await invalid(line({ ...lowStock(), sourceSalesOrderLineId: id() }), 'details.sourceSalesOrderLineId');
  await invalid(line({ ...lowStock(), targetQtySnapshot: '49' }), 'details.targetQtySnapshot');
  await invalid(line({ ...lowStock(), incomingCoverageQtySnapshot: '-1' }), 'details.incomingCoverageQtySnapshot');
});

test('quantity edits need an explanation and free-text reasons retain structured source refs', async () => {
  const source = salesShortage();
  await invalid(line(source, '20'), 'details.quantityAdjustmentReason');
  const adjusted = line({ ...source, quantityAdjustmentReason: 'Partial replenishment first', reasonNote: 'Edited by user' }, '20');
  await adjusted.validate();
  assert.equal(String(adjusted.details.sourceSalesOrderLineId), String(source.sourceSalesOrderLineId));
  assert.equal(adjusted.details.suggestedQty.toString(), '22');
  await invalid(line({ ...source, quantityAdjustmentReason: 'Buy extra stock' }, '24'), 'qtyBase');
  await line({ triggerType: 'MANUAL_OTHER', reasonNote: 'Planned reserve for a new product' }).validate();
  await invalid(line({ triggerType: 'MANUAL_OTHER', reasonNote: ' ', sourceStocktakeId: id() }), 'details.sourceStocktakeId');
});

test('notifications have independent stable recipient keys and require stocktake warehouse/context', async () => {
  const first = notice();
  await first.validate();
  assert.equal(first.readAt, null);
  assert.equal(first.dedupKey, m.notificationDedupKey(first));
  const same = new m.Notification(first.toObject());
  same.readAt = when;
  await same.validate();
  assert.equal(same.dedupKey, first.dedupKey);
  for (const change of [{ recipientId: id() }, { warehouseId: id() }, { eventKey: 'count:closed:3' }]) {
    const other = notice({ ...first.toObject(), ...change, dedupKey: undefined });
    await other.validate();
    assert.notEqual(other.dedupKey, first.dedupKey);
  }
  await invalid(notice({ warehouseId: undefined }), 'warehouseId');
  await invalid(notice({ sourceDocumentVersion: undefined }), 'sourceDocumentVersion');
  await invalid(notice({ dedupKey: 'forged-key' }), 'dedupKey');
  await notice({ type: 'SALES_SHORTAGE', warehouseId: undefined }).validate();
  assert.equal(m.Notification.schema.path('suggestedQty'), undefined);
});

test('SO/count outbox triggers require source version without restricting other business events', async () => {
  for (const eventType of ['STOCKTAKE_CLOSED', 'SALES_ORDER_SAVED']) {
    await invalid(new m.OutboxEvent({ documentId: id(), eventType, eventKey: eventType }), 'documentVersion');
    await new m.OutboxEvent({ documentId: id(), eventType, eventKey: eventType, documentVersion: 1 }).validate();
  }
  await new m.OutboxEvent({ documentId: id(), eventType: 'RECEIPT_POSTED', eventKey: 'receipt-posted' }).validate();
});

test('planning, source lookup and notification indexes declare the required identities', () => {
  const has = (Model, fields, unique = false) => Model.schema.indexes().some(([keys, options]) =>
    JSON.stringify(keys) === JSON.stringify(fields) && (!unique || options.unique));
  assert.ok(has(m.BusinessDocument, { createdBy: 1, 'header.creationKey': 1 }, true));
  assert.ok(has(m.ReplenishmentPlanningGuard, { warehouseId: 1, productId: 1 }, true));
  assert.ok(has(m.Notification, { dedupKey: 1 }, true));
  assert.ok(has(m.DocumentLink, { childDocumentId: 1 }));
  assert.ok(has(m.DocumentLine, { 'details.sourceStocktakeId': 1 }));
  assert.ok(has(m.Notification, { recipientId: 1, readAt: 1, createdAt: -1 }));
  for (const role of ['OWNER', 'WAREHOUSE', 'SALES']) assert.ok(ROLE_PERMISSIONS[role].includes('notification:read'));
  for (const role of ['ADMIN', 'ACCOUNTANT']) assert.ok(!ROLE_PERMISSIONS[role].includes('notification:read'));
  assert.ok(!ROLE_PERMISSIONS.OWNER.includes('replenishment_request:create'));
});

test('seed separates closed-count notifications, explicit user-created RRs and an unhandled zero-stock item', async () => {
  const data = new Map((await buildDemoData()).map(({ Model, documents }) => [Model.modelName, documents]));
  const docs = data.get('BusinessDocument');
  const lines = data.get('DocumentLine');
  const rrs = docs.filter((doc) => doc.documentKind === 'REPLENISHMENT');
  for (const request of rrs) {
    assert.ok(data.get('BusinessOperation').some((op) => op.documentId.equals(request._id) && op.performedBy.equals(request.createdBy)));
    assert.ok(!data.get('PostingBatch').some((batch) => batch.documentId.equals(request._id)));
  }
  const closed = docs.find((doc) => doc.documentNo === 'DEMO-STOCKTAKE-CLOSED');
  assert.equal(closed.workflowStatus, 'CLOSED');
  assert.ok(!data.get('LocationLock').some((lock) => lock.stocktakeId.equals(closed._id)));
  const notifications = data.get('Notification').filter((item) => item.sourceDocumentId.equals(closed._id));
  assert.equal(notifications.length, 2);
  assert.equal(notifications.filter((item) => item.readAt == null).length, 1);
  for (const item of notifications) {
    const recipient = data.get('User').find((user) => user._id.equals(item.recipientId));
    assert.ok(recipient.warehouseIds.some((warehouseId) => warehouseId.equals(item.warehouseId)));
    assert.ok(data.get('OutboxEvent').some((event) => event.eventKey === item.eventKey && event.deliveredAt != null));
  }
  const source = docs.find((doc) => doc.documentNo === 'DEMO-SO-SHORTAGE');
  assert.ok(!docs.some((doc) => doc.documentKind === 'ISSUE_REQUEST' && doc.header.salesOrderId.equals(source._id)));
  const salesRr = rrs.find((doc) => doc.documentNo === 'DEMO-RR-SALES');
  const salesLines = lines.filter((item) => item.documentId.equals(salesRr._id));
  assert.equal(salesLines.length, 2);
  const sourceLine = salesLines.find((item) => item.details.triggerType === 'SALES_SHORTAGE');
  const extraLine = salesLines.find((item) => item.details.triggerType === 'MANUAL_OTHER');
  assert.equal(String(lines.find((item) => item._id.equals(sourceLine.details.sourceSalesOrderLineId)).documentId), String(source._id));
  assert.ok(!extraLine.productId.equals(sourceLine.productId));
  assert.equal(extraLine.details.sourceSalesOrderLineId, undefined);
  assert.ok(extraLine.details.reasonNote);
  assert.equal(extraLine.details.evaluationKey, 'demo:manual-reserve:product2:v1');
  assert.equal(extraLine.details.availableQtySnapshot.toString(), '0');
  assert.equal(extraLine.details.minimumQtySnapshot.toString(), '20');
  assert.equal(extraLine.details.targetQtySnapshot.toString(), '20');
  assert.equal(extraLine.details.suggestedQty.toString(), '20');
  assert.ok(extraLine.details.quantityAdjustmentReason);
  assert.ok(!data.get('LineLink').some((link) => link.targetLineId.equals(extraLine._id)));
  const zeroCount = data.get('CountAttempt').find((item) => item.countedQty.toString() === '0');
  assert.ok(zeroCount);
  const snapshot = data.get('StocktakeSnapshot').find((item) => item._id.equals(zeroCount.snapshotId));
  const zeroBalance = data.get('StockBalance').find((item) => item._id.equals(snapshot.balanceId));
  const zeroProduct = data.get('Lot').find((item) => item._id.equals(zeroBalance.lotId)).productId;
  const closedWarehouseId = closed.header.warehouseId;
  assert.ok(!lines.some((item) => item.lineKind === 'REPLENISHMENT' && item.productId.equals(zeroProduct)
    && rrs.find((request) => request._id.equals(item.documentId)).header.warehouseId.equals(closedWarehouseId)));
  for (const allocation of data.get('DemandSupplyAllocation')) {
    assert.equal(lines.find((item) => item._id.equals(allocation.demandLineId)).lineKind, 'SALES_ORDER');
  }
});

test('a saved SO with no compatible source has a notice but no implicit RR or WIR', async () => {
  const data = new Map((await buildDemoData()).map(({ Model, documents }) => [Model.modelName, documents]));
  const docs = data.get('BusinessDocument');
  const so = docs.find((doc) => doc.documentNo === 'DEMO-SO-NO-SUPPLY');
  assert.equal(so.workflowStatus, 'OPEN');
  const sourceLine = data.get('DocumentLine').find((item) => item.documentId.equals(so._id));
  assert.ok(!data.get('Lot').some((lot) => lot.productId.equals(sourceLine.productId) && lot.tone === sourceLine.details.requiredTone));
  assert.ok(data.get('Notification').some((notice) => notice.sourceDocumentId.equals(so._id)));
  assert.ok(data.get('OutboxEvent').some((event) => event.documentId.equals(so._id)
    && event.eventType === 'SALES_ORDER_SAVED' && event.documentVersion === so.version && event.deliveredAt));
  assert.ok(!data.get('DocumentLine').some((line) => line.lineKind === 'REPLENISHMENT'
    && line.details.sourceSalesOrderLineId?.equals(sourceLine._id)));
  assert.ok(!docs.some((doc) => doc.documentKind === 'ISSUE_REQUEST' && doc.header.salesOrderId.equals(so._id)));
});
