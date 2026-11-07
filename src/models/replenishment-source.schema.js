import { Schema, embeddedOptions, text, integer } from './model-utils.js';
import { objectId } from './schema-helpers.js';

// Native source identity. No document-line or policy collection is recreated.
export function createReplenishmentSourceSchema() {
  return new Schema({
    triggerType: { type: String, enum: ['MANUAL_OTHER','SALES_SHORTAGE','STOCK_THRESHOLD','STOCKTAKE_LOW_STOCK'], required: true },
    documentType: text(80, { required: false }),
    documentId: objectId,
    itemId: objectId,
    version: integer(1, { required: false }),
    salesOrderId: objectId,
    salesOrderItemId: objectId,
    salesOrderVersion: integer(1, { required: false }),
  }, embeddedOptions);
}
