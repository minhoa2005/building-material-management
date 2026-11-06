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
import { objectId, opt, version, embedRecordArray } from "./schema-helpers.js";

import { createDocumentSourceSchema } from "./document-source.schema.js";
import { createDeliveryDemandReopeningSchema } from "./delivery-demand-reopening.schema.js";
import { createDeliveryCommitmentTransferSchema } from "./delivery-commitment-transfer.schema.js";
import { createDocumentItemSchema } from "./document-item.schema.js";
import { createFailedDeliveryReceiptHeaderSchema } from "./failed-delivery-receipt-header.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: failed_delivery_receipts
export function createFailedDeliveryReceiptSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["GR_FAILED_DELIVERY"], {
        default: "GR_FAILED_DELIVERY",
      }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: {
        type: createFailedDeliveryReceiptHeaderSchema(),
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
    options("failed_delivery_receipts"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);

  embedRecordArray(
    schema,
    "delivery_demand_reopenings",
    "demandReopenings",
    createDeliveryDemandReopeningSchema(),
  );
  embedRecordArray(
    schema,
    "delivery_commitment_transfers",
    "commitmentTransfers",
    createDeliveryCommitmentTransferSchema(),
  );
  return schema;
}
