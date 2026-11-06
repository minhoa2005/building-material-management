import { Schema, embeddedOptions, text, ref, date } from "../model-utils.js";
import { warehouse } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createFailedDeliveryHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      failureEvidenceId: ref("Evidence"),
      reason: text(2000),
    },
    embeddedOptions,
  );
  schema.add({
    goodsIssueId: ref("SalesGoodsIssue", false),
    reportedBy: ref("User", false),
    recordedAt: date(false),
  });
  return schema;
}
