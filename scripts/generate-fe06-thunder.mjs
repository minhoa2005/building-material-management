import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildDemoData } from '../src/seeds/data/demo.data.js';

// Only builds synthetic fixtures in memory. No database or credentials are read.
const groups = await buildDemoData();
const rows = (name) => groups.find((g) => g.Model.modelName === name).documents;
const docs = rows('BusinessDocument');
const lines = rows('DocumentLine');
const done = docs.find((d) => d.documentKind === 'SALES_ORDER' && d.workflowStatus === 'COMPLETED');
const fd = docs.find((d) => d.documentKind === 'SALES_ORDER' && d.workflowStatus === 'IN_PROGRESS');
const cancelled = docs.find((d) => d.documentKind === 'SALES_ORDER' && d.workflowStatus === 'CANCELLED');
const wir = docs.find((d) => d.documentKind === 'ISSUE_REQUEST' && String(d.header.salesOrderId) === String(fd._id));
const od = docs.find((d) => d.documentKind === 'OUTBOUND_DELIVERY' && String(d.header.issueRequestId) === String(wir._id) && d.workflowStatus !== 'OPEN');
const sampleLine = lines.find((l) => String(l.documentId) === String(done._id));
const product = rows('Product').find((p) => String(p._id) === String(sampleLine.productId));
const conversions = rows('ProductUomVersion').filter((c) => String(c.productId) === String(product._id));
const piece = conversions.find((c) => String(c.basePerUnit) === '1');
const box = conversions.find((c) => String(c.basePerUnit) !== '1');
const out = fileURLToPath(new URL('../docs/api/fe06-iteration1/', import.meta.url));
await mkdir(out, { recursive: true });
const vars = {
  baseUrl: 'http://127.0.0.1:3016/api', accessToken: '', evidenceReceipt: '', evidenceId: '', createdSalesOrderId: '',
  runId: 'manual-001', customerId: String(done.header.customerId), productId: String(product._id),
  pieceConversionId: String(piece._id), boxConversionId: String(box._id),
  completedSalesOrderId: String(done._id), failedDeliverySalesOrderId: String(fd._id), cancelledSalesOrderId: String(cancelled._id),
  outboundDeliveryId: String(od._id), issueRequestId: String(wir._id), warehouseId: String(od.header.warehouseId),
};
const body = {
  idempotencyKey: 'thunder-{{runId}}', customerId: '{{customerId}}', neededOn: '2026-11-15T08:00:00+07:00',
  deliveryAddress: 'Địa chỉ giao hàng demo - test Thunder Client', evidenceReceipt: '{{evidenceReceipt}}',
  source: { sourceSystem: 'PAPER', referenceNo: 'PAPER-{{runId}}', referenceDate: '2026-10-29T09:00:00+07:00' },
  lines: [{ sourceLineKey: '1', productId: '{{productId}}', conversionId: '{{boxConversionId}}', quantity: '2' }],
};
const request = (name, method, path, description, data, auth = true) => ({ name,
  request: { method, url: `{{baseUrl}}${path}`, description,
    header: [...(auth ? [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }] : []), ...(data ? [{ key: 'Content-Type', value: 'application/json' }] : [])],
    ...(data && { body: { mode: 'raw', raw: JSON.stringify(data, null, 2), options: { raw: { language: 'json' } } } }) }, response: [] });
const login = (role, username, password) => request(`Login ${role}`, 'POST', '/auth/login',
  '200. Copy data.accessToken to environment accessToken. Login another role to test permissions.', { username, password }, false);
const upload = request('01 Upload source evidence', 'POST', '/sales-orders/source-evidence',
  '201. Sales only. In Body > Form select source-order.png as file. Copy data.receipt to evidenceReceipt. Do not set Content-Type manually.');
upload.request.body = { mode: 'formdata', formdata: [{ key: 'file', type: 'file', src: 'source-order.png' }] };
const collection = { info: { name: 'WMSD FE06 Iteration 1', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  description: 'Import into Thunder Client. Synthetic seeded IDs only. Copy login token, evidence receipt and created SO ID manually as described in README.' },
  item: [
    { name: '00 Login', item: [login('Sales', 'sales@ceratile.vn', 'Sales@123'), login('Owner', 'owner@ceratile.vn', 'Owner@123'),
      login('Accountant', 'accountant@ceratile.vn', 'KeToan@123'), login('Warehouse', 'warehouse@ceratile.vn', 'Kho@12345678'), login('Admin', 'admin@ceratile.vn', 'Admin@123')] },
    { name: 'UC47 Create source and SO', item: [upload,
      request('02 Create copied SO', 'POST', '/sales-orders', '201 first request. Copy data.id to createdSalesOrderId. Example: 2 BOX = 8 PIECE for this seeded product.', body),
      request('03 Retry identical creation', 'POST', '/sales-orders', '200 replayed=true and SAME ID. Do not change body or evidenceReceipt between retries.', body),
      request('04 Same source with another key', 'POST', '/sales-orders', '409 duplicate source. Run after 02.', { ...body, idempotencyKey: 'other-{{runId}}' }),
      request('05 Same key with changed payload', 'POST', '/sales-orders', '409 key conflict. Run after 02.', { ...body, deliveryAddress: 'Changed address' }),
    ] },
    { name: 'UC46 Sales Order detail', item: [
      request('06 View newly created SO', 'GET', '/sales-orders/{{createdSalesOrderId}}', '200; OPEN, lines saved, evidence metadata, downstream history empty. GET never changes stock.'),
      request('07 Get private evidence URL', 'GET', '/sales-orders/{{createdSalesOrderId}}/evidence/{{evidenceId}}', 'Set evidenceId from previous response data.evidence[0].id. 200 with 60-second signed URL. Warehouse cannot access source evidence.'),
      request('08 Completed seeded SO', 'GET', '/sales-orders/{{completedSalesOrderId}}', '200. Completed sample: issued12, delivered12, one payment confirmation.'),
      request('09 Failed delivery seeded SO', 'GET', '/sales-orders/{{failedDeliverySalesOrderId}}', '200. Original OD: issued10, returned4, net6. Replacement commitment4; not a new customer demand.'),
      request('10 Cancelled seeded SO', 'GET', '/sales-orders/{{cancelledSalesOrderId}}', '200. Cancellation history, no fabricated delivery.'),
    ] },
    { name: 'UC49 UC50 Outbound deliveries', item: [
      request('11 OD list', 'GET', '/outbound-deliveries?page=1&limit=20', '200; total filtered by current role/warehouse/SO creator.'),
      request('12 OD filtered list', 'GET', '/outbound-deliveries?warehouseId={{warehouseId}}&salesOrderId={{failedDeliverySalesOrderId}}&page=1&limit=10', '200. Original and replacement ODs preserve the same source demand.'),
      request('13 OD search', 'GET', '/outbound-deliveries?q=FD&page=1&limit=20', '200. Case-insensitive literal documentNo search; query is not interpreted as regex.'),
      request('14 OD detail', 'GET', '/outbound-deliveries/{{outboundDeliveryId}}', '200. WIR/SO links, line snapshots, reservations, picking, GI/POD/FD/commitment histories.'),
    ] },
    { name: 'Validation and permission', item: [
      request('15 No token', 'GET', '/outbound-deliveries', '401.', undefined, false),
      request('16 Invalid ID', 'GET', '/sales-orders/bad-id', '400.'),
      request('17 Invalid pagination', 'GET', '/outbound-deliveries?limit=101', '400.'),
      request('18 Wrong document kind', 'GET', '/outbound-deliveries/{{completedSalesOrderId}}', '404.'),
      request('19 Invalid quantity', 'POST', '/sales-orders', '400; no source/SO created.', { ...body, idempotencyKey: 'invalid-{{runId}}', lines: [{ ...body.lines[0], quantity: '0' }] }),
      request('20 Missing evidence', 'POST', '/sales-orders', '400; no source/SO created.', { ...body, idempotencyKey: 'no-proof-{{runId}}', evidenceReceipt: '' }),
    ] },
  ] };
await writeFile(`${out}/FE06.postman_collection.json`, JSON.stringify(collection, null, 2));
await writeFile(`${out}/FE06.postman_environment.json`, JSON.stringify({ name: 'FE06 local isolated demo',
  values: Object.entries(vars).map(([key, value]) => ({ key, value, enabled: true })), _postman_variable_scope: 'environment' }, null, 2));
await writeFile(`${out}/create-sales-order.json`, JSON.stringify(body, null, 2));
await writeFile(`${out}/seed-ids.json`, JSON.stringify({ ...vars, productName: product.name, boxFactor: String(box.basePerUnit) }, null, 2));
await writeFile(`${out}/source-order.png`, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY9sAAAAASUVORK5CYII=', 'base64'));
console.log(`Generated API test pack: ${out}`);
