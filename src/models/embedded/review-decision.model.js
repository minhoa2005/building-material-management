import {
  Schema,
  embeddedOptions,
  text,
  ref,
  code,
  integer,
  date,
} from "../model-utils.js";
import { revision } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createReviewDecisionSchema() {
  const schema = new Schema(
    {
      decisionId: ref("ApprovalHistory"),
      revision: integer(1),
      reviewedBy: ref("User"),
      reviewedAt: date(),
      decision: code(["APPROVE", "REJECT", "REVISE"]),
      reason: text(2000),
    },
    embeddedOptions,
  );
  return schema;
}
