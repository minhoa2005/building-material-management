import mongoose from 'mongoose';
import { Permission, Role } from '../models/index.js';
import { ROLE_PERMISSIONS } from './data/permissions.data.js';
import { buildDemoData } from './data/demo.data.js';

/** Check actual data, including collections that are not registered as models. */
export async function databaseHasData(db, { collectionNames, session } = {}) {
  const names = collectionNames ?? (await db.listCollections({}, { nameOnly: true }).toArray())
    .map(({ name }) => name).filter((name) => !name.startsWith('system.'));
  for (const name of names) {
    if (await db.collection(name).findOne({}, { projection: { _id: 1 }, ...(session ? { session } : {}) })) {
      return true;
    }
  }
  return false;
}

/** Explicit maintenance command: update existing roles only; never insert. */
export async function syncExistingRolePermissions() {
  const permissions = await Permission.find({}).lean();
  const permissionMap = new Map(permissions.map(({ code, _id }) => [code, _id]));
  const roles = await Role.find({ code: { $in: Object.keys(ROLE_PERMISSIONS) } });
  // Validate the entire catalogue before modifying any role.
  for (const role of roles) {
    for (const code of ROLE_PERMISSIONS[role.code]) {
      if (!permissionMap.has(code)) throw new Error(`Cannot sync roles: missing permission ${code}.`);
    }
  }
  for (const role of roles) {
    role.permissionIds = ROLE_PERMISSIONS[role.code].map((code) => permissionMap.get(code));
    await role.save();
  }
  console.info(`[Seed] Synced permissions for ${roles.length} existing role(s); no records inserted.`);
  return { seeded: false, syncedRoles: roles.length };
}

/**
 * Seed only a completely empty database. Replica set / Atlas is required for
 * atomicity. A failure leaves no partial fixture data; a second run is a no-op.
 * syncRolePermissions is an explicit update-only maintenance operation.
 */
export async function runSeeds({ syncRolePermissions = false } = {}) {
  if (mongoose.connection.readyState !== 1) throw new Error('Seeding requires an active MongoDB connection.');
  const db = mongoose.connection.db;
  if (await databaseHasData(db)) {
    if (syncRolePermissions) return syncExistingRolePermissions();
    console.info('[Seed] Skipped: database already contains data.');
    return { seeded: false, reason: 'DATABASE_NOT_EMPTY' };
  }

  // Fail before any inserts on standalone MongoDB, rather than seeding partially.
  const hello = await db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') {
    throw new Error('Atomic seeding requires MongoDB Atlas or a replica set; no data was inserted.');
  }
  const groups = await buildDemoData();
  for (const { documents } of groups) {
    for (const document of documents) await document.validate();
  }
  // Create collections/indexes before the transaction (never drop/sync indexes).
  for (const { Model } of groups) {
    await Model.createCollection();
    await Model.createIndexes();
  }
  const collectionNames = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map(({ name }) => name).filter((name) => !name.startsWith('system.'));
  const session = await mongoose.startSession();
  try {
    let seeded = false;
    await session.withTransaction(async () => {
      seeded = false;
      // Recheck after preparing the fixtures and acquiring a transaction snapshot.
      if (await databaseHasData(db, { collectionNames, session })) return;
      // Keep operations sequential on the same session. Stable IDs + unique
      // indexes also prevent two concurrent seed runs from committing duplicates.
      for (const { Model, documents } of groups) {
        await Model.insertMany(documents.map((document) => document.toObject()), { session, ordered: true });
      }
      seeded = true;
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    const counts = seeded ? Object.fromEntries(groups.map(({ Model, documents }) => [Model.modelName, documents.length])) : {};
    console.info(seeded ? '[Seed] Inserted complete demo dataset.' : '[Seed] Skipped: database already contains data.');
    return { seeded, ...(seeded ? { counts } : { reason: 'DATABASE_NOT_EMPTY' }) };
  } finally {
    await session.endSession();
  }
}

export const seedRolesAndUsers = runSeeds;
