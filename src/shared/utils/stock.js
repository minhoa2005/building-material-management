import { InventoryBalance, StockHoldingPoint, StockReservation, StockTransaction, StocktakeLocationLock,
  WarehouseLocation, Warehouse, ProductBatch, Product, DefectReport, TransferOrder } from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { checkBinCapacity } from '../../models/capacity.js';
import { validationError, versionConflict } from './ApiError.js';
import { newId, same, hash } from './document-command.js';

export const remainingReservation = row => exact(row.reservedQty).minus(String(row.consumedQty)).minus(String(row.releasedQty)).minus(String(row.movedQty));

export async function guardLocations(ids, session) {
  for (const locationId of [...new Set(ids.filter(Boolean).map(String))].sort()) {
    const location = await WarehouseLocation.findOneAndUpdate({ _id: locationId, isActive: true }, { $inc: { operationVersion: 1 } }, { session, returnDocument: 'after' });
    if (!location || !await Warehouse.exists({ _id: location.warehouseId, isActive: true }).session(session)) throw validationError('Kho hoặc vị trí đã ngừng hoạt động');
    if (await StocktakeLocationLock.exists({ locationId, status: 'LOCKED' }).session(session)) throw validationError('Vị trí đang khóa kiểm kê');
  }
}
export async function locationAt(id, warehouseId, kinds, session) {
  const location = await WarehouseLocation.findOne({ _id: id, warehouseId, isActive: true }).session(session);
  if (!location || (kinds?.length && !kinds.includes(location.locationType))) throw validationError('Vị trí không thuộc kho hoặc sai loại');
  return location;
}
export async function sourceContext(id, session) {
  const balance = await InventoryBalance.findById(id).session(session);
  if (!balance) throw validationError('Không tìm thấy tồn nguồn');
  const point = await StockHoldingPoint.findById(balance.holdingPointId).session(session);
  const batch = await ProductBatch.findById(balance.batchId).session(session);
  const product = batch && await Product.findById(batch.productId).session(session);
  if (!point || !batch || !product) throw validationError('Tồn thiếu điểm giữ hàng, lô hoặc sản phẩm');
  const location = point.locationId ? await WarehouseLocation.findById(point.locationId).session(session) : null;
  return { balance, point, batch, product, location };
}
export async function balanceAt(pointFields, source, qualityStatus, session) {
  let point = await StockHoldingPoint.findOne(pointFields).session(session);
  if (!point) point = await new StockHoldingPoint(pointFields).save({ session });
  const fields = { holdingPointId: point._id, batchId: source.batchId,
    qualityStatus, ownerType: source.ownerType, ownerId: source.ownerId ?? null };
  return await InventoryBalance.findOne(fields).session(session) ??
    await new InventoryBalance({ ...fields, quantityBase: '0', version: 0, packagingPortions: [] }).save({ session });
}
export async function pendingTaskQuantity(balanceId, session, excludeTaskId) {
  const tasks = await TransferOrder.find({ ...(excludeTaskId && { _id: { $ne: excludeTaskId } }), workflowStatus: { $in: ['OPEN','DRAFT','PARTIAL'] }, 'items.details.sourceBalanceId': balanceId }).session(session).lean();
  const transactions=await StockTransaction.find({sourceType:'transfer_orders',sourceId:{$in:tasks.map(t=>t._id)}}).session(session).lean();
  return tasks.reduce((total,task)=>total.plus(task.items.filter(item=>same(item.details?.sourceBalanceId,balanceId)).reduce((n,item)=>{
    const actual=transactions.filter(t=>same(t.sourceId,task._id)).flatMap(t=>t.movements).filter(m=>same(m.sourceLineId,item._id)&&same(m.fromBalanceId,balanceId)).reduce((v,m)=>v.plus(String(m.quantityBase)),exact('0'));
    return n.plus(exact(item.qtyBase).minus(actual));
  },exact('0'))),exact('0'));
}
export async function freeQuantity(balance, session, excludeTaskId) {
  const reservations = await StockReservation.find({ balanceId: balance._id }).session(session);
  const reserved = reservations.reduce((sum,row) => sum.plus(remainingReservation(row)), exact('0'));
  const pending = await pendingTaskQuantity(balance._id, session, excludeTaskId);
  return exact(balance.quantityBase).minus(reserved).minus(pending);
}
export function beginStock(document, user, operation, input) {
  const requestHash = hash({ document: String(document._id), operation, input });
  return new StockTransaction({ sourceType: document.constructor.collection.name, sourceId: document._id,
    operation, eventKey: String(document.version), requestKey: hash({ user: String(user._id), operation, key: input.operationKey ?? input.idempotencyKey }),
    requestHash, performedBy: user._id, occurredAt: new Date(), recordedAt: new Date(), movements: [] });
}

// Whole portions retain identity. Splitting sealed groups retains the measured
// carton specification. Loose/open packaging needs a fresh measurement to split.
export function splitPortions(portions, quantity, actorId) {
  let remaining = exact(quantity);
  const kept = [], taken = [];
  for (const original of portions) {
    const portion = original.toObject ? original.toObject() : { ...original };
    const available = exact(portion.quantityBase);
    if (remaining.isZero()) { kept.push(portion); continue; }
    if (remaining.gte(available)) { taken.push(portion); remaining = remaining.minus(available); continue; }
    if (portion.packagingState !== 'SEALED' || portion.measuredVolumeMm3 != null || exact(portion.extraOccupiedVolumeMm3 ?? '0').gt(0)) {
      throw validationError('Phần hàng mở/lẻ cần được đo và tách quy cách trước khi chuyển một phần');
    }
    const packs = remaining.div(String(portion.packagingSnapshot.baseUnitsPerPackage));
    if (!packs.isInteger()) throw validationError('Không tự mở thùng; chọn lượng nguyên thùng hoặc phần hàng lẻ đã đo');
    taken.push({ ...portion, _id: newId(), sealedPackCount: packs.toNumber(), quantityBase: remaining.toFixed(), updatedBy: actorId });
    kept.push({ ...portion, sealedPackCount: portion.sealedPackCount - packs.toNumber(), quantityBase: available.minus(remaining).toFixed(), updatedBy: actorId });
    remaining = exact('0');
  }
  if (!remaining.isZero()) throw validationError('Quy cách tồn không đủ số lượng');
  return { kept, taken };
}
async function saveBalance(balance, beforeVersion, session) {
  await balance.validate();
  const result = await InventoryBalance.updateOne({ _id: balance._id, version: beforeVersion },
    { $set: { quantityBase: balance.quantityBase, packagingPortions: balance.packagingPortions }, $inc: { version: 1 } }, { session });
  if (result.matchedCount !== 1) throw versionConflict('Tồn đã thay đổi');
}
export async function moveStock(sourceId, destinationId, quantity, itemId, stockTransaction, user, session, { preserveReservations = false, excludeTaskId } = {}) {
  if (same(sourceId, destinationId)) throw validationError('Nguồn và đích phải khác nhau');
  const source = await InventoryBalance.findById(sourceId).session(session);
  const destination = await InventoryBalance.findById(destinationId).session(session);
  if (!source || !destination || !same(source.batchId, destination.batchId) || source.ownerType !== destination.ownerType || String(source.ownerId) !== String(destination.ownerId)) throw validationError('Không đổi lô hoặc chủ hàng khi chuyển tồn');
  if (await DefectReport.exists({ holds: { $elemMatch: { status: 'ACTIVE', 'allocations.balanceId': sourceId } } }).session(session)) throw validationError('Tồn đang bị chặn do hàng lỗi');
  const amount = exact(quantity), from = exact(source.quantityBase), to = exact(destination.quantityBase);
  const batch = await ProductBatch.findById(source.batchId).session(session);
  const product = batch && await Product.findById(batch.productId).session(session);
  if (!product || (product.wholeBaseUnits && !amount.isInteger())) throw validationError('Lượng chuyển không đúng đơn vị gốc');
  if (!amount.gt(0) || amount.gt(from)) throw validationError('Không đủ tồn nguồn');
  const reservations = await StockReservation.find({ balanceId: sourceId }).session(session);
  const reserved = reservations.reduce((sum,row) => sum.plus(remainingReservation(row)), exact('0'));
  const pending = await pendingTaskQuantity(sourceId, session, excludeTaskId);
  if (amount.plus(pending).plus(preserveReservations ? '0' : reserved).gt(from)) throw validationError('Tồn đã được giữ hoặc lập lệnh khác');
  const { kept, taken } = splitPortions(source.packagingPortions, amount, user._id);
  source.packagingPortions = kept; destination.packagingPortions.push(...taken);
  source.quantityBase = from.minus(amount).toFixed(); destination.quantityBase = to.plus(amount).toFixed();
  const movementId = newId();
  if (preserveReservations) {
    let toMove = amount.minus(from.minus(reserved));
    for (const reservation of reservations) {
      if (toMove.lte(0)) break;
      const available = remainingReservation(reservation), portion = available.lt(toMove) ? available : toMove;
      if (!portion.gt(0)) continue;
      const result = await StockReservation.updateOne({ _id: reservation._id, version: reservation.version },
        { $set: { movedQty: exact(reservation.movedQty).plus(portion).toFixed(), updatedBy: user._id }, $inc: { version: 1 } }, { session });
      if (result.matchedCount !== 1) throw versionConflict('Giữ hàng đã thay đổi');
      await new StockReservation({ demandRef: reservation.demandRef, executionRef: reservation.executionRef,
        balanceId: destinationId, reservedQty: portion.toFixed(), previousReservationId: reservation._id,
        sourceAllocationId: reservation.sourceAllocationId, originMovementId: movementId,
        creationKey: hash({ movement: String(movementId), source: String(reservation._id) }), createdBy: user._id }).save({ session });
      toMove = toMove.minus(portion);
    }
  }
  await saveBalance(source, source.version, session);
  await saveBalance(destination, destination.version, session);
  stockTransaction.movements.push({ _id: movementId, transactionId: stockTransaction._id, lineNo: stockTransaction.movements.length + 1,
    sourceLineId: itemId, fromBalanceId: sourceId, toBalanceId: destinationId, quantityBase: amount.toFixed(),
    fromBefore: from.toFixed(), fromAfter: source.quantityBase, toBefore: to.toFixed(), toAfter: destination.quantityBase });
  return destination;
}
export async function verifyCapacity(locationIds, session) {
  const points = await StockHoldingPoint.find({ type: 'LOCATION', locationId: { $in: locationIds } }).session(session).lean();
  const balances = await InventoryBalance.find({ holdingPointId: { $in: points.map(point => point._id) } }).session(session).lean();
  const locations = await WarehouseLocation.find({ _id: { $in: locationIds } }).session(session).lean();
  const warehouses = await Warehouse.find({ _id: { $in: locations.map(location => location.warehouseId) } }).session(session).lean();
  const batches = await ProductBatch.find({ _id: { $in: balances.map(balance => balance.batchId) } }).session(session).lean();
  try { checkBinCapacity({ stock_holding_points: points, inventory_balances: balances, warehouse_locations: locations, warehouses, product_batches: batches }); }
  catch (error) { throw validationError(error.message); }
}

export async function receiveStock(balance, item, portions, posting, user, session) {
  const batch = await ProductBatch.findById(balance.batchId).session(session);
  const product = batch && await Product.findById(batch.productId).session(session);
  const amount = exact(item.qtyBase);
  if (!batch || batch.identificationStatus !== 'VERIFIED' || !product?.isActive || !same(batch.productId, item.productId) || (product.wholeBaseUnits && !amount.isInteger())) throw validationError('Lô hoặc lượng nhập không hợp lệ');
  let packaging = portions;
  if (!packaging?.length) {
    const cartons = amount.div(batch.piecesPerCarton);
    if (!cartons.isInteger()) throw validationError('Nhập quy cách và thể tích thực đo cho phần hàng mở/lẻ');
    packaging = [{ packagingState: 'SEALED', sealedPackCount: cartons.toNumber(), quantityBase: amount.toFixed(),
      packagingSnapshot: { packageUnit: 'BOX', baseUnitsPerPackage: String(batch.piecesPerCarton),
        outerLengthMm: batch.cartonLengthMm, outerWidthMm: batch.cartonWidthMm, outerHeightMm: batch.cartonHeightMm } }];
  }
  if (!packaging.reduce((sum,row) => sum.plus(row.quantityBase), exact('0')).eq(amount)) throw validationError('Tổng quy cách khác lượng thực nhập');
  const before = exact(balance.quantityBase);
  balance.quantityBase = before.plus(amount).toFixed();
  balance.packagingPortions.push(...packaging.map(row => ({ ...row, _id: newId(), createdBy: user._id })));
  await saveBalance(balance, balance.version, session);
  posting.movements.push({ transactionId: posting._id, lineNo: posting.movements.length + 1,
    sourceLineId: item._id, toBalanceId: balance._id, quantityBase: amount.toFixed(), toBefore: before.toFixed(), toAfter: balance.quantityBase });
}
