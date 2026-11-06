import { Schema, embeddedOptions, ref, code } from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createDispositionDetailsSchema() {
  const schema = new Schema(
    {
      defectLineId: ref("DocumentLine"),
      outcome: code(["RELEASE", "REGRADE", "SCRAP", "RETURN_SUPPLIER"]),
      approvalId: ref("Approval", false),
    },
    embeddedOptions,
  );
  return schema;
}
