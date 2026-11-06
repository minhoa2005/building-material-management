import { Schema, options, text, ref, decimal } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createExternalReferenceLineSchema() {
  const lineSchema = new Schema(
    {
      lineKey: text(100),
      productId: ref("Product"),
      eligibleQty: decimal(),
      lotId: ref("Lot", false),
      enteredUnit: text(60, { required: false }),
      baseUnitSnapshot: text(60, { required: false }),
      baseUnitsPerUnit: decimal({ positive: true, required: false, precision: 24, scale: 12 }),
      previouslyReturnedQty: decimal({ default: "0" }),
    },
    options("external_reference_lines"),
  );

  return lineSchema;
}
