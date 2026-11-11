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

import { createDocumentSourceSchema } from "./document-source.schema.js";
import { createDocumentItemSchema } from "./document-item.schema.js";
import { createInternalTransferRequirementHeaderSchema } from "./internal-transfer-requirement-header.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: internal_transfer_requirements
export function createInternalTransferRequirementSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["INTERNAL_TRANSFER_REQUIREMENT"], {
        default: "INTERNAL_TRANSFER_REQUIREMENT",
      }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: {
        type: createInternalTransferRequirementHeaderSchema(),
        required: true,
      },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
    },
    options("internal_transfer_requirements"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);
  // BF04 creates at most one internal requirement from each dispatch or receipt.
  // The partial index keeps unrelated historical documents valid.
  schema.index(
    { "header.sourceDocumentId": 1 },
    { unique: true, partialFilterExpression: { "header.sourceDocumentId": { $type: "objectId" } } },
  );

  return schema;
}
