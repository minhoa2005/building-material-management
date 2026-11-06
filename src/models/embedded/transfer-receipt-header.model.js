import { Schema, embeddedOptions, ref, refs, date } from "../model-utils.js";
import { opt } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createTransferReceiptHeaderSchema() {
  const schema = new Schema(
    {
      dispatchId: ref("BusinessDocument"),
      receivedBy: ref("User"),
      receivedAt: date(),
    },
    embeddedOptions,
  );
  schema.add({
    warehouseId: ref("Warehouse", false),
    putawayStatus: opt(40),
    damageReportIds: refs("DefectReport"),
  });
  return schema;
}
