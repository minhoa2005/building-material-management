// BachHM | Iteration 1 | Unit Test Round 1 (28/11/2026)
// Scope (Project_Tracking WBS, Iteration 1 = View/Create): UC-129, UC-130, UC-131, UC-141, UC-142, UC-143,
// UC-153, UC-154, UC-155, UC-158, UC-159, UC-167, UC-168.
// Every case runs against the service/validation layer with mocked Mongo I/O; no database is required.
import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import { listStocktakes, getStocktake } from '../src/modules/stocktake-closure/stocktake-closure.service.js';
import { stocktakeListQuery } from '../src/modules/stocktake-closure/stocktake-list.query.js';
import { createStocktake } from '../src/modules/stocktake-closure/stocktake-commands.service.js';
import { listStocktakePlans, getStocktakePlan, createStocktakePlan } from '../src/modules/stocktake-plans/stocktake-plan.service.js';
import { dueState, occurrence } from '../src/modules/stocktake-plans/stocktake-plan.schedule.js';
import { listUsers, getUserById, createUser } from '../src/modules/users/user.service.js';
import { createUserSchema } from '../src/modules/users/user.validation.js';
import { listRoles, createRole } from '../src/modules/roles/role.service.js';
import { createRoleSchema } from '../src/modules/roles/role.validation.js';
import { listAuditLogs, getAuditLog, listQuery as auditListQuery } from '../src/modules/system/audit-log.service.js';

afterEach(() => mock.restoreAll());

const id = n => n.toString(16).padStart(24, '0');
const W1 = id(1), W2 = id(2), L1 = id(3), U1 = id(4), U2 = id(5), B1 = id(6), P1 = id(7), R1 = id(8), R2 = id(9), EV = id(10);
const DAY = 86_400_000;
const status = code => error => error.statusCode === code;

// Thenable query chain: every Mongoose query helper returns the chain, awaiting it yields `value`.
const q = value => {
  const chain = { then: (ok, fail) => Promise.resolve(value).then(ok, fail) };
  for (const key of ['populate', 'session', 'select', 'sort', 'skip', 'limit', 'lean']) chain[key] = () => chain;
  return chain;
};
const role = (code, permissions) => ({ _id: R1, code, isActive: true, permissionIds: permissions.map(code => ({ code })) });
const actor = (code, permissions, warehouseIds = [W1], _id = U1) => ({ _id, isActive: true, warehouseIds, roleId: role(code, permissions) });
const owner = actor('OWNER', ['stocktake:read', 'stocktake:create', 'audit_log:read']);
const counter = (warehouseIds = [W1]) => actor('WAREHOUSE', ['stocktake:read', 'stocktake:update'], warehouseIds, U2);
const warehouse = { _id: W1, code: 'W1', name: 'Kho Bắc', isActive: true };
const location = { _id: L1, warehouseId: W1, code: 'A-01', name: 'Kệ A01', areaCode: 'A', isActive: true };

// Transaction harness for command(): session, actor/counter lookup, document numbering and every save are mocked.
function commandHarness({ users = { [U1]: owner, [U2]: counter() }, locations = [location] } = {}) {
  const session = { withTransaction: async work => work(), endSession: async () => {}, inTransaction: () => true };
  mock.method(mongoose, 'startSession', async () => session);
  mock.method(m.User, 'findById', userId => q(users[String(userId)] ?? null));
  mock.method(m.OperationRecord, 'findOne', () => q(null));
  mock.method(m.Warehouse, 'findOne', () => q(warehouse));
  mock.method(m.Warehouse, 'findById', () => q(warehouse));
  mock.method(m.WarehouseLocation, 'find', () => q(locations));
  const saved = [];
  for (const Model of [m.Stocktake, m.StocktakePlan, m.OperationRecord, m.AuditLog, m.SystemEvent])
    mock.method(Model.prototype, 'save', async function () { saved.push(this); return this; });
  for (const Model of [m.Stocktake, m.StocktakePlan]) mock.method(Model.collection, 'find', () => ({ toArray: async () => [] }));
  mock.method(m.Stocktake.db, 'collection', () => ({ find: () => ({ toArray: async () => [] }) }));
  return saved;
}
const savedOf = (saved, Model) => saved.find(row => row instanceof Model);

// ---------------------------------------------------------------- UC-129 View stocktake list
test('UTC-BH-001 | UC-129 Normal | Warehouse staff assigned to W1 lists stocktakes | Filter limited to W1 and 1 row returned with id', async () => {
  let filter;
  mock.method(m.Stocktake, 'find', value => { filter = value; return q([{ _id: 'KK-W1-2611-000001', documentNo: 'KK-W1-2611-000001', workflowStatus: 'PLANNED' }]); });
  mock.method(m.Stocktake, 'countDocuments', async () => 1);
  const result = await listStocktakes(actor('WAREHOUSE', ['stocktake:read']), { page: 1, limit: 20 });
  assert.deepEqual(filter, { 'header.warehouseId': { $in: [W1] } });
  assert.equal(result.total, 1);
  assert.equal(result.items[0].id, 'KK-W1-2611-000001');
});
test('UTC-BH-002 | UC-129 Abnormal | Actor without stocktake:read | List rejected with 403', async () => {
  await assert.rejects(listStocktakes(actor('SALES', ['user:read']), { page: 1, limit: 20 }), status(403));
});
test('UTC-BH-003 | UC-129 Boundary | Query limit 100 / 101 and page 1 / 0 | limit 100 and page 1 accepted; limit 101 and page 0 rejected', () => {
  assert.equal(stocktakeListQuery.safeParse({ limit: '100', page: '1' }).success, true);
  assert.equal(stocktakeListQuery.safeParse({ limit: '101' }).success, false);
  assert.equal(stocktakeListQuery.safeParse({ page: '0' }).success, false);
});

// ---------------------------------------------------------------- UC-130 View stocktake details
const stocktakeDoc = { _id: 'KK-W1-2611-000001', documentNo: 'KK-W1-2611-000001', workflowStatus: 'COUNTING', version: 2,
  header: { warehouseId: W1, scopeVersion: 1, scopeLocationIds: [L1], assignedCounterIds: [U2] } };
function detailHarness(countedQtyBase, document = stocktakeDoc) {
  mock.method(m.Stocktake, 'findById', () => q(document));
  mock.method(m.StocktakeSnapshot, 'find', () => q([{ _id: id(20), origin: 'BOOK', locationId: L1, batchId: B1, qualityStatus: 'GOOD', ownerType: 'STORE', bookQtyBase: '10', baseUnitSnapshot: 'PIECE' }]));
  mock.method(m.StocktakeCount, 'find', () => q(countedQtyBase == null ? [] : [{ _id: id(21), snapshotId: id(20), attemptNo: 1, countedQtyBase, quantityEntries: [], countedBy: U2, countedAt: new Date('2026-11-20T03:00:00Z'), baseUnitSnapshot: 'PIECE' }]));
  mock.method(m.StocktakeLocationLock, 'find', () => q([]));
  mock.method(m.Warehouse, 'find', () => q([warehouse]));
  mock.method(m.WarehouseLocation, 'find', () => q([location]));
  mock.method(m.ProductBatch, 'find', () => q([{ _id: B1, productId: P1, manufacturerLot: 'LOT-1' }]));
  mock.method(m.Product, 'find', () => q([{ _id: P1, sku: 'GACH-60', name: 'Gạch 60x60', baseUnit: 'PIECE' }]));
  mock.method(m.Conversion, 'find', () => q([]));
  mock.method(m.Uom, 'find', () => q([{ _id: id(22), code: 'PIECE', name: 'Viên' }]));
}
test('UTC-BH-004 | UC-130 Normal | Session with book 10 pieces counted as 8 | Line shows DIFFERENCE -2 with unit Viên and product SKU', async () => {
  detailHarness('8');
  const result = await getStocktake(owner, stocktakeDoc._id);
  assert.equal(result.lines.length, 1);
  assert.equal(result.lines[0].status, 'DIFFERENCE');
  assert.equal(result.lines[0].differenceBase, '-2');
  assert.equal(result.lines[0].uomName, 'Viên');
  assert.equal(result.lines[0].sku, 'GACH-60');
});
test('UTC-BH-005 | UC-130 Abnormal | Unknown stocktake ID | Detail rejected with 404', async () => {
  mock.method(m.Stocktake, 'findById', () => q(null));
  await assert.rejects(getStocktake(owner, id(99)), status(404));
});
test('UTC-BH-006 | UC-130 Abnormal | Staff assigned only to W2 opens a W1 session | Detail rejected with 403 warehouse scope', async () => {
  detailHarness('8');
  await assert.rejects(getStocktake(actor('WAREHOUSE', ['stocktake:read'], [W2]), stocktakeDoc._id), status(403));
});
test('UTC-BH-007 | UC-130 Boundary | Counted quantity equals book quantity 10 / not yet counted | MATCHED with difference 0; uncounted line is NOT_COUNTED', async () => {
  detailHarness('10');
  const matched = await getStocktake(owner, stocktakeDoc._id);
  assert.equal(matched.lines[0].status, 'MATCHED');
  assert.equal(matched.lines[0].differenceBase, '0');
  mock.restoreAll();
  detailHarness(null);
  const pending = await getStocktake(owner, stocktakeDoc._id);
  assert.equal(pending.lines[0].status, 'NOT_COUNTED');
  assert.equal(pending.lines[0].differenceBase, null);
});

// ---------------------------------------------------------------- UC-131 Create Stocktake Session
const stocktakeInput = { idempotencyKey: 'st-create-1', warehouseId: W1, reason: 'Kiểm kê định kỳ kệ A', assignedCounterIds: [U2], scope: { locationIds: [L1] } };
test('UTC-BH-008 | UC-131 Normal | Owner creates session for W1, counter U2, location A-01 | PLANNED version 1 receipt with KK number and FROZEN mode', async () => {
  const saved = commandHarness();
  const receipt = await createStocktake(owner, stocktakeInput);
  assert.equal(receipt.workflowStatus, 'PLANNED');
  assert.equal(receipt.version, 1);
  assert.equal(receipt.replayed, false);
  assert.match(receipt.id, /^KK-.*-000001$/);
  const slip = savedOf(saved, m.Stocktake);
  assert.equal(slip.header.mode, 'FROZEN');
  assert.deepEqual(slip.header.assignedCounterIds.map(String), [U2]);
  assert.ok(savedOf(saved, m.AuditLog), 'creation is audited');
});
test('UTC-BH-009 | UC-131 Abnormal | Request without idempotency key | Rejected with 409 before any database access', async () => {
  const start = mock.method(mongoose, 'startSession', async () => { throw new Error('must not open a session'); });
  const { idempotencyKey, ...input } = stocktakeInput;
  await assert.rejects(createStocktake(owner, input), status(409));
  assert.equal(start.mock.callCount(), 0);
});
test('UTC-BH-010 | UC-131 Abnormal | Assigned counter belongs to W2 only | Rejected with 400 counter not in session warehouse', async () => {
  const saved = commandHarness({ users: { [U1]: owner, [U2]: counter([W2]) } });
  await assert.rejects(createStocktake(owner, stocktakeInput), error => error.statusCode === 400 && /không thuộc kho/.test(error.message));
  assert.equal(savedOf(saved, m.Stocktake), undefined);
});
test('UTC-BH-011 | UC-131 Boundary | Scope lists location A-01 twice / empty location list | Duplicate kept once; empty scope rejected with 400', async () => {
  const saved = commandHarness();
  await createStocktake(owner, { ...stocktakeInput, scope: { locationIds: [L1, L1] } });
  assert.deepEqual(savedOf(saved, m.Stocktake).header.scopeLocationIds.map(String), [L1]);
  mock.restoreAll();
  commandHarness({ locations: [] });
  await assert.rejects(createStocktake(owner, { ...stocktakeInput, idempotencyKey: 'st-create-2', scope: { locationIds: [] } }), status(400));
});

// ---------------------------------------------------------------- UC-141 View Stocktake Plan List
const planRow = (nextDueAt, extra = {}) => ({ _id: 'KHKK-W1-2611-000001', documentNo: 'KHKK-W1-2611-000001', workflowStatus: 'ACTIVE', version: 1,
  header: { warehouseId: W1, title: 'Kiểm kê tháng', nextDueAt, reminderDays: 7, nextPeriodNo: 0, scope: { locationIds: [L1], areaCodes: [], batchIds: [], productIds: [] }, assignedCounterIds: [U2] }, ...extra });
test('UTC-BH-012 | UC-141 Normal | Owner lists plans; one ACTIVE plan due yesterday | Plan shown as OVERDUE, can generate, with warehouse lookup', async () => {
  mock.method(m.StocktakePlan, 'find', () => q([planRow(new Date(Date.now() - DAY))]));
  mock.method(m.StocktakePlan, 'countDocuments', async () => 1);
  mock.method(m.Warehouse, 'find', () => q([warehouse]));
  const result = await listStocktakePlans(owner, { page: 1, limit: 20 });
  assert.equal(result.total, 1);
  assert.equal(result.items[0].dueState, 'OVERDUE');
  assert.equal(result.items[0].canGenerate, true);
  assert.equal(result.lookups.warehouses[0].code, 'W1');
});
test('UTC-BH-013 | UC-141 Abnormal | Staff assigned to W1 filters by W2 / actor lacks stocktake:read | Both rejected with 403', async () => {
  await assert.rejects(listStocktakePlans(actor('WAREHOUSE', ['stocktake:read']), { page: 1, limit: 20, warehouseId: W2 }), status(403));
  await assert.rejects(listStocktakePlans(actor('SALES', ['user:read']), { page: 1, limit: 20 }), status(403));
});
test('UTC-BH-014 | UC-141 Boundary | Due exactly now / exactly 7 reminder days ahead / 7 days + 1 ms / PAUSED overdue | OVERDUE, DUE_SOON, NOT_DUE, NOT_DUE', () => {
  const now = new Date('2026-11-28T00:00:00Z');
  const header = offset => ({ nextDueAt: new Date(now.getTime() + offset), reminderDays: 7 });
  assert.equal(dueState(header(0), 'ACTIVE', now), 'OVERDUE');
  assert.equal(dueState(header(7 * DAY), 'ACTIVE', now), 'DUE_SOON');
  assert.equal(dueState(header(7 * DAY + 1), 'ACTIVE', now), 'NOT_DUE');
  assert.equal(dueState(header(-DAY), 'PAUSED', now), 'NOT_DUE');
});

// ---------------------------------------------------------------- UC-142 View Stocktake Plan Details
const slip = (n, periodNo, workflowStatus) => ({ _id: `KK-W1-2611-00000${n}`, documentNo: `KK-W1-2611-00000${n}`, workflowStatus, version: 1, header: { planPeriodNo: periodNo } });
function planDetailHarness(plan, slips) {
  mock.method(m.StocktakePlan, 'findById', () => q(plan));
  mock.method(m.Stocktake, 'find', () => q(slips));
  mock.method(m.Warehouse, 'find', () => q([warehouse]));
  mock.method(m.WarehouseLocation, 'find', () => q([location]));
  mock.method(m.User, 'find', () => q([{ _id: U2, username: 'kho.an', fullName: 'Nguyễn An' }]));
}
test('UTC-BH-015 | UC-142 Normal | Plan with 2 generated slips and counter U2 | Detail returns both slips by period and counter lookup', async () => {
  planDetailHarness(planRow(new Date(Date.now() + 30 * DAY), { header: { ...planRow().header, nextDueAt: new Date(Date.now() + 30 * DAY), nextPeriodNo: 2 } }), [slip(2, 1, 'COMPLETED'), slip(1, 0, 'COMPLETED')]);
  const result = await getStocktakePlan(owner, 'KHKK-W1-2611-000001');
  assert.deepEqual(result.slips.map(row => row.periodNo), [1, 0]);
  assert.equal(result.lookups.counters[0].username, 'kho.an');
  assert.equal(result.dueState, 'NOT_DUE');
});
test('UTC-BH-016 | UC-142 Abnormal | Unknown plan ID / staff of W2 opens W1 plan | 404 and 403 respectively', async () => {
  mock.method(m.StocktakePlan, 'findById', () => q(null));
  await assert.rejects(getStocktakePlan(owner, 'KHKK-W1-2611-000099'), status(404));
  mock.restoreAll();
  planDetailHarness(planRow(new Date()), []);
  await assert.rejects(getStocktakePlan(actor('WAREHOUSE', ['stocktake:read'], [W2]), 'KHKK-W1-2611-000001'), status(403));
});
test('UTC-BH-017 | UC-142 Boundary | nextPeriodNo 2; period 0 all CANCELLED, period 1 CANCELLED+COMPLETED, period 2 CANCELLED | Only period 0 is regenerable', async () => {
  const header = { ...planRow().header, nextDueAt: new Date(Date.now() + 30 * DAY), nextPeriodNo: 2 };
  planDetailHarness(planRow(header.nextDueAt, { header }), [slip(5, 2, 'CANCELLED'), slip(4, 1, 'CANCELLED'), slip(3, 1, 'COMPLETED'), slip(2, 0, 'CANCELLED'), slip(1, 0, 'CANCELLED')]);
  const result = await getStocktakePlan(owner, 'KHKK-W1-2611-000001');
  assert.deepEqual(result.regenerablePeriodNos, [0]);
});

// ---------------------------------------------------------------- UC-143 Create Stocktake Plan
const planInput = { idempotencyKey: 'plan-create-1', warehouseId: W1, title: 'Kiểm kê tháng kệ A', frequency: 'MONTHLY', startDate: '2026-12-01T01:00:00.000Z', assignedCounterIds: [U2], scope: { locationIds: [L1] } };
test('UTC-BH-018 | UC-143 Normal | Monthly plan for W1 starting 01/12/2026 | ACTIVE plan with KHKK number, first due = start date, reminder 7 days', async () => {
  const saved = commandHarness();
  const receipt = await createStocktakePlan(owner, planInput);
  assert.equal(receipt.workflowStatus, 'ACTIVE');
  assert.match(receipt.id, /^KHKK-.*-000001$/);
  const plan = savedOf(saved, m.StocktakePlan);
  assert.equal(plan.header.nextDueAt.toISOString(), planInput.startDate);
  assert.equal(plan.header.reminderDays, 7);
  assert.equal(plan.header.generatedCount, 0);
});
test('UTC-BH-019 | UC-143 Abnormal | End date 30/11/2026 before start date 01/12/2026 | Rejected with 400 and no plan saved', async () => {
  const saved = commandHarness();
  await assert.rejects(createStocktakePlan(owner, { ...planInput, endDate: '2026-11-30T01:00:00.000Z' }), error => error.statusCode === 400 && /Ngày kết thúc/.test(error.message));
  assert.equal(savedOf(saved, m.StocktakePlan), undefined);
});
test('UTC-BH-020 | UC-143 Boundary | Area code Z with no active location / monthly start 31/01 | Area-only empty scope rejected 400; period 1 clamps to 28/02', async () => {
  commandHarness({ locations: [] });
  await assert.rejects(createStocktakePlan(owner, { ...planInput, scope: { areaCodes: ['Z'] } }), status(400));
  // 31/01/2027 08:00 Asia/Ho_Chi_Minh -> next monthly occurrence is 28/02/2027 08:00 local.
  assert.equal(occurrence('2027-01-31T01:00:00.000Z', 'MONTHLY', 1).toISOString(), '2027-02-28T01:00:00.000Z');
});

// ---------------------------------------------------------------- UC-153 View account list
const userRow = (extra = {}) => ({ _id: U2, username: 'kho.an', fullName: 'Nguyễn An', phone: '0912345678', email: 'an@wmsd.vn', warehouseIds: [W1],
  roleId: { code: 'WAREHOUSE', isActive: true, permissionIds: [] }, isActive: true, createdAt: new Date('2026-11-01T00:00:00Z'), lastLoginAt: new Date('2026-11-27T00:00:00Z'), ...extra });
function userListHarness() {
  const calls = {};
  mock.method(m.User, 'find', filter => {
    calls.filter = filter;
    const chain = q([userRow()]);
    chain.skip = value => { calls.skip = value; return chain; };
    chain.limit = value => { calls.limit = value; return chain; };
    return chain;
  });
  mock.method(m.User, 'countDocuments', async () => 1);
  return calls;
}
test('UTC-BH-021 | UC-153 Normal | Search "an" with status active | Filter on username/fullName/phone with isActive true; row mapped to role warehouse, status active', async () => {
  const calls = userListHarness();
  const result = await listUsers({ search: 'an', status: 'active', page: 1, limit: 10 });
  assert.equal(calls.filter.isActive, true);
  assert.deepEqual(calls.filter.$or.map(clause => Object.keys(clause)[0]), ['username', 'fullName', 'phone']);
  assert.equal(result.items[0].role, 'warehouse');
  assert.equal(result.items[0].status, 'active');
  assert.deepEqual(result.items[0].warehouseIds, [W1]);
});
test('UTC-BH-022 | UC-153 Abnormal | Filter by unknown role "ghost" | Empty page returned without querying users', async () => {
  mock.method(m.Role, 'findOne', () => q(null));
  const find = mock.method(m.User, 'find', () => q([]));
  const result = await listUsers({ role: 'ghost', page: 1, limit: 10 });
  assert.deepEqual(result, { items: [], total: 0, page: 1, limit: 10 });
  assert.equal(find.mock.callCount(), 0);
});
test('UTC-BH-023 | UC-153 Boundary | page 0, limit 0 and search "a.b" | Normalized to page 1 / limit 1 (skip 0) and dot matched literally', async () => {
  const calls = userListHarness();
  const result = await listUsers({ search: 'a.b', page: '0', limit: '0' });
  assert.equal(result.page, 1);
  assert.equal(result.limit, 1);
  assert.equal(calls.skip, 0);
  assert.equal(calls.limit, 1);
  assert.equal(calls.filter.$or[0].username.test('axb'), false);
  assert.equal(calls.filter.$or[0].username.test('A.B'), true);
});

// ---------------------------------------------------------------- UC-154 View account details
test('UTC-BH-024 | UC-154 Normal | Locked account with role permissions user:read and legacy:x | Detail shows inactive, lock reason and only catalogue permissions', async () => {
  mock.method(m.User, 'findById', () => q(userRow({ isActive: false, lockReason: 'Nghỉ việc', roleId: { code: 'ADMIN', isActive: true, permissionIds: [{ code: 'user:read' }, { code: 'legacy:x' }] } })));
  const result = await getUserById(U2);
  assert.equal(result.status, 'inactive');
  assert.equal(result.lockReason, 'Nghỉ việc');
  assert.equal(result.role, 'admin');
  assert.deepEqual(result.permissions, ['user:read']);
});
test('UTC-BH-025 | UC-154 Abnormal | Unknown account ID / account whose role is inactive | 404 and 401 respectively', async () => {
  mock.method(m.User, 'findById', () => q(null));
  await assert.rejects(getUserById(id(99)), status(404));
  mock.restoreAll();
  mock.method(m.User, 'findById', () => q(userRow({ roleId: { code: 'WAREHOUSE', isActive: false, permissionIds: [] } })));
  await assert.rejects(getUserById(U2), status(401));
});
test('UTC-BH-026 | UC-154 Boundary | Account never logged in and without warehouse list | warehouseIds [] and lastLogin null', async () => {
  const { warehouseIds, lastLoginAt, ...row } = userRow();
  mock.method(m.User, 'findById', () => q(row));
  const result = await getUserById(U2);
  assert.deepEqual(result.warehouseIds, []);
  assert.equal(result.lastLogin, null);
});

// ---------------------------------------------------------------- UC-155 Create Staff Account
const staffInput = { username: '  Kho.An ', fullName: ' Nguyễn An ', roleCode: 'warehouse', email: 'An@WMSD.vn', warehouseIds: [W1] };
function createUserHarness({ existing = null, roleDoc = { _id: R1, code: 'WAREHOUSE', isActive: true }, activeWarehouses = 1 } = {}) {
  process.env.MAIL_TRANSPORT = 'console';
  mock.method(console, 'info', () => {});
  mock.method(m.User, 'findOne', () => q(existing));
  mock.method(m.Role, 'findOne', () => q(roleDoc));
  mock.method(m.Warehouse, 'countDocuments', async () => activeWarehouses);
  mock.method(m.User, 'exists', async () => null);
  const create = mock.method(m.User, 'create', async doc => ({ _id: U2, ...doc }));
  mock.method(m.User, 'findById', () => q(userRow()));
  return create;
}
test('UTC-BH-027 | UC-155 Normal | Create "Kho.An" with email An@WMSD.vn, role warehouse, W1 | Username/email lowercased, hashed generated password, account returned', async () => {
  const create = createUserHarness();
  const result = await createUser(staffInput);
  const doc = create.mock.calls[0].arguments[0];
  assert.equal(doc.username, 'kho.an');
  assert.equal(doc.email, 'an@wmsd.vn');
  assert.equal(doc.fullName, 'Nguyễn An');
  assert.match(doc.passwordHash, /^\$2[aby]\$10\$/);
  assert.equal(doc.isActive, true);
  assert.equal(result.username, 'kho.an');
});
test('UTC-BH-028 | UC-155 Abnormal | Username already used / assigned warehouse inactive | Both rejected with 400 and no account created', async () => {
  let create = createUserHarness({ existing: userRow() });
  await assert.rejects(createUser(staffInput), error => error.statusCode === 400 && /Tên đăng nhập/.test(error.message));
  assert.equal(create.mock.callCount(), 0);
  mock.restoreAll();
  create = createUserHarness({ activeWarehouses: 0 });
  await assert.rejects(createUser(staffInput), error => error.statusCode === 400 && /Kho phân công/.test(error.message));
  assert.equal(create.mock.callCount(), 0);
});
test('UTC-BH-029 | UC-155 Boundary | Username length 3 / 2 / 50 / 51 and phone "0912 345 678" | 3 and 50 accepted, 2 and 51 rejected, phone normalized', () => {
  const body = username => ({ body: { username, fullName: 'Nguyễn An', roleCode: 'WAREHOUSE', email: 'an@wmsd.vn', phone: '0912 345 678' } });
  assert.equal(createUserSchema.safeParse(body('abc')).success, true);
  assert.equal(createUserSchema.safeParse(body('ab')).success, false);
  assert.equal(createUserSchema.safeParse(body('a'.repeat(50))).success, true);
  assert.equal(createUserSchema.safeParse(body('a'.repeat(51))).success, false);
  assert.equal(createUserSchema.parse(body('abc')).body.phone, '0912345678');
});

// ---------------------------------------------------------------- UC-158 View Role List
function roleListHarness() {
  mock.method(m.Role, 'find', () => q([
    { _id: R1, code: 'WAREHOUSE', name: 'Nhân viên kho', isActive: true, isSystemRole: true, permissionIds: [{ code: 'stocktake:read' }, { code: 'legacy:x' }] },
    { _id: R2, code: 'AUDITOR', name: 'Kiểm toán', isActive: true, isSystemRole: false, permissionIds: [] },
  ]));
  mock.method(m.User, 'aggregate', async () => [{ _id: R1, count: 2 }]);
}
test('UTC-BH-030 | UC-158 Normal | Roles WAREHOUSE (2 accounts) and AUDITOR | List returns both roles with roleKey and WAREHOUSE userCount 2', async () => {
  roleListHarness();
  const result = await listRoles();
  assert.deepEqual(result.map(row => row.roleKey), ['warehouse', 'auditor']);
  assert.equal(result[0].userCount, 2);
});
test('UTC-BH-031 | UC-158 Abnormal | Role holds permission legacy:x not in catalogue | Unknown code hidden, stocktake:read kept', async () => {
  roleListHarness();
  const [warehouseRole] = await listRoles();
  assert.deepEqual(warehouseRole.permissions, ['stocktake:read']);
});
test('UTC-BH-032 | UC-158 Boundary | Role AUDITOR with no account and no permission | userCount 0 and empty permission list', async () => {
  roleListHarness();
  const auditor = (await listRoles()).find(row => row.code === 'AUDITOR');
  assert.equal(auditor.userCount, 0);
  assert.deepEqual(auditor.permissions, []);
});

// ---------------------------------------------------------------- UC-159 Create Role
const roleInput = { code: 'KHO_PHU', name: 'Kho phụ', permissionCodes: ['stocktake:read', 'stocktake:read'] };
test('UTC-BH-033 | UC-159 Normal | Create role KHO_PHU with stocktake:read listed twice | Role created with one permission and CREATE_ROLE audit', async () => {
  mock.method(m.Permission, 'find', () => q([{ _id: id(30), code: 'stocktake:read' }]));
  const create = mock.method(m.Role, 'create', async doc => ({ _id: R2, ...doc }));
  const audits = [];
  mock.method(m.AuditLog.prototype, 'save', async function () { audits.push(this); return this; });
  const result = await createRole(roleInput, U1);
  assert.deepEqual(result.permissions, ['stocktake:read']);
  assert.equal(create.mock.calls[0].arguments[0].isSystemRole, false);
  assert.equal(audits[0].action, 'CREATE_ROLE');
});
test('UTC-BH-034 | UC-159 Abnormal | Role code already exists (E11000) / permission inactive | 409 duplicate and 400 respectively', async () => {
  mock.method(m.Permission, 'find', () => q([{ _id: id(30), code: 'stocktake:read' }]));
  mock.method(m.Role, 'create', async () => { throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 }); });
  await assert.rejects(createRole(roleInput, U1), status(409));
  mock.restoreAll();
  mock.method(m.Permission, 'find', () => q([]));
  await assert.rejects(createRole(roleInput, U1), status(400));
});
test('UTC-BH-035 | UC-159 Boundary | Code "AB" / "A" / "ab" / 60 chars / 61 chars | AB and 60 chars accepted; A, lowercase and 61 chars rejected', () => {
  const body = code => ({ body: { code, name: 'Vai trò', permissionCodes: [] } });
  assert.equal(createRoleSchema.safeParse(body('AB')).success, true);
  assert.equal(createRoleSchema.safeParse(body('A')).success, false);
  assert.equal(createRoleSchema.safeParse(body('ab')).success, false);
  assert.equal(createRoleSchema.safeParse(body('A' + 'B'.repeat(59))).success, true);
  assert.equal(createRoleSchema.safeParse(body('A' + 'B'.repeat(60))).success, false);
});

// ---------------------------------------------------------------- UC-167 View Audit Log List
const auditEvent = (extra = {}) => ({ _id: EV, occurredAt: new Date('2026-11-27T02:00:00Z'), action: 'CREATE_ROLE', result: 'SUCCESS', actorType: 'USER', actorId: U1,
  subjectType: 'roles', subjectId: R2, reason: 'Tạo vai trò kho phụ', changes: [{ field: 'code', before: null, after: 'KHO_PHU' }], ...extra });
const auditor = actor('ADMIN', ['audit_log:read']);
test('UTC-BH-036 | UC-167 Normal | Filter action CREATE_ROLE, result SUCCESS | Filter applied; row shows label "Tạo vai trò", subject "Vai trò" and actor username', async () => {
  let filter;
  mock.method(m.AuditLog, 'find', value => { filter = value; return q([auditEvent()]); });
  mock.method(m.AuditLog, 'countDocuments', async () => 1);
  mock.method(m.User, 'find', () => q([{ _id: U1, username: 'admin', fullName: 'Quản trị' }]));
  const result = await listAuditLogs(auditor, auditListQuery.parse({ action: 'CREATE_ROLE', result: 'SUCCESS' }));
  assert.deepEqual(filter, { action: 'CREATE_ROLE', result: 'SUCCESS' });
  assert.equal(result.items[0].actionLabel, 'Tạo vai trò');
  assert.equal(result.items[0].subjectLabel, 'Vai trò');
  assert.equal(result.items[0].actor.username, 'admin');
  assert.equal(result.items[0].changeCount, 1);
});
test('UTC-BH-037 | UC-167 Abnormal | Actor without audit_log:read | List rejected with 403', async () => {
  await assert.rejects(listAuditLogs(actor('WAREHOUSE', ['stocktake:read']), auditListQuery.parse({})), status(403));
});
test('UTC-BH-038 | UC-167 Boundary | limit 100 / 101, page 0, default query | 100 accepted; 101 and page 0 rejected; defaults page 1 limit 20', () => {
  assert.equal(auditListQuery.safeParse({ limit: '100' }).success, true);
  assert.equal(auditListQuery.safeParse({ limit: '101' }).success, false);
  assert.equal(auditListQuery.safeParse({ page: '0' }).success, false);
  assert.deepEqual(auditListQuery.parse({}), { page: 1, limit: 20 });
});

// ---------------------------------------------------------------- UC-168 View Audit Log Details
test('UTC-BH-039 | UC-168 Normal | Existing CREATE_ROLE event with one change | Detail returns change code null -> KHO_PHU and actor', async () => {
  mock.method(m.AuditLog, 'findById', () => q(auditEvent()));
  mock.method(m.User, 'find', () => q([{ _id: U1, username: 'admin', fullName: 'Quản trị' }]));
  const result = await getAuditLog(auditor, EV);
  assert.deepEqual(result.changes, [{ field: 'code', before: null, after: 'KHO_PHU' }]);
  assert.equal(result.actor.fullName, 'Quản trị');
});
test('UTC-BH-040 | UC-168 Abnormal | Malformed ID "abc" / unknown valid ID | Both rejected with 404; malformed ID never queried', async () => {
  const findById = mock.method(m.AuditLog, 'findById', () => q(null));
  await assert.rejects(getAuditLog(auditor, 'abc'), status(404));
  assert.equal(findById.mock.callCount(), 0);
  await assert.rejects(getAuditLog(auditor, id(99)), status(404));
});
test('UTC-BH-041 | UC-168 Boundary | System event without changes, reason or actor | changes [], changeCount 0, reason null, actor null', async () => {
  mock.method(m.AuditLog, 'findById', () => q(auditEvent({ changes: undefined, reason: undefined, actorId: undefined, actorType: 'SYSTEM' })));
  mock.method(m.User, 'find', () => q([]));
  const result = await getAuditLog(auditor, EV);
  assert.deepEqual(result.changes, []);
  assert.equal(result.changeCount, 0);
  assert.equal(result.reason, null);
  assert.equal(result.actor, null);
});
