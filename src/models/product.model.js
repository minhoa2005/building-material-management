import { Schema, options, text, decimal, ref } from "./model-utils.js";
import { optionalText, active, embedRecordArray } from "./schema-helpers.js";

import { createStockThresholdSchema } from "./stock-threshold.schema.js";

// Collection: products
export function createProductSchema() {
  const products = new Schema(
    {
      sku: text(60),
      manufacturerCode: text(100),
      name: text(200),
      categoryId: ref("Category"),
      material: optionalText(160),
      surface: optionalText(100),
      origin: optionalText(100),
      description: optionalText(2000),
      baseUnit: text(60),
      wholeBaseUnits: { type: Boolean, required: true, default: true },
      lengthMm: decimal({ positive: true, scale: 3 }),
      widthMm: decimal({ positive: true, scale: 3 }),
      heightMm: decimal({ positive: true, scale: 3 }),
      color: text(160),
      isActive: active(),
    },
    options("products"),
  );
  products.index(
    { manufacturerCode: 1, sku: 1, color: 1 },
    { unique: true, collation: { locale: "vi", strength: 2 } },
  );
  products.index({ categoryId: 1 });
  embedRecordArray(
    products,
    "stock_thresholds",
    "stockThresholds",
    createStockThresholdSchema(),
  );
  return products;
}
