import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import * as m from '../src/models/index.js';
import { buildDemoData } from '../src/seeds/data/demo.data.js';
import { exact } from '../src/models/model-utils.js';
import { PNG } from 'pngjs';
import { reconcilePurchasing } from '../src/modules/po-receiving/purchase-reconciliation.js';
import { evidenceStorage, cleanupPurchaseEvidence } from '../src/modules/po-receiving/purchase-evidence.service.js';
import { grantPurchaseReadPermissions } from '../src/seeds/index.js';

test('Purchase receiving v3: RR authority, quantity-only GR, placement, correction and evidence',{
  skip:!process.env.MONGODB_TEST_URI,timeout:300000,
},async t=>{
  let server;
  const dbName=`sep490_po_receiving_test_${new mongoose.Types.ObjectId()}`;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI,{dbName,autoIndex:false,serverSelectionTimeoutMS:5000});
    for(const Model of Object.values(m).filter(x=>x?.modelName)) await Model.createIndexes();
    for(const {Model,documents} of await buildDemoData()) if(documents.length) await Model.insertMany(documents);
    const wh=await m.Warehouse.findOne({code:'WH01'}).lean();
    const warehouse=await m.User.findOne({username:'warehouse@ceratile.vn'}).lean();
    const owner=await m.User.findOne({username:'owner@ceratile.vn'}).lean();
    const accountant=await m.User.findOne({username:'accountant@ceratile.vn'}).lean();
    const supplier=await m.Party.findOne({kind:'SUPPLIER'}).lean(); const store=await m.Party.findOne({kind:'STORE'}).lean();
    const product=await m.Product.findOne({sku:'GACH-DEMO-1'}).lean();
    const lot=await m.Lot.findOne({productId:product._id,identificationStatus:'VERIFIED'}).lean();
    const piece=await m.Uom.findOne({code:'PIECE'}).lean();
    const conversion=await m.ProductUomVersion.findOne({productId:product._id,uomId:piece._id}).lean();
    const custody=await m.Location.findOne({warehouseId:wh._id,kind:'CUSTODY'}).lean();
    const receiving=await m.Location.findOne({warehouseId:wh._id,kind:'RECEIVING'}).lean();
    process.env.JWT_SECRET='po-receiving-test-only';
    const {default:app}=await import('../src/app.js');server=app.listen(0,'127.0.0.1');await once(server,'listening');
    const root=`http://127.0.0.1:${server.address().port}/api`;
    async function api(method,path,body,user=warehouse) {
      const response=await fetch(root+path,{method,headers:{Authorization:`Bearer ${jwt.sign({userId:String(user._id)},process.env.JWT_SECRET)}`,'Content-Type':'application/json'},...(body && {body:JSON.stringify(body)})});
      return {status:response.status,body:await response.json()};
    }
    async function ok(method,path,body,user=warehouse) {const r=await api(method,path,body,user);assert.ok([200,201].includes(r.status),JSON.stringify(r.body));return r.body.data;}

    let sequence=0;
    const k=()=> 'purchase-test-'+(++sequence);
    const sid=v=>String(v._id??v);
    const live=async id=>m.BusinessDocument.findById(id).lean();
    const storage=await m.Location.findOne({warehouseId:wh._id,kind:'STORAGE'}).lean();
    const storageB=await m.Location.create({warehouseId:wh._id,code:'TEST-STORAGE-B',kind:'STORAGE',allocatable:true});
    const admin=await m.User.findOne({username:'admin@ceratile.vn'}).lean();
    const sales=await m.User.findOne({username:'sales@ceratile.vn'}).lean();
    const otherWarehouse=await m.User.findOne({username:'warehouse2@ceratile.vn'}).lean();
    async function approved(qty='100') {
      const rr=await ok('POST','/replenishments',{action:'SUBMIT',creationKey:k(),warehouseId:sid(wh),neededOn:new Date(Date.now()+86400000).toISOString().slice(0,10),triggerReason:'Manual purchase test',lines:[{productId:sid(product),conversionId:sid(conversion),enteredQty:qty,reasonNote:'Reserve for purchase test'}]});
      const line=await m.DocumentLine.findOne({documentId:rr.id}).lean();
      const review=await ok('POST','/replenishments/'+rr.id+'/review',{expectedVersion:rr.version,operationKey:k(),decision:'APPROVE',reason:'Approved test',lines:[{lineId:sid(line),approvedQtyBase:qty}]},owner);
      return {rr,line,approvalId:review.approvalId};
    }
    async function draftPo(src,qty='100') {
      const body={creationKey:k(),warehouseId:sid(wh),supplierId:sid(supplier),lines:[{rrLineId:sid(src.line),approvalId:src.approvalId,enteredQty:qty}]};
      const c=await ok('POST','/purchase-orders',body,accountant);
      return {c,body};
    }
    async function po(qty='100') {
      const src=await approved(qty);const {c}=await draftPo(src,qty);
      await ok('POST','/purchase-orders/'+c.id+'/confirm',{expectedVersion:c.version,operationKey:k()},accountant);
      const d=await live(c.id); const l=await m.DocumentLine.findOne({documentId:d._id}).lean();
      const newLot=await m.Lot.create({productId:product._id,manufacturerLot:k(),tone:'T1',calibre:'C1',identificationStatus:'VERIFIED',verificationReference:'Test verified source'});
      return {d,l,lot:newLot,src};
    }
    async function form(p,qty='70') {return {creationKey:k(),expectedPoVersion:(await live(p.d._id)).version,arrivedAt:new Date(Date.now()-1000).toISOString(),delivererName:'Test deliverer',lines:qty===null?[]:[{clientLineKey:k(),poLineId:sid(p.l),lotId:sid(p.lot),enteredQty:qty,plannedReceiptLocationId:sid(receiving)}]};}
    async function draft(p,qty='70') {const body=await form(p,qty);const c=await ok('POST','/purchase-orders/'+sid(p.d)+'/inspections',body);return {c,body,detail:await ok('GET','/po-inspections/'+c.id)};}
    async function confirm(p,d,key=k()) {return ok('POST','/po-inspections/'+d.c.id+'/confirm',{expectedVersion:(await live(d.c.id)).version,expectedPoVersion:(await live(p.d._id)).version,operationKey:key});}
    async function post(p,grId,key=k()) {return ok('POST','/purchase-receipts/'+grId+'/post',{expectedVersion:(await live(grId)).version,expectedPoVersion:(await live(p.d._id)).version,operationKey:key});}
    const total=async party=>(await m.StockBalance.find({ownerPartyId:party._id}).lean()).reduce((q,r)=>q.plus(exact(r.qtyBase)),exact('0'));
    const originals={...evidenceStorage};const objects=new Map();
    evidenceStorage.upload=async(bytes,opts)=>{objects.set(opts.public_id,bytes);return {public_id:opts.public_id,type:'authenticated'};};
    evidenceStorage.exists=async key=>{if(!objects.has(key))throw Error('missing');return {public_id:key};};
    evidenceStorage.destroy=async key=>{objects.delete(key);return {result:'ok'};};
    evidenceStorage.download=()=> 'https://private.test/authorized-file';
    const png=PNG.sync.write(new PNG({width:1,height:1}));
    async function upload(documentId,user=warehouse,bytes=png,type='image/png') {
      const data=new FormData();data.append('file',new Blob([bytes],{type}),'evidence.png');
      const response=await fetch(root+'/purchase-documents/'+documentId+'/evidence/uploads',{method:'POST',headers:{Authorization:'Bearer '+jwt.sign({userId:sid(user)},process.env.JWT_SECRET)},body:data});
      return {status:response.status,body:await response.json()};
    }
    async function evidence(documentId,user=warehouse) {
      const u=await upload(documentId,user);assert.equal(u.status,200,JSON.stringify(u.body));
      return (await ok('POST','/purchase-documents/'+documentId+'/evidence/attach',{expectedVersion:(await live(documentId)).version,operationKey:k(),uploadIntentId:u.body.data.uploadIntentId},user)).evidenceId;
    }
    try {
    await t.test('RR to PO to three trips 40+35+25; confirm has zero stock effect, post only credits STORE',async()=>{
      const p=await po();const owned=await total(store),held=await total(supplier);const custodyCount=await m.BusinessDocument.countDocuments({documentKind:'CUSTODY_RECEIPT'});
      let net=0;
      for(const qty of ['40','35','25']) {
        const d=await draft(p,qty);const before=await m.StockMovement.countDocuments();
        const c=await confirm(p,d);assert.equal(c.custodyReceiptId,undefined);assert.equal(await m.StockMovement.countDocuments(),before);
        await post(p,c.goodsReceiptId);net+=Number(qty);
        const summary=await ok('GET','/purchase-orders/'+sid(p.d)+'/receiving-summary',undefined,accountant);
        assert.equal(summary.quantities[0].netPostedReceiptQtyBase,String(net));
        assert.equal(summary.quantities[0].outstandingQtyBase,String(100-net));
      }
      assert.equal((await total(store)).minus(owned).toString(),'100');assert.equal((await total(supplier)).toString(),held.toString());
      assert.equal(await m.BusinessDocument.countDocuments({documentKind:'CUSTODY_RECEIPT'}),custodyCount);
      assert.equal((await live(p.d._id)).workflowStatus,'COMPLETED');
      const trips=await ok('GET','/purchase-orders/'+sid(p.d)+'/receiving-trips?page=2&limit=2');assert.equal(trips.total,3);assert.equal(trips.items.length,1);
    });
    await t.test('record only 70, stable line and link identity, draft key replay and stale protection',async()=>{
      const p=await po();const d=await draft(p);const lineId=d.detail.lines[0]._id;
      const link=await m.LineLink.findOne({targetLineId:lineId}).lean();
      const {creationKey,...fields}=d.body;
      const body={...fields,expectedVersion:1,operationKey:k()};
      await ok('PUT','/po-inspections/'+d.c.id,body);
      assert.equal((await ok('PUT','/po-inspections/'+d.c.id,body)).replayed,true);
      assert.equal((await ok('GET','/po-inspections/'+d.c.id)).lines[0]._id,lineId);
      assert.equal(sid(await m.LineLink.findOne({targetLineId:lineId}).lean()),sid(link));
      assert.equal((await api('PUT','/po-inspections/'+d.c.id,{...body,operationKey:k()})).status,409);
      const c=await confirm(p,d);await post(p,c.goodsReceiptId);
      const summary=await ok('GET','/purchase-orders/'+sid(p.d)+'/receiving-summary');assert.equal(summary.quantities[0].outstandingQtyBase,'30');
      assert.equal((await api('POST','/purchase-orders/'+sid(p.d)+'/inspections',{...await form(p),lines:[{...(await form(p)).lines[0],disposition:'PENDING'}]})).status,400);
    });
    await t.test('headroom includes draft GR; concurrent confirms cannot overcommit',async()=>{
      const p=await po();const a=await draft(p,'70');await confirm(p,a);
      const ctx=await ok('GET','/purchase-orders/'+sid(p.d)+'/inspection-context');assert.equal(ctx.quantities[0].acceptanceHeadroomQtyBase,'30');
      const b=await draft(p,'40');const r=await api('POST','/po-inspections/'+b.c.id+'/confirm',{expectedVersion:1,expectedPoVersion:(await live(p.d._id)).version,operationKey:k()});assert.equal(r.status,409);assert.equal(r.body.code,'ERR-REC-HEADROOM');
      const p2=await po('10');const c=await draft(p2,'8'),d=await draft(p2,'8');const v=(await live(p2.d._id)).version;
      const results=await Promise.all([c,d].map(x=>api('POST','/po-inspections/'+x.c.id+'/confirm',{expectedVersion:1,expectedPoVersion:v,operationKey:k()})));
      assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
    });
    await t.test('two POs cannot consume the same RR allowance; draft alone does not hold it',async()=>{
      const src=await approved('100');const a=await draftPo(src,'80'),b=await draftPo(src,'80');
      assert.equal((await m.PurchaseSourceClaim.find({rrLineId:src.line._id}).lean()).reduce((n,c)=>n.plus(exact(c.qtyBase)),exact('0')).toString(),'0');
      const results=await Promise.all([a,b].map(x=>api('POST','/purchase-orders/'+x.c.id+'/confirm',{expectedVersion:1,operationKey:k()},accountant)));
      assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
      assert.equal((await m.PurchaseSourceClaim.find({rrLineId:src.line._id}).lean()).reduce((n,c)=>n.plus(exact(c.qtyBase)),exact('0')).toString(),'80');
    });
    await t.test('cancel GR releases cap without stock; cancel versus post commits exactly one branch',async()=>{
      const p=await po();const d=await draft(p);const c=await confirm(p,d);const before=await total(store);
      const body={expectedVersion:1,expectedPoVersion:(await live(p.d._id)).version,operationKey:k(),reason:'Cancel planned receipt'};
      await ok('POST','/purchase-receipts/'+c.goodsReceiptId+'/cancel',body);assert.equal((await ok('POST','/purchase-receipts/'+c.goodsReceiptId+'/cancel',body)).replayed,true);
      assert.equal((await total(store)).toString(),before.toString());assert.equal((await ok('GET','/purchase-orders/'+sid(p.d)+'/receiving-summary')).quantities[0].acceptanceHeadroomQtyBase,'100');
      const p2=await po();const d2=await draft(p2);const c2=await confirm(p2,d2);const expectedPoVersion=(await live(p2.d._id)).version;
      const results=await Promise.all([api('POST','/purchase-receipts/'+c2.goodsReceiptId+'/cancel',{expectedVersion:1,expectedPoVersion,operationKey:k(),reason:'Race'}),api('POST','/purchase-receipts/'+c2.goodsReceiptId+'/post',{expectedVersion:1,expectedPoVersion,operationKey:k()})]);
      assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
    });
    await t.test('freeze blocks posting and rolls back ledger, placement and versions',async()=>{
      const p=await po();const d=await draft(p);const c=await confirm(p,d);const pv=(await live(p.d._id)).version;
      const freeze=await m.BusinessDocument.create({documentNo:k(),documentKind:'STOCKTAKE',createdBy:owner._id,header:{warehouseId:wh._id,scopeLocationIds:[receiving._id]}});
      await m.LocationLock.create({stocktakeId:freeze._id,locationId:receiving._id});
      try {const r=await api('POST','/purchase-receipts/'+c.goodsReceiptId+'/post',{expectedVersion:1,expectedPoVersion:pv,operationKey:k()});assert.equal(r.status,409);assert.equal(r.body.code,'ERR-REC-FREEZE');assert.equal(await m.StockMovement.countDocuments({documentId:c.goodsReceiptId}),0);assert.equal(await m.ReceiptPlacement.countDocuments({receiptId:c.goodsReceiptId}),0);assert.equal((await live(p.d._id)).version,pv);}
      finally {await m.LocationLock.deleteMany({stocktakeId:freeze._id});}
    });
    await t.test('private evidence validates bytes, parent and actor; attaches once; cleanup preserves attached files',async()=>{
      const p=await po();const d=await draft(p);assert.equal((await upload(d.c.id,warehouse,Buffer.from('not an image'))).status,400);
      assert.equal((await upload(d.c.id,warehouse,Buffer.alloc(5*1024*1024+1))).status,413);
      const u=await upload(d.c.id);assert.equal(u.status,200,JSON.stringify(u.body));const intent=u.body.data.uploadIntentId;
      const another=await draft(p);
      assert.equal((await api('POST','/purchase-documents/'+another.c.id+'/evidence/attach',{expectedVersion:1,operationKey:k(),uploadIntentId:intent})).status,404);
      const attach={expectedVersion:1,operationKey:k(),uploadIntentId:intent};const attached=await ok('POST','/purchase-documents/'+d.c.id+'/evidence/attach',attach);assert.equal((await ok('POST','/purchase-documents/'+d.c.id+'/evidence/attach',attach)).replayed,true);
      const items=await ok('GET','/purchase-documents/'+d.c.id+'/evidence');assert.equal(items.items.length,1);assert.equal(items.items[0].objectKey,undefined);
      assert.equal((await ok('GET','/purchase-documents/'+d.c.id+'/evidence/'+attached.evidenceId+'/download')).url,'https://private.test/authorized-file');
      assert.equal((await api('GET','/purchase-documents/'+d.c.id+'/evidence/'+attached.evidenceId+'/download',undefined,otherWarehouse)).status,404);
      const orphan=await upload(d.c.id);assert.equal(orphan.status,200);await m.PurchaseEvidenceUpload.updateOne({_id:orphan.body.data.uploadIntentId},{$set:{expiresAt:new Date(0)}});
      const cleaned=await cleanupPurchaseEvidence();assert.equal(cleaned.removed,1);assert.equal((await m.PurchaseEvidenceUpload.findById(intent).lean()).status,'ATTACHED');
    });
    await t.test('amendment uses extra approved RR; schedule is stock-neutral; short close requires current Owner authority',async()=>{
      const p=await po();const d=await draft(p);const c=await confirm(p,d);await post(p,c.goodsReceiptId);
      const eid=await evidence(sid(p.d),accountant);const extra=await approved('20');const before=await m.StockMovement.countDocuments();
      await ok('POST','/purchase-orders/'+sid(p.d)+'/amendments',{expectedVersion:(await live(p.d._id)).version,operationKey:k(),reason:'Add twenty with approved source',evidenceIds:[eid],lines:[{poLineId:sid(p.l),rrLineId:sid(extra.line),approvalId:extra.approvalId,enteredQty:'20'}]},accountant);
      let summary=await ok('GET','/purchase-orders/'+sid(p.d)+'/receiving-summary');assert.equal(summary.quantities[0].orderedQtyBase,'100');assert.equal(summary.quantities[0].authorizedOrderedQtyBase,'120');assert.equal(summary.quantities[0].outstandingQtyBase,'50');
      await ok('POST','/purchase-orders/'+sid(p.d)+'/supplier-confirmations',{expectedVersion:(await live(p.d._id)).version,operationKey:k(),reason:'Supplier schedule',evidenceIds:[eid],lines:[{poLineId:sid(p.l),qtyBase:'120',expectedOn:new Date(Date.now()+86400000).toISOString()}]},accountant);
      assert.equal(await m.StockMovement.countDocuments(),before);
      const request=await ok('POST','/purchase-orders/'+sid(p.d)+'/close-requests',{expectedVersion:(await live(p.d._id)).version,operationKey:k(),reason:'Supplier cannot deliver remaining fifty',evidenceIds:[eid],lines:[{poLineId:sid(p.l),qtyBase:'50'}]},accountant);
      const approveBody={expectedVersion:(await live(p.d._id)).version,operationKey:k(),reason:'Approve shortage',evidenceIds:[eid],requestId:request.eventId};
      assert.equal((await api('POST','/purchase-orders/'+sid(p.d)+'/close-approvals',approveBody,accountant)).status,403);
      const approval=await ok('POST','/purchase-orders/'+sid(p.d)+'/close-approvals',approveBody,owner);
      await ok('POST','/purchase-orders/'+sid(p.d)+'/close-executions',{expectedVersion:(await live(p.d._id)).version,operationKey:k(),reason:'Execute approved short closure',approvalId:approval.eventId},accountant);
      summary=await ok('GET','/purchase-orders/'+sid(p.d)+'/receiving-summary');assert.equal(summary.quantities[0].closedRemainderQtyBase,'50');assert.equal(summary.quantities[0].netPostedReceiptQtyBase,'70');assert.equal(summary.quantities[0].outstandingQtyBase,'0');assert.equal((await live(p.d._id)).workflowStatus,'CLOSED');
      assert.equal(await m.StockMovement.countDocuments(),before);
    });
    await t.test('putaway on completed PO splits 40/30 and confirms 20/20/30, preserving total and source trace',async()=>{
      const p=await po('70');const d=await draft(p);const c=await confirm(p,d);await post(p,c.goodsReceiptId);const before=await total(store);
      const ctx=await ok('GET','/purchase-receipts/'+c.goodsReceiptId+'/putaway-context');const l=ctx.lines[0];
      const body={expectedVersion:ctx.receiptVersion,creationKey:k(),lines:[{receiptLineId:l._id,expectedPlacementVersion:l.placementVersion,expectedSourceVersion:l.sourceBalanceVersion,qtyBase:'40',toLocationId:sid(storage)},{receiptLineId:l._id,expectedPlacementVersion:l.placementVersion,expectedSourceVersion:l.sourceBalanceVersion,qtyBase:'30',toLocationId:sid(storageB)}]};
      const task=await ok('POST','/purchase-receipts/'+c.goodsReceiptId+'/putaway-tasks',body);assert.equal((await total(store)).toString(),before.toString());
      const detail=await ok('GET','/putaway-tasks/'+task.id);
      for(const [index,qty] of [[0,'20'],[0,'20'],[1,'30']]) await ok('POST','/putaway-tasks/'+task.id+'/confirm',{expectedVersion:(await live(task.id)).version,operationKey:k(),lines:[{taskLineId:detail.lines[index]._id,actualQtyBase:qty}]});
      assert.equal((await live(task.id)).workflowStatus,'CONFIRMED');assert.equal((await total(store)).toString(),before.toString());
      const current=await ok('GET','/purchase-receipts/'+c.goodsReceiptId+'/putaway-context');assert.equal(current.lines[0].placedQtyBase,'70');assert.equal(current.lines[0].unplannedQtyBase,'0');
      const preflight=await ok('GET','/purchase-receipts/'+c.goodsReceiptId+'/reversal-preflight');assert.equal(preflight.canReverse,false);assert.ok(preflight.blockers.some(b=>b.code==='PLACED'));
    });
    await t.test('competing putaway claims cannot overplan; cancelling partial releases only remainder',async()=>{
      const p=await po('70');const d=await draft(p);const c=await confirm(p,d);await post(p,c.goodsReceiptId);
      const ctx=await ok('GET','/purchase-receipts/'+c.goodsReceiptId+'/putaway-context');const l=ctx.lines[0];const body={expectedVersion:ctx.receiptVersion,creationKey:k(),lines:[{receiptLineId:l._id,expectedPlacementVersion:l.placementVersion,expectedSourceVersion:l.sourceBalanceVersion,qtyBase:'70',toLocationId:sid(storage)}]};
      const results=await Promise.all([api('POST','/purchase-receipts/'+c.goodsReceiptId+'/putaway-tasks',body),api('POST','/purchase-receipts/'+c.goodsReceiptId+'/putaway-tasks',{...body,creationKey:k()})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
      const task=results.find(r=>r.status===200).body.data;const detail=await ok('GET','/putaway-tasks/'+task.id);
      const confirmBody={expectedVersion:1,operationKey:k(),lines:[{taskLineId:detail.lines[0]._id,actualQtyBase:'20'}]};await ok('POST','/putaway-tasks/'+task.id+'/confirm',confirmBody);assert.equal((await ok('POST','/putaway-tasks/'+task.id+'/confirm',confirmBody)).replayed,true);
      const movements=await m.StockMovement.countDocuments({documentId:task.id});await ok('POST','/putaway-tasks/'+task.id+'/cancel-remainder',{expectedVersion:2,operationKey:k(),reason:'Finish later'});
      assert.equal(await m.StockMovement.countDocuments({documentId:task.id}),movements);const current=await ok('GET','/purchase-receipts/'+c.goodsReceiptId+'/putaway-context');assert.equal(current.lines[0].unplannedQtyBase,'50');assert.equal(current.lines[0].placedQtyBase,'20');
    });
    await t.test('reversal requires evidence, reverses once, reopens PO and links replacement to same trip',async()=>{
      const p=await po('70');const d=await draft(p);const c=await confirm(p,d);await post(p,c.goodsReceiptId);const eid=await evidence(c.goodsReceiptId);
      const pre=await ok('GET','/purchase-receipts/'+c.goodsReceiptId+'/reversal-preflight');assert.equal(pre.canReverse,true,JSON.stringify(pre));
      const body={expectedVersion:pre.receiptVersion,expectedPoVersion:pre.poVersion,operationKey:k(),reason:'Wrong entered lot',evidenceIds:[eid]};
      await ok('POST','/purchase-receipts/'+c.goodsReceiptId+'/reverse',body);assert.equal((await ok('POST','/purchase-receipts/'+c.goodsReceiptId+'/reverse',body)).replayed,true);
      assert.equal((await ok('GET','/purchase-orders/'+sid(p.d)+'/receiving-summary')).quantities[0].netPostedReceiptQtyBase,'0');
      const proof=await evidence(d.c.id);const correction={expectedVersion:(await live(d.c.id)).version,expectedPoVersion:(await live(p.d._id)).version,operationKey:k(),reason:'Replace with reviewed quantity',evidenceIds:[proof],lines:[{clientLineKey:k(),poLineId:sid(p.l),lotId:sid(p.lot),enteredQty:'60',plannedReceiptLocationId:sid(receiving)}]};
      const replacement=await ok('POST','/po-inspections/'+d.c.id+'/corrections',correction);const detail=await ok('GET','/po-inspections/'+replacement.id);assert.equal(detail.header.rootInspectionId,d.c.id);
      const trips=await ok('GET','/purchase-orders/'+sid(p.d)+'/receiving-trips');assert.equal(trips.total,1);assert.equal(trips.items[0].revisions.length,2);
      const cc=await confirm(p,{c:replacement});await post(p,cc.goodsReceiptId);assert.equal((await ok('GET','/purchase-orders/'+sid(p.d)+'/receiving-summary')).quantities[0].netPostedReceiptQtyBase,'60');
    });
    await t.test('confirmed draft correction cancels original GR atomically and never double-counts trips',async()=>{
      const p=await po();const d=await draft(p);const c=await confirm(p,d);const eid=await evidence(d.c.id);
      const replacement=await ok('POST','/po-inspections/'+d.c.id+'/corrections',{expectedVersion:(await live(d.c.id)).version,expectedPoVersion:(await live(p.d._id)).version,operationKey:k(),reason:'Wrong quantity before posting',evidenceIds:[eid],lines:[{clientLineKey:k(),poLineId:sid(p.l),lotId:sid(p.lot),enteredQty:'50',plannedReceiptLocationId:sid(receiving)}]});
      assert.equal((await live(c.goodsReceiptId)).workflowStatus,'CANCELLED');assert.equal(await m.StockMovement.countDocuments({documentId:c.goodsReceiptId}),0);
      await confirm(p,{c:replacement});assert.equal((await ok('GET','/purchase-orders/'+sid(p.d)+'/receiving-summary')).quantities[0].openDraftCommitmentQtyBase,'50');
    });
    await t.test('purchase read grant is additive, idempotent and restricted to Owner/Accountant', async () => {
      const permission = await m.Permission.findOne({ code: 'putaway_task:read' }).lean();
      const role = await m.Role.findById(accountant.roleId).lean();
      await m.Role.updateOne({ _id: role._id }, { $pull: { permissionIds: permission._id } });
      const others = await m.Role.find({ code: { $nin: ['OWNER', 'ACCOUNTANT'] } }).lean();
      assert.deepEqual(await grantPurchaseReadPermissions(), { matchedRoles: 1, updatedRoles: 1 });
      assert.deepEqual(await grantPurchaseReadPermissions(), { matchedRoles: 0, updatedRoles: 0 });
      const updated = await m.Role.findById(role._id).lean();
      assert.deepEqual(new Set(updated.permissionIds.map(sid)), new Set(role.permissionIds.map(sid)));
      assert.deepEqual(await m.Role.find({ code: { $nin: ['OWNER', 'ACCOUNTANT'] } }).lean(), others);
    });
    await t.test('Owner and Accountant read the entire purchase chain without assigned warehouses, but cannot execute receiving or putaway', async () => {
      const p = await po(); const d = await draft(p); const c = await confirm(p, d); await post(p, c.goodsReceiptId);
      const ctx = await ok('GET', '/purchase-receipts/' + c.goodsReceiptId + '/putaway-context');
      const line = ctx.lines[0];
      const create = { expectedVersion: ctx.receiptVersion, creationKey: k(), lines: [{ receiptLineId: line._id, expectedPlacementVersion: line.placementVersion, expectedSourceVersion: line.sourceBalanceVersion, qtyBase: '40', toLocationId: sid(storage) }] };
      const task = await ok('POST', '/purchase-receipts/' + c.goodsReceiptId + '/putaway-tasks', create);
      const detail = await ok('GET', '/putaway-tasks/' + task.id);
      const eid = await evidence(task.id);
      const movements = await m.StockMovement.countDocuments();
      const taskVersion = (await live(task.id)).version;
      for (const actor of [owner, accountant]) await m.User.updateOne({ _id: actor._id }, { $set: { warehouseIds: [] } });
      try {
        for (const actor of [owner, accountant]) {
          for (const url of [
            '/purchase-orders', '/purchase-orders/' + sid(p.d),
            '/purchase-orders/' + sid(p.d) + '/receiving-summary',
            '/purchase-orders/' + sid(p.d) + '/receiving-trips',
            '/po-inspections/' + d.c.id,
            '/purchase-receipts?warehouseId=' + sid(wh), '/purchase-receipts/' + c.goodsReceiptId,
            '/purchase-receipts/' + c.goodsReceiptId + '/putaway-context', '/putaway-tasks/' + task.id,
            '/purchase-documents/' + task.id + '/history', '/purchase-documents/' + task.id + '/evidence',
            '/purchase-documents/' + task.id + '/evidence/' + eid + '/download',
          ]) assert.equal((await api('GET', url, undefined, actor)).status, 200, actor.username + ': ' + url);
          const viewed = await ok('GET', '/putaway-tasks/' + task.id, undefined, actor);
          assert.equal(viewed.lines[0].remainingQtyBase, '40');
          const receipt = await ok('GET', '/purchase-receipts/' + c.goodsReceiptId, undefined, actor);
          assert.ok(Object.values(receipt.capabilities).every(value => value === false));
          for (const [url, body] of [
            ['/purchase-receipts/' + c.goodsReceiptId + '/putaway-tasks', create],
            ['/putaway-tasks/' + task.id + '/confirm', { expectedVersion: taskVersion, operationKey: k(), lines: [{ taskLineId: detail.lines[0]._id, actualQtyBase: '1' }] }],
            ['/putaway-tasks/' + task.id + '/cancel-remainder', { expectedVersion: taskVersion, operationKey: k(), reason: 'Read-only role' }],
            ['/purchase-receipts/' + c.goodsReceiptId + '/post', { expectedVersion: 1, expectedPoVersion: 1, operationKey: k() }],
          ]) assert.equal((await api('POST', url, body, actor)).status, 403, url);
        }
        assert.equal((await api('GET', '/putaway-tasks/' + task.id, undefined, otherWarehouse)).status, 404);
        assert.equal((await api('GET', '/purchase-documents/' + task.id + '/evidence/' + eid + '/download', undefined, otherWarehouse)).status, 404);
        for (const actor of [admin, sales]) assert.equal((await api('GET', '/putaway-tasks/' + task.id, undefined, actor)).status, 403);
        const unrelated = await m.BusinessDocument.findOne({ documentKind: 'TO', 'header.taskKind': 'PICK' }).lean();
        assert.equal((await api('GET', '/putaway-tasks/' + sid(unrelated), undefined, accountant)).status, 404);
      } finally {
        for (const actor of [owner, accountant]) await m.User.updateOne({ _id: actor._id }, { $set: { warehouseIds: actor.warehouseIds } });
      }
      assert.equal(await m.StockMovement.countDocuments(), movements);
      assert.equal((await live(task.id)).version, taskVersion);
    });
    await t.test('role/scope, history pagination, queue filters and operation recovery use current authority',async()=>{
      const p=await po();const d=await draft(p);const path='/purchase-orders/'+sid(p.d);
      await m.User.updateOne({_id:accountant._id},{$set:{warehouseIds:[]}});
      try {
        for (const actor of [accountant, owner]) {
          for (const url of [path+'/inspection-context', path+'/receiving-summary', path+'/receiving-trips', '/po-inspections/'+d.c.id, '/po-inspections/'+d.c.id+'/history', '/purchase-documents/'+sid(p.d)+'/evidence']) {
            assert.equal((await api('GET',url,undefined,actor)).status,200,url);
          }
        }
        assert.equal((await api('GET','/po-inspections/'+d.c.id,undefined,otherWarehouse)).status,404);
      } finally { await m.User.updateOne({_id:accountant._id},{$set:{warehouseIds:accountant.warehouseIds}}); }
      for (const actor of [admin, sales]) assert.equal((await api('GET',path+'/inspection-context',undefined,actor)).status,403);
      assert.equal((await api('GET',path+'/inspection-context',undefined,otherWarehouse)).status,404);
      assert.equal((await api('GET',path+'/receiving-summary',undefined,owner)).status,200);
      for(const u of [admin,sales,owner,accountant]) assert.equal((await api('POST',path+'/inspections',await form(p),u)).status,403);
      assert.equal((await api('GET','/po-inspections/'+d.c.id,undefined,otherWarehouse)).status,404);
      const op=await ok('GET',path+'/receiving-operations/'+d.body.creationKey);assert.equal(op.status,'COMMITTED');assert.equal((await ok('GET',path+'/receiving-operations/'+d.body.creationKey,undefined,owner)).status,'NOT_FOUND');
      const history=await ok('GET','/po-inspections/'+d.c.id+'/history?limit=1');assert.equal(history.items.length,1);assert.ok(history.total>=1);
      const queue=await ok('GET','/purchase-receiving/queue?stage=DRAFT_INSPECTION&purchaseOrderId='+sid(p.d));assert.equal(queue.total,1);
      await m.User.updateOne({_id:warehouse._id},{$set:{warehouseIds:[]}});
      try {assert.equal((await api('POST',path+'/inspections',d.body)).status,404);assert.equal((await api('GET',path+'/receiving-operations/'+d.body.creationKey)).status,404);}finally {await m.User.updateOne({_id:warehouse._id},{$set:{warehouseIds:warehouse.warehouseIds}});}
    });

    await t.test('PO draft edits preserve line identity and validate source again on opening',async()=>{
      const src=await approved();const a=await draftPo(src,'70');const lines=await m.DocumentLine.find({documentId:a.c.id}).lean();const before=await m.StockMovement.countDocuments();
      const detail = await ok('GET','/purchase-orders/'+a.c.id,undefined,accountant);
      assert.deepEqual(detail.draftEdit.lines,[{id:sid(lines[0]),rrLineId:sid(src.line),approvalId:src.approvalId,enteredQty:'70',enteredUomCode:'PIECE'}]);
      for (const reader of [owner, warehouse]) assert.equal((await ok('GET','/purchase-orders/'+a.c.id,undefined,reader)).draftEdit,null);
      await m.User.updateOne({_id:accountant._id},{$set:{warehouseIds:[]}});
      try { assert.equal((await ok('GET','/purchase-orders/'+a.c.id,undefined,accountant)).draftEdit,null); }
      finally { await m.User.updateOne({_id:accountant._id},{$set:{warehouseIds:accountant.warehouseIds}}); }
      const {creationKey,...form}=a.body;form.lines[0]={...form.lines[0],id:sid(lines[0]),enteredQty:'80'};
      await ok('PUT','/purchase-orders/'+a.c.id,{...form,expectedVersion:1,operationKey:k()},accountant);
      assert.equal(sid(await m.DocumentLine.findOne({documentId:a.c.id}).lean()),sid(lines[0]));
      await ok('POST','/purchase-orders/'+a.c.id+'/confirm',{expectedVersion:2,operationKey:k()},accountant);
      assert.equal((await ok('GET','/purchase-orders/'+a.c.id,undefined,accountant)).draftEdit,null);
      assert.equal((await m.PurchaseSourceClaim.findOne({poLineId:lines[0]._id}).lean()).qtyBase.toString(),'80');assert.equal(await m.StockMovement.countDocuments(),before);
      assert.equal((await api('PUT','/purchase-orders/'+a.c.id,{...form,expectedVersion:3,operationKey:k()},accountant)).status,409);
      const invalid=await draftPo(src,'30');assert.equal((await api('POST','/purchase-orders/'+invalid.c.id+'/confirm',{expectedVersion:1,operationKey:k()},accountant)).status,409);
    });
    await t.test('draft reordering preserves both ids; GR destination is independently versioned and audited',async()=>{
      const p=await po();const body=await form(p,'30');body.lines.push({...body.lines[0],clientLineKey:k(),enteredQty:'20'});
      const c=await ok('POST','/purchase-orders/'+sid(p.d)+'/inspections',body);const first=await ok('GET','/po-inspections/'+c.id);const {creationKey,...fields}=body;
      await ok('PUT','/po-inspections/'+c.id,{...fields,lines:[...fields.lines].reverse(),expectedVersion:1,operationKey:k()});const second=await ok('GET','/po-inspections/'+c.id);assert.deepEqual(second.lines.map(l=>l._id),first.lines.map(l=>l._id).reverse());
      const grResult=await confirm(p,{c});const gr=await ok('GET','/purchase-receipts/'+grResult.goodsReceiptId);
      const alt=await m.Location.create({warehouseId:wh._id,kind:'RECEIVING',code:k()});
      const input={expectedVersion:gr.version,operationKey:k(),reason:'Dock reassigned',lines:[{lineId:gr.lines[0]._id,receivingLocationId:sid(alt)}]};
      await ok('PATCH','/purchase-receipts/'+gr._id+'/destinations',input);
      assert.equal((await api('PATCH','/purchase-receipts/'+gr._id+'/destinations',{...input,operationKey:k()})).status,409);
      await post(p,gr._id);const movement=await m.StockMovement.findOne({documentId:gr._id,lineId:gr.lines[0]._id}).lean();const dest=await m.StockBalance.findById(movement.toBalanceId).lean();const account=await m.StockAccount.findById(dest.accountId).lean();assert.equal(sid(account.locationId),sid(alt));
      assert.ok(await m.AuditEvent.exists({documentId:gr._id,action:'GR_DESTINATION'}));
    });
    await t.test('reversal execute rechecks freeze, reservation, hold and new task dependencies',async()=>{
      const p=await po('70');const d=await draft(p);const c=await confirm(p,d);await post(p,c.goodsReceiptId);const eid=await evidence(c.goodsReceiptId);
      const placement=await m.ReceiptPlacement.findOne({receiptId:c.goodsReceiptId}).lean();const pre=await ok('GET','/purchase-receipts/'+c.goodsReceiptId+'/reversal-preflight');assert.equal(pre.canReverse,true);
      const request={expectedVersion:pre.receiptVersion,expectedPoVersion:pre.poVersion,operationKey:k(),reason:'Attempt while source changed',evidenceIds:[eid]};const source=await m.StockBalance.findById(placement.sourceBalanceId).lean();
      const freeze=await m.BusinessDocument.create({documentNo:k(),documentKind:'STOCKTAKE',createdBy:owner._id,header:{warehouseId:wh._id,scopeLocationIds:[receiving._id]}});await m.LocationLock.create({stocktakeId:freeze._id,locationId:receiving._id});
      try {assert.equal((await api('POST','/purchase-receipts/'+c.goodsReceiptId+'/reverse',request)).status,409);}finally {await m.LocationLock.deleteMany({stocktakeId:freeze._id});}
      const demand=await m.DocumentLine.findOne({lineKind:'SALES_ORDER'}).lean();const execution=await m.DocumentLine.findOne({lineKind:'WAREHOUSE_TASK'}).lean();
      const reservation=await m.Reservation.create({demandLineId:demand._id,executionLineId:execution._id,balanceId:source._id,qtyBase:'1',status:'ACTIVE'});
      try {const result=await ok('GET','/purchase-receipts/'+c.goodsReceiptId+'/reversal-preflight');assert.ok(result.blockers.some(b=>b.code==='RESERVATION'));assert.equal((await api('POST','/purchase-receipts/'+c.goodsReceiptId+'/reverse',request)).status,409);}finally {await m.Reservation.deleteOne({_id:reservation._id});}
      const defect=await m.BusinessDocument.create({documentNo:k(),documentKind:'DEFECT_CASE',createdBy:warehouse._id,header:{discoveredAt:new Date(),reason:'Hold race test'}});
      const hold=await m.DefectHold.create({defectDocumentId:defect._id,balanceId:source._id,qtyBase:'1',evidenceId:eid,recordedBy:warehouse._id,status:'ACTIVE'});
      try {const result=await ok('GET','/purchase-receipts/'+c.goodsReceiptId+'/reversal-preflight');assert.ok(result.blockers.some(b=>b.code==='HOLD'));assert.equal((await api('POST','/purchase-receipts/'+c.goodsReceiptId+'/reverse',request)).status,409);}finally {await m.DefectHold.updateOne({_id:hold._id},{$set:{status:'RESOLVED'}});}
      const ctx=await ok('GET','/purchase-receipts/'+c.goodsReceiptId+'/putaway-context');const l=ctx.lines[0];await ok('POST','/purchase-receipts/'+c.goodsReceiptId+'/putaway-tasks',{expectedVersion:ctx.receiptVersion,creationKey:k(),lines:[{receiptLineId:l._id,expectedPlacementVersion:l.placementVersion,expectedSourceVersion:l.sourceBalanceVersion,qtyBase:'1',toLocationId:sid(storage)}]});
      assert.equal((await api('POST','/purchase-receipts/'+c.goodsReceiptId+'/reverse',request)).status,409);assert.equal(await m.PostingBatch.countDocuments({documentId:c.goodsReceiptId,operation:'REVERSE'}),0);
      assert.equal((await m.StockBalance.findById(source._id).lean()).qtyBase.toString(),source.qtyBase.toString());
    });
    await t.test('Receiving relocation cannot bypass purchase provenance; putaway preserves reserved stock',async()=>{
      const p=await po('70');const d=await draft(p);const c=await confirm(p,d);await post(p,c.goodsReceiptId);
      const ctx=await ok('GET','/purchase-receipts/'+c.goodsReceiptId+'/putaway-context');const l=ctx.lines[0];const alt=await m.Location.create({warehouseId:wh._id,code:k(),kind:'RECEIVING'});
      const relocate=await api('POST','/location-movements',{idempotencyKey:k(),warehouseId:sid(wh),reason:'Attempt to move tracked source',lines:[{sourceBalanceId:l.sourceBalanceId,sourceBalanceVersion:l.sourceBalanceVersion,toLocationId:sid(alt),conversionId:sid(conversion),enteredQty:'10'}]});assert.equal(relocate.status,409);assert.equal(relocate.body.code,'ERR-REC-PROVENANCE');
      const task=await ok('POST','/purchase-receipts/'+c.goodsReceiptId+'/putaway-tasks',{expectedVersion:ctx.receiptVersion,creationKey:k(),lines:[{receiptLineId:l._id,expectedPlacementVersion:l.placementVersion,expectedSourceVersion:l.sourceBalanceVersion,qtyBase:'70',toLocationId:sid(storage)}]});const taskDetail=await ok('GET','/putaway-tasks/'+task.id);
      const demand=await m.DocumentLine.findOne({lineKind:'SALES_ORDER'}).lean();const reservation=await m.Reservation.create({demandLineId:demand._id,executionLineId:taskDetail.lines[0]._id,balanceId:l.sourceBalanceId,qtyBase:'10',status:'ACTIVE'});
      await ok('POST','/putaway-tasks/'+task.id+'/confirm',{expectedVersion:1,operationKey:k(),lines:[{taskLineId:taskDetail.lines[0]._id,actualQtyBase:'70'}]});const carried=await m.Reservation.findById(reservation._id).lean();assert.notEqual(sid(carried.balanceId),l.sourceBalanceId);assert.equal(carried.qtyBase.toString(),'10');
    });
    await t.test('queue stages, unknown keys and cross-document history remain scoped',async()=>{
      const p=await po('70');const d=await draft(p);const c=await confirm(p,d);let queue=await ok('GET','/purchase-receiving/queue?stage=AWAITING_POST&purchaseOrderId='+sid(p.d));assert.equal(queue.total,1);
      await post(p,c.goodsReceiptId);queue=await ok('GET','/purchase-receiving/queue?stage=AWAITING_PUTAWAY&purchaseOrderId='+sid(p.d));assert.equal(queue.total,1);
      assert.equal((await ok('GET','/purchase-orders/'+sid(p.d)+'/receiving-operations/'+k())).status,'NOT_FOUND');
      const unrelated=await m.BusinessDocument.findOne({documentKind:'TO','header.taskKind':'PICK'}).lean();assert.equal((await api('GET','/purchase-documents/'+sid(unrelated)+'/history',undefined,owner)).status,404);
      const history=await ok('GET','/purchase-documents/'+sid(p.d)+'/history?limit=100');assert.ok(history.items.some(e=>e.action==='POST_PURCHASE_RECEIPT'));assert.ok(history.items.some(e=>e.action==='CONFIRM_PO_INSPECTION'));
      const eid=await evidence(c.goodsReceiptId);await ok('POST','/purchase-receipts/'+c.goodsReceiptId+'/reverse',{expectedVersion:(await live(c.goodsReceiptId)).version,expectedPoVersion:(await live(p.d._id)).version,operationKey:k(),reason:'Correction queue test',evidenceIds:[eid]});queue=await ok('GET','/purchase-receiving/queue?stage=CORRECTION&purchaseOrderId='+sid(p.d));assert.equal(queue.total,1);
    });
    await t.test('all test ledger, RR allowance and placement projections reconcile after commands',async()=>{ const report=await reconcilePurchasing();assert.equal(report.ok,true,JSON.stringify(report)); });
    } finally {Object.assign(evidenceStorage,originals);}
  } finally {
    if(server) await new Promise(resolve=>server.close(resolve));
    if(mongoose.connection.readyState && mongoose.connection.name===dbName) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
