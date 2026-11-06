import { Schema, embeddedOptions, text, decimal } from "../model-utils.js";
import { id, str } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createApprovalHistoryItemDecisionsSchema() {
  const schema = new Schema(
    {
      itemId: id(),
      approvedQtyBase: decimal(),
      outcome: text(40),
      reason: str(1000),
    },
    embeddedOptions,
  );
  return schema;
}
