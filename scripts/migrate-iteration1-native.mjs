import mongoose from 'mongoose';
import {PERMISSION_CATALOGUE,ROLE_PERMISSIONS} from '../src/seeds/data/permissions.data.js';
import {pathToFileURL} from 'node:url';
export function planCatalogueMigration(data){
 const codes=new Set(['Viên','Thùng','M2']);for(const p of data.products||[])if(p.baseUnit)codes.add(p.baseUnit);
 for(const rows of Object.values(data))for(const row of rows||[])for(const item of row.items||[]){if(item.enteredUnit)codes.add(item.enteredUnit);if(item.baseUnitSnapshot)codes.add(item.baseUnitSnapshot);}
 const suppliers=(data.suppliers||[]).filter(s=>['PENDING','INACTIVE'].includes(s.status)).map(s=>({id:String(s._id),before:s.status,status:'SUSPENDED',statusReason:s.status==='PENDING'?'Chưa xác nhận hoạt động trước chuyển đổi':'Ngừng hoạt động trước chuyển đổi'}));
 const groups=new Map();for(const po of data.purchase_orders||[]){const key=String(po.replenishmentRequestId||'');groups.set(key,[...(groups.get(key)||[]),String(po._id)]);}
 return {uoms:[...codes].sort().map(code=>({code,name:code==='M2'?'Mét vuông':code,isActive:true,isCarton:code==='Thùng'||code==='BOX'})),suppliers,unsupportedConversionCodes:[...codes].filter(c=>!['PIECE','BOX','M2','Viên','Thùng','m²'].includes(c)),blockers:[...groups].filter(([id,rows])=>!id||rows.length>1).map(([rr,orders])=>({rr,orders})),legacyCollections:['business_documents','document_lines','product_uom_versions'].filter(c=>(data[c]||[]).length)};
}
export async function migrate(uri,{apply=false}={}){
 const parsed=new URL(uri);if(!['127.0.0.1','localhost'].includes(parsed.hostname)||!/^wmsd_(api_test|migration_test)_/.test(parsed.pathname.slice(1)))throw Error('Only isolated local test databases are allowed');
 const connection=await mongoose.createConnection(uri,{serverSelectionTimeoutMS:3000}).asPromise();try{
 const data={};for(const {name} of await connection.db.listCollections().toArray())data[name]=await connection.db.collection(name).find({}).toArray();const report=planCatalogueMigration(data);
 if(apply){if(report.blockers.length||report.legacyCollections.length)throw Error('Resolve source/legacy blockers before applying');await connection.db.collection('uoms').createIndex({code:1},{unique:true});
 const session=await connection.startSession();try{await session.withTransaction(async()=>{
 for(const permission of PERMISSION_CATALOGUE)await connection.db.collection('permissions').updateOne({code:permission.code},{$setOnInsert:{code:permission.code,name:permission.code,description:permission.description,createdAt:new Date(),updatedAt:new Date()}},{upsert:true,session});
 const permissions=await connection.db.collection('permissions').find({},{session}).toArray();
 for(const [code,codes] of Object.entries(ROLE_PERMISSIONS)){const ids=permissions.filter(p=>codes.includes(p.code)).map(p=>p._id);await connection.db.collection('roles').updateOne({code},{$addToSet:{permissionIds:{$each:ids}}},{session});}
 for(const uom of report.uoms)await connection.db.collection('uoms').updateOne({code:uom.code},{$setOnInsert:{...uom,createdAt:new Date(),updatedAt:new Date()}},{upsert:true,session});for(const supplier of report.suppliers)await connection.db.collection('suppliers').updateOne({_id:new mongoose.Types.ObjectId(supplier.id),status:supplier.before},{$set:{status:supplier.status,statusReason:supplier.statusReason,updatedAt:new Date()}},{session});});}finally{await session.endSession();}}
 return {...report,permissionCatalogue:PERMISSION_CATALOGUE.map(p=>p.code),rolePolicy:'Add defaults to existing system roles without removing custom permissions; no new roles',applied:apply};}finally{await connection.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const uri=process.argv.find(a=>a.startsWith('--uri='))?.slice(6);if(!uri)throw Error('Pass --uri=mongodb://127.0.0.1/...test DB');console.log(JSON.stringify(await migrate(uri,{apply:process.argv.includes('--apply')}),null,2));}
