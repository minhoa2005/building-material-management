import { Schema, embeddedOptions, ref, date } from "../model-utils.js";
import { opt } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createSupplierAcknowledgementHeaderSchema() {
  const schema = new Schema({}, embeddedOptions);
  schema.add({
    supplierReturnId: ref("SupplierReturn", false),
    supplierId: ref("Supplier", false),
    acknowledgedAt: date(false),
    supplierContact: opt(160),
    recordedBy: ref("User", false),
    recordedAt: date(false),
  });
  return schema;
}
