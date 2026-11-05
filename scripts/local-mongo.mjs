import mongoose from 'mongoose';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { LOCAL_MONGO_PORT,LOCAL_DEMO_DATABASE,LOCAL_DEMO_URI,LOCAL_SEED_URI } from '../src/config/local-mongo.js';

const execFileAsync=promisify(execFile);
const backendRoot=fileURLToPath(new URL('../',import.meta.url));
const directUri=`mongodb://localhost:${LOCAL_MONGO_PORT}/admin`;

async function connectDirect() {
  const client=new mongoose.mongo.MongoClient(directUri,{serverSelectionTimeoutMS:1200});
  try {await client.connect();return client;} catch(error) {await client.close();throw error;}
}
async function start() {
  const client=await connectDirect();
  try {
    const hello=await client.db('admin').command({hello:1});
    const envPath=resolve(backendRoot,'.env.local');
    try {await readFile(envPath);} catch(error) {
      if(error.code!=='ENOENT') throw error;
      await writeFile(envPath,`# Local WMSD database.\nMONGODB_URI=${LOCAL_DEMO_URI}\nSEED_ON_STARTUP=false\n`,{flag:'wx'});
    }
    console.log(JSON.stringify({ready:true,uri:LOCAL_DEMO_URI,replicaSet:hello.setName??null},null,2));
  } finally {await client.close();}
}
async function inspect() {
  const client=await connectDirect();
  try {
    const hello=await client.db('admin').command({hello:1});
    console.log(JSON.stringify({ready:hello.isWritablePrimary,setName:hello.setName,uri:LOCAL_DEMO_URI,
      databases:(await client.db('admin').admin().listDatabases({nameOnly:true})).databases.map(row=>row.name)},null,2));
  } finally {await client.close();}
}
async function stop() {
  throw new Error('This command does not stop the shared MongoDB service on localhost:27017. Stop it from Windows Services only when needed.');
}
async function demo(mode) {
  await start();
  const localRoot=resolve(backendRoot,'.local');
  await mkdir(localRoot,{recursive:true});
  const report=resolve(localRoot,`report-${mode.slice(2)}-${Date.now()}.json`);
  const args=['src/seeds/rebuild/run.js',mode,'--target',LOCAL_DEMO_DATABASE,'--assets',resolve(localRoot,'demo-fixtures'),'--report',report];
  const result=await execFileAsync(process.execPath,args,{cwd:backendRoot,windowsHide:true,
    env:{...process.env,MONGODB_URI:LOCAL_SEED_URI},maxBuffer:2*1024*1024});
  console.log(result.stdout.trim());
  await writeFile(resolve(localRoot,'latest-report.json'),await readFile(report));
}
const action=process.argv[2]??'status';
try {
  if(action==='start') await start();
  else if(action==='status') await inspect();
  else if(action==='stop') await stop();
  else if(action==='seed') await demo('--apply');
  else if(action==='verify') await demo('--verify');
  else throw new Error('Use start, status, stop, seed or verify');
} catch(error) {
  console.error('Local MongoDB:',error.message);
  process.exitCode=1;
}
