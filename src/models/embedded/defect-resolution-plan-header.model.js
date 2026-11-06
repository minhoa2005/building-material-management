import { Schema, embeddedOptions, ref, date } from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createDefectResolutionPlanHeaderSchema() {
  const schema = new Schema({}, embeddedOptions);
  schema.add({
    defectReportId: ref("DefectReport", false),
    proposedBy: ref("User", false),
    submittedAt: date(false),
    previousPlanId: ref("DefectResolutionPlan", false),
  });
  return schema;
}
