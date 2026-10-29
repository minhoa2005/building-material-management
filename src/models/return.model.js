import {
  Schema, options, model, text, ref, code, integer, decimal, date, sameId, rules, appendOnly,
} from "./model-utils.js";
import { PACKAGING_CONDITIONS } from "./constants.js";

const assessmentSchema = new Schema({
  returnLineId: ref("DocumentLine"),
  assessmentNo: integer(1),
  documentVersion: integer(1),
  packagingCondition: code(PACKAGING_CONDITIONS),
  installationStatus: code(["UNUSED", "INSTALLED", "UNKNOWN"]),
  damageCause: code(["NONE", "CUSTOMER", "SUPPLIER", "OTHER", "UNKNOWN"]),
  deadlineStatus: code(["WITHIN", "EXCEEDED", "NOT_APPLICABLE", "UNKNOWN"]),
  deadlineReference: text(1000, { required: false }),
  eligibilityStatus: code(["PENDING", "CASE_REVIEW", "INELIGIBLE"]),
  assessmentReason: text(2000),
  assessedBy: ref("User"),
  assessedAt: date(true, { default: Date.now }),
  approvalId: ref("Approval", false),
}, options("customer_return_assessments"));
assessmentSchema.index({ returnLineId: 1, assessmentNo: 1 }, { unique: true });
assessmentSchema.index({ returnLineId: 1, documentVersion: 1, assessmentNo: -1 });
assessmentSchema.index({ eligibilityStatus: 1, returnLineId: 1 });
rules(assessmentSchema, function validateEligibility() {
  if (this.deadlineStatus !== "UNKNOWN" && !this.deadlineReference) {
    this.invalidate("deadlineReference", "A known deadline requires supporting terms/evidence");
  }
  const excluded = this.installationStatus === "INSTALLED" || this.damageCause === "CUSTOMER"
    || this.deadlineStatus === "EXCEEDED";
  const reviewable = this.packagingCondition !== "UNKNOWN" && this.installationStatus === "UNUSED"
    && ["NONE", "SUPPLIER", "OTHER"].includes(this.damageCause)
    && ["WITHIN", "NOT_APPLICABLE"].includes(this.deadlineStatus);
  const unknown = [this.packagingCondition, this.installationStatus, this.damageCause,
    this.deadlineStatus].includes("UNKNOWN");
  const valid = this.eligibilityStatus === "INELIGIBLE" ? excluded
    : this.eligibilityStatus === "CASE_REVIEW" ? reviewable
      : this.eligibilityStatus === "PENDING" && !excluded && unknown;
  if (!valid) this.invalidate("eligibilityStatus", "Eligibility must agree with the recorded return conditions");
});
appendOnly(assessmentSchema);

// Claims reserve source allowance, never on-hand stock. Status changes belong to
// the same transaction as receipt/release; consumed quantities must not count twice.
const claimSchema = new Schema({
  requestLineId: ref("DocumentLine", true, { immutable: true }),
  salesIssueLineId: ref("DocumentLine", false, { immutable: true }),
  historicalExternalLineId: ref("ExternalReferenceLine", false, { immutable: true }),
  claimKind: code(["CR", "FD"], { immutable: true }),
  qtyBase: decimal({ positive: true, immutable: true }),
  status: code(["OPEN", "CONSUMED", "RELEASED"]),
  consumedQty: decimal({ required: false }),
  operationId: ref("BusinessOperation", true, { immutable: true }),
}, options("return_source_claims"));
claimSchema.index({ requestLineId: 1, operationId: 1 }, { unique: true });
claimSchema.index({ salesIssueLineId: 1, claimKind: 1, status: 1 });
claimSchema.index({ historicalExternalLineId: 1, status: 1 });
rules(claimSchema, function validateClaimSource() {
  if (Boolean(this.salesIssueLineId) === Boolean(this.historicalExternalLineId)) {
    this.invalidate("salesIssueLineId", "Exactly one sales issue or historical external source is required");
  }
  if (this.claimKind === "FD" && !this.salesIssueLineId) {
    this.invalidate("salesIssueLineId", "Failed delivery requires a sales goods issue source");
  }
});

const reopeningSchema = new Schema({
  receiptLineId: ref("DocumentLine", true, { unique: true }),
  salesOrderLineId: ref("DocumentLine"),
  issueRequestLineId: ref("DocumentLine"),
  outboundDeliveryLineId: ref("DocumentLine"),
  reopenedQty: decimal({ positive: true }),
  sourceVersion: integer(1),
  postingBatchId: ref("PostingBatch"),
}, options("demand_reopenings"));
appendOnly(reopeningSchema);

const commitmentSchema = new Schema({
  // Logical join to DemandReopening.receiptLineId (the receipt line identity).
  reopeningReceiptLineId: ref("DocumentLine"),
  fromOdLineId: ref("DocumentLine"),
  toOdLineId: ref("DocumentLine"),
  qtyBase: decimal({ positive: true }),
  sourceVersion: integer(1),
  targetVersion: integer(1),
  operationId: ref("BusinessOperation"),
}, options("od_commitment_transfers"));
commitmentSchema.index({ operationId: 1, fromOdLineId: 1, toOdLineId: 1 }, { unique: true });
rules(commitmentSchema, function preventSelfTransfer() {
  if (sameId(this.fromOdLineId, this.toOdLineId)) {
    this.invalidate("toOdLineId", "Commitment transfer endpoints must differ");
  }
});
appendOnly(commitmentSchema);

export const CustomerReturnAssessment = model("CustomerReturnAssessment", assessmentSchema);
export const ReturnSourceClaim = model("ReturnSourceClaim", claimSchema);

const returnSourceGuardSchema = new Schema({
  salesIssueLineId: ref("DocumentLine"),
  version: integer(0, { default: 0 }),
}, options("return_source_guards"));
returnSourceGuardSchema.index({ salesIssueLineId: 1 }, { unique: true });
export const ReturnSourceGuard = model("ReturnSourceGuard", returnSourceGuardSchema);

export const DemandReopening = model("DemandReopening", reopeningSchema);
export const OdCommitmentTransfer = model("OdCommitmentTransfer", commitmentSchema);
