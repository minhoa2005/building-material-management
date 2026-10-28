import {
  Schema,
  options,
  model,
  text,
  ref,
  integer,
  date,
  appendOnly,
} from "./model-utils.js";

const auditSchema = new Schema(
  {
    documentId: ref("BusinessDocument", false),
    actorId: ref("User"),
    action: text(80),
    eventAt: date(true, { default: Date.now }),
    details: text(4000),
  },
  options("audit_events"),
);
auditSchema.index({ documentId: 1, eventAt: 1 });
appendOnly(auditSchema);

const outboxSchema = new Schema(
  {
    documentId: ref("BusinessDocument"),
    eventType: text(60),
    eventKey: text(120, { unique: true }),
    documentVersion: integer(1, { required() {
      return ["STOCKTAKE_CLOSED", "SALES_ORDER_SAVED"].includes(this.eventType);
    } }),
    deliveredAt: date(false),
    attempts: integer(0, { default: 0 }),
  },
  options("outbox_events"),
);
outboxSchema.index(
  { createdAt: 1 },
  { partialFilterExpression: { deliveredAt: null } },
);

export const AuditEvent = model("AuditEvent", auditSchema);
export const OutboxEvent = model("OutboxEvent", outboxSchema);
