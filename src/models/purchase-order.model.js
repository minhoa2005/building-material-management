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
import { objectId, id, opt, version, quantity } from "./schema-helpers.js";

import { createDocumentSourceSchema } from "./document-source.schema.js";
import { createDocumentItemSchema } from "./document-item.schema.js";
import { createPurchaseOrderHeaderSchema } from "./purchase-order-header.schema.js";
import { createPurchaseOrderDeliveryScheduleSchema } from "./purchase-order-delivery-schedule.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: purchase_orders
export function createPurchaseOrderSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["PO"], { default: "PO" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: { type: createPurchaseOrderHeaderSchema(), required: true },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
    },
    options("purchase_orders"),
  );
  const item = createDocumentItemSchema();
  item.add({ unitPurchasePrice: decimal(), lineAmount: decimal() });
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  item.add({
    requestItemId: id(false),
    supplierConfirmedQtyBase: quantity(),
    supplierConfirmedBy: ref("User", false),
    supplierConfirmedAt: date(false),
    cancelledRemainderQtyBase: quantity(),
    cancellationDecisionId: ref("ApprovalHistory", false),
    deliverySchedule: [createPurchaseOrderDeliveryScheduleSchema()],
  });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);
  schema.add({
    replenishmentRequestId: { type: objectId, required: true },
    totalAmount: decimal(),
    currency: text(3),
  });
  schema.index(
    { replenishmentRequestId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        replenishmentRequestId: { $type: "objectId" },
      },
    },
  );

  return schema;
}
