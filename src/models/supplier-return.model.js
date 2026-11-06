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

import { createDocumentSourceSchema } from "./embedded/document-source.model.js";
import { createDocumentItemSchema } from "./embedded/document-item.model.js";
import { createSupplierReturnHeaderSchema } from "./embedded/supplier-return-header.model.js";
import { createSupplierReturnAgreementsSchema } from "./embedded/supplier-return-agreements.model.js";
import { createSupplierReturnClosureSchema } from "./embedded/supplier-return-closure.model.js";
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
