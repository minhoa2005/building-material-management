import {
  Schema,
  options,
  model,
  text,
  ref,
  decimal,
  date,
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
  },
  options("external_reference_lines"),
);
lineSchema.index({ referenceId: 1, lineKey: 1 }, { unique: true });

export const ExternalReference = model("ExternalReference", referenceSchema);
export const ExternalReferenceLine = model("ExternalReferenceLine", lineSchema);
