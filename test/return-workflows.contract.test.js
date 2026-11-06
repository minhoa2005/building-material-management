import test from 'node:test';
import assert from 'node:assert/strict';
import * as v from '../src/modules/return-workflows/native.validation.js';
import { eligibility } from '../src/modules/return-workflows/native.service.js';
import { heldOnBalance } from '../src/shared/utils/stock.js';
const id='a'.repeat(24),base={expectedVersion:1,idempotencyKey:'operation-test-000001',note:'Verified actual facts'};
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
