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

import { createSourceReferenceSchema } from "./source-reference.schema.js";
import { createDocumentSourceSchema } from "./document-source.schema.js";
import { createDocumentItemSchema } from "./document-item.schema.js";
import { createPurchaseReceiptHeaderSchema } from "./purchase-receipt-header.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: purchase_receipts
export function createPurchaseReceiptSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["GR_PURCHASE"], { default: "GR_PURCHASE" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: { type: createPurchaseReceiptHeaderSchema(), required: true },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
      stockTransactionId: ref("StockTransaction", false),
      postedBy: ref("User", false),
      postedAt: date(false),
    },
    options("purchase_receipts"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  item.add({
    purchaseOrderItemId: id(false),
    arrivalItemId: id(false),
    inspectionId: ref("GoodsInspection", false),
    inspectionResultId: id(false),
    destinationLocationId: ref("WarehouseLocation", false),
    custodyReceiptRef: createSourceReferenceSchema(),
    custodyBalanceId: ref("InventoryBalance", false),
    supplierScheduleId: id(false),
  });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);

  return schema;
}
