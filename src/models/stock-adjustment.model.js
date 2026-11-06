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
import {
  objectId,
  id,
  opt,
  version,
  quantity,
  signed,
} from "./schema-helpers.js";

import { createDocumentSourceSchema } from "./embedded/document-source.model.js";
import { createDocumentItemSchema } from "./embedded/document-item.model.js";
import { createStockAdjustmentHeaderSchema } from "./embedded/stock-adjustment-header.model.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: stock_adjustments
export function createStockAdjustmentSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["ADJUSTMENT"], { default: "ADJUSTMENT" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: { type: createStockAdjustmentHeaderSchema(), required: true },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
      stockTransactionId: ref("StockTransaction", false),
      postedBy: ref("User", false),
      postedAt: date(false),
    },
    options("stock_adjustments"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  item.add({
    planItemId: id(false),
    snapshotIds: refs("StocktakeSnapshot"),
    countIds: refs("StocktakeCount"),
    stockBalanceId: ref("InventoryBalance", false),
    quantityDeltaBase: signed(),
    beforeQty: quantity(),
    afterQty: quantity(),
    reason: opt(1000),
  });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);

  return schema;
}
