// BachHM | Iteration 1 | Integration Test Round 1 (28/11/2026)
// Scope (Google Sheet Project_Tracking > WBS, Planned = Iteration 1, In-Charge = bachhm):
//   Stocktake: UC-129, UC-130, UC-131, UC-132, UC-134, UC-136
//   Account:   UC-146, UC-148, UC-149, UC-150, UC-151, UC-152, UC-157 (WBS duplicate row of "Change Staff Account Status")
// Every case drives the real Express app over HTTP (JWT bearer) against an isolated MongoDB replica-set database
// that is created for this run and dropped afterwards. No shared or remote data is touched.
// Run: RUN_BACHHM_IT_ITER1=1 node --test --test-concurrency=1 test/bachhm-iter1-round1.integration.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as m from '../src/models/runtime.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';

const enabled = process.env.RUN_BACHHM_IT_ITER1 === '1';
const run = (name, fn) => test(name, { skip: !enabled }, fn);
const key = () => new mongoose.Types.ObjectId().toString();
const MONGO = process.env.BACHHM_IT_MONGO || 'mongodb://127.0.0.1:27326/?replicaSet=wireframe';
const PASSWORD = 'Round1-Pass9';

let server, base;
let admin, owner, worker, stranger, sales, counterB, wa, wb, closedWarehouse, product, batch;
let bookA, bookB, emptyA, stocktakeId, otherStocktakeId, snapshotId, firstCountId, createdUserId;
const mails = [];

const reload = user => m.User.findById(user._id).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
const token = user => jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET);
async function call(method, path, { as, body, raw } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (as) headers.authorization = 'Bearer ' + (typeof as === 'string' ? as : token(as));
  const response = await fetch(base + path, { method, headers, ...(body !== undefined && { body: JSON.stringify(body) }) });
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: response.status, body: json, data: json?.data, headers: response.headers, raw: raw ? text : undefined };
}
const audits = (action, user) => m.AuditLog.countDocuments({ action, subjectId: { $in: [user._id, String(user._id)] } });
const version = async id => (await m.Stocktake.findById(id)).version;
const locks = id => m.StocktakeLocationLock.countDocuments({ stocktakeId: id, status: 'LOCKED' });
const qtyOf = async balance => String((await m.InventoryBalance.findById(balance._id)).quantityBase);
const op = async (id, extra = {}) => ({ idempotencyKey: key(), expectedVersion: await version(id), ...extra });

test.before(async () => {
  if (!enabled) return;
  process.env.JWT_SECRET = 'bachhm-it-round1-isolated-secret';
  process.env.MAIL_TRANSPORT = 'console';
  process.env.NOTIFICATION_EMAIL = 'off';
  const info = console.info;
  console.info = (...args) => { const text = args.join(' '); if (text.startsWith('[mail:console]')) mails.push(text); else info(...args); };
  const url = new URL(MONGO);
  url.pathname = '/wmsd_bachhm_it_round1_' + key();
  await mongoose.connect(url.toString(), { serverSelectionTimeoutMS: 5000 });
  const models = [...m.models.values()];
  for (let start = 0; start < models.length; start += 6)
    await Promise.all(models.slice(start, start + 6).map(async Model => { await Model.createCollection(); await Model.createIndexes(); }));
  const permissions = await m.Permission.insertMany(PERMISSION_CATALOGUE.map(p => ({ code: p.code, name: p.code, description: p.description })));
  const roles = {};
  for (const code of ['ADMIN', 'OWNER', 'WAREHOUSE', 'SALES'])
    roles[code] = await m.Role.create({ code, name: code, permissionIds: permissions.filter(p => ROLE_PERMISSIONS[code].includes(p.code)).map(p => p._id) });
  [wa, wb, closedWarehouse] = await m.Warehouse.create([
    { code: 'BA', name: 'Kho Bắc A', lengthMm: '10000', widthMm: '10000', clearHeightMm: '3000' },
    { code: 'BB', name: 'Kho Bắc B', lengthMm: '10000', widthMm: '10000', clearHeightMm: '3000' },
    { code: 'BX', name: 'Kho ngừng', lengthMm: '10000', widthMm: '10000', clearHeightMm: '3000', isActive: false },
  ]);
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const user = (username, role, warehouses, extra = {}) => m.User.create({ username, fullName: 'BachHM ' + username, email: username + '@wmsd.test', passwordHash, roleId: roles[role]._id, warehouseIds: warehouses.map(w => w._id), ...extra }).then(reload);
  admin = await user('bh.admin', 'ADMIN', []);
  owner = await user('bh.owner', 'OWNER', [wa, wb]);
  worker = await user('bh.worker', 'WAREHOUSE', [wa]);
  stranger = await user('bh.stranger', 'WAREHOUSE', [wa]);
  sales = await user('bh.sales', 'SALES', [wa], { phone: '0912345678' });
  counterB = await user('bh.counterb', 'WAREHOUSE', [wb]);
  await m.Uom.create({ code: 'PIECE', name: 'Viên' });
  const category = await m.Category.create({ code: 'BHT', name: 'Tile' });
  product = await m.Product.create({ sku: 'BH-TILE', name: 'Gạch kiểm kê', manufacturerCode: 'BH', categoryId: category._id, color: 'White', baseUnit: 'PIECE', wholeBaseUnits: true, lengthMm: '600', widthMm: '600', heightMm: '10' });
  batch = await m.ProductBatch.create({ productId: product._id, manufacturerLot: 'BH-LOT', identificationStatus: 'VERIFIED', piecesPerCarton: 4, cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50' });
  const portions = qty => [{ packagingState: 'SEALED', sealedPackCount: Number(qty) / 4, quantityBase: qty, createdBy: worker._id, packagingSnapshot: { packageUnit: 'BOX', baseUnitsPerPackage: '4', outerLengthMm: '620', outerWidthMm: '620', outerHeightMm: '50' } }];
  const location = async (warehouse, code, qty) => {
    const loc = await m.WarehouseLocation.create({ warehouseId: warehouse._id, code, name: code, locationType: 'STORAGE', isPickable: true, usableLengthMm: '5000', usableWidthMm: '5000' });
    const point = await m.StockHoldingPoint.create({ type: 'LOCATION', locationId: loc._id });
    const balance = qty ? await m.InventoryBalance.create({ holdingPointId: point._id, batchId: batch._id, qualityStatus: 'GOOD', ownerType: 'STORE', quantityBase: qty, version: 1, packagingPortions: portions(qty) }) : null;
    return { loc, point, balance };
  };
  bookA = await location(wa, 'A-01', '12');
  emptyA = await location(wa, 'A-02');
  bookB = await location(wb, 'B-01', '8');
  const { default: app } = await import('../src/app.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + server.address().port + '/api';
});

test.after(async () => {
  if (!enabled) return;
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState) {
    assert.match(mongoose.connection.name, /^wmsd_bachhm_it_round1_[a-f0-9]{24}$/);
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

const createBody = (extra = {}) => ({ idempotencyKey: key(), warehouseId: String(wa._id), reason: 'Kiểm kê định kỳ kệ A', assignedCounterIds: [String(worker._id)], scope: { locationIds: [String(bookA.loc._id), String(emptyA.loc._id)] }, ...extra });

// ---------------------------------------------------------------- UC-131 Create Stocktake Session
run('ITC-BH-131-BASE | UC-131 | Owner creates a stocktake session for warehouse A over HTTP', async () => {
  const res = await call('POST', '/stocktakes', { as: owner, body: createBody() });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  stocktakeId = res.data.id;
  assert.equal(res.data.workflowStatus, 'PLANNED');
  assert.match(stocktakeId, /^KK-BA-\d{6}-\d{6}$/);
  assert.equal(await locks(stocktakeId), 0);
  assert.equal(await m.StocktakeSnapshot.countDocuments({ stocktakeId }), 0);
  assert.equal(await qtyOf(bookA.balance), '12');
});
run('ITC-BH-131-REPLAY | UC-131 | Same idempotency key submitted twice', async () => {
  const body = createBody({ scope: { locationIds: [String(bookB.loc._id)] }, warehouseId: String(wb._id), assignedCounterIds: [String(counterB._id)] });
  const before = await m.Stocktake.countDocuments();
  const first = await call('POST', '/stocktakes', { as: owner, body });
  const second = await call('POST', '/stocktakes', { as: owner, body });
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.equal(second.status, 200, JSON.stringify(second.body));
  assert.equal(second.data.id, first.data.id);
  assert.equal(await m.Stocktake.countDocuments(), before + 1);
  otherStocktakeId = first.data.id;
});
run('ITC-BH-131-ERR | UC-131 | Counter not assigned to the session warehouse', async () => {
  const before = await m.Stocktake.countDocuments();
  const res = await call('POST', '/stocktakes', { as: owner, body: createBody({ warehouseId: String(wb._id), scope: { locationIds: [String(bookB.loc._id)] } }) });
  assert.equal(res.status, 400);
  assert.equal(await m.Stocktake.countDocuments(), before);
});
run('ITC-BH-131-AUTH | UC-131 | Warehouse Staff tries to plan a session', async () => {
  const before = await m.Stocktake.countDocuments();
  const res = await call('POST', '/stocktakes', { as: worker, body: createBody() });
  assert.equal(res.status, 403);
  assert.equal(await m.Stocktake.countDocuments(), before);
});

// ---------------------------------------------------------------- UC-129 View stocktake list
run('ITC-BH-129-BASE | UC-129 | List respects warehouse scope', async () => {
  const staff = await call('GET', '/stocktakes?page=1&limit=20', { as: worker });
  assert.equal(staff.status, 200);
  assert.deepEqual(staff.data.items.map(r => r.id), [stocktakeId]);
  const own = await call('GET', '/stocktakes?page=1&limit=20', { as: owner });
  assert.equal(own.data.total, 2);
});
run('ITC-BH-129-ALT | UC-129 | Filter by status and keyword', async () => {
  const planned = await call('GET', '/stocktakes?status=PLANNED&warehouseId=' + wa._id, { as: owner });
  assert.deepEqual(planned.data.items.map(r => r.id), [stocktakeId]);
  const none = await call('GET', '/stocktakes?status=COMPLETED', { as: owner });
  assert.equal(none.status, 200);
  assert.equal(none.data.total, 0);
});
run('ITC-BH-129-AUTH | UC-129 | Out-of-scope warehouse filter and role without stocktake:read', async () => {
  assert.equal((await call('GET', '/stocktakes?warehouseId=' + wb._id, { as: worker })).status, 403);
  assert.equal((await call('GET', '/stocktakes', { as: sales })).status, 403);
  assert.equal((await call('GET', '/stocktakes')).status, 401);
});
run('ITC-BH-129-HTTP | UC-129 | Invalid pagination and unknown query key', async () => {
  assert.equal((await call('GET', '/stocktakes?page=0', { as: owner })).status, 400);
  assert.equal((await call('GET', '/stocktakes?limit=101', { as: owner })).status, 400);
  assert.equal((await call('GET', '/stocktakes?foo=1', { as: owner })).status, 400);
});

// ---------------------------------------------------------------- UC-132 Activate Stocktake Session
run('ITC-BH-132-AUTH | UC-132 | Staff not assigned to the session tries to activate', async () => {
  const res = await call('POST', '/stocktakes/' + stocktakeId + '/activate', { as: stranger, body: await op(stocktakeId) });
  assert.ok([400, 403].includes(res.status), String(res.status));
  assert.equal(await locks(stocktakeId), 0);
  assert.equal((await m.Stocktake.findById(stocktakeId)).workflowStatus, 'PLANNED');
});
run('ITC-BH-132-ERR | UC-132 | Activation with a stale version', async () => {
  const res = await call('POST', '/stocktakes/' + stocktakeId + '/activate', { as: worker, body: { idempotencyKey: key(), expectedVersion: 99 } });
  assert.ok(res.status >= 400 && res.status < 500, String(res.status));
  assert.equal(await locks(stocktakeId), 0);
  assert.equal(await m.StocktakeSnapshot.countDocuments({ stocktakeId }), 0);
});
run('ITC-BH-132-BASE | UC-132 | Assigned counter activates; book snapshot and location locks', async () => {
  const res = await call('POST', '/stocktakes/' + stocktakeId + '/activate', { as: worker, body: await op(stocktakeId) });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.data.workflowStatus, 'COUNTING');
  assert.equal(await locks(stocktakeId), 2);
  const snapshot = await m.StocktakeSnapshot.findOne({ stocktakeId });
  snapshotId = String(snapshot._id);
  assert.equal(snapshot.origin, 'BOOK');
  assert.equal(String(snapshot.bookQtyBase), '12');
  assert.equal(await qtyOf(bookA.balance), '12');
});
run('ITC-BH-132-LOCK | UC-132 | Locked location blocks a relocation while counting', async () => {
  const { createLocationMovement } = await import('../src/modules/location-movements/location-movement.service.js');
  const before = await m.TransferOrder.countDocuments();
  await assert.rejects(createLocationMovement(worker, { idempotencyKey: key(), warehouseId: String(wa._id), reason: 'Move during count', lines: [{ sourceBalanceId: String(bookA.balance._id), sourceBalanceVersion: 1, toLocationId: String(emptyA.loc._id), enteredUnit: 'PIECE', enteredQty: '4' }] }), { statusCode: 400 });
  assert.equal(await m.TransferOrder.countDocuments(), before);
});

// ---------------------------------------------------------------- UC-134 Record Stocktake Count
run('ITC-BH-134-AUTH | UC-134 | Unassigned staff and Owner try to record a count', async () => {
  const path = '/stocktakes/' + stocktakeId + '/counts';
  const body = async () => op(stocktakeId, { targetType: 'STOCK', snapshotId, countedQtyBase: '8' });
  assert.ok([400, 403].includes((await call('POST', path, { as: stranger, body: await body() })).status));
  assert.equal((await call('POST', path, { as: owner, body: await body() })).status, 403);
  assert.equal(await m.StocktakeCount.countDocuments({ stocktakeId }), 0);
});
run('ITC-BH-134-HTTP | UC-134 | Count DTO with both snapshot and location is rejected', async () => {
  const res = await call('POST', '/stocktakes/' + stocktakeId + '/counts', { as: worker, body: await op(stocktakeId, { targetType: 'STOCK', snapshotId, locationId: String(emptyA.loc._id), countedQtyBase: '8' }) });
  assert.equal(res.status, 400);
  assert.equal(await m.StocktakeCount.countDocuments({ stocktakeId }), 0);
});
run('ITC-BH-134-BASE | UC-134 | Assigned counter records 8 of 12 pieces', async () => {
  const res = await call('POST', '/stocktakes/' + stocktakeId + '/counts', { as: worker, body: await op(stocktakeId, { targetType: 'STOCK', snapshotId, countedQtyBase: '8' }) });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const count = await m.StocktakeCount.findOne({ stocktakeId, snapshotId });
  firstCountId = String(count._id);
  assert.equal(String(count.countedQtyBase), '8');
  assert.equal(String(count.countedBy), String(worker._id));
  assert.equal(await qtyOf(bookA.balance), '12');
});
run('ITC-BH-134-RECOUNT | UC-134 | Second count needs the previous attempt and a reason; history is kept', async () => {
  const path = '/stocktakes/' + stocktakeId + '/counts';
  assert.equal((await call('POST', path, { as: worker, body: await op(stocktakeId, { targetType: 'STOCK', snapshotId, countedQtyBase: '9' }) })).status, 400);
  const ok = await call('POST', path, { as: worker, body: await op(stocktakeId, { targetType: 'STOCK', snapshotId, countedQtyBase: '8', previousCountId: firstCountId, recountReason: 'Đếm lại xác nhận' }) });
  assert.equal(ok.status, 200, JSON.stringify(ok.body));
  assert.equal(await m.StocktakeCount.countDocuments({ stocktakeId, snapshotId }), 2);
  assert.equal(String((await m.StocktakeCount.findById(firstCountId)).countedQtyBase), '8');
});

// ---------------------------------------------------------------- UC-130 View stocktake details
run('ITC-BH-130-BASE | UC-130 | Detail shows book, latest count, difference and unit', async () => {
  const res = await call('GET', '/stocktakes/' + stocktakeId, { as: owner });
  assert.equal(res.status, 200);
  const line = res.data.lines.find(row => row.snapshotId === snapshotId);
  assert.equal(line.status, 'DIFFERENCE');
  assert.equal(line.differenceBase, '-4');
  assert.equal(line.sku, 'BH-TILE');
  assert.equal(line.uomName, 'Viên');
  assert.equal(res.data.counts.length, 2);
});
run('ITC-BH-130-ERR | UC-130 | Unknown and malformed stocktake identifiers', async () => {
  assert.equal((await call('GET', '/stocktakes/' + key(), { as: owner })).status, 404);
  assert.equal((await call('GET', '/stocktakes/not-a-document', { as: owner })).status, 400);
});
run('ITC-BH-130-AUTH | UC-130 | Staff of warehouse A opens a warehouse B session', async () => {
  assert.equal((await call('GET', '/stocktakes/' + otherStocktakeId, { as: worker })).status, 403);
  assert.equal((await call('GET', '/stocktakes/' + stocktakeId, { as: sales })).status, 403);
});

// ---------------------------------------------------------------- UC-136 Reconcile Stocktake Results
run('ITC-BH-136-ERR | UC-136 | Reconcile is blocked until the empty location and difference reason are recorded', async () => {
  const path = '/stocktakes/' + stocktakeId + '/reconcile';
  const blocked = await call('POST', path, { as: worker, body: await op(stocktakeId) });
  assert.equal(blocked.status, 400);
  assert.equal(await call('POST', '/stocktakes/' + stocktakeId + '/counts', { as: worker, body: await op(stocktakeId, { targetType: 'EMPTY_LOCATION', locationId: String(emptyA.loc._id), countedQtyBase: '0' }) }).then(r => r.status), 200);
  const noReason = await call('POST', path, { as: worker, body: await op(stocktakeId) });
  assert.equal(noReason.status, 400);
  assert.equal((await m.Stocktake.findById(stocktakeId)).workflowStatus, 'COUNTING');
});
run('ITC-BH-136-AUTH | UC-136 | Unassigned staff tries to reconcile', async () => {
  const latest = (await call('GET', '/stocktakes/' + stocktakeId, { as: worker })).data.lines.find(row => row.snapshotId === snapshotId);
  const reason = await call('POST', '/stocktakes/' + stocktakeId + '/count-reason', { as: worker, body: await op(stocktakeId, { snapshotId, countId: latest.latestCountId, reasonCode: 'LOST' }) });
  assert.equal(reason.status, 200, JSON.stringify(reason.body));
  const res = await call('POST', '/stocktakes/' + stocktakeId + '/reconcile', { as: stranger, body: await op(stocktakeId) });
  assert.ok([400, 403].includes(res.status), String(res.status));
  assert.equal((await m.Stocktake.findById(stocktakeId)).workflowStatus, 'COUNTING');
});
run('ITC-BH-136-BASE | UC-136 | Assigned counter reconciles; stock stays unchanged and locks stay', async () => {
  const res = await call('POST', '/stocktakes/' + stocktakeId + '/reconcile', { as: worker, body: await op(stocktakeId) });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.data.workflowStatus, 'RECONCILING');
  const doc = await m.Stocktake.findById(stocktakeId);
  assert.equal(doc.header.selectedCounts.length, 1);
  assert.equal(await qtyOf(bookA.balance), '12');
  assert.equal(await m.StockAdjustment.countDocuments({ 'header.stocktakeId': stocktakeId }), 0);
  assert.equal(await locks(stocktakeId), 2);
  const after = await call('POST', '/stocktakes/' + stocktakeId + '/counts', { as: worker, body: await op(stocktakeId, { targetType: 'STOCK', snapshotId, countedQtyBase: '12' }) });
  assert.equal(after.status, 400);
});

// ---------------------------------------------------------------- UC-146 Sign in to the system
run('ITC-BH-146-BASE | UC-146 | Valid username and password sign in', async () => {
  const res = await call('POST', '/auth/login', { body: { username: 'BH.Worker', password: PASSWORD } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.ok(res.data.accessToken);
  assert.equal(res.data.user.username, 'bh.worker');
  assert.ok(res.data.user.permissions.includes('stocktake:read'));
  assert.match(res.headers.get('set-cookie') ?? '', /refresh_token=/);
  assert.ok((await m.User.findById(worker._id)).lastLoginAt);
  assert.equal(await audits('LOGIN', worker), 1);
  const me = await call('GET', '/auth/me', { as: res.data.accessToken });
  assert.equal(me.status, 200);
  assert.equal(me.data.username, 'bh.worker');
});
run('ITC-BH-146-ALT | UC-146 | Sign in with email in a different letter case', async () => {
  const res = await call('POST', '/auth/login', { body: { username: 'BH.Sales@WMSD.test', password: PASSWORD } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.data.user.username, 'bh.sales');
});
run('ITC-BH-146-ERR | UC-146 | Wrong password and unknown account', async () => {
  const wrong = await call('POST', '/auth/login', { body: { username: 'bh.owner', password: 'Wrong-Pass9' } });
  assert.equal(wrong.status, 401);
  assert.equal(wrong.data?.accessToken, undefined);
  assert.equal((await m.User.findById(owner._id)).lastLoginAt ?? null, null);
  assert.equal((await call('POST', '/auth/login', { body: { username: 'nobody', password: PASSWORD } })).status, 401);
});
run('ITC-BH-146-HTTP | UC-146 | Missing password and invalid token', async () => {
  assert.equal((await call('POST', '/auth/login', { body: { username: 'bh.owner' } })).status, 400);
  assert.equal((await call('GET', '/auth/me', { as: 'not-a-token' })).status, 401);
});

// ---------------------------------------------------------------- UC-148 View account list
run('ITC-BH-148-BASE | UC-148 | Admin searches active accounts', async () => {
  const res = await call('GET', '/users?search=bh.&status=active&page=1&limit=50', { as: admin });
  assert.equal(res.status, 200);
  assert.equal(res.data.total, 6);
  const row = res.data.items.find(r => r.username === 'bh.sales');
  assert.equal(row.status, 'active');
  assert.equal(row.phone, '0912345678');
  assert.deepEqual(row.warehouseIds, [String(wa._id)]);
});
run('ITC-BH-148-ALT | UC-148 | Filter by role and by an unknown role', async () => {
  const warehouse = await call('GET', '/users?role=warehouse&limit=50', { as: admin });
  assert.deepEqual(warehouse.data.items.map(r => r.username).sort(), ['bh.counterb', 'bh.stranger', 'bh.worker']);
  const ghost = await call('GET', '/users?role=ghost', { as: admin });
  assert.equal(ghost.status, 200);
  assert.equal(ghost.data.total, 0);
});
run('ITC-BH-148-AUTH | UC-148 | Owner without user:read and anonymous request', async () => {
  assert.equal((await call('GET', '/users', { as: owner })).status, 403);
  assert.equal((await call('GET', '/users')).status, 401);
});
run('ITC-BH-148-HTTP | UC-148 | Invalid status filter', async () => {
  assert.equal((await call('GET', '/users?status=deleted', { as: admin })).status, 400);
});

// ---------------------------------------------------------------- UC-149 View account details
run('ITC-BH-149-BASE | UC-149 | Admin opens an account', async () => {
  const res = await call('GET', '/users/' + worker._id, { as: admin });
  assert.equal(res.status, 200);
  assert.equal(res.data.username, 'bh.worker');
  assert.equal(res.data.email, 'bh.worker@wmsd.test');
  assert.deepEqual(res.data.warehouseIds, [String(wa._id)]);
  assert.ok(res.data.permissions.includes('stocktake:update'));
  assert.ok(res.data.lastLogin);
  assert.equal(res.data.passwordHash, undefined);
});
run('ITC-BH-149-ERR | UC-149 | Unknown account', async () => {
  assert.equal((await call('GET', '/users/' + key(), { as: admin })).status, 404);
});
run('ITC-BH-149-AUTH | UC-149 | Warehouse Staff opens another account', async () => {
  assert.equal((await call('GET', '/users/' + owner._id, { as: worker })).status, 403);
});

// ---------------------------------------------------------------- UC-150 Create Staff Account
run('ITC-BH-150-BASE | UC-150 | Admin creates a staff account; emailed password signs in', async () => {
  mails.length = 0;
  const res = await call('POST', '/users', { as: admin, body: { username: 'BH.NewStaff', fullName: 'Nhân viên mới', roleCode: 'warehouse', email: 'New.Staff@WMSD.test', phone: '0912 345 679', warehouseIds: [String(wa._id)] } });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  createdUserId = res.data.id;
  const stored = await m.User.findById(createdUserId).select('+passwordHash');
  assert.equal(stored.username, 'bh.newstaff');
  assert.equal(stored.email, 'new.staff@wmsd.test');
  assert.equal(stored.phone, '0912345679');
  assert.match(stored.passwordHash, /^\$2[aby]\$/);
  assert.equal(mails.length, 1);
  assert.match(mails[0], /to=new\.staff@wmsd\.test/);
  const password = mails[0].split('\n').map(line => line.match(/(?:mật khẩu|password)[^:]*:\s*(\S+)/i)?.[1]).find(Boolean);
  assert.ok(password, 'password not found in mail');
  const login = await call('POST', '/auth/login', { body: { username: 'bh.newstaff', password } });
  assert.equal(login.status, 200);
});
run('ITC-BH-150-ERR | UC-150 | Duplicate username and inactive warehouse', async () => {
  const before = await m.User.countDocuments();
  const dup = await call('POST', '/users', { as: admin, body: { username: 'bh.newstaff', fullName: 'Trùng tên', roleCode: 'SALES', email: 'dup@wmsd.test' } });
  assert.equal(dup.status, 400);
  const closed = await call('POST', '/users', { as: admin, body: { username: 'bh.closed', fullName: 'Kho đóng', roleCode: 'WAREHOUSE', email: 'closed@wmsd.test', warehouseIds: [String(closedWarehouse._id)] } });
  assert.equal(closed.status, 400);
  const email = await call('POST', '/users', { as: admin, body: { username: 'bh.email', fullName: 'Trùng email', roleCode: 'SALES', email: 'NEW.STAFF@wmsd.test' } });
  assert.equal(email.status, 400);
  assert.equal(await m.User.countDocuments(), before);
});
run('ITC-BH-150-AUTH | UC-150 | Owner tries to create an account', async () => {
  const before = await m.User.countDocuments();
  assert.equal((await call('POST', '/users', { as: owner, body: { username: 'bh.byowner', fullName: 'Owner tạo', roleCode: 'SALES', email: 'byowner@wmsd.test' } })).status, 403);
  assert.equal(await m.User.countDocuments(), before);
});
run('ITC-BH-150-HTTP | UC-150 | Username of 2 characters and client-chosen password', async () => {
  assert.equal((await call('POST', '/users', { as: admin, body: { username: 'ab', fullName: 'Ngắn', roleCode: 'SALES', email: 'ab@wmsd.test' } })).status, 400);
  assert.equal((await call('POST', '/users', { as: admin, body: { username: 'bh.pw', fullName: 'Tự đặt', roleCode: 'SALES', email: 'pw@wmsd.test', password: 'Secret123' } })).status, 400);
});

// ---------------------------------------------------------------- UC-151 Update Staff Account Information
run('ITC-BH-151-BASE | UC-151 | Admin changes name, role and warehouse; new role applies at once', async () => {
  const before = (await m.User.findById(createdUserId)).version ?? 1;
  assert.equal((await call('GET', '/stocktakes', { as: { _id: createdUserId } })).status, 200);
  const res = await call('PUT', '/users/' + createdUserId, { as: admin, body: { fullName: 'Nhân viên bán hàng', roleCode: 'SALES', warehouseIds: [String(wb._id)] } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  const stored = await m.User.findById(createdUserId);
  assert.equal(stored.fullName, 'Nhân viên bán hàng');
  assert.deepEqual(stored.warehouseIds.map(String), [String(wb._id)]);
  assert.equal(stored.version, before + 1);
  assert.equal((await call('GET', '/stocktakes', { as: { _id: createdUserId } })).status, 403);
});
run('ITC-BH-151-ERR | UC-151 | Unknown role, inactive warehouse and unknown account', async () => {
  const snapshot = (await m.User.findById(createdUserId)).toObject();
  assert.equal((await call('PUT', '/users/' + createdUserId, { as: admin, body: { roleCode: 'GHOST' } })).status, 400);
  assert.equal((await call('PUT', '/users/' + createdUserId, { as: admin, body: { warehouseIds: [String(closedWarehouse._id)] } })).status, 400);
  assert.equal((await call('PUT', '/users/' + key(), { as: admin, body: { fullName: 'Không có' } })).status, 404);
  const stored = await m.User.findById(createdUserId);
  assert.equal(String(stored.roleId), String(snapshot.roleId));
  assert.deepEqual(stored.warehouseIds.map(String), snapshot.warehouseIds.map(String));
});
run('ITC-BH-151-HTTP | UC-151 | Email cannot be changed through the update form', async () => {
  assert.equal((await call('PUT', '/users/' + createdUserId, { as: admin, body: { email: 'other@wmsd.test' } })).status, 400);
  assert.equal((await m.User.findById(createdUserId)).email, 'new.staff@wmsd.test');
});
run('ITC-BH-151-AUTH | UC-151 | Owner tries to update an account', async () => {
  assert.equal((await call('PUT', '/users/' + createdUserId, { as: owner, body: { fullName: 'Owner sửa' } })).status, 403);
  assert.equal((await m.User.findById(createdUserId)).fullName, 'Nhân viên bán hàng');
});

// ---------------------------------------------------------------- UC-152 Change Staff Account Status
run('ITC-BH-152-BASE | UC-152 | Admin locks an account with a reason; session and sign-in are refused', async () => {
  const session = (await call('POST', '/auth/login', { body: { username: 'bh.stranger', password: PASSWORD } })).data.accessToken;
  const res = await call('PATCH', '/users/' + stranger._id + '/status', { as: admin, body: { isActive: false, reason: 'Nghỉ việc' } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  assert.equal(res.data.status, 'inactive');
  assert.equal(res.data.lockReason, 'Nghỉ việc');
  assert.equal(await audits('LOCK_USER', stranger), 1);
  assert.equal((await call('GET', '/auth/me', { as: session })).status, 401);
  assert.equal((await call('POST', '/auth/login', { body: { username: 'bh.stranger', password: PASSWORD } })).status, 401);
});
run('ITC-BH-152-ALT | UC-152 | Admin unlocks the account; sign-in works again', async () => {
  const res = await call('PATCH', '/users/' + stranger._id + '/status', { as: admin, body: { isActive: true } });
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'active');
  assert.equal(res.data.lockReason ?? null, null);
  assert.equal(await audits('UNLOCK_USER', stranger), 1);
  assert.equal((await call('POST', '/auth/login', { body: { username: 'bh.stranger', password: PASSWORD } })).status, 200);
});
run('ITC-BH-152-ERR | UC-152 | Lock without a reason and admin locking itself', async () => {
  assert.equal((await call('PATCH', '/users/' + sales._id + '/status', { as: admin, body: { isActive: false } })).status, 400);
  assert.equal((await call('PATCH', '/users/' + admin._id + '/status', { as: admin, body: { isActive: false, reason: 'Tự khóa' } })).status, 400);
  assert.equal((await m.User.findById(sales._id)).isActive, true);
  assert.equal((await m.User.findById(admin._id)).isActive, true);
});

// ---------------------------------------------------------------- UC-157 Change Staff Account Status (WBS duplicate row)
run('ITC-BH-157-BASE | UC-157 | Locking again with the same reason writes no second audit entry', async () => {
  await call('PATCH', '/users/' + sales._id + '/status', { as: admin, body: { isActive: false, reason: 'Tạm khóa' } });
  const again = await call('PATCH', '/users/' + sales._id + '/status', { as: admin, body: { isActive: false, reason: 'Tạm khóa' } });
  assert.equal(again.status, 200);
  assert.equal(await audits('LOCK_USER', sales), 1);
  await call('PATCH', '/users/' + sales._id + '/status', { as: admin, body: { isActive: true } });
});
run('ITC-BH-157-ERR | UC-157 | Unknown account', async () => {
  assert.equal((await call('PATCH', '/users/' + key() + '/status', { as: admin, body: { isActive: false, reason: 'Không có' } })).status, 404);
});
run('ITC-BH-157-AUTH | UC-157 | Owner tries to lock an account', async () => {
  assert.equal((await call('PATCH', '/users/' + worker._id + '/status', { as: owner, body: { isActive: false, reason: 'Owner khóa' } })).status, 403);
  assert.equal((await m.User.findById(worker._id)).isActive, true);
});

const planPayload = () => ({
  idempotencyKey: key(), warehouseId: String(wa._id), title: 'BachHM monthly ' + key(),
  frequency: 'MONTHLY', startDate: '2026-12-01T00:00:00.000Z',
  assignedCounterIds: [String(worker._id)], scope: { locationIds: [String(bookA.loc._id)] },
});
async function addPlan() {
  const body = planPayload();
  const res = await call('POST', '/stocktake-plans', { as: owner, body });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return { id: res.data.id, body };
}
async function addRole() {
  const body = { code: 'BH_' + key().toUpperCase(), name: 'Stock reviewer', permissionCodes: ['stocktake:read'] };
  const res = await call('POST', '/roles', { as: admin, body });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return { id: res.data.id, body };
}
async function roleEvent(id) {
  return m.AuditLog.findOne({ action: 'CREATE_ROLE', subjectId: { $in: [id, new mongoose.Types.ObjectId(id)] } }).orFail();
}

run('ITC-BH-141-BASE | UC-141 | Filter plans by title and warehouse', async () => {
  const { id, body } = await addPlan();
  const res = await call('GET', '/stocktake-plans?warehouseId=' + wa._id + '&q=' + encodeURIComponent(body.title), { as: owner });
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.items.map(p => p.id), [id]);
  assert.equal(res.data.total, 1);
});
run('ITC-BH-141-EMPTY | UC-141 | Search for an absent plan', async () => {
  const res = await call('GET', '/stocktake-plans?q=' + key(), { as: owner });
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.items, []);
  assert.equal(res.data.total, 0);
});
run('ITC-BH-142-BASE | UC-142 | Read the plan and resolve its counter and location', async () => {
  const { id } = await addPlan();
  const res = await call('GET', '/stocktake-plans/' + id, { as: worker });
  assert.equal(res.status, 200);
  assert.equal(res.data.id, id);
  assert.equal(res.data.workflowStatus, 'ACTIVE');
  assert.deepEqual(res.data.lookups.counters.map(c => c.id), [String(worker._id)]);
  assert.deepEqual(res.data.lookups.locations.map(l => l.id), [String(bookA.loc._id)]);
});
run('ITC-BH-142-MISSING | UC-142 | Look up an absent plan', async () => {
  const res = await call('GET', '/stocktake-plans/KHKK-BA-261128-999999', { as: owner });
  assert.equal(res.status, 404);
});
run('ITC-BH-143-BASE | UC-143 | Create an active monthly plan', async () => {
  const { id, body } = await addPlan();
  const saved = await m.StocktakePlan.findById(id).orFail();
  assert.equal(saved.workflowStatus, 'ACTIVE');
  assert.equal(saved.header.title, body.title);
  assert.equal(saved.header.nextDueAt.toISOString(), body.startDate);
  assert.equal(saved.header.generatedCount, 0);
});
run('ITC-BH-143-DATES | UC-143 | Reject end date before start', async () => {
  const body = { ...planPayload(), endDate: '2026-11-01T00:00:00.000Z' };
  const res = await call('POST', '/stocktake-plans', { as: owner, body });
  assert.equal(res.status, 400);
  assert.equal(await m.StocktakePlan.countDocuments({ 'header.title': body.title }), 0);
});
run('ITC-BH-158-BASE | UC-158 | List a newly created role and its permission', async () => {
  const { id } = await addRole();
  const res = await call('GET', '/roles', { as: admin });
  assert.equal(res.status, 200);
  const role = res.data.find(r => r.id === id);
  assert.deepEqual(role.permissions, ['stocktake:read']);
  assert.equal(role.userCount, 0);
});
run('ITC-BH-159-BASE | UC-159 | Persist the role and its permission', async () => {
  const { id, body } = await addRole();
  const saved = await m.Role.findById(id).populate('permissionIds').orFail();
  assert.equal(saved.code, body.code);
  assert.deepEqual(saved.permissionIds.map(p => p.code), body.permissionCodes);
  assert.equal(saved.isSystemRole, false);
});
run('ITC-BH-159-DUP | UC-159 | Reject an existing role code', async () => {
  const { body } = await addRole();
  const res = await call('POST', '/roles', { as: admin, body });
  assert.equal(res.status, 409);
  assert.equal(await m.Role.countDocuments({ code: body.code }), 1);
});
run('ITC-BH-167-BASE | UC-167 | Filter audit history for the admin role creation', async () => {
  const { id } = await addRole();
  const event = await roleEvent(id);
  const res = await call('GET', '/system/audit-logs?action=CREATE_ROLE&result=SUCCESS&actorId=' + admin._id, { as: admin });
  assert.equal(res.status, 200);
  assert.ok(res.data.items.some(e => e.id === String(event._id)));
  assert.ok(res.data.items.every(e => e.action === 'CREATE_ROLE' && e.actor.id === String(admin._id) && e.result === 'SUCCESS'));
});
run('ITC-BH-168-BASE | UC-168 | Read the recorded role creation changes', async () => {
  const { id, body } = await addRole();
  const event = await roleEvent(id);
  const res = await call('GET', '/system/audit-logs/' + event._id, { as: admin });
  assert.equal(res.status, 200);
  assert.equal(res.data.subjectId, id);
  assert.equal(res.data.actor.id, String(admin._id));
  assert.ok(res.data.changes.some(c => c.field === 'code' && c.after === body.code));
});
run('ITC-BH-168-MISSING | UC-168 | Look up an absent audit event', async () => {
  const res = await call('GET', '/system/audit-logs/' + key(), { as: admin });
  assert.equal(res.status, 404);
});
