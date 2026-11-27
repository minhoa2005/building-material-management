import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';
import { newId } from '../src/shared/utils/document-command.js';
import { importBody, lotRow, productRow } from '../src/modules/products/product-import.validation.js';
import { importCatalogue, previewImport } from '../src/modules/products/product-import.service.js';

const key = () => String(newId());
const mongoUri = database => `mongodb://127.0.0.1:${process.env.MONGODB_TEST_PORT || 27119}/${database}?replicaSet=${process.env.MONGODB_TEST_REPLICA_SET || 'opening-test'}`;
const product = { sku: 'new1', name: 'Gạch mới', manufacturerCode: 'Viglacera', color: 'Đỏ', categoryCode: 'tile', baseUnit: 'piece', lengthMm: '600', widthMm: '600', heightMm: '10' };
const lot = { sku: 'NEW1', manufacturerCode: 'Viglacera', color: 'Đỏ', manufacturerLot: 'L1', tone: 'T1', calibre: 'C1', piecesPerCarton: '4', cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50' };

test('catalogue import rows are strings per Excel column; unknown columns and empty bodies are rejected', () => {
  assert.equal(productRow.safeParse(product).success, true);
  assert.equal(productRow.safeParse({ ...product, material: '', rowNo: 2 }).data.material, undefined);
  assert.equal(productRow.safeParse({ ...product, unitCost: '100' }).success, false);
  assert.equal(productRow.safeParse({ ...product, lengthMm: '0' }).success, false);
  const { manufacturerCode: _m, color: _c, ...skuOnly } = lot;
  assert.equal(lotRow.safeParse(skuOnly).success, true);
  for (const piecesPerCarton of ['0', '4.5', '-1', '']) assert.equal(lotRow.safeParse({ ...lot, piecesPerCarton }).success, false);
  assert.equal(lotRow.safeParse({ ...lot, manufacturedOn: '2026-11-01' }).success, true);
  assert.equal(lotRow.safeParse({ ...lot, manufacturedOn: '2999-01-01' }).success, false);
  assert.equal(lotRow.safeParse({ ...lot, manufacturedOn: '' }).data.manufacturedOn, undefined);
  assert.equal(lotRow.safeParse({ ...lot, tone: '' }).success, false);
  assert.equal(importBody.safeParse({ products: [], lots: [] }).success, false);
  assert.equal(importBody.safeParse({ products: [product] }).success, true);
  assert.equal(importBody.safeParse({ products: Array(1001).fill(product) }).success, false);
  assert.equal(importBody.safeParse({ products: [product], extra: 1 }).success, false);
});

const enabled = process.env.RUN_OPENING_TESTS === '1';
test('Owner imports new products and lots in bulk; existing matching rows are skipped and any error rolls back', { skip: !enabled }, async () => {
  await mongoose.connect(mongoUri('opening_test_' + key()), { serverSelectionTimeoutMS: 5000 });
  try {
    for (const Model of m.models.values()) { await Model.createCollection(); await Model.createIndexes(); }
    const permissions = await m.Permission.insertMany(PERMISSION_CATALOGUE.map(p => ({ code: p.code, name: p.code, description: p.description })));
    const userWith = async (code, codes) => {
      const role = await m.Role.create({ code, name: code, permissionIds: permissions.filter(p => codes.includes(p.code)).map(p => p._id) });
      const user = await m.User.create({ username: code, fullName: code, passwordHash: 'unused', roleId: role._id });
      return m.User.findById(user._id).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
    };
    const owner = await userWith('OWNER', ROLE_PERMISSIONS.OWNER);
    const worker = await userWith('WAREHOUSE', ROLE_PERMISSIONS.WAREHOUSE);
    const productOnly = await userWith('PRODUCT_ONLY', ['product:create']);
    const category = await m.Category.create({ code: 'TILE', name: 'Tile' });
    await m.Uom.create([{ code: 'PIECE', name: 'Viên' }, { code: 'BOX', name: 'Thùng', isCarton: true }, { code: 'M2', name: 'Mét vuông', areaMm2: '1000000' }]);
    const sizes = { categoryId: category._id, baseUnit: 'PIECE', wholeBaseUnits: true, lengthMm: '600', widthMm: '600', heightMm: '10' };
    const existing = await m.Product.create({ ...sizes, sku: 'EXIST', manufacturerCode: 'Viglacera', color: 'Trắng', name: 'Gạch cũ', material: 'Ceramic' });
    await m.Product.create({ ...sizes, sku: 'OFF', manufacturerCode: 'Viglacera', color: 'Trắng', name: 'Ngừng', isActive: false });
    const carton = { cartonLengthMm: '620', cartonWidthMm: '620', cartonHeightMm: '50', piecesPerCarton: 4 };
    await m.ProductBatch.create({ ...carton, productId: existing._id, manufacturerLot: 'V1', identificationStatus: 'VERIFIED', tone: 'T1', calibre: 'C1', manufacturedOn: '2026-10-01', notes: 'Lô cũ' });
    await m.ProductBatch.create({ ...carton, productId: existing._id, manufacturerLot: 'U1', identificationStatus: 'UNKNOWN' });
    const existingRow = { sku: 'exist', name: 'Gạch cũ', manufacturerCode: 'viglacera', color: 'trắng', categoryCode: 'TILE', baseUnit: 'PIECE', lengthMm: '600.000', widthMm: '600', heightMm: '10', material: '' };
    const existingLot = { ...lot, sku: 'EXIST', manufacturerCode: '', color: '', manufacturerLot: 'V1' };
    const counts = async () => Promise.all([m.Product, m.ProductBatch, m.Conversion, m.OperationRecord, m.AuditLog].map(Model => Model.countDocuments()));

    const valid = {
      products: [product, { ...product, color: 'Xanh' }, existingRow],
      lots: [lot, { ...lot, color: 'xanh' }, existingLot],
    };
    await assert.rejects(previewImport(worker, valid), /quyền/);
    await assert.rejects(previewImport(productOnly, valid), /quyền/);
    assert.equal((await previewImport(productOnly, { products: valid.products, lots: [] })).valid, true);

    const before = await counts();
    const preview = await previewImport(owner, valid);
    assert.equal(preview.valid, true, JSON.stringify(preview));
    assert.deepEqual(preview.summary, { newProducts: 2, existingProducts: 1, newLots: 2, existingLots: 1, errors: 0 });
    assert.deepEqual(preview.products.map(r => [r.index, r.rowNo, r.status]), [[0, 1, 'NEW'], [1, 2, 'NEW'], [2, 3, 'EXISTS']]);
    assert.deepEqual(await counts(), before);

    const saved = await importCatalogue(owner, valid);
    assert.equal(saved.valid, true);
    const created = await m.Product.find({ sku: 'NEW1' }).sort({ color: 1 });
    assert.deepEqual(created.map(p => [p.color, p.baseUnit, p.isActive, p.wholeBaseUnits]), [['Xanh', 'PIECE', true, true], ['Đỏ', 'PIECE', true, true]]);
    const newLots = await m.ProductBatch.find({ productId: { $in: created.map(p => p._id) } });
    assert.equal(newLots.length, 2);
    assert.ok(newLots.every(b => b.identificationStatus === 'VERIFIED' && String(b.verifiedBy) === String(owner._id) && b.verifiedAt));
    // One M2 area conversion per new product and one BOX carton conversion per new lot, each with operation and audit.
    const conversions = await m.Conversion.find({ productId: { $in: created.map(p => p._id) } });
    assert.deepEqual(conversions.map(c => [c.productBatchId ? 'lot' : 'product', String(c.basePerUnit)]).sort(),
      [['lot', '4'], ['lot', '4'], ['product', '2.777777777778'], ['product', '2.777777777778']]);
    assert.equal(await m.OperationRecord.countDocuments({ operationCode: 'CREATE_PRODUCT_CONVERSION' }), 4);
    assert.equal(await m.AuditLog.countDocuments({ action: 'CREATE_PRODUCT_CONVERSION' }), 4);
    assert.equal(await m.AuditLog.countDocuments({ action: 'IMPORT_PRODUCT' }), 2);
    assert.equal(await m.AuditLog.countDocuments({ action: 'IMPORT_BATCH' }), 2);

    // Sending the same file again creates nothing.
    const afterImport = await counts();
    const again = await importCatalogue(owner, valid);
    assert.deepEqual(again.summary, { newProducts: 0, existingProducts: 3, newLots: 0, existingLots: 3, errors: 0 });
    assert.deepEqual(await counts(), afterImport);

    // D6 comparisons and error placement.
    const checked = await previewImport(owner, {
      products: [
        { ...existingRow, material: 'Granite' }, { ...existingRow, sku: 'OFF', name: 'Ngừng' },
        { ...product, sku: 'DUP', color: 'Đỏ'.normalize('NFD') }, { ...product, sku: 'dup', color: 'Đỏ' },
        { ...product, sku: 'BADCAT', categoryCode: 'NOPE' },
      ],
      lots: [],
    });
    assert.equal(checked.valid, false);
    const errs = rows => rows.map(r => r.errors.map(e => e.field));
    assert.deepEqual(errs(checked.products), [['material'], ['sku'], ['sku'], ['sku'], ['categoryCode']]);
    assert.match(checked.products[0].errors[0].message, /Khác danh mục \(đang là: Ceramic\)/);
    assert.match(checked.products[1].errors[0].message, /ngừng hoạt động/);
    assert.match(checked.products[2].errors[0].message, /Trùng hãng\/SKU\/màu với dòng 4/);
    const renamed = await previewImport(owner, { products: [{ ...existingRow, name: 'Tên khác' }], lots: [] });
    assert.deepEqual(errs(renamed.products), [['name']]);
    // Each existing-lot comparison in its own preview (same lot twice in one file is a duplicate).
    const lotCase = async row => (await previewImport(owner, { products: [], lots: [row] })).lots[0];
    const lotFields = async row => (await lotCase(row)).errors.map(e => e.field);
    assert.deepEqual(await lotFields({ ...existingLot, notes: 'Khác' }), ['notes']);
    assert.deepEqual(await lotFields({ ...existingLot, manufacturedOn: '2026-10-02' }), ['manufacturedOn']);
    assert.deepEqual(await lotFields({ ...existingLot, tone: 'T9' }), ['tone']);
    assert.equal((await lotCase({ ...existingLot, notes: 'Lô cũ', manufacturedOn: '2026-10-01' })).status, 'EXISTS');
    assert.match((await lotCase({ ...existingLot, manufacturerLot: 'U1' })).errors[0].message, /chưa xác minh/);
    const lotChecks = await previewImport(owner, {
      products: [{ ...product, sku: 'BADCAT', categoryCode: 'NOPE' }],
      lots: [{ ...lot, manufacturerCode: '', color: '' }, { ...lot, sku: 'NOPE' }, { ...lot, sku: 'BADCAT', manufacturerLot: 'X' },
        { ...lot, manufacturerLot: 'L2' }, { ...lot, manufacturerLot: 'L2' }],
    });
    assert.deepEqual(errs(lotChecks.lots), [['sku'], ['sku'], ['sku'], ['manufacturerLot'], ['manufacturerLot']]);
    assert.match(lotChecks.lots[0].errors[0].message, /SKU này có 2 sản phẩm/);
    assert.match(lotChecks.lots[1].errors[0].message, /chưa có trong danh mục/);
    assert.match(lotChecks.lots[2].errors[0].message, /Sản phẩm ở sheet Sản phẩm đang lỗi/);
    assert.match(lotChecks.lots[3].errors[0].message, /Trùng sản phẩm và mã lô với dòng 5/);

    // One bad row rolls back everything.
    const beforeRollback = await counts();
    await assert.rejects(importCatalogue(owner, { products: [{ ...product, sku: 'ROLLBACK' }, { ...product, sku: 'BAD', categoryCode: 'NOPE' }], lots: [] }), /còn 1 dòng lỗi/);
    assert.deepEqual(await counts(), beforeRollback);

    // 1,000 products with 1,000-character descriptions are written in bulk.
    const many = Array.from({ length: 1000 }, (_, i) => ({ ...product, sku: 'BULK' + i, description: 'd'.repeat(1000) }));
    const started = Date.now();
    const bulk = await importCatalogue(owner, { products: many, lots: [] });
    assert.equal(bulk.summary.newProducts, 1000);
    assert.ok(Date.now() - started < 30_000, 'bulk import should finish well inside the transaction limit');
    assert.equal(await m.Product.countDocuments({ sku: /^BULK/ }), 1000);
  } finally {
    assert.match(mongoose.connection.name, /^opening_test_[a-f0-9]+$/);
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
  }
});
