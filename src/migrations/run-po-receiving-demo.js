import 'dotenv/config';
import mongoose from 'mongoose';
import {mkdir,writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {resetPoReceivingDemo} from './po-receiving-demo.js';

mongoose.set('autoIndex',false); mongoose.set('autoCreate',false);
export async function backupDatabase(connection) {
  const folder=join(homedir(),'.codex','backups',`${connection.name}-po-receiving-${Date.now()}`);
  await mkdir(folder,{recursive:true});
  const {EJSON}=mongoose.mongo.BSON;
  const metadata=[];
  const collections=await connection.db.listCollections().toArray();
  const session=await connection.startSession();
  try {
    await session.withTransaction(async()=>{
      metadata.length=0;
      for(const c of collections.filter(c=>!c.name.startsWith('system.'))) {
        if(c.type!=='collection') throw new Error('Backup requires ordinary collections; reset cancelled.');
        const file=`${encodeURIComponent(c.name)}.ejson`;
        const rows=await connection.db.collection(c.name).find({},{session}).toArray();
        const indexes=await connection.db.collection(c.name).listIndexes().toArray();
        await writeFile(join(folder,file),EJSON.stringify(rows,{relaxed:false}),{mode:0o600});
        metadata.push({name:c.name,file,options:c.options,count:rows.length,indexes});
      }
    },{readConcern:{level:'snapshot'},writeConcern:{w:'majority'}});
    const manifestPath=join(folder,'manifest.ejson');
    await writeFile(manifestPath,EJSON.stringify({database:connection.name,createdAt:new Date(),collections:metadata},{relaxed:false}),{mode:0o600});
    return {completed:true,manifestPath};
  } finally {await session.endSession();}
}
async function main() {
  const args=process.argv.slice(2);
  if(args.some(x=>!['--apply','--dry-run','--reset-demo','--database=sep490'].includes(x)) || (args.includes('--apply')&&args.includes('--dry-run'))) throw new Error('Use --dry-run or --apply --reset-demo --database=sep490.');
  const uri=process.env.MONGODB_URI; const parsed=new URL(uri);
  if(!['127.0.0.1','localhost'].includes(parsed.hostname) || parsed.protocol!=='mongodb:' || decodeURIComponent(parsed.pathname)!=='/sep490') throw new Error('Reset is restricted to localhost database sep490.');
  if(args.includes('--apply') && (!args.includes('--reset-demo') || !args.includes('--database=sep490'))) throw new Error('Apply requires explicit --reset-demo --database=sep490.');
  await mongoose.connect(uri,{serverSelectionTimeoutMS:5000});
  console.info(JSON.stringify(await resetPoReceivingDemo(mongoose.connection,{apply:args.includes('--apply'),targetDatabase:'sep490',backup:backupDatabase}),null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
