import {
  Schema,
  options,
  ref,
  integer,
  decimal,
  appendOnly,
} from "./model-utils.js";
import { id } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createDeliveryDemandReopeningSchema() {
  const reopening = new Schema(
    {
      receiptLineId: id(),
      stockTransactionId: ref("StockTransaction"),
      salesOrderLineId: id(),
      issueRequestLineId: id(),
      deliveryOrderLineId: id(),
      goodsIssueLineId: id(),
      reopenedQtyBase: decimal({ positive: true }),
      sourceVersion: integer(1),
    },
    options("delivery_demand_reopenings"),
  );
  reopening.index({ receiptLineId: 1 }, { unique: true });
  appendOnly(reopening);
  return reopening;
}
