import 'dotenv/config';
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { isLoopbackMongoUri } from '../src/config/local-mongo.js';
import { PERMISSION_CATALOGUE } from '../src/seeds/data/permissions.data.js';

export function openingStockTarget(uri, { allowRemote = false } = {}) {
  if (!uri || !/^mongodb(?:\+srv)?:\/\//.test(uri)) throw new Error('Set MONGODB_URI to the intended MongoDB application database.');
  if (!allowRemote && !isLoopbackMongoUri(uri)) throw new Error('Use --allow-remote to install opening stock on Atlas or another remote database.');
  const database = decodeURIComponent(uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/)?.[1] || '');
  if (!database || ['admin', 'local', 'config'].includes(database)) throw new Error('Name the application database explicitly.');
  return database;
}

// Warehouses with an older POSTED opening document but no cut-off take the earliest posted openingAt.
async function cutoffBackfill(db) {
  const missing = await db.collection('warehouses').find({ openingCutoffAt: { $exists: false } }).project({ _id: 1 }).toArray();
  if (!missing.length) return [];
  return (await db.collection('opening_stocks').aggregate([
    { $match: { workflowStatus: 'POSTED', 'header.warehouseId': { $in: missing.map(w => w._id) }, 'header.openingAt': { $ne: null } } },
    { $group: { _id: '$header.warehouseId', openingAt: { $min: '$header.openingAt' } } },
  ]).toArray()).map(row => ({ warehouseId: row._id, openingAt: row.openingAt }));
}

export async function setupOpeningStock(uri, { apply = false, allowRemote = false } = {}) {
  const database = openingStockTarget(uri, { allowRemote });
  const connection = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 }).asPromise();
  try {
    const db = connection.db;
    const permissions = PERMISSION_CATALOGUE.filter(p => p.code.startsWith('opening_stock:'));
    const openingIndexes = await db.collection('opening_stocks').indexes().catch(error => (error.codeName === 'NamespaceNotFound' ? [] : Promise.reject(error)));
    const fileImportIndex = openingIndexes.find(index => index.name === 'opening_stock_file_import_once');
    // Opening stock is entered in parts since 27/11/2026: several POSTED documents per warehouse.
    const backfill = await cutoffBackfill(db);
    if (!apply) return { applied: false, database, permissionCodes: permissions.map(p => p.code), dropFileImportOnceIndex: Boolean(fileImportIndex), cutoffBackfillWarehouses: backfill.length, ownerOnly: true };
    const indexes = await db.collection('permissions').indexes();
    if (!indexes.some(index => index.unique && index.key.code === 1 && Object.keys(index.key).length === 1 && !index.sparse && !index.partialFilterExpression)) throw new Error('Existing permissions.code must have its unique index before setup.');
    if (fileImportIndex) await db.collection('opening_stocks').dropIndex(fileImportIndex.name);
    const previousIndex = openingIndexes.find(index => index.unique && index.key['header.warehouseId'] === 1 && Object.keys(index.key).length === 1 && index.name === 'header.warehouseId_1');
    if (previousIndex && (previousIndex.partialFilterExpression?.workflowStatus !== 'POSTED' || Object.keys(previousIndex.partialFilterExpression).length !== 1)) throw new Error('The previous opening-stock warehouse index has unexpected options. No data changed.');
    if (previousIndex) await db.collection('opening_stocks').dropIndex(previousIndex.name);
    const session = await connection.startSession();
    try {
      await session.withTransaction(async () => {
        for (const permission of permissions) {
          const now = new Date();
          await db.collection('permissions').updateOne({ code: permission.code }, { $setOnInsert: { code: permission.code, name: permission.code, isActive: true, createdAt: now }, $set: { description: permission.description, updatedAt: now } }, { upsert: true, session });
          const saved = await db.collection('permissions').findOne({ code: permission.code }, { session });
          await db.collection('roles').updateMany({ code: { $in: permission.roles } }, { $addToSet: { permissionIds: saved._id } }, { session });
          await db.collection('roles').updateMany({ code: { $ne: 'OWNER' } }, { $pull: { permissionIds: saved._id } }, { session });
        }
        await db.collection('warehouses').updateMany({ stockOperationVersion: { $exists: false } }, { $set: { stockOperationVersion: 0 } }, { session });
        for (const { warehouseId, openingAt } of backfill) {
          await db.collection('warehouses').updateOne({ _id: warehouseId, openingCutoffAt: { $exists: false } }, { $set: { openingCutoffAt: openingAt } }, { session });
        }
      });
    } finally { await session.endSession(); }
    return { applied: true, database, permissionCodes: permissions.map(p => p.code) };
  } finally { await connection.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const uri = process.argv.slice(2).find(arg => !arg.startsWith('--')) || process.env.MONGODB_URI;
  setupOpeningStock(uri, { apply: process.argv.includes('--apply'), allowRemote: process.argv.includes('--allow-remote') }).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(uri ? error.message.replaceAll(uri, '[MONGODB_URI]') : error.message); process.exitCode = 1; });
}
