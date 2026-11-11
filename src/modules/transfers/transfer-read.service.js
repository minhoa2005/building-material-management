import { WarehouseTransferRequest, TransferDispatch, TransferReceipt, InternalTransferRequirement, TransferOrder, ApprovalHistory, SalesOrder, WarehouseIssueRequest, SupplyAllocation, Warehouse, WarehouseLocation, StockHoldingPoint, InventoryBalance, ProductBatch, Product } from '../../models/runtime.js';
import { requirePermission, requireWarehouseAccess, isOwner } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { dto, page } from '../../shared/utils/persistence.js';
import { notFoundError } from '../../shared/utils/ApiError.js';
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
  requirePermission(user,'stock_transfer:read');const filter=await scope(user),and=[];
  if(query.sourceWarehouseId)and.push({'header.sourceWarehouseId':query.sourceWarehouseId});
  if(query.destinationWarehouseId)and.push({'header.destinationWarehouseId':query.destinationWarehouseId});
  if(query.status)filter.workflowStatus=query.status;
  if(query.from||query.to)filter.createdAt={...(query.from&&{$gte:new Date(query.from)}),...(query.to&&{$lte:new Date(query.to)})};
  if(and.length)filter.$and=and;
  return page(WarehouseTransferRequest,filter,query);
}
export async function getTransfer(user,id){
  requirePermission(user,'stock_transfer:read');
  const request=await WarehouseTransferRequest.findOne({$and:[await scope(user),{_id:id}]}).lean();if(!request)throw notFoundError();
  const dispatches=await TransferDispatch.find({'header.requestId':id}).lean();
  const receipts=await TransferReceipt.find({'header.dispatchId':{$in:dispatches.map(row=>row._id)}}).lean();
  if(currentRole(user)?.code==='SALES')return {...dto(request),dispatches:dispatches.map(row=>({id:String(row._id),workflowStatus:row.workflowStatus})),receipts:receipts.map(row=>({id:String(row._id),workflowStatus:row.workflowStatus}))};
  const requirements=await InternalTransferRequirement.find({'header.sourceDocumentId':{$in:[...dispatches,...receipts].map(row=>row._id)}}).lean();
  const tasks=await TransferOrder.find({'header.requirementId':{$in:requirements.map(row=>row._id)}}).lean();
  const approvals=await ApprovalHistory.find({subjectType:'warehouse_transfer_requests',subjectId:id}).lean();
  return {...dto(request),dispatches:dispatches.map(dto),receipts:receipts.map(dto),internalRequirements:requirements.map(dto),tasks:tasks.map(dto),approvals:approvals.map(dto)};
}

// This is a selection aid only. Every BF04 write command rechecks the active
// warehouse, lot, balance, quality and source quantities inside its transaction.
export async function transferOptions(user, warehouseId) {
  requirePermission(user,'stock_transfer:read');
  const warehouses=await Warehouse.find({isActive:true}).lean();
  // Destination catalogue is store-wide; operational data stays warehouse-scoped.
  const sourceWarehouseIds=warehouses.filter(row=>isOwner(user)||(user.warehouseIds||[]).some(id=>String(id)===String(row._id))).map(row=>String(row._id));
  if(!warehouseId)return {warehouses:warehouses.map(dto),sourceWarehouseIds,locations:[],holdingPoints:[],balances:[],batches:[],products:[]};
  requireWarehouseAccess(user,warehouseId);
  const locations=await WarehouseLocation.find({warehouseId,isActive:true}).lean();
  const holdingPoints=await StockHoldingPoint.find({locationId:{$in:locations.map(row=>row._id)}}).lean();
  const balances=await InventoryBalance.find({holdingPointId:{$in:holdingPoints.map(row=>row._id)},quantityBase:{$gt:0}}).lean();
  const batches=await ProductBatch.find({_id:{$in:balances.map(row=>row.batchId)},identificationStatus:'VERIFIED'}).lean();
  const products=await Product.find({isActive:true}).lean();
  return {warehouses:warehouses.map(dto),sourceWarehouseIds,locations:locations.map(dto),holdingPoints:holdingPoints.map(dto),balances:balances.map(dto),batches:batches.map(dto),products:products.map(dto)};
}
