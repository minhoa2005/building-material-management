import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import { registerReviewedModels } from '../src/models/index.js';

test('each current collection has its own model file and each embedded file declares one schema',async()=>{
  const root=new URL('../src/models/',import.meta.url);
  const collections=[];
  for(const directory of [root,new URL('embedded/',root)]) {
    for(const file of (await readdir(directory)).filter(file=>file.endsWith('.model.js'))) {
      const code=await readFile(new URL(file,directory),'utf8');
      assert.equal([...code.matchAll(/new Schema\(/g)].length,1,file);
      if(directory===root)collections.push(code.match(/\/\/ Collection: (\w+)/)?.[1]);
    }
  }
  const connection=mongoose.createConnection();
  try {
    const models=registerReviewedModels(connection);
    assert.deepEqual(collections.sort(),[...models.keys()].sort());
  } finally {await connection.close();}
});
