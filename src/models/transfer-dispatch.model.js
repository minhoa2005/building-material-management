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
import { createHandoverSchema } from "./handover.schema.js";
import { createTransferDispatchHeaderSchema } from "./transfer-dispatch-header.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: transfer_dispatches
export function createTransferDispatchSchema() {
  const schema = new Schema(
    {
      documentNo: text(160, { unique: true }),
      documentKind: code(["TRANSFER_DISPATCH"], {
        default: "TRANSFER_DISPATCH",
      }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: { type: createTransferDispatchHeaderSchema(), required: true },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
      stockTransactionId: ref("StockTransaction", false),
      postedBy: ref("User", false),
      postedAt: date(false),
    },
    options("transfer_dispatches"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);
  const handover = createHandoverSchema();
  handover.clearIndexes();
  handover.path("documentNo").options.unique = false;
  schema.add({
    handovers: { type: [handover], default: undefined, excludeIndexes: true },
  });

  return schema;
}
