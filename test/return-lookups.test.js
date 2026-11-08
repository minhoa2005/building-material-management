import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { lookupSchema } from '../src/modules/return-workflows/native.validation.js';
import { lookup } from '../src/modules/return-workflows/native.lookup.js';
import { options } from '../src/modules/return-workflows/native.read.js';
import * as m from '../src/models/runtime.js';
import { registerModels } from '../src/models/index.js';
import { buildReviewedDemo } from '../src/seeds/rebuild/data.js';
import app from '../src/app.js';
import { traceRecords } from '../src/modules/return-workflows/native.trace.js';

test('lookup input rejects unbounded pages, operators and unsupported filters', () => {
  const query = { kind: 'customers' };
  assert.equal(lookupSchema.parse({ query }).query.limit, 10);
  for (const extra of [{ limit: 1000 }, { page: 0 }, { search: { $ne: '' } }, { arbitrary: 'x' }, { locationKinds: 'CUSTODY,ANYTHING' }]) {
    assert.equal(lookupSchema.safeParse({ query: { ...query, ...extra } }).success, false);
  }
});

const enabled = process.env.RUN_RETURN_LOOKUP_TESTS === '1';
const database = `returns_lookup_${new mongoose.Types.ObjectId()}`;
let server, base;
const actors = {};
before(async () => {
  if (!enabled) return;
  await mongoose.connect(`mongodb://127.0.0.1:27028/${database}?replicaSet=wmsd_model_tests`, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 5000 });
  const data = await buildReviewedDemo();
  for (const [name, Model] of registerModels(mongoose.connection)) {
    if (data[name]?.length) await mongoose.connection.db.collection(name).insertMany(data[name].map(row => new Model(row).toObject()));
  }
  for (const username of ['banhang01', 'banhang02', 'thukho01', 'ketoan01', 'admin']) {
    actors[username] = await m.User.findOne({ username }).populate({ path: 'roleId', populate: { path: 'permissionIds' } });
  }
  server = app.listen(0); await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  if (!enabled) return;
  if (server) await new Promise(resolve => server.close(resolve));
  if (mongoose.connection.readyState === 1) {
    assert.match(database, /^returns_lookup_[a-f\d]{24}$/);
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
});
const integration = (name, fn) => test(name, { skip: !enabled }, fn);
const query = extra => lookupSchema.parse({ query: extra }).query;

integration('customers are searched and paginated on the server with stable pages', async () => {
  const first = await lookup(actors.banhang01, query({ kind: 'customers', page: 1 }));
  const second = await lookup(actors.banhang01, query({ kind: 'customers', page: 2 }));
  assert.equal(first.items.length, 10); assert.ok(first.total >= 20);
  assert.equal(second.items.length, 10);
  assert.ok(second.items.every(row => !first.items.some(old => old._id === row._id)));
  const found = await lookup(actors.banhang01, query({ kind: 'customers', search: first.items[0].code }));
  assert.equal(found.total, 1); assert.equal(found.items[0]._id, first.items[0]._id);
  const escaped = await lookup(actors.banhang01, query({ kind: 'customers', search: '.*' }));
  assert.equal(escaped.total, 0);
});
integration('compact bootstrap omits growing catalogs and admin has no business lookup access', async () => {
  const result = await options(actors.thukho01, { compact: true });
  for (const key of ['customers', 'suppliers', 'balances', 'sourceLines', 'lots', 'locations']) assert.deepEqual(result[key], []);
  assert.ok(result.warehouses.length > 0);
  await assert.rejects(lookup(actors.admin, query({ kind: 'customers' })), error => error.statusCode === 403);
});
integration('source choices obey warehouse, customer, supplier and lot scope and show remaining quantity', async () => {
  const sales = await lookup(actors.banhang01, query({ kind: 'sources', purpose: 'customer-returns' }));
  assert.ok(sales.items.length > 0);
  assert.ok(sales.items.every(row => row.customerId && row.warehouseId && row.availableQty !== undefined));
  const own = sales.items[0];
  const matched = await lookup(actors.banhang01, query({ kind: 'sources', purpose: 'customer-returns', customerId: own.customerId, warehouseId: own.warehouseId }));
  assert.ok(matched.items.every(row => row.customerId === own.customerId && row.warehouseId === own.warehouseId));
  const wrong = await lookup(actors.banhang01, query({ kind: 'sources', purpose: 'customer-returns', customerId: String(new mongoose.Types.ObjectId()) }));
  assert.equal(wrong.total, 0);
  const otherSales = await lookup(actors.banhang02, query({ kind: 'sources', purpose: 'customer-returns' }));
  assert.equal(otherSales.total, 0);
  const source = await lookup(actors.thukho01, query({ kind: 'sources', purpose: 'supplier-returns' }));
  assert.ok(source.items.length > 0); assert.ok(source.items[0].supplierId);
  const wrongSupplier = await lookup(actors.thukho01, query({ kind: 'sources', purpose: 'supplier-returns', supplierId: String(new mongoose.Types.ObjectId()) }));
  assert.equal(wrongSupplier.total, 0);
  const matchedSupplier = await lookup(actors.thukho01, query({ kind: 'sources', purpose: 'supplier-returns', supplierId: source.items[0].supplierId, lotId: source.items[0].lotId }));
  assert.ok(matchedSupplier.items.every(row => row.supplierId === source.items[0].supplierId && row.lotId === source.items[0].lotId));
  assert.equal(JSON.stringify(source).includes('unitPurchasePrice'), false);
});
integration('warehouse lookup cannot cross assignments; quantities and location context are visible', async () => {
  const forbidden = await m.Warehouse.findOne({ _id: { $nin: actors.thukho01.warehouseIds } });
  assert.ok(forbidden);
  await assert.rejects(lookup(actors.thukho01, query({ kind: 'balances', warehouseId: String(forbidden._id) })), error => error.statusCode === 403);
  const balances = await lookup(actors.thukho01, query({ kind: 'balances' }));
  assert.ok(balances.items.every(row => row.locationCode && row.code && row.availableQty !== undefined && row.unit));
  const custody = await lookup(actors.thukho01, query({ kind: 'locations', locationKinds: 'CUSTODY' }));
  assert.ok(custody.items.every(row => row.locationType === 'CUSTODY'));
});
integration('HTTP lookup requires auth, returns pagination metadata, and rejects invalid input', async () => {
  assert.equal((await fetch(`${base}/return-workflows/lookup?kind=customers`)).status, 401);
  const auth = await (await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'banhang01', password: 'Sales@123' }) })).json();
  const headers = { Authorization: `Bearer ${auth.data.accessToken}` };
  const response = await fetch(`${base}/return-workflows/lookup?kind=customers&page=2`, { headers });
  const body = await response.json();
  assert.equal(response.status, 200); assert.equal(body.meta.page, 2); assert.equal(body.data.length, 10);
  assert.equal((await fetch(`${base}/return-workflows/lookup?kind=customers&limit=1000`, { headers })).status, 400);
});
integration('trace loads one bounded section at a time and never returns private storage keys or prices', async () => {
  const receipt = await m.PurchaseReceipt.findOne({ documentNo: 'PN-202610-001' });
  const id = String(receipt.items[0].lotId);
  for (const section of ['documents','movements','reservations','evidence','history']) {
    const result = await traceRecords(actors.thukho01,id,{ section,page:1,limit:2 });
    assert.ok(result.items.length <= 2); assert.ok(result.total >= result.items.length);
    assert.equal(new Set(result.items.map(row=>row._id)).size,result.items.length);
    assert.equal(JSON.stringify(result).includes('storageKey'),false);
    assert.equal(JSON.stringify(result).includes('unitSellingPrice'),false);
  }
  await assert.rejects(traceRecords(actors.admin,id,{section:'documents',page:1,limit:10}),error=>error.statusCode===403);
  const accountant = await traceRecords(actors.ketoan01,id,{section:'documents',page:1,limit:25});
  assert.ok(accountant.items.every(row=>!['GI_SALE','CUSTOMER_RETURN','FAILED_DELIVERY','SO'].includes(row.documentKind)));
});
integration('external-reference evidence is selected only from its authorized parent without private storage fields', async () => {
  const receipt = await m.PurchaseReceipt.findOne({documentNo:'PN-202610-001'});
  const template = await m.Attachment.findOne().lean(); assert.ok(template);
  const id = new mongoose.Types.ObjectId();
  await m.Attachment.collection.insertOne({...template,_id:id,ownerDocumentId:receipt._id,status:'ATTACHED',accessCategory:'BUSINESS',originalName:'receipt-proof.pdf',mediaType:'application/pdf',storageKey:'private-lookup-test-key'});
  const result=await lookup(actors.ketoan01,query({kind:'evidence',documentId:String(receipt._id),search:'receipt-proof'}));
  assert.equal(result.items.length,1);assert.equal(result.items[0]._id,String(id));
  assert.equal(JSON.stringify(result).includes('private-lookup-test-key'),false);
  await assert.rejects(lookup(actors.ketoan01,query({kind:'evidence',documentId:String(new mongoose.Types.ObjectId())})),error=>error.statusCode===404);
});
