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
import { objectId, opt, version, embedRecordArray } from "./schema-helpers.js";

import { createReviewDecisionSchema } from "./review-decision.schema.js";
import { createDocumentSourceSchema } from "./document-source.schema.js";
import { createReturnInspectionSchema } from "./return-inspection.schema.js";
import { createDocumentItemSchema } from "./document-item.schema.js";
import { createCustomerReturnHeaderSchema } from "./customer-return-header.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: customer_returns
export function createCustomerReturnSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["CUSTOMER_RETURN"], { default: "CUSTOMER_RETURN" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: { type: createCustomerReturnHeaderSchema(), required: true },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
    },
    options("customer_returns"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);

  schema.add({ decisions: [createReviewDecisionSchema()] });
  embedRecordArray(
    schema,
    "return_inspections",
    "inspections",
    createReturnInspectionSchema(),
  );
  return schema;
}
