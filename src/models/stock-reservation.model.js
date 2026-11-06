import {
  Schema,
  options,
  text,
  ref,
  decimal,
  rules,
  exact,
} from "./model-utils.js";
import { version, zero } from "./schema-helpers.js";

import { createSourceReferenceSchema } from "./embedded/source-reference.model.js";

// Collection: stock_reservations
export function createStockReservationSchema() {
  const reservations = new Schema(
    {
      demandRef: { type: createSourceReferenceSchema(), required: true },
      executionRef: createSourceReferenceSchema(),
      balanceId: ref("InventoryBalance"),
      reservedQty: decimal({ positive: true }),
      consumedQty: zero(),
      releasedQty: zero(),
      movedQty: zero(),
      previousReservationId: ref("StockReservation", false),
      sourceAllocationId: ref("SupplyAllocation", false),
      originMovementId: ref("StockMovement", false),
      creationKey: text(160, { unique: true }),
      createdBy: ref("User"),
      updatedBy: ref("User", false),
      version: version(),
    },
    options("stock_reservations"),
  );
  reservations.index({ balanceId: 1 });
  reservations.index({ "demandRef.documentId": 1, "demandRef.itemId": 1 });
  rules(reservations, function () {
    if (
      this.reservedQty &&
      exact(this.consumedQty)
        .plus(String(this.releasedQty))
        .plus(String(this.movedQty))
        .gt(String(this.reservedQty))
    ) {
      this.invalidate(
        "reservedQty",
        "Consumed, released and moved quantities exceed the reservation",
      );
    }
  });
  return reservations;
}
