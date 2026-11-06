import { Schema, embeddedOptions, ref, decimal } from "./model-utils.js";
import { signed } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createAdjustmentDetailsSchema() {
  const schema = new Schema(
    {
      countId: ref("CountAttempt"),
      approvalId: ref("Approval", false),
      deltaQty: decimal({ signed: true, nonzero: true }),
    },
    embeddedOptions,
  );
  return schema;
}
