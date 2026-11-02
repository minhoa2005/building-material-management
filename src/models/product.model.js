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
  rules,
  exact,
} from "./model-utils.js";

const uomSchema = new Schema(
  { code: text(12, { unique: true }), name: text(60) },
  options("uoms"),
);

const optionalText = (maxlength, extra = {}) =>
  text(maxlength, { required: false, ...extra });

const productSchema = new Schema(
  {
    sku: text(60, { unique: true, uppercase: true }),
    name: text(200),
    baseUomId: ref("Uom"),
    wholeBaseUnits: { type: Boolean, required: true, default: true },
    nominalSize: optionalText(60),
    category: optionalText(100),
    brand: optionalText(100),
    material: optionalText(100),
    surface: optionalText(100),
    lengthMm: decimal({ positive: true, required: false }),
    widthMm: decimal({ positive: true, required: false }),
    thicknessMm: decimal({ positive: true, required: false }),
    origin: optionalText(100),
    description: optionalText(2000),
    isActive: { type: Boolean, required: true, default: true },
    version: integer(1, { default: 1 }),
  },
  options("products"),
);
productSchema.index({ isActive: 1, createdAt: -1, _id: -1 });
rules(productSchema, function validateProductDimensions() {
  if (Boolean(this.lengthMm) !== Boolean(this.widthMm)) {
    this.invalidate(
      "widthMm",
      "Chiều dài và chiều rộng phải cùng có hoặc cùng không có",
    );
  }
});

const conversionSchema = new Schema(
  {
    productId: ref("Product"),
    uomId: ref("Uom"),
    version: integer(1),
    basePerUnit: decimal({ positive: true, precision: 24, scale: 12 }),
    validFrom: date(),
    createdBy: ref("User", false),
    verificationReference: optionalText(2000),
  },
  options("product_uom_versions"),
);
conversionSchema.index(
  { productId: 1, uomId: 1, version: 1 },
  { unique: true },
);
conversionSchema.index({ productId: 1, uomId: 1, validFrom: -1, version: -1 });
appendOnly(conversionSchema);

const policySchema = new Schema(
  {
    productId: ref("Product"),
    warehouseId: ref("Warehouse"),
    minimumQty: decimal(),
    targetQty: decimal({ default() { return this.minimumQty; } }),
    version: integer(1, { default: 1 }),
    updatedBy: ref("User", false),
  },
  options("product_warehouse_policies"),
);
policySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });
rules(policySchema, function validateReplenishmentTarget() {
  if (this.targetQty != null && this.minimumQty != null && exact(this.targetQty).lt(exact(this.minimumQty))) {
    this.invalidate("targetQty", "Target quantity must be at least the minimum quantity");
  }
});

const lotSchema = new Schema(
  {
    productId: ref("Product"),
    manufacturerLot: text(100),
    tone: text(60),
    calibre: text(60),
    identificationStatus: code(["VERIFIED", "UNKNOWN"]),
    manufacturedOn: date(false),
    version: integer(1, { default: 1 }),
    createdBy: ref("User", false),
    notes: optionalText(2000),
    verificationReference: optionalText(2000),
    verifiedBy: ref("User", false),
    verifiedAt: date(false),
    identityLocked: { type: Boolean, required: true, default: false },
  },
  options("lots"),
);
lotSchema.index(
  { productId: 1, manufacturerLot: 1, tone: 1, calibre: 1 },
  { unique: true },
);
lotSchema.index({ productId: 1, identificationStatus: 1, createdAt: -1, _id: -1 });
rules(lotSchema, function validateLotVerificationPair() {
  if (Boolean(this.verifiedBy) !== Boolean(this.verifiedAt)) {
    this.invalidate("verifiedAt", "Thông tin xác minh phải có người và thời điểm");
  }
});

export const Uom = model("Uom", uomSchema);
export const Product = model("Product", productSchema);
export const ProductUomVersion = model("ProductUomVersion", conversionSchema);
export const ProductWarehousePolicy = model(
  "ProductWarehousePolicy",
  policySchema,
);
export const Lot = model("Lot", lotSchema);