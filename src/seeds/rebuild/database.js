import { validateReviewedDemo } from './validate.js';
import { SEED_VERSION } from './data.js';
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';

export function seedFingerprint(data) {
  const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?
    Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
  const hash=createHash('sha256');
  for(const name of Object.keys(data).sort()) {
    hash.update(name);
    for(const row of [...data[name]].sort((a,b)=>String(a._id).localeCompare(String(b._id)))) {
      hash.update(JSON.stringify(canonical(mongoose.mongo.BSON.EJSON.serialize(row,{relaxed:false}))));
    }
  }
  return hash.digest('hex');
}

export function assertDemoTarget(name,sourceName) {
  if(!/^wmsd_demo_[a-z0-9_]{1,40}$/.test(name??'')||name===sourceName) {
    throw new Error('Use a separate database named wmsd_demo_<suffix>; the application database cannot be seeded here');
  }
}
export async function readDemoSnapshot(client,db,models) {
  const data={};
  const readAll=async session=>{
    for(const name of models.keys()) data[name]=await db.collection(name).find({},session?{session}:undefined).toArray();
  };
  const hello=await db.admin().command({hello:1});
  if(hello.setName||hello.msg==='isdbgrid') {
    const session=client.startSession();
    try {await session.withTransaction(()=>readAll(session),{readConcern:{level:'snapshot'}});}
    finally {await session.endSession();}
  } else await readAll();
  return {data};
}
export async function verifyDemoDatabase(client,db,models) {
  const names=(await db.listCollections({},{nameOnly:true}).toArray()).map(row=>row.name);
  const expected=[...models.keys()];
  if(names.length!==expected.length||names.some(name=>!expected.includes(name))) throw new Error('Unexpected or missing demo collections');
  const {data}=await readDemoSnapshot(client,db,models);
  const dataHash=seedFingerprint(data);
  const validation=await validateReviewedDemo(data,models);
  return {status:'VERIFIED',targetDatabase:db.databaseName,seedVersion:SEED_VERSION,dataHash,validation,data};
}
export async function writeDemoDatabase(client,db,data,models) {
  assertDemoTarget(db.databaseName,client.db().databaseName);
  const names=await db.listCollections({},{nameOnly:true}).toArray();
  if(names.length) {
    return {...await verifyDemoDatabase(client,db,models),status:'ALREADY_SEEDED'};
  }
  const validation=await validateReviewedDemo(data,models);
  for(const [name,Model] of models) {
    await db.createCollection(name);
    const indexes=Model.schema.indexes().map(([key,options])=>{
      const {_autoIndex,background,...settings}=options;
      return {key,...settings};
    });
    if(indexes.length) await db.collection(name).createIndexes(indexes);
  }
  const insertAll=async session=>{
    for(const [name,rows] of Object.entries(data)) if(rows.length) {
      await db.collection(name).insertMany(rows,session?{session}:undefined);
    }
  };
  const hello=await db.admin().command({hello:1});
  if(hello.setName||hello.msg==='isdbgrid') {
    const session=client.startSession();
    try {await session.withTransaction(()=>insertAll(session),{readConcern:{level:'snapshot'},writeConcern:{w:'majority'}});}
    finally {await session.endSession();}
  } else {
    // Compass commonly connects to a local standalone server. The deterministic
    // demo may be loaded there after all validation and indexes are ready; API
    // stock postings still require a replica set when those services are ported.
    await insertAll();
  }
  return {...await verifyDemoDatabase(client,db,models),status:'SEEDED'};
}
