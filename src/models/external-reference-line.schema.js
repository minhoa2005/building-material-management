import { Schema, options, text, ref, decimal } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createExternalReferenceLineSchema() {
  const lineSchema = new Schema(
    {
      lineKey: text(100),
      productId: ref("Product"),
      eligibleQty: decimal(),
    },
    options("external_reference_lines"),
  );

  return lineSchema;
}
