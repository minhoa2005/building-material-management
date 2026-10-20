import {
  Schema,
  options,
  model,
  text,
  ref,
  code,
  integer,
  decimal,
  date,
  appendOnly,
} from "./model-utils.js";

const uomSchema = new Schema(
  { code: text(12, { unique: true }), name: text(60) },
  options("uoms"),
);

const productSchema = new Schema(
  {
    sku: text(60, { unique: true }),
    name: text(200),
    baseUomId: ref("Uom"),
    wholeBaseUnits: { type: Boolean, required: true, default: true },
    nominalSize: text(60, { required: false }),
    isActive: { type: Boolean, required: true, default: true },
  },
  options("products"),
);

const conversionSchema = new Schema(
  {
    productId: ref("Product"),
    uomId: ref("Uom"),
    version: integer(1),
    basePerUnit: decimal({ positive: true, precision: 24, scale: 12 }),
    validFrom: date(),
  },
  options("product_uom_versions"),
);
conversionSchema.index(
  { productId: 1, uomId: 1, version: 1 },
  { unique: true },
);
appendOnly(conversionSchema);

const policySchema = new Schema(
  {
    productId: ref("Product"),
    warehouseId: ref("Warehouse"),
    minimumQty: decimal(),
  },
  options("product_warehouse_policies"),
);
policySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });

const lotSchema = new Schema(
  {
    productId: ref("Product"),
    manufacturerLot: text(100),
    tone: text(60),
    calibre: text(60),
    identificationStatus: code(["VERIFIED", "UNKNOWN"]),
    manufacturedOn: date(false),
  },
  options("lots"),
);
lotSchema.index(
  { productId: 1, manufacturerLot: 1, tone: 1, calibre: 1 },
  { unique: true },
);

export const Uom = model("Uom", uomSchema);
export const Product = model("Product", productSchema);
export const ProductUomVersion = model("ProductUomVersion", conversionSchema);
export const ProductWarehousePolicy = model(
  "ProductWarehousePolicy",
  policySchema,
);
export const Lot = model("Lot", lotSchema);
