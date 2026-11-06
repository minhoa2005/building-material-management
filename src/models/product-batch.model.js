import {
  Schema,
  options,
  text,
  ref,
  code,
  integer,
  decimal,
  date,
} from "./model-utils.js";

// Collection: product_batches
export function createProductBatchSchema() {
  const schema = new Schema(
    {
      productId: ref("Product"),
      manufacturerLot: text(100),
      identificationStatus: code(["VERIFIED", "UNKNOWN"]),
      manufacturedOn: date(false),
      piecesPerCarton: integer(1),
      cartonLengthMm: decimal({ positive: true, scale: 3 }),
      cartonWidthMm: decimal({ positive: true, scale: 3 }),
      cartonHeightMm: decimal({ positive: true, scale: 3 }),
    },
    options("product_batches"),
  );
  schema.index({ productId: 1, manufacturerLot: 1 }, { unique: true });
  return schema;
}
