import test from 'node:test';
import assert from 'node:assert/strict';
import { planConversionBackfill } from '../src/migrations/conversions.js';

test('backfill derives exact factors and separates ambiguous legacy scopes', () => {
  const products = [
    { _id: 'square', baseUnit: 'PIECE', wholeBaseUnits: true, lengthMm: '500', widthMm: '500' },
    { _id: 'repeating', baseUnit: 'PIECE', wholeBaseUnits: true, lengthMm: '600', widthMm: '600' },
  ];
  const uoms = [
    { _id: 'box', code: 'BOX', name: 'Thùng' },
    { _id: 'piece', code: 'PIECE', name: 'Viên' },
    { _id: 'area', code: 'M2', name: 'Mét vuông', areaMm2: '1000000' },
    { _id: 'other', code: 'PACK', name: 'Pack' },
  ];
  const batches = [
    { _id: 'a', productId: 'square', manufacturerLot: 'A', identificationStatus: 'VERIFIED', piecesPerCarton: 8 },
    { _id: 'b', productId: 'square', manufacturerLot: 'B', identificationStatus: 'VERIFIED', piecesPerCarton: 6 },
    { _id: 'synthetic', productId: 'square', manufacturerLot: 'QC-8V', identificationStatus: 'VERIFIED', piecesPerCarton: 8 },
  ];
  const completedAt = new Date('2020-01-01T00:00:00Z');
  const operation = (_id, unit, factor) => ({
    _id, subjectId: 'square', requestKey: `square:${unit}:${factor}:123`, completedAt,
  });
  const plan = planConversionBackfill({
    products, uoms, batches,
    operations: [operation('a', 'box', '4'), operation('b', 'box', '4.00'),
      operation('c', 'other', '5'), operation('d', 'other', '6'), operation('e', 'missing', '1')],
  });

  assert.deepEqual(plan.cartonUomIds, ['box']);
  assert.deepEqual(plan.candidates.map(row => [row.productBatchId, row.uomId, row.basePerUnit]), [
    ['a', 'box', '8'], ['b', 'box', '6'], [null, 'area', '4'], [null, 'area', '2.777777777778'], [null, 'box', '4'],
  ]);
  assert.deepEqual(plan.reports.map(report => report.reason), [
    'REVIEW_SYNTHETIC_LOT', 'UNRESOLVED_LEGACY_CONVERSION',
    'DUPLICATE_LEGACY_FACTOR', 'LEGACY_EFFECTIVE_DATE_FROM_OPERATION', 'AMBIGUOUS_LEGACY_FACTORS',
  ]);
});
