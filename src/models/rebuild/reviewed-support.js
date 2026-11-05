import { Schema, appendOnly, code, date, decimal, embeddedOptions, exact, integer, options, ref, refs, rules, text } from '../model-utils.js';
import { QUALITY_CODES, PACKAGING_CONDITIONS } from '../constants.js';
import { documentCollections } from './collections.js';

const id = (required = true) => ({ type: Schema.Types.ObjectId, required });
const str = length => text(length, { required: false });
const version = () => integer(1, { default: 1 });
const zero = () => decimal({ default: '0' });
const record = (collection, fields) => new Schema(fields, options(collection));
const embedded = fields => new Schema(fields, embeddedOptions);
const docType = () => code([...Object.values(documentCollections), 'sales_invoices', 'external_references']);
export const sourceReference = embedded({ documentType: docType(), documentId: id(), itemId: id(false), revision: integer(1, { required: false }) });
const entry = embedded({ enteredUnit: text(60), enteredQty: decimal(), baseUnitsPerUnit: decimal({ positive: true, scale: 12, precision: 24 }), quantityBase: decimal() });
const portionEvent = embedded({ kind: text(40), quantityBase: decimal({ positive: true }), sourceRef: sourceReference, performedBy: ref('User'), performedAt: date(), reason: str(1000) });

export function reviewedSupportSchemas() {
  const reservations = record('stock_reservations', {
    demandRef: { type: sourceReference, required: true }, executionRef: sourceReference, balanceId: ref('InventoryBalance'),
    reservedQty: decimal({ positive: true }), consumedQty: zero(), releasedQty: zero(), movedQty: zero(),
    previousReservationId: ref('StockReservation', false), sourceAllocationId: ref('SupplyAllocation', false),
    originMovementId: ref('StockMovement', false), creationKey: text(160, { unique: true }),
    createdBy: ref('User'), updatedBy: ref('User', false), version: version(),
  });
  reservations.index({ balanceId: 1 });
  reservations.index({ 'demandRef.documentId': 1, 'demandRef.itemId': 1 });
  rules(reservations, function () {
    if (this.reservedQty && exact(this.consumedQty).plus(String(this.releasedQty)).plus(String(this.movedQty)).gt(String(this.reservedQty))) {
      this.invalidate('reservedQty', 'Consumed, released and moved quantities exceed the reservation');
    }
  });
  const allocations = record('supply_allocations', {
    demandRef: { type: sourceReference, required: true }, sourceRef: { type: sourceReference, required: true },
    destinationWarehouseId: ref('Warehouse'), allocatedQty: decimal({ positive: true }),
    receivedAssignedQty: zero(), releasedQty: zero(), neededBy: date(), creationKey: text(160, { unique: true }),
    createdBy: ref('User'), updatedBy: ref('User', false), version: version(),
  });
  rules(allocations, function () {
    if (this.allocatedQty && exact(this.receivedAssignedQty).plus(String(this.releasedQty)).gt(String(this.allocatedQty))) {
      this.invalidate('allocatedQty', 'Received and released quantities exceed the allocation');
    }
    if (this.sourceRef && !['purchase_orders','warehouse_transfer_requests'].includes(this.sourceRef.documentType)) {
      this.invalidate('sourceRef', 'Expected supply must reference an eligible PO or TR');
    }
  });
  const approvals = record('approval_history', {
    decisionKey: text(160, { unique: true }), subjectType: docType(), subjectId: id(), subjectRevision: integer(1),
    decisionScope: text(60), reviewedContent: { type: Schema.Types.Mixed, required: true },
    decision: code(['APPROVE','REJECT','REVISE']), reason: text(2000),
    itemDecisions: [embedded({ itemId: id(), approvedQtyBase: decimal(), outcome: text(40), reason: str(1000) })],
    requestedBy: ref('User'), decidedBy: ref('User'), decidedAt: date(), recordedAt: date(),
    authoritySnapshot: embedded({ roleCode: text(60), permissionCode: text(100), warehouseIds: refs('Warehouse') }),
    basisRefs: [sourceReference], evidenceIds: refs('Attachment'), supersedesDecisionId: ref('ApprovalHistory', false),
  });
  approvals.index({ subjectType: 1, subjectId: 1, subjectRevision: 1 });
  rules(approvals, function () {
    if (String(this.requestedBy) === String(this.decidedBy) && this.decisionScope !== 'STANDARD_ACCEPTANCE') {
      this.invalidate('decidedBy', 'Self approval is allowed only for the approved ordinary return workflow');
    }
  });
  appendOnly(approvals);
  const attachments = record('attachments', {
    ownerDocumentType: docType(), ownerDocumentId: id(false), ownerItemId: id(false), ownerRevision: integer(1, { required: false }),
    purpose: text(80), originalName: text(250), mediaType: code(['image/jpeg','image/png','image/webp','application/pdf']),
    sizeBytes: integer(1, { max: 10 * 1024 * 1024 }), storageKey: text(600), checksum: text(64, { match: /^[a-f\d]{64}$/i }),
    uploadedBy: ref('User'), uploadedAt: date(), capturedAt: date(false),
    accessCategory: code(['BUSINESS','INTERNAL','PURCHASE_PRICE','SALES_PRICE']),
    status: code(['TEMPORARY','ATTACHED','SUPERSEDED']), uploadSessionId: str(160), expiresAt: date(false),
    replacesAttachmentId: ref('Attachment', false), replacementReason: str(1000),
  });
  rules(attachments, function () {
    if (this.status !== 'TEMPORARY' && !this.ownerDocumentId) this.invalidate('ownerDocumentId','Attached evidence requires an owner');
    if (this.replacesAttachmentId && !this.replacementReason) this.invalidate('replacementReason','Replacement evidence requires a reason');
  });
  const inspections = record('return_inspections', {
    returnLineId: id(), inspectionNo: integer(1), returnVersion: integer(1), warehouseId: ref('Warehouse'),
    inspectedBy: ref('User'), inspectedAt: date(),
    portions: [embedded({
      quantityBase: decimal({ positive: true }), packagingCondition: code(PACKAGING_CONDITIONS),
      installationStatus: code(['UNUSED','INSTALLED','UNKNOWN']), damageCause: code(['NONE','CUSTOMER','SUPPLIER','OTHER','UNKNOWN']),
      deadlineStatus: code(['WITHIN','EXCEEDED','NOT_APPLICABLE','UNKNOWN']), deadlineReference: str(1000),
      eligibilityStatus: code(['PENDING','CASE_REVIEW','INELIGIBLE']), reason: text(2000), evidenceIds: refs('Attachment'),
    })],
  });
  inspections.index({ returnLineId: 1, inspectionNo: 1 }, { unique: true });
  appendOnly(inspections);
  const claims = record('return_quantity_claims', {
    claimKind: code(['FD','CR']), requestLineId: id(), sourceKind: code(['GOODS_ISSUE','DELIVERY_CONFIRMATION','EXTERNAL']),
    sourceLineId: id(), claimedQtyBase: decimal({ positive: true }), createdBy: ref('User'),
    operationId: ref('OperationRecord'), version: version(), events: [portionEvent],
  });
  rules(claims, function () {
    const resolved = this.events.filter(event => ['RECEIVED','RELEASED'].includes(event.kind));
    if (this.claimedQtyBase && resolved.reduce((sum,event) => sum.plus(String(event.quantityBase)),exact(0)).gt(String(this.claimedQtyBase))) {
      this.invalidate('events','Resolved quantities exceed the claim');
    }
  });
  const reopening = record('delivery_demand_reopenings', {
    receiptLineId: id(), stockTransactionId: ref('StockTransaction'), salesOrderLineId: id(), issueRequestLineId: id(),
    deliveryOrderLineId: id(), goodsIssueLineId: id(), reopenedQtyBase: decimal({ positive: true }),
    sourceVersion: integer(1),
  });
  reopening.index({ receiptLineId: 1 }, { unique: true });
  appendOnly(reopening);
  const commitment = record('delivery_commitment_transfers', {
    reopeningReceiptLineId: id(), fromDeliveryOrderLineId: id(), toDeliveryOrderLineId: id(),
    quantityBase: decimal({ positive: true }), sourceVersion: integer(1), targetVersion: integer(1),
    transferredBy: ref('User'), transferredAt: date(), operationId: ref('OperationRecord'),
  });
  commitment.index({ operationId: 1, fromDeliveryOrderLineId: 1, toDeliveryOrderLineId: 1 }, { unique: true });
  rules(commitment, function () {
    if (String(this.fromDeliveryOrderLineId) === String(this.toDeliveryOrderLineId)) this.invalidate('toDeliveryOrderLineId','Source and target must differ');
  });
  appendOnly(commitment);
  const cancellation = record('sales_order_cancellations', {
    salesOrderId: ref('SalesOrder'), salesOrderLineId: id(), sourceKind: code(['UNISSUED','FAILED_DELIVERY_RETURN']),
    reopeningReceiptLineId: id(false), cancelledQtyBase: decimal({ positive: true }), reason: text(2000),
    sourceVersion: integer(1), cancelledBy: ref('User'), cancelledAt: date(), operationId: ref('OperationRecord'),
  });
  cancellation.index({ operationId: 1, salesOrderLineId: 1 }, { unique: true });
  appendOnly(cancellation);
  const holds = record('stock_holds', {
    defectReportLineId: id(), stocktakeId: ref('Stocktake', false), recordedBy: ref('User'), recordedAt: date(),
    reason: text(2000), evidenceIds: refs('Attachment'),
    allocations: [embedded({ balanceId: ref('InventoryBalance'), quantityBase: decimal({ positive: true }) })],
    events: [portionEvent], status: code(['ACTIVE','RESOLVED']), version: version(),
  });
  holds.index({ 'allocations.balanceId': 1, status: 1 });
  const snapshots = record('stocktake_snapshots', {
    stocktakeId: ref('Stocktake'), scopeVersion: integer(1), cutoffAt: date(), capturedAt: date(),
    sourceBalanceId: ref('InventoryBalance', false), locationId: ref('WarehouseLocation'), batchId: ref('ProductBatch'),
    ownerType: code(['STORE','SUPPLIER','CUSTOMER']), ownerId: id(false), qualityStatus: code(QUALITY_CODES),
    bookQtyBase: decimal(), baseUnitSnapshot: text(60), sourceBalanceVersion: integer(0, { required: false }),
    origin: code(['BOOK','DISCOVERED']), discoveredAt: date(false), discoveredBy: ref('User', false), evidenceIds: refs('Attachment'),
  });
  snapshots.index({ stocktakeId: 1, locationId: 1, batchId: 1, qualityStatus: 1, ownerType: 1, ownerId: 1 }, { unique: true });
  rules(snapshots, function () {
    if (this.origin === 'DISCOVERED' && (!this.discoveredBy || !this.discoveredAt || !this.bookQtyBase || !exact(this.bookQtyBase).isZero())) {
      this.invalidate('origin','Newly discovered stock needs zero book quantity and discovery evidence');
    }
  });
  appendOnly(snapshots);
  const counts = record('stocktake_counts', {
    stocktakeId: ref('Stocktake'), scopeVersion: integer(1), locationId: ref('WarehouseLocation'),
    targetType: code(['STOCK','EMPTY_LOCATION']), snapshotId: ref('StocktakeSnapshot', false),
    attemptNo: integer(1), previousCountId: ref('StocktakeCount', false), recountReason: str(1000),
    quantityEntries: [entry], countedQtyBase: decimal(), baseUnitSnapshot: str(60),
    conditionNote: str(2000), evidenceIds: refs('Attachment'), countedBy: ref('User'), countedAt: date(), recordedAt: date(),
  });
  counts.index({ stocktakeId: 1, locationId: 1, snapshotId: 1, attemptNo: 1 }, { unique: true });
  rules(counts, function () {
    if ((this.targetType === 'STOCK') !== Boolean(this.snapshotId)) this.invalidate('snapshotId','Count target and snapshot must agree');
    if (this.attemptNo > 1 && (!this.previousCountId || !this.recountReason)) this.invalidate('previousCountId','Recounts require their previous count and reason');
    if (this.countedQtyBase && !this.quantityEntries.reduce((sum,row) => sum.plus(String(row.quantityBase)),exact(0)).eq(String(this.countedQtyBase))) {
      this.invalidate('countedQtyBase','Count entries must add up to the recorded count');
    }
    for (const row of this.quantityEntries) {
      if (row.enteredQty && row.baseUnitsPerUnit && row.quantityBase && !exact(row.enteredQty).mul(String(row.baseUnitsPerUnit)).eq(String(row.quantityBase))) {
        this.invalidate('quantityEntries','Incorrect count conversion');
      }
    }
    if (this.targetType === 'EMPTY_LOCATION' && this.countedQtyBase && !exact(this.countedQtyBase).isZero()) this.invalidate('countedQtyBase','Empty-location confirmation must be zero');
  });
  appendOnly(counts);
  const locks = record('stocktake_location_locks', {
    stocktakeId: ref('Stocktake'), locationId: ref('WarehouseLocation'), scopeVersion: integer(1),
    lockedAt: date(), lockedBy: ref('User'), status: code(['LOCKED','RELEASED']), version: version(),
    releasedAt: date(false), releasedBy: ref('User', false), closureReferenceId: id(false),
  });
  locks.index({ locationId: 1 }, { unique: true, partialFilterExpression: { status: 'LOCKED' } });
  rules(locks, function () {
    if (this.status === 'RELEASED' && (!this.releasedAt || !this.releasedBy || !this.closureReferenceId)) {
      this.invalidate('status','Released locks require the completed closure reference');
    }
  });
  return {
    StockReservation: reservations, SupplyAllocation: allocations, ApprovalHistory: approvals, Attachment: attachments,
    ReturnInspection: inspections, ReturnQuantityClaim: claims, DeliveryDemandReopening: reopening,
    DeliveryCommitmentTransfer: commitment, SalesOrderCancellation: cancellation, StockHold: holds,
    StocktakeSnapshot: snapshots, StocktakeCount: counts, StocktakeLocationLock: locks,
  };
}
