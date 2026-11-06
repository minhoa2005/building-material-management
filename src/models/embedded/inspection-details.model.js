import { Schema, embeddedOptions, ref, code, date } from "../model-utils.js";
import { quality } from "../schema-helpers.js";
import { PACKAGING_CONDITIONS } from "../constants.js";

// Embedded schema; no standalone collection.
export function createInspectionDetailsSchema() {
  const schema = new Schema(
    {
      inspectedSourceLineId: ref("DocumentLine"),
      qualityCode: quality(),
      ownershipDecision: code(["ACCEPT", "CUSTODY", "REJECT"]),
      inspectedBy: ref("User"),
      inspectedAt: date(),
      packagingCondition: code(PACKAGING_CONDITIONS, { default: "UNKNOWN" }),
    },
    embeddedOptions,
  );
  return schema;
}
