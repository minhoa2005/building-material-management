import { Schema, embeddedOptions, text, code } from "../model-utils.js";
import { opt } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createPurchaseOrderHeaderSupplierSnapshotSchema() {
  const schema = new Schema(
    { code: text(60), name: text(200), phone: opt(30) },
    embeddedOptions,
  );
  return schema;
}
