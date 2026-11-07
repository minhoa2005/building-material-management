import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const database = 'wmsd_api_test_6aedf823b3e33975e06c07d1';
const uri = `mongodb://127.0.0.1:27017/${database}`;
const args = process.argv.slice(2);
const username = args.find((arg) => arg.startsWith('--user='))?.slice(7);
const apply = args.includes('--apply');
const allowed = new Set(['owner', 'warehouse', 'accountant', 'receiver']);

if (args.some((arg) => !arg.startsWith('--user=') && arg !== '--apply') ||
    args.filter((arg) => arg.startsWith('--user=')).length !== 1 || !allowed.has(username)) {
  console.error('Usage: node scripts/reset-test-user-password.mjs --user=<owner|warehouse|accountant|receiver> [--apply]');
  process.exit(1);
}

const password = process.env.WMSD_TEST_NEW_PASSWORD;
if (apply && (!password || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72)) {
  console.error('Set WMSD_TEST_NEW_PASSWORD to 8 or more characters, at most 72 UTF-8 bytes.');
  process.exit(1);
}

const connection = await mongoose.createConnection(uri, {
  autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 5000,
}).asPromise();
try {
  const users = connection.db.collection('users');
  const matches = await users.find({ username }, { projection: { username: 1 } }).limit(2).toArray();
  if (matches.length !== 1) throw new Error('Expected exactly one matching user; no changes made.');
  if (apply) {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await users.updateOne({ _id: matches[0]._id, username }, { $set: { passwordHash } });
    if (result.matchedCount !== 1) throw new Error('User changed or disappeared; no update applied.');
  }
  console.log(`${apply ? 'Updated' : 'Would update'} password for ${username} in local ${database}.`);
} finally {
  await connection.close();
}
