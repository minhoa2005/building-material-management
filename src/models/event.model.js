import {
  Schema,
  options,
  embeddedOptions,
  model,
  text,
  ref,
  integer,
  date,
  appendOnly,
} from "./model-utils.js";

const changeSchema = new Schema({
  path: text(200),
  before: { type: Schema.Types.Mixed, default: null },
  after: { type: Schema.Types.Mixed, default: null },
}, embeddedOptions);

const auditSchema = new Schema(
  {
    documentId: ref("BusinessDocument", false),
    actorId: ref("User"),
    action: text(80),
    eventAt: date(true, { default: Date.now }),
    details: text(4000),
    entityType: {
      type: String,
      required: false,
      enum: [
        "BUSINESS_DOCUMENT",
        "PRODUCT",
        "PRODUCT_UOM_VERSION",
        "PRODUCT_WAREHOUSE_POLICY",
        "LOT",
        "SUPPLIER",
      ],
    },
    entityId: { type: Schema.Types.ObjectId, required: false },
    changes: { type: [changeSchema], default: [] },
  },
  options("audit_events"),
);
auditSchema.index({ documentId: 1, eventAt: 1 });
auditSchema.index({ entityType: 1, entityId: 1, eventAt: -1, _id: -1 });
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
