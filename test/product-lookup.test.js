import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../src/models/runtime.js';
import { findProductBySku, pickProduct, preloadProductsBySkus } from '../src/shared/utils/product-lookup.js';

afterEach(() => mock.restoreAll());
const red = { sku: 'G60', manufacturerCode: 'Viglacera', color: 'Đỏ' };
const blue = { sku: 'G60', manufacturerCode: 'Viglacera', color: 'Xanh' };
const other = { sku: 'G60', manufacturerCode: 'Prime', color: 'Đỏ' };

test('pickProduct finds the one product of a SKU, requiring manufacturer/colour only when the SKU is shared', () => {
  assert.match(pickProduct([], {}).error.message, /SKU chưa có trong danh mục/);
  assert.equal(pickProduct([red], {}).product, red);
  assert.equal(pickProduct([red], { color: ' đỏ ' }).product, red);
  assert.equal(pickProduct([red], { color: 'Xanh' }).error.field, 'sku');
  const shared = pickProduct([red, blue, other], {});
  assert.equal(shared.error.field, 'sku');
  assert.match(shared.error.message, /SKU này có 3 sản phẩm \(hãng\/màu: Viglacera\/Đỏ, Viglacera\/Xanh, Prime\/Đỏ\), hãy điền Hãng và Màu/);
  // Only one of manufacturer/colour may still be ambiguous.
  assert.match(pickProduct([red, blue, other], { color: 'Đỏ' }).error.message, /SKU này có 2 sản phẩm/);
  assert.match(pickProduct([red, blue, other], { manufacturerCode: 'viglacera' }).error.message, /SKU này có 2 sản phẩm/);
  assert.equal(pickProduct([red, blue, other], { manufacturerCode: 'PRIME' }).product, other);
  assert.equal(pickProduct([red, blue, other], { manufacturerCode: 'Viglacera', color: 'Xanh' }).product, blue);
});

test('NFD text from macOS/Excel matches NFC catalogue text', () => {
  assert.equal(pickProduct([red, blue], { color: 'Đỏ'.normalize('NFD') }).product, red);
});

test('preloadProductsBySkus loads all SKUs in one query and caches misses', async () => {
  const calls = [];
  mock.method(m.Product, 'find', filter => {
    calls.push(filter);
    return { collation: () => ({ session: async () => [red, blue].filter(p => filter.sku.$in.includes(p.sku)) }) };
  });
  const cache = await preloadProductsBySkus([' g60 ', 'G60', 'NONE', ''], null);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].sku.$in.sort(), ['G60', 'NONE']);
  assert.deepEqual(cache.get('G60'), [red, blue]);
  assert.deepEqual(cache.get('NONE'), []);
  assert.equal((await findProductBySku('g60', null, 'XANH', null, cache)).product, blue);
  assert.match((await findProductBySku('none', null, null, null, cache)).error.message, /chưa có/);
  assert.equal(calls.length, 1);
});
