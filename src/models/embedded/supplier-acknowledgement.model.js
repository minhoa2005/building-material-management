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
import { objectId, opt, version } from "../schema-helpers.js";

import { createExecutionRecordSchema } from "./execution-record.model.js";
import { createDocumentSourceSchema } from "./document-source.model.js";
import { createDocumentItemSchema } from "./document-item.model.js";
import { createSupplierAcknowledgementHeaderSchema } from "./supplier-acknowledgement-header.model.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "../document-helpers.js";

// Embedded schema; no standalone collection.
export function createSupplierAcknowledgementSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["SUPPLIER_ACK"], { default: "SUPPLIER_ACK" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: {
        type: createSupplierAcknowledgementHeaderSchema(),
        required: true,
      },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
    },
    options("supplier_acknowledgements"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);

  schema.add({ reconciliations: [createExecutionRecordSchema()] });
  return schema;
}
