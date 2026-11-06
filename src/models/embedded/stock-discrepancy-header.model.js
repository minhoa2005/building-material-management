import { Schema, embeddedOptions, ref, date } from "../model-utils.js";

import { createSourceReferenceSchema } from "./source-reference.model.js";

// Embedded schema; no standalone collection.
export function createStockDiscrepancyHeaderSchema() {
  const schema = new Schema({}, embeddedOptions);
  schema.add({
    sourceRef: createSourceReferenceSchema(),
    warehouseId: ref("Warehouse", false),
    reportedBy: ref("User", false),
    reportedAt: date(false),
  });
  return schema;
}
