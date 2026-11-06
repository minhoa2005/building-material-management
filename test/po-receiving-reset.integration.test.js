import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {resetPoReceivingDemo} from '../src/migrations/po-receiving-demo.js';
import {BusinessDocument,StockMovement} from '../src/models/legacy/index.js';

test('receiving demo reset validates target, is dry-run by default and requires completed backup',{
  skip:!process.env.MONGODB_TEST_URI,timeout:300000,
},async()=>{
  const database=`sep490_po_reset_test_${new mongoose.Types.ObjectId()}`;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI,{dbName:database,autoIndex:false});
    const db=mongoose.connection.db;
    await db.collection('old_demo_sentinel').insertOne({value:'preserve until backed up'});
    const preview=await resetPoReceivingDemo(mongoose.connection,{targetDatabase:database});
    assert.equal(preview.dryRun,true);assert.equal(await db.collection('old_demo_sentinel').countDocuments(),1);
    await assert.rejects(resetPoReceivingDemo(mongoose.connection,{apply:true,targetDatabase:'wrong_database'}),/Refusing/);
    await assert.rejects(resetPoReceivingDemo(mongoose.connection,{apply:true,targetDatabase:database}),/backup/i);
    await assert.rejects(resetPoReceivingDemo(mongoose.connection,{apply:true,targetDatabase:database,backup:async()=>({completed:false})}),/not completed/);
    assert.equal(await db.collection('old_demo_sentinel').countDocuments(),1);
    let oldRows;
    const result=await resetPoReceivingDemo(mongoose.connection,{apply:true,targetDatabase:database,backup:async()=>{
      oldRows=await db.collection('old_demo_sentinel').find().toArray();
      return {completed:true,manifestPath:'in-memory-test-backup'};
    }});
    assert.equal(oldRows[0].value,'preserve until backed up');assert.equal(result.seeded,true);
    assert.equal(await db.collection('old_demo_sentinel').countDocuments(),0);
    const inspections=await BusinessDocument.find({documentKind:'PO_INSPECTION'}).lean();assert.ok(inspections.length);
    assert.equal(await BusinessDocument.countDocuments({documentKind:'ARRIVAL'}),0);
    assert.equal(await BusinessDocument.countDocuments({documentNo:'DEMO-INSPECTION-P'}),0);
    const gr=await BusinessDocument.findOne({documentKind:'GR_PURCHASE'}).lean();
    assert.equal(String(gr.header.poInspectionId),String(inspections[0]._id));
    const movements=await StockMovement.find({documentId:gr._id}).lean();
    assert.ok(movements.every(r=>!r.fromBalanceId && r.toBalanceId));
  } finally {
    if(mongoose.connection.readyState && mongoose.connection.name===database) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
