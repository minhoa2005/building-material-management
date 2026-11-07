import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'node:url';
import { SEED_ACCOUNTS } from '../src/seeds/data/accounts.data.js';

export async function syncSeedPasswords(users, { apply = false } = {}) {
  const usernames = SEED_ACCOUNTS.map((account) => account.username);
  if (new Set(usernames).size !== usernames.length) throw new Error('Duplicate seed usernames; no changes made.');
  const matches = await users.find({ username: { $in: usernames } }).toArray();
  const plan = [];
  for (const account of SEED_ACCOUNTS) {
    const rows = matches.filter((user) => user.username === account.username);
    if (rows.length > 1) throw new Error(`Duplicate username: ${account.username}; no changes made.`);
    if (!rows.length) { plan.push({ username: account.username, status: 'missing' }); continue; }
    const user = rows[0];
    const current = typeof user.passwordHash === 'string' && await bcrypt.compare(account.password, user.passwordHash);
    plan.push({ username: account.username, status: current ? 'unchanged' : 'update', user, password: account.password });
  }
  if (apply) {
    for (const item of plan.filter((entry) => entry.status === 'update')) {
      const passwordHash = await bcrypt.hash(item.password, 10);
      const result = await users.updateOne(
        { _id: item.user._id, username: item.username, passwordHash: Object.hasOwn(item.user, 'passwordHash') ? item.user.passwordHash : { $exists: false } },
        { $set: { passwordHash } },
      );
      if (result.matchedCount !== 1) throw new Error(`Concurrent change for ${item.username}; earlier updates may have succeeded.`);
      item.status = 'updated';
    }
  }
  return plan.map(({ username, status }) => ({ username, status }));
}

export function assertLocalMongoUri(uri) {
  let parsed;
  try { parsed = new URL(uri); } catch { throw new Error('Pass a local MongoDB URI with an explicit database name.'); }
  if (parsed.protocol !== 'mongodb:' || !['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname) || !parsed.pathname.slice(1) || parsed.username || parsed.password) {
    throw new Error('Only an explicit local MongoDB URI without credentials is allowed.');
  }
}

export async function migrate(uri, options = {}) {
  assertLocalMongoUri(uri);
  const connection = await mongoose.createConnection(uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 5000 }).asPromise();
  try { return await syncSeedPasswords(connection.db.collection('users'), options); }
  finally { await connection.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const uriArgs = args.filter((arg) => arg.startsWith('--uri='));
  if (uriArgs.length !== 1 || args.some((arg) => !arg.startsWith('--uri=') && arg !== '--apply')) {
    console.error('Usage: node scripts/migrate-seed-passwords.mjs --uri=mongodb://127.0.0.1:27017/<database> [--apply]');
    process.exitCode = 1;
  } else {
    try { console.log(JSON.stringify(await migrate(uriArgs[0].slice(6), { apply: args.includes('--apply') }), null, 2)); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}

