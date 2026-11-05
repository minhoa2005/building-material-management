import { test,before,after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes,createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { registerReviewedModels } from '../src/models/index.js';
import { buildReviewedDemo,decimalValue,SEED_VERSION } from '../src/seeds/rebuild/data.js';
import { writeDemoDatabase } from '../src/seeds/rebuild/database.js';
import { LOCAL_MONGO_PORT,LOCAL_REPLICA_SET,requireLoopbackMongoUri } from '../src/config/local-mongo.js';
import { exact } from '../src/models/model-utils.js';

const enabled=process.env.RUN_LOCAL_DB_TESTS==='1';
const localTest=(name,fn)=>test(name,{skip:!enabled},fn);
const dbName='wmsd_demo_local_test_'+randomBytes(8).toString('hex');
let client,connection,models,source,target,sourceActor,batchId;
let ownsDatabase=false;
const txOptions={readConcern:{level:'snapshot'},writeConcern:{w:'majority'}};
const id=()=>new mongoose.Types.ObjectId();

before(async()=>{
  if(!enabled) return;
  const uri=process.env.LOCAL_MONGODB_URI;
  requireLoopbackMongoUri(uri);
  const url=new URL(uri);
  assert.equal(url.port,String(LOCAL_MONGO_PORT));
  client=new mongoose.mongo.MongoClient(uri,{serverSelectionTimeoutMS:4000});
  await client.connect();
  const hello=await client.db('admin').command({hello:1});
  assert.equal(hello.setName,LOCAL_REPLICA_SET);
  const existing=await client.db(dbName).listCollections({},{nameOnly:true}).toArray();
  assert.equal(existing.length,0);
  const fixtureConnection=mongoose.createConnection();
  const fixtureModels=registerReviewedModels(fixtureConnection);
  const generated=await buildReviewedDemo();
  const data=Object.fromEntries([...fixtureModels].map(([name,Model])=>[name,generated[name].map(row=>new Model(row).toObject())]));
  await writeDemoDatabase(client,client.db(dbName),data,fixtureModels);
  ownsDatabase=true;
  await fixtureConnection.close();
  url.pathname='/'+dbName;
  connection=mongoose.createConnection();
  models=registerReviewedModels(connection);
  await connection.openUri(url.toString(),{autoCreate:false,autoIndex:false,serverSelectionTimeoutMS:4000});
  const warehouse=data.warehouses.find(row=>row.code==='WH01');
  const locations=data.warehouse_locations.filter(row=>String(row.warehouseId)===String(warehouse._id)&&row.locationType==='STORAGE');
  const points=data.stock_holding_points.filter(row=>locations.some(location=>String(location._id)===String(row.locationId)));
  const balances=data.inventory_balances.filter(row=>row.ownerType==='STORE'&&row.qualityStatus==='GOOD'&&exact(row.quantityBase).gt(10)&&points.some(point=>String(point._id)===String(row.holdingPointId)));
  source=balances[0];
  target=data.inventory_balances.find(row=>row.ownerType==='STORE'&&row.qualityStatus==='GOOD'&&String(row._id)!==String(source._id)&&String(row.batchId)===String(source.batchId)&&points.some(point=>String(point._id)===String(row.holdingPointId)));
  assert.ok(source&&target);
  batchId=source.batchId;
  sourceActor=data.users.find(row=>row.username==='warehouse@ceratile.vn')._id;
});
after(async()=>{
  await connection?.close();
  if(client&&ownsDatabase) {
    // Only remove this freshly-created randomized fixture database, never the
    // persistent local demo or any user-created database.
    assert.match(dbName,/^wmsd_demo_local_test_[a-f0-9]{16}$/);
    await client.db(dbName).dropDatabase();
  }
  await client?.close();
});

async function transferOne(key,{fail=false,expectedVersion}={}) {
  const session=await connection.startSession();
  try {
    await session.withTransaction(async()=>{
      const Balance=models.get('inventory_balances');
      const from=await Balance.findById(source._id).session(session).lean();
      const to=await Balance.findById(target._id).session(session).lean();
      const changed=await Balance.updateOne({_id:source._id,version:expectedVersion??from.version,quantityBase:{$gte:decimalValue('1')}},
        {$inc:{quantityBase:decimalValue('-1'),version:1}},{session});
      if(changed.modifiedCount!==1) throw new Error('STALE_BALANCE');
      await Balance.updateOne({_id:target._id,version:to.version},{$inc:{quantityBase:decimalValue('1'),version:1}},{session});
      const [transaction]=await models.get('stock_transactions').create([{
        sourceType:'transfer_orders',sourceId:id(),operation:'LOCAL_TEST',eventKey:key,requestKey:key,
        requestHash:createHash('sha256').update(key).digest('hex'),performedBy:sourceActor,occurredAt:new Date(),recordedAt:new Date(),
      }],{session});
      await models.get('stock_movements').create([{
        transactionId:transaction._id,lineNo:1,sourceLineId:id(),fromBalanceId:from._id,toBalanceId:to._id,quantityBase:'1',
        fromBefore:from.quantityBase,fromAfter:exact(from.quantityBase).minus(1).toFixed(),
        toBefore:to.quantityBase,toAfter:exact(to.quantityBase).plus(1).toFixed(),
      }],{session});
      if(fail) throw new Error('SIMULATED_FAILURE');
    },txOptions);
  } finally {await session.endSession();}
}

localTest('local reviewed registry populates users, roles and permissions from new collections',async()=>{
  const user=await models.get('users').findOne({username:'warehouse@ceratile.vn'}).populate({path:'roleId',populate:{path:'permissionIds'}});
  assert.equal(user.roleId.name,'Warehouse Staff');
  assert.ok(user.roleId.permissionIds.some(row=>row.code==='stock_relocation:create'));
  assert.equal(user.passwordHash,undefined);
  const point=await models.get('inventory_balances').findById(source._id).populate({path:'holdingPointId',populate:{path:'locationId'}}).populate('batchId');
  assert.equal(point.holdingPointId.locationId.locationType,'STORAGE');
  assert.equal(String(point.batchId._id),String(batchId));
});
localTest('failed transaction rolls back both stock balances and all ledger records',async()=>{
  const Balance=models.get('inventory_balances');
  const before=await Balance.find({_id:{$in:[source._id,target._id]}}).sort({_id:1}).lean();
  await assert.rejects(transferOne('rollback',{fail:true}),/SIMULATED_FAILURE/);
  const after=await Balance.find({_id:{$in:[source._id,target._id]}}).sort({_id:1}).lean();
  assert.deepEqual(after,before);
  assert.equal(await models.get('stock_transactions').countDocuments({requestKey:'rollback'}),0);
});
localTest('successful transaction commits both balance changes and one posting together',async()=>{
  const Balance=models.get('inventory_balances');
  const before=await Balance.findById(source._id).lean();
  await transferOne('once');
  const after=await Balance.findById(source._id).lean();
  assert.equal(String(after.quantityBase),exact(before.quantityBase).minus(1).toFixed());
  const transaction=await models.get('stock_transactions').findOne({requestKey:'once'}).lean();
  assert.equal(await models.get('stock_movements').countDocuments({transactionId:transaction._id}),1);
});
localTest('duplicate posting key aborts the second debit on MongoDB',async()=>{
  const before=await models.get('inventory_balances').findById(source._id).lean();
  await assert.rejects(transferOne('once'),error=>error.code===11000);
  const after=await models.get('inventory_balances').findById(source._id).lean();
  assert.deepEqual(after,before);
});
localTest('two concurrent writers using one balance version cannot both post',async()=>{
  const before=await models.get('inventory_balances').findById(source._id).lean();
  const results=await Promise.allSettled([
    transferOne('race-a',{expectedVersion:before.version}),transferOne('race-b',{expectedVersion:before.version}),
  ]);
  assert.equal(results.filter(row=>row.status==='fulfilled').length,1);
  assert.match(results.find(row=>row.status==='rejected').reason.message,/STALE_BALANCE/);
  const after=await models.get('inventory_balances').findById(source._id).lean();
  assert.equal(String(after.quantityBase),exact(before.quantityBase).minus(1).toFixed());
});
localTest('persisted stock history is append-only through Mongoose',async()=>{
  const row=await models.get('stock_movements').findOne().lean();
  await assert.rejects(models.get('stock_movements').updateOne({_id:row._id},{$set:{quantityBase:'99'}}),/append-only/);
});
localTest('MongoDB enforces manufacturer plus SKU uniqueness',async()=>{
  const Product=models.get('products'),original=await Product.findOne().lean();
  const {_id,createdAt,updatedAt,...fields}=original;
  await assert.rejects(Product.create(fields),error=>error.code===11000);
  const alternate=await Product.create({...fields,manufacturerCode:'ANOTHER-DEMO-FACTORY'});
  assert.equal(alternate.sku,original.sku);
});
