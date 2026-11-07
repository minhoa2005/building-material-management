import {
  Schema,
  options,
  ref,
  integer,
  decimal,
  appendOnly,
  rules,
  exact,
  sameId,
} from "./model-utils.js";
import { objectId, quantity } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createStockMovementSchema() {
  const movements = new Schema(
    {
      transactionId: ref("PostingBatch"),
      lineNo: integer(1),
      packagingPortionIds: {type:[objectId],default:undefined},
      sourceLineId: { type: objectId, required: true },
      fromBalanceId: ref("StockBalance", false),
      toBalanceId: ref("StockBalance", false),
      quantityBase: decimal({ positive: true }),
      fromBefore: decimal({ required: false }),
      fromAfter: decimal({ required: false }),
      toBefore: decimal({ required: false }),
      toAfter: decimal({ required: false }),
    },
    options("stock_movements"),
  );
  movements.index({ transactionId: 1, lineNo: 1 }, { unique: true });
  rules(movements, function () {
    if (
      (!this.fromBalanceId && !this.toBalanceId) ||
      sameId(this.fromBalanceId, this.toBalanceId)
    )
      this.invalidate("toBalanceId", "Invalid movement endpoints");
    for (const side of ["from", "to"]) {
      const present = Boolean(this[side + "BalanceId"]);
      const before = this[side + "Before"],
        after = this[side + "After"];
      if (present !== (before != null) || present !== (after != null))
        this.invalidate(side + "After", "Endpoint requires both quantities");
      else if (present && this.quantityBase) {
        const change = exact(this.quantityBase).times(side === "from" ? -1 : 1);
        if (!exact(before).plus(change).eq(String(after)))
          this.invalidate(
            side + "After",
            "Movement quantity does not reconcile",
          );
      }
    }
  });
  appendOnly(movements);
  return movements;
}
