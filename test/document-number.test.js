import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { registerModels } from '../src/models/index.js';
import { nextDocumentFields, formatDocumentNumber, numberPeriod } from '../src/shared/utils/document-number.js';

test('Vietnamese document codes use local month and preserve numbers above six digits', () => {
  assert.equal(numberPeriod(new Date('2026-11-30T18:00:00Z')), '202612');
  assert.equal(formatDocumentNumber('ĐBH','KD','202611',1),'ĐBH–KD–202611–000001');
  assert.equal(formatDocumentNumber('ĐBH','KD','202611',1000000),'ĐBH–KD–202611–1000000');
  assert.throws(()=>formatDocumentNumber('ĐBH','KD','202611',Number.MAX_SAFE_INTEGER+1));
});

test('number allocation uses last code, serializes concurrency, rolls back and isolates periods', {skip:process.env.RUN_HIEUDT_TESTS!=='1'}, async () => {
  const name='hieudt_numbers_'+new mongoose.Types.ObjectId();
  const connection=await mongoose.createConnection('mongodb://127.0.0.1:27018/'+name+'?replicaSet=hieudt-test').asPromise();
  try {
    const models=registerModels(connection), orders=models.get('sales_orders');
    for(const key of ['document_sequences','sales_orders','warehouses']) await models.get(key).createCollection();
    await orders.collection.insertOne({documentNo:'ĐBH–KD–202611–000041'});
    const allocate=async (date=new Date('2026-11-11T00:00:00Z')) => {
      const session=await connection.startSession();
      try {return await session.withTransaction(async()=>{
        const fields=await nextDocumentFields(orders,'SO',null,session,date);
        await orders.collection.insertOne(fields,{session});
        return fields;
      });} finally {await session.endSession();}
    };
    const first=await allocate(); assert.equal(first.soThuTu,42);
    assert.equal(first.tenLoaiPhieu,'Đơn bán hàng');
    const results=await Promise.all([allocate(),allocate(),allocate()]);
    assert.deepEqual(results.map(r=>r.soThuTu).sort((a,b)=>a-b),[43,44,45]);
    const session=await connection.startSession();
    try {await assert.rejects(session.withTransaction(async()=>{await nextDocumentFields(orders,'SO',null,session,new Date('2026-11-11'));throw Error('rollback');}),/rollback/);} finally {await session.endSession();}
    assert.equal((await allocate()).soThuTu,46);
    assert.equal((await allocate(new Date('2026-12-01'))).soThuTu,1);
  } finally {assert.match(connection.name,/^hieudt_numbers_/);await connection.dropDatabase();await connection.close();}
});
