import { Schema, options, ref, integer } from "./model-utils.js";
import { version } from "./schema-helpers.js";

// Collection: replenishment_locks
export function createReplenishmentLockSchema() {
  const replenishmentLocks = new Schema(
    {
      warehouseId: ref("Warehouse"),
      productId: ref("Product"),
      version: integer(0, { default: 0 }),
      lastOperationId: ref("OperationRecord", false),
    },
    options("replenishment_locks"),
  );
  replenishmentLocks.index({ warehouseId: 1, productId: 1 }, { unique: true });
  return replenishmentLocks;
}
