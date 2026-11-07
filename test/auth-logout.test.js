import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../src/modules/auth/auth.routes.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';

test('HTTP logout clears auth cookies even without a valid access token', async (t) => {
  const app = express();
  app.use(cookieParser());
  app.use('/api/auth', authRouter);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const url = `http://127.0.0.1:${server.address().port}/api/auth`;

  for (const cookie of [undefined, 'refresh_token=expired; claim_access_token=expired']) {
    const response = await fetch(`${url}/logout`, {
      method: 'POST',
      headers: { authorization: 'Bearer expired', ...(cookie ? { cookie } : {}) },
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).success, true);
    const cleared = response.headers.getSetCookie();
    for (const name of ['refresh_token', 'claim_access_token']) {
      const header = cleared.find((value) => value.startsWith(`${name}=`));
      assert.ok(header, `${name} must be cleared`);
      assert.match(header, /Path=\//);
      assert.match(header, /Expires=Thu, 01 Jan 1970/);
      assert.match(header, /HttpOnly/);
      assert.match(header, /SameSite=Strict/);
    }
    const refresh = await fetch(`${url}/refresh`, { method: 'POST' });
    assert.equal(refresh.status, 401);
    await refresh.text();
  }
});
