import { Schema, embeddedOptions, text, ref } from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createIssueRequestDetailsSchema() {
  const schema = new Schema(
    {
      salesOrderLineId: ref("DocumentLine"),
      releaseKey: text(60),
      requiredTone: text(60, { required: false }),
      requiredCalibre: text(60, { required: false }),
      substitutionApprovalReference: text(300, { required: false }),
    },
    embeddedOptions,
  );
  return schema;
}
