import { Schema, options, text, code, integer, date } from "./model-utils.js";
import { optional, origin } from "./schema-helpers.js";

// Collection: system_events
export function createSystemEventSchema() {
  const events = new Schema(
    {
      eventKey: text(160),
      handlerCode: text(80),
      eventType: text(80),
      ...origin(),
      correlationId: optional(160),
      payload: { type: Schema.Types.Mixed, required: true },
      payloadVersion: integer(1),
      status: code(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]),
      attempts: integer(0),
      nextAttemptAt: date(false),
      leaseOwner: optional(100),
      leaseToken: optional(100),
      leaseUntil: date(false),
      lastErrorCode: optional(100),
      lastErrorSummary: optional(1000),
      completedAt: date(false),
      occurredAt: date(),
    },
    options("system_events"),
  );
  events.index({ eventKey: 1, handlerCode: 1 }, { unique: true });
  events.index({ status: 1, nextAttemptAt: 1 });
  return events;
}
