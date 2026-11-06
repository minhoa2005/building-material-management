import { TransferOrder, Warehouse, WarehouseLocation, InventoryBalance, StockHoldingPoint, StockTransaction, ProductBatch, Product } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { requirePermission, requireWarehouseAccess, isOwner } from '../../shared/utils/access.js';
import { notFoundError, validationError, forbiddenError, versionConflict } from '../../shared/utils/ApiError.js';
import { dto, page } from '../../shared/utils/persistence.js';
import { escapeRegex } from '../../shared/utils/domain.js';
import { command, scopedDocument, checkVersion, saveVersion, newId, same } from '../../shared/utils/document-command.js';
import { makeItem } from '../../shared/utils/document-items.js';
import { sourceContext, locationAt, guardLocations, pendingTaskQuantity, beginStock, balanceAt, moveStock, verifyCapacity } from '../../shared/utils/stock.js';
export { pendingTaskQuantity } from '../../shared/utils/stock.js';

async function task(id, user, session) {
  const row = await scopedDocument(TransferOrder, id, user, session);
  if (row.header.taskKind !== 'RELOCATE') throw notFoundError();
  return row;
}
const replay = (id,user,session) => task(id,user,session);
export async function relocationItems(user, warehouseId, input, session, excludeTaskId, previous = []) {
  const result = [], totals = new Map();
  for (const [index, line] of input.lines.entries()) {
    const ctx = await sourceContext(line.sourceBalanceId, session);
    if (!ctx.location || !ctx.product.isActive || ctx.batch.identificationStatus !== 'VERIFIED' || !same(ctx.location.warehouseId, warehouseId)) throw validationError('Tồn nguồn không hợp lệ');
    if (ctx.balance.version !== line.sourceBalanceVersion) throw versionConflict('Tồn nguồn đã thay đổi', ctx.balance.version);
    await locationAt(line.toLocationId, warehouseId, ['RECEIVING','STORAGE','STAGING','QUARANTINE','CUSTODY'], session);
    if (same(ctx.location._id, line.toLocationId)) throw validationError('Vị trí nguồn và đích trùng nhau');
    const old = previous.find(item => same(item.details.sourceBalanceId, line.sourceBalanceId) && same(item.details.toLocationId, line.toLocationId));
    const item = await makeItem({ ...line, productId: ctx.product._id, lotId: ctx.batch._id }, index + 1, session, { lineKind: 'WAREHOUSE_TASK', previous: old });
    const total = (totals.get(String(ctx.balance._id)) ?? exact('0')).plus(item.qtyBase); totals.set(String(ctx.balance._id), total);
    const pending = await pendingTaskQuantity(ctx.balance._id, session, excludeTaskId);
    if (total.plus(pending).gt(String(ctx.balance.quantityBase))) throw validationError('Tồn nguồn đã được lập lệnh khác');
    result.push({ ...item, details: { sourceBalanceId: ctx.balance._id, sourceBalanceVersion: ctx.balance.version,
      fromLocationId: ctx.location._id, toLocationId: line.toLocationId, qualityCode: ctx.balance.qualityStatus,
      ownerType: ctx.balance.ownerType, ownerId: ctx.balance.ownerId } });
  }
  await guardLocations(result.flatMap(item => [item.details.fromLocationId, item.details.toLocationId]), session);
  return result;
}
export function createLocationMovement(user, input) {
  return command(user, 'CREATE_RELOCATION', 'stock_relocation:create', null, input, replay, async (session,actor) => {
    requireWarehouseAccess(actor, input.warehouseId);
    const document = await new TransferOrder({ documentNo: 'TO-' + newId(), workflowStatus: 'OPEN', version: 1, createdBy: actor._id,
      header: { warehouseId: input.warehouseId, taskKind: 'RELOCATE', assignedTo: actor._id, reason: input.reason },
      items: await relocationItems(actor, input.warehouseId, input, session) }).save({ session });
    return { document };
  });
}
export async function getLocationMovement(user, id) {
  requirePermission(user, 'stock_relocation:read');
  const document = await task(id,user);
  const transactions = await StockTransaction.find({ sourceType: 'transfer_orders', sourceId: id }).lean();
  return { ...dto(document), transactions: transactions.map(dto) };
}
export async function listLocationMovements(user, query) {
  requirePermission(user, 'stock_relocation:read');
  const filter = { 'header.taskKind': 'RELOCATE' };
  if (query.warehouseId) { requireWarehouseAccess(user, query.warehouseId); filter['header.warehouseId'] = query.warehouseId; }
  else if (!isOwner(user)) filter['header.warehouseId'] = { $in: user.warehouseIds || [] };
  if (query.status) filter.workflowStatus = query.status;
  if (query.q) filter.documentNo = new RegExp(escapeRegex(query.q), 'i');
  return page(TransferOrder, filter, query);
}
export async function locationMovementOptions(user, warehouseId) {
  requirePermission(user, 'stock_relocation:create');
  const warehouses = await Warehouse.find({ isActive: true, ...(isOwner(user) ? {} : { _id: { $in: user.warehouseIds || [] } }) }).lean();
  if (!warehouseId) return { warehouses: warehouses.map(dto), locations: [], balances: [] };
  requireWarehouseAccess(user, warehouseId);
  const locations = await WarehouseLocation.find({ warehouseId, isActive: true }).lean();
  const points = await StockHoldingPoint.find({ locationId: { $in: locations.map(row=>row._id) } }).lean();
  const balances = await InventoryBalance.find({ holdingPointId: { $in: points.map(row=>row._id) }, quantityBase: { $gt: 0 } }).lean();
  const batches = await ProductBatch.find({ _id: { $in: balances.map(row=>row.batchId) } }).lean();
  const products = await Product.find({ _id: { $in: batches.map(row=>row.productId) } }).lean();
  return { warehouses: warehouses.map(dto), locations: locations.map(dto), holdingPoints: points.map(dto), balances: balances.map(dto), batches: batches.map(dto), products: products.map(dto) };
}
export function editLocationMovement(user,id,input) {
  return command(user,'EDIT_RELOCATION','stock_relocation:create',id,input,replay,async(session,actor)=>{
    const document = await task(id,actor,session); checkVersion(document,input.expectedVersion);
    if (!same(document.createdBy,actor._id)) throw forbiddenError('Chỉ người lập được sửa lệnh');
    if (document.workflowStatus !== 'OPEN') throw validationError('Lệnh không còn mở');
    document.items = await relocationItems(actor,document.header.warehouseId,input,session,id,document.items);
    document.header.reason = input.reason;
    return { document: await saveVersion(document,input.expectedVersion,session), versionBefore: input.expectedVersion };
  });
}
export function cancelLocationMovement(user,id,input) {
  return command(user,'CANCEL_RELOCATION','stock_relocation:create',id,input,replay,async(session,actor)=>{
    const document = await task(id,actor,session); checkVersion(document,input.expectedVersion);
    if (!same(document.createdBy,actor._id)) throw forbiddenError('Chỉ người lập được hủy lệnh');
    if (document.workflowStatus !== 'OPEN') throw validationError('Lệnh không còn mở');
    await guardLocations(document.items.map(item=>item.details.fromLocationId),session);
    document.workflowStatus='CANCELLED'; document.cancelReason=input.reason; document.cancelledBy=actor._id; document.cancelledAt=new Date();
    return { document:await saveVersion(document,input.expectedVersion,session),versionBefore:input.expectedVersion };
  });
}
export function confirmLocationMovement(user,id,input) {
  return command(user,'CONFIRM_RELOCATION','stock_relocation:confirm',id,input,replay,async(session,actor)=>{
    const document=await task(id,actor,session); checkVersion(document,input.expectedVersion);
    if (!same(document.createdBy,actor._id)) throw forbiddenError('Chỉ người lập được xác nhận lệnh');
    if (document.workflowStatus!=='OPEN') throw validationError('Lệnh không còn mở');
    if(input.lines.length!==document.items.length || new Set(input.lines.map(row=>row.lineId)).size!==document.items.length) throw validationError('Xác nhận toàn bộ dòng một lần');
    for(const item of document.items) {
      const actual=input.lines.find(row=>same(row.lineId,item._id));
      if(!actual || !exact(actual.actualQtyBase).eq(String(item.qtyBase))) throw validationError('Lượng xác nhận phải bằng lượng lệnh');
      const ctx=await sourceContext(item.details.sourceBalanceId,session);
      if(ctx.balance.version!==item.details.sourceBalanceVersion) throw versionConflict('Tồn đã thay đổi; sửa lại lệnh trước khi xác nhận');
      if(!same(ctx.batch._id,item.lotId)||ctx.balance.qualityStatus!==item.details.qualityCode) throw validationError('Tồn không khớp lệnh');
      await locationAt(item.details.toLocationId,document.header.warehouseId,null,session);
    }
    const locations=document.items.flatMap(item=>[item.details.fromLocationId,item.details.toLocationId]);
    await guardLocations(locations,session);
    const posting=beginStock(document,actor,'RELOCATE',input);
    for(const item of document.items) {
      const ctx=await sourceContext(item.details.sourceBalanceId,session);
      const destination=await balanceAt({type:'LOCATION',locationId:item.details.toLocationId},ctx.balance,ctx.balance.qualityStatus,session);
      await moveStock(ctx.balance._id,destination._id,item.qtyBase,item._id,posting,actor,session,{preserveReservations:true,excludeTaskId:id});
    }
    await verifyCapacity(locations,session); await posting.save({session});
    document.workflowStatus='CONFIRMED'; document.header.confirmedBy=actor._id; document.header.confirmedAt=new Date(); document.stockTransactionId=posting._id;
    return {document:await saveVersion(document,input.expectedVersion,session),versionBefore:input.expectedVersion,stockTransactionId:posting._id};
  });
}

