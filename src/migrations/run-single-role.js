import 'dotenv/config';
import mongoose from 'mongoose';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { applyUpgrade, planUpgrade, summarizePlan, MIGRATION_ID } from './single-role.js';

mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);
const { EJSON } = mongoose.mongo.BSON;

async function backupUsersAndRoles(connection) {
  const folder = join(homedir(), '.codex', 'backups', `${MIGRATION_ID}-${Date.now()}-${new mongoose.Types.ObjectId()}`);
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const metadata = [];
  const session = await connection.startSession();
  try {
    await session.withTransaction(async () => {
      metadata.length = 0;
      for (const name of ['users', 'roles']) {
        const collection = connection.db.collection(name);
        const info = await connection.db.listCollections({ name }).toArray();
        const records = await collection.find({}, { session }).toArray();
        metadata.push({ name, count: records.length, options: info[0]?.options,
          indexes: info.length ? await collection.listIndexes().toArray() : [] });
        await writeFile(join(folder, `${name}.ejson`), EJSON.stringify(records, { relaxed: false }), { mode: 0o600 });
      }
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    await writeFile(join(folder, 'manifest.ejson'), EJSON.stringify({
      database: connection.name, migration: MIGRATION_ID, createdAt: new Date(), collections: metadata,
    }, { relaxed: false }), { mode: 0o600 });
    return { completed: true, path: folder };
  } finally { await session.endSession(); }
}

try {
  const args = process.argv.slice(2);
  let mode = '--dry-run', explicitMode = false, assignmentPath;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--apply' || arg === '--dry-run') {
      if (explicitMode) throw new Error('Choose --dry-run or --apply once.');
      mode = arg; explicitMode = true;
    } else if (arg === '--assignments' && !assignmentPath && args[index + 1] && !args[index + 1].startsWith('--')) {
      assignmentPath = args[++index];
    } else throw new Error('Use [--dry-run | --apply] [--assignments path/to/assignments.json].');
  }
  const assignments = assignmentPath ? JSON.parse(await readFile(assignmentPath, 'utf8')) : {};
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const result = mode === '--apply'
    ? await applyUpgrade(mongoose.connection, { assignments, backup: backupUsersAndRoles })
    : summarizePlan(await planUpgrade(mongoose.connection.db, { assignments }));
  console.info(JSON.stringify(result, null, 2));
  console.info(mode === '--apply' ? 'Role migration committed and index verified.' : 'Dry run only; no database writes.');
  if (result.blocked.length) process.exitCode = 1;
} catch (error) {
  console.error(error.name === 'MongoServerSelectionError' || error.name === 'MongoParseError'
    ? 'Database connection failed; check private connection configuration.' : error.message);
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
