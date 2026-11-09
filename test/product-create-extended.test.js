import test from 'node:test';
import assert from 'node:assert/strict';
import { createProductSchema } from '../src/modules/products/product.validation.js';

const id1 = '6724a1b2c3d4e5f6a7b8c9d0';
const id2 = '6724a1b2c3d4e5f6a7b8c9d1';
const id3 = '6724a1b2c3d4e5f6a7b8c9d2';

const validBase = () => ({
  sku: 'vgc-6060-01',
  name: 'Gạch Viglacera 60x60 Mây Trắng',
  manufacturerCode: 'VIGLACERA',
  categoryId: id1,
  baseUnit: 'VIEN',
  wholeBaseUnits: true,
  lengthMm: '600',
  widthMm: '600',
  heightMm: '9.5',
  color: 'Trắng vân mây',
});

test('createProductSchema validates standard payload without conversions or stockThresholds', () => {
  const parsed = createProductSchema.parse({ body: validBase(), query: {}, params: {} });
  assert.equal(parsed.body.sku, 'VGC-6060-01'); // normalized to uppercase
  assert.deepEqual(parsed.body.conversions, []);
  assert.deepEqual(parsed.body.stockThresholds, []);
  assert.equal(parsed.body.wholeBaseUnits, true);
});

test('createProductSchema accepts valid conversions and stockThresholds', () => {
  const input = {
    ...validBase(),
    conversions: [
      {
        uomId: id2,
        basePerUnit: '4',
        validFrom: '2026-11-09T00:00:00.000Z',
        verificationReference: 'Quy cách đóng gói (4 viên/hộp)',
      },
      {
        uomId: id3,
        basePerUnit: '24',
        verificationReference: 'Thùng 6 hộp = 24 viên',
      },
    ],
    stockThresholds: [
      {
        warehouseId: id1,
        minimumQty: '50',
        targetQty: '200',
      },
      {
        warehouseId: id2,
        minimumQty: '10',
      },
    ],
  };

  const parsed = createProductSchema.parse({ body: input, query: {}, params: {} });
  assert.equal(parsed.body.conversions.length, 2);
  assert.equal(parsed.body.conversions[0].basePerUnit, '4');
  assert.equal(parsed.body.stockThresholds.length, 2);
  assert.equal(parsed.body.stockThresholds[0].minimumQty, '50');
  assert.equal(parsed.body.stockThresholds[0].targetQty, '200');
  assert.equal(parsed.body.stockThresholds[1].minimumQty, '10');
});

test('createProductSchema rejects duplicate uomId in conversions', () => {
  const input = {
    ...validBase(),
    conversions: [
      { uomId: id2, basePerUnit: '4' },
      { uomId: id2, basePerUnit: '8' },
    ],
  };
  const result = createProductSchema.safeParse({ body: input, query: {}, params: {} });
  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /Đơn vị quy đổi không được trùng lặp/);
});

test('createProductSchema rejects duplicate warehouseId in stockThresholds', () => {
  const input = {
    ...validBase(),
    stockThresholds: [
      { warehouseId: id1, minimumQty: '10' },
      { warehouseId: id1, minimumQty: '20' },
    ],
  };
  const result = createProductSchema.safeParse({ body: input, query: {}, params: {} });
  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /Kho cấu hình định mức tồn không được trùng lặp/);
});

test('createProductSchema rejects targetQty < minimumQty in stockThresholds', () => {
  const input = {
    ...validBase(),
    stockThresholds: [
      { warehouseId: id1, minimumQty: '100', targetQty: '50' },
    ],
  };
  const result = createProductSchema.safeParse({ body: input, query: {}, params: {} });
  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /targetQty.*lớn hơn hoặc bằng.*minimumQty/);
});

test('createProductSchema rejects basePerUnit <= 0 in conversions', () => {
  for (const invalidFactor of ['0', '-1', '-4.5']) {
    const input = {
      ...validBase(),
      conversions: [{ uomId: id2, basePerUnit: invalidFactor }],
    };
    const result = createProductSchema.safeParse({ body: input, query: {}, params: {} });
    assert.equal(result.success, false, `Expected failure for basePerUnit=${invalidFactor}`);
  }
});

test('createProductSchema rejects unexpected fields due to strict mode', () => {
  const input = {
    ...validBase(),
    initialStock: '100', // đã bỏ theo yêu cầu
  };
  const result = createProductSchema.safeParse({ body: input, query: {}, params: {} });
  assert.equal(result.success, false);
});
