import mongoose from 'mongoose';
import assert from 'node:assert/strict';
import {registerModels} from '../src/models/index.js';
import {SEED_ACCOUNTS} from '../src/seeds/data/accounts.data.js';

const connection=await mongoose.createConnection('mongodb://127.0.0.1:27018/wmsd_hieudt_local_20261111?replicaSet=hieudt-test',{autoCreate:false,autoIndex:false}).asPromise();
try {
  const models=registerModels(connection), root='http://localhost:3334/api';
  const health=await fetch(root+'/health');
  assert.equal(health.headers.get('X-WMSD-Review-Database'),connection.name,'Proxy must point to the local-only review server');
  const account=SEED_ACCOUNTS.find(a=>a.username==='warehouse@ceratile.vn');
  const login=await fetch(root+'/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:account.username,password:account.password})});
  assert.equal(login.status,200);
  const session=(await login.json()).data;
  assert.ok(await models.get('users').exists({_id:session.user.id}), 'FE must use the local review account');
  const api=async(path,body)=>{const r=await fetch(root+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',authorization:'Bearer '+session.accessToken},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};};
  const catalogue=(await api('/location-movements/options')).body.data;
  const warehouseId=catalogue.warehouses[0].id;
  const data=(await api('/location-movements/options?warehouseId='+warehouseId)).body.data;
  const locks=await models.get('stocktake_location_locks').find({status:'LOCKED'}).lean();
  const balance=data.balances.find(b=>b.ownerType==='STORE'&&b.qualityStatus==='GOOD'&&b.packagingPortions?.length&&b.packagingPortions.every(p=>p.packagingState==='SEALED')&&(()=>{const point=data.holdingPoints.find(p=>p.id===b.holdingPointId);const loc=data.locations.find(l=>l.id===point?.locationId);return loc?.locationType==='STORAGE'&&!locks.some(l=>String(l.locationId)===loc.id);})());
  assert.ok(balance);
  const Location=models.get('warehouse_locations');
  let destination=await Location.findOne({warehouseId,code:'BF03-LOCAL-DEST'});
  if(!destination)destination=await Location.create({warehouseId,code:'BF03-LOCAL-DEST',name:'Vị trí đích kiểm thử local',locationType:'STORAGE',isPickable:true,usableLengthMm:'2000',usableWidthMm:'2000'});
  const batch=data.batches.find(b=>b.id===balance.batchId), product=data.products.find(p=>p.id===batch.productId);
  const key=()=>new mongoose.Types.ObjectId().toString();
  const cartonUnit=data.units.find(unit=>unit.isCarton && data.conversions.some(conversion=>
    conversion.uomId===unit.id && conversion.productBatchId===batch.id));
  assert.ok(cartonUnit,'Lô kiểm thử phải có quy đổi thùng');
  const body={warehouseId,reason:'Kiểm thử bảng BF03 trên local',lines:[{sourceBalanceId:balance.id,sourceBalanceVersion:balance.version,toLocationId:String(destination._id),enteredUnit:cartonUnit.code,enteredQty:'1'}]};
  assert.equal((await api('/location-movements',{...body,idempotencyKey:key(),lines:[{...body.lines[0],enteredQty:'1.5'}]})).status,400);
  assert.equal((await api('/location-movements',{...body,idempotencyKey:key(),lines:[{...body.lines[0],enteredUnit:product.baseUnit,enteredQty:'1'}]})).status,400);
  const created=await api('/location-movements',{...body,idempotencyKey:key()});
  assert.ok(created.status<300,JSON.stringify(created.body));
  const id=created.body.data.id, detail=(await api('/location-movements/'+id)).body.data;
  const source=await models.get('inventory_balances').findById(balance.id);
  assert.equal(String(source.quantityBase),balance.quantityBase,'Creating an order must not move stock');
  const confirm={idempotencyKey:key(),expectedVersion:detail.version,lines:detail.items.map(i=>({lineId:i._id,actualQtyBase:i.qtyBase}))};
  const confirmed=await api('/location-movements/'+id+'/confirm',confirm);assert.equal(confirmed.status,200,JSON.stringify(confirmed.body));
  const replay=await api('/location-movements/'+id+'/confirm',confirm);assert.equal(replay.status,200);assert.equal(replay.body.data.replayed,true);
  assert.equal(await models.get('stock_transactions').countDocuments({sourceId:id,operation:'RELOCATE'}),1);
  console.log(JSON.stringify({database:connection.name,proxyPort:3334,localBackend:3001,fractionalRejected:true,brokenCartonRejected:true,documentNo:detail.documentNo,baseQtyMoved:detail.items[0].qtyBase,confirmed:true,retryPostsOnce:true,destination:destination.code}));
} finally {await connection.close();}
