import { Schema, embeddedOptions, ref } from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createFailedDeliveryDetailsSchema() {
  const schema = new Schema(
    { salesIssueLineId: ref("DocumentLine") },
    embeddedOptions,
  );
  return schema;
}
