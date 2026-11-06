import { Schema, embeddedOptions, ref } from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createSalesGoodsIssueDetailsSchema() {
  const schema = new Schema(
    { outboundDeliveryLineId: ref("DocumentLine") },
    embeddedOptions,
  );
  return schema;
}
