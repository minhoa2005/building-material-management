import mongoose from 'mongoose';
import { performance } from 'node:perf_hooks';
import { writeFile } from 'node:fs/promises';
import * as m from '../src/models/legacy/index.js';
import { buildDemoData } from '../src/seeds/data/demo.data.js';
import { receivingTrips, receivingSummary, receivingQueue } from '../src/modules/po-receiving/purchase-read.service.js';
import { listPurchaseOrders } from '../src/modules/purchase-orders/purchase-order.service.js';

if (!process.env.MONGODB_TEST_URI) throw new Error('MONGODB_TEST_URI is required; benchmark uses an isolated random DB');
const uri = new URL(process.env.MONGODB_TEST_URI);
if (!['127.0.0.1','localhost'].includes(uri.hostname)) throw new Error('Benchmark is restricted to local MongoDB');
const dbName = 'sep490_purchase_benchmark_' + new mongoose.Types.ObjectId();
const oid = () => new mongoose.Types.ObjectId();
try {
  await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName, autoIndex: false });
  for (const Model of Object.values(m).filter(x => x?.modelName)) await Model.createIndexes();
  for (const { Model, documents } of await buildDemoData()) if (documents.length) await Model.insertMany(documents);
  const user = await m.User.findOne({ username: 'warehouse@ceratile.vn' }).populate({ path: 'roleId', populate: { path: 'permissionIds' } }).lean();
  const template = await m.BusinessDocument.findOne({ documentNo: 'DEMO-PURCHASE-PENDING' }).lean();
  const templateLine = await m.DocumentLine.findOne({ documentId: template._id }).lean();
  const lot = await m.Lot.findOne({ productId: templateLine.productId, identificationStatus: 'VERIFIED' }).lean();
  const receiving = await m.Location.findOne({ warehouseId: template.header.warehouseId, kind: 'RECEIVING' }).lean();
  const documents = [], lines = [], links = [], poIds = [];
  const timestamp = new Date();
  for (let p = 0; p < 100; p += 1) {
    const poId = oid(), poLineId = oid(); poIds.push(poId);
    documents.push({ _id: poId, documentNo: 'BENCH-PO-' + p, documentKind: 'PO', workflowStatus: 'OPEN', version: 1, createdBy: template.createdBy, header: template.header, createdAt: timestamp, updatedAt: timestamp });
    const base = { productId: templateLine.productId, conversionId: templateLine.conversionId, productNameSnapshot: templateLine.productNameSnapshot, conversionSnapshot: templateLine.conversionSnapshot };
    lines.push({ ...base, _id: poLineId, documentId: poId, lineKind: 'STANDARD', lineNo: 1, enteredQty: mongoose.Types.Decimal128.fromString('100'), qtyBase: mongoose.Types.Decimal128.fromString('100') });
    for (let t = 0; t < 100; t += 1) {
      const inspectionId = oid(), inspectionLineId = oid();
      const isConfirmed = t % 2 === 0;
      documents.push({ _id: inspectionId, documentNo: 'BENCH-I-' + p + '-' + t, documentKind: 'PO_INSPECTION', workflowStatus: isConfirmed ? 'CONFIRMED' : 'DRAFT', version: 1, createdBy: user._id,
        header: { purchaseOrderId: poId, warehouseId: template.header.warehouseId, supplierId: template.header.supplierId, sourcePoVersion: 1, creationKey: 'bench-' + p + '-' + t, arrivedAt: timestamp }, createdAt: timestamp, updatedAt: timestamp });
      const amount = mongoose.Types.Decimal128.fromString('1');
      lines.push({ ...base, _id: inspectionLineId, documentId: inspectionId, lineKind: 'PO_INSPECTION', lineNo: 1, lotId: lot._id, enteredQty: amount, qtyBase: amount,
        details: { poLineId, qualityCode: 'GOOD', clientLineKey: 'line', plannedReceiptLocationId: receiving._id } });
      links.push({ sourceLineId: poLineId, targetLineId: inspectionLineId, relationCode: 'SOURCE', linkedQty: amount });
      if (isConfirmed) {
        const grId = oid();
        documents.push({ _id: grId, documentNo: 'BENCH-GR-' + p + '-' + t, documentKind: 'GR_PURCHASE', workflowStatus: 'DRAFT', version: 1, createdBy: user._id,
          header: { purchaseOrderId: poId, warehouseId: template.header.warehouseId, supplierId: template.header.supplierId, poInspectionId: inspectionId }, createdAt: timestamp, updatedAt: timestamp });
        lines.push({ ...base, _id: oid(), documentId: grId, lineKind: 'PURCHASE_RECEIPT', lineNo: 1, lotId: lot._id, enteredQty: amount, qtyBase: amount,
          details: { poLineId, inspectionLineId, receivingLocationId: receiving._id, qualityCode: 'GOOD' } });
      }
    }
  }
  // Synthetic read-only load fixtures. Raw inserts avoid generating unrelated audit/stock activity.
  await m.BusinessDocument.collection.insertMany(documents);
  await m.DocumentLine.collection.insertMany(lines);
  await m.LineLink.collection.insertMany(links);
  let calls = 0; mongoose.set('debug', () => { calls += 1; });
  const result = { fixture: { purchaseOrders: 100, tripsPerPo: 100, addedDocuments: documents.length, addedLines: lines.length, addedLinks: links.length, stockPostings: 0 }, samples: 12, measurements: {} };
  const actions = {
    trips5: () => receivingTrips(user, String(poIds[0]), { page: 1, limit: 5 }),
    trips50: () => receivingTrips(user, String(poIds[0]), { page: 1, limit: 50 }),
    summary: () => receivingSummary(user, String(poIds[0])),
    queue20: () => receivingQueue(user, { page: 1, limit: 20, stage: 'AWAITING_POST' }),
    poList20: () => listPurchaseOrders(user, { page: 1, limit: 20 }),
  };
  for (const [name, run] of Object.entries(actions)) {
    await run(); await run();
    const times = [], queries = [];
    for (let i = 0; i < result.samples; i += 1) {
      calls = 0; const start = performance.now(); await run(); times.push(performance.now() - start); queries.push(calls);
    }
    times.sort((a,b) => a-b);
    result.measurements[name] = { p50Ms: Number(times[Math.ceil(times.length * .5) - 1].toFixed(2)), p95Ms: Number(times[Math.ceil(times.length * .95) - 1].toFixed(2)), minQueries: Math.min(...queries), maxQueries: Math.max(...queries) };
  }
  mongoose.set('debug', false);
  if (result.measurements.trips5.maxQueries !== result.measurements.trips50.maxQueries) throw new Error('Trip query count grows with page size');
  await writeFile(new URL('../docs/po-receiving-proposal/benchmark-v3.json', import.meta.url), JSON.stringify({ measuredAt: new Date().toISOString(), environment: 'local MongoDB replica set; service calls, warm cache, sequential requests; not a production SLA', ...result }, null, 2) + '\n');
  console.info(JSON.stringify(result, null, 2));
} finally {
  mongoose.set('debug', false);
  if (mongoose.connection.readyState && mongoose.connection.name === dbName && /^sep490_purchase_benchmark_[a-f\d]{24}$/.test(dbName)) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
