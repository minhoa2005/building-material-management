import { Schema, embeddedOptions, ref, code, date } from "./model-utils.js";
import { warehouse } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createCustomerReturnReceiptHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      receiptKind: code(["CUSTOMER_RETURN"], { default: "CUSTOMER_RETURN" }),
    },
    embeddedOptions,
  );
  schema.add({
    returnId: ref("CustomerReturn", false),
    receivedAt: date(false),
    operationId: ref("OperationRecord", false),
  });
  return schema;
}
