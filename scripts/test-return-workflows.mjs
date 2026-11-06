import { spawn } from 'node:child_process';
const child=spawn(process.execPath,['--test','test/returns-native.test.js','test/return-workflows.contract.test.js','test/customer-returns.contract.test.js','test/return-workflows.integration.test.js'],{stdio:'inherit',windowsHide:true,env:{...process.env,RUN_RETURNS_NATIVE_TESTS:'1'}});
child.on('exit',code=>{process.exitCode=code??1;});child.on('error',()=>{process.exitCode=1;});
