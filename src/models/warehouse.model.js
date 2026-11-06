import { Schema, options, text, code } from "./model-utils.js";
import {
  optionalText,
  active,
  uniqueCode,
  dimension,
  dimensionsTogether,
} from "./schema-helpers.js";

// Collection: warehouses
export function createWarehouseSchema() {
  const warehouses = new Schema(
    {
      code: uniqueCode(),
      name: text(160),
      address: optionalText(500),
      description: optionalText(500),
      lengthMm: dimension(),
      widthMm: dimension(),
      clearHeightMm: dimension(),
      isActive: active(),
    },
    options("warehouses"),
  );
  dimensionsTogether(warehouses, ["lengthMm", "widthMm", "clearHeightMm"]);
  return warehouses;
}
