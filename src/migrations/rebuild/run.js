import 'dotenv/config';
import mongoose from 'mongoose';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { registerMigrationModels } from '../../models/index.js';
import { transformSnapshot } from './transform.js';
import { fingerprint, validateTarget, verifyGraph } from './verify.js';
import { verifyReferences } from './references.js';

const { MongoClient } = mongoose.mongo;
const args = process.argv.slice(2);
function option(name) {
  const position = args.indexOf(name);
  if (position < 0) return undefined;
  const value = args[position + 1];
  if (!value || value.startsWith('--')) throw new Error('Missing value for ' + name);
  return value;
}
async function snapshot(client, db) {
  const collections = (await db.listCollections().toArray()).filter(row => !row.name.startsWith('system.'));
  if (collections.some(row => row.type !== 'collection')) throw new Error('Source views require an explicit migration mapping');
  const metadata = [];
  for (const row of collections) metadata.push({ ...row, indexes: await db.collection(row.name).listIndexes().toArray() });
  const session = client.startSession();
  const data = {};
  try {
    await session.withTransaction(async () => {
      for (const row of metadata) data[row.name] = await db.collection(row.name).find({}, { session }).sort({ _id: 1 }).toArray();
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally { await session.endSession(); }
  return { data, metadata };
}
async function createEmptyTarget(db, manifest) {
  if ((await db.listCollections({}, { nameOnly: true }).toArray()).length) throw new Error('Target must be a new, empty database: ' + db.databaseName);
}
async function writeSnapshot(client, db, data) {
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      for (const [collection, rows] of Object.entries(data)) if (rows.length) await db.collection(collection).insertMany(rows, { session });
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } finally { await session.endSession(); }
}
async function compareStored(db, expected) {
  const stored = {};
  for (const name of Object.keys(expected)) stored[name] = await db.collection(name).find().sort({ _id: 1 }).toArray();
  if (fingerprint(stored) !== fingerprint(expected)) throw new Error('Stored data differs from prepared snapshot in ' + db.databaseName);
}
async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  const apply = args.includes('--apply');
  const verify = args.includes('--verify');
  if (apply && verify) throw new Error('Choose apply or verify');
  const targetName = option('--target');
  const reportPath = option('--report');
  const allowed = new Set(['--apply','--verify','--target','--report']);
  for (let i=0; i<args.length; i++) {
    if (!allowed.has(args[i])) throw new Error('Unknown migration argument');
    if (args[i] !== '--apply' && args[i] !== '--verify') i++;
  }
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const modelConnection = mongoose.createConnection();
  try {
    await client.connect();
    const sourceDb = client.db();
    if ((apply || verify) && (!targetName || !/^[a-zA-Z0-9_]{1,55}$/.test(targetName) ||
        targetName === sourceDb.databaseName || !targetName.startsWith(sourceDb.databaseName + '_rebuild_'))) {
      throw new Error('Apply requires an isolated target named <source>_rebuild_<suffix>');
    }
    const models = registerMigrationModels(modelConnection);
    const { data: source, metadata } = await snapshot(client, sourceDb);
    const sourceHash = fingerprint(source);
    const { target, issues } = transformSnapshot(source);
    const verified = verifyGraph(source,target);
    const validationErrors = await validateTarget(target,models);
    const referenceErrors = verifyReferences(target,models);
    if (referenceErrors.length) throw new Error('Dangling target references: ' + JSON.stringify(referenceErrors));
    const report = {
      migration: 'approved-db-rebuild-20261102', sourceDatabase: sourceDb.databaseName, sourceHash, recordedAt: new Date(),
      sourceCounts: Object.fromEntries(Object.entries(source).map(([name,rows]) => [name,rows.length])),
      targetCounts: Object.fromEntries(Object.entries(target).map(([name,rows]) => [name,rows.length])),
      verified, dataIssues: issues, validationErrors,
      status: 'PREVIEW',
      remaining: ['Resolve recorded data gaps', 'Complete API adapters and runtime cutover tests', 'D07 and D08 workflow decisions remain pending'],
    };
    if (apply) {
      const backupName = targetName + '_backup';
      if (backupName.length > 63) throw new Error('Backup database name is too long');
      const targetDb = client.db(targetName), backupDb = client.db(backupName);
      if ((await targetDb.listCollections({}, { nameOnly:true }).toArray()).length) throw new Error('Target database already exists');
      await createEmptyTarget(backupDb);
      for (const info of metadata) {
        await backupDb.createCollection(info.name, info.options);
        const indexes = info.indexes.filter(index => index.name !== '_id_').map(({ v, ns, ...index }) => index);
        if (indexes.length) await backupDb.collection(info.name).createIndexes(indexes);
      }
      await writeSnapshot(client, backupDb, source);
      await compareStored(backupDb,source);
      // Reject a stale copy before preparing the destination.
      if (fingerprint((await snapshot(client,sourceDb)).data) !== sourceHash) throw new Error('Source changed during backup; take a new snapshot');
      await createEmptyTarget(targetDb);
      for (const [name,Model] of models) {
        await targetDb.createCollection(name);
        const indexes = Model.schema.indexes().map(([key, options]) => {
          const { _autoIndex, background, ...allowedOptions } = options;
          return { key, ...allowedOptions };
        });
        if (indexes.length) await targetDb.collection(name).createIndexes(indexes);
      }
      await writeSnapshot(client,targetDb,target);
      await compareStored(targetDb,target);
      report.sourceChangedSinceSnapshot = fingerprint((await snapshot(client,sourceDb)).data) !== sourceHash;
      report.status = 'REVIEW_REQUIRED';
      report.targetDatabase = targetName;
      report.backupDatabase = backupName;
    }
    if (verify) {
      const targetDb = client.db(targetName);
      await compareStored(targetDb,target);
      const backupName = targetName + '_backup';
      await compareStored(client.db(backupName),source);
      report.targetDatabase = targetName;
      report.backupDatabase = backupName;
      report.status = 'REVERIFIED_REVIEW_REQUIRED';
    }
    if (reportPath) {
      const path = resolve(reportPath);
      await mkdir(dirname(path), { recursive:true });
      await writeFile(path, JSON.stringify(report,null,2) + '\n', { flag:'wx' });
    }
    console.log(JSON.stringify({ status:report.status, source:report.sourceDatabase, target:report.targetDatabase, backup:report.backupDatabase,
      verified, targetCollections:models.size, dataIssues:issues.length, schemaErrors:validationErrors.length,
      sourceChanged:report.sourceChangedSinceSnapshot, report:reportPath }, null, 2));
  } finally { await modelConnection.close(); await client.close(); }
}
main().catch(error => {
  // Never print a URI, command payload or validation values.
  console.error('DB rebuild failed', error.name, error.code ?? '', ['Error'].includes(error.name) ? error.message : '');
  process.exitCode = 1;
});
