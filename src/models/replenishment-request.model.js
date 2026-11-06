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
import { objectId, opt, version, quantity } from "./schema-helpers.js";

import { createDocumentSourceSchema } from "./embedded/document-source.model.js";
import { createReplenishmentSubmissionSchema } from "./embedded/replenishment-submission.model.js";
import { createDocumentItemSchema } from "./embedded/document-item.model.js";
import { createReplenishmentRequestHeaderSchema } from "./embedded/replenishment-request-header.model.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: replenishment_requests
export function createReplenishmentRequestSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["REPLENISHMENT"], { default: "REPLENISHMENT" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: {
        type: createReplenishmentRequestHeaderSchema(),
        required: true,
      },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
    },
    options("replenishment_requests"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  item.add({
    approvedQtyBase: quantity(),
    requiredBatchId: ref("ProductBatch", false),
    neededBy: date(false),
  });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);
  schema.add({
    submissions: {
      type: [createReplenishmentSubmissionSchema()],
      default: undefined,
    },
  });

  return schema;
}
