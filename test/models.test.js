import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as models from '../src/models/index.js';

const id = () => new mongoose.Types.ObjectId();
const when = new Date('2026-10-19T00:00:00Z');
const document = (documentKind, header) => new models.BusinessDocument({
  documentNo: `${documentKind}-001`, documentKind, createdBy: id(), ...(header && { header }),
});
const line = (extra = {}) => new models.DocumentLine({
  documentId: id(), lineNo: 1, productId: id(), conversionId: id(),
  enteredQty: '3', conversionSnapshot: '4', qtyBase: '12', productNameSnapshot: 'Tile', ...extra,
});
const movement = (extra = {}) => new models.StockMovement({
  batchId: id(), documentId: id(), lineId: id(), qtyBase: '0.1',
  fromBalanceId: id(), fromBefore: '0.3', fromAfter: '0.2', ...extra,
});
const invalid = async (doc, path) => assert.rejects(doc.validate(), (err) => {
  assert.equal(err.name, 'ValidationError');
  if (path) assert.ok(err.errors[path], `${path} not found in ${Object.keys(err.errors)}`);
  return true;
});
const hasIndex = (Model, fields, predicate = () => true) => Model.schema.indexes().some(
  ([keys, options]) => JSON.stringify(keys) === JSON.stringify(fields) && predicate(options),
);

test('central entry point reuses models and every ObjectId reference resolves', async () => {
  const again = await import('../src/models/index.js');
  assert.equal(again.User, models.User);
  assert.equal(again.BusinessDocument, models.BusinessDocument);
  const names = new Set(mongoose.modelNames());
  for (const name of names) {
    mongoose.model(name).schema.eachPath((pathName, path) => {
      const target = path.options.ref || path.caster?.options.ref || path.$embeddedSchemaType?.options.ref;
      if (target) assert.ok(names.has(target), `${name}.${pathName} references unknown ${target}`);
    });
  }
  assert.equal(models.User.schema.path('passwordHash').options.select, false);
  assert.deepEqual(models.ROLE_CODES, ['OWNER', 'SALES', 'WAREHOUSE', 'ACCOUNTANT', 'ADMIN']);
});

test('all 28 document kinds select their typed schemas in one collection', async () => {
  const warehouseId = id();
  const headers = {
    REPLENISHMENT: { warehouseId, neededOn: when, triggerReason: 'Low stock' },
    PO: { warehouseId, supplierId: id() },
    ARRIVAL: { warehouseId, arrivedAt: when },
    GR_PURCHASE: { warehouseId },
    TO: { warehouseId, taskKind: 'PUTAWAY', assignedTo: id() },
    TRANSFER_REQUEST: { sourceWarehouseId: warehouseId, destinationWarehouseId: id() },
    TRANSFER_DISPATCH: { requestId: id(), dispatchedBy: id(), dispatchedAt: when },
    MWTR: { dispatchId: id(), receivedBy: id(), receivedAt: when },
    HANDOVER: { relatedDocumentId: id(), recipientName: 'Customer', handedOverAt: when, confirmedBy: id() },
    ISSUE_REQUEST: { customerId: id(), requestedWarehouseId: warehouseId, neededOn: when, deliveryAddressSnapshot: 'Address' },
    OUTBOUND_DELIVERY: { issueRequestId: id(), warehouseId, plannedOn: when },
    GI_SALE: { warehouseId },
    DEFECT_CASE: { discoveredAt: when, reason: 'Damaged' },
    STOCKTAKE: { warehouseId, scopeLocationIds: [id()] },
    CUSTOMER_RETURN: { customerId: id(), warehouseId },
    GR_CUSTOMER_RETURN: { warehouseId },
    SUPPLIER_RETURN: { supplierId: id(), warehouseId },
    GI_SUPPLIER_RETURN: { warehouseId },
  };
  assert.equal(models.DOCUMENT_KINDS.length, 28);
  for (const kind of models.DOCUMENT_KINDS) {
    const doc = document(kind, headers[kind]);
    await doc.validate();
    assert.equal(doc.constructor.modelName, `BusinessDocument_${kind}`);
    assert.equal(doc.constructor.collection.name, 'business_documents');
    if (headers[kind]) await invalid(document(kind), 'header');
  }
  await invalid(document('PO', { warehouseId }), 'header.supplierId');
  await invalid(document('GR_PURCHASE', { warehouseId, receiptKind: 'CUSTOMER_RETURN' }), 'header.receiptKind');
  await invalid(document('GI_SALE', { warehouseId, issueKind: 'SUPPLIER_RETURN' }), 'header.issueKind');
  await invalid(document('UNSUPPORTED'), 'documentKind');
  const stocktake = document('STOCKTAKE', { warehouseId, mode: 'LIVE' });
  await invalid(stocktake, 'header.mode');
  await invalid(document('PO', { warehouseId, supplierId: id(), unrelated: true }), 'header');
});

test('all 11 line kinds retain typed detail fields and a shared line identity', async () => {
  const details = {
    INSPECTION: { inspectedSourceLineId: id(), qualityCode: 'GOOD', ownershipDecision: 'ACCEPT', inspectedBy: id(), inspectedAt: when },
    TRANSFER_RECEIPT: { dispatchLineId: id(), qualityCode: 'GOOD' },
    ISSUE_REQUEST: { externalLineId: id(), releaseKey: 'release-1' },
    WAREHOUSE_TASK: { fromLocationId: id(), toLocationId: id(), qualityCode: 'GOOD' },
    DISPOSITION: { defectLineId: id(), outcome: 'SCRAP' },
    CUSTOMER_RETURN: { originalIssueLineId: id(), reason: 'Return' },
    SUPPLIER_RETURN: { originLineId: id(), ownerPartyId: id(), agreedQty: '12' },
    SUPPLIER_ACK: { dispatchLineId: id(), outcome: 'ACCEPTED', acknowledgedAt: when },
    DISCREPANCY: { sourceLineId: id(), discrepancyKind: 'SHORT' },
    ADJUSTMENT: { countId: id(), deltaQty: '-12' },
  };
  for (const kind of models.LINE_KINDS) {
    const doc = line({ lineKind: kind, ...(details[kind] && { details: details[kind] }) });
    await doc.validate();
    assert.equal(doc.constructor.collection.name, 'document_lines');
    if (kind !== 'STANDARD') await invalid(line({ lineKind: kind }), 'details');
  }
  assert.equal(line().lineKind, 'STANDARD');
  await invalid(line({ lineKind: 'ADJUSTMENT', details: { countId: id(), deltaQty: '0' } }), 'details.deltaQty');
  await invalid(line({ lineKind: 'ADJUSTMENT', details: { countId: id(), deltaQty: '-11' } }), 'qtyBase');
});

test('quantities preserve exact decimal arithmetic, ranges and scale', async () => {
  await line({ enteredQty: '0.1', conversionSnapshot: '3', qtyBase: '0.3' }).validate();
  await line({ enteredQty: '3', conversionSnapshot: '0.333333333333', qtyBase: '1' }).validate();
  await line({ enteredQty: '0.000001', conversionSnapshot: '1.5', qtyBase: '0.000002' }).validate();
  const high = line({ enteredQty: '99999999999999.999999', conversionSnapshot: '1', qtyBase: '99999999999999.999999' });
  await high.validate();
  assert.equal(high.qtyBase.toString(), '99999999999999.999999');
  for (const value of ['-1', '0', 'NaN', 'Infinity', '100000000000000', '0.0000001', 0.1]) {
    await invalid(line({ enteredQty: value }), 'enteredQty');
  }
  await invalid(line({ qtyBase: '11.999999' }), 'qtyBase');
  await invalid(line({ conversionSnapshot: '0.0000000000001' }), 'conversionSnapshot');
  await invalid(line({ lineNo: 1.5 }), 'lineNo');
});

test('master data and local relationships reject incompatible combinations', async () => {
  const locationId = id();
  await new models.Location({ warehouseId: id(), code: 'A', kind: 'STORAGE', allocatable: true }).validate();
  await invalid(new models.Location({ warehouseId: id(), code: 'A', kind: 'STAGING', allocatable: true }), 'allocatable');
  await invalid(document('TRANSFER_REQUEST', { sourceWarehouseId: locationId, destinationWarehouseId: locationId }), 'header.destinationWarehouseId');
  await invalid(line({ lineKind: 'WAREHOUSE_TASK', details: { fromLocationId: locationId, toLocationId: locationId, qualityCode: 'GOOD' } }), 'details.toLocationId');
  await new models.StockAccount({ locationId }).validate();
  await new models.StockAccount({ transitDispatchLineId: id() }).validate();
  await invalid(new models.StockAccount({}), 'locationId');
  await invalid(new models.StockAccount({ locationId, transitDispatchLineId: id() }), 'locationId');
  await invalid(new models.User({ username: 'a', fullName: 'A', passwordHash: 'hash', roleIds: [locationId, locationId] }), 'roleIds');
  await invalid(new models.DocumentLink({ parentDocumentId: locationId, childDocumentId: locationId, relationCode: 'SOURCE' }), 'childDocumentId');
  await invalid(new models.LineLink({ sourceLineId: locationId, targetLineId: locationId, relationCode: 'SOURCE', linkedQty: '1' }), 'targetLineId');
});

test('customer-return source is exclusive, without fabricating historical GI lines', async () => {
  const returned = (details) => line({ lineKind: 'CUSTOMER_RETURN', details: { reason: 'Returned', ...details } });
  await returned({ originalIssueLineId: id() }).validate();
  await returned({ historicalExternalLineId: id() }).validate();
  await invalid(returned({}), 'details.originalIssueLineId');
  await invalid(returned({ originalIssueLineId: id(), historicalExternalLineId: id() }), 'details.originalIssueLineId');
});

test('approval forbids self-approval and duplicate line decisions', async () => {
  const actor = id();
  const approval = (extra) => new models.Approval({
    documentId: id(), documentVersion: 1, decisionKind: 'RELEASE', decision: 'APPROVE',
    requestedBy: actor, decidedBy: id(), reason: 'Verified', ...extra,
  });
  await approval({ lines: [{ lineId: id(), approvedQty: '0', outcome: 'REJECT' }] }).validate();
  await invalid(approval({ decidedBy: actor }), 'decidedBy');
  const lineId = id();
  await invalid(approval({ lines: [
    { lineId, approvedQty: '2', outcome: 'ACCEPT' }, { lineId, approvedQty: '2', outcome: 'ACCEPT' },
  ] }), 'lines');
});

test('movement arithmetic handles receipt, issue, transfer and malformed endpoints', async () => {
  await movement().validate();
  await movement({ fromBalanceId: undefined, fromBefore: undefined, fromAfter: undefined,
    toBalanceId: id(), toBefore: '0', toAfter: '0.1' }).validate();
  await movement({ toBalanceId: id(), toBefore: '0.2', toAfter: '0.3' }).validate();
  await invalid(movement({ fromAfter: '0.1' }), 'fromAfter');
  await invalid(movement({ fromBefore: '0', fromAfter: '-0.1' }), 'fromAfter');
  await invalid(movement({ fromBefore: undefined }), 'fromBefore');
  await invalid(movement({ fromBalanceId: undefined, fromBefore: undefined, fromAfter: undefined }), 'fromBalanceId');
  await invalid(movement({ toBefore: '0' }), 'toBefore');
  const balanceId = id();
  await invalid(movement({ fromBalanceId: balanceId, toBalanceId: balanceId, toBefore: '0', toAfter: '0.1' }), 'toBalanceId');
});

test('missing stocktake count and an explicit zero count remain distinct', async () => {
  const base = { snapshotId: id(), attemptNo: 1, countedBy: id(), countedAt: when };
  await invalid(new models.CountAttempt(base), 'countedQty');
  await new models.CountAttempt({ ...base, countedQty: '0' }).validate();
  await invalid(new models.CountAttempt({ ...base, countedQty: '-1' }), 'countedQty');
  await invalid(new models.CountAttempt({ ...base, countedQty: '0', attemptNo: 0 }), 'attemptNo');
});

test('schema declares unique/idempotency/reconciliation indexes without nullable collisions', () => {
  const unique = (options) => options.unique === true;
  assert.ok(hasIndex(models.User, { username: 1 }, unique));
  assert.ok(hasIndex(models.Location, { warehouseId: 1, code: 1 }, unique));
  assert.ok(hasIndex(models.Party, { kind: 1 }, (o) => o.unique && o.partialFilterExpression.kind === 'STORE'));
  assert.ok(hasIndex(models.ProductUomVersion, { productId: 1, uomId: 1, version: 1 }, unique));
  assert.ok(hasIndex(models.StockBalance, { accountId: 1, lotId: 1, qualityCode: 1, ownerPartyId: 1 }, unique));
  assert.ok(hasIndex(models.PostingBatch, { idempotencyKey: 1 }, unique));
  assert.ok(hasIndex(models.PostingBatch, { documentId: 1, operation: 1, operationKey: 1 }, unique));
  for (const field of ['locationId', 'transitDispatchLineId']) {
    assert.ok(hasIndex(models.StockAccount, { [field]: 1 }, (o) => o.unique && o.partialFilterExpression[field].$type === 'objectId'));
  }
  assert.ok(hasIndex(models.PostingBatch, { reversalOf: 1 }, (o) => o.unique && o.partialFilterExpression.reversalOf.$type === 'objectId'));
  assert.ok(hasIndex(models.DocumentLine, { 'details.externalLineId': 1, 'details.releaseKey': 1 },
    (o) => o.unique && o.partialFilterExpression.lineKind === 'ISSUE_REQUEST'));
  assert.ok(hasIndex(models.LocationLock, { locationId: 1 }, unique));
  assert.ok(hasIndex(models.StocktakeSnapshot, { stocktakeId: 1, balanceId: 1 }, unique));
  assert.ok(hasIndex(models.CountAttempt, { snapshotId: 1, attemptNo: 1 }, unique));
  assert.ok(hasIndex(models.OutboxEvent, { eventKey: 1 }, unique));
});

test('append-only history rejects normal query, document and bulk mutation before DB access', async () => {
  for (const Model of [models.ProductUomVersion, models.Approval, models.Evidence,
    models.PostingBatch, models.StockMovement, models.StocktakeSnapshot, models.CountAttempt, models.AuditEvent]) {
    await assert.rejects(Model.updateOne({}, { $set: { note: 'changed' } }).exec(), /append-only/);
    await assert.rejects(Model.deleteMany({}).exec(), /append-only/);
    await assert.rejects(Model.bulkWrite([{ deleteOne: { filter: { _id: id() } } }]), /append-only/);
    await assert.rejects(new Model().deleteOne(), /append-only/);
  }
});
