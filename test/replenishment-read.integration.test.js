import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import * as models from '../src/models/index.js';
import { buildDemoData } from '../src/seeds/data/demo.data.js';
import { listQuerySchema } from '../src/modules/replenishments/replenishment.validation.js';
import { buildListPipeline } from '../src/modules/replenishments/replenishment.service.js';

const id = () => new mongoose.Types.ObjectId();
const str = (value) => String(value);
const permission = 'replenishment_request:read';

test('UC-01/02 HTTP reads use real MongoDB, enforce scope and preserve business state', {
  skip: !process.env.MONGODB_TEST_URI,
}, async (t) => {
  const dbName = `sep490_rr_read_verification_${id()}`;
  let server;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName, autoIndex: false, serverSelectionTimeoutMS: 5000 });
    for (const Model of Object.values(models).filter((value) => value?.modelName)) await Model.createIndexes();
    const demo = await buildDemoData();
    for (const { Model, documents } of demo) if (documents.length) await Model.insertMany(documents);

    const users = await models.User.find().lean();
    const owner = users.find((user) => user.username === 'owner@ceratile.vn');
    const sales = users.find((user) => user.username === 'sales@ceratile.vn');
    const accountant = users.find((user) => user.username === 'accountant@ceratile.vn');
    const warehouse = users.find((user) => user.username === 'warehouse@ceratile.vn');
    const warehouse2 = users.find((user) => user.username === 'warehouse2@ceratile.vn');
    const admin = users.find((user) => user.username === 'admin@ceratile.vn');
    const warehouses = await models.Warehouse.find().lean();
    const wh = (code) => warehouses.find((item) => item.code === code)._id;
    const roles = await models.Role.find().lean();
    const role = (code) => roles.find((item) => item.code === code);
    const approvedDemo = await models.BusinessDocument.findOne({ documentNo: 'DEMO-RR' }).lean();
    const salesDemo = await models.BusinessDocument.findOne({ documentNo: 'DEMO-RR-SALES' }).lean();
    const stocktakeDemo = await models.BusinessDocument.findOne({ documentNo: 'DEMO-RR-STOCKTAKE' }).lean();

    async function rr(code, creator = sales, warehouseId = wh('WH01'), extra = {}) {
      return models.BusinessDocument.create({
        documentKind: 'REPLENISHMENT', documentNo: `RRHTTP-${code}`, createdBy: creator._id,
        workflowStatus: 'DRAFT', version: 1, createdAt: new Date('2026-10-27T09:00:00Z'),
        header: { warehouseId, neededOn: new Date('2026-10-29T00:00:00Z'), creationKey: `rrhttp:${code}`,
          triggerReason: 'HTTP test request' }, ...extra,
      });
    }
    const uom = await models.Uom.create({ code: 'HTTPUNIT', name: 'Test unit' });
    const product = await models.Product.create({ sku: 'HTTP-P', name: 'Current product name', baseUomId: uom._id, wholeBaseUnits: false });
    const conversion = await models.ProductUomVersion.create({ productId: product._id, uomId: uom._id,
      version: 1, basePerUnit: '3', validFrom: new Date('2026-01-01') });
    await models.ProductUomVersion.create({ productId: product._id, uomId: uom._id,
      version: 2, basePerUnit: '9', validFrom: new Date('2026-10-01') });
    async function line(document, lineNo = 1, extra = {}) {
      return models.DocumentLine.create({ documentId: document._id, lineNo, lineKind: 'REPLENISHMENT',
        productId: product._id, conversionId: conversion._id, enteredQty: '0.1', conversionSnapshot: '3',
        qtyBase: '0.3', productNameSnapshot: 'Historical product name',
        details: { triggerType: 'MANUAL_OTHER', reasonNote: 'Test reserve reason' }, ...extra });
    }
    const current = await rr('CURRENT', sales, wh('WH01'), { workflowStatus: 'APPROVED' });
    const currentLine = await line(current);
    for (let lineNo = 2; lineNo <= 4; lineNo++) await line(current, lineNo);
    const revised = await rr('REVISED', sales, wh('WH01'), { version: 2, workflowStatus: 'REJECTED' });
    const revisedLine = await line(revised);
    async function approval(document, documentVersion, decision, approvedLine, approvedQty = '0.3') {
      return models.Approval.create({ documentId: document._id, documentVersion, decisionKind: 'REPLENISHMENT_APPROVAL',
        decision, requestedBy: sales._id, decidedBy: owner._id, decidedAt: new Date(`2026-10-${25 + documentVersion}T10:00:00Z`),
        reason: `Decision ${documentVersion}`, lines: approvedLine ? [{ lineId: approvedLine._id, approvedQty, outcome: decision }] : [] });
    }
    await approval(current, 1, 'APPROVE', currentLine, '0');
    await approval(revised, 1, 'APPROVE', revisedLine);
    await approval(revised, 2, 'REJECT', revisedLine, '0');
    const stale = await rr('STALE', sales, wh('WH01'), { version: 2, workflowStatus: 'REVISION_REQUIRED' });
    const staleLine = await line(stale);
    await approval(stale, 1, 'APPROVE', staleLine);
    const legacy = await rr('MISSING');
    await line(legacy, 1, { productId: id(), conversionId: id() });
    const foreign = await rr('FOREIGN', warehouse2); // Its creator has no WH01 assignment.
    const noLines = await rr('EMPTY');
    const dates = [
      '2026-10-26T16:59:59.999Z', '2026-10-26T17:00:00.000Z',
      '2026-10-27T16:59:59.999Z', '2026-10-27T17:00:00.000Z',
    ];
    for (let i = 0; i < dates.length; i++) await rr(`DATE-${i}`, sales, wh('WH01'), { createdAt: new Date(dates[i]) });

    const soLine = await models.DocumentLine.findById((await models.DocumentLine.findOne({ documentId: salesDemo._id,
      'details.triggerType': 'SALES_SHORTAGE' }).lean()).details.sourceSalesOrderLineId).lean();
    const wir = await models.BusinessDocument.create({ documentKind: 'ISSUE_REQUEST', documentNo: 'RRHTTP-WIR',
      createdBy: sales._id, header: { salesOrderId: soLine.documentId, requestedWarehouseId: wh('WH01'),
        neededOn: new Date('2026-10-29'), deliveryAddressSnapshot: 'Test address' } });
    const wirLine = await models.DocumentLine.create({ documentId: wir._id, lineNo: 1, lineKind: 'ISSUE_REQUEST',
      productId: soLine.productId, conversionId: soLine.conversionId, enteredQty: '1', conversionSnapshot: '1', qtyBase: '1',
      productNameSnapshot: 'WIR product', details: { salesOrderLineId: soLine._id, releaseKey: 'http-release' } });
    const po = await models.BusinessDocument.findOne({ documentNo: 'DEMO-PO' }).lean();
    const poLine = await models.DocumentLine.findOne({ documentId: po._id }).lean();
    const allocations = await models.DemandSupplyAllocation.insertMany([
      { demandLineId: soLine._id, supplyLineId: poLine._id, qtyBase: '1', status: 'PLANNED' },
      { demandLineId: wirLine._id, supplyLineId: poLine._id, qtyBase: '2', status: 'CANCELLED' },
    ]);
    assert.ok(await models.DocumentLink.findOne({ parentDocumentId: approvedDemo._id, childDocumentId: po._id,
      relationCode: models.REPLENISHMENT_RELATIONS.PURCHASE }));
    const lineOnlyPo = await models.BusinessDocument.create({ documentKind: 'PO', documentNo: 'RRHTTP-LINE-ONLY-PO',
      createdBy: accountant._id, header: { warehouseId: wh('WH01'), supplierId: po.header.supplierId } });
    const lineOnlyPoLine = await models.DocumentLine.create({ documentId: lineOnlyPo._id, lineNo: 1,
      productId: poLine.productId, conversionId: poLine.conversionId, enteredQty: '1',
      conversionSnapshot: '1', qtyBase: '1', productNameSnapshot: 'PO product' });
    const missingPoLineId = id();
    const approvedDemoLine = await models.DocumentLine.findOne({ documentId: approvedDemo._id });
    await models.LineLink.create({ sourceLineId: approvedDemoLine._id, targetLineId: lineOnlyPoLine._id,
      relationCode: models.REPLENISHMENT_RELATIONS.PURCHASE, linkedQty: '1' });
    await models.LineLink.create({ sourceLineId: approvedDemoLine._id, targetLineId: missingPoLineId,
      relationCode: models.REPLENISHMENT_RELATIONS.PURCHASE, linkedQty: '1' });
    const missingSource = await rr('MISSING-SOURCE');
    const missingStocktakeId = id();
    const stocktakeSourceLine = await models.DocumentLine.findOne({ documentId: stocktakeDemo._id }).lean();
    await line(missingSource, 1, { details: { ...stocktakeSourceLine.details, sourceStocktakeId: missingStocktakeId,
      quantityAdjustmentReason: 'Historical quantity adjustment' } });

    const store = await models.Party.findOne({ kind: 'STORE' }).lean();
    const otherOwner = await models.Party.findOne({ kind: 'SUPPLIER' }).lean();
    let lotNumber = 0;
    let locationNumber = 0;
    async function stock(quantity, { warehouseId = wh('WH01'), kind = 'STORAGE', allocatable = true,
      active = true, qualityCode = 'GOOD', ownerPartyId = store._id, identificationStatus = 'VERIFIED', transit = false } = {}) {
      const location = await models.Location.create({ warehouseId, kind, code: `RRHTTP-LOC-${++locationNumber}`,
        allocatable: kind === 'STORAGE' && allocatable, isActive: active });
      const account = await models.StockAccount.create(transit ? { transitDispatchLineId: id() } : { locationId: location._id });
      const lot = await models.Lot.create({ productId: product._id, manufacturerLot: `RRHTTP-LOT-${++lotNumber}`,
        tone: 'T1', calibre: 'C1', identificationStatus });
      const balance = await models.StockBalance.create({ accountId: account._id, lotId: lot._id, qualityCode, ownerPartyId, qtyBase: quantity });
      return { location, account, lot, balance };
    }
    const available1 = await stock('0.1');
    const available2 = await stock('0.2');
    const held = await stock('99');
    await models.DefectHold.create({ defectDocumentId: id(), balanceId: held.balance._id, qtyBase: '1',
      evidenceId: id(), recordedBy: warehouse._id, status: 'ACTIVE' });
    const frozen = await stock('77');
    await models.LocationLock.create({ locationId: frozen.location._id, stocktakeId: id() });
    for (const options of [
      { kind: 'RECEIVING' }, { kind: 'STAGING' }, { kind: 'QUARANTINE' }, { kind: 'CUSTODY' },
      { allocatable: false }, { active: false }, { qualityCode: 'DAMAGED' }, { identificationStatus: 'UNKNOWN' },
      { ownerPartyId: otherOwner._id }, { transit: true }, { warehouseId: wh('WH03') },
    ]) await stock('100', options);
    await models.Reservation.insertMany([
      ...['0.03', '0.02'].map((qtyBase) => ({ demandLineId: soLine._id, executionLineId: id(),
        balanceId: available1.balance._id, qtyBase, status: 'ACTIVE' })),
      { demandLineId: soLine._id, executionLineId: id(), balanceId: available1.balance._id, qtyBase: '90', status: 'RELEASED' },
      { demandLineId: soLine._id, executionLineId: id(), balanceId: available2.balance._id, qtyBase: '90', status: 'CONSUMED' },
    ]);
    const activeWirReservation = await models.Reservation.create({ demandLineId: wirLine._id, executionLineId: id(),
      balanceId: held.balance._id, qtyBase: '1', status: 'ACTIVE' });

    const scopedOwner = await models.User.create({ username: 'rr-scoped-owner', fullName: 'Scoped Owner', passwordHash: 'not-used',
      isActive: true, roleId: role('OWNER')._id, warehouseIds: [wh('WH01')] });
    const inactive = await models.User.create({ username: 'rr-inactive', fullName: 'Inactive', passwordHash: 'not-used',
      isActive: false, roleId: role('SALES')._id, warehouseIds: [wh('WH01')] });

    process.env.JWT_SECRET = 'rr-http-integration-only';
    const { default: app } = await import('../src/app.js');
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}/api/replenishments`;
    async function request(path = '', user = owner) {
      const headers = user ? { Authorization: `Bearer ${jwt.sign({ userId: str(user._id) }, process.env.JWT_SECRET)}` } : {};
      const response = await fetch(`${base}${path}`, { headers });
      return { status: response.status, body: await response.json() };
    }
    async function ok(path, user) {
      const result = await request(path, user);
      assert.equal(result.status, 200, JSON.stringify(result.body));
      return result.body.data;
    }

    await t.test('authentication, catalogue roles and active-user state are enforced', async () => {
      assert.equal((await request('', null)).status, 401);
      assert.equal((await request('', inactive)).status, 401);
      assert.equal((await request('', admin)).status, 403);
      const rrPermission = await models.Permission.findOne({ code: permission }).lean();
      await models.Role.collection.updateOne({ _id: role('ADMIN')._id }, { $addToSet: { permissionIds: rrPermission._id } });
      try { assert.equal((await request('', admin)).status, 403); }
      finally { await models.Role.collection.updateOne({ _id: role('ADMIN')._id }, { $set: { permissionIds: role('ADMIN').permissionIds } }); }
      await models.Role.collection.updateOne({ _id: role('OWNER')._id }, { $pull: { permissionIds: rrPermission._id } });
      try { assert.equal((await request('', owner)).status, 403); }
      finally { await models.Role.collection.updateOne({ _id: role('OWNER')._id }, { $set: { permissionIds: role('OWNER').permissionIds } }); }
    });

    await t.test('all four business roles use their warehouse and creator scopes, including direct URLs', async () => {
      for (const user of [owner, accountant, sales, warehouse, warehouse2]) {
        const response = await ok('?limit=100', user);
        const broad = [owner, accountant].includes(user);
        for (const item of response.items) {
          if (user !== owner) assert.ok(user.warehouseIds.some((id) => str(id) === item.warehouse.id));
          if (!broad) assert.equal(item.createdBy.id, str(user._id));
        }
      }
      assert.equal((await request(`/${approvedDemo._id}`, sales)).status, 404);
      const missing = await request(`/${id()}`, sales);
      const outside = await request(`/${foreign._id}`, warehouse2);
      const wrongKind = await request(`/${po._id}`, sales);
      assert.deepEqual(outside, missing);
      assert.deepEqual(wrongKind, missing);
      assert.equal((await ok(`?createdBy=${warehouse._id}`, sales)).total, 0);
      assert.ok((await ok(`?warehouseId=${str(wh('WH01')).toUpperCase()}`, owner)).total > 0);
      assert.equal((await request(`?warehouseId=${wh('WH03')}`, warehouse)).status, 403);
    });

    await t.test('current assignments are reloaded; empty scope stays empty and single-role users use current grants', async () => {
      await models.User.collection.updateOne({ _id: sales._id }, { $set: { warehouseIds: [] } });
      try {
        assert.deepEqual((await ok('', sales)).items, []);
        assert.equal((await request(`/${current._id}`, sales)).status, 404);
      } finally { await models.User.collection.updateOne({ _id: sales._id }, { $set: { warehouseIds: sales.warehouseIds } }); }
      assert.ok((await ok('?limit=100', scopedOwner)).items.some((item) => item.id === str(approvedDemo._id)));
      assert.ok((await ok('?limit=100', scopedOwner)).items.some((item) => item.id === str(stocktakeDemo._id)));
      assert.equal((await ok(`/${stocktakeDemo._id}`, scopedOwner)).id, str(stocktakeDemo._id));
      assert.ok((await ok(`?warehouseId=${wh('WH02')}`, scopedOwner)).items.some((item) => item.id === str(stocktakeDemo._id)));
      await models.User.collection.updateOne({ _id: scopedOwner._id }, { $set: { warehouseIds: [] } });
      try {
        const detail = await ok(`/${stocktakeDemo._id}`, scopedOwner);
        assert.equal(detail.id, str(stocktakeDemo._id));
        assert.ok(detail.lines[0].source.references.some((ref) => ref.documentKind === 'STOCKTAKE' && ref.access === 'READABLE'));
        assert.ok((await ok(`/${approvedDemo._id}`, scopedOwner)).purchaseReferences.every((ref) => ref.access === 'READABLE'));
        assert.ok((await ok('?limit=100', scopedOwner)).total > 0);
        assert.ok((await ok(`?warehouseId=${wh('WH02')}`, scopedOwner)).total > 0);
      } finally { await models.User.collection.updateOne({ _id: scopedOwner._id }, { $set: { warehouseIds: [wh('WH01')] } }); }
      const rrPermission = await models.Permission.findOne({ code: permission }).lean();
      await models.Role.collection.updateOne({ _id: role('OWNER')._id }, { $pull: { permissionIds: rrPermission._id } });
      try { assert.equal((await request('', scopedOwner)).status, 403); }
      finally { await models.Role.collection.updateOne({ _id: role('OWNER')._id }, { $set: { permissionIds: role('OWNER').permissionIds } }); }
    });

    await t.test('HTTP validation rejects unknown, duplicate, injected and malformed query/ID inputs', async () => {
      for (const path of [
        '/bad-id', '?page=0', '?limit=101', '?page=1&page=2', '?search[$ne]=x',
        '?warehouseId[$ne]=x', '?createdBy=bad', '?status=pending', '?sort=secret',
        '?createdFrom=2026-02-29', '?createdFrom=2026-10-28&createdTo=2026-10-27',
      ]) assert.equal((await request(path)).status, 400, path);
      assert.equal((await ok('?search=RRHTTP-%5B')).total, 0);
    });

    await t.test('list defaults, preview counts, empty results and stable pagination are correct', async () => {
      const defaults = await ok('');
      assert.equal(defaults.page, 1);
      assert.equal(defaults.limit, 10);
      const list = await ok('?search=RRHTTP-CURRENT');
      assert.equal(list.total, 1);
      assert.equal(list.items[0].lineCount, 4);
      assert.equal(list.items[0].linePreview.length, 3);
      assert.deepEqual(list.items[0].linePreview.map((line) => line.lineNo), [1, 2, 3]);
      const full = await ok('?search=RRHTTP&limit=100');
      const first = await ok('?search=RRHTTP&limit=2');
      const second = await ok('?search=RRHTTP&limit=2&page=2');
      assert.equal(first.total, full.total);
      assert.deepEqual([...first.items, ...second.items].map((item) => item.id), full.items.slice(0, 4).map((item) => item.id));
      assert.deepEqual((await ok('?page=10000')).items, []);
      assert.equal((await ok('?search=does-not-exist')).total, 0);
      assert.equal((await ok(`?search=${noLines.documentNo}`)).items[0].lineCount, 0);
    });

    await t.test('created-date filtering includes exactly the Vietnam calendar-day boundaries', async () => {
      const list = await ok('?search=RRHTTP-DATE&createdFrom=2026-10-27&createdTo=2026-10-27');
      assert.equal(list.total, 2);
      assert.deepEqual(list.items.map((item) => item.documentNo), ['RRHTTP-DATE-2', 'RRHTTP-DATE-1']);
    });

    await t.test('decision filters use the newest RR decision before count/pagination, and do not reuse stale approvals', async () => {
      const rejected = await ok('?search=RRHTTP-REVISED&approvalDecision=REJECT&limit=1');
      assert.equal(rejected.total, 1);
      assert.equal(rejected.items[0].latestDecision.documentVersion, 2);
      assert.equal((await ok('?search=RRHTTP-REVISED&approvalDecision=APPROVE')).total, 0);
      assert.equal((await ok('?search=RRHTTP-EMPTY&approvalDecision=NONE')).total, 1);
      const detail = await ok(`/${revised._id}`);
      assert.deepEqual(detail.approvalHistory.map((entry) => entry.documentVersion), [2, 1]);
      assert.equal(detail.lines[0].approvedQtyBase, null);
      const staleDetail = await ok(`/${stale._id}`);
      assert.equal(staleDetail.lines[0].approvedQtyBase, null);
      assert.equal(staleDetail.latestDecision.isForCurrentVersion, false);
      assert.equal((await ok(`/${current._id}`)).lines[0].approvedQtyBase, '0');
    });

    await t.test('availability excludes all ineligible dimensions and preserves exact historical quantities/UOM', async () => {
      const detail = await ok(`/${current._id}`);
      for (const entry of detail.lines) {
        assert.equal(entry.currentStock.availableQtyBase, '0.25');
        assert.equal(entry.currentStock.scope, 'PRODUCT_WAREHOUSE');
        assert.equal(entry.conversionVersion, 1);
        assert.equal(entry.conversionSnapshot, '3');
        assert.equal(entry.enteredQty, '0.1');
        assert.equal(entry.qtyBase, '0.3');
        assert.equal(entry.product.name, 'Historical product name');
        assert.equal(entry.baseUom.code, 'HTTPUNIT');
      }
      const absent = await ok(`/${legacy._id}`);
      assert.equal(absent.lines[0].product.sku, null);
      assert.equal(absent.lines[0].enteredUom, null);
      assert.equal(absent.lines[0].conversionVersion, null);
      assert.equal(absent.lines[0].currentStock.availableQtyBase, '0');
      assert.equal(absent.lines[0].evaluationSnapshot.availableQtyBase, null);
      const missingSourceDetail = await ok(`/${missingSource._id}`);
      assert.equal(missingSourceDetail.lines[0].source.sourceStocktakeId, str(missingStocktakeId));
      assert.deepEqual(missingSourceDetail.lines[0].source.references[0], {
        id: str(missingStocktakeId), documentKind: 'STOCKTAKE', access: 'UNAVAILABLE',
      });
      await models.Product.collection.updateOne({ _id: product._id }, { $set: { isActive: false } });
      try { assert.equal((await ok(`/${current._id}`)).lines[0].currentStock.availableQtyBase, '0'); }
      finally { await models.Product.collection.updateOne({ _id: product._id }, { $set: { isActive: true } }); }
      await models.Warehouse.collection.updateOne({ _id: wh('WH01') }, { $set: { isActive: false } });
      try { assert.equal((await ok(`/${current._id}`)).lines[0].currentStock.availableQtyBase, '0'); }
      finally { await models.Warehouse.collection.updateOne({ _id: wh('WH01') }, { $set: { isActive: true } }); }
    });

    await t.test('inconsistent reservations fail instead of returning fabricated zero', async () => {
      const broken = await models.Reservation.create({ demandLineId: id(), executionLineId: id(),
        balanceId: available1.balance._id, qtyBase: '1', status: 'ACTIVE' });
      try {
        const response = await request(`/${current._id}`);
        assert.equal(response.status, 500);
        assert.match(response.body.message, /không nhất quán/);
      } finally { await models.Reservation.deleteOne({ _id: broken._id }); }
    });

    await t.test('all trigger types stay distinct and stored snapshots survive a change in current stock', async () => {
      const before = await ok(`/${salesDemo._id}`, sales);
      assert.deepEqual(before.lines.map((entry) => entry.source.triggerType), ['SALES_SHORTAGE', 'MANUAL_OTHER']);
      assert.equal(before.lines[0].source.sourceIssueRequestLineId, null);
      assert.equal(before.lines[1].source.sourceSalesOrderLineId, null);
      assert.equal(before.lines[1].product.sku, 'GACH-DEMO-2');
      assert.deepEqual(before.lines[1].evaluationSnapshot, {
        evaluationKey: 'demo:manual-reserve:product2:v1',
        evaluatedAt: '2026-10-27T09:00:00.000Z',
        suggestedQtyBase: '20',
        availableQtyBase: '0',
        otherWarehouseCoverageQtyBase: '0',
        remainingDemandQtyBase: '20',
        reservedForDemandQtyBase: '0',
        onHandCoverageQtyBase: '0',
        incomingCoverageQtyBase: '0',
        pendingRequestCoverageQtyBase: '0',
        minimumQtyBase: '20',
        targetQtyBase: '20',
      });
      assert.equal((await ok(`/${stocktakeDemo._id}`)).lines[0].source.triggerType, 'STOCKTAKE_LOW_STOCK');
      const original = await models.StockBalance.findOne({ lotId: { $ne: available1.lot._id }, qtyBase: { $gt: 0 } }).lean();
      // The controlled test changes a live balance; the GET must never rewrite its saved evaluation.
      await models.StockBalance.collection.updateOne({ _id: original._id }, { $set: { qtyBase: mongoose.Types.Decimal128.fromString('0') } });
      try { assert.deepEqual((await ok(`/${salesDemo._id}`, sales)).lines[0].evaluationSnapshot, before.lines[0].evaluationSnapshot); }
      finally { await models.StockBalance.collection.updateOne({ _id: original._id }, { $set: { qtyBase: original.qtyBase } }); }
    });

    await t.test('allocations/reservations use canonical SO lines without duplicating stored records', async () => {
      const detail = await ok(`/${salesDemo._id}`, sales);
      for (const allocation of allocations) assert.equal(detail.allocations.filter((item) => item.id === str(allocation._id)).length, 1);
      for (const item of detail.allocations) assert.equal(item.canonicalSalesOrderLineId, str(soLine._id));
      assert.ok(detail.allocations.some((item) => item.status === 'CANCELLED'));
      assert.ok(detail.reservations.some((item) => item.id === str(activeWirReservation._id)));
      assert.ok(detail.reservations.every((item) => item.status === 'ACTIVE'));
      assert.ok(detail.allocations.every((item) => item.supply.access === 'UNAVAILABLE'));
      assert.ok(detail.sourceLineLinks.some((item) => item.sourceLineId === str(soLine._id)));
      const text = JSON.stringify(detail);
      assert.equal(text.includes(po.documentNo), false);
      assert.equal(text.includes('objectKey'), false);
      assert.equal(text.includes('passwordHash'), false);
      assert.equal(text.includes('currentShortage'), false);
    });

    await t.test('PO header/line links are deduplicated, missing target identities survive and restricted metadata stays hidden', async () => {
      const detail = await ok(`/${approvedDemo._id}`);
      assert.equal(detail.workflowStatus, 'APPROVED');
      assert.equal(detail.purchaseReferences.length, 2);
      assert.ok(detail.purchaseReferences.some((item) => item.id === str(po._id)));
      assert.ok(detail.purchaseReferences.some((item) => item.id === str(lineOnlyPo._id)));
      assert.ok(detail.purchaseReferences.every((item) => item.access === 'READABLE'));
      assert.ok(detail.purchaseLineLinks.some((item) => item.purchaseLineId === str(missingPoLineId) && item.purchaseOrder === null));
      const rrPermission = await models.Permission.findOne({ code: permission }).lean();
      await models.Role.collection.updateOne({ _id: role('OWNER')._id }, { $set: { permissionIds: [rrPermission._id] } });
      try {
        const restricted = await ok(`/${approvedDemo._id}`);
        assert.ok(restricted.purchaseReferences.every((item) => item.access === 'UNAVAILABLE'));
        assert.ok(restricted.purchaseReferences.every((item) => !('documentNo' in item)));
        assert.equal(JSON.stringify(restricted).includes(po.documentNo), false);
      } finally { await models.Role.collection.updateOne({ _id: role('OWNER')._id }, { $set: { permissionIds: role('OWNER').permissionIds } }); }
    });

    await t.test('list enrichment query count stays constant as the number of page items grows', async () => {
      async function queryCount(limit) {
        let count = 0;
        mongoose.set('debug', (_collection, method) => { if (['find', 'findOne', 'aggregate'].includes(method)) count++; });
        try { await ok(`?limit=${limit}`); return count; }
        finally { mongoose.set('debug', false); }
      }
      assert.equal(await queryCount(1), await queryCount(100));
    });

    await t.test('warehouse and own-record list queries can use the declared compound indexes', async () => {
      for (const [user, index] of [
        [owner, { documentKind: 1, 'header.warehouseId': 1, createdAt: -1, _id: -1 }],
        [sales, { documentKind: 1, createdBy: 1, 'header.warehouseId': 1, createdAt: -1, _id: -1 }],
      ]) {
        const populated = await models.User.findById(user._id).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
        const query = listQuerySchema.parse({ warehouseId: str(wh('WH01')) });
        const explain = await models.BusinessDocument.aggregate(buildListPipeline(populated, query)).hint(index).explain('executionStats');
        assert.match(JSON.stringify(explain), /IXSCAN/);
      }
    });

    await t.test('repeated successful/invalid GETs do not change any persisted collection', async () => {
      async function snapshot() {
        const collections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
        const result = {};
        for (const { name } of collections.sort((a, b) => a.name.localeCompare(b.name))) {
          if (!name.startsWith('system.')) result[name] = JSON.stringify(await mongoose.connection.db.collection(name).find().sort({ _id: 1 }).toArray());
        }
        return result;
      }
      const before = await snapshot();
      for (let repeat = 0; repeat < 2; repeat++) {
        await ok('?limit=100&approvalDecision=NONE');
        await ok(`/${current._id}`);
        await ok(`/${salesDemo._id}`, sales);
        await ok(`/${approvedDemo._id}`);
        await ok(`/${stocktakeDemo._id}`);
        await ok(`/${noLines._id}`);
        await request(`/${foreign._id}`, warehouse2);
        await request('?limit=0');
      }
      assert.deepEqual(await snapshot(), before);
    });
  } finally {
    mongoose.set('debug', false);
    if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
