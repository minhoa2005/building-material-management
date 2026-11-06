import { Schema, embeddedOptions, ref, refs, date } from "./model-utils.js";
import { opt, revision } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createOpeningStockHeaderSchema() {
  const schema = new Schema({}, embeddedOptions);
  schema.add({
    warehouseId: ref("Warehouse", false),
    cutoverKey: opt(160),
    openingAt: date(false),
    coveredLocationIds: refs("WarehouseLocation"),
    sourceDescription: opt(2000),
    preparedBy: ref("User", false),
    preparedAt: date(false),
    verifiedBy: ref("User", false),
    verifiedAt: date(false),
    verifiedVersion: revision(),
    verificationNote: opt(2000),
  });
  return schema;
}
