import { Schema, options, ref, decimal, rules, exact } from "../model-utils.js";
import { quantity } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createStockThresholdSchema() {
  const policySchema = new Schema(
    {
      warehouseId: ref("Warehouse"),
      minimumQty: decimal(),
      targetQty: decimal({
        default() {
          return this.minimumQty;
        },
      }),
      updatedBy: ref("User", false),
    },
    options("product_warehouse_policies"),
  );

  rules(policySchema, function validateReplenishmentTarget() {
    if (
      this.targetQty != null &&
      this.minimumQty != null &&
      exact(this.targetQty).lt(exact(this.minimumQty))
    ) {
      this.invalidate(
        "targetQty",
        "Target quantity must be at least the minimum quantity",
      );
    }
  });
  return policySchema;
}
