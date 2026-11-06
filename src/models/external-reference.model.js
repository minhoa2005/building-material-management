import { Schema, options, text, ref, date } from "./model-utils.js";
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
