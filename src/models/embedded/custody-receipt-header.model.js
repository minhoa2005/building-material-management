import { Schema, embeddedOptions, ref, code, date } from "../model-utils.js";
import { id, opt } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createCustodyReceiptHeaderSchema() {
  const schema = new Schema({}, embeddedOptions);
  schema.add({
    warehouseId: ref("Warehouse", false),
    ownerType: code(["CUSTOMER", "SUPPLIER"], { required: false }),
    ownerId: id(false),
    receivedAt: date(false),
    receivedBy: ref("User", false),
    handedOverBy: opt(160),
    releasedAt: date(false),
    releasedBy: ref("User", false),
    recipientName: opt(160),
    operationId: ref("OperationRecord", false),
  });
  return schema;
}
