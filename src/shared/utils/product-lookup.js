import { Product } from '../../models/runtime.js';
import { normalizeCode } from './domain.js';

const collation = { locale: 'vi', strength: 2 };

// In-memory equivalent of the products' vi/strength-2 collation, also folding NFD text from macOS/Excel.
export const fold = value => String(value ?? '').trim().normalize('NFC').toLowerCase();

const label = product => `${product.manufacturerCode}/${product.color}`;

/**
 * Picks the one product for a row among the candidates sharing its SKU.
 * Manufacturer and colour are optional while the SKU has a single product.
 * Returns { product } or { error: { field: 'sku', message } }; a candidate may carry extra flags.
 */
export function pickProduct(candidates, { manufacturerCode, color }) {
  const matches = candidates.filter(product =>
    (!manufacturerCode || fold(product.manufacturerCode) === fold(manufacturerCode)) &&
    (!color || fold(product.color) === fold(color)));
  if (matches.length === 1) return { product: matches[0] };
  if (!candidates.length) return { error: { field: 'sku', message: 'SKU chưa có trong danh mục' } };
  if (!matches.length) {
    return { error: { field: 'sku', message: `Không có sản phẩm khớp hãng/màu đã điền (SKU này có: ${candidates.map(label).join(', ')})` } };
  }
  return { error: { field: 'sku', message: `SKU này có ${matches.length} sản phẩm (hãng/màu: ${matches.map(label).join(', ')}), hãy điền Hãng và Màu` } };
}

// Loads every product of the given SKUs in one query (the products index leads with manufacturerCode).
export async function preloadProductsBySkus(skus, session, cache = new Map()) {
  const missing = [...new Set(skus.filter(Boolean).map(normalizeCode))].filter(sku => !cache.has(sku));
  if (!missing.length) return cache;
  for (const sku of missing) cache.set(sku, []);
  const rows = await Product.find({ sku: { $in: missing } }).collation(collation).session(session ?? null);
  for (const row of rows) {
    const sku = normalizeCode(row.sku);
    if (!cache.has(sku)) cache.set(sku, []);
    cache.get(sku).push(row);
  }
  return cache;
}

export async function findProductBySku(sku, manufacturerCode, color, session, cache = new Map()) {
  await preloadProductsBySkus([sku], session, cache);
  return pickProduct(cache.get(normalizeCode(sku)) ?? [], { manufacturerCode, color });
}
