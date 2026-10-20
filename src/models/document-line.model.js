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
import { LINE_KINDS, QUALITY_CODES } from "./constants.js";

const details = (fields) => ({
  type: new Schema(fields, embeddedOptions),
  required: true,
});
const quality = () => code(QUALITY_CODES);

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
  { "details.externalLineId": 1, "details.releaseKey": 1 },
  {
    unique: true,
    partialFilterExpression: { lineKind: "ISSUE_REQUEST" },
  },
);
lineSchema.index(
  { "details.dispatchLineId": 1 },
  {
    partialFilterExpression: { lineKind: "TRANSFER_RECEIPT" },
  },
);
rules(lineSchema, function validateLineQuantities() {
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
    this.lineKind === "ADJUSTMENT" &&
    this.details?.deltaQty &&
    this.qtyBase &&
    !exact(this.details.deltaQty).abs().eq(exact(this.qtyBase))
  ) {
    this.invalidate(
      "qtyBase",
      "Adjustment base quantity must be the absolute signed delta",
    );
  }
});

const shapes = {
  STANDARD: {},
  INSPECTION: {
    details: details({
      inspectedSourceLineId: ref("DocumentLine"),
      qualityCode: quality(),
      ownershipDecision: code(["ACCEPT", "CUSTODY", "REJECT"]),
      inspectedBy: ref("User"),
      inspectedAt: date(),
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
      externalLineId: ref("ExternalReferenceLine"),
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
      authorizationId: ref("Approval", false),
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
