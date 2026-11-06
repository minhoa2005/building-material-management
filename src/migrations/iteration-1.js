import * as models from "../models/legacy/index.js";

export const MIGRATION_ID = "iteration-1-master-data";

const indexModels = [
  models.Product,
  models.ProductUomVersion,
  models.ProductWarehousePolicy,
  models.Party,
  models.Lot,
  models.Approval,
  models.BusinessOperation,
  models.AuditEvent,
  models.ReplenishmentSubmission,
];

const normalizeCode = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

function duplicateGroups(records, field) {
  const groups = new Map();
  for (const record of records) {
    const key = normalizeCode(record[field]);
    if (!key) continue;
    const values = groups.get(key) || [];
    values.push(String(record._id));
    groups.set(key, values);
  }
  return [...groups]
    .filter(([, ids]) => ids.length > 1)
    .map(([normalized, ids]) => ({ normalized, ids }));
}

function assertNoDuplicates(products, parties) {
  const skuDuplicates = duplicateGroups(products, "sku");
  const codeDuplicates = duplicateGroups(parties, "code");
  if (skuDuplicates.length || codeDuplicates.length) {
    const details = JSON.stringify({ skuDuplicates, codeDuplicates });
    throw new Error(
      `Duplicate normalized master identifiers require manual resolution: ${details}`,
    );
  }
}

export async function planIteration1Upgrade(db, { session } = {}) {
  const readOptions = session ? { session } : {};
  const changes = [];
  const queue = (collection, id, set, unset = {}) => {
    if (Object.keys(set).length || Object.keys(unset).length) {
      changes.push({ collection, id, set, unset });
    }
  };

  const products = await db
    .collection("products")
    .find({}, readOptions)
    .toArray();
  const parties = await db
    .collection("parties")
    .find({}, readOptions)
    .toArray();
  assertNoDuplicates(products, parties);

  for (const product of products) {
    if (product.version == null) {
      queue("products", product._id, { version: 1 });
    }
  }

  for (const party of parties) {
    const set = {};
    if (party.version == null) set.version = 1;
    if (party.kind === "SUPPLIER" && party.cooperationStatus == null) {
      set.cooperationStatus = party.isActive === false ? "SUSPENDED" : "ACTIVE";
    }
    queue("parties", party._id, set);
  }

  const [lineLotIds, balanceLotIds] = await Promise.all([
    db.collection("document_lines").distinct("lotId", {}, readOptions),
    db.collection("stock_balances").distinct("lotId", {}, readOptions),
  ]);
  const referencedLots = new Set(
    [...lineLotIds, ...balanceLotIds].filter(Boolean).map(String),
  );
  const lots = await db.collection("lots").find({}, readOptions).toArray();
  for (const lot of lots) {
    const set = {};
    if (lot.version == null) set.version = 1;
    if (lot.identityLocked == null) set.identityLocked = false;
    if (referencedLots.has(String(lot._id)) && lot.identityLocked !== true) {
      set.identityLocked = true;
    }
    queue("lots", lot._id, set);
  }

  return {
    changes,
    normalizedCodeDuplicates: {
      sku: duplicateGroups(products, "sku"),
      partyCode: duplicateGroups(parties, "code"),
    },
    indexes: indexModels.flatMap((model) =>
      model.schema.indexes().map(([keys, options]) => ({
        collection: model.collection.name,
        keys,
        options,
      })),
    ),
  };
}

export function summarizePlan({ changes, indexes }) {
  return {
    updatedRecords: changes.reduce((counts, { collection }) => {
      counts[collection] = (counts[collection] ?? 0) + 1;
      return counts;
    }, {}),
    indexDefinitions: indexes.length,
  };
}

export async function applyIteration1Upgrade(connection, { backup } = {}) {
  const db = connection.db;
  const hello = await db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== "isdbgrid") {
    throw new Error("Migration requires a replica set or Atlas; no data changed.");
  }
  await planIteration1Upgrade(db);
  if (typeof backup !== "function") {
    throw new Error("A database backup is required before migration.");
  }
  await backup(connection);

  // Index creation is deliberately outside the data transaction and never drops
  // an index. A failed build leaves data untouched because it runs first.
  for (const Model of indexModels) {
    await Model.createCollection();
    await Model.createIndexes();
  }

  const session = await connection.startSession();
  try {
    let summary;
    await session.withTransaction(async () => {
      const plan = await planIteration1Upgrade(db, { session });
      summary = summarizePlan(plan);
      for (const change of plan.changes) {
        const update = {};
        if (Object.keys(change.set).length) update.$set = change.set;
        if (Object.keys(change.unset).length) update.$unset = change.unset;
        await db
          .collection(change.collection)
          .updateOne({ _id: change.id }, update, { session });
      }
      const remaining = await planIteration1Upgrade(db, { session });
      if (remaining.changes.length) {
        throw new Error("Migration verification failed; transaction rolled back.");
      }
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
    return summary;
  } finally {
    await session.endSession();
  }
}