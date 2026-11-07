import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { syncSeedPasswords, migrate } from '../scripts/migrate-seed-passwords.mjs';
import { SEED_ACCOUNTS } from '../src/seeds/data/accounts.data.js';

function collection(rows) {
  return {
    find: () => ({ toArray: async () => rows.map((row) => ({ ...row })) }),
    updateOne: async (filter, update) => {
      const row = rows.find((entry) => entry._id === filter._id && entry.username === filter.username && entry.passwordHash === filter.passwordHash);
      if (!row) return { matchedCount: 0 };
      Object.assign(row, update.$set);
      return { matchedCount: 1 };
    },
  };
}

test('preview, apply and repeat update only matching seed passwords', async () => {
  const [first, second] = SEED_ACCOUNTS;
  const oldHash = await bcrypt.hash('different', 10);
  const currentHash = await bcrypt.hash(second.password, 10);
  const rows = [{ _id: 1, username: first.username, passwordHash: oldHash, fullName: 'kept' },
    { _id: 2, username: second.username, passwordHash: currentHash },
    { _id: 3, username: 'other', passwordHash: oldHash }];
  const users = collection(rows);
  const preview = await syncSeedPasswords(users);
  assert.equal(preview[0].status, 'update');
  assert.equal(preview[1].status, 'unchanged');
  assert.equal(preview[2].status, 'missing');
  assert.equal(rows[0].passwordHash, oldHash);
  const result = await syncSeedPasswords(users, { apply: true });
  assert.equal(result[0].status, 'updated');
  assert.ok(await bcrypt.compare(first.password, rows[0].passwordHash));
  assert.equal(rows[0].fullName, 'kept');
  assert.equal(rows[1].passwordHash, currentHash);
  assert.equal(rows[2].passwordHash, oldHash);
  assert.equal((await syncSeedPasswords(users, { apply: true }))[0].status, 'unchanged');
});

test('duplicate users block all updates and remote targets are rejected', async () => {
  const rows = [{ _id: 1, username: SEED_ACCOUNTS[0].username, passwordHash: 'old' },
    { _id: 2, username: SEED_ACCOUNTS[0].username, passwordHash: 'old' }];
  await assert.rejects(syncSeedPasswords(collection(rows), { apply: true }), /Duplicate username/);
  assert.equal(rows[0].passwordHash, 'old');
  await assert.rejects(migrate('mongodb://example.com/test'), /local MongoDB/);
});

test('startup synchronizes local non-production connection only', async () => {
  const { syncPasswordsOnStartup } = await import('../src/config/seed-password-startup.js');
  const account = SEED_ACCOUNTS[0];
  const rows = [{ _id: 1, username: account.username, passwordHash: await bcrypt.hash('different', 10) }];
  const connection = { readyState: 1, db: { collection: () => collection(rows) } };
  const local = { uri: 'mongodb://127.0.0.1:27017/test', nodeEnv: 'development' };
  assert.equal((await syncPasswordsOnStartup(connection, { ...local, nodeEnv: 'production' })).skipped, true);
  assert.equal((await syncPasswordsOnStartup(connection, { ...local, uri: 'mongodb://example.com/test' })).skipped, true);
  assert.equal((await syncPasswordsOnStartup({ readyState: 0 }, local)).skipped, true);
  assert.equal(await bcrypt.compare(account.password, rows[0].passwordHash), false);
  const result = await syncPasswordsOnStartup(connection, local);
  assert.equal(result.accounts[0].status, 'updated');
  assert.equal(await bcrypt.compare(account.password, rows[0].passwordHash), true);
});
