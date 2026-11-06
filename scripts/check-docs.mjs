import { readFile, access, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newCollections } from '../src/models/index.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const errors=[];
const instructionFiles=['AGENTS.md','CLAUDE.md','GEMINI.md'];
const contents=await Promise.all(instructionFiles.map(p=>readFile(resolve(root,p),'utf8')));
if(new Set(contents).size!==1)errors.push('AGENTS.md, CLAUDE.md and GEMINI.md must be identical.');
const map=await readFile(resolve(root,'git_doc/MODEL_MAP.md'),'utf8');
const mapped=[...map.matchAll(/^\| `([a-z_]+)` \|/gm)].map(m=>m[1]);
if(mapped.length!==newCollections.length||newCollections.some(name=>!mapped.includes(name))||new Set(mapped).size!==mapped.length) {
  errors.push('MODEL_MAP does not cover each registered collection exactly once.');
}
const files=[...instructionFiles,'context.md','git_doc/README.md','git_doc/PROJECT_GUIDE.md','git_doc/MODEL_MAP.md','git_doc/DOCUMENTATION_RULES.md'];
async function collect(dir) {
  for(const entry of await readdir(resolve(root,dir),{withFileTypes:true})) {
    const path=dir+'/'+entry.name;
    if(entry.isDirectory())await collect(path);
    else if(entry.name.endsWith('.md'))files.push(path);
  }
}
await collect('git_doc/docs/09_phat_trien');
await collect('git_doc/docs/08_api');
// The dated history subfolder is an archive, not a maintained live contract.
for(const entry of await readdir(resolve(root,'git_doc/docs/03_thiet_ke/DB_Rebuild_Review'),{withFileTypes:true})) {
  if(entry.isFile()&&entry.name.endsWith('.md'))files.push('git_doc/docs/03_thiet_ke/DB_Rebuild_Review/'+entry.name);
}
let links=0;
for(const file of files) {
  const text=await readFile(resolve(root,file),'utf8');
  for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const url=match[1].replace(/^<|>$/g,'');
    if(/^(?:https?:|mailto:|#)/i.test(url))continue;
    const target=decodeURIComponent(url.split('#')[0]);
    if(!target)continue;
    links++;
    try{await access(resolve(root,dirname(file),target));}catch{errors.push(`${file}: missing link ${url}`);}
  }
}
// Include staged, unstaged and untracked work. This is a documentation signal,
// not a semantic review of whether the explanation is correct.
const changed=new Set([
  ...execFileSync('git',['diff','--name-only','HEAD'],{cwd:root,encoding:'utf8'}).trim().split('\n'),
  ...execFileSync('git',['ls-files','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).trim().split('\n'),
].filter(Boolean));
const affectsProject=[...changed].some(p=>/^(src\/|scripts\/|package(?:-lock)?\.json$)/.test(p)&&!p.endsWith('.md'));
if(affectsProject&&!changed.has('git_doc/change_logs.md'))errors.push('Project code changed: update git_doc/change_logs.md in this task.');
const affectsModels=[...changed].some(p=>p.startsWith('src/models/')&&p.endsWith('.js'));
if(affectsModels&&!changed.has('src/models/CHANGELOG.md'))errors.push('Models changed: update src/models/CHANGELOG.md.');
if(affectsModels&&![...changed].some(p=>p==='git_doc/MODEL_MAP.md'||p.includes('/DB_Current_')))errors.push('Models changed: update the current model/data design documentation.');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log(`Documentation checks passed: 3 identical instruction files, ${mapped.length} collections, ${links} local links, change-log signals.`);
