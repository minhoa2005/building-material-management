import {
  Schema,
  options,
  ref,
  code,
  integer,
  date,
  rules,
} from "./model-utils.js";
import { id, version } from "./schema-helpers.js";

// Collection: stocktake_location_locks
export function createStocktakeLocationLockSchema() {
  const locks = new Schema(
    {
      stocktakeId: ref("Stocktake"),
      locationId: ref("WarehouseLocation"),
      scopeVersion: integer(1),
      lockedAt: date(),
      lockedBy: ref("User"),
      status: code(["LOCKED", "RELEASED"]),
      version: version(),
      releasedAt: date(false),
      releasedBy: ref("User", false),
      closureReferenceId: id(false),
    },
    options("stocktake_location_locks"),
  );
  locks.index(
    { locationId: 1 },
    { unique: true, partialFilterExpression: { status: "LOCKED" } },
  );
  rules(locks, function () {
    if (
      this.status === "RELEASED" &&
      (!this.releasedAt || !this.releasedBy || !this.closureReferenceId)
    ) {
      this.invalidate(
        "status",
        "Released locks require the completed closure reference",
      );
    }
  });
  return locks;
}
