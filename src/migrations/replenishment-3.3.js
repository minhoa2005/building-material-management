import mongoose from 'mongoose';
import * as models from '../models/index.js';
import { PERMISSION_CATALOGUE } from '../seeds/data/permissions.data.js';

export const MIGRATION_ID = 'replenishment-3.3';
const permissionCodes = new Set([
  'replenishment_request:evaluate', 'notification:read', 'notification:mark_read',
]);
const newPermissions = PERMISSION_CATALOGUE.filter(({ code }) => permissionCodes.has(code));
const indexModels = [
  models.ProductWarehousePolicy, models.BusinessDocument, models.DocumentLine,
  models.DocumentLink, models.Notification, models.ReplenishmentPlanningGuard,
  models.Permission, models.Role,
];

/** Plan from stored BSON, without relying on defaults applied only during reads. */
export async function planUpgrade(db, { session } = {}) {
  const readOptions = session ? { session } : {};
  const changes = [];
  const queue = (collection, record, set, unset = {}) => {
    if (Object.keys(set).length || Object.keys(unset).length) {
      changes.push({ collection, id: record._id, set, unset });
    }
  };
  for (const policy of await db.collection('product_warehouse_policies').find({}, readOptions).toArray()) {
    const set = {};
    if (policy.targetQty === undefined) set.targetQty = policy.minimumQty;
    if (policy.version === undefined) set.version = 1;
    await models.ProductWarehousePolicy.hydrate({ ...policy, ...set }).validate();
    // No updatedBy is invented for historical policy records.
    queue('product_warehouse_policies', policy, set);
  }
  const requests = await db.collection('business_documents')
    .find({ documentKind: 'REPLENISHMENT' }, readOptions).toArray();
  for (const request of requests) {
    const header = { ...request.header };
    const set = {}, unset = {};
    if (header.creationKey === undefined) {
      header.creationKey = `migration:3.3:${request._id}`;
      set['header.creationKey'] = header.creationKey;
    }
    if (Object.hasOwn(header, 'creationMode')) {
      delete header.creationMode;
      unset['header.creationMode'] = '';
    }
    // Keep historical actor/time, workflow version and approvals unchanged.
    await models.BusinessDocument.hydrate({ ...request, header }).validate();
    queue('business_documents', request, set, unset);
    const lines = await db.collection('document_lines').find({ documentId: request._id }, readOptions).toArray();
    for (const line of lines) {
      const lineSet = {};
      if (line.lineKind === 'STANDARD') {
        if (line.details && Object.keys(line.details).length) {
          throw new Error(`RR line ${line._id} has unrecognized historical details; review before migration.`);
        }
        // Old records have no evaluated source snapshots. Preserve their actual
        // written reason instead of fabricating an SO/stocktake evaluation.
        lineSet.lineKind = 'REPLENISHMENT';
        lineSet.details = { triggerType: 'MANUAL_OTHER', reasonNote: header.triggerReason };
      } else if (line.lineKind !== 'REPLENISHMENT') {
        throw new Error(`RR line ${line._id} has an unexpected line kind.`);
      }
      await models.DocumentLine.hydrate({ ...line, ...lineSet }).validate();
      queue('document_lines', line, lineSet);
    }
  }
  const sourceEvents = await db.collection('outbox_events').find({
    eventType: { $in: ['STOCKTAKE_CLOSED', 'SALES_ORDER_SAVED'] },
  }, readOptions).toArray();
  for (const event of sourceEvents) {
    if (event.documentVersion == null) {
      throw new Error(`Outbox event ${event._id} needs its actual historical documentVersion; migration will not guess it.`);
    }
    await models.OutboxEvent.hydrate(event).validate();
  }
  const permissions = await db.collection('permissions').find({
    code: { $in: [...permissionCodes] },
  }, readOptions).toArray();
  const permissionIds = new Map(permissions.map(({ code, _id }) => [code, _id]));
  const inserts = [];
  for (const { code } of newPermissions) {
    if (!permissionIds.has(code)) {
      const _id = new mongoose.Types.ObjectId();
      inserts.push({ _id, code });
      permissionIds.set(code, _id);
    }
  }
  const roleGrants = [];
  for (const role of await db.collection('roles').find({}, readOptions).toArray()) {
    const existing = new Set((role.permissionIds ?? []).map(String));
    const add = newPermissions.filter(({ roles }) => roles.includes(role.code))
      .map(({ code }) => permissionIds.get(code)).filter((id) => !existing.has(String(id)));
    if (add.length) roleGrants.push({ id: role._id, permissionIds: add });
  }
  return { changes, inserts, roleGrants };
}

export const summarizePlan = ({ changes, inserts, roleGrants }) => ({
  updatedRecords: changes.reduce((counts, { collection }) => {
    counts[collection] = (counts[collection] ?? 0) + 1;
    return counts;
  }, {}),
  insertedPermissions: inserts.length,
  updatedRoles: roleGrants.length,
});

/** Index additions only. Never drop/sync indexes or replay the demo dataset. */
export async function applyUpgrade(connection, { backup } = {}) {
  const db = connection.db;
  const hello = await db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') {
    throw new Error('Migration requires a replica set or Atlas; no data changed.');
  }
  await planUpgrade(db); // Reject invalid data before backup/index/data writes.
  if (typeof backup !== 'function') throw new Error('A database backup is required before migration.');
  await backup(connection);
  for (const Model of indexModels) {
    await Model.createCollection();
    await Model.createIndexes();
  }
  const session = await connection.startSession();
  try {
    let summary;
    await session.withTransaction(async () => {
      const plan = await planUpgrade(db, { session });
      summary = summarizePlan(plan);
      for (const change of plan.changes) {
        const update = {};
        if (Object.keys(change.set).length) update.$set = change.set;
        if (Object.keys(change.unset).length) update.$unset = change.unset;
        await db.collection(change.collection).updateOne({ _id: change.id }, update, { session });
      }
      const now = new Date();
      for (const permission of plan.inserts) {
        await db.collection('permissions').insertOne({ ...permission, createdAt: now, updatedAt: now }, { session });
      }
      // Add only new grants to eligible existing roles; preserve Admin changes.
      for (const role of plan.roleGrants) {
        await db.collection('roles').updateOne({ _id: role.id }, {
          $addToSet: { permissionIds: { $each: role.permissionIds } }, $set: { updatedAt: now },
        }, { session });
      }
      const remaining = await planUpgrade(db, { session });
      if (remaining.changes.length || remaining.inserts.length || remaining.roleGrants.length) {
        throw new Error('Migration verification failed; transaction rolled back.');
      }
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    return summary;
  } finally {
    await session.endSession();
  }
}
