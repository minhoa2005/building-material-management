import 'dotenv/config';
import mongoose from 'mongoose';
import { mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Disable implicit schema DDL even when only previewing the upgrade.
mongoose.set('autoIndex', false);
mongoose.set('autoCreate', false);
const { planUpgrade, summarizePlan, applyUpgrade, MIGRATION_ID } = await import('./replenishment-3.3.js');
const { EJSON } = mongoose.mongo.BSON;

async function backupDatabase(connection) {
  const db = connection.db;
  const folder = join(homedir(), '.codex', 'backups',
    `${db.databaseName}-${MIGRATION_ID}-${Date.now()}-${new mongoose.Types.ObjectId()}`);
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const collections = await db.listCollections({}, { nameOnly: false }).toArray();
  const metadata = [];
  for (const { name, options, type } of collections) {
    if (name.startsWith('system.')) continue;
    if (type !== 'collection') throw new Error('Backup supports ordinary collections only.');
    metadata.push({ name, options, indexes: await db.collection(name).listIndexes().toArray() });
  }
  const session = await connection.startSession();
  try {
    await session.withTransaction(async () => {
      for (const collection of metadata) {
        const records = await db.collection(collection.name).find({}, { session }).toArray();
        collection.count = records.length;
        await writeFile(join(folder, `${collection.name}.ejson`), EJSON.stringify(records, { relaxed: false }), { mode: 0o600 });
      }
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    await writeFile(join(folder, 'manifest.ejson'), EJSON.stringify({
      database: db.databaseName, migration: MIGRATION_ID, createdAt: new Date(), collections: metadata,
    }, { relaxed: false }), { mode: 0o600 });
    console.info(`Backup: ${folder}`);
  } finally {
    await session.endSession();
  }
}

try {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--apply', '--dry-run'].includes(arg)) ||
      (args.includes('--apply') && args.includes('--dry-run'))) {
    throw new Error('Use --dry-run (default) or --apply.');
  }
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const connection = mongoose.connection;
  console.info(`Database: ${connection.name}; migration: ${MIGRATION_ID}`);
  if (args.includes('--apply')) {
    console.info(JSON.stringify(await applyUpgrade(connection, { backup: backupDatabase }), null, 2));
    console.info('Migration committed and verified.');
  } else {
    console.info(JSON.stringify(summarizePlan(await planUpgrade(connection.db)), null, 2));
    console.info('Dry run only; no database writes.');
  }
} catch (error) {
  // Driver connection errors can contain credentials/hosts from the URI.
  console.error(error.name === 'MongoServerSelectionError' || error.name === 'MongoParseError'
    ? 'Database connection failed; check private connection configuration.' : error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
