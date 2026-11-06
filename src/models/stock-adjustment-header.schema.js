import { Schema, embeddedOptions, ref } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createStockAdjustmentHeaderSchema() {
  const schema = new Schema({}, embeddedOptions);
  schema.add({
    stocktakeId: ref("Stocktake", false),
    resolutionPlanId: ref("StocktakeResolutionPlan", false),
    warehouseId: ref("Warehouse", false),
  });
  return schema;
}
