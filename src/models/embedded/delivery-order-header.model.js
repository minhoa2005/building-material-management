import { Schema, embeddedOptions, ref, date } from "../model-utils.js";
import { opt, warehouse } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createDeliveryOrderHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      issueRequestId: ref("BusinessDocument"),
      plannedOn: date(),
    },
    embeddedOptions,
  );
  schema.add({
    recipientName: opt(160),
    recipientPhone: opt(30),
    deliveryAddress: opt(500),
    deliveryInstructions: opt(2000),
    releasedBy: ref("User", false),
    releasedAt: date(false),
    replacesDeliveryOrderId: ref("DeliveryOrder", false),
  });
  return schema;
}
