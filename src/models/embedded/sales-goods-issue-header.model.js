import { Schema, embeddedOptions, ref, code, date } from "../model-utils.js";
import { warehouse } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createSalesGoodsIssueHeaderSchema() {
  const schema = new Schema(
    { ...warehouse(), issueKind: code(["SALE"], { default: "SALE" }) },
    embeddedOptions,
  );
  schema.add({
    deliveryOrderId: ref("DeliveryOrder", false),
    issuedAt: date(false),
    issuedBy: ref("User", false),
  });
  return schema;
}
