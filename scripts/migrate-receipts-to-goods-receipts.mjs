import 'dotenv/config';
import { MongoClient } from 'mongodb';

const targetDbName = 'wmsd_database';
const legacy = Object.freeze({
  purchase_receipts: 'PURCHASE',
  customer_return_receipts: 'CUSTOMER_RETURN',
  failed_delivery_receipts: 'FAILED_DELIVERY',
  transfer_receipts: 'TRANSFER',
});
const replacement = 'goods_receipts';
const apply = process.argv.includes('--apply');
const allowAtlas = process.argv.includes('--allow-atlas');
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required');
if (new URL(uri).pathname.replace(/^\//, '') !== targetDbName) throw new Error(`Target database must be ${targetDbName}`);
if (apply && !allowAtlas) throw new Error('Refusing Atlas write without --allow-atlas');

const replaceLegacyNames = value => {
  if (Array.isArray(value)) return value.map(replaceLegacyNames);
  if (value?._bsontype || value instanceof Date || Buffer.isBuffer(value)) return value;
  if (!value || typeof value !== 'object') return Object.values(legacy).includes(value) ? value : legacy[value] ? replacement : value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceLegacyNames(child)]));
};
const transform = (document, kind) => {
  const result = replaceLegacyNames(document);
  result.documentKind = kind;
  if (result.header?.receiptKind) result.header.receiptKind = kind;
  return result;
};
const names = async db => (await db.listCollections({}, { nameOnly: true }).toArray()).map(row => row.name);
const legacyReferenceCount = async db => {
  let total = 0;
  for (const name of await names(db)) {
    if (name === replacement || legacy[name]) continue;
    const rows = await db.collection(name).find({}).toArray();
    for (const row of rows) {
      const text = JSON.stringify(row);
      if (Object.keys(legacy).some(value => text.includes(`"${value}"`))) total += 1;
    }
  }
  return total;
};

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
await client.connect();
const db = client.db(targetDbName);
try {
  const current = await names(db);
  const targetCountBefore = current.includes(replacement) ? await db.collection(replacement).countDocuments() : 0;
  const missing = Object.keys(legacy).filter(name => !current.includes(name));
  const sourceDocs = [];
  for (const [collection, kind] of Object.entries(legacy)) {
    if (!current.includes(collection)) continue;
    for (const document of await db.collection(collection).find({}).toArray()) sourceDocs.push({ source: collection, kind, document: transform(document, kind) });
  }
  const ids = sourceDocs.map(row => String(row.document._id));
  const documentNos = sourceDocs.map(row => row.document.documentNo);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const duplicateDocumentNos = documentNos.filter((no, index) => documentNos.indexOf(no) !== index);
  const report = {
    database: db.databaseName,
    apply,
    existingLegacyCollections: Object.keys(legacy).filter(name => current.includes(name)),
    missingLegacyCollections: missing,
    sourceDocuments: sourceDocs.length,
    kinds: Object.fromEntries(Object.values(legacy).map(kind => [kind, sourceDocs.filter(row => row.kind === kind).length])),
    duplicateIds,
    duplicateDocumentNos,
    referencesBefore: await legacyReferenceCount(db),
    targetExists: current.includes(replacement),
  };
  if (!apply) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }
  if (duplicateIds.length || duplicateDocumentNos.length) throw new Error('Duplicate receipt identity detected; aborting');
  if (!current.includes(replacement)) await db.createCollection(replacement);
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      if (sourceDocs.length) await db.collection(replacement).insertMany(sourceDocs.map(row => row.document), { session, ordered: true });
      for (const name of (await names(db)).filter(value => !legacy[value] && value !== replacement)) {
        const collection = db.collection(name);
        const documents = await collection.find({}, { session, projection: { _id: 1 } }).toArray();
        for (const row of documents) {
          const original = await collection.findOne({ _id: row._id }, { session });
          const transformed = replaceLegacyNames(original);
          if (JSON.stringify(original) !== JSON.stringify(transformed)) await collection.replaceOne({ _id: row._id }, transformed, { session });
        }
      }
    });
  } finally { await session.endSession(); }
  const receiptIndexes = [
    { key: { documentKind: 1, documentNo: 1 }, name: 'documentKind_1_documentNo_1', unique: true },
    { key: { 'header.warehouseId': 1, createdAt: -1 }, name: 'documentKind_1_header.warehouseId_1_createdAt_-1' },
    { key: { 'items._id': 1 }, name: 'items._id_1' },
    { key: { 'sources.documentId': 1 }, name: 'sources.documentId_1' },
    { key: { 'items.sources.itemId': 1 }, name: 'items.sources.itemId_1' },
    { key: { workflowStatus: 1, createdAt: -1 }, name: 'workflowStatus_1_createdAt_-1' },
    { key: { 'demandReopenings._id': 1 }, name: 'demandReopenings._id_1', unique: true, sparse: true },
    { key: { 'commitmentTransfers._id': 1 }, name: 'commitmentTransfers._id_1', unique: true, sparse: true },
  ];
  await db.collection(replacement).createIndexes(receiptIndexes);
  const nativeIndexes = {
    uoms: [{ key: { code: 1 }, name: 'code_1', unique: true }],
    conversions: [
      { key: { productId: 1, productBatchId: 1, uomId: 1, validFrom: 1 }, name: 'productId_1_productBatchId_1_uomId_1_validFrom_1', unique: true },
      { key: { productId: 1, productBatchId: 1, uomId: 1, version: 1 }, name: 'productId_1_productBatchId_1_uomId_1_version_1', unique: true },
    ],
  };
  for (const [collection, indexes] of Object.entries(nativeIndexes)) {
    if (!(await names(db)).includes(collection)) await db.createCollection(collection);
    await db.collection(collection).createIndexes(indexes);
  }
  const afterReferences = await legacyReferenceCount(db);
  const targetCount = await db.collection(replacement).countDocuments();
  const expectedTargetCount = targetCountBefore + sourceDocs.length;
  if (targetCount !== expectedTargetCount || afterReferences !== 0) throw new Error(`Verification failed: target=${targetCount}, expected=${expectedTargetCount}, refs=${afterReferences}`);
  for (const collection of Object.keys(legacy)) if (current.includes(collection)) await db.collection(collection).drop();
  console.log(JSON.stringify({ ...report, targetCount, referencesAfter: afterReferences, dropped: Object.keys(legacy).filter(name => current.includes(name)) }, null, 2));
} finally { await client.close(); }
