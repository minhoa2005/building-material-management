import { Schema, options, text, ref, code, integer } from "./model-utils.js";
import { objectId, version } from "./schema-helpers.js";

import { createDocumentSourceSchema } from "./document-source.schema.js";
import { createDocumentItemSchema } from "./document-item.schema.js";
import { createHandoverHeaderSchema } from "./handover-header.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Embedded schema; no standalone collection.
export function createHandoverSchema() {
  const schema = new Schema(
    {
      documentNo: text(160, { unique: true }),
      documentKind: code(["HANDOVER"], { default: "HANDOVER" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: { type: createHandoverHeaderSchema(), required: true },
    },
    options("embedded_handover"),
  );
  const item = createDocumentItemSchema();
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);

  return schema;
}
