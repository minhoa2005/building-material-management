import { Schema, embeddedOptions, text, ref, code } from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createDiscrepancyDetailsSchema() {
  const schema = new Schema(
    {
      sourceLineId: ref("DocumentLine"),
      discrepancyKind: code([
        "SHORT",
        "OVER",
        "DAMAGED",
        "WRONG_LOT",
        "WRONG_PRODUCT",
      ]),
      resolutionStatus: text(20, { default: "OPEN" }),
      resolutionDocumentId: ref("BusinessDocument", false),
    },
    embeddedOptions,
  );
  return schema;
}
