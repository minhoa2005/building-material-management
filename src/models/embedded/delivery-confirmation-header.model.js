import { Schema, embeddedOptions, text, ref, date } from "../model-utils.js";
import { warehouse } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createDeliveryConfirmationHeaderSchema() {
  const schema = new Schema(
    {
      salesOrderId: ref("BusinessDocument"),
      ...warehouse(),
      recipientName: text(160),
      deliveredAt: date(),
      confirmedBy: ref("User"),
      confirmedAt: date(true, { default: Date.now }),
      operationId: ref("BusinessOperation"),
    },
    embeddedOptions,
  );
  schema.add({
    goodsIssueId: ref("SalesGoodsIssue", false),
    correctsConfirmationId: ref("DeliveryConfirmation", false),
  });
  return schema;
}
