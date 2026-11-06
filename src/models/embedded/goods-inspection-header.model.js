import { Schema, embeddedOptions, ref, refs, date } from "../model-utils.js";
import { opt } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createGoodsInspectionHeaderSchema() {
  const schema = new Schema({}, embeddedOptions);
  schema.add({
    arrivalId: ref("GoodsArrival", false),
    warehouseId: ref("Warehouse", false),
    previousInspectionId: ref("GoodsInspection", false),
    correctionReason: opt(2000),
    participants: refs("User"),
    confirmedBy: ref("User", false),
    confirmedAt: date(false),
  });
  return schema;
}
