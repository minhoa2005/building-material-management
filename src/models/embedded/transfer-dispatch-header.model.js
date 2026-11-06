import { Schema, embeddedOptions, ref, date } from "../model-utils.js";
import { revision } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createTransferDispatchHeaderSchema() {
  const schema = new Schema(
    {
      requestId: ref("BusinessDocument"),
      dispatchedBy: ref("User"),
      dispatchedAt: date(),
    },
    embeddedOptions,
  );
  schema.add({
    approvedRevision: revision(),
    sourceWarehouseId: ref("Warehouse", false),
    destinationWarehouseId: ref("Warehouse", false),
  });
  return schema;
}
