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
import { objectId, id, opt, version } from "./schema-helpers.js";

import { createDocumentSourceSchema } from "./embedded/document-source.model.js";
import { createDocumentItemSchema } from "./embedded/document-item.model.js";
import { createOpeningStockHeaderSchema } from "./embedded/opening-stock-header.model.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: opening_stocks
export function createOpeningStockSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["OPENING"], { default: "OPENING" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: { type: createOpeningStockHeaderSchema(), required: true },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
      stockTransactionId: ref("StockTransaction", false),
      postedBy: ref("User", false),
      postedAt: date(false),
    },
    options("opening_stocks"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  item.add({
    locationId: ref("WarehouseLocation", false),
    ownerType: opt(30),
    ownerId: id(false),
    qualityStatus: opt(30),
  });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);
  return schema;
}
