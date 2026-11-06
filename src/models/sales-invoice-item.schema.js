import {
  Schema,
  embeddedOptions,
  text,
  ref,
  decimal,
  date,
} from "./model-utils.js";
import { objectId } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createSalesInvoiceItemSchema() {
  const item = new Schema(
    {
      salesOrderItemId: { type: objectId, required: true },
      goodsIssueId: ref("SalesGoodsIssue"),
      goodsIssueItemId: { type: objectId, required: true },
      goodsIssueNo: text(50),
      issuedAt: date(),
      productId: ref("Product"),
      productNameSnapshot: text(200),
      issuedQtyBase: decimal({ positive: true }),
      billedQtyBase: decimal(),
      saleUnit: text(60),
      baseUnitsPerSaleUnit: decimal({
        positive: true,
        precision: 24,
        scale: 12,
      }),
      unitSellingPrice: decimal(),
      lineAmount: decimal({ scale: 0 }),
    },
    { ...embeddedOptions, _id: true },
  );
  return item;
}
