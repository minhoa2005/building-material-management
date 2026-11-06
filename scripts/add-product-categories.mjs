import mongoose from 'mongoose';
import {writeFile} from 'node:fs/promises';
import {registerReviewedModels} from '../src/models/index.js';
import {LOCAL_SEED_URI,isLoopbackMongoUri} from '../src/config/local-mongo.js';
import {readDemoSnapshot,seedFingerprint,writeDemoDatabase,verifyDemoDatabase} from '../src/seeds/rebuild/database.js';
import {validateReviewedDemo} from '../src/seeds/rebuild/validate.js';
import {addTileCategories} from '../src/seeds/rebuild/categories.js';
import {planCategoryUpgrade} from '../src/migrations/rebuild/product-categories.js';
import {deploymentIndexes,verifyDeploymentIndexes} from '../src/migrations/rebuild/deploy.js';

const SOURCE='wmsd_demo_tile_shop_v7',LOCAL_TARGET='wmsd_demo_tile_shop_v8',ATLAS_TARGET='wmsd_database';
async function main(){
  const args=new Set(process.argv.slice(2));
  if([...args].some(a=>!['--local','--atlas','--apply','--verify'].includes(a))||args.has('--local')===args.has('--atlas')||args.has('--apply')&&args.has('--verify'))throw new Error('INVALID_ARGUMENTS');
  const uri=process.env.MONGODB_SOURCE_URI||LOCAL_SEED_URI;
  if(!isLoopbackMongoUri(uri))throw new Error('SOURCE_MUST_BE_LOCAL');
  if(args.has('--atlas')&&!process.env.MONGODB_TARGET_URI)throw new Error('MONGODB_TARGET_URI_REQUIRED');
  const local=new mongoose.mongo.MongoClient(uri,{serverSelectionTimeoutMS:10000});
  const connection=mongoose.createConnection(),models=registerReviewedModels(connection);
  const oldModels=new Map([...models].filter(([name])=>name!=='categories'));
  let remote;
  try{
    await local.connect();
    const originalDb=local.db(SOURCE);
    const originalNames=(await originalDb.listCollections({},{nameOnly:true}).toArray()).map(r=>r.name);
    if(originalNames.length!==oldModels.size||originalNames.some(n=>!oldModels.has(n)))throw new Error('SOURCE_COLLECTIONS_CHANGED');
    const {data:original}=await readDemoSnapshot(local,originalDb,oldModels);
    const originalHash=seedFingerprint(original),upgraded=addTileCategories(original);
    let validation=await validateReviewedDemo(upgraded,models),status='PREVIEW';
    if(args.has('--local')){
      if(args.has('--apply')){
        const result=await writeDemoDatabase(local,local.db(LOCAL_TARGET),upgraded,models);
        if(result.dataHash!==seedFingerprint(upgraded))throw new Error('LOCAL_TARGET_DIFFERS');
        status=result.status;
      } else if(args.has('--verify')){
        const result=await verifyDemoDatabase(local,local.db(LOCAL_TARGET),models);
        if(result.dataHash!==seedFingerprint(upgraded))throw new Error('LOCAL_TARGET_DIFFERS');
        status='VERIFIED';
      }
    } else {
      // Verify the prepared local copy before touching the shared database.
      const prepared=await verifyDemoDatabase(local,local.db(LOCAL_TARGET),models);
      if(prepared.dataHash!==seedFingerprint(upgraded))throw new Error('LOCAL_TARGET_DIFFERS');
      remote=new mongoose.mongo.MongoClient(process.env.MONGODB_TARGET_URI,{serverSelectionTimeoutMS:12000});
      await remote.connect();const db=remote.db(ATLAS_TARGET);
      const names=(await db.listCollections({},{nameOnly:true}).toArray()).map(r=>r.name);
      if(names.some(n=>!models.has(n))||[...oldModels.keys()].some(n=>!names.includes(n)))throw new Error('TARGET_COLLECTIONS_CHANGED');
      const readCurrent=async(session)=>{
        const snapshot={};for(const name of models.keys())snapshot[name]=await db.collection(name).find({},session?{session}:undefined).toArray();return snapshot;
      };
      const current=await readCurrent();const plan=planCategoryUpgrade(original,upgraded,current);
      if(args.has('--verify')&&plan.action!=='VERIFY_ONLY')throw new Error('TARGET_NOT_UPGRADED');
      if(args.has('--apply')&&plan.action==='ADD_CATEGORIES'){
        const hello=await db.admin().command({hello:1});
        if(!hello.setName&&hello.msg!=='isdbgrid')throw new Error('TARGET_REQUIRES_TRANSACTIONS');
        if(!names.includes('categories'))await db.createCollection('categories');
        await db.collection('categories').createIndexes(deploymentIndexes(models.get('categories').schema));
        await db.collection('products').createIndex({categoryId:1});
        const session=remote.startSession();
        try{
          await session.withTransaction(async()=>{
            if(planCategoryUpgrade(original,upgraded,await readCurrent(session)).action!=='ADD_CATEGORIES')throw new Error('TARGET_CHANGED_DURING_UPGRADE');
            await db.collection('categories').insertMany(upgraded.categories,{session});
            for(const product of upgraded.products){
              const result=await db.collection('products').updateOne({_id:product._id,categoryId:{$exists:false}},{$set:{categoryId:product.categoryId}},{session});
              if(result.modifiedCount!==1)throw new Error('PRODUCT_CHANGED_DURING_UPGRADE');
            }
          },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'}});
        }finally{await session.endSession();}
        status='UPGRADED';
      }else if(plan.action==='VERIFY_ONLY')status='ALREADY_UPGRADED';
      if(status!=='PREVIEW'){
        const {data}=await readDemoSnapshot(remote,db,models);
        if(seedFingerprint(data)!==seedFingerprint(upgraded))throw new Error('TARGET_READBACK_MISMATCH');
        validation=await validateReviewedDemo(data,models);await verifyDeploymentIndexes(db,models);
        if(args.has('--verify'))status='VERIFIED';
      }
    }
    const reread=await readDemoSnapshot(local,originalDb,oldModels);
    if(seedFingerprint(reread.data)!==originalHash)throw new Error('LOCAL_SOURCE_CHANGED');
    const report={status,sourceDatabase:SOURCE,targetDatabase:args.has('--local')?LOCAL_TARGET:ATLAS_TARGET,sourceUnchanged:true,originalHash,dataHash:seedFingerprint(upgraded),categories:upgraded.categories.map(c=>({code:c.code,name:c.name,products:upgraded.products.filter(p=>String(p.categoryId)===String(c._id)).length})),validation,recordedAt:new Date().toISOString()};
    if(status!=='PREVIEW')await writeFile(`git_doc/outputs/categories_${args.has('--local')?'local_v8':'atlas'}_${args.has('--verify')?'verified':'applied'}_2026-11-06.json`,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify(report,null,2));
  }finally{await remote?.close();await local.close();await connection.close();}
}
main().catch(error=>{
  const safe=typeof error.message==='string'&&/^[A-Z_]+$/.test(error.message)?error.message:'CHECK_VALIDATION_OR_CONNECTION';
  console.error('Category upgrade failed:',error.name,safe);process.exitCode=1;
});
