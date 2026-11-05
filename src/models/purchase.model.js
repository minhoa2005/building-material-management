import { Schema, options, embeddedOptions, model, text, ref, refs, code, integer, decimal, date, appendOnly, rules, exact } from './model-utils.js';

// Immutable authority/history; the claims and placement rows below are rebuildable projections.
const eventLine = new Schema({
  poLineId: ref('DocumentLine'), qtyBase: decimal({ positive: true }),
  rrLineId: ref('DocumentLine', false), approvalId: ref('Approval', false),
  expectedOn: date(false),
}, embeddedOptions);
const eventSchema = new Schema({
  purchaseOrderId: ref('BusinessDocument'), documentId: ref('BusinessDocument'),
  kind: code(['AMENDMENT', 'SUPPLIER_CONFIRMATION', 'CLOSE_REQUEST', 'CLOSE_APPROVAL', 'CLOSE_EXECUTION', 'CORRECTION', 'REVERSAL']),
  sourcePoVersion: integer(1), actorId: ref('User'), reason: text(2000),
  evidenceIds: refs('Evidence'), lines: { type: [eventLine], default: [] },
  relatedEventId: ref('PurchaseEvent', false), relatedDocumentId: ref('BusinessDocument', false),
  postingBatchId: ref('PostingBatch', false),
}, options('purchase_events'));
eventSchema.index({ purchaseOrderId: 1, kind: 1, createdAt: -1 });
eventSchema.index({ documentId: 1, kind: 1 });
eventSchema.index({ relatedEventId: 1, kind: 1 }, { unique: true, partialFilterExpression: { kind: { $in: ['CLOSE_APPROVAL', 'CLOSE_EXECUTION'] } } });
appendOnly(eventSchema);

const sourceSchema = new Schema({
  purchaseOrderId: ref('BusinessDocument', true, { immutable: true }), poLineId: ref('DocumentLine', true, { immutable: true }), rrLineId: ref('DocumentLine', true, { immutable: true }),
  approvalId: ref('Approval', true, { immutable: true }), qtyBase: decimal(), version: integer(1, { default: 1 }),
}, options('purchase_source_claims'));
sourceSchema.index({ poLineId: 1, rrLineId: 1 }, { unique: true });
sourceSchema.index({ rrLineId: 1 });

const placementSchema = new Schema({
  purchaseOrderId: ref('BusinessDocument', true, { immutable: true }), receiptId: ref('BusinessDocument', true, { immutable: true }), receiptLineId: ref('DocumentLine', true, { unique: true, immutable: true }),
  sourceBalanceId: ref('StockBalance', true, { immutable: true }), receivedQtyBase: decimal({ positive: true, immutable: true }),
  placedQtyBase: decimal({ default: '0' }), claimedQtyBase: decimal({ default: '0' }),
  reversedQtyBase: decimal({ default: '0' }), version: integer(1, { default: 1 }),
}, options('receipt_placements'));
placementSchema.index({ receiptId: 1 });
placementSchema.index({ sourceBalanceId: 1 });
rules(placementSchema, function validatePlacementCap() {
  if ([this.placedQtyBase,this.claimedQtyBase,this.reversedQtyBase,this.receivedQtyBase].some(v => v == null)) return;
  if (exact(this.placedQtyBase).plus(exact(this.claimedQtyBase)).plus(exact(this.reversedQtyBase)).gt(exact(this.receivedQtyBase))) this.invalidate('claimedQtyBase', 'Placed + claimed + reversed cannot exceed the receipt');
});

const uploadSchema = new Schema({
  documentId: ref('BusinessDocument'), lineId: ref('DocumentLine', false), actorId: ref('User'),
  objectKey: text(600), sha256: text(64), mediaType: code(['image/jpeg', 'image/png', 'application/pdf']),
  resourceType: code(['image', 'raw']), format: text(12), bytes: integer(1),
  expiresAt: date(), status: code(['UPLOADING', 'READY', 'ATTACHED', 'DELETING', 'DELETED'], { default: 'READY' }),
  evidenceId: ref('Evidence', false),
}, options('purchase_evidence_uploads'));
uploadSchema.index({ status: 1, expiresAt: 1 });
uploadSchema.index({ objectKey: 1 }, { unique: true });

export const PurchaseEvent = model('PurchaseEvent', eventSchema);
export const PurchaseSourceClaim = model('PurchaseSourceClaim', sourceSchema);
export const ReceiptPlacement = model('ReceiptPlacement', placementSchema);
export const PurchaseEvidenceUpload = model('PurchaseEvidenceUpload', uploadSchema);
