import mongoose from 'mongoose';
import * as models from '../../src/models/runtime.js';
import * as replenishment from '../../src/modules/replenishments/replenishment.commands.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../../src/seeds/data/permissions.data.js';
import { saigonDateOnly } from '../../src/shared/utils/domain.js';

export const purchasingEnabled = process.env.RUN_NATIVE_API_TESTS === '1';
export const key = () => new mongoose.Types.ObjectId().toString();
export const id = (document) => String(document._id);
export const dateInSaigon = (days = 0) => saigonDateOnly(new Date(Date.now() + days * 86_400_000));
export const commandInput = (document, fields = {}) => ({
  operationKey: key(),
  expectedVersion: document.version,
  ...fields,
});

let databaseName;
let roles;
let category;
let carton;

export async function startPurchasingDatabase() {
  databaseName = `wmsd_api_test_purchasing_${key()}`;
  const port = process.env.MONGODB_TEST_PORT || '27017';
  const replicaSet = process.env.MONGODB_TEST_REPLICA_SET || 'rs0';
  if (!/^\d+$/.test(port)) throw new Error('MONGODB_TEST_PORT must be a port number');
  // Keep fixture writes on a fresh local database, even when the app has a configured URI.
  const uri = `mongodb://127.0.0.1:${port}/${databaseName}?replicaSet=${encodeURIComponent(replicaSet)}&directConnection=true`;
  await mongoose.connect(uri, {
    autoCreate: false,
    autoIndex: false,
    serverSelectionTimeoutMS: 5000,
  });
  for (const Model of models.models.values()) {
    await Model.createCollection();
    await Model.createIndexes();
  }

  const permissions = await models.Permission.insertMany(PERMISSION_CATALOGUE.map((permission) => ({
    code: permission.code,
    name: permission.code,
    description: permission.description,
  })));
  roles = {};
  for (const code of ['OWNER', 'WAREHOUSE', 'ACCOUNTANT', 'SALES', 'RR_DUAL']) {
    const grants = code === 'RR_DUAL'
      ? [...ROLE_PERMISSIONS.WAREHOUSE, 'replenishment_request:approve']
      : ROLE_PERMISSIONS[code];
    roles[code] = await models.Role.create({
      code,
      name: code,
      permissionIds: permissions.filter((permission) => grants.includes(permission.code)).map((permission) => permission._id),
    });
  }
  [, carton] = await models.Uom.create([
    { code: 'PIECE', name: 'Viên' },
    { code: 'BOX', name: 'Thùng', isCarton: true },
  ]);
  category = await models.Category.create({ code: 'TILE', name: 'Tile' });
}

export async function stopPurchasingDatabase() {
  try {
    if (mongoose.connection.readyState === 1) {
      if (!databaseName?.startsWith('wmsd_api_test_purchasing_') || mongoose.connection.name !== databaseName) {
        throw new Error('Refusing to drop a database outside this test suite');
      }
      await mongoose.connection.dropDatabase();
    }
  } finally {
    await mongoose.disconnect();
  }
}

export function createWarehouse(code, isActive = true) {
  return models.Warehouse.create({
    code,
    name: code,
    isActive,
    lengthMm: '10000',
    widthMm: '10000',
    clearHeightMm: '3000',
  });
}

export async function createPurchasingUser(code, warehouse) {
  const user = await models.User.create({
    username: `${code}-${key()}`,
    fullName: code,
    passwordHash: 'test-only-unused',
    roleId: roles[code]._id,
    warehouseIds: [warehouse._id],
  });
  return user.populate({ path: 'roleId', populate: { path: 'permissionIds' } });
}

export function createProduct() {
  return models.Product.create({
    sku: `TEST-${key()}`,
    name: 'Test tile',
    manufacturerCode: 'TEST',
    categoryId: category._id,
    color: 'White',
    baseUnit: 'PIECE',
    wholeBaseUnits: true,
    lengthMm: '600',
    widthMm: '600',
    heightMm: '10',
  });
}

export async function createPurchasingFixture() {
  const warehouse = await createWarehouse(`TEST${key().slice(-6).toUpperCase()}`);
  const [owner, worker, accountant, product, supplier] = await Promise.all([
    createPurchasingUser('OWNER', warehouse),
    createPurchasingUser('WAREHOUSE', warehouse),
    createPurchasingUser('ACCOUNTANT', warehouse),
    createProduct(),
    models.Supplier.create({ code: `SUP${key().slice(-6).toUpperCase()}`, name: 'Test supplier', status: 'ACTIVE' }),
  ]);
  await models.Conversion.create({
    productId: product._id,
    productBatchId: null,
    uomId: carton._id,
    basePerUnit: '4',
    validFrom: new Date(0),
    version: 1,
    verificationReference: 'Purchasing integration fixture',
    createdBy: owner._id,
  });
  return { warehouse, owner, worker, accountant, product, supplier };
}

export const requestLine = (fixture, overrides = {}) => ({
  productId: id(fixture.product),
  enteredUnit: 'PIECE',
  enteredQty: '10',
  reasonNote: 'Low stock',
  ...overrides,
});

export const requestInput = (fixture, overrides = {}) => ({
  creationKey: key(),
  action: 'SAVE_DRAFT',
  warehouseId: id(fixture.warehouse),
  neededOn: dateInSaigon(),
  triggerReason: 'Stock replenishment',
  lines: [requestLine(fixture)],
  ...overrides,
});

export async function createRequest(fixture, overrides, actor = fixture.worker) {
  const receipt = await replenishment.createReplenishment(actor, requestInput(fixture, overrides));
  return models.ReplenishmentRequest.findById(receipt.id).orFail();
}

export const decisionLine = (item, fields = {}) => ({
  lineId: id(item),
  approvedQtyBase: String(item.qtyBase),
  ...fields,
});

export const reviewInput = (request, fields = {}) => commandInput(request, {
  decision: 'APPROVE',
  reason: 'Reviewed purchase need',
  lines: request.items.map((item) => decisionLine(item)),
  ...fields,
});

export async function approveRequest(fixture, overrides) {
  const request = await createRequest(fixture, { action: 'SUBMIT', ...overrides });
  await replenishment.reviewReplenishment(fixture.owner, id(request), reviewInput(request));
  return models.ReplenishmentRequest.findById(request._id).orFail();
}

export const purchaseInput = (fixture, request, fields = {}) => ({
  creationKey: key(),
  warehouseId: id(fixture.warehouse),
  supplierId: id(fixture.supplier),
  expectedOn: `${dateInSaigon(3)}T00:00:00+07:00`,
  currency: 'VND',
  lines: [{
    rrLineId: id(request.items[0]),
    approvalId: String(request.header.latestDecisionId),
    uomCode: 'PIECE',
    enteredQty: '10',
    unitPurchasePrice: '50000',
  }],
  ...fields,
});
