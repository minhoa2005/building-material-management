import { Schema, embeddedOptions, refs } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createStocktakeHeaderScopeSchema() {
  const schema = new Schema(
    {
      locationIds: refs("WarehouseLocation"),
      batchIds: refs("ProductBatch"),
      productIds: refs("Product"),
      areaCodes: [String],
    },
    embeddedOptions,
  );
  return schema;
}
