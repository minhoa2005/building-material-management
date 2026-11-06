import {
  Schema,
  options,
  text,
  ref,
  refs,
  code,
  integer,
  date,
} from "./model-utils.js";
import { objectId, opt, version } from "./schema-helpers.js";

import { createReviewDecisionSchema } from "./review-decision.schema.js";
import { createExecutionRecordSchema } from "./execution-record.schema.js";
import { createDocumentSourceSchema } from "./document-source.schema.js";
import { createDocumentItemSchema } from "./document-item.schema.js";
import { createStocktakeResolutionPlanHeaderSchema } from "./stocktake-resolution-plan-header.schema.js";
import { createStocktakeResolutionPlanSelectedCountsSchema } from "./stocktake-resolution-plan-selected-counts.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Embedded schema; no standalone collection.
export function createStocktakeResolutionPlanSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["ST_RESOLUTION"], { default: "ST_RESOLUTION" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: {
        type: createStocktakeResolutionPlanHeaderSchema(),
        required: true,
      },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
    },
    options("stocktake_resolution_plans"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);

  schema.add({
    selectedCounts: [createStocktakeResolutionPlanSelectedCountsSchema()],
    reviewDecisions: [createReviewDecisionSchema()],
    executionRecords: [createExecutionRecordSchema()],
  });
  return schema;
}
