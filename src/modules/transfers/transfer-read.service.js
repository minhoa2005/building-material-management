import { databaseId } from '../../models/document-identity.js';
import { effectiveQuantities } from '../sales-orders/sales-read.service.js';
import { exact } from '../../models/model-utils.js';
import { freeQuantity } from '../../shared/utils/stock.js';
import mongoose from 'mongoose';
import { movementList } from '../../shared/utils/movement-list.js';
import { WarehouseTransferRequest, TransferDispatch, TransferReceipt, InternalTransferRequirement, TransferOrder, ApprovalHistory, SalesOrder, WarehouseIssueRequest, SupplyAllocation, Warehouse, WarehouseLocation, StockHoldingPoint, InventoryBalance, ProductBatch, Product, Uom, StockDiscrepancy } from '../../models/runtime.js';
import { requirePermission, requireWarehouseAccess, isOwner } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { dto } from '../../shared/utils/persistence.js';
import { notFoundError } from '../../shared/utils/ApiError.js';
async function transferWarehouseDisplay(documents) {
  const warehouses=await Warehouse.find({_id:{$in:documents.flatMap(d=>[d.header.sourceWarehouseId,d.header.destinationWarehouseId])}}).select('_id code name').lean();
  const ref=id=>{const w=warehouses.find(w=>String(w._id)===String(id));return w?{id:String(w._id),code:w.code,name:w.name}:null;};
  return documents.map(d=>({...d,sourceWarehouse:ref(d.header.sourceWarehouseId),destinationWarehouse:ref(d.header.destinationWarehouseId)}));
}
async function scope(user) {
  const role=currentRole(user)?.code;
  if(isOwner(user)||role==='ACCOUNTANT')return {};
  if(role==='SALES'){
    const orders=await SalesOrder.find({createdBy:user._id}).distinct('_id');
    const requests=await WarehouseIssueRequest.find({'header.salesOrderId':{$in:orders}}).distinct('_id');
    const ids=await SupplyAllocation.find({'demandRef.documentId':{$in:[...orders,...requests]},'sourceRef.documentType':'warehouse_transfer_requests'}).distinct('sourceRef.documentId');
    return {_id:{$in:ids}};
  }
  return {$or:[{'header.sourceWarehouseId':{$in:user.warehouseIds||[]}},{'header.destinationWarehouseId':{$in:user.warehouseIds||[]}}]};
}
export async function listTransfers(user,query){
  requirePermission(user,'stock_transfer:read');
  const castQuery = { ...query };
  for (const field of ['sourceWarehouseId', 'destinationWarehouseId']) if (query[field]) castQuery[field] = databaseId(query[field]);
  const result = await movementList(WarehouseTransferRequest, await scope(user), castQuery, ['header.sourceWarehouseId', 'header.destinationWarehouseId'], 'COMPLETED');
  return { ...result, items: await transferWarehouseDisplay(result.items) };
}
export async function getTransfer(user,id){
  requirePermission(user,'stock_transfer:read');
  const request=await WarehouseTransferRequest.findOne({$and:[await scope(user),{_id:id}]}).lean();if(!request)throw notFoundError();
  const [display]=await transferWarehouseDisplay([dto(request)]);
  const dispatches=await TransferDispatch.find({'header.requestId':id}).lean();
  const receipts=await TransferReceipt.find({'header.dispatchId':{$in:dispatches.map(row=>row._id)}}).lean();
  if(currentRole(user)?.code==='SALES')return {...display,dispatches:dispatches.map(row=>({id:String(row._id),workflowStatus:row.workflowStatus})),receipts:receipts.map(row=>({id:String(row._id),workflowStatus:row.workflowStatus}))};
  const requirements=await InternalTransferRequirement.find({'header.sourceDocumentId':{$in:[...dispatches,...receipts].map(row=>row._id)}}).lean();
  const tasks=await TransferOrder.find({'header.requirementId':{$in:requirements.map(row=>row._id)}}).lean();
  const approvals=await ApprovalHistory.find({subjectType:'warehouse_transfer_requests',subjectId:id}).lean();
  const differences=await StockDiscrepancy.find({'header.sourceRef.documentId':{$in:dispatches.map(d=>d._id)}}).lean();
  const points=await StockHoldingPoint.find({dispatchLineId:{$in:dispatches.flatMap(d=>d.items.map(i=>i._id))}}).lean();
  const transitBalances=await InventoryBalance.find({holdingPointId:{$in:points.map(p=>p._id)}}).lean();
  const progress=dispatches.map(d=>({dispatchId:String(d._id),lines:d.items.map(item=>{const point=points.find(p=>String(p.dispatchLineId)===String(item._id));const remaining=transitBalances.filter(b=>String(b.holdingPointId)===String(point?._id)).reduce((n,b)=>n.plus(String(b.quantityBase)),exact('0'));return {lineId:String(item._id),dispatchedQtyBase:String(item.qtyBase),remainingQtyBase:remaining.toFixed(),receivedQtyBase:d.workflowStatus==='POSTED'?exact(item.qtyBase).minus(remaining).toFixed():'0'};})}));
  const effective=await effectiveQuantities(receipts.filter(r=>r.workflowStatus==='POSTED'));
  const lineProgress=request.items.map(item=>{const sent=dispatches.filter(d=>d.workflowStatus==='POSTED').flatMap(d=>d.items).filter(i=>String(i.details.requestLineId)===String(item._id));const sentIds=sent.map(i=>String(i._id));const received=receipts.filter(r=>r.workflowStatus==='POSTED').flatMap(r=>r.items).filter(i=>sentIds.includes(String(i.details.dispatchLineId)));const sum=rows=>rows.reduce((n,i)=>n.plus(effective.get(String(i._id))??String(i.qtyBase)),exact('0')).toFixed();return {lineId:String(item._id),dispatchedQtyBase:sent.reduce((n,i)=>n.plus(String(i.qtyBase)),exact('0')).toFixed(),receivedGoodQtyBase:sum(received.filter(i=>i.details.qualityCode==='GOOD')),receivedDamagedQtyBase:sum(received.filter(i=>i.details.qualityCode==='DAMAGED')),transitQtyBase:progress.flatMap(p=>p.lines).filter(l=>sentIds.includes(l.lineId)).reduce((n,l)=>n.plus(l.remainingQtyBase),exact('0')).toFixed(),unresolvedQtyBase:differences.filter(d=>d.workflowStatus!=='RESOLVED').flatMap(d=>d.items).filter(i=>sentIds.includes(String(i.details.sourceLineId))).reduce((n,i)=>n.plus(String(i.qtyBase)),exact('0')).toFixed()};});
  return {...display,lineProgress,differences:differences.map(dto),progress,dispatches:dispatches.map(dto),receipts:receipts.map(dto),internalRequirements:requirements.map(dto),tasks:tasks.map(dto),approvals:approvals.map(dto)};
}

// This is a selection aid only. Every BF04 write command rechecks the active
// warehouse, lot, balance, quality and source quantities inside its transaction.
export async function transferOptions(user, warehouseId) {
  requirePermission(user,'stock_transfer:read');
  const warehouses=await Warehouse.find({isActive:true}).lean();
  // Destination catalogue is store-wide; operational data stays warehouse-scoped.
  if(currentRole(user)?.code==='SALES')return {warehouses:warehouses.map(dto),sourceWarehouseIds:[],locations:[],holdingPoints:[],balances:[],batches:[],products:[]};
  const sourceWarehouseIds=warehouses.filter(row=>isOwner(user)||(user.warehouseIds||[]).some(id=>String(id)===String(row._id))).map(row=>String(row._id));
  if(!warehouseId)return {warehouses:warehouses.map(dto),sourceWarehouseIds,locations:[],holdingPoints:[],balances:[],batches:[],products:[]};
  requireWarehouseAccess(user,warehouseId);
  const locations=await WarehouseLocation.find({warehouseId,isActive:true}).lean();
  const holdingPoints=await StockHoldingPoint.find({locationId:{$in:locations.map(row=>row._id)}}).lean();
  const balances=await InventoryBalance.find({holdingPointId:{$in:holdingPoints.map(row=>row._id)},quantityBase:{$gt:0}}).lean();
  const batches=await ProductBatch.find({_id:{$in:balances.map(row=>row.batchId)},identificationStatus:'VERIFIED'}).lean();
  const products=await Product.find({isActive:true}).lean();
  const units=await Uom.find({isActive:true}).select('code name isCarton').lean();
  return {warehouses:warehouses.map(dto),sourceWarehouseIds,locations:locations.map(dto),holdingPoints:holdingPoints.map(dto),balances:await Promise.all(balances.map(async b=>({...dto(b),availableQtyBase:(await freeQuantity(b)).toFixed()}))),batches:batches.map(dto),products:products.map(dto),units:units.map(dto)};
}
