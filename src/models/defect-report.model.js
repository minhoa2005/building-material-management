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
import {
  objectId,
  id,
  opt,
  version,
  embedRecordArray,
} from "./schema-helpers.js";

import { createSourceReferenceSchema } from "./source-reference.schema.js";
import { createExecutionRecordSchema } from "./execution-record.schema.js";
import { createDocumentSourceSchema } from "./document-source.schema.js";
import { createStockHoldSchema } from "./stock-hold.schema.js";
import { createDocumentItemSchema } from "./document-item.schema.js";
import { createDefectReportHeaderSchema } from "./defect-report-header.schema.js";
import { createDefectResolutionPlanSchema } from "./defect-resolution-plan.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: defect_reports
export function createDefectReportSchema() {
  const schema = new Schema(
    {
      documentNo: text(160, { unique: true }),
      documentKind: code(["DEFECT_CASE"], { default: "DEFECT_CASE" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: { type: createDefectReportHeaderSchema(), required: true },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
    },
    options("defect_reports"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  item.add({
    sourceRef: createSourceReferenceSchema(),
    balanceId: ref("InventoryBalance", false),
    ownerType: opt(30),
    ownerId: id(false),
  });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);

  schema.add({ inspections: [createExecutionRecordSchema()] });
  embedRecordArray(schema, "stock_holds", "holds", createStockHoldSchema());
  embedRecordArray(
    schema,
    "defect_resolution_plans",
    "resolutionPlans",
    createDefectResolutionPlanSchema(),
  );
  schema.index({ "holds.allocations.balanceId": 1, "holds.status": 1 });
  return schema;
}
