import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import {registerModels} from '../src/models/index.js';
import {SEED_ACCOUNTS} from '../src/seeds/data/accounts.data.js';
const connection=await mongoose.createConnection('mongodb://127.0.0.1:27018/wmsd_hieudt_local_20261111?replicaSet=hieudt-test',{autoCreate:false,autoIndex:false}).asPromise();
try {
 const m=registerModels(connection),User=m.get('users'),Location=m.get('warehouse_locations');
 const receiverAccount=SEED_ACCOUNTS.find(a=>a.username==='warehouse2@ceratile.vn');
 if(!await User.exists({username:receiverAccount.username})){
   const template=await User.findOne({username:'thukho02'});assert.ok(template);
   await User.create({username:receiverAccount.username,fullName:receiverAccount.fullName,passwordHash:await bcrypt.hash(receiverAccount.password,10),roleId:template.roleId,warehouseIds:template.warehouseIds,isActive:true,version:1});
 }
 const root='http://localhost:3334/api';
 const health=await fetch(root+'/health');
 assert.equal(health.headers.get('X-WMSD-Review-Database'),connection.name,'Proxy must point to the local-only review server');
 async function login(username){const account=SEED_ACCOUNTS.find(a=>a.username===username);const r=await fetch(root+'/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username,password:account.password})});assert.equal(r.status,200);const result=(await r.json()).data;assert.ok(await User.exists({_id:result.user.id}));return result.accessToken;}
 const sender=await login('warehouse@ceratile.vn'),owner=await login('owner@ceratile.vn'),receiver=await login('warehouse2@ceratile.vn');
 const key=()=>new mongoose.Types.ObjectId().toString();
 async function api(token,path,body){const r=await fetch(root+'/warehouse-transfers'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',authorization:'Bearer '+token},...(body?{body:JSON.stringify({idempotencyKey:key(),...body})}:{})});const b=await r.json();assert.ok(r.status<300,JSON.stringify({path,status:r.status,message:b.message}));return b.data;}
 const source=await m.get('warehouses').findOne({code:'K-GACH-01'}),destination=await m.get('warehouses').findOne({code:'K-GACH-02'});
 const options=await api(sender,'/options?warehouseId='+source._id);
 const srcLocation=options.locations.find(l=>l.code==='BF03-LOCAL-DEST');assert.ok(srcLocation,'Run BF03 local check first');
 const point=options.holdingPoints.find(p=>p.locationId===srcLocation.id),stock=options.balances.find(b=>b.holdingPointId===point.id&&b.qualityStatus==='GOOD');assert.ok(stock);
 const batch=options.batches.find(b=>b.id===stock.batchId),product=options.products.find(p=>p.id===batch.productId),quantity=String(batch.piecesPerCarton);
 const staging=options.locations.find(l=>l.locationType==='STAGING');assert.ok(staging);
 async function location(code,kind){return await Location.findOne({warehouseId:destination._id,code})||await Location.create({warehouseId:destination._id,code,locationType:kind,isPickable:kind==='STORAGE',usableLengthMm:'2000',usableWidthMm:'2000'});}
 const inbound=await location('BF04-LOCAL-IN','RECEIVING'),storage=await location('BF04-LOCAL-DEST','STORAGE');
 const request=await api(sender,'',{sourceWarehouseId:String(source._id),destinationWarehouseId:String(destination._id),reason:'Kiểm thử BF04 trên local',lines:[{productId:product.id,enteredUnit:product.baseUnit,enteredQty:quantity}]});
 await api(owner,'/'+request.id+'/review',{expectedVersion:1,decision:'APPROVE',reason:'Duyệt kiểm thử local'});
 let detail=await api(sender,'/'+request.id);
 const dispatch=await api(sender,'/'+request.id+'/outbound-deliveries',{expectedVersion:detail.version,lines:[{requestLineId:detail.items[0]._id,sourceBalanceId:stock.id,stagingLocationId:staging.id,qtyBase:quantity}]});
 const pick=await api(sender,'/documents/'+dispatch.id+'/internal-requirements',{expectedVersion:1});
 await api(sender,'/tasks/'+pick.id+'/confirm',{expectedVersion:1,recipientName:'Người vận chuyển kiểm thử local'});
 detail=await api(sender,'/'+request.id);const shipped=detail.dispatches.find(d=>d.id===dispatch.id);
 const receipt=await api(receiver,'/dispatches/'+dispatch.id+'/receipts',{expectedVersion:shipped.version,lines:[{dispatchLineId:shipped.items[0]._id,locationId:String(inbound._id),qtyBase:quantity,qualityCode:'GOOD'}]});
 detail=await api(receiver,'/'+request.id);const received=detail.receipts.find(d=>d.id===receipt.id);
 const putaway=await api(receiver,'/documents/'+receipt.id+'/internal-requirements',{expectedVersion:received.version,destinations:[{receiptLineId:received.items[0]._id,locationId:String(storage._id)}]});
 await api(receiver,'/tasks/'+putaway.id+'/confirm',{expectedVersion:1});
 detail=await api(receiver,'/'+request.id);await api(receiver,'/'+request.id+'/close',{expectedVersion:detail.version});
 detail=await api(receiver,'/'+request.id);assert.equal(detail.workflowStatus,'COMPLETED');
 console.log(JSON.stringify({database:connection.name,documentNo:detail.documentNo,status:detail.workflowStatus,sender:'warehouse@ceratile.vn',approver:'owner@ceratile.vn',receiver:'warehouse2@ceratile.vn',qtyBase:quantity,steps:'request/approve/dispatch/pick/receive/putaway/close'}));
} finally {await connection.close();}
