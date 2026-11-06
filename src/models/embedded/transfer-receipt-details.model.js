import { Schema, embeddedOptions, ref } from "../model-utils.js";
import { quality } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createTransferReceiptDetailsSchema() {
  const schema = new Schema(
    {
      dispatchLineId: ref("DocumentLine"),
      qualityCode: quality(),
      destinationBalanceId: ref("StockBalance", false),
      receivingLocationId: ref("Location", false),
    },
    embeddedOptions,
  );
  return schema;
}
