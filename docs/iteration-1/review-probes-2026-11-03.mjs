// Review evidence only. Uses a new disposable database; never connects to sep490.
// Run from be: $env:MONGODB_TEST_URI='mongodb://127.0.0.1:27017/?replicaSet=rs0'; node docs/iteration-1/review-probes-2026-11-03.mjs
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import * as m from '../../src/models/index.js';
import { buildDemoData } from '../../src/seeds/data/demo.data.js';

const uri = process.env.MONGODB_TEST_URI;
assert.ok(uri, 'MONGODB_TEST_URI is required');
const dbName = `sep490_review_20261103_${new mongoose.Types.ObjectId()}`;
let server;
const results = { reviewedOn: '2026-11-03', database: dbName, checks: {} };
try {
  await mongoose.connect(uri, { dbName, autoIndex: false, serverSelectionTimeoutMS: 5000 });
  for (const Model of Object.values(m).filter(v => v?.modelName)) await Model.createIndexes();
  for (const { Model, documents } of await buildDemoData()) if (documents.length) await Model.insertMany(documents);
  process.env.JWT_SECRET = 'isolated-review-probe-only';
  const { default: app } = await import('../../src/app.js');
  server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const root = `http://127.0.0.1:${server.address().port}/api`;
  const sid = v => String(v?._id ?? v);
  async function api(user, method, path, body) {
    const response = await fetch(root + path, { method, headers: {
      Authorization: `Bearer ${jwt.sign({ userId: sid(user) }, process.env.JWT_SECRET)}`,
      'Content-Type': 'application/json',
    }, ...(body && { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() };
  }
  const users = await m.User.find().lean();
  for (const role of ['sales', 'warehouse', 'admin']) {
    const user = users.find(u => u.username === `${role}@ceratile.vn`);
    const list = await api(user, 'GET', '/suppliers');
    const names = await api(user, 'GET', '/suppliers/names');
    results.checks[`supplierNames_${role}`] = { listStatus: list.status, namesStatus: names.status, namesCount: names.body.data?.length };
    assert.equal(list.status, 403); assert.equal(names.status, 200);
  }
  const user = users.find(u => u.username === 'warehouse@ceratile.vn');
  const po = await m.BusinessDocument.findOne({ documentKind: 'PO', workflowStatus: 'OPEN', 'header.warehouseId': { $in: user.warehouseIds } }).lean();
  assert.ok(po);
  const line = await m.DocumentLine.findOne({ documentId: po._id }).lean();
  const receiving = await m.Location.findOne({ warehouseId: po.header.warehouseId, kind: 'RECEIVING' }).lean();
  const storage = await m.Location.findOne({ warehouseId: po.header.warehouseId, kind: 'STORAGE', allocatable: true }).lean();
  const lot = await m.Lot.create({ productId: line.productId, manufacturerLot: 'REVIEW-20261103', tone: 'UNKNOWN', calibre: 'UNKNOWN', identificationStatus: 'UNKNOWN' });
  const created = await api(user, 'POST', `/purchase-orders/${po._id}/inspections`, { creationKey: 'unknown-lot-probe', expectedPoVersion: po.version, arrivedAt: new Date(Date.now() - 1000).toISOString(), lines: [{ clientLineKey: 'line-1', poLineId: sid(line), lotId: sid(lot), enteredQty: '1', plannedReceiptLocationId: sid(receiving) }] });
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const confirmed = await api(user, 'POST', `/po-inspections/${created.body.data.id}/confirm`, { expectedVersion: created.body.data.version, expectedPoVersion: po.version, operationKey: 'unknown-lot-confirm' });
  assert.equal(confirmed.status, 200, JSON.stringify(confirmed.body));
  const grId = confirmed.body.data.goodsReceiptId;
  const gr = await m.BusinessDocument.findById(grId).lean();
  const currentPo = await m.BusinessDocument.findById(po._id).lean();
  const posted = await api(user, 'POST', `/purchase-receipts/${grId}/post`, { expectedVersion: gr.version, expectedPoVersion: currentPo.version, operationKey: 'unknown-lot-post' });
  assert.equal(posted.status, 200, JSON.stringify(posted.body));
  const ctx = await api(user, 'GET', `/purchase-receipts/${grId}/putaway-context`);
  assert.equal(ctx.status, 200);
  const row = ctx.body.data.lines[0];
  const placement = await api(user, 'POST', `/purchase-receipts/${grId}/putaway-tasks`, { expectedVersion: ctx.body.data.receiptVersion, creationKey: 'unknown-lot-putaway', lines: [{ receiptLineId: row._id, expectedPlacementVersion: row.placementVersion, expectedSourceVersion: row.sourceBalanceVersion, qtyBase: row.qtyBase, toLocationId: sid(storage) }] });
  assert.equal(placement.status, 409);
  results.checks.unknownLot = { createStatus: created.status, confirmStatus: confirmed.status, postStatus: posted.status, putawayAllocatableStatus: placement.status, putawayCode: placement.body.code, interpretation: 'UNKNOWN is allowed into owned Receiving; allocatable Storage is blocked.' };
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName && /^sep490_review_20261103_[a-f0-9]{24}$/.test(dbName)) {
    await mongoose.connection.dropDatabase(); results.databaseRemoved = true;
  }
  await mongoose.disconnect();
}
await writeFile(new URL('./review-evidence-2026-11-03.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
