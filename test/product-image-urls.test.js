import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createProductSchema as createProductModelSchema } from '../src/models/product.model.js';
import { createProductSchema, updateProductSchema } from '../src/modules/products/product.validation.js';

const categoryId = '6724a1b2c3d4e5f6a7b8c9d0';
const validProduct = () => ({
  sku: 'TILE-001',
  name: 'Test tile',
  manufacturerCode: 'TEST',
  categoryId,
  baseUnit: 'PIECE',
  wholeBaseUnits: true,
  lengthMm: '600',
  widthMm: '600',
  heightMm: '10',
  color: 'White',
});
const parseCreate = body => createProductSchema.parse({ body, query: {}, params: {} }).body;
const parseUpdate = body => updateProductSchema.parse({ body, query: {}, params: { id: categoryId } }).body;

test('Product imageUrls defaults to an empty array in the model', () => {
  const model = mongoose.model('ProductImageUrlsContractTest', createProductModelSchema());
  assert.equal(model.schema.path('imageUrls').instance, 'Array');
  assert.deepEqual(new model({}).imageUrls, []);
});

test('createProductSchema accepts ordered HTTPS URLs and trims surrounding whitespace', () => {
  const imageUrls = [' https://images.example.com/front.webp ', 'https://images.example.com/texture.webp'];
  assert.deepEqual(parseCreate({ ...validProduct(), imageUrls }).imageUrls, [
    'https://images.example.com/front.webp',
    'https://images.example.com/texture.webp',
  ]);
});

test('createProductSchema keeps imageUrls optional for existing clients', () => {
  assert.equal(parseCreate(validProduct()).imageUrls, undefined);
});

test('createProductSchema rejects invalid, non-HTTPS, credentialed and empty image URLs', () => {
  for (const imageUrl of [
    'not a URL',
    'http://images.example.com/front.webp',
    'https://user:secret@images.example.com/front.webp',
    '',
    null,
  ]) {
    assert.equal(
      createProductSchema.safeParse({
        body: { ...validProduct(), imageUrls: [imageUrl] },
        query: {},
        params: {},
      }).success,
      false,
      `Expected rejection for ${String(imageUrl)}`,
    );
  }
  assert.equal(createProductSchema.safeParse({
    body: { ...validProduct(), imageUrls: null }, query: {}, params: {},
  }).success, false);
});

test('createProductSchema limits image URL count and length and rejects duplicates after trimming', () => {
  const prefix = 'https://images.example.com/';
  const maxLengthUrl = prefix + 'a'.repeat(2048 - prefix.length);
  assert.equal(maxLengthUrl.length, 2048);
  assert.equal(parseCreate({ ...validProduct(), imageUrls: [maxLengthUrl] }).imageUrls[0].length, 2048);

  for (const imageUrls of [
    [prefix + 'a'.repeat(2048 - prefix.length + 1)],
    Array.from({ length: 6 }, (_, index) => `${prefix}${index}`),
    [`${prefix}front.webp`, ` ${prefix}front.webp `],
  ]) {
    assert.equal(createProductSchema.safeParse({
      body: { ...validProduct(), imageUrls }, query: {}, params: {},
    }).success, false);
  }
});

test('updateProductSchema distinguishes omitted imageUrls from an explicit empty array', () => {
  const { sku: _sku, ...productFields } = validProduct();
  const fields = {
    ...productFields,
    expectedUpdatedAt: '2026-11-09T00:00:00.000Z',
  };
  assert.equal(parseUpdate(fields).imageUrls, undefined);
  assert.deepEqual(parseUpdate({ ...fields, imageUrls: [] }).imageUrls, []);
});
