import { Schema, embeddedOptions, decimal, date } from "../model-utils.js";
import { opt } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createPurchaseOrderDeliveryScheduleSchema() {
  const schema = new Schema(
    {
      quantityBase: decimal(),
      expectedAt: date(),
      supplierReference: opt(160),
    },
    embeddedOptions,
  );
  return schema;
}
