import {
  Schema,
  embeddedOptions,
  ref,
  integer,
  date,
  rules,
  sameId,
} from "./model-utils.js";
import { opt, revision } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createWarehouseTransferRequestHeaderSchema() {
  const schema = new Schema(
    {
      sourceWarehouseId: ref("Warehouse"),
      destinationWarehouseId: ref("Warehouse"),
      neededOn: date(false),
      approvedVersion: integer(1, { required: false }),
    },
    embeddedOptions,
  );
  rules(schema, function validateTransferWarehouses() {
    if (sameId(this.sourceWarehouseId, this.destinationWarehouseId)) {
      this.invalidate(
        "destinationWarehouseId",
        "Transfer warehouses must differ",
      );
    }
  });
  schema.add({
    approvedRevision: revision(),
    requestedBy: ref("User", false),
    requestedAt: date(false),
    reason: opt(2000),
    approvalStatus: opt(40),
    executionStatus: opt(40),
    reviewedBy: ref("User", false),
    reviewedAt: date(false),
    rejectionReason: opt(2000),
    closedBy: ref("User", false),
    closedAt: date(false),
    closureMode: opt(20),
    closureReason: opt(2000),
  });
  return schema;
}
