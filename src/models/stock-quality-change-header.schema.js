import { Schema, embeddedOptions, ref } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createStockQualityChangeHeaderSchema() {
  const schema = new Schema({}, embeddedOptions);
  schema.add({
    warehouseId: ref("Warehouse", false),
    operationId: ref("OperationRecord", false),
    planId: ref("DefectResolutionPlan", false),
  });
  return schema;
}
