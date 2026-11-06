import mongoose from 'mongoose';
import * as m from '../../models/legacy/index.js';
import { exact } from '../../models/model-utils.js';
import { id, same, read, rights, fail, scoped, rows, version, bump, command, save, link, serialize, guardLocations, adjust, batch, evidenceFor, txOptions } from './purchase-core.js';
import { purchaseOrderQuantities } from '../purchase-orders/purchase-order.service.js';
import { activePo, prepare, writeRows, header } from './po-receiving.service.js';

async function preflight(user, receiptId, session) {
  const gr = await scoped(user, receiptId, 'GR_PURCHASE', session);
  const po = await scoped(user, gr.header.purchaseOrderId, 'PO', session);
  const wh = await read(m.Warehouse.findById(gr.header.warehouseId), session);
  const lines = await rows(gr._id, session);
  const placements = await read(m.ReceiptPlacement.find({ receiptId: gr._id }), session);
  const roots = await read(m.PostingBatch.find({ documentId: gr._id, reversalOf: { $exists: false } }), session);
  const reversed = await read(m.PostingBatch.find({ reversalOf: { $in: roots.map(r => r._id) } }), session);
  const blockers = [];
  if (!wh?.isActive) blockers.push({ code: 'WAREHOUSE_INACTIVE' });
  if (gr.workflowStatus !== 'POSTED' || roots.length !== 1 || reversed.length) blockers.push({ code: 'NOT_REVERSIBLE_STATE' });
  if (placements.length !== lines.length || !lines.length) blockers.push({ code: 'MISSING_PROVENANCE' });
  const ids = placements.map(p => p.sourceBalanceId);
  const balances = await read(m.StockBalance.find({ _id: { $in: ids } }), session);
  const totals = new Map();
  for (const p of placements) {
    const line = lines.find(l => same(l._id, p.receiptLineId));
    if (!line || !exact(line.qtyBase).eq(exact(p.receivedQtyBase))) blockers.push({ code: 'INVALID_PROVENANCE', lineId: id(p.receiptLineId) });
    if (exact(p.placedQtyBase).gt(0)) blockers.push({ code: 'PLACED', lineId: id(p.receiptLineId) });
    if (exact(p.claimedQtyBase).gt(0)) blockers.push({ code: 'OPEN_TASK', lineId: id(p.receiptLineId) });
    if (exact(p.reversedQtyBase).gt(0)) blockers.push({ code: 'ALREADY_REVERSED', lineId: id(p.receiptLineId) });
    totals.set(id(p.sourceBalanceId), (totals.get(id(p.sourceBalanceId)) ?? exact('0')).plus(exact(p.receivedQtyBase)));
  }
  for (const [balanceId, qty] of totals) {
    const b = balances.find(b => same(b._id, balanceId));
    if (!b || exact(b.qtyBase).lt(qty)) blockers.push({ code: 'INSUFFICIENT_STOCK', balanceId });
  }
  const reservations = await read(m.Reservation.find({ balanceId: { $in: ids }, status: 'ACTIVE' }).select('_id balanceId'), session);
  const holds = await read(m.DefectHold.find({ balanceId: { $in: ids }, status: 'ACTIVE' }).select('_id balanceId'), session);
  if (reservations.length) blockers.push({ code: 'RESERVATION', dependencies: reservations.map(r => id(r._id)) });
  if (holds.length) blockers.push({ code: 'HOLD', dependencies: holds.map(r => id(r._id)) });
  const accounts = await read(m.StockAccount.find({ _id: { $in: balances.map(b => b.accountId) } }), session);
  const locations = await read(m.Location.find({ _id: { $in: accounts.map(a => a.locationId) } }), session);
  if (locations.length !== accounts.length || locations.some(l => !l.isActive || l.kind !== 'RECEIVING' || !same(l.warehouseId, gr.header.warehouseId))) blockers.push({ code: 'LOCATION' });
  if (await m.LocationLock.exists({ locationId: { $in: locations.map(l => l._id) } }).session(session)) blockers.push({ code: 'FREEZE' });
  if (roots.length) {
    const downstream = await read(m.StockMovement.find({ fromBalanceId: { $in: ids }, documentId: { $ne: gr._id }, createdAt: { $gte: roots[0].postedAt } }).select('_id documentId'), session);
    if (downstream.length) blockers.push({ code: 'DOWNSTREAM', dependencies: downstream.map(d => id(d.documentId)) });
    const taskLines = await read(m.DocumentLine.find({ lineKind: 'WAREHOUSE_TASK', 'details.sourceBalanceId': { $in: ids } }).select('documentId'), session);
    const openTasks = await read(m.BusinessDocument.find({ _id: { $in: taskLines.map(l => l.documentId) }, documentKind: 'TO', workflowStatus: { $in: ['OPEN','PARTIAL','DRAFT'] } }).select('_id'), session);
    if (openTasks.length) blockers.push({ code: 'OPEN_TASK', dependencies: openTasks.map(d => id(d._id)) });
  }
  return { gr, po, placements, roots, locations, canReverse: !blockers.length, blockers };
}
export async function reversalPreflight(user, receiptId) {
  rights(user, 'reverse'); const session = await mongoose.startSession();
  try { return await session.withTransaction(async () => {
    const p = await preflight(user, receiptId, session);
    return serialize({ receiptId: p.gr._id, receiptVersion: p.gr.version, poVersion: p.po.version, canReverse: p.canReverse, blockers: p.blockers });
  }, txOptions); } finally { await session.endSession(); }
}
export async function reverseReceipt(user, receiptId, input) {
  rights(user, 'reverse');
  return command(user, 'REVERSE_PURCHASE_RECEIPT', receiptId, input, async (session, key, hash) => {
    const p = await preflight(user, receiptId, session); version(p.gr, input.expectedVersion); version(p.po, input.expectedPoVersion);
    await evidenceFor(user, p.gr._id, input.evidenceIds, session, true);
    if (!p.canReverse) fail('REVERSAL_DEPENDENCY', 'Không đủ điều kiện đảo GR', { blockers: p.blockers });
    await guardLocations(p.locations.map(l => l._id), session);
    const posting = await batch(p.gr, user, key, hash, session, { operation: 'REVERSE', reversalOf: p.roots[0]._id });
    for (const placement of p.placements) {
      const b = await read(m.StockBalance.findById(placement.sourceBalanceId), session);
      const numbers = await adjust(b, exact(placement.receivedQtyBase).negated(), session);
      await save(m.StockMovement, { batchId: posting._id, documentId: p.gr._id, lineId: placement.receiptLineId, fromBalanceId: b._id, qtyBase: placement.receivedQtyBase, fromBefore: numbers.before, fromAfter: numbers.after }, session);
      const changed = await m.ReceiptPlacement.updateOne({ _id: placement._id, version: placement.version }, { $set: { reversedQtyBase: placement.receivedQtyBase }, $inc: { version: 1 } }, { session });
      if (changed.matchedCount !== 1) fail('VERSION', 'Nguồn GR vừa đổi');
    }
    const event = await save(m.PurchaseEvent, { purchaseOrderId: p.po._id, documentId: p.gr._id, kind: 'REVERSAL', sourcePoVersion: p.po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, postingBatchId: posting._id }, session);
    const q = await purchaseOrderQuantities(p.po, session);
    if (q.some(r => r.quantityState !== 'KNOWN')) fail('SOURCE', 'Không thể đối soát PO sau đảo');
    await bump(p.po, session, { workflowStatus: q.every(r => exact(r.netPostedReceiptQtyBase).isZero()) ? 'OPEN' : 'PARTIAL' });
    return { document: await bump(p.gr, session), eventId: event._id, postingBatchId: posting._id };
  });
}
export async function replaceInspection(user, inspectionId, input) {
  rights(user, 'update'); rights(user, 'create');
  return command(user, 'CORRECT_PO_INSPECTION', inspectionId, input, async session => {
    const original = await scoped(user, inspectionId, 'PO_INSPECTION', session); version(original, input.expectedVersion);
    if (original.workflowStatus !== 'CONFIRMED') fail('STATE', 'Chỉ thay thế hồ sơ đã chốt');
    const po = await scoped(user, original.header.purchaseOrderId, 'PO', session); version(po, input.expectedPoVersion);
    await evidenceFor(user, original._id, input.evidenceIds, session, true);
    const gr = await read(m.BusinessDocument.findOne({ documentKind: 'GR_PURCHASE', 'header.poInspectionId': original._id }), session);
    if (!gr) fail('SOURCE', 'Thiếu GR gốc');
    if (gr.workflowStatus === 'POSTED') {
      const reversal = await read(m.PurchaseEvent.findOne({ documentId: gr._id, kind: 'REVERSAL' }), session);
      if (!reversal) fail('STATE', 'Phải đảo GR đã post trước khi tạo bản sửa');
    } else if (!['DRAFT','CANCELLED'].includes(gr.workflowStatus)) fail('STATE', 'GR không thể thay thế');
    if (gr.workflowStatus === 'DRAFT') await bump(gr, session, { workflowStatus: 'CANCELLED' });
    // SourcePoVersion on the replacement must reflect the PO guard that releases the old GR.
    const nextPo = await bump(po, session);
    await activePo(user, po._id, nextPo.version, session);
    const prepared = await prepare(user, nextPo, input, session);
    const replacementId = new mongoose.Types.ObjectId();
    const event = await save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: original._id, kind: 'CORRECTION', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, relatedDocumentId: replacementId }, session);
    const d = await save(m.BusinessDocument, { _id: replacementId, documentNo: 'PO_INSPECTION-' + replacementId, documentKind: 'PO_INSPECTION', workflowStatus: 'DRAFT', version: 1, createdBy: user._id,
      header: { ...header(nextPo, input, input.operationKey), arrivedAt: original.header.arrivedAt, rootInspectionId: original.header.rootInspectionId ?? original._id, replacesInspectionId: original._id, correctionId: event._id } }, session);
    await writeRows(d._id, prepared, session); await link(original, d, 'CORRECTION', session); await link(po, d, 'PO_INSPECTION', session);
    await bump(original, session);
    return { document: d, eventId: event._id, relatedDocumentId: original._id };
  });
}
