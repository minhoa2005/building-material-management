import { BusinessDocument, DocumentLine, LINE_KINDS } from '../legacy/index.js';
import { ReplenishmentSubmission } from '../legacy/replenishment-submission.model.js';
import { Schema, code, date, decimal, embeddedOptions, exact, integer, options, ref, rules, text } from '../model-utils.js';
import { packaging } from './catalogue.js';

const id = Schema.Types.ObjectId;
const link = new Schema({
  documentId: { type: id, required: true }, subjectCollection: text(80), relationCode: text(40),
  handoverId: id, createdAt: Date, updatedAt: Date,
  itemId: id, linkedQty: decimal({ positive: true, required: false }),
}, { ...embeddedOptions, _id: true });

function itemSchema() {
  const schema = new Schema({
    lineNo: integer(1), lineKind: code(LINE_KINDS), productId: ref('Product'), lotId: ref('Lot', false),
    enteredUnit: text(60), baseUnitSnapshot: text(60),
    baseUnitsPerUnit: decimal({ positive: true, precision: 24, scale: 12 }), packagingSnapshot: packaging,
    enteredQty: decimal({ positive: true }), qtyBase: decimal({ positive: true }),
    productNameSnapshot: text(200), sources: { type: [link], default: undefined },
    createdAt: Date, updatedAt: Date,
  }, { discriminatorKey: 'lineKind', strict: 'throw', versionKey: false });
  rules(schema, function () {
    if (this.enteredQty && this.baseUnitsPerUnit && this.qtyBase &&
        !exact(this.enteredQty).mul(exact(this.baseUnitsPerUnit)).eq(String(this.qtyBase))) {
      this.invalidate('qtyBase', 'Quantity must equal the historical conversion without rounding');
    }
  });
  return schema;
}

function attachItems(parent, kind) {
  const item = itemSchema();
  if (kind === 'PO') item.add({ unitPurchasePrice: decimal(), lineAmount: decimal() });
  if (kind === 'SALES_ORDER') item.add({ unitSellingPrice: decimal(), lineAmount: decimal() });
  parent.add({ items: { type: [item], default: [] } });
  for (const [name, discriminator] of Object.entries(DocumentLine.discriminators)) {
    const details = discriminator.schema.path('details')?.schema;
    if (details) parent.path('items').discriminator(name, new Schema({ details: { type: details.clone(), required: true } }, embeddedOptions),
      { value: discriminator.schema.discriminatorMapping.value });
  }
}

export function workflowSchema(kind, collection) {
  const original = BusinessDocument.discriminators['BusinessDocument_' + kind].schema;
  const fields = {
    documentNo: text(50, { unique: true }), documentKind: code([kind], { default: kind }),
    workflowStatus: text(40), version: integer(1), createdBy: ref('User'), occurredAt: Date,
    note: text(2000, { required: false }), externalReferenceIds: [id],
    sources: { type: [link], default: undefined },
  };
  const header = original.path('header')?.schema;
  if (header) {
    const headerSchema = header.clone();
    if (kind === 'HANDOVER') headerSchema.remove('carrierId');
    fields.header = { type: headerSchema, required: true };
  }
  const schema = new Schema(fields, options(collection));
  attachItems(schema, kind);
  schema.index({ 'items._id': 1 });
  schema.index({ 'sources.documentId': 1 });
  schema.index({ 'items.sources.itemId': 1 });
  schema.index({ workflowStatus: 1, createdAt: -1 });
  rules(schema, function () {
    if (new Set(this.items.map(row => String(row._id))).size !== this.items.length ||
        new Set(this.items.map(row => row.lineNo)).size !== this.items.length) {
      this.invalidate('items', 'Duplicate item ID or line number');
    }
  });
  if (kind === 'PO') {
    schema.add({ replenishmentRequestId: { type: id, required: true }, totalAmount: decimal(), currency: text(3) });
    schema.index({ replenishmentRequestId: 1 }, { unique: true, partialFilterExpression: { replenishmentRequestId: { $type: 'objectId' } } });
  }
  if (kind === 'SALES_ORDER') {
    schema.add({ orderAmount: decimal(), currencyCode: text(3) });
    schema.index({ 'header.externalReferenceId': 1 }, { unique: true });
  }
  if (kind === 'REPLENISHMENT') {
    const submission = ReplenishmentSubmission.schema.clone();
    submission.clearIndexes();
    submission.remove('documentId');
    const row = submission.path('lines').schema;
    for (const field of ['enteredUomId', 'baseUomId', 'conversionId']) row.remove(field);
    row.add({ baseUnitSnapshot: text(60), enteredUnit: text(60), baseUnitsPerUnit: decimal({ positive: true, precision: 24, scale: 12 }) });
    schema.add({ submissions: { type: [submission], default: undefined } });
  }
  if (['TRANSFER_DISPATCH','GI_SALE'].includes(kind)) {
    const handover = workflowSchema('HANDOVER', 'embedded_handover');
    handover.clearIndexes();
    handover.path('documentNo').options.unique = false;
    schema.add({ handovers: { type: [handover], default: undefined, excludeIndexes: true } });
  }
  return schema;
}

export function invoiceSchema() {
  const item = new Schema({
    salesOrderItemId: { type: id, required: true }, goodsIssueId: ref('SalesGoodsIssue'),
    goodsIssueItemId: { type: id, required: true }, goodsIssueNo: text(50), issuedAt: date(),
    productId: ref('Product'), productNameSnapshot: text(200), issuedQtyBase: decimal({ positive: true }),
    billedQtyBase: decimal(), saleUnit: text(60), baseUnitsPerSaleUnit: decimal({ positive: true, precision: 24, scale: 12 }),
    unitSellingPrice: decimal(), lineAmount: decimal({ scale: 0 }),
  }, { ...embeddedOptions, _id: true });
  const invoice = new Schema({
    invoiceNo: text(50, { unique: true }), salesOrderId: ref('SalesOrder'), customerId: ref('Customer'),
    customerSnapshot: { name: text(200), phone: text(30) }, currencyCode: code(['VND']), items: [item],
    totalAmount: decimal({ scale: 0 }), status: code(['DRAFT','ISSUED']),
    createdBy: ref('User'), issuedBy: ref('User', false), issuedAt: Date, version: integer(1),
  }, options('sales_invoices'));
  invoice.index({ salesOrderId: 1 }, { unique: true, partialFilterExpression: { status: 'ISSUED' } });
  rules(invoice, function () {
    let total = exact(0);
    const seen = new Set();
    for (const line of this.items) {
      if (!line.billedQtyBase || !line.issuedQtyBase || !line.baseUnitsPerSaleUnit || !line.unitSellingPrice || !line.lineAmount) continue;
      const billed = exact(line.billedQtyBase);
      const amount = billed.div(String(line.baseUnitsPerSaleUnit)).mul(String(line.unitSellingPrice)).toDecimalPlaces(0);
      if (seen.has(String(line.goodsIssueItemId)) || billed.gt(String(line.issuedQtyBase)) || !amount.eq(String(line.lineAmount))) {
        this.invalidate('items', 'Invalid invoiced quantity, amount or duplicate goods issue item');
      }
      seen.add(String(line.goodsIssueItemId));
      total = total.plus(amount);
    }
    if (this.totalAmount && !total.eq(String(this.totalAmount))) this.invalidate('totalAmount', 'Invoice total must match line amounts');
    if (this.status === 'ISSUED' && (!this.issuedAt || !this.issuedBy || !this.items.some(line => line.billedQtyBase && exact(line.billedQtyBase).gt(0)))) {
      this.invalidate('status', 'Issued invoice requires issuer, issue date and an accepted quantity');
    }
  });
  return invoice;
}
