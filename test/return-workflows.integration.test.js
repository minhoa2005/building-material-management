import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import app from '../src/app.js';
import * as m from '../src/models/index.js';
import { buildDemoData } from '../src/seeds/data/demo.data.js';
import * as sr from '../src/modules/return-workflows/supplier-return.service.js';
import * as returns from '../src/modules/return-workflows/return-receipt.service.js';
import * as cr from '../src/modules/customer-returns/customer-return.service.js';
import * as reads from '../src/modules/return-workflows/workflow.read.js';
import * as defects from '../src/modules/defects/defect.service.js';

test('return workflows persist scoped source claims, agreement, dispatch, acknowledgement and receipts atomically', { skip: !process.env.MONGODB_TEST_URI, timeout: 120000 }, async () => {
  const dbName = `ret_test_${new mongoose.Types.ObjectId()}`;
  const key = () => `returns-test-${new mongoose.Types.ObjectId()}`;
  const sid = (v) => String(v._id ?? v);
  const rejects = (fn, status) => assert.rejects(fn, (e) => e.statusCode === status);
  let server;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName, autoCreate: false, autoIndex: false, serverSelectionTimeoutMS: 10000 });
    assert.match(mongoose.connection.name, /^ret_test_[a-f\d]{24}$/);
    const groups = await buildDemoData();
    for (const { Model, documents } of groups) if (documents.length) await Model.collection.insertMany(documents.map((d) => d.toObject()));
    for (const Model of [m.BusinessOperation, m.PostingBatch, m.ReturnSourceGuard]) await Model.createIndexes();
    const users = {};
    for (const [name, username] of Object.entries({ warehouse: 'warehouse@ceratile.vn', sales: 'sales@ceratile.vn', accountant: 'accountant@ceratile.vn', owner: 'owner@ceratile.vn' })) users[name] = await m.User.findOne({ username }).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
    const warehouse = await m.Warehouse.findOne({ code: 'WH01' });
    const supplier = await m.Party.findOne({ kind: 'SUPPLIER' });
    const store = await m.Party.findOne({ kind: 'STORE' });
    const location = await m.Location.findOne({ warehouseId: warehouse._id, kind: 'STORAGE' });
    const account = await m.StockAccount.findOne({ locationId: location._id });
    const balance = await m.StockBalance.findOne({ accountId: account._id, qualityCode: 'GOOD', ownerPartyId: store._id });
    const receipt = await m.BusinessDocument.findOne({ documentKind: 'GR_PURCHASE' });
    const receiptLine = await m.DocumentLine.findOne({ documentId: receipt._id });
    const input = { warehouseId: sid(warehouse), supplierId: sid(supplier), idempotencyKey: key(), note: 'Return two pieces under a verified supplier agreement', lines: [{ originLineId: sid(receiptLine), balanceId: sid(balance), qtyBase: '2' }] };
    const created = await sr.createSupplierReturn(users.warehouse, input);
    assert.equal((await sr.createSupplierReturn(users.warehouse, input)).documentId, created.documentId);
    let detail = await sr.supplierReturnDetail(users.accountant, created.documentId);
    const evidence = await m.Evidence.create({ documentId: created.documentId, objectKey: 'isolated-test/evidence', sha256: 'a'.repeat(64), mediaType: 'image/png', uploadedBy: users.accountant._id });
    await sr.supplierAgreement(users.accountant, created.documentId, { expectedVersion: detail.version, idempotencyKey: key(), note: 'Verified agreement', reference: 'TEST-AGREEMENT', evidenceIds: [sid(evidence)], lines: [{ lineId: detail.lines[0]._id, qtyBase: '2' }] });
    detail = await sr.supplierReturnDetail(users.warehouse, created.documentId);
    const before = (await m.StockBalance.findById(balance._id)).qtyBase.toString();
    const dispatchInput = { expectedVersion: detail.version, idempotencyKey: key(), note: 'Actual supplier handover', evidenceIds: [sid(evidence)], lines: [{ lineId: detail.lines[0]._id, qtyBase: '2' }] };
    const dispatch = await sr.dispatchSupplierReturn(users.warehouse, created.documentId, dispatchInput);
    assert.equal(dispatch.status, 'DISPATCHED');
    await sr.dispatchSupplierReturn(users.warehouse, created.documentId, dispatchInput);
    assert.equal(Number((await m.StockBalance.findById(balance._id)).qtyBase.toString()), Number(before) - 2);
    detail = await sr.supplierReturnDetail(users.accountant, created.documentId);
    const giLine = detail.linkedDocuments.find((x) => x.relationCode === 'SUPPLIER_RETURN_DISPATCH').lines[0];
    await sr.acknowledgeSupplierReturn(users.accountant, created.documentId, { expectedVersion: detail.version, idempotencyKey: key(), note: 'Supplier received exactly two pieces', evidenceIds: [sid(evidence)], lines: [{ lineId: giLine._id, qtyBase: '2', outcome: 'ACCEPTED' }] });
    detail = await sr.supplierReturnDetail(users.accountant, created.documentId);
    await sr.closeSupplierReturn(users.accountant, created.documentId, { expectedVersion: detail.version, idempotencyKey: key(), note: 'All warehouse quantities reconciled' });
    assert.equal((await sr.supplierReturnDetail(users.accountant, created.documentId)).workflowStatus, 'COMPLETED');
    const defectLocation = await m.Location.create({ warehouseId: warehouse._id, code: 'TEST-DEFECT', kind: 'STORAGE', isActive: true, allocatable: true });
    const defectAccount = await m.StockAccount.create({ locationId: defectLocation._id });
    const defectBalance = await m.StockBalance.create({ accountId: defectAccount._id, lotId: balance.lotId, ownerPartyId: store._id, qualityCode: 'GOOD', qtyBase: '10' });
    const defectInput = { warehouseId: sid(warehouse), balanceId: sid(defectBalance), quantity: '2', sourceKind: 'MANUAL', reason: 'Two physically cracked pieces', disposition: { outcome: 'SCRAP', quantity: '2', reason: 'Unsafe to sell' } };
    let defect = await defects.createDefect(users.warehouse, defectInput, { publicId: 'isolated-test/defect', sha256: 'd'.repeat(64), mediaType: 'image/png' });
    assert.equal((await m.StockBalance.findById(defectBalance._id)).qtyBase.toString(), '10');
    await defects.decideDefect(users.owner, defect._id, { expectedVersion: defect.dispositions[0].document.version, decision: 'APPROVE', reason: 'Destruction justified by inspection' });
    defect = await defects.addDefectEvidence(users.warehouse, defect._id, { publicId: 'isolated-test/execution', sha256: 'e'.repeat(64), mediaType: 'image/png' });
    const executionInput = { expectedVersion: defect.version, idempotencyKey: key(), evidenceId: defect.evidence.at(-1).id, note: 'Actually destroyed two pieces' };
    await defects.executeDefect(users.warehouse, defect._id, executionInput);
    await defects.executeDefect(users.warehouse, defect._id, executionInput);
    assert.equal((await m.StockBalance.findById(defectBalance._id)).qtyBase.toString(), '8');
    const released = await defects.createDefect(users.warehouse, { ...defectInput, quantity: '1', disposition: { outcome: 'RELEASE', quantity: '1', targetQuality: 'GOOD', reason: 'Inspection confirmed the tile is intact' } }, { publicId: 'isolated-test/release', sha256: 'f'.repeat(64), mediaType: 'image/png' });
    await defects.decideDefect(users.owner, released._id, { expectedVersion: released.dispositions[0].document.version, decision: 'APPROVE', reason: 'Safe to release the hold' });
    await defects.executeDefect(users.warehouse, released._id, { expectedVersion: released.version, idempotencyKey: key(), evidenceId: released.evidence[0].id, note: 'Released without changing physical stock' });
    assert.equal((await m.StockBalance.findById(defectBalance._id)).qtyBase.toString(), '8');
    assert.equal(Number((await m.StockBalance.findById(balance._id)).qtyBase.toString()), Number(before) - 2, 'ACK and closure never deduct twice');
    await rejects(() => sr.dispatchSupplierReturn(users.warehouse, created.documentId, { ...dispatchInput, idempotencyKey: key() }), 409);

    const sources = await reads.options(users.sales);
    assert.ok(sources.sourceLines.length);
    let source, context;
    for (const candidate of sources.sourceLines) {
      const row = await m.DocumentLine.findById(candidate._id);
      const ctx = await cr.getSourceContext(row);
      if (Number(ctx.deliveredQty.toString()) > 0) { source = row; context = ctx; break; }
    }
    const crInput = { warehouseId: sid(warehouse), customerId: sid(context.salesOrder.header.customerId), idempotencyKey: key(), lines: [{ salesIssueLineId: sid(source), qtyBase: '1', reason: 'Unused spare tile' }] };
    const createdReturn = await cr.createCustomerReturn(users.sales, crInput);
    const custody = await m.Location.findOne({ warehouseId: warehouse._id, kind: 'CUSTODY' });
    const receiving = await m.Location.findOne({ warehouseId: warehouse._id, kind: 'RECEIVING' });
    const crEvidence = await m.Evidence.create({ documentId: createdReturn._id, objectKey: 'isolated-test/cr-evidence', sha256: 'b'.repeat(64), mediaType: 'image/png', uploadedBy: users.warehouse._id });
    await cr.inspectCustomerReturn(users.warehouse, createdReturn._id, { expectedVersion: createdReturn.version, idempotencyKey: key(), custodyLocationId: sid(custody), evidenceIds: [sid(crEvidence)], lines: [{ returnLineId: createdReturn.lines[0]._id, qtyReceived: '1', packagingCondition: 'SEALED', installationStatus: 'UNUSED', damageCause: 'NONE', deadlineStatus: 'WITHIN', deadlineReference: 'Verified source agreement', assessmentReason: 'Unused intact piece' }] });
    let returnDetail = await cr.getCustomerReturnById(createdReturn._id, users.sales);
    const beforeReassessment = await m.StockMovement.countDocuments();
    await returns.reassessCustomerReturn(users.warehouse, createdReturn._id, { expectedVersion: returnDetail.version, idempotencyKey: key(), note: 'Additional verified terms, same actual custody quantity', evidenceIds: [sid(crEvidence)], lines: [{ returnLineId: createdReturn.lines[0]._id, qtyReceived: '1', packagingCondition: 'SEALED', installationStatus: 'UNUSED', damageCause: 'NONE', deadlineStatus: 'WITHIN', deadlineReference: 'Verified original terms', assessmentReason: 'Confirmed unused condition' }] });
    assert.equal(await m.StockMovement.countDocuments(), beforeReassessment, 'Reassessment appends facts without receiving custody twice');
    returnDetail = await cr.getCustomerReturnById(createdReturn._id, users.sales);
    await cr.decideOrdinaryCustomerReturn(users.sales, createdReturn._id, { expectedVersion: returnDetail.version, decision: 'APPROVE', reason: 'Ordinary return accepted after physical inspection' });
    returnDetail = await cr.getCustomerReturnById(createdReturn._id, users.warehouse);
    const receiveInput = { expectedVersion: returnDetail.version, idempotencyKey: key(), note: 'Take ownership of the physically received item', evidenceIds: [sid(crEvidence)], lines: [{ lineId: createdReturn.lines[0]._id, qtyBase: '1', locationId: sid(receiving), qualityCode: 'GOOD' }] };
    const stocktake = await m.BusinessDocument.findOne({ documentKind: 'STOCKTAKE' });
    const lock = await m.LocationLock.create({ locationId: receiving._id, stocktakeId: stocktake._id });
    const countBeforeFreeze = await m.PostingBatch.countDocuments();
    await rejects(() => returns.receiveCustomerReturn(users.warehouse, createdReturn._id, receiveInput), 409);
    assert.equal(await m.PostingBatch.countDocuments(), countBeforeFreeze, 'Freeze rejection rolls back receipt and stock together');
    await m.LocationLock.deleteOne({ _id: lock._id });
    assert.equal((await returns.receiveCustomerReturn(users.warehouse, createdReturn._id, receiveInput)).status, 'RECEIVED');
    assert.equal((await returns.receiveCustomerReturn(users.warehouse, createdReturn._id, receiveInput)).repeated, true);
    const rejectedReturn = await cr.createCustomerReturn(users.sales, { ...crInput, idempotencyKey: key() });
    const rejectEvidence = await m.Evidence.create({ documentId: rejectedReturn._id, objectKey: 'isolated-test/rejected', sha256: '2'.repeat(64), mediaType: 'image/png', uploadedBy: users.warehouse._id });
    await cr.inspectCustomerReturn(users.warehouse, rejectedReturn._id, { expectedVersion: rejectedReturn.version, idempotencyKey: key(), custodyLocationId: sid(custody), evidenceIds: [sid(rejectEvidence)], lines: [{ returnLineId: rejectedReturn.lines[0]._id, qtyReceived: '1', packagingCondition: 'OPENED', installationStatus: 'INSTALLED', damageCause: 'NONE', deadlineStatus: 'WITHIN', deadlineReference: 'Verified source terms', assessmentReason: 'Installed goods are excluded' }] });
    const rejectedDetail = await cr.getCustomerReturnById(rejectedReturn._id, users.sales);
    await rejects(() => cr.approveCustomerReturnException(users.owner, rejectedReturn._id, { expectedVersion: rejectedDetail.version, reason: 'Cannot override installed goods' }), 409);
    await cr.decideOrdinaryCustomerReturn(users.sales, rejectedReturn._id, { expectedVersion: rejectedDetail.version, decision: 'REJECT', reason: 'Installed goods excluded from returns' });
    const handback = { expectedVersion: (await cr.getCustomerReturnById(rejectedReturn._id, users.warehouse)).version, idempotencyKey: key(), note: 'Handed customer-owned goods back to the customer', evidenceIds: [sid(rejectEvidence)], lines: [{ lineId: rejectedReturn.lines[0]._id, qtyBase: '1' }] };
    await returns.handBackCustomerReturn(users.warehouse, rejectedReturn._id, handback);
    assert.equal((await m.ReturnSourceClaim.findOne({ requestLineId: rejectedReturn.lines[0]._id })).status, 'RELEASED');

    let fdSource;
    for (const candidate of sources.sourceLines) {
      const row = await m.DocumentLine.findById(candidate._id), ctx = await cr.getSourceContext(row);
      if (ctx.deliveredQty.isZero()) { fdSource = row; break; }
    }
    const fd = await returns.createFailedDelivery(users.warehouse, { warehouseId: sid(warehouse), idempotencyKey: key(), note: 'Customer did not receive these pieces', lines: [{ salesIssueLineId: sid(fdSource), qtyBase: '2' }] }, { objectKey: 'isolated-test/fd-evidence', sha256: 'c'.repeat(64), mediaType: 'image/png' });
    let fdDetail = await reads.failedDetail(users.warehouse, fd.documentId);
    const fdEvidence = fdDetail.evidence[0]._id;
    await returns.inspectFailedDelivery(users.warehouse, fd.documentId, { expectedVersion: fdDetail.version, idempotencyKey: key(), note: 'First actual piece arrived', evidenceIds: [fdEvidence], lines: [{ lineId: fdDetail.lines[0]._id, qtyBase: '1', qualityCode: 'GOOD', packagingCondition: 'TORN' }] });
    fdDetail = await reads.failedDetail(users.warehouse, fd.documentId);
    let fdInput = { expectedVersion: fdDetail.version, idempotencyKey: key(), note: 'Receive failed delivery into the original demand chain', evidenceIds: [fdEvidence], lines: [{ lineId: fdDetail.lines[0]._id, qtyBase: '1', locationId: sid(receiving), qualityCode: 'GOOD' }] };
    assert.equal((await returns.receiveFailedDelivery(users.warehouse, fd.documentId, fdInput)).status, 'PARTIAL');
    fdDetail = await reads.failedDetail(users.warehouse, fd.documentId);
    await returns.inspectFailedDelivery(users.warehouse, fd.documentId, { expectedVersion: fdDetail.version, idempotencyKey: key(), note: 'Second actual piece arrived later', evidenceIds: [fdEvidence], lines: [{ lineId: fdDetail.lines[0]._id, qtyBase: '1', qualityCode: 'GOOD', packagingCondition: 'OPENED' }] });
    fdDetail = await reads.failedDetail(users.warehouse, fd.documentId);
    fdInput = { ...fdInput, expectedVersion: fdDetail.version, idempotencyKey: key() };
    const fdResult = await returns.receiveFailedDelivery(users.warehouse, fd.documentId, fdInput);
    assert.equal(fdResult.status, 'RECEIVED');
    assert.equal((await returns.receiveFailedDelivery(users.warehouse, fd.documentId, fdInput)).repeated, true);
    assert.equal(await m.DemandReopening.countDocuments({ postingBatchId: (await m.PostingBatch.findOne({ documentId: fdResult.receiptId }))._id }), 1);
    const trace = await reads.traceLot(users.owner, sid(balance.lotId));
    assert.ok(trace.documents.some((x) => x._id === created.documentId));
    assert.ok(trace.lines.length);
    server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    const root = `http://127.0.0.1:${server.address().port}/api`;
    const http = async (path, user, body) => {
      const response = await fetch(`${root}${path}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(user && { Authorization: `Bearer ${jwt.sign({ userId: sid(user) }, process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026')}` }) }, ...(body && { body: JSON.stringify(body) }) });
      return { status: response.status, body: await response.json() };
    };
    assert.equal((await http('/auth/login', null, { username: 'warehouse@ceratile.vn', password: 'Kho@12345678' })).status, 200, 'New routes do not intercept public login');
    assert.equal((await http('/supplier-returns', users.sales)).status, 403);
    assert.equal((await http(`/supplier-returns/${created.documentId}/agreement`, users.owner, {})).status, 403);
    const otherWarehouse = await m.User.findOne({ username: 'warehouse2@ceratile.vn' }).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
    assert.equal((await http(`/supplier-returns/${created.documentId}`, otherWarehouse)).status, 404);
    assert.equal((await http('/return-workflows/options', users.accountant)).status, 200);
    const externalInput = { documentId: created.documentId, expectedVersion: (await sr.supplierReturnDetail(users.accountant, created.documentId)).version, idempotencyKey: key(), sourceSystem: 'TEST_PAPER', referenceKind: 'CREDIT_NOTE', referenceNo: key(), referenceDate: new Date().toISOString(), correlationId: key(), evidenceId: sid(evidence), status: 'VERIFIED', note: 'External finance remains independent', lines: [{ lineId: detail.lines[0]._id, qtyBase: '2' }] };
    assert.equal((await http('/external-references', users.accountant, externalInput)).status, 200);
    assert.equal((await sr.supplierReturnDetail(users.accountant, created.documentId)).workflowStatus, 'COMPLETED');
    const historicalOrder = await m.BusinessDocument.findOne({ documentKind: 'SALES_ORDER', workflowStatus: 'OPEN', createdBy: users.sales._id });
    const historicalSource = await m.DocumentLine.findOne({ documentId: historicalOrder._id });
    const historicalEvidence = await m.Evidence.create({ documentId: historicalOrder._id, objectKey: 'isolated-test/history', sha256: '1'.repeat(64), mediaType: 'image/png', uploadedBy: users.accountant._id });
    const historicalInput = { ...externalInput, documentId: sid(historicalOrder), expectedVersion: historicalOrder.version, idempotencyKey: key(), referenceKind: 'HISTORICAL_DELIVERY', referenceNo: key(), correlationId: key(), evidenceId: sid(historicalEvidence), customerId: sid(historicalOrder.header.customerId), warehouseId: sid(warehouse), lines: [{ lineId: sid(historicalSource), qtyBase: '2', lotId: sid(balance.lotId), conversionId: sid(historicalSource.conversionId), returnedQty: '0' }] };
    const historicalResult = await reads.recordExternalReference(users.accountant, historicalInput);
    const historicalLine = await m.ExternalReferenceLine.findOne({ referenceId: historicalResult.referenceId });
    const historicReturn = await cr.createCustomerReturn(users.sales, { customerId: sid(historicalOrder.header.customerId), warehouseId: sid(warehouse), idempotencyKey: key(), lines: [{ historicalExternalLineId: sid(historicalLine), qtyBase: '1', reason: 'Verified historical unused delivery' }] });
    assert.equal(historicReturn.lines[0].details.historicalExternalLineId, sid(historicalLine));
    await rejects(() => cr.createCustomerReturn(users.sales, { customerId: sid(historicalOrder.header.customerId), warehouseId: sid(warehouse), idempotencyKey: key(), lines: [{ historicalExternalLineId: sid(historicalLine), qtyBase: '2', reason: 'Would exceed remaining verified history' }] }), 409);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    try { if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) await mongoose.connection.dropDatabase(); }
    finally { await mongoose.disconnect(); }
  }
});
