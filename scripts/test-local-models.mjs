import { spawn } from 'node:child_process';
import { LOCAL_SEED_URI } from '../src/config/local-mongo.js';

const child=spawn(process.execPath,['--test','test/local-rebuild.integration.test.js'],{
  stdio:'inherit',windowsHide:true,env:{...process.env,RUN_LOCAL_DB_TESTS:'1',LOCAL_MONGODB_URI:LOCAL_SEED_URI},
});
child.on('error',()=>{console.error('Could not start local model tests');process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
