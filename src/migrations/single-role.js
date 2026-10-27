import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { ROLE_CODES } from '../models/constants.js';

export const MIGRATION_ID = 'single-role-2026-10-28';
const { EJSON } = mongoose.mongo.BSON;
const own = (object, key) => Object.hasOwn(object, key);
const oid = (value) => value?._bsontype === 'ObjectId';
const hex = (value) => String(value).toLowerCase();

export function buildPlan(users, roles, assignments = {}) {
  if (!assignments || Array.isArray(assignments) || typeof assignments !== 'object') {
    throw new Error('Assignments must be a JSON object: userId -> roleCode.');
  }
  const byId = new Map(), byCode = new Map();
  for (const role of roles) {
    if (!oid(role._id) || !ROLE_CODES.includes(role.code) || byCode.has(role.code)) {
      throw new Error('Role catalogue contains invalid or duplicate role identities/codes.');
    }
    byId.set(hex(role._id), role);
    byCode.set(role.code, role);
  }
  const userIds = new Set(users.map((user) => hex(user._id)));
  const selected = new Map();
  for (const [id, code] of Object.entries(assignments)) {
    if (!/^[a-f\d]{24}$/i.test(id) || !userIds.has(id.toLowerCase()) || selected.has(id.toLowerCase())) {
      throw new Error(`Invalid, unknown or duplicate assignment userId: ${id}`);
    }
    if (!byCode.has(code)) throw new Error(`Invalid or missing assignment role for user ${id}.`);
    selected.set(id.toLowerCase(), byCode.get(code)._id);
  }
  const valid = (id) => oid(id) && byId.has(hex(id));
  const changes = [], blocked = [];
  for (const user of users) {
    const hasNew = own(user, 'roleId');
    const hasOld = own(user, 'roleIds');
    const hasLegacy = own(user, 'role');
    const singleOld = Array.isArray(user.roleIds) && user.roleIds.length === 1 && valid(user.roleIds[0]);
    const consistent = valid(user.roleId) && (!hasOld || (singleOld && hex(user.roleIds[0]) === hex(user.roleId)));
    let roleId = selected.get(hex(user._id));
    if (!roleId && !hasLegacy) {
      if (consistent) roleId = user.roleId;
      else if (!hasNew && singleOld) roleId = user.roleIds[0];
    }
    if (!roleId) {
      blocked.push({ userId: hex(user._id), reason: 'Select one valid role explicitly; missing, multiple, dangling or conflicting role data.' });
      continue;
    }
    if (!hasNew || hex(user.roleId) !== hex(roleId) || hasOld || hasLegacy) {
      changes.push({ id: user._id, roleId, ...(hasOld ? { removeRoleIds: true } : {}), ...(hasLegacy ? { removeLegacyRole: true } : {}) });
    }
  }
  return { migration: MIGRATION_ID, totalUsers: users.length, changes, blocked };
}

export async function planUpgrade(db, { assignments = {}, session } = {}) {
  const options = session ? { session } : {};
  const users = await db.collection('users').find({}, { ...options,
    projection: { _id: 1, roleId: 1, roleIds: 1, role: 1 },
  }).sort({ _id: 1 }).toArray();
  const roles = await db.collection('roles').find({}, { ...options,
    projection: { _id: 1, code: 1 },
  }).sort({ _id: 1 }).toArray();
  return { ...buildPlan(users, roles, assignments), fingerprint: createHash('sha256')
    .update(EJSON.stringify({ users, roles }, { relaxed: false })).digest('hex') };
}

export const summarizePlan = (plan) => ({
  migration: plan.migration, totalUsers: plan.totalUsers,
  changeCount: plan.changes.length, blocked: plan.blocked,
  changes: plan.changes.map(({ id, roleId }) => ({ userId: hex(id), roleId: hex(roleId) })),
});

export async function applyUpgrade(connection, { assignments = {}, backup } = {}) {
  const initial = await planUpgrade(connection.db, { assignments });
  if (initial.blocked.length) throw new Error(`Migration blocked: ${initial.blocked.length} user(s) need explicit assignments. Run --dry-run.`);
  const session = await connection.startSession();
  let backupResult;
  try {
    // Back up even on a data no-op: an interrupted run may still need its index.
    if (typeof backup !== 'function') throw new Error('A completed backup is required before any database writes.');
    backupResult = await backup(connection);
    if (!backupResult?.completed) throw new Error('Backup did not confirm completion; no database writes allowed.');
    await session.withTransaction(async () => {
      const current = await planUpgrade(connection.db, { assignments, session });
      if (current.fingerprint !== initial.fingerprint) throw new Error('Role assignments changed during backup; rerun while account writes are stopped.');
      for (const change of current.changes) {
        const unset = {
          ...(change.removeRoleIds ? { roleIds: '' } : {}),
          ...(change.removeLegacyRole ? { role: '' } : {}),
        };
        const result = await connection.db.collection('users').updateOne({ _id: change.id }, {
          $set: { roleId: change.roleId }, ...(Object.keys(unset).length ? { $unset: unset } : {}),
        }, { session });
        if (result.matchedCount !== 1) throw new Error('User changed during migration.');
      }
      const after = await planUpgrade(connection.db, { session });
      if (after.blocked.length || after.changes.length) throw new Error('Post-migration role verification failed.');
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    // MongoDB index DDL is outside the data transaction and is safe to retry.
    await connection.db.collection('users').createIndex({ roleId: 1 });
    return { ...summarizePlan(initial), applied: initial.changes.length, backup: backupResult.path };
  } finally {
    await session.endSession();
  }
}
