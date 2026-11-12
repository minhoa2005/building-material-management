import { PurchaseReceipt, TransferOrder, StockTransaction, WarehouseLocation, InventoryBalance, InternalTransferRequirement } from '../../models/runtime.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { exact } from '../../models/model-utils.js';
import { requirePermission, requireWarehouseAccess, isOwner } from '../../shared/utils/access.js';
import { validationError, notFoundError, versionConflict } from '../../shared/utils/ApiError.js';
import { dto, serialize } from '../../shared/utils/persistence.js';
import { command, checkVersion, saveVersion, same } from '../../shared/utils/document-command.js';
import { copyItem, sourceLink } from '../../shared/utils/document-copy.js';
import { sourceContext, locationAt, guardLocations, pendingTaskQuantity, beginStock, balanceAt, moveStock, verifyCapacity } from '../../shared/utils/stock.js';
import { findPurchase, newDocument, replayPurchase } from './purchase-core.js';

export function purchaseWarehouseFilter(user, id) {
  const all = isOwner(user) || currentRole(user)?.code === 'ACCOUNTANT';
  if (id) {
    if (!all) requireWarehouseAccess(user, id);
    return { 'header.warehouseId': id };
  }
  return all ? {} : { 'header.warehouseId': { $in: user.warehouseIds ?? [] } };
}

export async function listPutaway(user, { page, limit, status, warehouseId, receiptId, purchaseOrderId }) {
  requirePermission(user, 'putaway_task:read');
  const scope = purchaseWarehouseFilter(user, warehouseId);
  const receiptFilter = { ...scope, ...(receiptId && { _id: receiptId }),
    ...(purchaseOrderId && { 'header.purchaseOrderId': purchaseOrderId }) };
  const source = { subjectCollection: 'goods_receipts' };
  if (receiptId || purchaseOrderId) source.documentId = { $in: await PurchaseReceipt.find(receiptFilter).distinct('_id') };
  const filter = { ...scope, 'header.taskKind': 'PUTAWAY', sources: { $elemMatch: source },
    ...(status && { workflowStatus: status }) };
  const [rows, total] = await Promise.all([
    TransferOrder.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    TransferOrder.countDocuments(filter),
  ]);
  const receipts = await PurchaseReceipt.find({ ...scope, _id: { $in: rows.flatMap(row =>
    row.sources.filter(ref => ref.subjectCollection === 'goods_receipts').map(ref => ref.documentId)) } }).select('documentNo').lean();
  const items = await Promise.all(rows.map(async row => {
    const done = await actual(row);
    const ref = row.sources.find(ref => ref.subjectCollection === 'goods_receipts');
    const receipt = receipts.find(receipt => same(receipt._id, ref.documentId));
    const planned = row.items.reduce((sum, item) => sum.plus(String(item.qtyBase)), exact('0'));
    const placed = [...done.values()].reduce((sum, qty) => sum.plus(qty), exact('0'));
    return serialize({
      _id: row._id, documentNo: row.documentNo, workflowStatus: row.workflowStatus, createdAt: row.createdAt,
      sourceReceipt: { id: ref.documentId, documentNo: receipt?.documentNo },
      plannedQtyBase: planned.toFixed(), actualQtyBase: placed.toFixed(), remainingQtyBase: planned.minus(placed).toFixed(),
    });
  }));
  return { items, total, page, limit };
}

export async function placementQuantities(receipt, session) {
  const posting = await StockTransaction.findById(receipt.stockTransactionId).session(session);
  const reversal = posting && await StockTransaction.exists({ reversedTransactionId: posting._id }).session(session);
  const tasks = await TransferOrder.find({ 'sources.subjectCollection': 'goods_receipts', 'sources.documentId': receipt._id }).session(session);
  const transactions = await StockTransaction.find({ sourceType: 'transfer_orders', sourceId: { $in: tasks.map(t=>t._id) } }).session(session);
  return receipt.items.map(item=>{
    const movements = posting?.movements.filter(m=>same(m.sourceLineId,item._id)) || [];
    const received = reversal ? exact('0') : movements.reduce((n,m)=>n.plus(String(m.quantityBase)),exact('0'));
    let placed=exact('0'),claimed=exact('0');
    for(const task of tasks) for(const row of task.items) {
      if(!row.sources.some(s=>s.subjectCollection==='goods_receipts'&&same(s.itemId,item._id)))continue;
      const done=transactions.filter(t=>same(t.sourceId,task._id)).flatMap(t=>t.movements).filter(m=>same(m.sourceLineId,row._id)).reduce((n,m)=>n.plus(String(m.quantityBase)),exact('0'));
      placed=placed.plus(done);
      if(['OPEN','PARTIAL'].includes(task.workflowStatus))claimed=claimed.plus(exact(row.qtyBase).minus(done));
    }
    return {lineId:String(item._id),receivedQtyBase:received.toFixed(),placedQtyBase:placed.toFixed(),claimedQtyBase:claimed.toFixed(),
      unplacedQtyBase:received.minus(placed).toFixed(),unplannedQtyBase:received.minus(placed).minus(claimed).toFixed(),
      sourceBalanceId:movements[0]?.toBalanceId,placementVersion:receipt.version};
  });
}
async function receipt(id,user,session){const d=await findPurchase(id,user,session,{kind:'GR_PURCHASE',readOnly:true});if(d.workflowStatus!=='POSTED')throw validationError('Phiếu nhập chưa ghi tồn');return d;}
async function task(id,user,session){
  const d=await findPurchase(id,user,session,{kind:'TO',readOnly:true});
  if(d.header.taskKind!=='PUTAWAY')throw notFoundError();
  const hasGr=d.sources?.some(s=>s.subjectCollection==='goods_receipts');
  const hasItr=d.header?.requirementId||d.sources?.some(s=>s.subjectCollection==='internal_transfer_requirements');
  if(!hasGr&&!hasItr)throw notFoundError();
  return d;
}
async function actual(task,session){const tx=await StockTransaction.find({sourceType:'transfer_orders',sourceId:task._id}).session(session);return new Map(task.items.map(i=>[String(i._id),tx.flatMap(t=>t.movements).filter(m=>same(m.sourceLineId,i._id)).reduce((n,m)=>n.plus(String(m.quantityBase)),exact('0'))]));}
async function source(gr,item,balanceId,toLocationId,session){
  const ctx=await sourceContext(balanceId,session);
  if(!same(ctx.batch._id,item.lotId)||ctx.balance.ownerType!=='STORE'||ctx.balance.qualityStatus!=='GOOD'||!ctx.product.isActive||ctx.batch.identificationStatus!=='VERIFIED'||!same(ctx.location?._id,item.destinationLocationId))throw validationError('Nguồn nhập không còn hợp lệ');
  await locationAt(ctx.location._id,gr.header.warehouseId,['RECEIVING'],session);await locationAt(toLocationId,gr.header.warehouseId,['STORAGE'],session);return ctx;
}
export async function putawayContext(user,id){
  requirePermission(user,'putaway_task:read');const gr=await receipt(id,user);const quantities=await placementQuantities(gr);
  const balances=await InventoryBalance.find({_id:{$in:quantities.map(q=>q.sourceBalanceId).filter(Boolean)}}).lean();
  return serialize({receiptId:id,receiptVersion:gr.version,locations:await WarehouseLocation.find({warehouseId:gr.header.warehouseId,locationType:'STORAGE',isActive:true}).lean(),
    tasks:await TransferOrder.find({'sources.subjectCollection':'goods_receipts','sources.documentId':gr._id}).lean(),
    items:gr.items.map(i=>({...dto(i),...quantities.find(q=>same(q.lineId,i._id)),sourceBalanceVersion:balances.find(b=>same(b._id,quantities.find(q=>same(q.lineId,i._id))?.sourceBalanceId))?.version}))});
}
export function createPutaway(user,id,input){return command(user,'CREATE_PURCHASE_PUTAWAY','putaway_task:create',id,input,replayPurchase,async(session,actor)=>{
  const gr=await findPurchase(id,actor,session,{kind:'GR_PURCHASE'});checkVersion(gr,input.expectedVersion);if(gr.workflowStatus!=='POSTED')throw validationError('Phiếu nhập chưa ghi tồn');
  const quantities=await placementQuantities(gr,session),items=[],used=new Map(),totals=new Map();
  for(const [index,row] of input.lines.entries()){
    const item=gr.items.id(row.receiptLineId),q=quantities.find(q=>same(q.lineId,row.receiptLineId));if(!item||!q?.sourceBalanceId)throw validationError('Không có nguồn dòng nhập');
    if (row.expectedPlacementVersion != null && q.placementVersion !== row.expectedPlacementVersion) throw versionConflict('Kế hoạch cất đã thay đổi');
    const ctx=await source(gr,item,q.sourceBalanceId,row.toLocationId,session);if(ctx.balance.version!==row.expectedSourceVersion)throw versionConflict('Tồn nguồn đã thay đổi');
    const qty=exact(row.qtyBase);if(!qty.gt(0)||(ctx.product.wholeBaseUnits&&!qty.isInteger()))throw validationError('Lượng cất không hợp lệ');
    const sum=(used.get(row.receiptLineId)||exact('0')).plus(qty);used.set(row.receiptLineId,sum);if(sum.gt(q.unplannedQtyBase))throw validationError('Kế hoạch vượt nguồn nhập còn lại');
    const total=(totals.get(String(ctx.balance._id))||exact('0')).plus(qty);totals.set(String(ctx.balance._id),total);
    if(total.plus(await pendingTaskQuantity(ctx.balance._id,session)).gt(String(ctx.balance.quantityBase)))throw validationError('Tồn đã được lệnh khác giữ');
    items.push(copyItem(item,qty.toFixed(),{lineNo:index+1,lineKind:'WAREHOUSE_TASK',sources:[sourceLink(gr,item,qty.toFixed(),'PURCHASE_PUTAWAY')],
      details:{fromLocationId:ctx.location._id,toLocationId:row.toLocationId,sourceBalanceId:ctx.balance._id,sourceBalanceVersion:ctx.balance.version,qualityCode:ctx.balance.qualityStatus,ownerType:ctx.balance.ownerType,ownerId:ctx.balance.ownerId}}));
  }
  await guardLocations(items.flatMap(i=>[i.details.fromLocationId,i.details.toLocationId]),session);
  const document=await newDocument(TransferOrder,'TO',actor,{warehouseId:gr.header.warehouseId,taskKind:'PUTAWAY',assignedTo:actor._id},items,'OPEN');
  document.sources=[{subjectCollection:'goods_receipts',documentId:gr._id,relationCode:'PURCHASE_PUTAWAY'}];await document.save({session});await saveVersion(gr,gr.version,session);return {document};
});}
export async function getPutaway(user,id){
  requirePermission(user,'putaway_task:read');
  const d=await task(id,user),done=await actual(d);
  let receiptId=d.sources?.find(ref=>ref.subjectCollection==='goods_receipts')?.documentId;
  if(!receiptId&&d.header?.requirementId){
    const itr=await InternalTransferRequirement.findById(d.header.requirementId).lean();
    receiptId=itr?.header?.sourceDocumentId||itr?.sources?.find(s=>s.subjectCollection==='goods_receipts')?.documentId;
  }
  return {
    ...dto(d),
    header:{
      ...dto(d.header),
      receiptId:receiptId?String(receiptId):''
    },
    items:d.items.map(i=>({
      ...dto(i),
      actualQtyBase:done.get(String(i._id)).toFixed(),
      remainingQtyBase:exact(i.qtyBase).minus(done.get(String(i._id))).toFixed()
    }))
  };
}
export function confirmPutaway(user,id,input){return command(user,'CONFIRM_PURCHASE_PUTAWAY','putaway_task:confirm',id,input,replayPurchase,async(session,actor)=>{
  const d=await task(id,actor,session);await findPurchase(id,actor,session,{kind:'TO'});checkVersion(d,input.expectedVersion);if(!['OPEN','PARTIAL'].includes(d.workflowStatus))throw validationError('Lệnh không còn mở');
  const gr=await receipt(d.sources.find(s=>s.subjectCollection==='goods_receipts').documentId,actor,session);const done=await actual(d,session),seen=new Set();
  const locations=[],selected=[];
  for(const row of input.lines){const i=d.items.id(row.taskLineId);if(!i||seen.has(row.taskLineId))throw validationError('Dòng không hợp lệ hoặc trùng');seen.add(row.taskLineId);
    const qty=exact(row.actualQtyBase);if(!qty.gt(0)||qty.gt(exact(i.qtyBase).minus(done.get(String(i._id)))))throw validationError('Lượng cất vượt phần còn lại');
    const ref=i.sources.find(s=>s.subjectCollection==='goods_receipts');const sourceItem=gr.items.id(ref?.itemId);if(!sourceItem)throw validationError('Thiếu nguồn nhập');
    await source(gr,sourceItem,i.details.sourceBalanceId,i.details.toLocationId,session);selected.push({i,qty});locations.push(i.details.fromLocationId,i.details.toLocationId);
  }
  await guardLocations(locations,session);const posting=beginStock(d,actor,'PURCHASE_PUTAWAY',input);
  for(const {i,qty} of selected){const ctx=await sourceContext(i.details.sourceBalanceId,session);const to=await balanceAt({type:'LOCATION',locationId:i.details.toLocationId},ctx.balance,'GOOD',session);
    await moveStock(ctx.balance._id,to._id,qty,i._id,posting,actor,session,{preserveReservations:true,excludeTaskId:id});done.set(String(i._id),done.get(String(i._id)).plus(qty));}
  await verifyCapacity(locations,session);await posting.save({session});d.workflowStatus=d.items.every(i=>done.get(String(i._id)).eq(String(i.qtyBase)))?'CONFIRMED':'PARTIAL';
  if(d.workflowStatus==='CONFIRMED'){d.header.confirmedAt=new Date();d.header.confirmedBy=actor._id;}
  return {document:await saveVersion(d,input.expectedVersion,session),versionBefore:input.expectedVersion,stockTransactionId:posting._id};
});}
export function cancelPutaway(user,id,input){return command(user,'CANCEL_PURCHASE_PUTAWAY','putaway_task:cancel',id,input,replayPurchase,async(session,actor)=>{
  const d=await task(id,actor,session);await findPurchase(id,actor,session,{kind:'TO'});checkVersion(d,input.expectedVersion);if(!['OPEN','PARTIAL'].includes(d.workflowStatus))throw validationError('Lệnh không còn phần mở');
  await guardLocations(d.items.map(i=>i.details.fromLocationId),session);d.workflowStatus='CANCELLED';d.cancelReason=input.reason;d.cancelledBy=actor._id;d.cancelledAt=new Date();
  return {document:await saveVersion(d,input.expectedVersion,session),versionBefore:input.expectedVersion,reason:input.reason};
});}


