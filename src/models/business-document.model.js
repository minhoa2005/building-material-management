import {
  Schema, options, embeddedOptions, model, text, ref, refs, code, integer, date,
  sameId, rules, discriminators,
} from './model-utils.js';
import { DOCUMENT_KINDS } from './constants.js';

const header = (fields) => ({ type: new Schema(fields, embeddedOptions), required: true });
const warehouse = () => ({ warehouseId: ref('Warehouse') });
const financialStatus = () => text(20, { default: 'NOT_RECORDED' });
const receiptHeader = (kind) => header({ ...warehouse(), receiptKind: code([kind], { default: kind }) });
const issueHeader = (kind) => header({ ...warehouse(), issueKind: code([kind], { default: kind }) });

const transferRequestHeader = new Schema({
  sourceWarehouseId: ref('Warehouse'), destinationWarehouseId: ref('Warehouse'), neededOn: date(false),
}, embeddedOptions);
rules(transferRequestHeader, function validateTransferWarehouses() {
  if (sameId(this.sourceWarehouseId, this.destinationWarehouseId)) {
    this.invalidate('destinationWarehouseId', 'Transfer warehouses must differ');
  }
});

const documentSchema = new Schema({
  documentNo: text(50, { unique: true }),
  documentKind: code(DOCUMENT_KINDS),
  workflowStatus: text(30, { default: 'DRAFT' }),
  version: integer(1, { default: 1 }),
  createdBy: ref('User'), occurredAt: date(false), note: text(2000, { required: false }),
  externalReferenceIds: refs('ExternalReference'),
}, options('business_documents', { discriminatorKey: 'documentKind' }));
documentSchema.index({ documentKind: 1, workflowStatus: 1, createdAt: 1 });
documentSchema.index({ 'header.dispatchId': 1 }, { partialFilterExpression: { documentKind: 'MWTR' } });

// Typed headers share the document identity, lifecycle and collection. Empty
// document kinds need no additional header collection or duplicate documentNo.
const shapes = {
  REPLENISHMENT: { header: header({ ...warehouse(), neededOn: date(), triggerReason: text(200) }) },
  PO: { header: header({
    ...warehouse(), supplierId: ref('Party'), expectedOn: date(false),
    supplierConfirmation: text(1000, { required: false }),
  }) },
  ARRIVAL: { header: header({
    ...warehouse(), supplierId: ref('Party', false), arrivedAt: date(),
    deliveryReference: text(100, { required: false }),
  }) },
  INSPECTION: {},
  GR_PURCHASE: { header: receiptHeader('PURCHASE') },
  TO: { header: header({
    ...warehouse(), taskKind: code(['PUTAWAY', 'PICK', 'RELOCATE', 'QUARANTINE', 'UNPICK']),
    assignedTo: ref('User'),
  }) },
  TRANSFER_REQUEST: { header: { type: transferRequestHeader, required: true } },
  TRANSFER_DISPATCH: { header: header({
    requestId: ref('BusinessDocument'), dispatchedBy: ref('User'), dispatchedAt: date(),
  }) },
  MWTR: { header: header({
    dispatchId: ref('BusinessDocument'), receivedBy: ref('User'), receivedAt: date(),
  }) },
  HANDOVER: { header: header({
    relatedDocumentId: ref('BusinessDocument'), recipientName: text(160),
    carrierId: ref('Party', false), handedOverAt: date(), confirmedBy: ref('User'),
  }) },
  ISSUE_REQUEST: { header: header({
    customerId: ref('Party'), requestedWarehouseId: ref('Warehouse'), neededOn: date(),
    deliveryAddressSnapshot: text(500),
  }) },
  OUTBOUND_DELIVERY: { header: header({
    ...warehouse(), issueRequestId: ref('BusinessDocument'), plannedOn: date(),
  }) },
  GI_SALE: { header: issueHeader('SALE') },
  DEFECT_CASE: { header: header({ discoveredAt: date(), reason: text(1000) }) },
  DISPOSITION: {}, SCRAP: {},
  STOCKTAKE: { header: header({
    ...warehouse(), cutoffAt: date(false), completedAt: date(false),
    mode: code(['FROZEN'], { default: 'FROZEN' }), scopeLocationIds: refs('Location'),
  }) },
  ADJUSTMENT: {},
  CUSTOMER_RETURN: { header: header({
    ...warehouse(), customerId: ref('Party'), financialFollowupStatus: financialStatus(),
  }) },
  GR_CUSTOMER_RETURN: { header: receiptHeader('CUSTOMER_RETURN') },
  SUPPLIER_RETURN: { header: header({
    ...warehouse(), supplierId: ref('Party'), agreementReference: text(300, { required: false }),
    agreedAt: date(false), financialFollowupStatus: financialStatus(),
  }) },
  GI_SUPPLIER_RETURN: { header: issueHeader('SUPPLIER_RETURN') },
  SUPPLIER_ACK: {}, DISCREPANCY: {}, CUSTODY_RECEIPT: {}, CUSTODY_RELEASE: {}, REVERSAL: {}, OPENING: {},
};

export const BusinessDocument = discriminators(model('BusinessDocument', documentSchema), shapes);
