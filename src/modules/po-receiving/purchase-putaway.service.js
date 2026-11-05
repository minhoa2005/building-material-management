import * as m from '../../models/index.js';
import { exact } from '../../models/model-utils.js';
import { notFoundError, validationError } from '../../shared/utils/ApiError.js';
import { pendingTaskQuantity, netMovedQuantity } from '../location-movements/location-movement.service.js';
import { carryReservations } from '../location-movements/location-movement.lifecycle.js';
import { id, same, read, rights, fail, scoped, scopedPurchaseRead, rows, version, bump, command, save, newDoc, link, lineLink, serialize, location, guardLocations, balance, adjust, batch } from './purchase-core.js';

const permit = (u, action) => rights(u, action, 'putaway_task', action === 'read' ? ['OWNER', 'ACCOUNTANT', 'WAREHOUSE'] : ['WAREHOUSE']);
export const placementQuantities = p => {
  const unplaced = exact(p.receivedQtyBase).minus(exact(p.reversedQtyBase)).minus(exact(p.placedQtyBase));
  const unplanned = unplaced.minus(exact(p.claimedQtyBase));
  if (unplaced.isNegative() || unplanned.isNegative()) fail('PROVENANCE', 'Projection xếp kho không hợp lệ');
  return { receivedQtyBase: p.receivedQtyBase.toString(), placedQtyBase: p.placedQtyBase.toString(), claimedQtyBase: p.claimedQtyBase.toString(), unplacedQtyBase: unplaced.toString(), unplannedQtyBase: unplanned.toString(), placementVersion: p.version };
};
async function updatePlacement(p, session, { claimDelta = '0', placedDelta = '0' }) {
  const claimed = exact(p.claimedQtyBase).plus(exact(claimDelta)); const placed = exact(p.placedQtyBase).plus(exact(placedDelta));
  if (claimed.isNegative() || placed.isNegative() || claimed.plus(placed).plus(exact(p.reversedQtyBase)).gt(exact(p.receivedQtyBase))) fail('PROVENANCE', 'Lượng kế hoạch/thực cất vượt nguồn GR');
  const write = await m.ReceiptPlacement.updateOne({ _id: p._id, version: p.version }, { $set: { claimedQtyBase: claimed.toString(), placedQtyBase: placed.toString() }, $inc: { version: 1 } }, { session, runValidators: true });
  if (write.matchedCount !== 1) fail('VERSION', 'Nguồn GR vừa có task khác xử lý');
}
async function source(user, gr, receiptLine, p, destinationId, session) {
  const wh = await read(m.Warehouse.findById(gr.header.warehouseId), session);
  const b = await read(m.StockBalance.findById(p.sourceBalanceId), session);
  const account = b && await read(m.StockAccount.findById(b.accountId), session);
  const lot = await read(m.Lot.findById(receiptLine.lotId), session);
  const product = await read(m.Product.findById(receiptLine.productId), session);
  const owner = b && await read(m.Party.findById(b.ownerPartyId), session);
  if (!wh?.isActive || !b || !lot || !product?.isActive || !same(lot.productId, product._id) || !same(b.lotId, lot._id) || b.qualityCode !== 'GOOD' || owner?.kind !== 'STORE' || !same(account?.locationId, receiptLine.details.receivingLocationId)) fail('SOURCE', 'Nguồn put-away không hợp lệ');
  await location(user, account.locationId, gr.header.warehouseId, ['RECEIVING'], session);
  const to = await location(user, destinationId, gr.header.warehouseId, ['STORAGE'], session);
  if (to.allocatable && lot.identificationStatus !== 'VERIFIED') fail('LOT', 'Lô chưa xác minh không được cất vào vị trí cấp hàng');
  if (await m.DefectHold.exists({ balanceId: b._id, status: 'ACTIVE' }).session(session)) fail('HOLD', 'Nguồn đang bị giữ do lỗi');
  return { b, product, to, sourceLocationId: account.locationId };
}
export async function putawayContext(user, receiptId) {
  permit(user, 'read'); const gr = await scopedPurchaseRead(user, receiptId, 'GR_PURCHASE');
  if (gr.workflowStatus !== 'POSTED') fail('STATE', 'GR chưa post');
  const [lines, placements, locations, tasks] = await Promise.all([
    rows(gr._id), read(m.ReceiptPlacement.find({ receiptId: gr._id })),
    read(m.Location.find({ warehouseId: gr.header.warehouseId, kind: 'STORAGE', isActive: true })),
    read(m.BusinessDocument.find({ documentKind: 'TO', 'header.receiptId': gr._id })),
  ]);
  const balances = await read(m.StockBalance.find({ _id: { $in: placements.map(p => p.sourceBalanceId) } }));
  return serialize({ receiptId: gr._id, receiptVersion: gr.version, locations, tasks, lines: lines.map(l => {
    const p = placements.find(p => same(p.receiptLineId, l._id));
    return { ...l, ...(p ? placementQuantities(p) : { quantityState: 'INCOMPLETE' }), sourceBalanceId: p?.sourceBalanceId ?? null, sourceBalanceVersion: balances.find(b => same(b._id, p?.sourceBalanceId))?.version ?? null };
  }) });
}
export async function createPutaway(user, receiptId, input) {
  permit(user, 'create');
  return command(user, 'CREATE_PURCHASE_PUTAWAY', receiptId, input, async session => {
    const gr = await scoped(user, receiptId, 'GR_PURCHASE', session); version(gr, input.expectedVersion);
    if (gr.workflowStatus !== 'POSTED') fail('STATE', 'GR chưa post');
    const lines = await rows(gr._id, session); const prepared = [];
    for (const r of input.lines) {
      const line = lines.find(l => same(l._id, r.receiptLineId));
      const p = line && await read(m.ReceiptPlacement.findOne({ receiptLineId: line._id }), session);
      if (!p) throw notFoundError(); version(p, r.expectedPlacementVersion);
      const ctx = await source(user, gr, line, p, r.toLocationId, session); version(ctx.b, r.expectedSourceVersion);
      if (ctx.product.wholeBaseUnits && !exact(r.qtyBase).isInteger()) throw validationError('Số viên phải nguyên');
      prepared.push({ r, line, p, ctx });
    }
    await guardLocations(prepared.flatMap(p => [p.ctx.sourceLocationId, p.r.toLocationId]), session);
    const task = await newDoc('TO', { warehouseId: gr.header.warehouseId, taskKind: 'PUTAWAY', assignedTo: user._id, purchaseOrderId: gr.header.purchaseOrderId, receiptId: gr._id }, user, session, 'OPEN');
    for (const [i, { r, line, ctx }] of prepared.entries()) {
      // Re-read after each allocation: splitting one receipt line in this request is supported.
      const p = await read(m.ReceiptPlacement.findOne({ receiptLineId: line._id }), session);
      if (exact(r.qtyBase).gt(exact(placementQuantities(p).unplannedQtyBase))) fail('CLAIM', 'Kế hoạch vượt lượng chưa cất của GR');
      const pending = await pendingTaskQuantity(ctx.b, ctx.sourceLocationId, session);
      if (pending.plus(exact(r.qtyBase)).gt(exact(ctx.b.qtyBase))) fail('CLAIM', 'Tồn nguồn đã được task khác giữ');
      const conversion = await read(m.ProductUomVersion.findOne({ productId: ctx.product._id, uomId: ctx.product.baseUomId, basePerUnit: '1', validFrom: { $lte: new Date() } }).sort({ version: -1 }), session);
      if (!conversion) fail('UOM', 'Thiếu phiên bản đơn vị cơ sở');
      const taskLine = await save(m.DocumentLine, { documentId: task._id, lineNo: i + 1, lineKind: 'WAREHOUSE_TASK', productId: line.productId, lotId: line.lotId, productNameSnapshot: line.productNameSnapshot,
        conversionId: conversion._id, conversionSnapshot: '1', enteredQty: r.qtyBase, qtyBase: r.qtyBase,
        details: { fromLocationId: ctx.sourceLocationId, toLocationId: r.toLocationId, qualityCode: 'GOOD', sourceBalanceId: ctx.b._id, sourceBalanceVersion: ctx.b.version, ownerPartyId: ctx.b.ownerPartyId, receiptLineId: line._id, placementId: p._id } }, session);
      await lineLink(line._id, taskLine._id, r.qtyBase, session, 'PURCHASE_PUTAWAY');
      await updatePlacement(p, session, { claimDelta: r.qtyBase });
    }
    await link(gr, task, 'PURCHASE_PUTAWAY', session);
    return { document: task };
  });
}
async function taskState(user, taskId, session, scope = scoped) {
  const task = await scope(user, taskId, 'TO', session);
  if (task.header.taskKind !== 'PUTAWAY' || !task.header.receiptId) throw notFoundError();
  const lines = await rows(task._id, session);
  const movements = await read(m.StockMovement.find({ documentId: task._id }), session);
  const batches = await read(m.PostingBatch.find({ documentId: task._id }), session);
  return { task, lines, actual: new Map(lines.map(l => [id(l._id), netMovedQuantity(movements.filter(m => same(m.lineId, l._id)), batches)])) };
}
export async function getPutaway(user, taskId) {
  permit(user, 'read'); const { task, lines, actual } = await taskState(user, taskId, null, scopedPurchaseRead);
  return serialize({ ...task, lines: lines.map(l => ({ ...l, actualQtyBase: actual.get(id(l._id)).toString(), remainingQtyBase: exact(l.qtyBase).minus(actual.get(id(l._id))).toString() })) });
}
export async function confirmPutaway(user, taskId, input) {
  permit(user, 'confirm');
  return command(user, 'CONFIRM_PURCHASE_PUTAWAY', taskId, input, async (session, key, hash) => {
    const { task, lines, actual } = await taskState(user, taskId, session); version(task, input.expectedVersion);
    if (!['OPEN', 'PARTIAL'].includes(task.workflowStatus)) fail('STATE', 'Task không còn mở');
    const gr = await scoped(user, task.header.receiptId, 'GR_PURCHASE', session);
    const receiptLines = await rows(gr._id, session); const seen = new Set();
    const selected = input.lines.map(r => {
      const l = lines.find(l => same(l._id, r.taskLineId));
      if (!l || seen.has(r.taskLineId)) throw validationError('Dòng task không hợp lệ/trùng'); seen.add(r.taskLineId);
      return { r, l };
    });
    await guardLocations(selected.flatMap(({ l }) => [l.details.fromLocationId, l.details.toLocationId]), session);
    const posting = await batch(task, user, key, hash, session, { operation: 'PURCHASE_PUTAWAY' });
    for (const { r, l } of selected) {
      const qty = exact(r.actualQtyBase);
      if (qty.gt(exact(l.qtyBase).minus(actual.get(id(l._id))))) fail('CLAIM', 'Thực cất vượt phần task còn lại');
      const p = await read(m.ReceiptPlacement.findById(l.details.placementId), session);
      const receiptLine = receiptLines.find(r => same(r._id, l.details.receiptLineId));
      if (!p || !receiptLine || !same(p.receiptId, gr._id)) fail('PROVENANCE', 'Thiếu nguồn GR của task');
      const ctx = await source(user, gr, receiptLine, p, l.details.toLocationId, session);
      if (ctx.product.wholeBaseUnits && !qty.isInteger()) throw validationError('Số viên phải nguyên');
      const pending = await pendingTaskQuantity(ctx.b, ctx.sourceLocationId, session, task._id);
      if (qty.plus(pending).gt(exact(ctx.b.qtyBase))) fail('SOURCE', 'Không đủ tồn sau task khác');
      const target = await balance(l.details.toLocationId, l.lotId, l.details.ownerPartyId, 'GOOD', session);
      if (await m.DefectHold.exists({ balanceId: target._id, status: 'ACTIVE' }).session(session)) fail('HOLD', 'Đích đang bị giữ do lỗi');
      await carryReservations(ctx.b, target, exact(ctx.b.qtyBase), qty, session);
      const from = await adjust(ctx.b, qty.negated(), session); const to = await adjust(target, qty, session);
      await save(m.StockMovement, { batchId: posting._id, documentId: task._id, lineId: l._id, fromBalanceId: ctx.b._id, toBalanceId: target._id, qtyBase: qty.toString(), fromBefore: from.before, fromAfter: from.after, toBefore: to.before, toAfter: to.after }, session);
      await updatePlacement(p, session, { claimDelta: qty.negated().toString(), placedDelta: qty.toString() });
      actual.set(id(l._id), actual.get(id(l._id)).plus(qty));
    }
    const complete = lines.every(l => actual.get(id(l._id)).eq(exact(l.qtyBase)));
    return { document: await bump(task, session, { workflowStatus: complete ? 'CONFIRMED' : 'PARTIAL' }), postingBatchId: posting._id };
  });
}
export async function cancelPutaway(user, taskId, input) {
  permit(user, 'cancel');
  return command(user, 'CANCEL_PURCHASE_PUTAWAY', taskId, input, async session => {
    const { task, lines, actual } = await taskState(user, taskId, session); version(task, input.expectedVersion);
    if (!['OPEN', 'PARTIAL'].includes(task.workflowStatus)) fail('STATE', 'Task không còn phần mở');
    for (const l of lines) {
      const remainder = exact(l.qtyBase).minus(actual.get(id(l._id)));
      if (!remainder.gt(0)) continue;
      const p = await read(m.ReceiptPlacement.findById(l.details.placementId), session);
      if (!p) fail('PROVENANCE', 'Thiếu nguồn task');
      await updatePlacement(p, session, { claimDelta: remainder.negated().toString() });
    }
    return { document: await bump(task, session, { workflowStatus: 'CANCELLED' }) };
  });
}
