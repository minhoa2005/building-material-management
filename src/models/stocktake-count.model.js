import {
  Schema,
  options,
  ref,
  refs,
  code,
  integer,
  decimal,
  date,
  appendOnly,
  rules,
  exact,
} from "./model-utils.js";
import { str, quantity, zero } from "./schema-helpers.js";

import { createQuantityEntrySchema } from "./quantity-entry.schema.js";

// Collection: stocktake_counts
export function createStocktakeCountSchema() {
  const counts = new Schema(
    {
      stocktakeId: ref("Stocktake"),
      scopeVersion: integer(1),
      locationId: ref("WarehouseLocation"),
      targetType: code(["STOCK", "EMPTY_LOCATION"]),
      snapshotId: ref("StocktakeSnapshot", false),
      attemptNo: integer(1),
      previousCountId: ref("StocktakeCount", false),
      recountReason: str(1000),
      quantityEntries: [createQuantityEntrySchema()],
      countedQtyBase: decimal(),
      baseUnitSnapshot: str(60),
      conditionNote: str(2000),
      evidenceIds: refs("Attachment"),
      countedBy: ref("User"),
      countedAt: date(),
      recordedAt: date(),
    },
    options("stocktake_counts"),
  );
  counts.index(
    { stocktakeId: 1, locationId: 1, snapshotId: 1, attemptNo: 1 },
    { unique: true },
  );
  rules(counts, function () {
    if ((this.targetType === "STOCK") !== Boolean(this.snapshotId))
      this.invalidate("snapshotId", "Count target and snapshot must agree");
    if (this.attemptNo > 1 && (!this.previousCountId || !this.recountReason))
      this.invalidate(
        "previousCountId",
        "Recounts require their previous count and reason",
      );
    if (
      this.countedQtyBase &&
      !this.quantityEntries
        .reduce((sum, row) => sum.plus(String(row.quantityBase)), exact(0))
        .eq(String(this.countedQtyBase))
    ) {
      this.invalidate(
        "countedQtyBase",
        "Count entries must add up to the recorded count",
      );
    }
    for (const row of this.quantityEntries) {
      if (
        row.enteredQty &&
        row.baseUnitsPerUnit &&
        row.quantityBase &&
        !exact(row.enteredQty)
          .mul(String(row.baseUnitsPerUnit))
          .eq(String(row.quantityBase))
      ) {
        this.invalidate("quantityEntries", "Incorrect count conversion");
      }
    }
    if (
      this.targetType === "EMPTY_LOCATION" &&
      this.countedQtyBase &&
      !exact(this.countedQtyBase).isZero()
    )
      this.invalidate(
        "countedQtyBase",
        "Empty-location confirmation must be zero",
      );
  });
  appendOnly(counts);
  return counts;
}
