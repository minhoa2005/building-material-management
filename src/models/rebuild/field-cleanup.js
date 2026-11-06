import { decimal, integer } from '../model-utils.js';
// Only proven duplicates or catalogue counters with no historical consumers.
export const catalogueWithoutVersion = ['products','warehouses','customers','suppliers'];
export function simplifySchemaEntries(entries) {
  for (const {collection,schema} of entries) {
    if (schema.path('documentKind')) schema.remove('revision');
    if (catalogueWithoutVersion.includes(collection)) schema.remove('version');
    if (collection === 'stock_thresholds') { schema.remove('version'); schema.remove('productId'); }
    if (collection === 'external_reference_lines') schema.remove('referenceId');
    if (collection === 'product_batches') {
      schema.remove('calibre');
      schema.remove('tone');
      schema.clearIndexes();
      schema.add({ piecesPerCarton: integer(1), cartonLengthMm: decimal({ positive:true, scale:3 }),
        cartonWidthMm: decimal({ positive:true, scale:3 }), cartonHeightMm: decimal({ positive:true, scale:3 }) });
      schema.index({productId:1,manufacturerLot:1},{unique:true});
    }
  }
}
export function simplifyData(data) {
  function visit(value) {
    if (!value || typeof value !== 'object' || value._bsontype || value instanceof Date) return;
    if (value.documentKind) {
      if (value.revision != null && Number(value.revision) !== Number(value.version)) {
        throw new Error('Divergent document version/revision requires explicit reconciliation: '+value._id);
      }
      delete value.revision;
    }
    for (const child of Object.values(value)) if (Array.isArray(child)) child.forEach(visit); else visit(child);
  }
  for (const rows of Object.values(data)) rows.forEach(visit);
  for (const name of catalogueWithoutVersion) for (const row of data[name]) delete row.version;
  for (const product of data.products) for (const row of product.stockThresholds || []) { delete row.version; delete row.productId; }
  for (const source of data.external_references) for (const row of source.items || []) delete row.referenceId;
  for (const balance of data.inventory_balances) for (const row of balance.packagingPortions || []) { delete row.version; delete row.balanceId; }
  for (const batch of data.product_batches) { delete batch.calibre; delete batch.tone; }
  return data;
}
