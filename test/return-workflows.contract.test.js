import test from 'node:test';
import assert from 'node:assert/strict';
import * as v from '../src/modules/return-workflows/native.validation.js';
import { eligibility } from '../src/modules/return-workflows/native.service.js';
import { heldOnBalance } from '../src/shared/utils/stock.js';
import { createCustomerReturnHeaderSchema } from '../src/models/customer-return-header.schema.js';
const id='a'.repeat(24),base={expectedVersion:1,idempotencyKey:'operation-test-000001',note:'Verified actual facts'};
test('a customer return accepts an optional plain-text order reference without replacing its stock source',()=>{
 const body={idempotencyKey:base.idempotencyKey,warehouseId:id,lines:[{salesIssueLineId:id,qtyBase:'2',reason:base.note}]};
 assert.equal(v.customerCreateSchema.parse({body}).body.salesOrderReference,undefined);
 assert.equal(v.customerCreateSchema.parse({body:{...body,salesOrderReference:'  EXT-SO-019  '}}).body.salesOrderReference,'EXT-SO-019');
 assert.equal(v.customerCreateSchema.safeParse({body:{...body,salesOrderReference:'X'.repeat(101)}}).success,false);
 assert.equal(v.customerCreateSchema.safeParse({body:{...body,salesOrderReference:'EXT-SO-019',lines:[{qtyBase:'2',reason:base.note}]}}).success,false);
 assert.equal(createCustomerReturnHeaderSchema().path('salesOrderReference').instance,'String');
});
test('customer returns can select a purchase request and scope the source lookup to it',()=>{
 const salesOrderId='ĐBH-KD-261126-000001';
 const query={kind:'sources',purpose:'customer-returns',warehouseId:id,salesOrderId};
 assert.ok(v.lookupSchema.safeParse({query}).success);
 assert.ok(v.lookupSchema.safeParse({query:{kind:'return-orders',warehouseId:id}}).success);
 const independent={kind:'sources',purpose:'customer-returns',warehouseId:id,withoutSalesOrder:'true'};
 assert.ok(v.lookupSchema.safeParse({query:independent}).success);
 assert.equal(v.lookupSchema.safeParse({query:{...independent,salesOrderId}}).success,false);
 assert.equal(v.lookupSchema.safeParse({query:{...independent,purpose:'supplier-returns'}}).success,false);
 assert.equal(v.lookupSchema.safeParse({query:{...query,purpose:'supplier-returns'}}).success,false);
 assert.ok(v.customerCreateSchema.safeParse({body:{idempotencyKey:base.idempotencyKey,warehouseId:id,salesOrderId,lines:[{salesIssueLineId:id,qtyBase:'1',reason:'Return'}]}}).success);
});
test('customer request parts and defect outcomes can share a source while supplier proposals stay unique',()=>{
 const part={salesIssueLineId:id,qtyBase:'2',reason:'Inspect separately'};
 assert.equal(v.customerCreateSchema.safeParse({body:{idempotencyKey:base.idempotencyKey,warehouseId:id,lines:[part,part]}}).success,true);
 assert.equal(v.proposalSchema.safeParse({params:{id},body:{...base,evidenceIds:[id],lines:[{lineId:id,qtyBase:'2',outcome:'SCRAP'},{lineId:id,qtyBase:'2',outcome:'RELEASE',targetQuality:'GOOD'}]}}).success,true);
});
test('an inspection canonicalizes an exact decimal zero and accepts no packaging portions',()=>{
 const command={params:{id},body:{...base,evidenceIds:[id],lines:[{returnLineId:id,qtyReceived:'0.0',packagingCondition:'OPENED',installationStatus:'UNKNOWN',damageCause:'UNKNOWN',deadlineStatus:'UNKNOWN',assessmentReason:'No arrival'}]}};
 assert.equal(v.inspectionSchema.parse(command).body.lines[0].qtyReceived,'0');
});
test('native commands reject numeric/negative/duplicate quantities and evidence-free posting',()=>{
 const body={idempotencyKey:base.idempotencyKey,warehouseId:id,supplierId:id,note:base.note,lines:[{originLineId:id,balanceId:id,qtyBase:'4'}]};
 assert.ok(v.supplierCreateSchema.safeParse({body}).success);
 assert.equal(v.supplierCreateSchema.safeParse({body:{...body,lines:[...body.lines,...body.lines]}}).success,false);
 assert.equal(v.supplierCreateSchema.safeParse({body:{...body,lines:[{...body.lines[0],qtyBase:4}]}}).success,false);
 assert.equal(v.receiptSchema.safeParse({params:{id},body:{...base,evidenceIds:[],lines:[{lineId:id,qtyBase:'4',locationId:id,qualityCode:'GOOD'}]}}).success,false);
 assert.ok(v.agreementSchema.safeParse({params:{id},body:{...base,evidenceIds:[id],reference:'Refused line',lines:[{lineId:id,qtyBase:'0'}]}}).success);
});
test('return eligibility never treats unknown terms or installed/customer-damaged goods as eligible',()=>{
 const facts={installationStatus:'UNUSED',damageCause:'NONE',deadlineStatus:'WITHIN',deadlineReference:'Actual agreement'};
 assert.equal(eligibility(facts),'CASE_REVIEW');assert.equal(eligibility({...facts,deadlineReference:''}),'PENDING');assert.equal(eligibility({...facts,damageCause:'UNKNOWN'}),'PENDING');
 for(const changes of [{installationStatus:'INSTALLED'},{damageCause:'CUSTOMER'},{deadlineStatus:'EXCEEDED'}])assert.equal(eligibility({...facts,...changes}),'INELIGIBLE');
});
test('quantity holds leave the unaffected stock available and retain partial-resolution history',()=>{
 const holds=[{_id:'hold',status:'ACTIVE',allocations:[{balanceId:id,quantityBase:'10'}],events:[{kind:'CONSUMED',quantityBase:'4'}]}];
 assert.equal(heldOnBalance([{holds}],id).toFixed(),'6');assert.equal(heldOnBalance([{holds}],id,'hold').toFixed(),'0');assert.equal(heldOnBalance([{holds:[{...holds[0],status:'RESOLVED'}]}],id).toFixed(),'0');
});

test('historical delivery records customer text without a customer catalogue reference',()=>{
 const body={idempotencyKey:base.idempotencyKey,sourceSystem:'PAPER',referenceNo:'OLD-01',referenceDate:'2026-11-01T00:00:00Z',correlationId:'historic-source',customerName:'Nguyễn Văn An',warehouseId:id,note:'Verified source',lines:[{productId:id,lotId:id,qtyBase:'4',enteredUnit:'PIECE',baseUnitsPerUnit:'1'}]};
 assert.equal(v.historicalSchema.safeParse({body}).success,true);
 assert.equal(v.historicalSchema.safeParse({body:{...body,customerName:''}}).success,false);
 assert.equal(v.historicalSchema.safeParse({body:{...body,customerId:id}}).success,false);
});
