import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { registerModels } from '../src/models/index.js';
import { documentTypes, nextDocumentFields, formatDocumentNumber, numberPeriod } from '../src/shared/utils/document-number.js';

test('document IDs use the Vietnamese local day and preserve numbers above six digits', () => {
  assert.equal(numberPeriod(new Date('2026-11-30T18:00:00Z')), '261201');
  for (const [type] of Object.values(documentTypes)) {
    assert.doesNotMatch(formatDocumentNumber(type, 'K-GACH-01', '261112', 1), /\s/);
  }
  assert.equal(formatDocumentNumber('ĐMH','K-GACH-01','261112',1),'ĐMH-K-GACH-01-261112-000001');
  assert.equal(formatDocumentNumber('ĐBH','KD','261112',1000000),'ĐBH-KD-261112-1000000');
  assert.equal(formatDocumentNumber('YCĐC','K-GACH-01','261113',1),'YCĐC-KG1-261113-000001');
  assert.equal(formatDocumentNumber('PNĐC','K-GACH-02','261113',1),'PNĐC-KG2-261113-000001');
  assert.throws(()=>formatDocumentNumber('ĐBH','KD','261112',Number.MAX_SAFE_INTEGER+1));
});

test('number allocation uses last code, serializes concurrency, rolls back and isolates periods', {skip:process.env.RUN_HIEUDT_TESTS!=='1'}, async () => {
  const name='hieudt_numbers_'+new mongoose.Types.ObjectId();
  const connection=await mongoose.createConnection('mongodb://127.0.0.1:27018/'+name+'?replicaSet=hieudt-test').asPromise();
  try {
    const models=registerModels(connection), orders=models.get('sales_orders');
    const operations = models.get('operation_records').collection;
    assert.equal(models.has('document_sequences'),false);
    for(const key of ['operation_records','sales_orders','warehouses']) await models.get(key).createCollection();
    await orders.collection.insertMany([
      'ĐBH-KD-261111-000040',
      'ĐBH - KD - 261111 - 000041',
    ].map(code => ({ _id: code, documentNo: code })));
    const allocate=async (date=new Date('2026-11-11T00:00:00Z')) => {
      for(let retry=0;;retry++) {
        const session=await connection.startSession();
        try {return await session.withTransaction(async()=>{
          session.documentNumbers=new Map();
          const fields=await nextDocumentFields(orders,'SO',null,session,date);
          assert.equal(fields._id,fields.documentNo);
          await orders.collection.insertOne(fields,{session});
          return fields;
        });}catch(error){if(error.code!==11000||retry>=20)throw error;}
        finally {await session.endSession();}
      }
    };
    const first=await allocate(); assert.equal(first.soThuTu,42);
    assert.equal(first._id, 'ĐBH-KD-261111-000042');
    assert.equal(first.tenLoaiPhieu,'Đơn bán hàng');
    await operations.insertOne({ operationKey: 'legacy-sale', requestKey: 'legacy-sale', subjectId: 'ĐBH - KD - 261111 - 000043' });
    const results=await Promise.all([allocate(),allocate(),allocate()]);
    assert.deepEqual(results.map(r=>r.soThuTu).sort((a,b)=>a-b),[44,45,46]);
    const session=await connection.startSession();
    try {await assert.rejects(session.withTransaction(async()=>{await nextDocumentFields(orders,'SO',null,session,new Date('2026-11-11'));throw Error('rollback');}),/rollback/);} finally {await session.endSession();}
    assert.equal((await allocate()).soThuTu,47);
    assert.equal((await allocate(new Date('2026-11-12'))).soThuTu,1);
    assert.equal((await connection.db.listCollections({name:'document_sequences'}).toArray()).length,0);
  } finally {assert.match(connection.name,/^hieudt_numbers_/);await connection.dropDatabase();await connection.close();}
});

test('transfer numbering counts original and abbreviated warehouse codes', {skip:process.env.RUN_HIEUDT_TESTS!=='1'}, async () => {
  const name = 'hieudt_numbers_' + new mongoose.Types.ObjectId();
  const connection = await mongoose.createConnection('mongodb://127.0.0.1:27018/'+name+'?replicaSet=hieudt-test').asPromise();
  try {
    const models = registerModels(connection);
    const transfers = models.get('warehouse_transfer_requests');
    const warehouseId = new mongoose.Types.ObjectId();
    await models.get('warehouses').collection.insertOne({ _id: warehouseId, code: 'K-GACH-01' });
    await transfers.collection.insertMany([
      'YCĐC-KG1-261113-000041',
      'YCĐC-K-GACH-01-261113-000042',
      'YCĐC - K-GACH-01 - 261113 - 000043',
      'YCĐC - K-GACH-02 - 261113 - 000099',
    ].map(code => ({ _id: code, documentNo: code })));
    const date = new Date('2026-11-13T00:00:00Z');
    const operations = models.get('operation_records').collection;
    const allocate = () => connection.transaction(session =>
      nextDocumentFields(transfers, 'TR', warehouseId, session, date),
    );
    const fields = await allocate();
    assert.equal(fields._id, 'YCĐC-KG1-261113-000044');
    assert.equal(fields.documentNo, fields._id);
    assert.equal(fields.maDonVi, 'KG1');
    await operations.insertOne({ operationKey: 'transfer', requestKey: 'transfer', subjectId: 'YCĐC-KG1-261113-000044' });
    assert.equal((await allocate())._id, 'YCĐC-KG1-261113-000045');
  } finally {
    assert.match(connection.name, /^hieudt_numbers_/);
    await connection.dropDatabase();
    await connection.close();
  }
});
