import { Schema, embeddedOptions, ref } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createStocktakeResolutionPlanSelectedCountsSchema() {
  const schema = new Schema(
    { snapshotId: ref("StocktakeSnapshot"), countId: ref("StocktakeCount") },
    embeddedOptions,
  );
  return schema;
}
