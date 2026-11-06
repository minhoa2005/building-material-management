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
} from "./model-utils.js";
import { optional, subject } from "./schema-helpers.js";

import { createAuditLogActorSnapshotSchema } from "./embedded/audit-log-actor-snapshot.model.js";
import { createAuditLogChangesSchema } from "./embedded/audit-log-changes.model.js";

// Collection: audit_logs
export function createAuditLogSchema() {
  const audits = new Schema(
    {
      eventKey: text(160, { unique: true }),
      correlationId: optional(160),
      actorType: code(["USER", "SYSTEM"]),
      actorId: ref("User", false),
      actorSnapshot: createAuditLogActorSnapshotSchema(),
      action: text(100),
      result: code(["SUCCESS", "REJECTED", "FAILED"]),
      reason: optional(2000),
      ...subject(),
      warehouseIds: refs("Warehouse"),
      versionBefore: integer(0, { required: false }),
      versionAfter: integer(1, { required: false }),
      changes: [createAuditLogChangesSchema()],
      decisionId: ref("ApprovalHistory", false),
      transactionId: ref("StockTransaction", false),
      operationId: ref("OperationRecord", false),
      occurredAt: date(),
      recordedAt: date(),
    },
    options("audit_logs"),
  );
  audits.index({ subjectId: 1, occurredAt: 1 });
  appendOnly(audits);
  return audits;
}
