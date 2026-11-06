import {
  Schema,
  options,
  ref,
  code,
  integer,
  decimal,
  rules,
} from "./model-utils.js";
import { objectId, version } from "./schema-helpers.js";
import { QUALITY_CODES } from "./constants.js";
import { createPackagingPortionSchema } from "./embedded/packaging-portion.model.js";

// Collection: inventory_balances
export function createInventoryBalanceSchema() {
  const balances = new Schema(
    {
      holdingPointId: ref("StockAccount"),
      batchId: ref("Lot"),
      qualityStatus: code(QUALITY_CODES),
      ownerType: code(["STORE", "SUPPLIER", "CUSTOMER"]),
      ownerId: { type: objectId, default: null },
      quantityBase: decimal(),
      version: integer(0),
    },
    options("inventory_balances"),
  );
  balances.index(
    {
      holdingPointId: 1,
      batchId: 1,
      qualityStatus: 1,
      ownerType: 1,
      ownerId: 1,
    },
    { unique: true },
  );
  rules(balances, function () {
    if ((this.ownerType === "STORE") === Boolean(this.ownerId))
      this.invalidate(
        "ownerId",
        "Store-owned stock has no external owner; other stock requires one",
      );
  });
  balances.add({ packagingPortions: [createPackagingPortionSchema()] });
  return balances;
}
