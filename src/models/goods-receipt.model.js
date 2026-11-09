import { Schema, options, text, ref, refs, code, integer, date, rules } from './model-utils.js';
import { QUALITY_CODES } from './constants.js';
import { objectId, id, opt, embedRecordArray } from './schema-helpers.js';
import { createSourceReferenceSchema } from './source-reference.schema.js';
import { createDocumentSourceSchema } from './document-source.schema.js';
import { createDocumentItemSchema } from './document-item.schema.js';
import { createPurchaseReceiptHeaderSchema } from './purchase-receipt-header.schema.js';
import { createCustomerReturnReceiptHeaderSchema } from './customer-return-receipt-header.schema.js';
import { createFailedDeliveryReceiptHeaderSchema } from './failed-delivery-receipt-header.schema.js';
import { createTransferReceiptHeaderSchema } from './transfer-receipt-header.schema.js';
import { createDeliveryDemandReopeningSchema } from './delivery-demand-reopening.schema.js';
import { createDeliveryCommitmentTransferSchema } from './delivery-commitment-transfer.schema.js';
import { attachDocumentItems, addDocumentIndexesAndRules } from './document-helpers.js';

export const GOODS_RECEIPT_KINDS = Object.freeze(['PURCHASE', 'CUSTOMER_RETURN', 'FAILED_DELIVERY', 'TRANSFER', 'OTHER']);

// All receipt variants share document and line IDs, quantity precision, source links,
// packaging snapshots, evidence and posting history in a single collection.
// Collection: goods_receipts
export function createGoodsReceiptSchema() {
  const schema = new Schema({
    documentNo: text(50),
    documentKind: code(GOODS_RECEIPT_KINDS),
    workflowStatus: text(40),
    version: integer(1),
    createdBy: ref('User'),
    occurredAt: Date,
    note: text(2000, { required: false }),
    externalReferenceIds: [objectId],
    sources: { type: [createDocumentSourceSchema()], default: undefined },
    updatedBy: ref('User', false),
    evidenceIds: refs('Attachment'),
    cancelledBy: ref('User', false),
    cancelledAt: date(false),
    cancelReason: opt(2000),
    stockTransactionId: ref('StockTransaction', false),
    postedBy: ref('User', false),
    postedAt: date(false),
    custodyDecisionId: ref('ApprovalHistory', false),
  }, options('goods_receipts', { discriminatorKey: 'documentKind' }));
  const item = createDocumentItemSchema();
  item.add({
    note: opt(2000), evidenceIds: refs('Attachment'),
    purchaseOrderItemId: id(false), arrivalItemId: id(false),
    // Return inspection is embedded; an ObjectId retains its original identity.
    inspectionId: id(false), inspectionResultId: id(false),
    destinationLocationId: ref('WarehouseLocation', false),
    custodyReceiptRef: createSourceReferenceSchema(),
    custodyBalanceId: ref('InventoryBalance', false), supplierScheduleId: id(false),
    qualityCode: code(QUALITY_CODES, { required: false }),
  });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);
  schema.index({ documentKind: 1, documentNo: 1 }, { unique: true });
  schema.index({ documentKind: 1, 'header.warehouseId': 1, createdAt: -1 });
  schema.index({ 'demandReopenings._id': 1 }, { unique: true, sparse: true });
  schema.index({ 'commitmentTransfers._id': 1 }, { unique: true, sparse: true });
  rules(schema, function () {
    const expected = { PURCHASE: 'STANDARD', CUSTOMER_RETURN: 'STANDARD', FAILED_DELIVERY: 'FAILED_DELIVERY_RECEIPT', TRANSFER: 'TRANSFER_RECEIPT', OTHER: 'STANDARD' }[this.documentKind];
    if (expected && this.items.some(row => row.lineKind !== expected)) this.invalidate('items', 'Line kind does not match receipt kind');
    const purchaseOnly = ['purchaseOrderItemId', 'arrivalItemId', 'inspectionResultId', 'custodyReceiptRef', 'supplierScheduleId'];
    for (const item of this.items) {
      if (this.documentKind !== 'PURCHASE' && purchaseOnly.some(field => item[field] != null)) this.invalidate('items', 'Purchase line fields belong only to purchase receipts');
      if (!['PURCHASE', 'CUSTOMER_RETURN'].includes(this.documentKind) && (item.inspectionId != null || item.custodyBalanceId != null)) this.invalidate('items', 'Inspection and custody fields do not match receipt kind');
      if (!['PURCHASE', 'OTHER'].includes(this.documentKind) && item.destinationLocationId != null) this.invalidate('items', 'Destination field does not match receipt kind');
      if (this.documentKind !== 'OTHER' && item.qualityCode != null) this.invalidate('items', 'Manual quality belongs only to OTHER');
      if (this.documentKind === 'OTHER' && (!item.lotId || !item.destinationLocationId || !item.qualityCode)) this.invalidate('items', 'OTHER requires lot, destination and quality');
    }
    if (this.documentKind !== 'FAILED_DELIVERY' && (this.demandReopenings?.length || this.commitmentTransfers?.length)) this.invalidate('documentKind', 'Failed delivery records belong only to failed delivery receipts');
    if (this.documentKind !== 'PURCHASE' && this.custodyDecisionId) this.invalidate('custodyDecisionId', 'Custody decision belongs only to purchase receipts');
  });
  return schema;
}

const variant = header => new Schema({ header: { type: header, required: true } }, { _id: false, strict: 'throw' });

export function createGoodsReceiptVariants() {
  const failed = variant(createFailedDeliveryReceiptHeaderSchema());
  embedRecordArray(failed, 'delivery_demand_reopenings', 'demandReopenings', createDeliveryDemandReopeningSchema());
  embedRecordArray(failed, 'delivery_commitment_transfers', 'commitmentTransfers', createDeliveryCommitmentTransferSchema());
  // One physical collection: indexes are declared on the base schema above.
  failed.clearIndexes();
  const otherHeader = new Schema({
    warehouseId: ref('Warehouse'),
    reason: text(2000),
    originalReceiptId: ref('GoodsReceipt', false),
  }, { _id: false, strict: 'throw' });
  return [
    ['PurchaseReceipt', 'PURCHASE', variant(createPurchaseReceiptHeaderSchema())],
    ['CustomerReturnReceipt', 'CUSTOMER_RETURN', variant(createCustomerReturnReceiptHeaderSchema())],
    ['FailedDeliveryReceipt', 'FAILED_DELIVERY', failed],
    ['TransferReceipt', 'TRANSFER', variant(createTransferReceiptHeaderSchema())],
    ['OtherGoodsReceipt', 'OTHER', new Schema({
      header: { type: otherHeader, required: true },
      approvedStockHash: opt(64), approvedVersion: integer(1, { required: false }),
      approvalDecisionId: ref('ApprovalHistory', false),
    }, { _id: false, strict: 'throw' })],
  ];
}
