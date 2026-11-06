import {
  Schema,
  options,
  text,
  ref,
  refs,
  code,
  integer,
  decimal,
  date,
} from "./model-utils.js";
import {
  objectId,
  opt,
  version,
  revision,
  embedRecordArray,
} from "./schema-helpers.js";

import { createDocumentSourceSchema } from "./embedded/document-source.model.js";
import { createSalesOrderCancellationSchema } from "./embedded/sales-order-cancellation.model.js";
import { createDocumentItemSchema } from "./embedded/document-item.model.js";
import { createSalesOrderHeaderSchema } from "./embedded/sales-order-header.model.js";
import { createDeliveryConfirmationSchema } from "./embedded/delivery-confirmation.model.js";
import { createExternalPaymentConfirmationSchema } from "./embedded/external-payment-confirmation.model.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: sales_orders
export function createSalesOrderSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["SALES_ORDER"], { default: "SALES_ORDER" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: { type: createSalesOrderHeaderSchema(), required: true },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
    },
    options("sales_orders"),
  );
  const item = createDocumentItemSchema();
  item.add({ unitSellingPrice: decimal(), lineAmount: decimal() });
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  item.add({ priceRevision: revision() });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);
  schema.add({ orderAmount: decimal(), currencyCode: text(3) });
  schema.index({ "header.externalReferenceId": 1 }, { unique: true });

  embedRecordArray(
    schema,
    "external_payment_confirmations",
    "paymentConfirmations",
    createExternalPaymentConfirmationSchema(),
  );
  embedRecordArray(
    schema,
    "sales_order_cancellations",
    "cancellations",
    createSalesOrderCancellationSchema(),
  );
  embedRecordArray(
    schema,
    "delivery_confirmations",
    "deliveryConfirmations",
    createDeliveryConfirmationSchema(),
  );
  return schema;
}
