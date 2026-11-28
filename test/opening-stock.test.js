import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { previewBody, createBody, openingRow } from '../src/modules/opening-stock/validation.js';
import * as service from '../src/modules/opening-stock/service.js';
import * as m from '../src/models/runtime.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';
import { newId } from '../src/shared/utils/document-command.js';
import { setupOpeningStock } from '../scripts/setup-opening-stock.mjs';
import { transaction } from '../src/shared/utils/persistence.js';
import { guardLocations, balanceAt, receiveStock, beginStock } from '../src/shared/utils/stock.js';

const key = () => String(newId());
const mongoUri = database => `mongodb://127.0.0.1:${process.env.MONGODB_TEST_PORT || 27119}/${database}?replicaSet=${process.env.MONGODB_TEST_REPLICA_SET || 'opening-test'}`;
const row = { sku: 'TEST', manufacturerLot: 'B1', locationCode: 'ST', enteredQty: '8', enteredUnit: 'PIECE' };
const body = () => ({ warehouseId: key(), openingAt: '2026-11-16T00:00:00Z', rows: [row] });

test('opening rows reference catalogue codes only and the request carries warehouse and cut-off', () => {
  assert.equal(previewBody.safeParse(body()).success, true);
  for (const field of ['warehouseId', 'openingAt']) {
    const { [field]: _omitted, ...rest } = body();
    assert.equal(previewBody.safeParse(rest).success, false);
  }
  assert.equal(previewBody.safeParse({ ...body(), openingAt: new Date(Date.now() + 3_600_000).toISOString() }).success, false);
  assert.equal(previewBody.safeParse({ ...body(), rows: [] }).success, false);
  assert.equal(previewBody.safeParse({ ...body(), rows: Array(1001).fill(row) }).success, false);
  assert.equal(previewBody.safeParse({ ...body(), confirmEmpty: true }).success, false);
  assert.equal(openingRow.safeParse(row).success, true);
  assert.equal(openingRow.safeParse({ ...row, manufacturerCode: 'TEST', color: 'White', warehouseCode: '', rowNo: 3 }).success, true);
  for (const field of ['locationCode', 'enteredUnit', 'sku']) {
    const { [field]: _omitted, ...rest } = row;
    assert.equal(openingRow.safeParse(rest).success, false, field);
  }
  for (const enteredQty of ['0', '-1', '1e4', 'NaN', '1,000', '0.0000001', '100000000000000']) {
    assert.equal(openingRow.safeParse({ ...row, enteredQty }).success, false, enteredQty);
  }
  for (const extra of [{ qualityStatus: 'GOOD' }, { ownerType: 'STORE' }, { piecesPerCarton: '4' }, { unitCost: '1000' }]) {
    assert.equal(openingRow.safeParse({ ...row, ...extra }).success, false);
  }
  const create = { ...body(), sourceDescription: 'File kiem-ke.xlsx', openingImportSource: 'FILE', idempotencyKey: key() };
  assert.equal(createBody.safeParse(create).success, true);
  assert.equal(createBody.safeParse({ ...create, openingImportSource: 'API' }).success, false);
  assert.equal(createBody.safeParse({ ...create, sourceDescription: '' }).success, false);
});

const enabled = process.env.RUN_OPENING_TESTS === '1';
test('Owner enters opening stock in parts against existing catalogue codes, then closes the warehouse', { skip: !enabled }, async () => {
  await mongoose.connect(mongoUri('opening_test_' + key()), { serverSelectionTimeoutMS: 5000 });
  try {
    for (const Model of m.models.values()) { await Model.createCollection(); await Model.createIndexes(); }
    const permissions = await m.Permission.insertMany(PERMISSION_CATALOGUE.map(p => ({ code: p.code, name: p.code, description: p.description })));
    const users = [];
    for (const code of ['OWNER', 'WAREHOUSE', 'SALES']) {
      const role = await m.Role.create({ code, name: code, permissionIds: permissions.filter(p => ROLE_PERMISSIONS[code].includes(p.code)).map(p => p._id) });
      const user = await m.User.create({ username: code, fullName: code, passwordHash: 'unused', roleId: role._id });
      users.push(await m.User.findById(user._id).populate({ path: 'roleId', populate: { path: 'permissionIds' } }));
    }
    const [owner, worker, sales] = users;
    const category = await m.Category.create({ code: 'TILE', name: 'Tile' });
    const [, box, m2, , hop1, hop2] = await m.Uom.create([{ code: 'PIECE', name: 'Viên' }, { code: 'BOX', name: 'Thùng', isCarton: true },
      { code: 'M2', name: 'Mét vuông', areaMm2: '1000000' }, { code: 'BAG', name: 'Bao' },
      { code: 'HOP1', name: 'Hộp', isCarton: true }, { code: 'HOP2', name: 'Hộp', isCarton: true }]);
    const tile = { categoryId: category._id, baseUnit: 'PIECE', wholeBaseUnits: true, lengthMm: '600', widthMm: '600', heightMm: '10' };
    const product = await m.Product.create({ ...tile, sku: 'TEST', manufacturerCode: 'TEST', color: 'White', name: 'Test tile' });
    const carton = { identificationStatus: 'VERIFIED', cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50' };
    const b1 = await m.ProductBatch.create({ ...carton, productId: product._id, manufacturerLot: 'B1', piecesPerCarton: 4 });
    const b3 = await m.ProductBatch.create({ ...carton, productId: product._id, manufacturerLot: 'B3', piecesPerCarton: 3 });
    await m.ProductBatch.create({ ...carton, productId: product._id, manufacturerLot: 'UNVER', identificationStatus: 'UNKNOWN', piecesPerCarton: 4 });
    const conversion = (uom, basePerUnit, batch) => ({ productId: product._id, productBatchId: batch?._id ?? null, uomId: uom._id, basePerUnit,
      version: 1, validFrom: new Date(Date.now() - 60_000), verificationReference: 'test' });
    await m.Conversion.create([conversion(box, '4', b1), conversion(box, '3', b3), conversion(hop1, '4', b1), conversion(hop2, '4', b1), conversion(m2, '2.777777777778')]);
    for (const color of ['Red', 'Blue']) {
      const two = await m.Product.create({ ...tile, sku: 'TWO', manufacturerCode: 'TEST', color, name: 'Two ' + color });
      await m.ProductBatch.create({ ...carton, productId: two._id, manufacturerLot: 'L', piecesPerCarton: 4 });
    }

    const setup = async (code, locations = [{ code: 'ST' }]) => {
      const warehouse = await m.Warehouse.create({ code, name: code, lengthMm: '10000', widthMm: '10000', clearHeightMm: '3000' });
      for (const location of locations) {
        await m.WarehouseLocation.create({ warehouseId: warehouse._id, locationType: 'STORAGE', isPickable: true, usableLengthMm: '5000', usableWidthMm: '5000', ...location });
      }
      worker.warehouseIds.push(warehouse._id); await worker.save();
      return { warehouseId: String(warehouse._id), openingAt: '2026-11-16T00:00:00Z', rows: [row] };
    };
    const draft = (input, extra = {}) => ({ ...input, sourceDescription: 'Biên bản kiểm đếm', openingImportSource: 'FILE', idempotencyKey: key(), ...extra });
    const postBody = () => ({ expectedVersion: 1, idempotencyKey: key(), reason: 'Đã đối chiếu số đếm' });
    const balanceQty = async (warehouseId, code, batch = b1) => {
      const location = await m.WarehouseLocation.findOne({ warehouseId, code });
      const point = await m.StockHoldingPoint.findOne({ locationId: location._id });
      const balance = point && await m.InventoryBalance.findOne({ holdingPointId: point._id, batchId: batch._id });
      return balance ? String(balance.quantityBase) : '0';
    };
    // An ordinary receipt recorded by WMS at a given time.
    const ordinaryReceive = (warehouseId, code, batch, qtyBase, occurredAt) => transaction(async session => {
      const location = await m.WarehouseLocation.findOne({ warehouseId, code }).session(session);
      await guardLocations([location._id], session);
      const balance = await balanceAt({ type: 'LOCATION', locationId: location._id }, { batchId: batch._id, ownerType: 'STORE' }, 'GOOD', session);
      const posting = beginStock({ _id: newId(), version: 1, constructor: m.OpeningStock }, worker, 'TEST_RECEIPT', { idempotencyKey: key() });
      posting.occurredAt = occurredAt;
      await receiveStock(balance, { _id: newId(), productId: product._id, qtyBase }, null, posting, worker, session);
      await posting.save({ session });
    });

    // Owner only.
    const input = await setup('A', [{ code: 'ST' }, { code: 'ST2' }, { code: 'RECV', locationType: 'RECEIVING', isPickable: false }, { code: 'OFF', isActive: false }]);
    const other = await setup('B', [{ code: 'BONLY' }]);
    for (const actor of [worker, sales]) {
      await assert.rejects(service.options(actor), /quyền/);
      await assert.rejects(service.preview(actor, input), /quyền/);
      await assert.rejects(service.create(actor, draft(input)), /quyền/);
    }

    // Errors land on the right column; preview writes nothing.
    const bad = await service.preview(owner, { ...input, rows: [
      { ...row, sku: 'NOPE' }, { ...row, manufacturerLot: 'NOPE' }, { ...row, manufacturerLot: 'UNVER' }, { ...row, locationCode: 'NOPE' },
      { ...row, locationCode: 'RECV' }, { ...row, locationCode: 'OFF' }, { ...row, locationCode: 'BONLY' }, { ...row, warehouseCode: 'B' },
      { ...row, warehouseCode: 'a' }, { ...row, warehouseCode: '' }, { ...row, manufacturerLot: '' }, { ...row, qualityStatus: 'GOOD' },
    ] });
    assert.equal(bad.valid, false);
    const fieldOf = r => r.errors.map(e => e.field);
    assert.deepEqual(bad.rows.map(fieldOf), [['sku'], ['manufacturerLot'], ['manufacturerLot'], ['locationCode'], ['locationCode'], ['locationCode'],
      ['locationCode'], ['warehouseCode'], [], [], ['manufacturerLot'], ['qualityStatus']]);
    assert.match(bad.rows[6].errors[0].message, /Vị trí chưa có trong kho A/);
    assert.match(bad.rows[4].errors[0].message, /không phải khu lưu trữ/);
    assert.match(bad.rows[7].errors[0].message, /khác kho đã chọn A/);
    assert.deepEqual([bad.rows[8].status, bad.rows[9].status], ['OK', 'WARNING']);
    assert.equal(await m.OpeningStock.countDocuments(), 0);
    assert.equal(await m.StockHoldingPoint.countDocuments(), 0);
    assert.equal((await m.Warehouse.findById(input.warehouseId)).openingCutoffAt, undefined);

    // SKU with several products needs manufacturer and colour.
    const two = { ...row, sku: 'TWO', manufacturerLot: 'L' };
    const twoPreview = await service.preview(owner, { ...input, rows: [two, { ...two, color: 'red' }, { ...two, manufacturerCode: 'test', color: 'Blue' }] });
    assert.match(twoPreview.rows[0].errors[0].message, /SKU này có 2 sản phẩm/);
    assert.deepEqual(twoPreview.rows.slice(1).map(r => [r.status, r.product]), [['OK', 'Two Red'], ['OK', 'Two Blue']]);

    // D5 units: base or carton only, blocked before conversion; carton fractions must give whole pieces.
    const units = await service.preview(owner, { ...input, rows: [
      { ...row, enteredQty: '3', enteredUnit: 'BOX' }, { ...row, enteredQty: '0.1', enteredUnit: 'BOX' }, { ...row, enteredUnit: 'M2' },
      { ...row, enteredUnit: 'BAG' }, { ...row, enteredUnit: 'hộp' }, { ...row, enteredQty: '1', enteredUnit: 'hop1' }, { ...row, enteredUnit: 'Viên' },
      { ...row, enteredQty: '1.5' },
    ] });
    assert.deepEqual(units.rows.map(r => r.status === 'ERROR'), [false, true, true, true, true, false, false, true]);
    assert.equal(units.rows[0].quantityBase, '12');
    assert.match(units.rows[1].errors[0].message, /0\.1 Thùng × 4 = 0\.4 PIECE, không phải số nguyên/);
    assert.match(units.rows[2].errors[0].message, /không dùng được cho tồn đầu/);
    assert.match(units.rows[4].errors[0].message, /Tên ĐVT trùng nhiều mã \(HOP1, HOP2\)/);
    assert.ok(units.rows.every(r => !r.errors.length || ['enteredQty', 'enteredUnit'].includes(r.errors[0].field)));

    // First draft: 10 pieces of a 4-per-carton lot + 2.5 cartons of the same lot and location (warned, not blocked)
    // + 7 pieces of a 3-per-carton lot entered by carton (2 cartons) and by piece.
    const firstRows = [{ ...row, enteredQty: '10' }, { ...row, enteredQty: '2.5', enteredUnit: 'BOX' },
      { ...row, manufacturerLot: 'B3', enteredQty: '2', enteredUnit: 'BOX', locationCode: 'ST2' }, { ...row, manufacturerLot: 'B3', enteredQty: '7', locationCode: 'ST2' }];
    const firstPreview = await service.preview(owner, { ...input, rows: firstRows });
    assert.equal(firstPreview.valid, true);
    assert.equal(firstPreview.cutoffAt, '2026-11-16T00:00:00.000Z');
    assert.deepEqual(firstPreview.rows.map(r => r.status), ['OK', 'WARNING', 'OK', 'WARNING']);
    assert.match(firstPreview.rows[1].warnings[0].message, /Trùng lô và vị trí với dòng 1/);
    const firstBody = draft({ ...input, rows: firstRows });
    const first = await service.create(owner, firstBody);
    assert.equal((await service.create(owner, firstBody)).replayed, true);
    assert.match(first.id, /^TDK-/);
    assert.equal(await m.InventoryBalance.countDocuments(), 0);
    assert.equal((await m.Warehouse.findById(input.warehouseId)).openingCutoffAt.toISOString(), '2026-11-16T00:00:00.000Z');
    const firstDocument = await service.get(owner, first.id);
    assert.equal(firstDocument.header.openingImportSource, 'FILE');
    assert.equal(firstDocument.header.cutoverKey, 'TONDAU-A');
    assert.equal(firstDocument.header.warehouseId, input.warehouseId);
    assert.equal(firstDocument.header.coveredLocationIds.length, 2);
    assert.deepEqual(firstDocument.items.map(i => [i.lineNo, i.manufacturerLot, i.locationCode, i.packagingState, i.enteredUnit, i.enteredQty, i.baseUnitsPerUnit, i.qtyBase, i.measuredVolumeMm3]), [
      [1, 'B1', 'ST', 'SEALED', 'PIECE', '8', '1', '8', undefined],
      [2, 'B1', 'ST', 'LOOSE', 'PIECE', '2', '1', '2', '7200000'],
      [3, 'B1', 'ST', 'SEALED', 'BOX', '2', '4', '8', undefined],
      [4, 'B1', 'ST', 'LOOSE', 'PIECE', '2', '1', '2', '7200000'],
      [5, 'B3', 'ST2', 'SEALED', 'BOX', '2', '3', '6', undefined],
      [6, 'B3', 'ST2', 'SEALED', 'PIECE', '6', '1', '6', undefined],
      [7, 'B3', 'ST2', 'LOOSE', 'PIECE', '1', '1', '1', '3600000'],
    ]);
    assert.ok(firstDocument.items.every(i => i.qualityStatus === 'GOOD' && i.ownerType === 'STORE'));
    await assert.rejects(service.act(worker, first.id, 'post', postBody()), /quyền/);

    // Each document posts once: replay, stale version and concurrent posts.
    const firstPost = postBody();
    assert.equal((await service.act(owner, first.id, 'post', firstPost)).workflowStatus, 'POSTED');
    assert.equal((await service.act(owner, first.id, 'post', firstPost)).replayed, true);
    await assert.rejects(service.act(owner, first.id, 'post', postBody()));
    assert.equal(await m.StockTransaction.countDocuments({ operation: 'OPENING' }), 1);
    assert.equal(await balanceQty(input.warehouseId, 'ST'), '20');
    assert.equal(await balanceQty(input.warehouseId, 'ST2', b3), '13');

    // Second part for the same warehouse keeps the warehouse cut-off and warns about the same lot + location.
    const secondPreview = await service.preview(owner, { ...input, openingAt: '2026-11-20T00:00:00Z', rows: [{ ...row, enteredQty: '4' }] });
    assert.equal(secondPreview.valid, true);
    assert.equal(secondPreview.cutoffAt, '2026-11-16T00:00:00.000Z');
    assert.match(secondPreview.rows[0].warnings[0].message, new RegExp(`đã có trong phiếu ${first.id} \\(20 PIECE, Đã ghi\\)`));
    const second = await service.create(owner, draft({ ...input, openingAt: '2026-11-20T00:00:00Z', rows: [{ ...row, enteredQty: '4' }] }, { openingImportSource: 'MANUAL', sourceDescription: 'Nhập thủ công' }));
    const secondDocument = await m.OpeningStock.findById(second.id);
    assert.equal(secondDocument.header.openingAt.toISOString(), '2026-11-16T00:00:00.000Z');
    assert.equal(secondDocument.header.openingImportSource, 'MANUAL');
    const racing = await Promise.allSettled([service.act(owner, second.id, 'post', postBody()), service.act(owner, second.id, 'post', postBody())]);
    assert.equal(racing.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(await balanceQty(input.warehouseId, 'ST'), '24');

    // Options and closing: no close while a draft exists; a closed warehouse rejects preview, create and post.
    const pending = await service.create(owner, draft({ ...input, rows: [{ ...row, locationCode: 'ST2' }] }));
    let options = await service.options(owner);
    let summary = options.warehouses.find(w => w.code === 'A');
    assert.deepEqual([summary.closed, summary.draftCount, summary.postedCount, summary.cutoffAt], [false, 1, 2, '2026-11-16T00:00:00.000Z']);
    assert.ok(options.units.every(u => u.code !== 'M2'));
    assert.deepEqual(options.locations.filter(l => l.warehouseId === input.warehouseId).map(l => l.code).sort(), ['ST', 'ST2']);
    await assert.rejects(service.closeWarehouse(owner, input.warehouseId, { reason: 'Đã nhập xong' }), /Còn phiếu nháp/);
    await assert.rejects(service.closeWarehouse(worker, input.warehouseId, { reason: 'x' }), /quyền/);
    await service.act(owner, pending.id, 'cancel', postBody());
    const closed = await service.closeWarehouse(owner, input.warehouseId, { reason: 'Đã nhập xong' });
    assert.ok(closed.closedAt);
    assert.equal(await m.AuditLog.countDocuments({ action: 'CLOSE_OPENING_STOCK', subjectId: new mongoose.Types.ObjectId(input.warehouseId), reason: 'Đã nhập xong' }), 1);
    await assert.rejects(service.closeWarehouse(owner, input.warehouseId, { reason: 'again' }), /đã chốt/);
    await assert.rejects(service.preview(owner, input), /đã chốt/);
    await assert.rejects(service.create(owner, draft(input)), /đã chốt/);
    summary = (await service.options(owner)).warehouses.find(w => w.code === 'A');
    assert.deepEqual([summary.closed, summary.draftCount, summary.postedCount], [true, 0, 2]);

    // Cancelling every document clears the cut-off so it can be chosen again.
    const fresh = await setup('C');
    const onlyDraft = await service.create(owner, draft(fresh));
    assert.ok((await m.Warehouse.findById(fresh.warehouseId)).openingCutoffAt);
    await service.act(owner, onlyDraft.id, 'cancel', postBody());
    assert.equal((await m.Warehouse.findById(fresh.warehouseId)).openingCutoffAt, undefined);
    assert.equal((await service.options(owner)).warehouses.find(w => w.code === 'C').cutoffAt, null);
    const redraft = await service.create(owner, draft({ ...fresh, openingAt: '2026-11-18T00:00:00Z' }));
    assert.equal((await m.OpeningStock.findById(redraft.id)).header.openingAt.toISOString(), '2026-11-18T00:00:00.000Z');

    // D1b: the cut-off must be before the first WMS stock move; later moves add to the opening count (D3).
    const live = await setup('D');
    await ordinaryReceive(live.warehouseId, 'ST', b1, '30', new Date('2026-11-17T00:00:00Z'));
    await assert.rejects(service.preview(owner, { ...live, openingAt: '2026-11-17T00:00:00Z' }), /nghiệp vụ nhập\/xuất từ ngày/);
    await assert.rejects(service.create(owner, draft({ ...live, openingAt: '2026-11-18T00:00:00Z' })), /Chọn mốc sớm hơn/);
    const liveRows = [{ ...row, enteredQty: '100' }];
    const livePreview = await service.preview(owner, { ...live, rows: liveRows });
    assert.equal(livePreview.valid, true);
    assert.deepEqual(livePreview.rows[0].warnings, []);
    const liveDraft = await service.create(owner, draft({ ...live, rows: liveRows }));
    await service.act(owner, liveDraft.id, 'post', postBody());
    assert.equal(await balanceQty(live.warehouseId, 'ST'), '130');

    // Capacity in preview counts stock already in the location, including lots outside the file.
    const tight = await setup('E', [{ code: 'ST', usableLengthMm: '700', usableWidthMm: '700' }]);
    await ordinaryReceive(tight.warehouseId, 'ST', b3, '210', new Date('2026-11-01T00:00:00Z'));
    const tightBody = { ...tight, openingAt: '2026-10-01T00:00:00Z', rows: [{ ...row, enteredQty: '40' }] };
    const full = await service.preview(owner, tightBody);
    assert.equal(full.valid, false);
    assert.equal(full.rows[0].errors[0].field, 'locationCode');
    assert.match(full.rows[0].errors[0].message, /Vượt sức chứa/);
    await assert.rejects(service.create(owner, draft(tightBody)), /Vượt sức chứa/);

    // Stocktake lock blocks preview rows and posting.
    const frozen = await setup('F');
    const frozenDraft = await service.create(owner, draft(frozen));
    const frozenLocation = await m.WarehouseLocation.findOne({ warehouseId: frozen.warehouseId, code: 'ST' });
    await m.StocktakeLocationLock.collection.insertOne({ locationId: frozenLocation._id, status: 'LOCKED' });
    assert.match((await service.preview(owner, frozen)).rows[0].errors[0].message, /khóa kiểm kê/);
    await assert.rejects(service.act(owner, frozenDraft.id, 'post', postBody()), /kiểm kê/);
    assert.equal((await m.OpeningStock.findById(frozenDraft.id)).workflowStatus, 'DRAFT');

    // Concurrent create and close on the same warehouse: never a closed warehouse with a draft.
    const raceInput = await setup('G');
    await service.act(owner, (await service.create(owner, draft(raceInput))).id, 'post', postBody());
    const raced = await Promise.allSettled([service.create(owner, draft(raceInput)), service.closeWarehouse(owner, raceInput.warehouseId, { reason: 'race' })]);
    const raceWarehouse = await m.Warehouse.findById(raceInput.warehouseId);
    const raceDrafts = await m.OpeningStock.countDocuments({ 'header.warehouseId': raceInput.warehouseId, workflowStatus: 'DRAFT' });
    assert.equal(raced.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(Boolean(raceWarehouse.openingClosedAt) && raceDrafts > 0, false);

    // Setup script drops the old one-posting index and backfills the cut-off of older posted warehouses.
    const setupUri = mongoUri(mongoose.connection.name);
    await m.OpeningStock.collection.createIndex({ 'header.warehouseId': 1 }, { name: 'opening_stock_file_import_once', unique: true, partialFilterExpression: { workflowStatus: 'POSTED', 'header.openingImportSource': 'FILE' } }).catch(() => {});
    await m.Warehouse.collection.updateOne({ _id: new mongoose.Types.ObjectId(live.warehouseId) }, { $unset: { openingCutoffAt: '' } });
    const dryRun = await setupOpeningStock(setupUri);
    assert.equal(dryRun.applied, false);
    assert.equal(dryRun.cutoffBackfillWarehouses, 1);
    await setupOpeningStock(setupUri, { apply: true });
    await setupOpeningStock(setupUri, { apply: true });
    assert.equal((await m.OpeningStock.collection.indexes()).some(index => index.name === 'opening_stock_file_import_once'), false);
    assert.equal((await m.Warehouse.findById(live.warehouseId)).openingCutoffAt.toISOString(), '2026-11-16T00:00:00.000Z');
    const migratedWorkerRole = await m.Role.findById(worker.roleId._id);
    assert.equal(migratedWorkerRole.permissionIds.some(id => permissions.some(p => p.code.startsWith('opening_stock:') && String(p._id) === String(id))), false);
  } finally {
    assert.match(mongoose.connection.name, /^opening_test_[a-f0-9]+$/);
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  }
});
