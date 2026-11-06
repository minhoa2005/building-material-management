import {
  Schema,
  options,
  text,
  ref,
  code,
  integer,
  rules,
} from "./model-utils.js";
import {
  optionalText,
  version,
  active,
  dimension,
  dimensionsTogether,
} from "./schema-helpers.js";

// Collection: warehouse_locations
export function createWarehouseLocationSchema() {
  const locations = new Schema(
    {
      warehouseId: ref("Warehouse"),
      code: text(50),
      name: optionalText(160),
      areaCode: optionalText(50),
      locationType: code([
        "RECEIVING",
        "STORAGE",
        "STAGING",
        "QUARANTINE",
        "CUSTODY",
      ]),
      isPickable: { type: Boolean, default: false },
      description: optionalText(500),
      isActive: active(),
      version: version(),
      operationVersion: integer(0, { default: 0 }),
      usableLengthMm: dimension(),
      usableWidthMm: dimension(),
    },
    options("warehouse_locations"),
  );
  dimensionsTogether(locations, ["usableLengthMm", "usableWidthMm"]);
  locations.index({ warehouseId: 1, code: 1 }, { unique: true });
  rules(locations, function () {
    if (this.isPickable && this.locationType !== "STORAGE")
      this.invalidate("isPickable", "Only storage bins are pickable");
  });
  return locations;
}
