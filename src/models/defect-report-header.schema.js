import { Schema, embeddedOptions, text, ref, date } from "./model-utils.js";

import { createSourceReferenceSchema } from "./source-reference.schema.js";

// Embedded schema; no standalone collection.
export function createDefectReportHeaderSchema() {
  const schema = new Schema(
    { discoveredAt: date(), reason: text(1000) },
    embeddedOptions,
  );
  schema.add({
    warehouseId: ref("Warehouse", false),
    reportedBy: ref("User", false),
    recordedAt: date(false),
    sourceRef: createSourceReferenceSchema(),
    sourceKind: text(30, { required: false }),
  });
  return schema;
}
