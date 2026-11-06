import {
  Schema,
  options,
  text,
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
import { id, quantity, zero, origin } from "./schema-helpers.js";
import { QUALITY_CODES } from "./constants.js";

// Collection: stocktake_snapshots
export function createStocktakeSnapshotSchema() {
  const snapshots = new Schema(
    {
      stocktakeId: ref("Stocktake"),
      scopeVersion: integer(1),
      cutoffAt: date(),
      capturedAt: date(),
      sourceBalanceId: ref("InventoryBalance", false),
      locationId: ref("WarehouseLocation"),
      batchId: ref("ProductBatch"),
      ownerType: code(["STORE", "SUPPLIER", "CUSTOMER"]),
      ownerId: id(false),
      qualityStatus: code(QUALITY_CODES),
      bookQtyBase: decimal(),
      baseUnitSnapshot: text(60),
      sourceBalanceVersion: integer(0, { required: false }),
      origin: code(["BOOK", "DISCOVERED"]),
      discoveredAt: date(false),
      discoveredBy: ref("User", false),
      evidenceIds: refs("Attachment"),
    },
    options("stocktake_snapshots"),
  );
  snapshots.index(
    {
      stocktakeId: 1,
      locationId: 1,
      batchId: 1,
      qualityStatus: 1,
      ownerType: 1,
      ownerId: 1,
    },
    { unique: true },
  );
  rules(snapshots, function () {
    if (
      this.origin === "DISCOVERED" &&
      (!this.discoveredBy ||
        !this.discoveredAt ||
        !this.bookQtyBase ||
        !exact(this.bookQtyBase).isZero())
    ) {
      this.invalidate(
        "origin",
        "Newly discovered stock needs zero book quantity and discovery evidence",
      );
    }
  });
  appendOnly(snapshots);
  return snapshots;
}
