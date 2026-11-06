import {
  Schema,
  embeddedOptions,
  text,
  ref,
  code,
  integer,
  decimal,
  date,
  rules,
  exact,
} from "./model-utils.js";

import { REPLENISHMENT_TRIGGER_TYPES } from "./constants.js";

// Embedded schema; no standalone collection.
export function createReplenishmentDetailsSchema() {
  const replenishmentDetails = new Schema(
    {
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
    },
    embeddedOptions,
  );
  rules(replenishmentDetails, function validateReplenishmentSource() {
    const requireFields = (fields) => {
      for (const field of fields) {
        if (this[field] == null || this[field] === "")
          this.invalidate(
            field,
            `${field} is required for ${this.triggerType}`,
          );
      }
    };
    const rejectFields = (fields) => {
      for (const field of fields) {
        if (this[field] != null)
          this.invalidate(
            field,
            `${field} does not belong to ${this.triggerType}`,
          );
      }
    };
    const salesFields = ["sourceSalesOrderLineId", "sourceSalesOrderVersion"];
    const issueFields = [
      "sourceIssueRequestLineId",
      "sourceIssueRequestVersion",
    ];
    const stocktakeFields = [
      "sourceStocktakeId",
      "sourceStocktakeVersion",
      "policyId",
      "policyVersion",
    ];
    if (this.triggerType === "SALES_SHORTAGE") {
      requireFields([
        ...salesFields,
        "remainingDemandQtySnapshot",
        "reservedForDemandQtySnapshot",
        "onHandCoverageQtySnapshot",
        "otherWarehouseCoverageQtySnapshot",
      ]);
      rejectFields([
        ...stocktakeFields,
        "minimumQtySnapshot",
        "targetQtySnapshot",
      ]);
    } else if (this.triggerType === "STOCKTAKE_LOW_STOCK") {
      requireFields([
        ...stocktakeFields,
        "minimumQtySnapshot",
        "targetQtySnapshot",
      ]);
      rejectFields([
        ...salesFields,
        ...issueFields,
        "remainingDemandQtySnapshot",
        "reservedForDemandQtySnapshot",
        "onHandCoverageQtySnapshot",
      ]);
    } else if (this.triggerType === "MANUAL_OTHER") {
      rejectFields([...salesFields, ...issueFields, ...stocktakeFields]);
    }
    if (["SALES_SHORTAGE", "STOCKTAKE_LOW_STOCK"].includes(this.triggerType)) {
      requireFields([
        "evaluationKey",
        "evaluatedAt",
        "availableQtySnapshot",
        "incomingCoverageQtySnapshot",
        "pendingRequestCoverageQtySnapshot",
        "suggestedQty",
      ]);
    }
    for (const pair of [issueFields, ["evaluationKey", "evaluatedAt"]]) {
      if ((this[pair[0]] != null) !== (this[pair[1]] != null)) {
        this.invalidate(
          pair[1],
          `${pair.join(" and ")} must be supplied together`,
        );
      }
    }
    if (
      this.minimumQtySnapshot != null &&
      this.targetQtySnapshot != null &&
      exact(this.targetQtySnapshot).lt(exact(this.minimumQtySnapshot))
    ) {
      this.invalidate(
        "targetQtySnapshot",
        "Target snapshot must be at least the minimum",
      );
    }
  });
  return replenishmentDetails;
}
