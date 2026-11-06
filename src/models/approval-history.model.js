import {
  Schema,
  options,
  text,
  ref,
  refs,
  code,
  integer,
  date,
  appendOnly,
  rules,
} from "./model-utils.js";
import { id, docType } from "./schema-helpers.js";

import { createSourceReferenceSchema } from "./embedded/source-reference.model.js";
import { createApprovalHistoryItemDecisionsSchema } from "./embedded/approval-history-item-decisions.model.js";
import { createApprovalHistoryAuthoritySnapshotSchema } from "./embedded/approval-history-authority-snapshot.model.js";

// Collection: approval_history
export function createApprovalHistorySchema() {
  const approvals = new Schema(
    {
      decisionKey: text(160, { unique: true }),
      subjectType: docType(),
      subjectId: id(),
      subjectRevision: integer(1),
      decisionScope: text(60),
      reviewedContent: { type: Schema.Types.Mixed, required: true },
      decision: code(["APPROVE", "REJECT", "REVISE"]),
      reason: text(2000),
      itemDecisions: [createApprovalHistoryItemDecisionsSchema()],
      requestedBy: ref("User"),
      decidedBy: ref("User"),
      decidedAt: date(),
      recordedAt: date(),
      authoritySnapshot: createApprovalHistoryAuthoritySnapshotSchema(),
      basisRefs: [createSourceReferenceSchema()],
      evidenceIds: refs("Attachment"),
      supersedesDecisionId: ref("ApprovalHistory", false),
    },
    options("approval_history"),
  );
  approvals.index({ subjectType: 1, subjectId: 1, subjectRevision: 1 });
  rules(approvals, function () {
    if (
      String(this.requestedBy) === String(this.decidedBy) &&
      this.decisionScope !== "STANDARD_ACCEPTANCE"
    ) {
      this.invalidate(
        "decidedBy",
        "Self approval is allowed only for the approved ordinary return workflow",
      );
    }
  });
  appendOnly(approvals);
  return approvals;
}
