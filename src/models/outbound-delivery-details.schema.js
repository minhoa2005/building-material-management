import { Schema, embeddedOptions, ref } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createOutboundDeliveryDetailsSchema() {
  const schema = new Schema(
    { issueRequestLineId: ref("DocumentLine") },
    embeddedOptions,
  );
  return schema;
}
