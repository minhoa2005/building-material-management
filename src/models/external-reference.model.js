import { Schema, options, text, ref, refs, date, code } from "./model-utils.js";
import { embedRecordArray } from "./schema-helpers.js";

import { createExternalReferenceLineSchema } from "./external-reference-line.schema.js";

// Collection: external_references
export function createExternalReferenceSchema() {
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
      customerId: ref("Customer", false),
      warehouseId: ref("Warehouse", false),
      evidenceIds: refs("Attachment"),
      status: code(["RECORDED", "VERIFIED", "DISPUTED"], { default: "RECORDED" }),
      note: text(2000, { required: false }),
    },
    options("external_references"),
  );
  referenceSchema.index(
    { sourceSystem: 1, referenceKind: 1, referenceNo: 1 },
    { unique: true },
  );
  embedRecordArray(
    referenceSchema,
    "external_reference_lines",
    "items",
    createExternalReferenceLineSchema(),
  );
  return referenceSchema;
}
