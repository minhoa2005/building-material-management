import { Schema, embeddedOptions, ref, date } from "./model-utils.js";
import { revision } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createStockScrapRecordHeaderSchema() {
  const schema = new Schema({}, embeddedOptions);
  schema.add({
    warehouseId: ref("Warehouse", false),
    planId: ref("DefectResolutionPlan", false),
    approvedRevision: revision(),
    destroyedBy: ref("User", false),
    destroyedAt: date(false),
  });
  return schema;
}
