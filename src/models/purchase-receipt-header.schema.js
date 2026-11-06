import { Schema, embeddedOptions, ref, code, date } from "./model-utils.js";
import { warehouse } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createPurchaseReceiptHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      receiptKind: code(["PURCHASE"], { default: "PURCHASE" }),
    },
    embeddedOptions,
  );
  schema.add({
    purchaseOrderId: ref("PurchaseOrder", false),
    arrivalId: ref("GoodsArrival", false),
    supplierId: ref("Supplier", false),
    receivedAt: date(false),
  });
  return schema;
}
