import { Schema, embeddedOptions, text, ref, date } from "./model-utils.js";
import { opt, warehouse } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createGoodsArrivalHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      supplierId: ref("Party", false),
      arrivedAt: date(),
      deliveryReference: text(100, { required: false }),
    },
    embeddedOptions,
  );
  schema.add({
    purchaseOrderId: ref("PurchaseOrder", false),
    recordedAt: date(false),
    deliveredBy: opt(160),
    vehicleReference: opt(100),
  });
  return schema;
}
