import { Schema, date, decimal, integer, options, ref, text } from './model-utils.js';

// Collection: conversions
export function createConversionSchema() {
  const schema = new Schema({
    productId: ref('Product'),
    productBatchId: ref('ProductBatch', false, { default: null }),
    uomId: ref('Uom'),
    basePerUnit: decimal({ positive: true, precision: 24, scale: 12 }),
    version: integer(1),
    validFrom: date(),
    verificationReference: text(500),
    createdBy: ref('User', false, { default: null }),
  }, options('conversions'));

  const scope = { productId: 1, productBatchId: 1, uomId: 1 };
  schema.index({ ...scope, validFrom: 1 }, { unique: true });
  schema.index({ ...scope, version: 1 }, { unique: true });
  return schema;
}
