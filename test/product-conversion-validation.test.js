import test from 'node:test';
import assert from 'node:assert/strict';
import { createConversionSchema } from '../src/modules/products/product.validation.js';

const idProduct = '6724a1b2c3d4e5f6a7b8c9d0';
const idUom = '6724a1b2c3d4e5f6a7b8c9d1';

const validBase = () => ({
  uomId: idUom,
  basePerUnit: '4',
  validFrom: '2026-11-10T00:00:00.000Z',
});

test('createConversionSchema accepts payload WITHOUT verificationReference', () => {
  const result = createConversionSchema.safeParse({
    body: validBase(),
    query: {},
    params: { id: idProduct },
  });
  assert.equal(result.success, true);
  assert.equal(result.data.body.verificationReference, undefined);
});

test('createConversionSchema accepts empty string and transforms to undefined', () => {
  const result = createConversionSchema.safeParse({
    body: { ...validBase(), verificationReference: '' },
    query: {},
    params: { id: idProduct },
  });
  assert.equal(result.success, true);
  assert.equal(result.data.body.verificationReference, undefined);
});

test('createConversionSchema accepts whitespace-only string and transforms to undefined', () => {
  const result = createConversionSchema.safeParse({
    body: { ...validBase(), verificationReference: '   ' },
    query: {},
    params: { id: idProduct },
  });
  assert.equal(result.success, true);
  assert.equal(result.data.body.verificationReference, undefined);
});

test('createConversionSchema accepts null and transforms to undefined', () => {
  const result = createConversionSchema.safeParse({
    body: { ...validBase(), verificationReference: null },
    query: {},
    params: { id: idProduct },
  });
  assert.equal(result.success, true);
  assert.equal(result.data.body.verificationReference, undefined);
});

test('createConversionSchema accepts valid custom verificationReference and trims it', () => {
  const custom = '  Công văn số 123/2026/CV-VGC  ';
  const result = createConversionSchema.safeParse({
    body: { ...validBase(), verificationReference: custom },
    query: {},
    params: { id: idProduct },
  });
  assert.equal(result.success, true);
  assert.equal(result.data.body.verificationReference, 'Công văn số 123/2026/CV-VGC');
});

test('createConversionSchema rejects verificationReference exceeding 500 characters', () => {
  const tooLong = 'A'.repeat(501);
  const result = createConversionSchema.safeParse({
    body: { ...validBase(), verificationReference: tooLong },
    query: {},
    params: { id: idProduct },
  });
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].code, 'too_big');
});

test('createConversionSchema rejects basePerUnit <= 0', () => {
  for (const factor of ['0', '-1', '-5']) {
    const result = createConversionSchema.safeParse({
      body: { ...validBase(), basePerUnit: factor },
      query: {},
      params: { id: idProduct },
    });
    assert.equal(result.success, false, `Expected failure for basePerUnit=${factor}`);
  }
});
