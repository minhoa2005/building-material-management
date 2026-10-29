import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { listQuerySchema, getReplenishmentSchema, creationDateRange } from '../src/modules/replenishments/replenishment.validation.js';
import { replenishmentScope, canReadRelated } from '../src/modules/replenishments/replenishment.access.js';
import { buildListPipeline } from '../src/modules/replenishments/replenishment.service.js';
import { sumAvailableBalances } from '../src/modules/replenishments/replenishment.availability.js';
import { indexById, mapLine, mapEvaluationSnapshot, mapApproval, mapRelatedReference } from '../src/modules/replenishments/replenishment.mapper.js';

const id = () => new mongoose.Types.ObjectId();
const role = (code, permissions = ['replenishment_request:read']) => ({ code, permissionIds: permissions.map((code) => ({ code })) });
const actor = (assignedRole = role('OWNER')) => ({ _id: id(), isActive: true, warehouseIds: [id()], roleId: assignedRole });
const isStatus = (status) => (error) => error.statusCode === status;

test('RR query validation bounds pagination and rejects malformed/injected inputs', () => {
  assert.deepEqual(listQuerySchema.parse({}), { page: 1, limit: 10 });
  assert.equal(listQuerySchema.parse({ limit: '100', search: ' RR ' }).search, 'RR');
  for (const query of [
    { page: '0' }, { page: '-1' }, { page: '1.5' }, { page: 'Infinity' },
    { page: '9007199254740991', limit: '100' }, { limit: '101' }, { limit: ['10', '20'] },
    { search: { $ne: '' } }, { search: 'x'.repeat(101) }, { warehouseId: 'bad' },
    { createdBy: { $ne: null } }, { status: 'pending' }, { status: 'PO_CREATED' },
    { approvalDecision: 'APPROVED' }, { sort: 'passwordHash' }, { 'warehouseId[$ne]': '' },
    { createdFrom: '2026-02-29' }, { createdTo: '2026-04-31' }, { createdFrom: '2026-13-01' },
    { createdFrom: '27/10/2026' }, { createdFrom: '2026-10-28', createdTo: '2026-10-27' },
  ]) assert.equal(listQuerySchema.safeParse(query).success, false, JSON.stringify(query));
  assert.equal(listQuerySchema.safeParse({ createdFrom: '2028-02-29' }).success, true);
  assert.equal(getReplenishmentSchema.safeParse({ params: { id: 'bad' }, query: {} }).success, false);
  assert.equal(getReplenishmentSchema.safeParse({ params: { id: String(id()) }, query: { include: 'secret' } }).success, false);
});

test('RR creation filters use inclusive Vietnam dates with an exclusive next-day boundary', () => {
  const range = creationDateRange({ createdFrom: '2026-10-27', createdTo: '2026-10-27' });
  assert.equal(range.$gte.toISOString(), '2026-10-26T17:00:00.000Z');
  assert.equal(range.$lt.toISOString(), '2026-10-27T17:00:00.000Z');
  assert.equal(creationDateRange({}), null);
});

test('RR record scope uses the assigned single role and current warehouse assignments', () => {
  for (const code of ['OWNER', 'ACCOUNTANT', 'SALES', 'WAREHOUSE']) {
    const user = actor(role(code));
    const scope = replenishmentScope(user);
    assert.equal(scope.documentKind, 'REPLENISHMENT');
    if (code === 'OWNER') assert.equal(scope['header.warehouseId'], undefined);
    else assert.deepEqual(scope['header.warehouseId'].$in, user.warehouseIds);
    assert.equal(String(scope.createdBy), ['SALES', 'WAREHOUSE'].includes(code) ? String(user._id) : 'undefined');
  }
  assert.throws(() => replenishmentScope(actor(role('ADMIN'))), isStatus(403));
  assert.throws(() => replenishmentScope(actor(null)), isStatus(403));
  assert.throws(() => replenishmentScope(null), isStatus(403));
  const noWarehouses = { ...actor(role('ACCOUNTANT')), warehouseIds: [] };
  assert.deepEqual(replenishmentScope(noWarehouses)['header.warehouseId'].$in, []);
  assert.equal(replenishmentScope({ ...actor(), warehouseIds: [] })['header.warehouseId'], undefined);
});

test('RR filters intersect creator scope, escape literal search and filter latest decisions before pagination', () => {
  const user = actor(role('SALES'));
  const other = id();
  const pipeline = buildListPipeline(user, listQuerySchema.parse({ createdBy: String(other), search: 'RR[.*', approvalDecision: 'APPROVE' }));
  assert.equal(String(pipeline[0].$match.$and[0].createdBy), String(user._id));
  assert.equal(String(pipeline[0].$match.$and[1].createdBy), String(other));
  assert.equal(pipeline[0].$match.$and[1].documentNo.$regex, 'RR\\[\\.\\*');
  const decisionIndex = pipeline.findIndex((stage) => stage.$match?.['_latestApproval.decision']);
  assert.ok(decisionIndex > 0 && decisionIndex < pipeline.findIndex((stage) => stage.$facet));
  assert.throws(() => buildListPipeline(user, listQuerySchema.parse({ warehouseId: String(id()) })), isStatus(403));
  assert.doesNotThrow(() => buildListPipeline(user, listQuerySchema.parse({ warehouseId: String(user.warehouseIds[0]).toUpperCase() })));
  assert.doesNotThrow(() => buildListPipeline({ ...actor(), warehouseIds: [] }, listQuerySchema.parse({ warehouseId: String(id()) })));
});

test('RR availability uses exact decimals, ACTIVE reservations once, full-balance holds and location locks', () => {
  const productId = id();
  const balances = ['0.1', '0.2', '99', '77'].map((qtyBase) => ({ _id: id(), accountId: id(), productId, qtyBase }));
  const reservations = [
    { balanceId: balances[0]._id, qtyBase: '0.03', status: 'ACTIVE' },
    { balanceId: balances[0]._id, qtyBase: '0.02', status: 'ACTIVE' },
    { balanceId: balances[0]._id, qtyBase: '50', status: 'RELEASED' },
    { balanceId: balances[1]._id, qtyBase: '50', status: 'CONSUMED' },
  ];
  const totals = sumAvailableBalances(balances, reservations, [balances[2]._id], [balances[3].accountId]);
  assert.equal(totals.get(String(productId)), '0.25');
  assert.throws(() => sumAvailableBalances([balances[0]], [
    { balanceId: balances[0]._id, qtyBase: '0.11', status: 'ACTIVE' },
  ]), isStatus(500));
});

test('RR mapping preserves saved names, conversion factors, snapshots, decimal zero and missing identities', () => {
  const product = { _id: id(), sku: 'P1', name: 'New name', baseUomId: id(), isActive: false };
  const conversion = { _id: id(), version: 1, uomId: id(), basePerUnit: '999' };
  const masters = { products: indexById([product]), conversions: indexById([conversion]), uoms: new Map() };
  const line = { _id: id(), lineNo: 1, productId: product._id, conversionId: conversion._id,
    enteredQty: mongoose.Types.Decimal128.fromString('0.1'), conversionSnapshot: '3', qtyBase: '0.3', productNameSnapshot: 'Saved name' };
  const mapped = mapLine(line, masters);
  assert.equal(mapped.product.name, 'Saved name');
  assert.equal(mapped.product.isActive, false);
  assert.equal(mapped.conversionSnapshot, '3');
  assert.equal(mapped.enteredQty, '0.1');
  assert.equal(mapped.qtyBase, '0.3');
  assert.equal(mapped.enteredUom.code, null);
  assert.equal(mapEvaluationSnapshot({ availableQtySnapshot: '0' }).availableQtyBase, '0');
  assert.equal(mapEvaluationSnapshot({}).suggestedQtyBase, null);
  const history = mapApproval({ _id: id(), documentVersion: 1, decision: 'APPROVE', lines: [
    { lineId: line._id, approvedQty: '0', outcome: 'APPROVE' },
  ] }, 2, new Map(), true);
  assert.equal(history.isForCurrentVersion, false);
  assert.equal(history.lines[0].approvedQtyBase, '0');
});

test('RR rights do not expose linked PO/stocktake metadata or broaden an unrelated warehouse scope', () => {
  const sales = actor(role('SALES'));
  const po = { _id: id(), documentKind: 'PO', documentNo: 'SECRET', header: { warehouseId: sales.warehouseIds[0] } };
  assert.equal(canReadRelated(po, sales), false);
  assert.deepEqual(mapRelatedReference(po._id, 'PO', indexById([po]), sales), {
    id: String(po._id), documentKind: 'PO', access: 'UNAVAILABLE',
  });
  sales.roleId.permissionIds.push({ code: 'purchase_order:read' });
  assert.equal(canReadRelated(po, sales), false); // Sales has no PO operation in the business catalogue.
  const warehouse = actor(role('WAREHOUSE', ['replenishment_request:read', 'purchase_order:read']));
  assert.equal(canReadRelated(po, warehouse), false);
  po.header.warehouseId = warehouse.warehouseIds[0];
  assert.equal(canReadRelated(po, warehouse), true);
  const owner = { ...actor(role('OWNER', ['purchase_order:read', 'stocktake:read', 'issue_request:read', 'stock_transfer:read'])), warehouseIds: [] };
  assert.equal(canReadRelated(po, owner), true);
  assert.equal(canReadRelated({ documentKind: 'STOCKTAKE', header: { warehouseId: id() } }, owner), true);
  assert.equal(canReadRelated({ documentKind: 'ISSUE_REQUEST', header: { requestedWarehouseId: id() } }, owner), true);
  assert.equal(canReadRelated({ documentKind: 'TRANSFER_REQUEST', header: { sourceWarehouseId: id(), destinationWarehouseId: id() } }, owner), true);
  owner.roleId.permissionIds = [];
  assert.equal(canReadRelated(po, owner), false);
});
