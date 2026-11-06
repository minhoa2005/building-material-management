import { Schema, options, text, ref, refs, date } from "./model-utils.js";
import { optional, origin } from "./schema-helpers.js";

import { createNotificationEmailDeliverySchema } from "./notification-email-delivery.schema.js";

// Collection: notifications
export function createNotificationSchema() {
  const notifications = new Schema(
    {
      recipientId: ref("User"),
      type: text(80),
      eventKey: text(160),
      dedupKey: text(400, { unique: true }),
      ...origin(),
      warehouseIds: refs("Warehouse"),
      title: text(200),
      message: text(2000),
      occurredAt: date(),
      readAt: date(false),
      archivedAt: date(false),
      conditionKey: optional(160),
      conditionState: optional(40),
      evaluatedAt: date(false),
      emailDelivery: createNotificationEmailDeliverySchema(),
    },
    options("notifications"),
  );
  notifications.index({ recipientId: 1, readAt: 1, createdAt: -1 });
  return notifications;
}
