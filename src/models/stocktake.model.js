import {
  Schema,
  options,
  model,
  ref,
  integer,
  decimal,
  date,
  appendOnly,
} from "./model-utils.js";

const lockSchema = new Schema(
  {
    locationId: ref("Location", true, { unique: true }),
    stocktakeId: ref("BusinessDocument"),
    lockedAt: date(true, { default: Date.now }),
  },
  options("location_locks"),
);
lockSchema.index({ stocktakeId: 1 });

const snapshotSchema = new Schema(
  {
    stocktakeId: ref("BusinessDocument"),
    balanceId: ref("StockBalance"),
    bookQty: decimal(),
    foundAfterCutoff: { type: Boolean, required: true, default: false },
  },
  options("stocktake_snapshots"),
);
snapshotSchema.index({ stocktakeId: 1, balanceId: 1 }, { unique: true });
appendOnly(snapshotSchema);

const countSchema = new Schema(
  {
    snapshotId: ref("StocktakeSnapshot"),
    attemptNo: integer(1),
    // No default: an absent count must remain distinct from a real zero count.
    countedQty: decimal(),
    countedBy: ref("User"),
    countedAt: date(),
  },
  options("count_attempts"),
);
countSchema.index({ snapshotId: 1, attemptNo: 1 }, { unique: true });
appendOnly(countSchema);

export const LocationLock = model("LocationLock", lockSchema);
export const StocktakeSnapshot = model("StocktakeSnapshot", snapshotSchema);
export const CountAttempt = model("CountAttempt", countSchema);
