import test from 'node:test';
import assert from 'node:assert/strict';
import { stocktakeListQuery, buildStocktakeListFilter } from '../src/modules/stocktake-closure/stocktake-list.query.js';

const A = 'a'.repeat(24), B = 'b'.repeat(24), LOC = 'c'.repeat(24);
const user = (code, warehouseIds = []) => ({ isActive: true, warehouseIds, roleId: { code, isActive: true, permissionIds: [] } });
const parse = q => stocktakeListQuery.safeParse(q);

test('stocktake list scope: owner is unrestricted, staff limited to assigned warehouses', () => {
  assert.deepEqual(buildStocktakeListFilter(user('OWNER'), {}), {});
  assert.deepEqual(buildStocktakeListFilter(user('WAREHOUSE', [A]), {}), { 'header.warehouseId': { $in: [A] } });
});

test('stocktake list refuses a warehouse filter outside staff access', () => {
  assert.throws(() => buildStocktakeListFilter(user('WAREHOUSE', [A]), { warehouseId: B }));
  assert.equal(buildStocktakeListFilter(user('WAREHOUSE', [A]), { warehouseId: A })['header.warehouseId'], A);
  assert.equal(buildStocktakeListFilter(user('OWNER'), { warehouseId: B })['header.warehouseId'], B);
});

test('stocktake list combines status, scope location, cutoff window and literal text', () => {
  const filter = buildStocktakeListFilter(user('OWNER'), {
    status: 'COUNTING', locationId: LOC, q: 'ST[1].*', from: '2026-11-01T00:00:00Z', to: '2026-11-02T00:00:00Z',
  });
  assert.equal(filter.workflowStatus, 'COUNTING');
  assert.equal(filter['header.scopeLocationIds'], LOC);
  assert.deepEqual(filter['header.cutoffAt'], { $gte: new Date('2026-11-01T00:00:00Z'), $lte: new Date('2026-11-02T00:00:00Z') });
  assert.equal(filter.documentNo.$regex, 'ST\\[1\\]\\.\\*');
  assert.equal(filter.documentNo.$options, 'i');
});

test('stocktake list supports open-ended cutoff windows and omits the cutoff filter when unset', () => {
  assert.deepEqual(buildStocktakeListFilter(user('OWNER'), { from: '2026-11-01T00:00:00Z' })['header.cutoffAt'], { $gte: new Date('2026-11-01T00:00:00Z') });
  assert.deepEqual(buildStocktakeListFilter(user('OWNER'), { to: '2026-11-01T00:00:00Z' })['header.cutoffAt'], { $lte: new Date('2026-11-01T00:00:00Z') });
  assert.equal('header.cutoffAt' in buildStocktakeListFilter(user('OWNER'), {}), false);
});

test('stocktake list query validation rejects bad input and unknown keys', () => {
  assert.equal(parse({}).success, true);
  assert.deepEqual(parse({ page: '2', limit: '50', locationId: LOC.toUpperCase() }).data, { page: 2, limit: 50, locationId: LOC });
  for (const bad of [
    { warehouseId: 'nope' }, { locationId: 'nope' }, { status: 'counting' }, { from: 'yesterday' }, { to: '2026-13-45' },
    { from: '2026-11-02T00:00:00Z', to: '2026-11-01T00:00:00Z' }, { q: '   ' }, { limit: '101' }, { page: '0' }, { sortBy: 'x' }, { $where: '1' },
  ]) assert.equal(parse(bad).success, false, JSON.stringify(bad));
});
