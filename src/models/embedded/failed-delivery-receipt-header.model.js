import { Schema, embeddedOptions, ref, code, date } from "../model-utils.js";
import { warehouse } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createFailedDeliveryReceiptHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      receiptKind: code(["FAILED_DELIVERY"], { default: "FAILED_DELIVERY" }),
    },
    embeddedOptions,
  );
  schema.add({
    failedDeliveryId: ref("FailedDelivery", false),
    receivedAt: date(false),
    receivedBy: ref("User", false),
  });
  return schema;
}
