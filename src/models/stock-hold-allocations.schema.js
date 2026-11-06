import { Schema, embeddedOptions, ref, decimal } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createStockHoldAllocationsSchema() {
  const schema = new Schema(
    {
      balanceId: ref("InventoryBalance"),
      quantityBase: decimal({ positive: true }),
    },
    embeddedOptions,
  );
  return schema;
}
