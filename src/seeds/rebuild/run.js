import 'dotenv/config';
import mongoose from 'mongoose';
import { mkdir,writeFile } from 'node:fs/promises';
import { dirname,resolve } from 'node:path';
import { registerReviewedModels } from '../../models/index.js';
import { buildReviewedDemo,demoPng,SEED_VERSION } from './data.js';
import { validateReviewedDemo } from './validate.js';
import { assertDemoTarget,verifyDemoDatabase,writeDemoDatabase } from './database.js';
import { isLoopbackMongoUri,LOCAL_DEMO_DATABASE } from '../../config/local-mongo.js';

async function main() {
  const args=process.argv.slice(2),options={};
  for(let i=0;i<args.length;i++) {
    const key=args[i];
    if(['--apply','--verify','--allow-remote'].includes(key)) options[key]=true;
    else if(['--target','--report','--assets'].includes(key)&&args[i+1]&&!args[i+1].startsWith('--')) options[key]=args[++i];
    else throw new Error('Unknown or incomplete demo argument');
  }
  if(options['--apply']&&options['--verify']) throw new Error('Choose apply or verify');
  const target=options['--target']??LOCAL_DEMO_DATABASE;
  const connection=mongoose.createConnection(),models=registerReviewedModels(connection);
  let client;
  try {
    let result;
    if(options['--apply']||options['--verify']) {
      if(!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
      if(options['--apply']&&!isLoopbackMongoUri(process.env.MONGODB_URI)&&!options['--allow-remote']) {
        throw new Error('Remote seeding is disabled by default. Use npm run db:local:seed for localhost; --allow-remote requires an intentional remote rollout');
      }
      client=new mongoose.mongo.MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:8000});
      assertDemoTarget(target,client.db().databaseName);
      await client.connect();
    }
    if(options['--verify']) result=await verifyDemoDatabase(client,client.db(target),models);
    else {
      const generated=await buildReviewedDemo();
      const data=Object.fromEntries([...models].map(([name,Model])=>[name,generated[name].map(row=>new Model(row).toObject())]));
      const validation=await validateReviewedDemo(data,models);
      result=options['--apply']?await writeDemoDatabase(client,client.db(target),data,models):
        {status:'PREVIEW',targetDatabase:target,seedVersion:SEED_VERSION,validation,data};
    }
    const {data,...report}=result;
    report.recordedAt=new Date();
    report.counts=Object.fromEntries(Object.entries(data).map(([name,rows])=>[name,rows.length]));
    report.remaining=['Port and test application services before switching MONGODB_URI','D07/D08 business decisions remain pending'];
    if(options['--assets']) {
      const assets=resolve(options['--assets']);
      await mkdir(assets,{recursive:true});
      for(const attachment of data.attachments) await writeFile(resolve(assets,String(attachment._id)+'.png'),demoPng);
      report.attachmentDirectory=assets;
    }
    if(options['--report']) {
      const file=resolve(options['--report']);
      await mkdir(dirname(file),{recursive:true});
      await writeFile(file,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    }
    console.log(JSON.stringify({...report,counts:undefined,report:options['--report']},null,2));
  } finally { await connection.close();await client?.close(); }
}
main().catch(error=>{
  // Never emit URI credentials, password hashes, inserted documents or driver payloads.
  console.error('Demo seed failed:',error.name,error.code??'',error instanceof Error?error.message:'See the validation report or server error code');
  process.exitCode=1;
});
