import {
  Schema,
  options,
  text,
  ref,
  refs,
  code,
  date,
} from "../model-utils.js";
import { id, version } from "../schema-helpers.js";

import { createPortionEventSchema } from "./portion-event.model.js";
import { createStockHoldAllocationsSchema } from "./stock-hold-allocations.model.js";

// Embedded schema; no standalone collection.
export function createStockHoldSchema() {
  const holds = new Schema(
    {
      defectReportLineId: id(),
      stocktakeId: ref("Stocktake", false),
      recordedBy: ref("User"),
      recordedAt: date(),
      reason: text(2000),
      evidenceIds: refs("Attachment"),
      allocations: [createStockHoldAllocationsSchema()],
      events: [createPortionEventSchema()],
      status: code(["ACTIVE", "RESOLVED"]),
      version: version(),
    },
    options("stock_holds"),
  );
  holds.index({ "allocations.balanceId": 1, status: 1 });
  return holds;
}
