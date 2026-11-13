import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { databaseHasData, buildCompleteSeedData, seedDatabaseIfEmpty } from '../src/seeds/seed.js';
import { SEED_ACCOUNTS } from '../src/seeds/data/accounts.data.js';
import { ROLE, ROLE_PERMISSIONS, PERMISSION_CATALOGUE } from '../src/seeds/data/permissions.data.js';

test('databaseHasData correctly detects whether collections contain documents', async () => {
  const emptyDb = {
    listCollections: () => ({
      toArray: async () => [{ name: 'users' }, { name: 'roles' }, { name: 'system.views' }],
    }),
    collection: (_name) => ({
      findOne: async () => null,
    }),
  };
  assert.equal(await databaseHasData(emptyDb), false);

  const populatedDb = {
    listCollections: () => ({
      toArray: async () => [{ name: 'users' }, { name: 'roles' }],
    }),
    collection: (name) => ({
      findOne: async () => (name === 'users' ? { _id: 1 } : null),
    }),
  };
  assert.equal(await databaseHasData(populatedDb), true);
});

test('buildCompleteSeedData compiles all 58 models and validates every document', async () => {
  const conn = mongoose.createConnection();
  const { data, groups, modelMap } = await buildCompleteSeedData(conn);

  assert.equal(modelMap.size, 58, 'Must register exactly 58 models');
  assert.equal(groups.length, 58, 'Must have 58 collection groups');

  // Verify Roles
  const roleCodes = data.roles.map((r) => r.code);
  for (const expectedRole of ['ADMIN', 'OWNER', 'SALES', 'WAREHOUSE', 'ACCOUNTANT']) {
    assert.ok(roleCodes.includes(expectedRole), `Missing expected role: ${expectedRole}`);
  }

  // Verify Single-role: each role has proper permissions
  const roleMap = new Map(data.roles.map((r) => [r.code, r]));
  for (const [code, expectedPermCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = roleMap.get(code);
    if (role) {
      assert.equal(role.permissionIds.length, expectedPermCodes.length, `Mismatch in permission count for role ${code}`);
    }
  }

  // Verify Standard Accounts from SEED_ACCOUNTS
  const usernames = data.users.map((u) => u.username);
  for (const acc of SEED_ACCOUNTS) {
    assert.ok(usernames.includes(acc.username), `Missing standard account: ${acc.username}`);
    const user = data.users.find((u) => u.username === acc.username);
    assert.ok(user.passwordHash, `Account ${acc.username} must have a passwordHash`);
    assert.ok(bcrypt.compareSync(acc.password, user.passwordHash), `Password hash must match for ${acc.username}`);
    assert.ok(user.roleId, `Account ${acc.username} must have a roleId`);
  }

  // Verify Warehouses
  assert.equal(data.warehouses.length, 3, 'Must have 3 warehouses');

  // Verify Categories
  assert.equal(data.categories.length, 5, 'Must have 5 product categories');

  // Verify UOMs
  assert.deepEqual(data.uoms.map(uom => uom.code).sort(), ['Mét vuông', 'Thùng', 'Viên'].sort());
});

test('seedDatabaseIfEmpty skips execution when database already contains data', async () => {
  const mockConn = {
    readyState: 1,
    db: {
      listCollections: () => ({
        toArray: async () => [{ name: 'users' }],
      }),
      collection: () => ({
        findOne: async () => ({ _id: 1 }),
      }),
    },
  };

  const result = await seedDatabaseIfEmpty({ connection: mockConn });
  assert.equal(result.seeded, false);
  assert.equal(result.reason, 'DATABASE_NOT_EMPTY');
});

test('buildCompleteSeedData includes all 5 goods receipt kinds preserving all required fields', async () => {
  const conn = mongoose.createConnection();
  const { data } = await buildCompleteSeedData(conn);

  const kinds = new Set(data.goods_receipts.map((r) => r.documentKind));
  for (const expectedKind of ['PURCHASE', 'CUSTOMER_RETURN', 'FAILED_DELIVERY', 'TRANSFER', 'OTHER']) {
    assert.ok(kinds.has(expectedKind), `Missing goods receipt kind: ${expectedKind}`);
  }

  // 1. PURCHASE
  const purchase = data.goods_receipts.find((r) => r.documentKind === 'PURCHASE');
  assert.ok(purchase.header.warehouseId, 'PURCHASE requires warehouseId');
  assert.equal(purchase.header.receiptKind, 'PURCHASE', 'PURCHASE header receiptKind');
  assert.ok(purchase.header.purchaseOrderId, 'PURCHASE requires purchaseOrderId');
  assert.ok(purchase.header.arrivalId, 'PURCHASE requires arrivalId');
  assert.ok(purchase.header.supplierId, 'PURCHASE requires supplierId');
  assert.ok(purchase.header.receivedAt, 'PURCHASE requires receivedAt');
  const pLine = purchase.items[0];
  assert.equal(pLine.lineKind, 'STANDARD');
  assert.ok(pLine.purchaseOrderItemId && pLine.arrivalItemId && pLine.inspectionId && pLine.destinationLocationId);

  // 2. CUSTOMER_RETURN
  const ret = data.goods_receipts.find((r) => r.documentKind === 'CUSTOMER_RETURN');
  assert.ok(ret.header.warehouseId, 'CUSTOMER_RETURN requires warehouseId');
  assert.equal(ret.header.receiptKind, 'CUSTOMER_RETURN');
  assert.ok(ret.header.returnId, 'CUSTOMER_RETURN requires returnId');
  assert.ok(ret.header.receivedAt, 'CUSTOMER_RETURN requires receivedAt');
  assert.ok(ret.header.operationId, 'CUSTOMER_RETURN requires operationId');
  assert.equal(ret.items[0].lineKind, 'STANDARD');

  // 3. FAILED_DELIVERY
  const failed = data.goods_receipts.find((r) => r.documentKind === 'FAILED_DELIVERY');
  assert.ok(failed.header.warehouseId, 'FAILED_DELIVERY requires warehouseId');
  assert.equal(failed.header.receiptKind, 'FAILED_DELIVERY');
  assert.ok(failed.header.failedDeliveryId, 'FAILED_DELIVERY requires failedDeliveryId');
  assert.ok(failed.header.receivedAt, 'FAILED_DELIVERY requires receivedAt');
  assert.ok(failed.header.receivedBy, 'FAILED_DELIVERY requires receivedBy');
  assert.equal(failed.items[0].lineKind, 'FAILED_DELIVERY_RECEIPT');
  assert.ok(failed.items[0].details.failedDeliveryLineId);
  assert.ok(Array.isArray(failed.demandReopenings) && failed.demandReopenings.length > 0);
  assert.ok(Array.isArray(failed.commitmentTransfers) && failed.commitmentTransfers.length > 0);

  // 4. TRANSFER
  const transfer = data.goods_receipts.find((r) => r.documentKind === 'TRANSFER');
  assert.ok(transfer.header.dispatchId, 'TRANSFER requires dispatchId');
  assert.ok(transfer.header.receivedBy, 'TRANSFER requires receivedBy');
  assert.ok(transfer.header.receivedAt, 'TRANSFER requires receivedAt');
  assert.ok(transfer.header.warehouseId, 'TRANSFER requires warehouseId');
  assert.ok(transfer.header.putawayStatus, 'TRANSFER requires putawayStatus');
  assert.equal(transfer.items[0].lineKind, 'TRANSFER_RECEIPT');
  assert.ok(transfer.items[0].details.dispatchLineId);
  assert.ok(transfer.items[0].details.qualityCode);

  // 5. OTHER
  const others = data.goods_receipts.filter((r) => r.documentKind === 'OTHER');
  assert.ok(others.length >= 4, 'Must seed at least 4 OTHER receipts covering workflow scenarios');
  for (const o of others) {
    assert.ok(o.header.warehouseId, 'OTHER requires warehouseId');
    assert.ok(o.header.reason, 'OTHER requires reason');
    for (const item of o.items) {
      assert.equal(item.lineKind, 'STANDARD');
      assert.ok(item.lotId, 'OTHER item requires lotId');
      assert.ok(item.destinationLocationId, 'OTHER item requires destinationLocationId');
      assert.ok(item.qualityCode, 'OTHER item requires qualityCode');
    }
  }

  // Verify error-correction cases for OTHER
  const postedOther = others.find((r) => r.workflowStatus === 'POSTED' && !r.header.originalReceiptId);
  assert.ok(postedOther.evidenceIds?.length, 'Posted OTHER has evidenceIds');
  assert.ok(postedOther.approvedStockHash, 'Posted OTHER has approvedStockHash');
  assert.ok(postedOther.approvalDecisionId, 'Posted OTHER has approvalDecisionId');

  const reversedOther = others.find((r) => r.workflowStatus === 'REVERSED');
  assert.ok(reversedOther, 'Must have a REVERSED OTHER receipt');

  const replacementOther = others.find((r) => r.header.originalReceiptId && String(r.header.originalReceiptId) === String(reversedOther._id));
  assert.ok(replacementOther, 'Must have a replacement OTHER receipt referencing the reversed receipt');

  const draftOther = others.find((r) => r.workflowStatus === 'DRAFT');
  assert.ok(draftOther, 'Must have a DRAFT OTHER receipt');
});
