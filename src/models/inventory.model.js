import {
  Schema,
  options,
  model,
  text,
  ref,
  code,
  integer,
  decimal,
  date,
  sameId,
  exact,
  rules,
  appendOnly,
} from "./model-utils.js";
import { QUALITY_CODES } from "./constants.js";

const accountSchema = new Schema(
  {
    locationId: ref("Location", false, { immutable: true }),
    transitDispatchLineId: ref("DocumentLine", false, { immutable: true }),
  },
  options("stock_accounts"),
);
accountSchema.index(
  { locationId: 1 },
  {
    unique: true,
    partialFilterExpression: { locationId: { $type: "objectId" } },
  },
);
accountSchema.index(
  { transitDispatchLineId: 1 },
  {
    unique: true,
    partialFilterExpression: { transitDispatchLineId: { $type: "objectId" } },
  },
);
rules(accountSchema, function validateAccountKind() {
  if (Boolean(this.locationId) === Boolean(this.transitDispatchLineId)) {
    this.invalidate(
      "locationId",
      "A stock account requires exactly one location or transit dispatch line",
    );
  }
});

const balanceSchema = new Schema(
  {
    accountId: ref("StockAccount", true, { immutable: true }),
    lotId: ref("Lot", true, { immutable: true }),
    qualityCode: code(QUALITY_CODES, { immutable: true }),
    ownerPartyId: ref("Party", true, { immutable: true }),
    qtyBase: decimal({ default: "0" }),
    version: integer(0, { default: 0 }),
  },
  options("stock_balances"),
);
balanceSchema.index(
  { accountId: 1, lotId: 1, qualityCode: 1, ownerPartyId: 1 },
  { unique: true },
);
balanceSchema.index({ lotId: 1, qualityCode: 1 });

const batchSchema = new Schema(
  {
    documentId: ref("BusinessDocument"),
    operation: text(40),
    operationKey: text(100),
    idempotencyKey: text(120, { unique: true }),
    payloadHash: text(64, { match: /^[a-f\d]{64}$/i }),
    postedBy: ref("User"),
    postedAt: date(true, { default: Date.now }),
    reversalOf: ref("PostingBatch", false),
  },
  options("posting_batches"),
);
batchSchema.index(
  { documentId: 1, operation: 1, operationKey: 1 },
  { unique: true },
);
batchSchema.index(
  { reversalOf: 1 },
  {
    unique: true,
    partialFilterExpression: { reversalOf: { $type: "objectId" } },
  },
);
batchSchema.index({ postedAt: 1 });
rules(batchSchema, function preventSelfReversal() {
  if (sameId(this._id, this.reversalOf))
    this.invalidate("reversalOf", "A batch cannot reverse itself");
});
appendOnly(batchSchema);

const movementSchema = new Schema(
  {
    batchId: ref("PostingBatch"),
    documentId: ref("BusinessDocument"),
    lineId: ref("DocumentLine"),
    fromBalanceId: ref("StockBalance", false),
    toBalanceId: ref("StockBalance", false),
    qtyBase: decimal({ positive: true }),
    fromBefore: decimal({ required: false }),
    fromAfter: decimal({ required: false }),
    toBefore: decimal({ required: false }),
    toAfter: decimal({ required: false }),
  },
  options("stock_movements"),
);
movementSchema.index({ fromBalanceId: 1, batchId: 1 });
movementSchema.index({ toBalanceId: 1, batchId: 1 });
movementSchema.index({ documentId: 1, lineId: 1 });
rules(movementSchema, function validateMovementEndpoints() {
  if (!this.fromBalanceId && !this.toBalanceId) {
    this.invalidate(
      "fromBalanceId",
      "At least one movement endpoint is required",
    );
  }
  if (sameId(this.fromBalanceId, this.toBalanceId)) {
    this.invalidate("toBalanceId", "Movement endpoints must differ");
  }
  for (const side of ["from", "to"]) {
    const endpoint = this[`${side}BalanceId`];
    const before = this[`${side}Before`];
    const after = this[`${side}After`];
    if (!endpoint && (before != null || after != null)) {
      this.invalidate(
        `${side}Before`,
        "An absent endpoint cannot have before/after quantities",
      );
    } else if (endpoint && (before == null || after == null)) {
      this.invalidate(
        `${side}Before`,
        "An endpoint requires both before and after quantities",
      );
    } else if (endpoint && this.qtyBase) {
      const expected =
        side === "from"
          ? exact(before).minus(exact(this.qtyBase))
          : exact(before).plus(exact(this.qtyBase));
      if (!expected.eq(exact(after))) {
        this.invalidate(
          `${side}After`,
          "Before/after quantities must agree exactly with the movement quantity",
        );
      }
    }
  }
});
appendOnly(movementSchema);

const reservationSchema = new Schema(
  {
    demandLineId: ref("DocumentLine"),
    executionLineId: ref("DocumentLine"),
    balanceId: ref("StockBalance"),
    qtyBase: decimal({ positive: true }),
    status: code(["ACTIVE", "CONSUMED", "RELEASED"]),
  },
  options("reservations"),
);
reservationSchema.index(
  { balanceId: 1 },
  { partialFilterExpression: { status: "ACTIVE" } },
);
reservationSchema.index({ demandLineId: 1, status: 1 });

const allocationSchema = new Schema(
  {
    demandLineId: ref("DocumentLine"),
    supplyLineId: ref("DocumentLine"),
    qtyBase: decimal({ positive: true }),
    status: code(["PLANNED", "FULFILLED", "CANCELLED"]),
  },
  options("demand_supply_allocations"),
);
allocationSchema.index({ demandLineId: 1, supplyLineId: 1 }, { unique: true });

export const StockAccount = model("StockAccount", accountSchema);
export const StockBalance = model("StockBalance", balanceSchema);
export const PostingBatch = model("PostingBatch", batchSchema);
export const StockMovement = model("StockMovement", movementSchema);
export const Reservation = model("Reservation", reservationSchema);
export const DemandSupplyAllocation = model(
  "DemandSupplyAllocation",
  allocationSchema,
);
