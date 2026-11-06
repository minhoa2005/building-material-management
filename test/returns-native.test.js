import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { SupplierReturn } from '../src/models/runtime.js';
const id = () => new mongoose.Types.ObjectId();
test('native supplier proposal exists before a verified agreement', async () => {
 const source=id();
 const doc=new SupplierReturn({documentNo:'SR-PROPOSAL',workflowStatus:'AGREEMENT_PENDING',version:1,createdBy:id(),header:{warehouseId:id(),supplierId:id()},items:[{lineNo:1,lineKind:'SUPPLIER_RETURN',productId:id(),lotId:id(),enteredUnit:'PIECE',baseUnitSnapshot:'PIECE',baseUnitsPerUnit:'1',enteredQty:'2',qtyBase:'2',productNameSnapshot:'Tile',details:{phase:'PROPOSED',originLineId:source,sourceBalanceId:id(),ownerType:'STORE'}}]});
 await doc.validate();
 assert.equal(doc.items[0].details.agreementVerifiedBy,undefined);
});
