import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { isLoopbackMongoUri,LOCAL_SEED_URI,LOCAL_DEMO_URI } from '../src/config/local-mongo.js';

test('local MongoDB configuration accepts only literal loopback endpoints',()=>{
  for(const uri of [LOCAL_SEED_URI,LOCAL_DEMO_URI,'mongodb://localhost:27017/db','mongodb://[::1]:27017/db']) assert.equal(isLoopbackMongoUri(uri),true);
  for(const uri of ['mongodb+srv://example.com/db','mongodb://example.com/db','mongodb://localhost.example.com/db',
    'mongodb://localhost:27017,example.com:27017/db','https://localhost/db','mongodb://127.0.0.2/db','not-a-uri']) assert.equal(isLoopbackMongoUri(uri),false);
});
test('demo CLI refuses a remote write before opening any network connection',async()=>{
  await assert.rejects(promisify(execFile)(process.execPath,['src/seeds/rebuild/run.js','--apply'],{
    cwd:fileURLToPath(new URL('../',import.meta.url)),windowsHide:true,timeout:10000,
    env:{...process.env,MONGODB_URI:'mongodb://example.invalid/wmsd_demo_remote'},
  }),error=>error.code===1&&error.stderr.includes('Remote seeding is disabled by default'));
});
