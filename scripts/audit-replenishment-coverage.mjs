import mongoose from 'mongoose';
import { registerModels } from '../src/models/index.js';

// Read-only by design: never repairs or normalizes historical business records.
const args = process.argv.slice(2);
if (args.includes('--apply')) throw new Error('This audit does not support writes');
const uriIndex = args.indexOf('--uri');
const uri = uriIndex >= 0 ? args[uriIndex + 1] : 'mongodb://127.0.0.1:27017/wmsd_database?replicaSet=rs0';
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(uri ?? '')) throw new Error('Use an explicit loopback database URI');
await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, autoCreate: false, autoIndex: false });
try {
  const models = registerModels(mongoose.connection);
  const requests = await models.get('replenishment_requests').find({ workflowStatus: { $in: ['DRAFT','SUBMITTED','APPROVED'] } }).lean();
  let indexes = [];
  try { indexes = await mongoose.connection.collection('replenishment_locks').indexes(); }
  catch (error) { if (error.code !== 26) throw error; }
  const unresolved = [], manual = [], groups = new Map();
  for (const rr of requests) for (const line of rr.items ?? []) {
    const ref = { requestId: String(rr._id), itemId: String(line._id) };
    if (line.details?.triggerType === 'MANUAL_OTHER') { manual.push(ref); continue; }
    const key = line.details?.canonicalSourceKey;
    if (!key) { unresolved.push({ ...ref, reason: 'MISSING_CANONICAL_SOURCE' }); continue; }
    const source = line.details?.source;
    if (!source) { unresolved.push({ ...ref, reason: 'MISSING_NATIVE_SOURCE' }); continue; }
    if (source.triggerType === 'SALES_SHORTAGE') {
      const order = source.salesOrderId && await models.get('sales_orders').findById(source.salesOrderId).lean();
      const item = order?.items.find(i => String(i._id) === String(source.salesOrderItemId));
      if (!item || String(item.productId) !== String(line.productId) || key !== 'SO:' + order._id + ':' + item._id) {
        unresolved.push({ ...ref, reason: 'INVALID_SALES_DEMAND_CHAIN' }); continue;
      }
      if (source.documentType === 'warehouse_issue_requests') {
        const wir = await models.get('warehouse_issue_requests').findById(source.documentId).lean();
        const release = wir?.items.find(i => String(i._id) === String(source.itemId));
        if (String(wir?.header.salesOrderId) !== String(order._id) || String(release?.details.salesOrderLineId) !== String(item._id)) {
          unresolved.push({ ...ref, reason: 'INVALID_WIR_CHAIN' }); continue;
        }
      }
    } else if (['STOCK_THRESHOLD','STOCKTAKE_LOW_STOCK'].includes(source.triggerType)) {
      const product = await models.get('products').findById(line.productId).lean();
      if (!product?.stockThresholds.some(t => String(t.warehouseId) === String(rr.header.warehouseId)) || key !== 'THRESHOLD:' + rr.header.warehouseId + ':' + line.productId) {
        unresolved.push({ ...ref, reason: 'INVALID_THRESHOLD_SOURCE' }); continue;
      }
      if (source.triggerType === 'STOCKTAKE_LOW_STOCK') {
        const stocktake = await models.get('stocktakes').findById(source.documentId).lean();
        if (!stocktake || String(stocktake.header.warehouseId) !== String(rr.header.warehouseId)) {
          unresolved.push({ ...ref, reason: 'INVALID_STOCKTAKE_CONTEXT' }); continue;
        }
      }
    } else { unresolved.push({ ...ref, reason: 'UNKNOWN_SOURCE_KIND' }); continue; }
    const entries = groups.get(key) ?? []; entries.push(ref); groups.set(key, entries);
  }
  const report = { mode: 'DRY_RUN_READ_ONLY', activeRequests: requests.length,
    uniqueWarehouseProductIndex: indexes.some(i => i.unique && i.key.warehouseId === 1 && i.key.productId === 1),
    unresolvedSources: unresolved, manualLinesPreserved: manual.length,
    sharedSourceCandidates: [...groups].filter(([, entries]) => entries.length > 1).map(([key, lines]) => ({ key, lines })),
    note: 'Shared-source candidates require quantity/lineage review; they are not automatically duplicates. No records changed.' };
  console.log(JSON.stringify(report, null, 2));
  if (unresolved.length || !report.uniqueWarehouseProductIndex) process.exitCode = 2;
} finally { await mongoose.disconnect(); }
