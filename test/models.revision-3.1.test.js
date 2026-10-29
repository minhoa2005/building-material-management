import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/index.js';

const id = () => new mongoose.Types.ObjectId();
const when = new Date('2026-10-25T00:00:00Z');
const line = (lineKind, details, qtyBase = '2') => new m.DocumentLine({
  documentId: id(), lineNo: 1, productId: id(), conversionId: id(),
  enteredQty: qtyBase, conversionSnapshot: '1', qtyBase, productNameSnapshot: 'Tile',
  lineKind, details,
});
const document = (documentKind, header, workflowStatus = 'DRAFT') => new m.BusinessDocument({
  documentNo: `${documentKind}-1`, documentKind, createdBy: id(), ...(header && { header }), workflowStatus,
});
const invalid = async (doc, path) => assert.rejects(doc.validate(), (err) => {
  assert.equal(err.name, 'ValidationError');
  if (path) assert.ok(err.errors[path], `${path}: ${Object.keys(err.errors)}`);
  return true;
});
const hasIndex = (Model, fields, predicate = () => true) => Model.schema.indexes().some(
  ([keys, options]) => JSON.stringify(keys) === JSON.stringify(fields) && predicate(options),
);

test('SO and confirmations restrict workflow states without restricting other document kinds', async () => {
  const so = { externalReferenceId: id(), customerId: id(), neededOn: when, deliveryAddressSnapshot: 'Address' };
  for (const status of ['DRAFT', 'OPEN', 'IN_PROGRESS', 'PARTIALLY_DELIVERED', 'DELIVERED', 'COMPLETED', 'CANCELLED']) {
    await document('SALES_ORDER', so, status).validate();
  }
  await invalid(document('SALES_ORDER', so, 'POSTED'), 'workflowStatus');
  const pod = { salesOrderId: id(), warehouseId: id(), recipientName: 'Customer', deliveredAt: when, confirmedBy: id(), operationId: id() };
  for (const status of ['DRAFT', 'CONFIRMED', 'VOIDED']) await document('DELIVERY_CONFIRMATION', pod, status).validate();
  await invalid(document('DELIVERY_CONFIRMATION', pod, 'COMPLETED'), 'workflowStatus');
  await invalid(document('DELIVERY_CONFIRMATION', { ...pod, recipientName: '  ' }), 'header.recipientName');
  await document('OPENING', undefined, 'POSTED').validate();
});

test('PAY-CFM requires full external receipt and at least one nonblank supporting fact', async () => {
  const header = { salesOrderId: id(), deliveredOrderVersion: 1, fullPaymentReceived: true, confirmedBy: id(), operationId: id() };
  for (const support of [{ externalReceiptReference: 'RC-1' }, { receiptEvidenceId: id() }, { confirmationNote: 'Receipt verified' }]) {
    await document('PAYMENT_CONFIRMATION', { ...header, ...support }).validate();
  }
  await invalid(document('PAYMENT_CONFIRMATION', header), 'header.externalReceiptReference');
  await invalid(document('PAYMENT_CONFIRMATION', { ...header, confirmationNote: '  ' }), 'header.externalReceiptReference');
  await invalid(document('PAYMENT_CONFIRMATION', { ...header, fullPaymentReceived: false, confirmationNote: 'Partial' }), 'header.fullPaymentReceived');
  await invalid(document('PAYMENT_CONFIRMATION', { ...header, fullPaymentReceived: undefined, confirmationNote: 'Unknown' }), 'header.fullPaymentReceived');
  await invalid(document('PAYMENT_CONFIRMATION', { ...header, deliveredOrderVersion: 0, confirmationNote: 'Checked' }), 'header.deliveredOrderVersion');
  await invalid(document('PAYMENT_CONFIRMATION', { ...header, confirmationNote: 'Checked' }, 'DELIVERED'), 'workflowStatus');
});

test('WIR requires SO sources and rejects the retired external-line contract', async () => {
  const header = { salesOrderId: id(), requestedWarehouseId: id(), neededOn: when, deliveryAddressSnapshot: 'Address' };
  await document('ISSUE_REQUEST', header).validate();
  await invalid(document('ISSUE_REQUEST', { ...header, salesOrderId: undefined }), 'header.salesOrderId');
  await invalid(document('ISSUE_REQUEST', { ...header, customerId: id() }), 'header');
  await line('ISSUE_REQUEST', { salesOrderLineId: id(), releaseKey: 'release-1' }).validate();
  await invalid(line('ISSUE_REQUEST', { externalLineId: id(), releaseKey: 'old' }), 'details');
  await invalid(line('ISSUE_REQUEST', { releaseKey: 'missing-source' }), 'details.salesOrderLineId');
});

test('packaging is an independent observation and supplier agreement needs verification evidence', async () => {
  const inspection = { inspectedSourceLineId: id(), qualityCode: 'GOOD', ownershipDecision: 'ACCEPT', inspectedBy: id(), inspectedAt: when };
  assert.equal(line('INSPECTION', inspection).details.packagingCondition, 'UNKNOWN');
  for (const packagingCondition of ['SEALED', 'OPENED', 'TORN', 'UNKNOWN']) {
    const doc = line('INSPECTION', { ...inspection, packagingCondition });
    await doc.validate();
    assert.equal(doc.details.qualityCode, 'GOOD');
  }
  await invalid(line('INSPECTION', { ...inspection, packagingCondition: 'DAMAGED' }), 'details.packagingCondition');
  const agreement = { originLineId: id(), ownerPartyId: id(), agreedQty: '2', agreementVersion: 1,
    agreementVerifiedBy: id(), agreementVerifiedAt: when, agreementEvidenceId: id() };
  await line('SUPPLIER_RETURN', agreement).validate();
  for (const field of ['agreementVersion', 'agreementVerifiedBy', 'agreementVerifiedAt', 'agreementEvidenceId']) {
    await invalid(line('SUPPLIER_RETURN', { ...agreement, [field]: undefined }), `details.${field}`);
  }
  await invalid(line('SUPPLIER_RETURN', { ...agreement, authorizationId: id() }), 'details');
});

test('external sources require a stable correlation ID and preserve optional provider revisions', async () => {
  const source = { sourceSystem: 'MISA', referenceKind: 'ORDER', referenceNo: 'SO-1' };
  await invalid(new m.ExternalReference(source), 'correlationId');
  await invalid(new m.ExternalReference({ ...source, correlationId: '  ' }), 'correlationId');
  const doc = new m.ExternalReference({ ...source, correlationId: 'trace-1', referenceDate: when, sourceVersion: 'v2' });
  await doc.validate();
  assert.equal(doc.sourceVersion, 'v2');
  await new m.ExternalReference({ ...source, correlationId: 'trace-2' }).validate();
});

const assessment = (extra = {}) => new m.CustomerReturnAssessment({
  returnLineId: id(), assessmentNo: 1, documentVersion: 1,
  packagingCondition: 'SEALED', installationStatus: 'UNUSED', damageCause: 'NONE',
  deadlineStatus: 'WITHIN', deadlineReference: 'Verified supplier return terms',
  eligibilityStatus: 'CASE_REVIEW', assessmentReason: 'Warehouse inspection recorded', assessedBy: id(),
  ...extra,
});

test('D6 eligibility follows exclusions, complete conditions and unknowns for every combination', async () => {
  for (const packagingCondition of ['SEALED', 'OPENED', 'TORN', 'UNKNOWN']) {
    for (const installationStatus of ['UNUSED', 'INSTALLED', 'UNKNOWN']) {
      for (const damageCause of ['NONE', 'CUSTOMER', 'SUPPLIER', 'OTHER', 'UNKNOWN']) {
        for (const deadlineStatus of ['WITHIN', 'EXCEEDED', 'NOT_APPLICABLE', 'UNKNOWN']) {
          const conditions = { packagingCondition, installationStatus, damageCause, deadlineStatus };
          const excluded = installationStatus === 'INSTALLED' || damageCause === 'CUSTOMER' || deadlineStatus === 'EXCEEDED';
          const unknown = Object.values(conditions).includes('UNKNOWN');
          const expected = excluded ? 'INELIGIBLE' : unknown ? 'PENDING' : 'CASE_REVIEW';
          for (const eligibilityStatus of ['INELIGIBLE', 'PENDING', 'CASE_REVIEW']) {
            const doc = assessment({ ...conditions, eligibilityStatus });
            if (eligibilityStatus === expected) await doc.validate();
            else await invalid(doc, 'eligibilityStatus');
          }
        }
      }
    }
  }
});

test('D6 known deadlines require terms and assessments require version, reason and actor', async () => {
  await invalid(assessment({ deadlineReference: ' ' }), 'deadlineReference');
  await assessment({ deadlineStatus: 'UNKNOWN', deadlineReference: undefined, eligibilityStatus: 'PENDING' }).validate();
  await invalid(assessment({ assessmentReason: ' ' }), 'assessmentReason');
  await invalid(assessment({ documentVersion: 0 }), 'documentVersion');
  await invalid(assessment({ assessmentNo: 0 }), 'assessmentNo');
  await invalid(assessment({ assessedBy: undefined }), 'assessedBy');
  await invalid(assessment({ packagingCondition: undefined }), 'packagingCondition');
});

test('CR/FD source claims are exclusive; FD cannot use historical customer receipts', async () => {
  const base = { requestLineId: id(), claimKind: 'CR', qtyBase: '2', status: 'OPEN', operationId: id() };
  await new m.ReturnSourceClaim({ ...base, salesIssueLineId: id() }).validate();
  await new m.ReturnSourceClaim({ ...base, historicalExternalLineId: id() }).validate();
  await new m.ReturnSourceClaim({ ...base, claimKind: 'FD', salesIssueLineId: id() }).validate();
  await invalid(new m.ReturnSourceClaim(base), 'salesIssueLineId');
  await invalid(new m.ReturnSourceClaim({ ...base, salesIssueLineId: id(), historicalExternalLineId: id() }), 'salesIssueLineId');
  await invalid(new m.ReturnSourceClaim({ ...base, claimKind: 'FD', historicalExternalLineId: id() }), 'salesIssueLineId');
  await invalid(new m.ReturnSourceClaim({ ...base, salesIssueLineId: id(), qtyBase: '0' }), 'qtyBase');
  await invalid(new m.ReturnSourceClaim({ ...base, salesIssueLineId: id(), status: 'ACTIVE' }), 'status');
  await invalid(line('FAILED_DELIVERY_RECEIPT', { failedDeliveryLineId: id(), salesIssueLineId: id() }), 'details.inspectionLineId');
  await invalid(line('DELIVERY_CONFIRMATION', { salesIssueLineId: id() }), 'details.photoEvidenceId');
});

test('stocktake DELTA keeps the real signed difference separate from quality/location transfers', async () => {
  const countId = id();
  for (const [deltaQty, fromBalanceId, toBalanceId] of [
    ['2', undefined, id()], ['-2', id(), undefined],
  ]) {
    await line('ST_RESOLUTION', { countId, actionKind: 'DELTA', deltaQty, fromBalanceId, toBalanceId }).validate();
    await invalid(line('ST_RESOLUTION', { countId, actionKind: 'DELTA', deltaQty, fromBalanceId, toBalanceId }, '3'), 'qtyBase');
    await invalid(line('ST_RESOLUTION', { countId, actionKind: 'DELTA', deltaQty, fromBalanceId: toBalanceId, toBalanceId: fromBalanceId }), 'details.fromBalanceId');
  }
  await invalid(line('ST_RESOLUTION', { countId, actionKind: 'DELTA', deltaQty: '0', toBalanceId: id() }), 'details.deltaQty');
  await invalid(line('ST_RESOLUTION', { countId, actionKind: 'DELTA', toBalanceId: id() }), 'details.deltaQty');
  await invalid(line('ST_RESOLUTION', { countId, actionKind: 'DELTA', deltaQty: '2', fromBalanceId: id(), toBalanceId: id() }), 'details.fromBalanceId');
  for (const actionKind of ['RECLASS', 'RELOCATE']) {
    const endpoints = { countId, actionKind, fromBalanceId: id(), toBalanceId: id() };
    await line('ST_RESOLUTION', endpoints).validate();
    await invalid(line('ST_RESOLUTION', { ...endpoints, deltaQty: '2' }), 'details.toBalanceId');
    await invalid(line('ST_RESOLUTION', { ...endpoints, toBalanceId: endpoints.fromBalanceId }), 'details.toBalanceId');
    await invalid(line('ST_RESOLUTION', { ...endpoints, fromBalanceId: undefined }), 'details.toBalanceId');
  }
});

test('stocktake execution facts must be absent together or include actor, timestamp and evidence', async () => {
  const details = { countId: id(), actionKind: 'RECLASS', fromBalanceId: id(), toBalanceId: id() };
  const fields = ['executedBy', 'executedAt', 'executionEvidenceId'];
  const values = [id(), when, id()];
  for (let mask = 0; mask < 8; mask++) {
    const execution = Object.fromEntries(fields.map((key, i) => [key, mask & (1 << i) ? values[i] : undefined]));
    const doc = line('ST_RESOLUTION', { ...details, ...execution });
    if (mask === 0 || mask === 7) await doc.validate();
    else await invalid(doc, 'details.executionEvidenceId');
  }
});

test('non-stock operations, reopening and holds validate identities, quantities and versions', async () => {
  const operation = { documentId: id(), operation: 'CONFIRM_POD', operationKey: 'delivery-1', idempotencyKey: 'retry-1', payloadHash: 'a'.repeat(64), documentVersion: 1, performedBy: id() };
  await new m.BusinessOperation(operation).validate();
  await invalid(new m.BusinessOperation({ ...operation, payloadHash: 'bad' }), 'payloadHash');
  await invalid(new m.BusinessOperation({ ...operation, operationKey: ' ' }), 'operationKey');
  await invalid(new m.BusinessOperation({ ...operation, idempotencyKey: ' ' }), 'idempotencyKey');
  await invalid(new m.BusinessOperation({ ...operation, documentVersion: 0 }), 'documentVersion');
  const cancellation = { salesOrderId: id(), salesOrderLineId: id(), cancelledQtyBase: '2', cancelledBy: id(), reason: 'Customer cancelled', operationId: id() };
  await new m.SalesOrderCancellation(cancellation).validate();
  await invalid(new m.SalesOrderCancellation({ ...cancellation, cancelledQtyBase: '0' }), 'cancelledQtyBase');
  await invalid(new m.SalesOrderCancellation({ ...cancellation, reason: ' ' }), 'reason');
  const reopening = { receiptLineId: id(), salesOrderLineId: id(), issueRequestLineId: id(), outboundDeliveryLineId: id(), reopenedQty: '2', sourceVersion: 1, postingBatchId: id() };
  await new m.DemandReopening(reopening).validate();
  await invalid(new m.DemandReopening({ ...reopening, reopenedQty: '0' }), 'reopenedQty');
  await invalid(new m.DemandReopening({ ...reopening, postingBatchId: undefined }), 'postingBatchId');
  const transfer = { reopeningReceiptLineId: id(), fromOdLineId: id(), toOdLineId: id(), qtyBase: '2', sourceVersion: 1, targetVersion: 1, operationId: id() };
  await new m.OdCommitmentTransfer(transfer).validate();
  await invalid(new m.OdCommitmentTransfer({ ...transfer, toOdLineId: transfer.fromOdLineId }), 'toOdLineId');
  await invalid(new m.OdCommitmentTransfer({ ...transfer, targetVersion: 0 }), 'targetVersion');
  const hold = { defectDocumentId: id(), balanceId: id(), qtyBase: '2', evidenceId: id(), recordedBy: id(), status: 'ACTIVE' };
  await new m.DefectHold(hold).validate();
  await invalid(new m.DefectHold({ ...hold, qtyBase: '-2' }), 'qtyBase');
  await invalid(new m.DefectHold({ ...hold, evidenceId: undefined }), 'evidenceId');
});

test('3.1 indexes cover source deduplication, confirmations, claims, reopening and active holds', () => {
  const unique = (o) => o.unique === true;
  const kindUnique = (kind) => (o) => o.unique && o.partialFilterExpression?.documentKind === kind;
  assert.ok(hasIndex(m.ExternalReference, { correlationId: 1 }, unique));
  assert.ok(hasIndex(m.BusinessDocument, { 'header.externalReferenceId': 1 }, kindUnique('SALES_ORDER')));
  assert.ok(hasIndex(m.DocumentLine, { 'details.externalLineId': 1 }, (o) => o.unique && o.partialFilterExpression?.lineKind === 'SALES_ORDER'));
  assert.ok(hasIndex(m.DocumentLine, { documentId: 1, 'details.salesIssueLineId': 1 }, (o) => o.unique && o.partialFilterExpression?.lineKind === 'DELIVERY_CONFIRMATION'));
  assert.ok(hasIndex(m.BusinessDocument, { documentKind: 1, 'header.operationId': 1 }, (o) => o.unique && o.partialFilterExpression?.['header.operationId'].$type === 'objectId'));
  assert.ok(hasIndex(m.BusinessDocument, { 'header.salesOrderId': 1, 'header.deliveredOrderVersion': 1 }, kindUnique('PAYMENT_CONFIRMATION')));
  assert.ok(hasIndex(m.BusinessOperation, { idempotencyKey: 1 }, unique));
  assert.ok(hasIndex(m.BusinessOperation, { documentId: 1, operation: 1, operationKey: 1 }, unique));
  assert.ok(hasIndex(m.SalesOrderCancellation, { operationId: 1 }, unique));
  assert.ok(hasIndex(m.CustomerReturnAssessment, { returnLineId: 1, assessmentNo: 1 }, unique));
  assert.ok(hasIndex(m.ReturnSourceClaim, { requestLineId: 1, operationId: 1 }, unique));
  assert.ok(hasIndex(m.DemandReopening, { receiptLineId: 1 }, unique));
  assert.ok(hasIndex(m.OdCommitmentTransfer, { operationId: 1, fromOdLineId: 1, toOdLineId: 1 }, unique));
  assert.ok(hasIndex(m.DefectHold, { balanceId: 1 }, (o) => o.partialFilterExpression?.status === 'ACTIVE'));
  assert.ok(hasIndex(m.DefectHold, { balanceId: 1 }, (o) => o.unique && o.partialFilterExpression?.status === 'ACTIVE'));
  assert.ok(hasIndex(m.ReturnSourceGuard, { salesIssueLineId: 1 }, unique));
});
