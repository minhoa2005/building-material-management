import {
  Schema,
  embeddedOptions,
  code,
  integer,
  date,
} from "../model-utils.js";
import { optional } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createNotificationEmailDeliverySchema() {
  const schema = new Schema(
    {
      status: code(["PENDING", "SENT", "FAILED", "SKIPPED"]),
      attempts: integer(0),
      sentAt: date(false),
      lastError: optional(500),
    },
    embeddedOptions,
  );
  return schema;
}
