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

import { createDocumentSourceSchema } from "./document-source.schema.js";
import { createSalesOrderCancellationSchema } from "./sales-order-cancellation.schema.js";
import { createDocumentItemSchema } from "./document-item.schema.js";
import { createSalesOrderHeaderSchema } from "./sales-order-header.schema.js";
import { createDeliveryConfirmationSchema } from "./delivery-confirmation.schema.js";
import { createExternalPaymentConfirmationSchema } from "./external-payment-confirmation.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: sales_orders
export function createSalesOrderSchema() {
  const schema = new Schema(
    {
      documentNo: text(160, { unique: true }),
      documentKind: code(["SALES_ORDER"], { default: "SALES_ORDER" }),
      workflowStatus: text(40),
      version: integer(1),
      replenishmentPlanningVersion: integer(0, { default: 0 }),
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
