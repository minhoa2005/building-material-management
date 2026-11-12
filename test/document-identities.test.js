import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as m from '../src/models/runtime.js';
import { databaseId, isDocumentId } from '../src/models/document-identity.js';
import { documentIdentifier } from '../src/shared/utils/document-id.validation.js';
import { createBody as locationCreate } from '../src/modules/location-movements/location-movement.validation.js';
const coded = 'ĐBH-K-GACH-01-261112-000001';
const legacyCode = 'ĐBH - K-GACH-01 - 261112 - 000001';
test('document models and references accept immutable codes while catalogue and item IDs remain ObjectIds',()=>{
 assert.equal(m.models.size,58);assert.equal(m.models.has('document_sequences'),false);
 for(const Model of m.models.values())if(Model.schema.path('documentNo'))assert.equal(Model.schema.path('_id').instance,'DocumentIdentity',Model.modelName);
 assert.equal(m.SalesOrder.schema.path('header.customerId').instance,'ObjectId');
 assert.equal(m.SalesOrder.schema.path('items._id').instance,'ObjectId');
 for(const [Model,path]of [[m.WarehouseIssueRequest,'header.salesOrderId'],[m.StockReservation,'demandRef.documentId'],[m.StockTransaction,'sourceId'],[m.OperationRecord,'subjectId'],[m.Attachment,'ownerDocumentId'],[m.PurchaseOrder,'replenishmentRequestId']])assert.equal(Model.schema.path(path).instance,'DocumentIdentity',path);
 const request=new m.WarehouseIssueRequest({documentNo:'YCX-K01-261112-000001',header:{salesOrderId:coded}});
 assert.equal(request._id,request.documentNo);assert.equal(request.header.salesOrderId,coded);
 const query=m.StockReservation.find({'demandRef.documentId':coded});query.cast();assert.equal(query.getFilter()['demandRef.documentId'],coded);
});
test('document lookups preserve compact codes, spaced codes and historical ObjectIds',()=>{
 const old=new mongoose.Types.ObjectId();assert.equal(String(databaseId(String(old))),String(old));
 for (const code of [coded, legacyCode]) {
   assert.equal(isDocumentId(code), true);
   assert.equal(databaseId(code), code);
   assert.equal(documentIdentifier.parse(code), code);
 }
 const query = m.SalesOrder.find({_id: {$in: [String(old), coded, legacyCode]}});
 query.cast();
 assert.deepEqual(query.getFilter()._id.$in, [old, coded, legacyCode]);
 for(const value of ['$where','../bad','ĐBH - KD - yesterday - 1','ĐBH-KD-261112 - 000001',{},23])assert.equal(documentIdentifier.safeParse(value).success,false);
 assert.equal(locationCreate.safeParse({idempotencyKey:'key',warehouseId:coded,reason:'X',lines:[]}).success,false);
});
test('the new code is the document identity, not an editable display alias',async()=>{
 const order=new m.SalesOrder({_id:coded,documentNo:'ĐBH-K-GACH-01-261112-000002'});
 await assert.rejects(order.validate(),error=>!!error.errors.documentNo);
});
