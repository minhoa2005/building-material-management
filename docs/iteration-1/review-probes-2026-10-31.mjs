import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
// Review evidence only. Seeds and drops one randomly named local test database.
// Run from the backend: node docs/iteration-1/review-probes-2026-10-31.mjs
import * as m from '../../src/models/index.js';
import { buildDemoData } from '../../src/seeds/data/demo.data.js';
import { saigonDateOnly } from '../../src/shared/utils/domain.js';

const dbName = `sep490_review_it1_${new mongoose.Types.ObjectId()}`;
let server;
const evidence = { dbName, cases: [] };
try {
  await mongoose.connect('mongodb://127.0.0.1:27017/?replicaSet=rs0', { dbName, autoIndex: false });
  for (const Model of Object.values(m).filter(x => x?.modelName)) await Model.createIndexes();
  for (const { Model, documents } of await buildDemoData()) if (documents.length) await Model.insertMany(documents);
  const owner = await m.User.findOne({ username: 'owner@ceratile.vn' });
  const sales = await m.User.findOne({ username: 'sales@ceratile.vn' });
  const wh = await m.Warehouse.findOne({ code: 'WH01' });
  const supplier = await m.Party.findOne({ kind: 'SUPPLIER' });
  const store = await m.Party.findOne({ kind: 'STORE' });
  const product = await m.Product.findOne({ sku: 'GACH-DEMO-1' });
  const product2 = await m.Product.findOne({ sku: 'GACH-DEMO-2' });
  const piece = await m.Uom.findOne({ code: 'PIECE' });
  const conversion = await m.ProductUomVersion.findOne({ productId: product._id, uomId: piece._id });
  const location = await m.Location.findOne({ warehouseId: wh._id, kind: 'RECEIVING' });
  const account = await m.StockAccount.findOne({ locationId: location._id });
  process.env.JWT_SECRET = 'isolated-review-probe';
  const { default: app } = await import('../../src/app.js');
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function api(method, path, user, body) {
    const response = await fetch(base + path, {
      method, headers: { Authorization: `Bearer ${jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET)}`, 'Content-Type': 'application/json' },
      ...(body && { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  }
  async function chain(key, mode = 'normal') {
    const po = await m.BusinessDocument.create({ documentNo: `REVIEW-PO-${key}`, documentKind: 'PO', workflowStatus: 'OPEN', version: 1, createdBy: owner._id, header: { supplierId: supplier._id, warehouseId: wh._id } });
    const line = doc => ({ documentId: doc._id, lineNo: 1, productId: product._id, conversionId: conversion._id, enteredQty: doc.documentKind === 'PO' ? '100' : '60', conversionSnapshot: '1', qtyBase: doc.documentKind === 'PO' ? '100' : '60', productNameSnapshot: product.name });
    const poLine = await m.DocumentLine.create(line(po));
    const arrival = await m.BusinessDocument.create({ documentNo: `REVIEW-ARR-${key}`, documentKind: 'ARRIVAL', workflowStatus: 'COMPLETED', createdBy: owner._id, header: { warehouseId: wh._id, supplierId: supplier._id, arrivedAt: new Date(), deliveryReference: 'Review isolated fixture' } });
    const arrivalLine = await m.DocumentLine.create(line(arrival));
    const inspection = await m.BusinessDocument.create({ documentNo: `REVIEW-INS-${key}`, documentKind: 'INSPECTION', workflowStatus: 'COMPLETED', createdBy: owner._id });
    const inspectionLine = await m.DocumentLine.create({ ...line(inspection), lineKind: 'INSPECTION', details: { inspectedSourceLineId: arrivalLine._id, qualityCode: 'GOOD', ownershipDecision: 'ACCEPT', inspectedBy: owner._id, inspectedAt: new Date() } });
    const gr = await m.BusinessDocument.create({ documentNo: `REVIEW-GR-${key}`, documentKind: 'GR_PURCHASE', workflowStatus: 'POSTED', createdBy: owner._id, header: { warehouseId: wh._id, receiptKind: 'PURCHASE' } });
    const grLine = await m.DocumentLine.create(line(gr));
    for (const [source, target] of mode === 'shortcut' ? [[poLine, grLine]] : [[poLine, arrivalLine], [arrivalLine, inspectionLine], [inspectionLine, grLine]]) {
      await m.LineLink.create({ sourceLineId: source._id, targetLineId: target._id, relationCode: 'SOURCE', linkedQty: '60' });
    }
    const lot = await m.Lot.create({ productId: mode === 'wrong-product' ? product2._id : product._id, manufacturerLot: `REVIEW-${key}`, tone: 'T', calibre: 'C', identificationStatus: 'VERIFIED', verificationReference: 'Isolated review' });
    const balance = await m.StockBalance.create({ accountId: account._id, lotId: lot._id, qualityCode: 'GOOD', ownerPartyId: store._id, qtyBase: mode === 'outbound-root' ? '0' : '60', version: 1 });
    const batch = await m.PostingBatch.create({ documentId: mode === 'wrong-batch-document' ? po._id : gr._id, operation: 'POST', operationKey: key, idempotencyKey: key, payloadHash: 'e'.repeat(64), postedBy: owner._id });
    await m.StockMovement.create({ batchId: batch._id, documentId: gr._id, lineId: grLine._id, qtyBase: '60', ...(mode === 'outbound-root' ? { fromBalanceId: balance._id, fromBefore: '60', fromAfter: '0' } : { toBalanceId: balance._id, toBefore: '0', toAfter: '60' }) });
    return { po, poLine, gr, grLine, inspectionLine, arrivalLine };
  }
  for (const mode of ['normal', 'outbound-root', 'wrong-product', 'wrong-batch-document']) {
    await chain(mode, mode);
    const result = await api('GET', `/purchase-orders?search=REVIEW-PO-${mode}`, owner);
    evidence.cases.push({ name: `PO ${mode}`, status: result.status, line: result.body.data?.items?.[0]?.linePreview?.[0] });
  }
  const shortcut = await chain('shortcut', 'shortcut');
  const docs = await api('GET', `/suppliers/${supplier._id}/documents?kind=GR_PURCHASE&limit=100`, owner);
  evidence.cases.push({ name: 'Supplier GR with only direct PO-to-GR link', status: docs.status, shortcutIncluded: docs.body.data?.items?.some(x => x.id === String(shortcut.gr._id)) });
  const draftBody = { action: 'SAVE_DRAFT', creationKey: 'review-lost-assignment', warehouseId: String(wh._id), neededOn: saigonDateOnly(new Date(Date.now() + 86400000 * 5)), triggerReason: 'Review replay scope', lines: [{ productId: String(product._id), conversionId: String(conversion._id), enteredQty: '4', reasonNote: 'Review replay scope' }] };
  const first = await api('POST', '/replenishments', sales, draftBody);
  if (first.status !== 201) throw new Error(JSON.stringify(first));
  await m.User.updateOne({ _id: sales._id }, { $set: { warehouseIds: [] } });
  const replay = await api('POST', '/replenishments', sales, draftBody);
  const get = await api('GET', `/replenishments/${first.body.data.id}`, sales);
  evidence.cases.push({ name: 'RR replay after warehouse assignment revoked', createStatus: first.status, replayStatus: replay.status, replay: replay.body.data, getStatus: get.status });
  console.log('REVIEW_PROBE_RESULT=' + JSON.stringify(evidence));
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState) {
    if (!/^sep490_review_it1_[a-f0-9]{24}$/.test(mongoose.connection.name)) throw new Error('Unexpected database, refuse cleanup');
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
}
