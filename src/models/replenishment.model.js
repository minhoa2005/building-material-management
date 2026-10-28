import { Schema, options, model, ref, integer } from "./model-utils.js";

// Shared conditional-write guard for planning commands. It stores no stock totals.
// All commands affecting coverage must participate in the same transaction protocol.
const planningGuardSchema = new Schema({
  warehouseId: ref("Warehouse"),
  productId: ref("Product"),
  version: integer(0, { default: 0 }),
}, options("replenishment_planning_guards"));
planningGuardSchema.index({ warehouseId: 1, productId: 1 }, { unique: true });

export const ReplenishmentPlanningGuard = model("ReplenishmentPlanningGuard", planningGuardSchema);
