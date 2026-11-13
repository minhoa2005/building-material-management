import { nextDocumentFields } from '../../shared/utils/document-number.js';
import { WarehouseTransferRequest as Request, TransferDispatch as Dispatch, TransferReceipt as Receipt,
  InternalTransferRequirement as Requirement, TransferOrder as Task, Warehouse, ApprovalHistory,
  StockHoldingPoint, InventoryBalance, StockReservation, StockDiscrepancy, DefectReport } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { requirePermission, requireWarehouseAccess, canAccessWarehouse } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { validationError, forbiddenError, notFoundError } from '../../shared/utils/ApiError.js';
import { command, checkVersion, saveVersion, newId, same, hash } from '../../shared/utils/document-command.js';
import { makeItem } from '../../shared/utils/document-items.js';
import { copyItem, sourceLink } from '../../shared/utils/document-copy.js';
import { sourceContext, locationAt, guardLocations, freeQuantity, beginStock, balanceAt, moveStock, verifyCapacity, remainingReservation } from '../../shared/utils/stock.js';

async function find(Model,id,session) { const row=await Model.findById(id).session(session); if(!row)throw notFoundError(); return row; }
async function requestReplay(id,user,session) {
  const request=await find(Request,id,session);
  if(!canAccessWarehouse(user,request.header.sourceWarehouseId)&&!canAccessWarehouse(user,request.header.destinationWarehouseId))throw forbiddenError();
  return request;
}
async function dispatchReplay(id,user,session) {
  const dispatch=await find(Dispatch,id,session),request=await find(Request,dispatch.header.requestId,session);
  requireWarehouseAccess(user,request.header.sourceWarehouseId);return dispatch;
}
async function receiptReplay(id,user,session) {
  const receipt=await find(Receipt,id,session);
  requireWarehouseAccess(user,receipt.header.warehouseId);return receipt;
}
async function taskReplay(id,user,session) {
  const task=await find(Task,id,session);
  requireWarehouseAccess(user,task.header.warehouseId);
  requirePermission(user,task.header.taskKind==='PICK'?'stock_transfer:dispatch':'stock_transfer:receive');
  return task;
}
const document=async(Model,prefix,user,header,session,items=[],status='OPEN')=>new Model({...await nextDocumentFields(Model,prefix,header.warehouseId||header.sourceWarehouseId,session),workflowStatus:status,version:1,createdBy:user._id,header,items});
export function createRequest(user,input) {
  return command(user,'CREATE_TRANSFER_REQUEST','stock_transfer:create',null,input,requestReplay,async(session,actor)=>{
    requireWarehouseAccess(actor,input.sourceWarehouseId);
    if(same(input.sourceWarehouseId,input.destinationWarehouseId)||await Warehouse.countDocuments({_id:{$in:[input.sourceWarehouseId,input.destinationWarehouseId]},isActive:true}).session(session)!==2)throw validationError('Chọn hai kho hoạt động khác nhau');
    const items=[];for(const [i,row]of input.lines.entries())items.push(await makeItem(row,i+1,session));
    const request=await document(Request,'TR',actor,{sourceWarehouseId:input.sourceWarehouseId,destinationWarehouseId:input.destinationWarehouseId,neededOn:input.neededOn,reason:input.reason,requestedBy:actor._id,requestedAt:new Date()},session,items,'PENDING_APPROVAL');
    await request.save({session});return{document:request};
  });
}
export function reviewRequest(user,id,input) {
  return command(user,'REVIEW_TRANSFER_REQUEST','stock_transfer:approve',id,input,requestReplay,async(session,actor)=>{
    const request=await requestReplay(id,actor,session);checkVersion(request,input.expectedVersion);
    if(request.workflowStatus!=='PENDING_APPROVAL'||same(request.createdBy,actor._id))throw validationError('Không thể duyệt yêu cầu hoặc tự duyệt');
    const approval=await new ApprovalHistory({decisionKey:hash({id,version:request.version,key:input.idempotencyKey}),
      subjectType:'warehouse_transfer_requests',subjectId:request._id,subjectRevision:request.version,decisionScope:'TRANSFER',
      reviewedContent:request.toObject(),decision:input.decision,reason:input.reason,requestedBy:request.createdBy,decidedBy:actor._id,decidedAt:new Date(),recordedAt:new Date(),
      authoritySnapshot:{roleCode:currentRole(actor).code,permissionCode:'stock_transfer:approve',warehouseIds:actor.warehouseIds},
      itemDecisions:request.items.map(item=>({itemId:item._id,approvedQtyBase:input.decision==='APPROVE'?item.qtyBase:'0',outcome:input.decision}))}).save({session});
    for(const item of request.items)item.approvedQtyBase=input.decision==='APPROVE'?item.qtyBase:'0';
    request.workflowStatus=input.decision==='APPROVE'?'APPROVED':input.decision==='REVISE'?'REVISION_REQUIRED':'REJECTED';request.header.approvedRevision=request.version;
    request.header.approvedVersion=request.version+1;request.header.reviewedBy=actor._id;request.header.reviewedAt=new Date();
    request.header.approvalStatus=request.workflowStatus;if(input.decision==='REJECT')request.header.rejectionReason=input.reason;
    return{document:await saveVersion(request,input.expectedVersion,session),versionBefore:input.expectedVersion,decisionId:approval._id};
  });
}
export function createDispatch(user,id,input) {
  return command(user,'CREATE_TRANSFER_DISPATCH','stock_transfer:dispatch',id,input,dispatchReplay,async(session,actor)=>{
    const request=await find(Request,id,session);requireWarehouseAccess(actor,request.header.sourceWarehouseId);checkVersion(request,input.expectedVersion);
    if(request.workflowStatus!=='APPROVED')throw validationError('Yêu cầu chưa được duyệt hoặc đã đóng');
    const existing=await Dispatch.find({'header.requestId':id,workflowStatus:{$ne:'CANCELLED'}}).session(session);
    const totals=new Map();for(const item of existing.flatMap(row=>row.items)){const key=String(item.details.requestLineId);totals.set(key,(totals.get(key)??exact('0')).plus(String(item.qtyBase)));}
    const outbound=await document(Dispatch,'TD',actor,{requestId:request._id,dispatchedBy:actor._id,dispatchedAt:new Date(),approvedRevision:request.header.approvedRevision,sourceWarehouseId:request.header.sourceWarehouseId,destinationWarehouseId:request.header.destinationWarehouseId},session,[],'DRAFT');
    for(const [i,row]of input.lines.entries()){
      const origin=request.items.id(row.requestLineId);if(!origin)throw validationError('Dòng không thuộc TR');
      const ctx=await sourceContext(row.sourceBalanceId,session);
      if((origin.lotId&&!same(origin.lotId,ctx.batch._id))||!ctx.product.isActive||ctx.batch.identificationStatus!=='VERIFIED'||ctx.balance.ownerType!=='STORE'||ctx.balance.qualityStatus!=='GOOD'||!same(ctx.product._id,origin.productId)||ctx.location?.locationType!=='STORAGE'||!same(ctx.location.warehouseId,request.header.sourceWarehouseId))throw validationError('Tồn không đủ điều kiện xuất');
      await locationAt(row.stagingLocationId,request.header.sourceWarehouseId,['STAGING'],session);
      await guardLocations([ctx.location._id,row.stagingLocationId],session);
      if(exact(row.qtyBase).gt(await freeQuantity(ctx.balance,session)))throw validationError('Không đủ tồn khả dụng để giữ cho phiếu xuất');
      const lock=await InventoryBalance.updateOne({_id:ctx.balance._id,version:ctx.balance.version},{$inc:{version:1}},{session});if(lock.matchedCount!==1)throw validationError('Tồn đã thay đổi');
      await new StockReservation({demandRef:{documentType:'warehouse_transfer_requests',documentId:request._id,itemId:origin._id},executionRef:{documentType:'transfer_dispatches',documentId:outbound._id},balanceId:ctx.balance._id,reservedQty:row.qtyBase,creationKey:hash({dispatch:String(outbound._id),line:i}),createdBy:actor._id}).save({session});
      const total=(totals.get(String(origin._id))??exact('0')).plus(row.qtyBase);totals.set(String(origin._id),total);
      if(total.gt(String(origin.approvedQtyBase)))throw validationError('Tổng các đợt vượt lượng duyệt');
      outbound.items.push(copyItem(origin,row.qtyBase,{lineNo:i+1,lineKind:'TRANSFER_OUTBOUND',lotId:ctx.batch._id,
        sources:[sourceLink(request,origin,row.qtyBase)],details:{requestLineId:origin._id,sourceBalanceId:ctx.balance._id,stagingLocationId:row.stagingLocationId}}));
    }
    outbound.sources=[sourceLink(request)];await outbound.save({session});
    // Contending dispatches must write the same request before consuming its allowance.
    await saveVersion(request,request.version,session);
    return{document:outbound};
  });
}
export function createRequirement(user,id,input) {
  return command(user,'CREATE_TRANSFER_REQUIREMENT','stock_transfer:read',id,input,taskReplay,async(session,actor)=>{
    let source=await Dispatch.findById(id).session(session),picking=Boolean(source);
    if(!source)source=await find(Receipt,id,session);
    checkVersion(source,input.expectedVersion);
    const outbound=picking?source:await find(Dispatch,source.header.dispatchId,session);
    const request=await find(Request,outbound.header.requestId,session);
    requirePermission(actor,picking?'stock_transfer:dispatch':'stock_transfer:receive');
    const warehouseId=picking?request.header.sourceWarehouseId:request.header.destinationWarehouseId;requireWarehouseAccess(actor,warehouseId);
    if(source.workflowStatus!==(picking?'DRAFT':'POSTED')||request.workflowStatus!=='APPROVED')throw validationError('Nguồn chưa đủ điều kiện');
    // Lock the source document before checking the one-to-one relationship. A
    // concurrent creator will retry against the new version and see the ITR.
    await saveVersion(source,source.version,session);
    if(await Requirement.exists({'header.sourceDocumentId':id}).session(session))throw validationError('Nguồn đã có yêu cầu nội bộ');
    const requirement=await document(Requirement,'ITR',actor,{warehouseId,sourceDocumentId:source._id,sourceType:source.constructor.collection.name,taskKind:picking?'PICK':'PUTAWAY'},session);
    const task=await document(Task,'TO',actor,{warehouseId,taskKind:picking?'PICK':'PUTAWAY',assignedTo:actor._id,requirementId:requirement._id},session);
    const rows=source.items.filter(item=>picking||item.details.qualityCode!=='DAMAGED');
    const destinations=input.destinations??[];
    if(!picking&&(destinations.length!==rows.length||new Set(destinations.map(row=>row.receiptLineId)).size!==rows.length))throw validationError('Chọn đích cho tất cả dòng hàng tốt');
    if(!rows.length)throw validationError('Phiếu nhận toàn hàng lỗi không cần lệnh xếp hàng');
    const ownedReservations=picking?await StockReservation.find({'executionRef.documentType':'transfer_dispatches','executionRef.documentId':source._id}).session(session):[];
    const totals=new Map();
    for(const [i,row]of rows.entries()){
      const ctx=await sourceContext(picking?row.details.sourceBalanceId:row.details.destinationBalanceId,session);
      const destinationId=picking?row.details.stagingLocationId:destinations.find(value=>same(value.receiptLineId,row._id))?.locationId;
      const to=await locationAt(destinationId,warehouseId,[picking?'STAGING':'STORAGE'],session);
      if(!ctx.location||!same(ctx.location.warehouseId,warehouseId)||same(ctx.location._id,to._id))throw validationError('Vị trí nguồn hoặc đích không hợp lệ');
      const total=(totals.get(String(ctx.balance._id))??exact('0')).plus(String(row.qtyBase));totals.set(String(ctx.balance._id),total);
      if(total.gt((await freeQuantity(ctx.balance,session)).plus(ownedReservations.filter(r=>same(r.balanceId,ctx.balance._id)).reduce((n,r)=>n.plus(remainingReservation(r)),exact('0')))))throw validationError('Không đủ tồn để lập lệnh');
      const fields={lineNo:i+1,lineKind:'WAREHOUSE_TASK',sources:[sourceLink(source,row,row.qtyBase)],details:{sourceBalanceId:ctx.balance._id,sourceBalanceVersion:ctx.balance.version,fromLocationId:ctx.location._id,toLocationId:to._id,qualityCode:ctx.balance.qualityStatus,ownerType:ctx.balance.ownerType,ownerId:ctx.balance.ownerId}};
      requirement.items.push(copyItem(row,row.qtyBase,fields));task.items.push(copyItem(row,row.qtyBase,fields));
    }
    await guardLocations(task.items.flatMap(row=>[row.details.fromLocationId,row.details.toLocationId]),session);
    requirement.sources=[sourceLink(source)];task.sources=[sourceLink(requirement)];
    if(!rows.length){requirement.workflowStatus='COMPLETED';task.workflowStatus='CONFIRMED';}
    await requirement.save({session});await task.save({session});
    for(const reservation of ownedReservations){reservation.executionRef={documentType:'transfer_orders',documentId:task._id};reservation.updatedBy=actor._id;await saveVersion(reservation,reservation.version,session);}
    return{document:task,resultRefs:[{documentType:'internal_transfer_requirements',documentId:requirement._id,revision:requirement.version}]};
  });
}
export function confirmTask(user,id,input) {
  return command(user,'CONFIRM_TRANSFER_TASK','stock_transfer:read',id,input,taskReplay,async(session,actor)=>{
    const task=await taskReplay(id,actor,session);checkVersion(task,input.expectedVersion);
    if(task.workflowStatus!=='OPEN'||!task.header.requirementId)throw validationError('Lệnh không còn mở hoặc không thuộc BF04');
    const requirement=await find(Requirement,task.header.requirementId,session),picking=task.header.taskKind==='PICK';
    requirePermission(actor,picking?'stock_transfer:dispatch':'stock_transfer:receive');
    const source=await find(picking?Dispatch:Receipt,requirement.header.sourceDocumentId,session);
    const outbound=picking?source:await find(Dispatch,source.header.dispatchId,session),request=await find(Request,outbound.header.requestId,session);
    if(request.workflowStatus!=='APPROVED'||source.workflowStatus!==(picking?'DRAFT':'POSTED')||requirement.workflowStatus!=='OPEN')throw validationError('Nguồn không còn hiệu lực');
    if(picking&&!same(outbound.createdBy,actor._id))throw forbiddenError('Chỉ người lập phiếu xuất được xác nhận');
    const locations=task.items.flatMap(item=>[item.details.fromLocationId,item.details.toLocationId]);await guardLocations(locations,session);
    if(picking&&!input.recipientName?.trim())throw validationError('Cần tên người nhận bàn giao');
    if(picking){const reservations=await StockReservation.find({'executionRef.documentType':'transfer_orders','executionRef.documentId':task._id}).session(session);for(const r of reservations){r.consumedQty=exact(r.consumedQty).plus(remainingReservation(r)).toFixed();r.updatedBy=actor._id;await saveVersion(r,r.version,session);}}
    const posting=beginStock(picking?outbound:task,actor,picking?'TRANSFER_DISPATCH':'TRANSFER_PUTAWAY',input);
    for(const item of task.items){
      const ctx=await sourceContext(item.details.sourceBalanceId,session),origin=source.items.id(item.sources.find(link=>same(link.documentId,source._id))?.itemId);
      if(!origin||!same(ctx.batch._id,item.lotId)||ctx.balance.qualityStatus!==item.details.qualityCode||!ctx.product.isActive)throw validationError('Nguồn không khớp lệnh');
      await locationAt(item.details.toLocationId,task.header.warehouseId,[picking?'STAGING':'STORAGE'],session);
      const destination=await balanceAt({type:'LOCATION',locationId:item.details.toLocationId},ctx.balance,ctx.balance.qualityStatus,session);
      await moveStock(ctx.balance._id,destination._id,item.qtyBase,picking?origin._id:item._id,posting,actor,session,{excludeTaskId:id});
      if(picking){
        const transit=await balanceAt({type:'IN_TRANSIT',dispatchLineId:origin._id},ctx.balance,ctx.balance.qualityStatus,session);
        await moveStock(destination._id,transit._id,item.qtyBase,origin._id,posting,actor,session,{excludeTaskId:id});
      }
    }
    await verifyCapacity(locations,session);await posting.save({session});
    if(picking){outbound.handovers ??= [];outbound.handovers.push({...await nextDocumentFields(Dispatch,'HO',outbound.header.sourceWarehouseId,session),workflowStatus:'CONFIRMED',version:1,createdBy:actor._id,header:{relatedDocumentId:outbound._id,recipientName:input.recipientName,vehiclePlate:input.vehiclePlate,handedOverAt:new Date(),confirmedBy:actor._id},items:outbound.items.map((i,index)=>copyItem(i,i.qtyBase,{lineNo:index+1,sources:[sourceLink(outbound,i,i.qtyBase)]}))});outbound.workflowStatus='POSTED';outbound.header.dispatchedBy=actor._id;outbound.header.dispatchedAt=new Date();outbound.stockTransactionId=posting._id;await saveVersion(outbound,outbound.version,session);}
    requirement.workflowStatus='COMPLETED';await saveVersion(requirement,requirement.version,session);
    task.workflowStatus='CONFIRMED';task.header.confirmedBy=actor._id;task.header.confirmedAt=new Date();task.stockTransactionId=posting._id;
    return{document:await saveVersion(task,input.expectedVersion,session),versionBefore:input.expectedVersion,stockTransactionId:posting._id};
  });
}
export function receiveTransfer(user,id,input) {
  return command(user,'RECEIVE_TRANSFER','stock_transfer:receive',id,input,receiptReplay,async(session,actor)=>{
    const outbound=await find(Dispatch,id,session);checkVersion(outbound,input.expectedVersion);
    const request=await find(Request,outbound.header.requestId,session);requireWarehouseAccess(actor,request.header.destinationWarehouseId);
    if(outbound.workflowStatus!=='POSTED'||request.workflowStatus!=='APPROVED')throw validationError('Nguồn chưa thực xuất hoặc đã đóng');
    if(same(outbound.header.dispatchedBy,actor._id))throw forbiddenError('Người nhận phải khác người xuất');
    await guardLocations(input.lines.map(row=>row.locationId),session);
    const receipt=await document(Receipt,'MWTR',actor,{dispatchId:outbound._id,warehouseId:request.header.destinationWarehouseId,receivedBy:actor._id,receivedAt:new Date()},session,[],'POSTED');
    const posting=beginStock(receipt,actor,'TRANSFER_RECEIPT',input);
    for(const [i,row]of input.lines.entries()){
      const origin=outbound.items.id(row.dispatchLineId);if(!origin)throw validationError('Dòng không thuộc phiếu xuất');
      await locationAt(row.locationId,request.header.destinationWarehouseId,[row.qualityCode==='DAMAGED'?'QUARANTINE':'RECEIVING'],session);
      const point=await StockHoldingPoint.findOne({type:'IN_TRANSIT',dispatchLineId:origin._id}).session(session);
      const transit=point&&await InventoryBalance.findOne({holdingPointId:point._id,batchId:origin.lotId,ownerType:'STORE',qualityStatus:'GOOD'}).session(session);
      if(!transit)throw validationError('Không có hàng đang chuyển');
      const destination=await balanceAt({type:'LOCATION',locationId:row.locationId},transit,row.qualityCode,session);
      const item=copyItem(origin,row.qtyBase,{lineNo:i+1,lineKind:'TRANSFER_RECEIPT',sources:[sourceLink(outbound,origin,row.qtyBase)],details:{dispatchLineId:origin._id,qualityCode:row.qualityCode,destinationBalanceId:destination._id,receivingLocationId:row.locationId}});
      receipt.items.push(item);await moveStock(transit._id,destination._id,row.qtyBase,item._id,posting,actor,session);
      if(row.qualityCode==='DAMAGED'){
        const report=await document(DefectReport,'DEF',actor,{warehouseId:receipt.header.warehouseId,discoveredAt:new Date(),reason:row.damageReason,reportedBy:actor._id},session,[copyItem(item,row.qtyBase,{lineNo:1,lineKind:'STANDARD',balanceId:destination._id,ownerType:'STORE',sources:[sourceLink(receipt,item,row.qtyBase)]})]);
        report.sources=[sourceLink(receipt)];await report.save({session});receipt.header.damageReportIds.push(report._id);
      }
    }
    await verifyCapacity(input.lines.map(row=>row.locationId),session);await posting.save({session});
    receipt.stockTransactionId=posting._id;receipt.sources=[sourceLink(outbound)];await receipt.save({session});
    await saveVersion(outbound,outbound.version,session);
    return{document:receipt,stockTransactionId:posting._id};
  });
}
export function closeRequest(user,id,input) {
  return command(user,'CLOSE_TRANSFER_REQUEST','stock_transfer:receive',id,input,requestReplay,async(session,actor)=>{
    const request=await find(Request,id,session);checkVersion(request,input.expectedVersion);requireWarehouseAccess(actor,request.header.destinationWarehouseId);
    if(request.workflowStatus!=='APPROVED')throw validationError('Yêu cầu không còn mở');
    const dispatches=await Dispatch.find({'header.requestId':id,workflowStatus:{$ne:'CANCELLED'}}).session(session);
    if(!dispatches.length||dispatches.some(row=>row.workflowStatus!=='POSTED'))throw validationError('Còn phiếu xuất chưa hoàn tất');
    for(const item of request.items){
      const shipped=dispatches.flatMap(row=>row.items).filter(row=>same(row.details.requestLineId,item._id)).reduce((sum,row)=>sum.plus(String(row.qtyBase)),exact('0'));
      if(!shipped.eq(String(item.approvedQtyBase)))throw validationError('Chưa xuất đủ lượng duyệt');
    }
    if(await StockDiscrepancy.exists({'header.sourceRef.documentId':{$in:dispatches.map(d=>d._id)},workflowStatus:{$ne:'RESOLVED'}}).session(session))throw validationError('Còn hồ sơ chênh lệch chưa giải quyết');
    const points=await StockHoldingPoint.find({dispatchLineId:{$in:dispatches.flatMap(row=>row.items.map(item=>item._id))}}).session(session);
    if(await InventoryBalance.exists({holdingPointId:{$in:points.map(row=>row._id)},quantityBase:{$gt:0}}).session(session))throw validationError('Còn hàng đang chuyển hoặc chênh lệch chưa giải quyết');
    const receipts=await Receipt.find({'header.dispatchId':{$in:dispatches.map(row=>row._id)},workflowStatus:'POSTED'}).session(session);
    if(!receipts.length)throw validationError('Chưa nhận hàng');
    for(const receipt of receipts)if(receipt.items.some(i=>i.details.qualityCode!=='DAMAGED')&&!await Requirement.exists({'header.sourceDocumentId':receipt._id,workflowStatus:'COMPLETED'}).session(session))throw validationError('Chưa cất xong mọi phiếu nhận');
    request.workflowStatus='COMPLETED';request.header.closedBy=actor._id;request.header.closedAt=new Date();
    return{document:await saveVersion(request,input.expectedVersion,session),versionBefore:input.expectedVersion};
  });
}

export function closePartialRequest(user,id,input) {
  return command(user,'CLOSE_TRANSFER_REQUEST_PARTIAL','stock_transfer:receive',id,input,requestReplay,async(session,actor)=>{
    const request=await find(Request,id,session);checkVersion(request,input.expectedVersion);requireWarehouseAccess(actor,request.header.destinationWarehouseId);
    if(request.workflowStatus!=='APPROVED')throw validationError('Yêu cầu không còn mở');
    const dispatches=await Dispatch.find({'header.requestId':id,workflowStatus:{$ne:'CANCELLED'}}).session(session);
    if(!dispatches.length||dispatches.some(row=>row.workflowStatus!=='POSTED'))throw validationError('Còn phiếu xuất chưa hoàn tất');
    const points=await StockHoldingPoint.find({dispatchLineId:{$in:dispatches.flatMap(row=>row.items.map(item=>item._id))}}).session(session);
    if(await InventoryBalance.exists({holdingPointId:{$in:points.map(row=>row._id)},quantityBase:{$gt:0}}).session(session))throw validationError('Còn hàng đang chuyển hoặc chênh lệch chưa giải quyết');
    if(await StockDiscrepancy.exists({'header.sourceRef.documentId':{$in:dispatches.map(d=>d._id)},workflowStatus:{$ne:'RESOLVED'}}).session(session))throw validationError('Còn hồ sơ chênh lệch chưa giải quyết');
    const receipts=await Receipt.find({'header.dispatchId':{$in:dispatches.map(row=>row._id)},workflowStatus:'POSTED'}).session(session);
    if(!receipts.length)throw validationError('Chưa nhận hàng tại kho đích');
    for(const receipt of receipts)if(receipt.items.some(i=>i.details.qualityCode!=='DAMAGED')&&!await Requirement.exists({'header.sourceDocumentId':receipt._id,workflowStatus:'COMPLETED'}).session(session))throw validationError('Chưa cất xong mọi phiếu nhận');
    const shipped=request.items.map(item=>{const dispatched=dispatches.flatMap(row=>row.items).filter(row=>same(row.details.requestLineId,item._id)).reduce((sum,row)=>sum.plus(String(row.qtyBase)),exact('0'));return {itemId:item._id,approvedQtyBase:String(item.approvedQtyBase),dispatchedQtyBase:dispatched.toFixed(),shortfallQtyBase:exact(String(item.approvedQtyBase)).minus(dispatched).toFixed()};});
    if(!shipped.some(row=>exact(row.shortfallQtyBase).gt(0)))throw validationError('Đơn đã đủ lượng duyệt; hãy dùng thao tác hoàn tất thông thường');
    request.workflowStatus='COMPLETED';request.header.closedBy=actor._id;request.header.closedAt=new Date();request.header.closureMode='PARTIAL';request.header.closureReason=input.reason;
    return{document:await saveVersion(request,input.expectedVersion,session),versionBefore:input.expectedVersion,shipped};
  });
}

export function cancelRequest(user,id,input) {
  return command(user,'CANCEL_TRANSFER_REQUEST','stock_transfer:update',id,input,requestReplay,async(session,actor)=>{
    const request=await find(Request,id,session);checkVersion(request,input.expectedVersion);requireWarehouseAccess(actor,request.header.sourceWarehouseId);
    if(!same(request.createdBy,actor._id))throw forbiddenError('Chỉ người lập yêu cầu mới được hủy');
    if(!['PENDING_APPROVAL','REVISION_REQUIRED','APPROVED'].includes(request.workflowStatus))throw validationError('Đơn không còn ở trạng thái có thể hủy');
    const dispatches=await Dispatch.find({'header.requestId':id,workflowStatus:{$ne:'CANCELLED'}}).session(session);
    if(dispatches.length)throw validationError('Đơn đã phát sinh phiếu xuất; hãy hủy phiếu xuất nháp hoặc dùng dừng chuyển tiếp');
    request.workflowStatus='CANCELLED';request.cancelledBy=actor._id;request.cancelledAt=new Date();request.cancelReason=input.reason;request.header.approvalStatus='CANCELLED';
    return{document:await saveVersion(request,input.expectedVersion,session),versionBefore:input.expectedVersion};
  });
}

export function updateRequest(user,id,input) {
 return command(user,'UPDATE_TRANSFER_REQUEST','stock_transfer:update',id,input,requestReplay,async(session,actor)=>{
  const request=await requestReplay(id,actor,session);checkVersion(request,input.expectedVersion);requireWarehouseAccess(actor,request.header.sourceWarehouseId);
  if(!same(request.createdBy,actor._id)||!['REVISION_REQUIRED','PENDING_APPROVAL'].includes(request.workflowStatus))throw validationError('Chỉ người lập được sửa yêu cầu chưa duyệt hoặc được trả lại');
  if(!same(request.header.sourceWarehouseId,input.sourceWarehouseId)||!same(request.header.destinationWarehouseId,input.destinationWarehouseId))throw validationError('Giữ nguyên kho của yêu cầu; cần kho khác thì lập đơn mới');
  if(await Dispatch.exists({'header.requestId':id,workflowStatus:{$ne:'CANCELLED'}}).session(session))throw validationError('Đã phát sinh phiếu xuất');
  const items=[];for(const [i,line]of input.lines.entries()){const previous=request.items.find(p=>same(p.productId,line.productId)&&String(p.lotId??'')===String(line.lotId??''));items.push(await makeItem(line,i+1,session,{previous}));}
  request.items=items;request.header.reason=input.reason;request.header.neededOn=input.neededOn;request.workflowStatus='PENDING_APPROVAL';request.header.approvalStatus='PENDING_APPROVAL';
  return {document:await saveVersion(request,input.expectedVersion,session),versionBefore:input.expectedVersion};
 });
}

export function cancelDraftDispatch(user,id,input){
 return command(user,'CANCEL_TRANSFER_DISPATCH','stock_transfer:dispatch',id,input,dispatchReplay,async(session,actor)=>{
  const dispatch=await dispatchReplay(id,actor,session);checkVersion(dispatch,input.expectedVersion);
  if(dispatch.workflowStatus!=='DRAFT'||!same(dispatch.createdBy,actor._id))throw validationError('Chỉ người lập được hủy phiếu xuất nháp chưa bàn giao');
  const requirements=await Requirement.find({'header.sourceDocumentId':id}).session(session);
  const tasks=await Task.find({'header.requirementId':{$in:requirements.map(r=>r._id)}}).session(session);
  if(tasks.some(t=>t.workflowStatus!=='OPEN'))throw validationError('Nhiệm vụ không còn mở');
  const reservations=await StockReservation.find({$or:[{'executionRef.documentType':'transfer_dispatches','executionRef.documentId':id},{'executionRef.documentType':'transfer_orders','executionRef.documentId':{$in:tasks.map(t=>t._id)}}]}).session(session);
  for(const reservation of reservations){reservation.releasedQty=exact(reservation.releasedQty).plus(remainingReservation(reservation)).toFixed();reservation.updatedBy=actor._id;await saveVersion(reservation,reservation.version,session);await InventoryBalance.updateOne({_id:reservation.balanceId},{$inc:{version:1}},{session});}
  for(const doc of [...tasks,...requirements,dispatch]){doc.workflowStatus='CANCELLED';doc.cancelledBy=actor._id;doc.cancelledAt=new Date();doc.cancelReason=input.reason;await saveVersion(doc,doc.version,session);}
  const request=await find(Request,dispatch.header.requestId,session);await saveVersion(request,request.version,session);
  return {document:dispatch,versionBefore:input.expectedVersion,reason:input.reason};
 });
}
