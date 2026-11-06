import { Schema, embeddedOptions, ref, code, date } from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createSupplierAckDetailsSchema() {
  const schema = new Schema(
    {
      dispatchLineId: ref("DocumentLine"),
      outcome: code(["ACCEPTED", "REJECTED", "DAMAGED"]),
      acknowledgedAt: date(),
    },
    embeddedOptions,
  );
  return schema;
}
