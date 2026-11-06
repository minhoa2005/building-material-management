import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import { registerReviewedModels } from '../src/models/index.js';
const connection=mongoose.createConnection();
const models=registerReviewedModels(connection);
const directory=new URL('../git_doc/docs/03_thiet_ke/DB_Current_2026-11-06_59_v8/',import.meta.url);
const modelDirectory=new URL('../src/models/',import.meta.url);
const sourceFiles=new Map();
for(const file of await readdir(modelDirectory)) {
  if(!file.endsWith('.model.js'))continue;
  const text=await readFile(new URL(file,modelDirectory),'utf8');
  const collection=text.match(/\/\/ Collection: (\w+)/)?.[1];
  if(collection)sourceFiles.set(collection,file);
}
await mkdir(directory,{recursive:true});
let md='# Từ điển dữ liệu hiện hành — 07/11/2026\n\n'+models.size+' collection. Dòng nhúng có ID ổn định; không phải collection độc lập. Mongoose ref là liên kết ứng dụng, không phải foreign key do MongoDB kiểm. Native return workflow additions and compatibility are documented in [RETURN_WORKFLOWS_NATIVE](../../08_api/RETURN_WORKFLOWS_NATIVE.md). The directory name retains its baseline date.\n\n';
const snapshot=[];
for(const [name,Model] of models){
  const fields=[];
  function walk(schema,prefix=''){
    schema.eachPath((key,path)=>{
      const full=prefix+key, opts=path.$embeddedSchemaType?.options||path.options;
      const target=opts.ref|| (opts.embeddedTarget ? 'embedded:'+opts.embeddedTarget : opts.logicalReference||'');
      fields.push({path:full,type:path.instance,required:typeof path.options.required==='function'?'conditional':Boolean(path.options.required),target});
      if(path.schema)walk(path.schema,full+(path.instance==='Array'?'[].':'.'));
    });
    for(const [kind,child] of Object.entries(schema.discriminators||{})) {
      child.eachPath((key,path)=>{if(!schema.path(key))fields.push({path:prefix+'{'+kind+'}.'+key,type:path.instance,required:Boolean(path.options.required),target:path.options.ref||''});});
    }
  }
  walk(Model.schema);
  const sourceFile=sourceFiles.get(name);
  if(!sourceFile)throw new Error('Missing separate schema file: '+name);
  md+='## '+name+'\n\nModel: ['+sourceFile+'](../../../../src/models/'+sourceFile+').\n\n| Trường | Kiểu | Bắt buộc | Liên kết |\n|---|---|---|---|\n'+fields.map(f=>`| \`${f.path}\` | ${f.type} | ${f.required} | ${f.target} |`).join('\n')+'\n\n';
  md+='Indexes:\n\n```json\n'+JSON.stringify(Model.schema.indexes(),null,2)+'\n```\n\n';
  snapshot.push({collection:name,model:Model.modelName,sourceFile:'src/models/'+sourceFile,fields,indexes:Model.schema.indexes()});
}
await writeFile(new URL('WMSD_Data_Dictionary.md',directory),md.trimEnd()+'\n');
await writeFile(new URL('schema.json',directory),JSON.stringify(snapshot,null,2)+'\n');
await connection.close();
console.log('Generated data dictionary and schema snapshot: '+models.size+' collections');
