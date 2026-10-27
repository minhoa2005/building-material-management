import { Schema, options, model, text, ref, code, integer, date } from "./model-utils.js";
import { NOTIFICATION_TYPES } from "./constants.js";

export const notificationDedupKey = ({ eventKey, type, recipientId, warehouseId }) =>
  `${eventKey}:${type}:${recipientId}:${warehouseId ?? "-"}`;

const notificationSchema = new Schema({
  recipientId: ref("User", true, { immutable: true }),
  type: code(NOTIFICATION_TYPES, { immutable: true }),
  title: text(200, { immutable: true }),
  message: text(2000, { immutable: true }),
  warehouseId: ref("Warehouse", function requireStocktakeWarehouse() {
    return this.type === "LOW_STOCK_AFTER_STOCKTAKE";
  }, { immutable: true }),
  sourceDocumentId: ref("BusinessDocument", true, { immutable: true }),
  sourceDocumentVersion: integer(1, { immutable: true }),
  eventKey: text(120, { immutable: true }),
  evaluatedAt: date(true, { immutable: true }),
  readAt: date(false, { default: null }),
  dedupKey: text(300, {
    immutable: true,
    default() { return notificationDedupKey(this); },
    validate: {
      validator(value) { return value === notificationDedupKey(this); },
      message: "Notification dedupKey must match event, type, recipient and warehouse",
    },
  }),
}, options("notifications"));
notificationSchema.index({ dedupKey: 1 }, { unique: true });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

// Recipient/scope checks and idempotent readAt updates belong to the service.
// No embedded alert quantities: opening a notification reevaluates live coverage.
export const Notification = model("Notification", notificationSchema);
