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
import { createDocumentSourceSchema } from "./document-source.schema.js";
import { createDocumentItemSchema } from "./document-item.schema.js";
import { createStockReversalHeaderSchema } from "./stock-reversal-header.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: stock_reversals
export function createStockReversalSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["REVERSAL"], { default: "REVERSAL" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: { type: createStockReversalHeaderSchema(), required: true },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
      stockTransactionId: ref("StockTransaction", false),
      postedBy: ref("User", false),
      postedAt: date(false),
    },
    options("stock_reversals"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);

  schema.add({ approvalDecision: createReviewDecisionSchema() });
  return schema;
}
