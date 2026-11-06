import { Schema, embeddedOptions, ref, integer, date } from "../model-utils.js";
import { opt, revision } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createStocktakeResolutionPlanHeaderSchema() {
  const schema = new Schema(
    {
      stocktakeId: ref("BusinessDocument"),
      planVersion: integer(1),
      approvalId: ref("Approval", false),
      closureBatchId: ref("PostingBatch", false),
    },
    embeddedOptions,
  );
  schema.add({
    scopeVersion: revision(),
    previousPlanId: ref("StocktakeResolutionPlan", false),
    reason: opt(2000),
    proposedBy: ref("User", false),
    proposedAt: date(false),
    closedBy: ref("User", false),
    closedAt: date(false),
  });
  return schema;
}
