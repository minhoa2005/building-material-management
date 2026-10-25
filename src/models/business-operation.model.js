import {
  Schema, options, model, text, ref, integer, decimal, date, appendOnly,
} from "./model-utils.js";

// Records non-stock operations; a retry must compare payloadHash in the service.
const operationSchema = new Schema({
  documentId: ref("BusinessDocument"),
  operation: text(40),
  operationKey: text(100),
  idempotencyKey: text(120, { unique: true }),
  payloadHash: text(64, { match: /^[a-f\d]{64}$/i }),
  documentVersion: integer(1),
  performedBy: ref("User"),
  performedAt: date(true, { default: Date.now }),
  reason: text(2000, { required: false }),
}, options("business_operations"));
operationSchema.index({ documentId: 1, operation: 1, operationKey: 1 }, { unique: true });
appendOnly(operationSchema);

const cancellationSchema = new Schema({
  salesOrderId: ref("BusinessDocument"),
  salesOrderLineId: ref("DocumentLine"),
  cancelledQtyBase: decimal({ positive: true }),
  cancelledBy: ref("User"),
  cancelledAt: date(true, { default: Date.now }),
  reason: text(2000),
  operationId: ref("BusinessOperation", true, { unique: true }),
}, options("sales_order_cancellations"));
cancellationSchema.index({ salesOrderLineId: 1 });
appendOnly(cancellationSchema);

export const BusinessOperation = model("BusinessOperation", operationSchema);
export const SalesOrderCancellation = model("SalesOrderCancellation", cancellationSchema);
