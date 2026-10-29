import {
  Schema,
  options,
  embeddedOptions,
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
  discriminators,
} from "./model-utils.js";
import { LINE_KINDS, QUALITY_CODES, PACKAGING_CONDITIONS, REPLENISHMENT_TRIGGER_TYPES } from "./constants.js";

const details = (fields) => ({
  type: new Schema(fields, embeddedOptions),
  required: true,
});
const quality = () => code(QUALITY_CODES);

const replenishmentDetails = new Schema({
  triggerType: code(REPLENISHMENT_TRIGGER_TYPES),
  sourceSalesOrderLineId: ref("DocumentLine", false),
  sourceSalesOrderVersion: integer(1, { required: false }),
  sourceIssueRequestLineId: ref("DocumentLine", false),
  sourceIssueRequestVersion: integer(1, { required: false }),
  sourceStocktakeId: ref("BusinessDocument", false),
  sourceStocktakeVersion: integer(1, { required: false }),
  policyId: ref("ProductWarehousePolicy", false),
  policyVersion: integer(1, { required: false }),
  evaluationKey: text(200, { required: false }),
  evaluatedAt: date(false),
  availableQtySnapshot: decimal({ required: false }),
  otherWarehouseCoverageQtySnapshot: decimal({ required: false }),
  remainingDemandQtySnapshot: decimal({ required: false }),
  reservedForDemandQtySnapshot: decimal({ required: false }),
  onHandCoverageQtySnapshot: decimal({ required: false }),
  incomingCoverageQtySnapshot: decimal({ required: false }),
  pendingRequestCoverageQtySnapshot: decimal({ required: false }),
  minimumQtySnapshot: decimal({ required: false }),
  targetQtySnapshot: decimal({ required: false }),
  suggestedQty: decimal({ positive: true, required: false }),
  reasonNote: text(2000),
  quantityAdjustmentReason: text(2000, { required: false }),
}, embeddedOptions);
rules(replenishmentDetails, function validateReplenishmentSource() {
  const requireFields = (fields) => {
    for (const field of fields) {
      if (this[field] == null || this[field] === "") this.invalidate(field, `${field} is required for ${this.triggerType}`);
    }
  };
  const rejectFields = (fields) => {
    for (const field of fields) {
      if (this[field] != null) this.invalidate(field, `${field} does not belong to ${this.triggerType}`);
    }
  };
  const salesFields = ["sourceSalesOrderLineId", "sourceSalesOrderVersion"];
  const issueFields = ["sourceIssueRequestLineId", "sourceIssueRequestVersion"];
  const stocktakeFields = ["sourceStocktakeId", "sourceStocktakeVersion", "policyId", "policyVersion"];
  if (this.triggerType === "SALES_SHORTAGE") {
    requireFields([...salesFields, "remainingDemandQtySnapshot", "reservedForDemandQtySnapshot", "onHandCoverageQtySnapshot", "otherWarehouseCoverageQtySnapshot"]);
    rejectFields([...stocktakeFields, "minimumQtySnapshot", "targetQtySnapshot"]);
  } else if (this.triggerType === "STOCKTAKE_LOW_STOCK") {
    requireFields([...stocktakeFields, "minimumQtySnapshot", "targetQtySnapshot"]);
    rejectFields([...salesFields, ...issueFields, "remainingDemandQtySnapshot", "reservedForDemandQtySnapshot", "onHandCoverageQtySnapshot"]);
  } else if (this.triggerType === "MANUAL_OTHER") {
    rejectFields([...salesFields, ...issueFields, ...stocktakeFields]);
  }
  if (["SALES_SHORTAGE", "STOCKTAKE_LOW_STOCK"].includes(this.triggerType)) {
    requireFields(["evaluationKey", "evaluatedAt", "availableQtySnapshot", "incomingCoverageQtySnapshot", "pendingRequestCoverageQtySnapshot", "suggestedQty"]);
  }
  for (const pair of [issueFields, ["evaluationKey", "evaluatedAt"]]) {
    if ((this[pair[0]] != null) !== (this[pair[1]] != null)) {
      this.invalidate(pair[1], `${pair.join(" and ")} must be supplied together`);
    }
  }
  if (this.minimumQtySnapshot != null && this.targetQtySnapshot != null
    && exact(this.targetQtySnapshot).lt(exact(this.minimumQtySnapshot))) {
    this.invalidate("targetQtySnapshot", "Target snapshot must be at least the minimum");
  }
});

const taskDetails = new Schema(
  {
    fromLocationId: ref("Location"),
    toLocationId: ref("Location"),
    qualityCode: quality(),
  },
  embeddedOptions,
);
rules(taskDetails, function validateTaskEndpoints() {
  if (sameId(this.fromLocationId, this.toLocationId)) {
    this.invalidate("toLocationId", "Warehouse-task locations must differ");
  }
});

const returnDetails = new Schema(
  {
    originalIssueLineId: ref("DocumentLine", false),
    historicalExternalLineId: ref("ExternalReferenceLine", false),
    reason: text(1000),
  },
  embeddedOptions,
);
rules(returnDetails, function validateReturnSource() {
  if (
    Boolean(this.originalIssueLineId) === Boolean(this.historicalExternalLineId)
  ) {
    this.invalidate(
      "originalIssueLineId",
      "Exactly one original issue or historical external line is required",
    );
  }
});

const resolutionDetails = new Schema({
  countId: ref("CountAttempt"),
  holdId: ref("DefectHold", false),
  actionKind: code(["DELTA", "RECLASS", "RELOCATE"]),
  fromBalanceId: ref("StockBalance", false),
  toBalanceId: ref("StockBalance", false),
  deltaQty: decimal({ signed: true, nonzero: true, required: false }),
  executedBy: ref("User", false),
  executedAt: date(false),
  executionEvidenceId: ref("Evidence", false),
}, embeddedOptions);
rules(resolutionDetails, function validateResolutionAction() {
  if (this.actionKind === "DELTA") {
    const delta = this.deltaQty == null ? null : exact(this.deltaQty);
    if (!delta?.isFinite() || delta.isZero()) {
      this.invalidate("deltaQty", "DELTA requires a nonzero signed quantity");
    } else if (delta.gt(0) ? this.fromBalanceId != null || this.toBalanceId == null
      : this.fromBalanceId == null || this.toBalanceId != null) {
      this.invalidate("fromBalanceId", "DELTA endpoints must match the delta sign");
    }
  } else if (["RECLASS", "RELOCATE"].includes(this.actionKind)) {
    if (this.deltaQty != null || !this.fromBalanceId || !this.toBalanceId
      || sameId(this.fromBalanceId, this.toBalanceId)) {
      this.invalidate("toBalanceId", "RECLASS/RELOCATE require distinct endpoints and no delta");
    }
  }
  const execution = [this.executedBy, this.executedAt, this.executionEvidenceId];
  if (execution.some((value) => value != null) && !execution.every((value) => value != null)) {
    this.invalidate("executionEvidenceId", "Execution requires actor, time and evidence together");
  }
});

const lineSchema = new Schema(
  {
    documentId: ref("BusinessDocument"),
    lineNo: integer(1),
    lineKind: code(LINE_KINDS, { default: "STANDARD" }),
    productId: ref("Product"),
    lotId: ref("Lot", false),
    conversionId: ref("ProductUomVersion"),
    enteredQty: decimal({ positive: true }),
    conversionSnapshot: decimal({ positive: true, precision: 24, scale: 12 }),
    qtyBase: decimal({ positive: true }),
    productNameSnapshot: text(200),
  },
  options("document_lines", { discriminatorKey: "lineKind" }),
);
lineSchema.index({ documentId: 1, lineNo: 1 }, { unique: true });
lineSchema.index({ lotId: 1 });
lineSchema.index(
  { "details.salesOrderLineId": 1, "details.releaseKey": 1 },
  {
    unique: true,
    partialFilterExpression: { lineKind: "ISSUE_REQUEST" },
  },
);
lineSchema.index({ "details.externalLineId": 1 }, {
  unique: true, partialFilterExpression: { lineKind: "SALES_ORDER" },
});
lineSchema.index({ documentId: 1, "details.salesIssueLineId": 1 }, {
  unique: true, partialFilterExpression: { lineKind: "DELIVERY_CONFIRMATION" },
});
for (const [kind, field] of [
  ["REPLENISHMENT", "sourceSalesOrderLineId"],
  ["ISSUE_REQUEST", "salesOrderLineId"],
  ["OUTBOUND_DELIVERY", "issueRequestLineId"],
  ["SALES_GOODS_ISSUE", "outboundDeliveryLineId"],
  ["DELIVERY_CONFIRMATION", "salesIssueLineId"],
  ["FAILED_DELIVERY_RECEIPT", "salesIssueLineId"],
]) {
  lineSchema.index({ [`details.${field}`]: 1 }, {
    name: `${kind.toLowerCase()}_source`, partialFilterExpression: { lineKind: kind },
  });
}
lineSchema.index({ "details.sourceStocktakeId": 1 }, {
  partialFilterExpression: { lineKind: "REPLENISHMENT" },
});
lineSchema.index(
  { "details.dispatchLineId": 1 },
  {
    partialFilterExpression: { lineKind: "TRANSFER_RECEIPT" },
  },
);
rules(lineSchema, function validateLineQuantities() {
  if (this.lineKind === "REPLENISHMENT" && this.details?.triggerType === "SALES_SHORTAGE"
    && this.details.suggestedQty != null && this.qtyBase != null
    && exact(this.qtyBase).gt(exact(this.details.suggestedQty))) {
    this.invalidate("qtyBase", "Quantity above the sales shortage requires a separate reserve/other line");
  }
  if (this.lineKind === "REPLENISHMENT" && this.details?.suggestedQty != null && this.qtyBase != null
    && !exact(this.qtyBase).eq(exact(this.details.suggestedQty)) && !this.details.quantityAdjustmentReason) {
    this.invalidate("details.quantityAdjustmentReason", "Changing the suggested quantity requires a reason");
  }
  if (this.enteredQty && this.conversionSnapshot && this.qtyBase) {
    const expected = exact(this.enteredQty)
      .mul(exact(this.conversionSnapshot))
      .toDecimalPlaces(6);
    if (!expected.eq(exact(this.qtyBase))) {
      this.invalidate(
        "qtyBase",
        "Base quantity must equal entered quantity × conversion snapshot rounded to 6 places",
      );
    }
  }
  if (
    (this.lineKind === "ADJUSTMENT" ||
      (this.lineKind === "ST_RESOLUTION" && this.details?.actionKind === "DELTA")) &&
    this.details?.deltaQty &&
    this.qtyBase &&
    !exact(this.details.deltaQty).abs().eq(exact(this.qtyBase))
  ) {
    this.invalidate(
      "qtyBase",
      "Base quantity must be the absolute signed delta",
    );
  }
});

const shapes = {
  STANDARD: {},
  REPLENISHMENT: { details: { type: replenishmentDetails, required: true } },
  SALES_ORDER: {
    details: details({
      externalReferenceId: ref("ExternalReference"),
      externalLineId: ref("ExternalReferenceLine"),
      requiredTone: text(60, { required: false }),
      requiredCalibre: text(60, { required: false }),
    }),
  },
  OUTBOUND_DELIVERY: {
    details: details({ issueRequestLineId: ref("DocumentLine") }),
  },
  SALES_GOODS_ISSUE: {
    details: details({ outboundDeliveryLineId: ref("DocumentLine") }),
  },
  DELIVERY_CONFIRMATION: {
    details: details({
      salesIssueLineId: ref("DocumentLine"),
      photoEvidenceId: ref("Evidence"),
    }),
  },
  FAILED_DELIVERY: {
    details: details({ salesIssueLineId: ref("DocumentLine") }),
  },
  FAILED_DELIVERY_RECEIPT: {
    details: details({
      failedDeliveryLineId: ref("DocumentLine"),
      salesIssueLineId: ref("DocumentLine"),
      inspectionLineId: ref("DocumentLine"),
      claimId: ref("ReturnSourceClaim", false),
    }),
  },
  ST_RESOLUTION: { details: { type: resolutionDetails, required: true } },
  INSPECTION: {
    details: details({
      inspectedSourceLineId: ref("DocumentLine"),
      qualityCode: quality(),
      ownershipDecision: code(["ACCEPT", "CUSTODY", "REJECT"]),
      inspectedBy: ref("User"),
      inspectedAt: date(),
      packagingCondition: code(PACKAGING_CONDITIONS, { default: "UNKNOWN" }),
    }),
  },
  TRANSFER_RECEIPT: {
    details: details({
      dispatchLineId: ref("DocumentLine"),
      qualityCode: quality(),
    }),
  },
  ISSUE_REQUEST: {
    details: details({
      salesOrderLineId: ref("DocumentLine"),
      releaseKey: text(60),
      requiredTone: text(60, { required: false }),
      requiredCalibre: text(60, { required: false }),
      substitutionApprovalReference: text(300, { required: false }),
    }),
  },
  WAREHOUSE_TASK: { details: { type: taskDetails, required: true } },
  DISPOSITION: {
    details: details({
      defectLineId: ref("DocumentLine"),
      outcome: code(["RELEASE", "REGRADE", "SCRAP", "RETURN_SUPPLIER"]),
      approvalId: ref("Approval", false),
    }),
  },
  CUSTOMER_RETURN: { details: { type: returnDetails, required: true } },
  SUPPLIER_RETURN: {
    details: details({
      originLineId: ref("DocumentLine"),
      ownerPartyId: ref("Party"),
      agreedQty: decimal(),
      agreementVersion: integer(1),
      agreementVerifiedBy: ref("User"),
      agreementVerifiedAt: date(),
      agreementEvidenceId: ref("Evidence"),
    }),
  },
  SUPPLIER_ACK: {
    details: details({
      dispatchLineId: ref("DocumentLine"),
      outcome: code(["ACCEPTED", "REJECTED", "DAMAGED"]),
      acknowledgedAt: date(),
    }),
  },
  DISCREPANCY: {
    details: details({
      sourceLineId: ref("DocumentLine"),
      discrepancyKind: code([
        "SHORT",
        "OVER",
        "DAMAGED",
        "WRONG_LOT",
        "WRONG_PRODUCT",
      ]),
      resolutionStatus: text(20, { default: "OPEN" }),
      resolutionDocumentId: ref("BusinessDocument", false),
    }),
  },
  ADJUSTMENT: {
    details: details({
      countId: ref("CountAttempt"),
      approvalId: ref("Approval", false),
      deltaQty: decimal({ signed: true, nonzero: true }),
    }),
  },
};

export const DocumentLine = discriminators(
  model("DocumentLine", lineSchema),
  shapes,
);
