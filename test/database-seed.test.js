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

test('buildCompleteSeedData compiles all 60 models and validates every document', async () => {
  const conn = mongoose.createConnection();
  const { data, groups, modelMap } = await buildCompleteSeedData(conn);

  assert.equal(modelMap.size, 60, 'Must register exactly 60 models');
  assert.equal(groups.length, 60, 'Must have 60 collection groups');

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
  assert.ok(data.uoms.length >= 5, 'Must have standard UOMs');
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
