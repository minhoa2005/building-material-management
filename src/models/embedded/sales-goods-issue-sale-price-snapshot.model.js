import {
  Schema,
  embeddedOptions,
  text,
  integer,
  decimal,
} from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createSalesGoodsIssueSalePriceSnapshotSchema() {
  const schema = new Schema(
    {
      saleUnit: text(60),
      baseUnitsPerSaleUnit: decimal({
        positive: true,
        precision: 24,
        scale: 12,
      }),
      unitSellingPrice: decimal(),
      salesOrderRevision: integer(1),
    },
    embeddedOptions,
  );
  return schema;
}
