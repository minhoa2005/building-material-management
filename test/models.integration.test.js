import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as models from '../src/models/index.js';

const id = () => new mongoose.Types.ObjectId();
const duplicate = (action) => assert.rejects(action, (error) => error.code === 11000);

// Opt-in. Always override the database name; never use or drop the URI's DB.
test('MongoDB indexes, discriminator persistence and append-only history', {
  skip: !process.env.MONGODB_TEST_URI,
}, async (t) => {
  const dbName = `sep490_model_verification_${id().toHexString()}`;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, {
      dbName, autoIndex: false, serverSelectionTimeoutMS: 5000,
    });
    const exportedModels = Object.values(models).filter((value) => value?.modelName);
    for (const Model of exportedModels) await Model.createIndexes();
    assert.equal(new Set(exportedModels.map((Model) => Model.collection.name)).size, 37);

    await t.test('natural keys and singleton STORE are enforced by MongoDB', async () => {
      const user = { username: 'owner', fullName: 'Owner', passwordHash: 'hash' };
      await models.User.create(user);
      await duplicate(() => models.User.create(user));
      await models.Party.create({ code: 'STORE', name: 'Store', kind: 'STORE' });
      await duplicate(() => models.Party.create({ code: 'STORE-2', name: 'Other store', kind: 'STORE' }));
      const locationId = id();
      await models.LocationLock.create({ locationId, stocktakeId: id() });
      await duplicate(() => models.LocationLock.create({ locationId, stocktakeId: id() }));
      const fetched = await models.User.findOne({ username: 'owner' });
      assert.equal(fetched.passwordHash, undefined);
      assert.equal((await models.User.findById(fetched._id).select('+passwordHash')).passwordHash, 'hash');
    });

    await t.test('partial unique references permit missing/null values without duplicate logical accounts', async () => {
      const locationId = id();
      await models.StockAccount.create({ locationId, transitDispatchLineId: null });
      await models.StockAccount.create({ locationId: id(), transitDispatchLineId: null });
      await models.StockAccount.create({ transitDispatchLineId: id(), locationId: null });
      await models.StockAccount.create({ transitDispatchLineId: id(), locationId: null });
      await duplicate(() => models.StockAccount.create({ locationId }));
      const balance = { accountId: id(), lotId: id(), qualityCode: 'GOOD', ownerPartyId: id(), qtyBase: '0.3' };
      await models.StockBalance.create(balance);
      await duplicate(() => models.StockBalance.create(balance));
      assert.equal((await models.StockBalance.findOne({ accountId: balance.accountId })).qtyBase.toString(), '0.3');
    });

    await t.test('idempotency, operation keys and full-reversal uniqueness are enforced independently', async () => {
      const batch = {
        documentId: id(), operation: 'POST', operationKey: 'release-1', idempotencyKey: 'request-1',
        payloadHash: 'a'.repeat(64), postedBy: id(),
      };
      const first = await models.PostingBatch.create(batch);
      await models.PostingBatch.create({ ...batch, operationKey: 'release-2', idempotencyKey: 'request-2' });
      await duplicate(() => models.PostingBatch.create({ ...batch, idempotencyKey: 'request-3' }));
      await duplicate(() => models.PostingBatch.create({ ...batch, operationKey: 'release-3' }));
      await models.PostingBatch.create({ ...batch, operationKey: 'reverse-1', idempotencyKey: 'reverse-1', reversalOf: first._id });
      await duplicate(() => models.PostingBatch.create({ ...batch, operationKey: 'reverse-2', idempotencyKey: 'reverse-2', reversalOf: first._id }));
    });

    await t.test('typed documents/lines round-trip and share unique identities across discriminators', async () => {
      const warehouseId = id();
      const supplierId = id();
      const po = await models.BusinessDocument.create({
        documentNo: 'PO-1', documentKind: 'PO', createdBy: id(), header: { warehouseId, supplierId },
      });
      const fetched = await models.BusinessDocument.findById(po._id);
      assert.equal(fetched.constructor.modelName, 'BusinessDocument_PO');
      assert.equal(fetched.header.supplierId.toHexString(), supplierId.toHexString());
      await duplicate(() => models.BusinessDocument.create({ documentNo: 'PO-1', documentKind: 'OPENING', createdBy: id() }));
      const base = {
        documentId: po._id, lineNo: 1, productId: id(), conversionId: id(),
        enteredQty: '0.1', conversionSnapshot: '3', qtyBase: '0.3', productNameSnapshot: 'Tile',
      };
      await models.DocumentLine.create(base);
      // No external entitlement key: unrelated standard lines must not collide.
      await models.DocumentLine.create({ ...base, lineNo: 2 });
      await duplicate(() => models.DocumentLine.create(base));
      const details = { salesOrderLineId: id(), releaseKey: 'release' };
      await models.DocumentLine.create({ ...base, lineNo: 3, lineKind: 'ISSUE_REQUEST', details });
      await duplicate(() => models.DocumentLine.create({ ...base, lineNo: 4, lineKind: 'ISSUE_REQUEST', details }));
    });

    await t.test('SO source, WIR commitments, POD and payment indexes are scoped to their subtypes', async () => {
      const actor = id();
      const warehouseId = id();
      const when = new Date();
      const source = { sourceSystem: 'MISA', referenceKind: 'ORDER', referenceNo: 'SOURCE-1', correlationId: 'trace-1' };
      const external = await models.ExternalReference.create(source);
      await duplicate(() => models.ExternalReference.create({ ...source, referenceNo: 'SOURCE-2' }));
      await duplicate(() => models.ExternalReference.create({ ...source, correlationId: 'trace-2' }));
      const externalLine = await models.ExternalReferenceLine.create({ referenceId: external._id, lineKey: '1', productId: id(), eligibleQty: '2' });
      const soHeader = { externalReferenceId: external._id, customerId: id(), neededOn: when, deliveryAddressSnapshot: 'Address' };
      const so = await models.BusinessDocument.create({ documentNo: 'SO-NEW-1', documentKind: 'SALES_ORDER', createdBy: actor, header: soHeader });
      await duplicate(() => models.BusinessDocument.create({ documentNo: 'SO-NEW-2', documentKind: 'SALES_ORDER', createdBy: actor, header: soHeader }));
      const base = { documentId: so._id, lineNo: 1, productId: externalLine.productId, conversionId: id(), enteredQty: '2', conversionSnapshot: '1', qtyBase: '2', productNameSnapshot: 'Tile' };
      const soLine = await models.DocumentLine.create({ ...base, lineKind: 'SALES_ORDER', details: { externalReferenceId: external._id, externalLineId: externalLine._id } });
      await duplicate(() => models.DocumentLine.create({ ...base, documentId: id(), lineKind: 'SALES_ORDER', details: soLine.details.toObject() }));
      const wir = await models.BusinessDocument.create({ documentNo: 'WIR-NEW-1', documentKind: 'ISSUE_REQUEST', createdBy: actor,
        header: { salesOrderId: so._id, requestedWarehouseId: warehouseId, neededOn: when, deliveryAddressSnapshot: 'Address' } });
      const wirLine = await models.DocumentLine.create({ ...base, documentId: wir._id, lineKind: 'ISSUE_REQUEST', details: { salesOrderLineId: soLine._id, releaseKey: 'release-1' } });
      await duplicate(() => models.DocumentLine.create({ ...base, documentId: id(), lineKind: 'ISSUE_REQUEST', details: wirLine.details.toObject() }));
      // Another release against the same SO line is a distinct commitment.
      await models.DocumentLine.create({ ...base, documentId: wir._id, lineNo: 2, lineKind: 'ISSUE_REQUEST', details: { salesOrderLineId: soLine._id, releaseKey: 'release-2' } });
      const od = await models.BusinessDocument.create({ documentNo: 'OD-NEW-1', documentKind: 'OUTBOUND_DELIVERY', createdBy: actor, header: { warehouseId, issueRequestId: wir._id, plannedOn: when } });
      const odLine = await models.DocumentLine.create({ ...base, documentId: od._id, lineKind: 'OUTBOUND_DELIVERY', details: { issueRequestLineId: wirLine._id } });
      const gi = await models.BusinessDocument.create({ documentNo: 'GI-NEW-1', documentKind: 'GI_SALE', createdBy: actor, header: { warehouseId } });
      const giLine = await models.DocumentLine.create({ ...base, documentId: gi._id, lineKind: 'SALES_GOODS_ISSUE', details: { outboundDeliveryLineId: odLine._id } });
      const podHeader = { salesOrderId: so._id, warehouseId, recipientName: 'Customer', deliveredAt: when, confirmedBy: actor, operationId: id() };
      const pod = await models.BusinessDocument.create({ documentNo: 'POD-NEW-1', documentKind: 'DELIVERY_CONFIRMATION', createdBy: actor, header: podHeader });
      await duplicate(() => models.BusinessDocument.create({ documentNo: 'POD-NEW-2', documentKind: 'DELIVERY_CONFIRMATION', createdBy: actor, header: podHeader }));
      const evidence = await models.Evidence.create({ documentId: pod._id, objectKey: 'private/pod.png', sha256: 'b'.repeat(64), mediaType: 'image/png', uploadedBy: actor });
      const podLine = await models.DocumentLine.create({ ...base, documentId: pod._id, lineKind: 'DELIVERY_CONFIRMATION', details: { salesIssueLineId: giLine._id, photoEvidenceId: evidence._id } });
      await duplicate(() => models.DocumentLine.create({ ...base, documentId: pod._id, lineNo: 2, lineKind: 'DELIVERY_CONFIRMATION', details: podLine.details.toObject() }));
      const paymentHeader = { salesOrderId: so._id, deliveredOrderVersion: 3, fullPaymentReceived: true, receiptEvidenceId: id(), confirmedBy: actor, operationId: id() };
      await models.BusinessDocument.create({ documentNo: 'PAY-NEW-1', documentKind: 'PAYMENT_CONFIRMATION', createdBy: actor, header: paymentHeader });
      await duplicate(() => models.BusinessDocument.create({ documentNo: 'PAY-NEW-2', documentKind: 'PAYMENT_CONFIRMATION', createdBy: actor, header: { ...paymentHeader, operationId: id() } }));
      await duplicate(() => models.BusinessDocument.create({ documentNo: 'PAY-NEW-3', documentKind: 'PAYMENT_CONFIRMATION', createdBy: actor, header: { ...paymentHeader, deliveredOrderVersion: 4 } }));
      await models.BusinessDocument.create({ documentNo: 'PAY-NEW-4', documentKind: 'PAYMENT_CONFIRMATION', createdBy: actor, header: { ...paymentHeader, deliveredOrderVersion: 4, operationId: id() } });
      const fetched = await models.DocumentLine.findById(podLine._id);
      assert.equal(fetched.constructor.modelName, 'DocumentLine_DELIVERY_CONFIRMATION');
      assert.equal(String(fetched.details.salesIssueLineId), String(giLine._id));
      assert.equal(String((await models.BusinessDocument.findById(wir._id)).header.salesOrderId), String(so._id));
    });

    await t.test('non-stock operation retries, assessments and FD reopening facts retain unique identities', async () => {
      const actor = id();
      const operation = { documentId: id(), operation: 'CANCEL', operationKey: 'cancel-1', idempotencyKey: 'nonstock-1', payloadHash: 'c'.repeat(64), documentVersion: 1, performedBy: actor };
      const op = await models.BusinessOperation.create(operation);
      await duplicate(() => models.BusinessOperation.create({ ...operation, idempotencyKey: 'nonstock-2' }));
      await duplicate(() => models.BusinessOperation.create({ ...operation, operationKey: 'cancel-2' }));
      const cancellation = { salesOrderId: operation.documentId, salesOrderLineId: id(), cancelledQtyBase: '2', cancelledBy: actor, reason: 'Customer request', operationId: op._id };
      await models.SalesOrderCancellation.create(cancellation);
      await duplicate(() => models.SalesOrderCancellation.create(cancellation));
      const assessment = { returnLineId: id(), assessmentNo: 1, documentVersion: 1, packagingCondition: 'TORN', installationStatus: 'UNUSED', damageCause: 'UNKNOWN', deadlineStatus: 'UNKNOWN', eligibilityStatus: 'PENDING', assessmentReason: 'Awaiting evidence', assessedBy: actor };
      const firstAssessment = await models.CustomerReturnAssessment.create(assessment);
      await duplicate(() => models.CustomerReturnAssessment.create(assessment));
      await models.CustomerReturnAssessment.create({ ...assessment, assessmentNo: 2, documentVersion: 2 });
      firstAssessment.assessmentReason = 'Changed';
      await assert.rejects(firstAssessment.save(), /append-only/);
      const claim = { requestLineId: id(), salesIssueLineId: id(), claimKind: 'FD', qtyBase: '2', status: 'OPEN', operationId: op._id };
      const persistedClaim = await models.ReturnSourceClaim.create(claim);
      await duplicate(() => models.ReturnSourceClaim.create(claim));
      persistedClaim.status = 'CONSUMED';
      await persistedClaim.save();
      const receiptLineId = id();
      const reopening = { receiptLineId, salesOrderLineId: id(), issueRequestLineId: id(), outboundDeliveryLineId: id(), reopenedQty: '2', sourceVersion: 1, postingBatchId: id() };
      await models.DemandReopening.create(reopening);
      await duplicate(() => models.DemandReopening.create(reopening));
      const transfer = { reopeningReceiptLineId: receiptLineId, fromOdLineId: reopening.outboundDeliveryLineId, toOdLineId: id(), qtyBase: '2', sourceVersion: 1, targetVersion: 1, operationId: op._id };
      await models.OdCommitmentTransfer.create(transfer);
      await duplicate(() => models.OdCommitmentTransfer.create(transfer));
      const hold = await models.DefectHold.create({ defectDocumentId: id(), balanceId: id(), qtyBase: '2', evidenceId: id(), recordedBy: actor, status: 'ACTIVE' });
      hold.status = 'RESOLVED';
      await hold.save();
      assert.equal(await models.DefectHold.countDocuments({ balanceId: hold.balanceId, status: 'ACTIVE' }), 0);
    });

    await t.test('count/recount history is distinct and cannot be rewritten through Mongoose', async () => {
      const base = { snapshotId: id(), countedQty: '0', countedBy: id(), countedAt: new Date() };
      const first = await models.CountAttempt.create({ ...base, attemptNo: 1 });
      await models.CountAttempt.create({ ...base, attemptNo: 2, countedQty: '1' });
      await duplicate(() => models.CountAttempt.create({ ...base, attemptNo: 1 }));
      first.countedQty = '5';
      await assert.rejects(first.save(), /append-only/);
      assert.equal((await models.CountAttempt.findById(first._id)).countedQty.toString(), '0');
    });
  } finally {
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  }
});
