import {
  Schema,
  options,
  ref,
  integer,
  date,
  appendOnly,
} from "./model-utils.js";
import { id } from "./schema-helpers.js";

import { createReturnInspectionPortionsSchema } from "./return-inspection-portions.schema.js";

// Embedded schema; no standalone collection.
export function createReturnInspectionSchema() {
  const inspections = new Schema(
    {
      returnLineId: id(),
      inspectionNo: integer(1),
      returnVersion: integer(1),
      warehouseId: ref("Warehouse"),
      inspectedBy: ref("User"),
      inspectedAt: date(),
      portions: [createReturnInspectionPortionsSchema()],
    },
    options("return_inspections"),
  );
  inspections.index({ returnLineId: 1, inspectionNo: 1 }, { unique: true });
  appendOnly(inspections);
  return inspections;
}
