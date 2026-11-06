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
import { createSupplierReturnHeaderSchema } from "./supplier-return-header.schema.js";
import { createSupplierReturnAgreementsSchema } from "./supplier-return-agreements.schema.js";
import { createSupplierReturnClosureSchema } from "./supplier-return-closure.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: supplier_returns
export function createSupplierReturnSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["SUPPLIER_RETURN"], { default: "SUPPLIER_RETURN" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: { type: createSupplierReturnHeaderSchema(), required: true },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
    },
    options("supplier_returns"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);
  schema.add({
    agreements: [createSupplierReturnAgreementsSchema()],
    closure: createSupplierReturnClosureSchema(),
  });
  return schema;
}
