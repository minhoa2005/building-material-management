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

import { createDocumentSourceSchema } from "./document-source.schema.js";
import { createDocumentItemSchema } from "./document-item.schema.js";
import { createHandoverSchema } from "./handover.schema.js";
import { createSalesGoodsIssueHeaderSchema } from "./sales-goods-issue-header.schema.js";
import { createSalesGoodsIssueSalePriceSnapshotSchema } from "./sales-goods-issue-sale-price-snapshot.schema.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "./document-helpers.js";

// Collection: sales_goods_issues
export function createSalesGoodsIssueSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["GI_SALE"], { default: "GI_SALE" }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: { type: createSalesGoodsIssueHeaderSchema(), required: true },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
      stockTransactionId: ref("StockTransaction", false),
      postedBy: ref("User", false),
      postedAt: date(false),
    },
    options("sales_goods_issues"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  item.add({
    salesOrderItemId: id(false),
    salePriceSnapshot: createSalesGoodsIssueSalePriceSnapshotSchema(),
  });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);
  const handover = createHandoverSchema();
  handover.clearIndexes();
  handover.path("documentNo").options.unique = false;
  schema.add({
    handovers: { type: [handover], default: undefined, excludeIndexes: true },
  });

  return schema;
}
