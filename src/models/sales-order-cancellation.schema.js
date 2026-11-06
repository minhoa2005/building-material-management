import {
  Schema,
  options,
  text,
  ref,
  code,
  integer,
  decimal,
  date,
  appendOnly,
} from "./model-utils.js";
import { id } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createSalesOrderCancellationSchema() {
  const cancellation = new Schema(
    {
      salesOrderId: ref("SalesOrder"),
      salesOrderLineId: id(),
      sourceKind: code(["UNISSUED", "FAILED_DELIVERY_RETURN"]),
      reopeningReceiptLineId: id(false),
      cancelledQtyBase: decimal({ positive: true }),
      reason: text(2000),
      sourceVersion: integer(1),
      cancelledBy: ref("User"),
      cancelledAt: date(),
      operationId: ref("OperationRecord"),
    },
    options("sales_order_cancellations"),
  );
  cancellation.index({ operationId: 1, salesOrderLineId: 1 }, { unique: true });
  appendOnly(cancellation);
  return cancellation;
}
