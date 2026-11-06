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
import { createCustomerReturnReceiptHeaderSchema } from "./customer-return-receipt-header.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: customer_return_receipts
export function createCustomerReturnReceiptSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["GR_CUSTOMER_RETURN"], {
        default: "GR_CUSTOMER_RETURN",
      }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: {
        type: createCustomerReturnReceiptHeaderSchema(),
        required: true,
      },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
      stockTransactionId: ref("StockTransaction", false),
      postedBy: ref("User", false),
      postedAt: date(false),
    },
    options("customer_return_receipts"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  item.add({
    custodyBalanceId: ref("InventoryBalance", false),
    inspectionId: ref("ReturnInspection", false),
  });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);

  return schema;
}
