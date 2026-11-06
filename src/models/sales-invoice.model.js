import {
  Schema,
  options,
  text,
  ref,
  code,
  integer,
  decimal,
  date,
  rules,
  exact,
} from "./model-utils.js";
import { version, quantity } from "./schema-helpers.js";

import { createSalesInvoiceItemSchema } from "./sales-invoice-item.schema.js";

// Collection: sales_invoices
export function createSalesInvoiceSchema() {
  const invoice = new Schema(
    {
      invoiceNo: text(50, { unique: true }),
      salesOrderId: ref("SalesOrder"),
      customerId: ref("Customer"),
      customerSnapshot: { name: text(200), phone: text(30) },
      currencyCode: code(["VND"]),
      items: [createSalesInvoiceItemSchema()],
      totalAmount: decimal({ scale: 0 }),
      status: code(["DRAFT", "ISSUED"]),
      createdBy: ref("User"),
      issuedBy: ref("User", false),
      issuedAt: Date,
      version: integer(1),
    },
    options("sales_invoices"),
  );
  invoice.index(
    { salesOrderId: 1 },
    { unique: true, partialFilterExpression: { status: "ISSUED" } },
  );
  rules(invoice, function () {
    let total = exact(0);
    const seen = new Set();
    for (const line of this.items) {
      if (
        !line.billedQtyBase ||
        !line.issuedQtyBase ||
        !line.baseUnitsPerSaleUnit ||
        !line.unitSellingPrice ||
        !line.lineAmount
      )
        continue;
      const billed = exact(line.billedQtyBase);
      const amount = billed
        .div(String(line.baseUnitsPerSaleUnit))
        .mul(String(line.unitSellingPrice))
        .toDecimalPlaces(0);
      if (
        seen.has(String(line.goodsIssueItemId)) ||
        billed.gt(String(line.issuedQtyBase)) ||
        !amount.eq(String(line.lineAmount))
      ) {
        this.invalidate(
          "items",
          "Invalid invoiced quantity, amount or duplicate goods issue item",
        );
      }
      seen.add(String(line.goodsIssueItemId));
      total = total.plus(amount);
    }
    if (this.totalAmount && !total.eq(String(this.totalAmount)))
      this.invalidate("totalAmount", "Invoice total must match line amounts");
    if (
      this.status === "ISSUED" &&
      (!this.issuedAt ||
        !this.issuedBy ||
        !this.items.some(
          (line) => line.billedQtyBase && exact(line.billedQtyBase).gt(0),
        ))
    ) {
      this.invalidate(
        "status",
        "Issued invoice requires issuer, issue date and an accepted quantity",
      );
    }
  });
  return invoice;
}
