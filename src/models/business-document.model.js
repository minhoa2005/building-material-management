import {
  Schema,
  options,
  embeddedOptions,
  model,
  text,
  ref,
  refs,
  code,
  integer,
  date,
  sameId,
  rules,
  discriminators,
} from "./model-utils.js";
import { DOCUMENT_KINDS, SALES_ORDER_STATUSES, CONFIRMATION_STATUSES } from "./constants.js";

const header = (fields) => ({
  type: new Schema(fields, embeddedOptions),
  required: true,
});
const warehouse = () => ({ warehouseId: ref("Warehouse") });
const replenishmentHeader = new Schema({
  ...warehouse(),
  neededOn: date(),
  triggerReason: text(200),
  creationKey: text(160),
  submittedBy: ref("User", false),
  submittedAt: date(false),
}, embeddedOptions);
rules(replenishmentHeader, function validateReplenishmentSubmission() {
  if (Boolean(this.submittedBy) !== Boolean(this.submittedAt)) {
    this.invalidate("submittedAt", "Submission requires actor and time together");
  }
});
const financialStatus = () => text(20, { default: "NOT_RECORDED" });
const receiptHeader = (kind) =>
  header({ ...warehouse(), receiptKind: code([kind], { default: kind }) });
const issueHeader = (kind) =>
  header({ ...warehouse(), issueKind: code([kind], { default: kind }) });

const transferRequestHeader = new Schema(
  {
    sourceWarehouseId: ref("Warehouse"),
    destinationWarehouseId: ref("Warehouse"),
    neededOn: date(false),
    approvedVersion: integer(1, { required: false }),
  },
  embeddedOptions,
);
rules(transferRequestHeader, function validateTransferWarehouses() {
  if (sameId(this.sourceWarehouseId, this.destinationWarehouseId)) {
    this.invalidate(
      "destinationWarehouseId",
      "Transfer warehouses must differ",
    );
  }
});

const paymentHeader = new Schema({
  salesOrderId: ref("BusinessDocument"),
  deliveredOrderVersion: integer(1),
  fullPaymentReceived: {
    type: Boolean,
    required: true,
    validate: { validator: (value) => value === true, message: "Full external payment receipt must be confirmed" },
  },
  externalReceiptReference: text(300, { required: false }),
  receiptEvidenceId: ref("Evidence", false),
  confirmationNote: text(2000, { required: false }),
  confirmedBy: ref("User"),
  confirmedAt: date(true, { default: Date.now }),
  operationId: ref("BusinessOperation"),
}, embeddedOptions);
rules(paymentHeader, function requireReceiptSupport() {
  if (!this.externalReceiptReference && !this.receiptEvidenceId && !this.confirmationNote) {
    this.invalidate("externalReceiptReference", "A receipt reference, evidence or confirmation note is required");
  }
});

const documentSchema = new Schema(
  {
    documentNo: text(50, { unique: true }),
    documentKind: code(DOCUMENT_KINDS),
    workflowStatus: text(30, { default: "DRAFT" }),
    version: integer(1, { default: 1 }),
    createdBy: ref("User"),
    occurredAt: date(false),
    note: text(2000, { required: false }),
    externalReferenceIds: refs("ExternalReference"),
  },
  options("business_documents", { discriminatorKey: "documentKind" }),
);
documentSchema.index({ documentKind: 1, workflowStatus: 1, createdAt: 1 });
documentSchema.index({ documentKind: 1, "header.warehouseId": 1, createdAt: -1, _id: -1 });
documentSchema.index({ documentKind: 1, createdBy: 1, "header.warehouseId": 1, createdAt: -1, _id: -1 });
// Creation keys are scoped to the real actor; the service also compares payloadHash.
documentSchema.index({ createdBy: 1, "header.creationKey": 1 }, {
  unique: true,
  partialFilterExpression: { documentKind: "REPLENISHMENT", "header.creationKey": { $type: "string" } },
});
documentSchema.index(
  { "header.dispatchId": 1 },
  { partialFilterExpression: { documentKind: "MWTR" } },
);
documentSchema.index({ "header.externalReferenceId": 1 }, {
  unique: true, partialFilterExpression: { documentKind: "SALES_ORDER" },
});
// The operation is unique within each confirmation subtype, as in the SQL tables.
documentSchema.index({ documentKind: 1, "header.operationId": 1 }, {
  unique: true, partialFilterExpression: { "header.operationId": { $type: "objectId" } },
});
documentSchema.index({ "header.salesOrderId": 1, "header.deliveredOrderVersion": 1 }, {
  unique: true, partialFilterExpression: { documentKind: "PAYMENT_CONFIRMATION" },
});
documentSchema.index({ "header.salesOrderId": 1 }, {
  partialFilterExpression: { documentKind: "ISSUE_REQUEST" },
});
documentSchema.index({ "header.salesOrderId": 1, "header.deliveredAt": 1 }, {
  partialFilterExpression: { documentKind: "DELIVERY_CONFIRMATION" },
});
documentSchema.index({ "header.stocktakeId": 1 }, {
  partialFilterExpression: { documentKind: "ST_RESOLUTION" },
});
rules(documentSchema, function validateWorkflowStatus() {
  const allowed = this.documentKind === "SALES_ORDER" ? SALES_ORDER_STATUSES
    : ["DELIVERY_CONFIRMATION", "PAYMENT_CONFIRMATION"].includes(this.documentKind)
      ? CONFIRMATION_STATUSES : null;
  if (allowed && !allowed.includes(this.workflowStatus)) {
    this.invalidate("workflowStatus", "Invalid status for this document kind");
  }
});

// Typed headers share the document identity, lifecycle and collection. Empty
// document kinds need no additional header collection or duplicate documentNo.
const shapes = {
  REPLENISHMENT: {
    header: { type: replenishmentHeader, required: true },
  },
  PO: {
    header: header({
      ...warehouse(),
      supplierId: ref("Party"),
      expectedOn: date(false),
      supplierConfirmation: text(1000, { required: false }),
    }),
  },
  ARRIVAL: {
    header: header({
      ...warehouse(),
      supplierId: ref("Party", false),
      arrivedAt: date(),
      deliveryReference: text(100, { required: false }),
    }),
  },
  INSPECTION: {},
  GR_PURCHASE: { header: receiptHeader("PURCHASE") },
  TO: {
    header: header({
      ...warehouse(),
      taskKind: code(["PUTAWAY", "PICK", "RELOCATE", "QUARANTINE", "UNPICK"]),
      assignedTo: ref("User"),
    }),
  },
  TRANSFER_REQUEST: { header: { type: transferRequestHeader, required: true } },
  INTERNAL_TRANSFER_REQUIREMENT: {
    header: header({ ...warehouse(), sourceDocumentId: ref("BusinessDocument"), taskKind: code(["PICK", "PUTAWAY"]) }),
  },
  TRANSFER_DISPATCH: {
    header: header({
      requestId: ref("BusinessDocument"),
      dispatchedBy: ref("User"),
      dispatchedAt: date(),
    }),
  },
  MWTR: {
    header: header({
      dispatchId: ref("BusinessDocument"),
      receivedBy: ref("User"),
      receivedAt: date(),
    }),
  },
  HANDOVER: {
    header: header({
      relatedDocumentId: ref("BusinessDocument"),
      recipientName: text(160),
      carrierId: ref("Party", false),
      handedOverAt: date(),
      confirmedBy: ref("User"),
    }),
  },
  SALES_ORDER: {
    header: header({
      externalReferenceId: ref("ExternalReference"),
      customerId: ref("Party"),
      neededOn: date(),
      deliveryAddressSnapshot: text(500),
    }),
  },
  ISSUE_REQUEST: {
    header: header({
      salesOrderId: ref("BusinessDocument"),
      requestedWarehouseId: ref("Warehouse"),
      neededOn: date(),
      deliveryAddressSnapshot: text(500),
    }),
  },
  OUTBOUND_DELIVERY: {
    header: header({
      ...warehouse(),
      issueRequestId: ref("BusinessDocument"),
      plannedOn: date(),
    }),
  },
  GI_SALE: { header: issueHeader("SALE") },
  DELIVERY_CONFIRMATION: {
    header: header({
      salesOrderId: ref("BusinessDocument"),
      ...warehouse(),
      recipientName: text(160),
      deliveredAt: date(),
      confirmedBy: ref("User"),
      confirmedAt: date(true, { default: Date.now }),
      operationId: ref("BusinessOperation"),
    }),
  },
  PAYMENT_CONFIRMATION: { header: { type: paymentHeader, required: true } },
  DEFECT_CASE: { header: header({ discoveredAt: date(), reason: text(1000) }) },
  DISPOSITION: {},
  SCRAP: {},
  STOCKTAKE: {
    header: header({
      ...warehouse(),
      cutoffAt: date(false),
      completedAt: date(false),
      mode: code(["FROZEN"], { default: "FROZEN" }),
      scopeLocationIds: refs("Location"),
    }),
  },
  ADJUSTMENT: {},
  FAILED_DELIVERY: {
    header: header({
      ...warehouse(),
      failureEvidenceId: ref("Evidence"),
      reason: text(2000),
    }),
  },
  GR_FAILED_DELIVERY: { header: receiptHeader("FAILED_DELIVERY") },
  ST_RESOLUTION: {
    header: header({
      stocktakeId: ref("BusinessDocument"),
      planVersion: integer(1),
      approvalId: ref("Approval", false),
      closureBatchId: ref("PostingBatch", false),
    }),
  },
  RECLASS: {},
  CUSTOMER_RETURN: {
    header: header({
      ...warehouse(),
      customerId: ref("Party"),
      financialFollowupStatus: financialStatus(),
    }),
  },
  GR_CUSTOMER_RETURN: { header: receiptHeader("CUSTOMER_RETURN") },
  SUPPLIER_RETURN: {
    header: header({
      ...warehouse(),
      supplierId: ref("Party"),
      agreementReference: text(300, { required: false }),
      agreedAt: date(false),
      financialFollowupStatus: financialStatus(),
    }),
  },
  GI_SUPPLIER_RETURN: { header: issueHeader("SUPPLIER_RETURN") },
  SUPPLIER_ACK: {},
  DISCREPANCY: {},
  CUSTODY_RECEIPT: {},
  CUSTODY_RELEASE: {},
  REVERSAL: {},
  OPENING: {},
};

export const BusinessDocument = discriminators(
  model("BusinessDocument", documentSchema),
  shapes,
);
