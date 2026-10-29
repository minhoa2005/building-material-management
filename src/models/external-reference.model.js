import {
  Schema,
  options,
  model,
  text,
  ref,
  decimal,
  date,
  integer,
} from "./model-utils.js";

const referenceSchema = new Schema(
  {
    sourceSystem: text(50),
    referenceKind: text(40),
    referenceNo: text(100),
    referenceDate: date(false),
    sourceVersion: text(100, { required: false }),
    correlationId: text(100, { unique: true }),
    verifiedBy: ref("User", false),
    verifiedAt: date(false),
    documentId: ref("BusinessDocument", false),
    status: text(30, { default: "RECORDED" }),
    evidenceId: ref("Evidence", false),
    note: text(2000, { required: false }),
    customerId: ref("Party", false),
    warehouseId: ref("Warehouse", false),
  },
  options("external_references"),
);
referenceSchema.index(
  { sourceSystem: 1, referenceKind: 1, referenceNo: 1 },
  { unique: true },
);

const lineSchema = new Schema(
  {
    referenceId: ref("ExternalReference"),
    lineKey: text(100),
    productId: ref("Product"),
    eligibleQty: decimal(),
    sourceLineId: ref("DocumentLine", false),
    returnedQty: decimal({ required: false }),
    lotId: ref("Lot", false),
    conversionId: ref("ProductUomVersion", false),
    claimVersion: integer(0, { default: 0 }),
  },
  options("external_reference_lines"),
);
lineSchema.index({ referenceId: 1, lineKey: 1 }, { unique: true });

export const ExternalReference = model("ExternalReference", referenceSchema);
export const ExternalReferenceLine = model("ExternalReferenceLine", lineSchema);
