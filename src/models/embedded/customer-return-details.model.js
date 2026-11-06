import { Schema, embeddedOptions, text, ref, rules } from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createCustomerReturnDetailsSchema() {
  const returnDetails = new Schema(
    {
      originalIssueLineId: ref("DocumentLine", false),
      historicalExternalLineId: ref("ExternalReferenceLine", false),
      reason: text(1000),
    },
    embeddedOptions,
  );
  rules(returnDetails, function validateReturnSource() {
    if (
      Boolean(this.originalIssueLineId) ===
      Boolean(this.historicalExternalLineId)
    ) {
      this.invalidate(
        "originalIssueLineId",
        "Exactly one original issue or historical external line is required",
      );
    }
  });
  return returnDetails;
}
