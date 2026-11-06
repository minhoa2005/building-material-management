import { Schema, embeddedOptions, ref } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createDeliveryConfirmationDetailsSchema() {
  const schema = new Schema(
    {
      salesIssueLineId: ref("DocumentLine"),
      photoEvidenceId: ref("Evidence"),
    },
    embeddedOptions,
  );
  return schema;
}
