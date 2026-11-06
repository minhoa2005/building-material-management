import { Schema, embeddedOptions, text, ref, date } from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createSupplierReturnClosureSchema() {
  const schema = new Schema(
    { closedBy: ref("User"), closedAt: date(), reason: text(2000) },
    embeddedOptions,
  );
  return schema;
}
