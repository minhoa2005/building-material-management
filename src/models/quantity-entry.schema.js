import { Schema, embeddedOptions, text, decimal } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createQuantityEntrySchema() {
  const schema = new Schema(
    {
      enteredUnit: text(60),
      enteredQty: decimal(),
      baseUnitsPerUnit: decimal({ positive: true, scale: 12, precision: 24 }),
      quantityBase: decimal(),
    },
    embeddedOptions,
  );
  return schema;
}
