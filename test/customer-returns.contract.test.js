import test from 'node:test';
import assert from 'node:assert/strict';
import { customerCreateSchema, inspectionSchema, defectCreateSchema } from '../src/modules/return-workflows/native.validation.js';
const id='a'.repeat(24),idempotencyKey='operation-test-000001';
test('customer claims require exactly one delivered source and unique lines',()=>{
 const body={idempotencyKey,warehouseId:id,customerId:id,lines:[{salesIssueLineId:id,qtyBase:'4',reason:'Unused'}]};assert.ok(customerCreateSchema.safeParse({body}).success);
 assert.equal(customerCreateSchema.safeParse({body:{...body,lines:[...body.lines,...body.lines]}}).success,false);
 assert.equal(customerCreateSchema.safeParse({body:{...body,lines:[{...body.lines[0],historicalExternalLineId:id}]}}).success,false);
});
test('zero physical arrival remains distinct from missing inspection and freeze blocks ordinary proposals',()=>{
 assert.ok(inspectionSchema.safeParse({params:{id},body:{idempotencyKey,expectedVersion:1,note:'No actual arrival',custodyLocationId:id,evidenceIds:[id],lines:[{returnLineId:id,qtyReceived:'0',packagingCondition:'UNKNOWN',installationStatus:'UNKNOWN',damageCause:'UNKNOWN',deadlineStatus:'UNKNOWN',assessmentReason:'No item returned'}]}}).success);
 const body={idempotencyKey,warehouseId:id,balanceId:id,quantity:'4',sourceKind:'STOCKTAKE',stocktakeId:id,reason:'Cracks'};assert.ok(defectCreateSchema.safeParse({body}).success);assert.equal(defectCreateSchema.safeParse({body:{...body,disposition:{outcome:'SCRAP',quantity:'4',reason:'Unsafe'}}}).success,false);
});
