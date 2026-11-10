import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('workflow authentication does not intercept public health and login routes', async () => {
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  try {
    assert.equal((await fetch(`${base}/health`)).status, 200);
    const login = await fetch(`${base}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    assert.equal(login.status, 400);
    assert.equal((await fetch(`${base}/return-workflows/options`)).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
