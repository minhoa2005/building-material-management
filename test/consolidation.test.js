import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { buildReviewedDemo } from '../src/seeds/rebuild/data.js';
import { consolidateData, expandEmbedded, embeddedTables, removedCollections } from '../src/models/consolidation.js';
import { registerReviewedModels } from '../src/models/index.js';
import { validateReviewedDemo } from '../src/seeds/rebuild/validate.js';
import { estimateCartonCapacity, assertBatchPackaging } from '../src/models/capacity.js';
const copy = value => mongoose.mongo.BSON.EJSON.parse(mongoose.mongo.BSON.EJSON.stringify(value));
const source = await buildReviewedDemo({consolidate:false});
const data = consolidateData(copy(source));
const current = await buildReviewedDemo();
const models = registerReviewedModels(mongoose.createConnection());
const expectedRecord=(old,row)=>{
  const result=copy(row);
  if(old==='stock_thresholds') delete result.version;
  if(result.documentKind) delete result.revision;
  return result;
};

test('model serialization preserves every embedded history field and reference', async () => {
  const saved=Object.fromEntries([...models].map(([name,Model])=>[name,current[name].map(row=>new Model(row).toObject())]));
  await validateReviewedDemo(saved,models);
  const expected=expandEmbedded(current);
  const expanded=expandEmbedded(saved);
  for (const old of Object.keys(embeddedTables)) {
    assert.equal(expanded[old].length,expected[old].length);
    function preserved(expected, actual) {
      if (expected == null) return;
      if (Array.isArray(expected)) { assert.equal(actual.length,expected.length); expected.forEach((v,i)=>preserved(v,actual[i])); }
      else if (typeof expected==='object'&&!expected._bsontype&&!(expected instanceof Date)) {
        for (const [key,value] of Object.entries(expected)) preserved(value,actual?.[key]);
      } else if (actual?._bsontype==='Decimal128') assert.equal(String(actual),String(expected));
      else assert.deepEqual(actual,expected);
    }
    for (const row of expected[old]) preserved(expectedRecord(old,row),expanded[old].find(value=>String(value._id)===String(row._id)));
  }
});

test('missing carton quantity is detected after removing stacks',async()=>{
  const broken=copy(current);broken.inventory_balances.find(b=>b.packagingPortions.length).packagingPortions=[];
  await assert.rejects(validateReviewedDemo(broken,models),/Packaging quantity/);
});

test('batch has fixed pieces and measured outer carton dimensions, with optional tone and calibre',async()=>{
  const Batch=models.get('product_batches'),row=copy(data.product_batches[0]);
  await new Batch(row).validate();assert.ok(Batch.schema.path('calibre'));assert.ok(Batch.schema.path('tone'));
  await new Batch({...row,tone:'B08',calibre:'C2'}).validate();
  await assert.rejects(new Batch({...row,tone:'x'.repeat(21)}).validate());
  assert.ok(Batch.schema.indexes().some(([key,settings])=>Object.keys(key).length===2&&key.productId&&key.manufacturerLot&&settings.unique));
  await assert.rejects(new Batch({...row,piecesPerCarton:4.5}).validate());
  await assert.rejects(new Batch({...row,cartonLengthMm:0}).validate());
  await new Batch({...row,cartonLengthMm:'620.5'}).validate();
  const balance=copy(data.inventory_balances.find(b=>b.packagingPortions.some(p=>p.packagingState==='SEALED')));
  balance.packagingPortions.find(p=>p.packagingState==='SEALED').packagingSnapshot.outerLengthMm='620.5';
  await new (models.get('inventory_balances'))(balance).validate();
});
