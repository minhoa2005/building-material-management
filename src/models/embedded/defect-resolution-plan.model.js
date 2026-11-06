import {
  Schema,
  options,
  text,
  ref,
  refs,
  code,
  integer,
  date,
} from "../model-utils.js";
import { objectId, opt, version, quantity } from "../schema-helpers.js";

import { createReviewDecisionSchema } from "./review-decision.model.js";
import { createDocumentSourceSchema } from "./document-source.model.js";
import { createDocumentItemSchema } from "./document-item.model.js";
import { createDefectResolutionPlanHeaderSchema } from "./defect-resolution-plan-header.model.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "../document-helpers.js";

// Embedded schema; no standalone collection.
export function createDefectResolutionPlanSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["DISPOSITION"], { default: "DISPOSITION" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: {
        type: createDefectResolutionPlanHeaderSchema(),
        required: true,
      },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
    },
    options("defect_resolution_plans"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  item.add({ approvedQtyBase: quantity() });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);

  schema.add({ reviewDecisions: [createReviewDecisionSchema()] });

  return schema;
}
