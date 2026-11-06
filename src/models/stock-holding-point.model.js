import { Schema, options, ref, code, rules } from "./model-utils.js";
import { objectId } from "./schema-helpers.js";

// Collection: stock_holding_points
export function createStockHoldingPointSchema() {
  const points = new Schema(
    {
      type: code(["LOCATION", "IN_TRANSIT"]),
      locationId: ref("Location", false),
      dispatchLineId: objectId,
    },
    options("stock_holding_points"),
  );
  for (const field of ["locationId", "dispatchLineId"]) {
    points.index(
      { [field]: 1 },
      {
        unique: true,
        partialFilterExpression: { [field]: { $type: "objectId" } },
      },
    );
  }
  rules(points, function () {
    if (
      (this.type === "LOCATION") !== Boolean(this.locationId) ||
      (this.type === "IN_TRANSIT") !== Boolean(this.dispatchLineId)
    ) {
      this.invalidate(
        "type",
        "Holding point requires its matching location or dispatch item",
      );
    }
  });
  return points;
}
