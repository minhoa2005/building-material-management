import {
  Schema,
  embeddedOptions,
  text,
  ref,
  date,
  rules,
} from "../model-utils.js";
import { revision, warehouse } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createReplenishmentRequestHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      neededOn: date(),
      triggerReason: text(200),
      creationKey: text(160),
      submittedBy: ref("User", false),
      submittedAt: date(false),
    },
    embeddedOptions,
  );
  rules(schema, function validateReplenishmentSubmission() {
    if (Boolean(this.submittedBy) !== Boolean(this.submittedAt)) {
      this.invalidate(
        "submittedAt",
        "Submission requires actor and time together",
      );
    }
  });
  schema.add({
    approvedRevision: revision(),
    latestDecisionId: ref("ApprovalHistory", false),
  });
  return schema;
}
