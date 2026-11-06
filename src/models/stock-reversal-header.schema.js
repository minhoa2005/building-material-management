import { Schema, embeddedOptions, ref, refs, date } from "./model-utils.js";
import { opt, revision } from "./schema-helpers.js";

import { createSourceReferenceSchema } from "./source-reference.schema.js";

// Embedded schema; no standalone collection.
export function createStockReversalHeaderSchema() {
  const schema = new Schema({}, embeddedOptions);
  schema.add({
    originalTransactionId: ref("StockTransaction", false),
    sourceDocument: createSourceReferenceSchema(),
    sourceVersion: revision(),
    warehouseIds: refs("Warehouse"),
    requestedBy: ref("User", false),
    requestedAt: date(false),
    reason: opt(2000),
    replacementDocument: createSourceReferenceSchema(),
  });
  return schema;
}
