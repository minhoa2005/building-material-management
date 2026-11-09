import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { buildReviewedDemo } from '../src/seeds/rebuild/data.js';
import { consolidateData, expandEmbedded, embeddedTables, removedCollections } from '../src/models/consolidation.js';
import { registerReviewedModels } from '../src/models/index.js';
import { validateReviewedDemo } from '../src/seeds/rebuild/validate.js';
import { estimateCartonCapacity, assertBatchPackaging } from '../src/models/capacity.js';
const copy = value => mongoose.mongo.BSON.EJSON.parse(mongoose.mongo.BSON.EJSON.stringify(value));
const source = await buildReviewedDemo({consolidate:false});
const data = consolidateData(copy(source));
const current = await buildReviewedDemo();
const models = registerReviewedModels(mongoose.createConnection());
const expectedRecord=(old,row)=>{
  const result=copy(row);
  if(old==='stock_thresholds') delete result.version;
  if(result.documentKind) delete result.revision;
  return result;
};

test('all merged record types retain IDs, fields, quantities and history', () => {
  const expanded=expandEmbedded(data);
  const sorted=rows=>[...rows].sort((a,b)=>String(a._id).localeCompare(String(b._id)));
  for (const old of Object.keys(embeddedTables)) assert.deepEqual(sorted(expanded[old]),sorted(source[old].map(row=>expectedRecord(old,row))),old);
  for (const old of removedCollections) { assert.ok(!models.has(old)); assert.ok(!Object.hasOwn(data,old)); }
  assert.equal(models.size,58);
});
test('model serialization preserves every embedded history field and reference', async () => {
  const saved=Object.fromEntries([...models].map(([name,Model])=>[name,current[name].map(row=>new Model(row).toObject())]));
  await validateReviewedDemo(saved,models);
  const expanded=expandEmbedded(saved);
  for (const old of Object.keys(embeddedTables)) {
    assert.equal(expanded[old].length,source[old].length);
    function preserved(expected, actual) {
      if (expected == null) return;
      if (Array.isArray(expected)) { assert.equal(actual.length,expected.length); expected.forEach((v,i)=>preserved(v,actual[i])); }
      else if (typeof expected==='object'&&!expected._bsontype&&!(expected instanceof Date)) {
        for (const [key,value] of Object.entries(expected)) preserved(value,actual?.[key]);
      } else if (actual?._bsontype==='Decimal128') assert.equal(String(actual),String(expected));
      else assert.deepEqual(actual,expected);
    }
    for (const row of source[old]) preserved(expectedRecord(old,row),expanded[old].find(value=>String(value._id)===String(row._id)));
  }
});
test('consolidation leaves the original snapshot untouched',()=>{
  const input=copy(source),before=copy(input);
  consolidateData(input);
  assert.deepEqual(input,before);
});
test('orphan history stops consolidation instead of dropping data',()=>{
  const broken=copy(source);broken.external_payment_confirmations[0].header.salesOrderId=new mongoose.Types.ObjectId();
  assert.throws(()=>consolidateData(broken),/Cannot unambiguously embed/);
});
test('missing carton quantity is detected after removing stacks',async()=>{
  const broken=copy(current);broken.inventory_balances.find(b=>b.packagingPortions.length).packagingPortions=[];
  await assert.rejects(validateReviewedDemo(broken,models),/Packaging quantity/);
});
test('duplicate warehouse threshold on the same product is rejected',async()=>{
  const product=copy(data.products.find(p=>p.stockThresholds.length));
  product.stockThresholds.push({...product.stockThresholds[0],_id:new mongoose.Types.ObjectId()});
  await assert.rejects(new (models.get('products'))(product).validate(),/Duplicate embedded key/);
});
test('an embedded movement must belong to its transaction and line numbers remain unique',async()=>{
  const tx=copy(data.stock_transactions.find(row=>row.movements.length));
  tx.movements[0].transactionId=new mongoose.Types.ObjectId();
  await assert.rejects(new (models.get('stock_transactions'))(tx).validate(),/another transaction/);
  tx.movements[0].transactionId=tx._id;
  tx.movements.push({...tx.movements[0],_id:new mongoose.Types.ObjectId()});
  await assert.rejects(new (models.get('stock_transactions'))(tx).validate(),/Duplicate embedded key/);
});
test('embedded confirmation cannot be moved to another sales order',async()=>{
  const so=copy(data.sales_orders.find(row=>row.deliveryConfirmations.length));
  so.deliveryConfirmations[0].header.salesOrderId=new mongoose.Types.ObjectId();
  await assert.rejects(new (models.get('sales_orders'))(so).validate(),/another sales order/);
});
test('embedded holds and both kinds of resolution plans retain their parent',async()=>{
  const defect=copy(data.defect_reports.find(row=>row.holds.length));
  defect.holds[0].defectReportLineId=new mongoose.Types.ObjectId();
  await assert.rejects(new (models.get('defect_reports'))(defect).validate(),/another defect report/);
  const plan=copy(data.defect_reports.find(row=>row.resolutionPlans.length));
  plan.resolutionPlans[0].items[0].details.defectLineId=new mongoose.Types.ObjectId();
  await assert.rejects(new (models.get('defect_reports'))(plan).validate(),/another defect report/);
  const count=copy(data.stocktakes.find(row=>row.resolutionPlans.length));
  count.resolutionPlans[0].header.stocktakeId=new mongoose.Types.ObjectId();
  await assert.rejects(new (models.get('stocktakes'))(count).validate(),/another stocktake/);
});
test('reprocessing consolidated data neither duplicates histories nor changes quantities',()=>{
  assert.deepEqual(consolidateData(data),data);
});
test('cleanup removes catalogue and nested counters without dropping stock or security versions',()=>{
  for(const name of ['products','warehouses','customers','suppliers']) {
    assert.ok(!models.get(name).schema.path('version'));
    assert.ok(data[name].every(row=>!Object.hasOwn(row,'version')));
  }
  for(const name of ['users','roles','inventory_balances','sales_orders','stock_reservations','warehouse_locations']) assert.ok(models.get(name).schema.path('version'));
  assert.ok(data.products.flatMap(row=>row.stockThresholds).every(row=>!Object.hasOwn(row,'productId')&&!Object.hasOwn(row,'version')));
  assert.ok(data.external_references.flatMap(row=>row.items).every(row=>!Object.hasOwn(row,'referenceId')));
  assert.ok(data.inventory_balances.flatMap(row=>row.packagingPortions).every(row=>!Object.hasOwn(row,'balanceId')&&!Object.hasOwn(row,'version')));
});
test('duplicate revision can be removed only when it agrees with the canonical version',()=>{
  const input=copy(source),so=input.sales_orders[0];so.revision=so.version;
  const cleaned=consolidateData(input);
  assert.ok(!Object.hasOwn(cleaned.sales_orders[0],'revision'));
  so.revision=so.version+1;
  assert.throws(()=>consolidateData(input),/Divergent document version/);
});
test('products have exact dimensions and mandatory color; SKU identity permits separate colors',async()=>{
  const Product=models.get('products');
  const white={sku:'G60',manufacturerCode:'AP',name:'Gạch trắng',categoryId:data.categories[0]._id,baseUnit:'Viên',lengthMm:'600',widthMm:'600',heightMm:'9.5',color:'Trắng'};
  const a=new Product(white),b=new Product({...white,color:'Xám'});
  await a.validate();await b.validate();assert.notEqual(String(a._id),String(b._id));
  assert.ok(Product.schema.indexes().some(([key,settings])=>key.manufacturerCode&&key.sku&&key.color&&settings.unique));
  assert.ok(!Product.schema.path('nominalSize'));
  await assert.rejects(new Product({...white,heightMm:'0'}).validate());
  await assert.rejects(new Product({...white,color:''}).validate());
});
test('batch has fixed pieces and measured outer carton dimensions, without calibre or tone',async()=>{
  const Batch=models.get('product_batches'),row=copy(data.product_batches[0]);
  await new Batch(row).validate();assert.ok(!Batch.schema.path('calibre'));assert.ok(!Batch.schema.path('tone'));
  assert.ok(Batch.schema.indexes().some(([key,settings])=>Object.keys(key).length===2&&key.productId&&key.manufacturerLot&&settings.unique));
  await assert.rejects(new Batch({...row,piecesPerCarton:4.5}).validate());
  await assert.rejects(new Batch({...row,cartonLengthMm:0}).validate());
  await new Batch({...row,cartonLengthMm:'620.5'}).validate();
  const balance=copy(data.inventory_balances.find(b=>b.packagingPortions.some(p=>p.packagingState==='SEALED')));
  balance.packagingPortions.find(p=>p.packagingState==='SEALED').packagingSnapshot.outerLengthMm='620.5';
  await new (models.get('inventory_balances'))(balance).validate();
});
test('same lot cannot use a different number of pieces per carton',()=>{
  const row=data.product_batches[0],p={baseUnitsPerPackage:row.piecesPerCarton,outerLengthMm:row.cartonLengthMm,outerWidthMm:row.cartonWidthMm,outerHeightMm:row.cartonHeightMm};
  assert.doesNotThrow(()=>assertBatchPackaging(row,p));
  assert.throws(()=>assertBatchPackaging(row,{...p,baseUnitsPerPackage:row.piecesPerCarton+1}),/fixed batch/);
});
test('a carton can have small volume but still be too long for a bin',()=>{
  const result=estimateCartonCapacity({usableLengthMm:100,usableWidthMm:100},{clearHeightMm:100},{cartonLengthMm:110,cartonWidthMm:10,cartonHeightMm:10});
  assert.equal(result.fits,false);assert.equal(result.additionalCartonsUpperBound,'0');
});
test('empty-bin grid allows horizontal rotation and remaining-volume estimate is bounded',()=>{
  const bin={usableLengthMm:1000,usableWidthMm:600},warehouse={clearHeightMm:500},batch={cartonLengthMm:600,cartonWidthMm:300,cartonHeightMm:100};
  assert.equal(estimateCartonCapacity(bin,warehouse,batch).cartonsInEmptyBinByGrid,'15');
  assert.equal(estimateCartonCapacity(bin,warehouse,batch,'180000000').additionalCartonsUpperBound,'6');
});
