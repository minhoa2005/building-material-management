import {
  Schema,
  options,
  ref,
  integer,
  decimal,
  date,
  appendOnly,
  rules,
} from "./model-utils.js";
import { id } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createDeliveryCommitmentTransferSchema() {
  const commitment = new Schema(
    {
      reopeningReceiptLineId: id(),
      fromDeliveryOrderLineId: id(),
      toDeliveryOrderLineId: id(),
      quantityBase: decimal({ positive: true }),
      sourceVersion: integer(1),
      targetVersion: integer(1),
      transferredBy: ref("User"),
      transferredAt: date(),
      operationId: ref("OperationRecord"),
    },
    options("delivery_commitment_transfers"),
  );
  commitment.index(
    { operationId: 1, fromDeliveryOrderLineId: 1, toDeliveryOrderLineId: 1 },
    { unique: true },
  );
  rules(commitment, function () {
    if (
      String(this.fromDeliveryOrderLineId) ===
      String(this.toDeliveryOrderLineId)
    )
      this.invalidate("toDeliveryOrderLineId", "Source and target must differ");
  });
  appendOnly(commitment);
  return commitment;
}
