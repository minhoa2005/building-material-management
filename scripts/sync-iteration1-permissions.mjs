import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { requireLoopbackMongoUri } from '../src/config/local-mongo.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from '../src/seeds/data/permissions.data.js';

const migrationCodes = [
  'uom:read', 'uom:create', 'uom:update', 'uom:activate',
  'purchase_custody:decide', 'purchase_custody:execute', 'stock_reversal:approve',
];
const catalogue = new Map(PERMISSION_CATALOGUE.map(permission => [permission.code, permission]));

async function audit(db, session) {
  const permissions = await db.collection('permissions').find({}, { session, projection: { code: 1, isActive: 1 } }).toArray();
  const roles = await db.collection('roles').find({}, { session, projection: { code: 1, permissionIds: 1 } }).toArray();
  if (!roles.length || !permissions.length) throw new Error('Target must be an existing database with roles and permissions.');
  const byCode = new Map(permissions.map(permission => [permission.code, permission]));
  const byId = new Map(permissions.map(permission => [String(permission._id), permission]));
  const missingPermissions = [...catalogue.keys()].filter(code => !byCode.has(code));
  const pendingCodes = migrationCodes.filter(code => missingPermissions.includes(code));
  const roleAudit = roles.map(role => {
    const refs = role.permissionIds ?? [];
    const activeCodes = new Set(refs.map(id => byId.get(String(id)))
      .filter(permission => permission && permission.isActive !== false).map(permission => permission.code));
    const defaults = Object.hasOwn(ROLE_PERMISSIONS, role.code) ? ROLE_PERMISSIONS[role.code] : [];
    return {
      role: role.code,
      missingGrants: defaults.filter(code => !activeCodes.has(code)),
      danglingPermissionRefs: refs.filter(id => !byId.has(String(id))).map(String),
      plannedGrants: defaults.filter(code => pendingCodes.includes(code)),
    };
  }).sort((a, b) => a.role.localeCompare(b.role));
  return {
    database: db.databaseName,
    missingPermissions,
    inactivePermissions: permissions.filter(permission => permission.isActive === false).map(permission => permission.code).sort(),
    plannedInsertions: pendingCodes,
    roles: roleAudit,
  };
}

export async function syncIteration1Permissions(uri, { apply = false } = {}) {
  requireLoopbackMongoUri(uri);
  const database = decodeURIComponent(new URL(uri).pathname.slice(1));
  if (!database || ['admin', 'config', 'local'].includes(database.toLowerCase())) {
    throw new Error('Pass the explicit name of the local application database.');
  }
  const connection = mongoose.createConnection(uri, { directConnection: true, serverSelectionTimeoutMS: 5000 });
  try {
    await connection.asPromise();
    const { db } = connection;
    if (!apply) return { applied: false, ...await audit(db) };

    // The deployed catalogue already has this unique index. Require it so concurrent
    // runs cannot create duplicate permissions, and leave index management to setup.
    const indexes = await db.collection('permissions').indexes();
    if (!indexes.some(index => index.unique && !index.sparse && !index.partialFilterExpression &&
      Object.keys(index.key).length === 1 && index.key.code === 1)) {
      throw new Error('Apply requires a unique index on permissions.code.');
    }
    const session = await connection.startSession();
    try {
      return await session.withTransaction(async () => {
        const plan = await audit(db, session);
        const insertedIds = new Map();
        for (const code of plan.plannedInsertions) {
          const now = new Date();
          const { insertedId } = await db.collection('permissions').insertOne({
            code, name: code, description: catalogue.get(code).description,
            isActive: true, createdAt: now, updatedAt: now,
          }, { session });
          insertedIds.set(code, insertedId);
        }
        const updatedRoles = [];
        for (const { role, plannedGrants } of plan.roles) {
          if (!plannedGrants.length) continue;
          const result = await db.collection('roles').updateOne({ code: role }, {
            $addToSet: { permissionIds: { $each: plannedGrants.map(code => insertedIds.get(code)) } },
            $set: { updatedAt: new Date() },
          }, { session });
          if (result.modifiedCount) updatedRoles.push(role);
        }
        return { applied: true, ...plan, insertedPermissions: [...insertedIds.keys()], updatedRoles };
      }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    } finally {
      await session.endSession();
    }
  } finally {
    await connection.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    const uris = args.filter(arg => arg.startsWith('--uri='));
    if (uris.length !== 1 || args.some(arg => !arg.startsWith('--uri=') && arg !== '--apply')) {
      throw new Error('Usage: node scripts/sync-iteration1-permissions.mjs --uri=mongodb://127.0.0.1:27017/<db> [--apply]');
    }
    const report = await syncIteration1Permissions(uris[0].slice(6), { apply: args.includes('--apply') });
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('[Iteration 1 permissions]', error.message);
    process.exitCode = 1;
  }
}
