import {
  Schema,
  options,
  model,
  ref,
  code,
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

// An ACTIVE hold blocks allocation of the balance without changing its quality
// or quantity. Resolution/posting/unlock must be coordinated by the service.
const holdSchema = new Schema({
  defectDocumentId: ref("BusinessDocument", true, { immutable: true }),
  balanceId: ref("StockBalance", true, { immutable: true }),
  stocktakeId: ref("BusinessDocument", false, { immutable: true }),
  qtyBase: decimal({ positive: true, immutable: true }),
  evidenceId: ref("Evidence", true, { immutable: true }),
  recordedBy: ref("User", true, { immutable: true }),
  recordedAt: date(true, { default: Date.now, immutable: true }),
  status: code(["ACTIVE", "RESOLVED"]),
}, options("defect_holds"));
holdSchema.index({ balanceId: 1 }, { partialFilterExpression: { status: "ACTIVE" } });

export const DefectHold = model("DefectHold", holdSchema);
