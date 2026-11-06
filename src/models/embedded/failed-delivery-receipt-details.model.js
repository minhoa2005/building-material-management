import { Schema, embeddedOptions, ref } from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createFailedDeliveryReceiptDetailsSchema() {
  const schema = new Schema(
    {
      failedDeliveryLineId: ref("DocumentLine"),
      salesIssueLineId: ref("DocumentLine"),
      inspectionLineId: ref("DocumentLine"),
      claimId: ref("ReturnSourceClaim", false),
    },
    embeddedOptions,
  );
  return schema;
}
