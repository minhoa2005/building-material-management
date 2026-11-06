import { Schema, embeddedOptions, ref } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createTransferOutboundDetailsSchema() {
  const schema = new Schema(
    {
      requestLineId: ref("DocumentLine"),
      sourceBalanceId: ref("StockBalance"),
      stagingLocationId: ref("Location"),
    },
    embeddedOptions,
  );
  return schema;
}
