import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

// Run only against the explicitly isolated demo server. No tokens are persisted.
const baseUrl = 'http://127.0.0.1:3016/api';
let ready = false;
for (let attempt = 0; attempt < 150; attempt++) {
  try { ready = (await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(1000) })).ok; } catch { /* demo seed may still be running */ }
  if (ready) break;
  await new Promise((resolve) => setTimeout(resolve, 2000));
}
assert.ok(ready, 'Demo server is not ready; start npm run test:fe06:server first.');
const root = new URL('../docs/api/fe06-iteration1/', import.meta.url);
const collection = JSON.parse(await readFile(new URL('FE06.postman_collection.json', root), 'utf8'));
const environment = JSON.parse(await readFile(new URL('FE06.postman_environment.json', root), 'utf8'));
const vars = Object.fromEntries(environment.values.map(({ key, value }) => [key, value]));
vars.baseUrl = baseUrl; vars.runId = `smoke-${Date.now()}`;
const requests = collection.item.flatMap((folder) => folder.item);
const substitute = (str) => str.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
  if (!(key in vars)) throw new Error(`Unknown variable ${key}`);
  return vars[key];
});
async function send(name, expected) {
  const { request } = requests.find((r) => r.name === name);
  const headers = Object.fromEntries(request.header.map((h) => [h.key, substitute(h.value)]));
  let body;
  if (request.body?.mode === 'raw') body = substitute(request.body.raw);
  if (request.body?.mode === 'formdata') {
    body = new FormData(); body.append('file', new Blob([await readFile(new URL('source-order.png', root))], { type: 'image/png' }), 'source-order.png');
  }
  const response = await fetch(substitute(request.url), { method: request.method, headers, body, signal: AbortSignal.timeout(30000) });
  const result = await response.json();
  assert.equal(response.status, expected, `${name}: ${result.message}`);
  console.log(`${response.status} ${name}`);
  return result.data;
}
vars.accessToken = (await send('Login Sales', 200)).accessToken;
vars.evidenceReceipt = (await send('01 Upload source evidence', 201)).receipt;
const created = await send('02 Create copied SO', 201);
vars.createdSalesOrderId = created.id;
assert.equal((await send('03 Retry identical creation', 200)).id, created.id);
await send('04 Same source with another key', 409);
await send('05 Same key with changed payload', 409);
const detail = await send('06 View newly created SO', 200);
assert.equal(detail.lines[0].qtyBase, '8');
vars.evidenceId = detail.evidence[0].id;
const proof = await send('07 Get private evidence URL', 200);
const downloaded = await fetch(proof.url, { signal: AbortSignal.timeout(20000) });
assert.equal(downloaded.status, 200); await downloaded.arrayBuffer();
for (const name of ['08 Completed seeded SO', '09 Failed delivery seeded SO', '10 Cancelled seeded SO', '11 OD list', '12 OD filtered list', '13 OD search', '14 OD detail']) await send(name, 200);
for (const [name, expected] of [['15 No token', 401], ['16 Invalid ID', 400], ['17 Invalid pagination', 400], ['18 Wrong document kind', 404], ['19 Invalid quantity', 400], ['20 Missing evidence', 400]]) await send(name, expected);
vars.accessToken = (await send('Login Admin', 200)).accessToken;
await send('11 OD list', 403);
await writeFile(new URL('verified-demo-result.json', root), JSON.stringify({ testedAt: new Date().toISOString(),
  database: 'wmsd_fe06_thunder', baseUrl, createdSalesOrderId: created.id, evidenceId: vars.evidenceId, sourceReferenceNo: `PAPER-${vars.runId}`,
  quantity: '2 BOX = 8 PIECE', result: 'All collection smoke checks passed; no tokens persisted.' }, null, 2));
