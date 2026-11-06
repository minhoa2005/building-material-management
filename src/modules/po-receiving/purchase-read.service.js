import mongoose from 'mongoose';
import * as m from '../../models/legacy/index.js';
import { exact } from '../../models/model-utils.js';
import { canAccessWarehouse, hasPermission } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { scopeError, notFoundError } from '../../shared/utils/ApiError.js';
import { id, same, read, rights, scopedPurchaseRead, rows, serialize, txOptions } from './purchase-core.js';
import { commitments } from './po-receiving.service.js';
import { placementQuantities } from './purchase-putaway.service.js';

const readReceiving = u => rights(u, 'read', 'goods_receipt_inspection', ['OWNER','ACCOUNTANT','WAREHOUSE']);
function capabilities(user, d) {
  const warehouse = ['WAREHOUSE'];
  return {
    edit: d.workflowStatus === 'DRAFT' && hasPermission(user, 'goods_receipt_inspection:update', warehouse),
    confirm: d.documentKind === 'PO_INSPECTION' && d.workflowStatus === 'DRAFT' && hasPermission(user, 'goods_receipt_inspection:update', warehouse),
    post: d.documentKind === 'GR_PURCHASE' && d.workflowStatus === 'DRAFT' && hasPermission(user, 'goods_receipt_inspection:post', warehouse),
    cancel: d.workflowStatus === 'DRAFT' && hasPermission(user, 'goods_receipt_inspection:update', warehouse),
    reversePreflight: d.documentKind === 'GR_PURCHASE' && d.workflowStatus === 'POSTED' && hasPermission(user, 'goods_receipt_inspection:reverse', warehouse),
    planPutaway: d.documentKind === 'GR_PURCHASE' && d.workflowStatus === 'POSTED' && hasPermission(user, 'putaway_task:create', warehouse),
  };
}
async function enriched(user, documents, session = null) {
  if (!documents.length) return [];
  const ids = documents.map(d => d._id);
  const lines = await read(m.DocumentLine.find({ documentId: { $in: ids } }).sort({ lineNo: 1 }), session);
  const receipts = await read(m.BusinessDocument.find({ documentKind: 'GR_PURCHASE', 'header.poInspectionId': { $in: ids } }), session);
  const placements = await read(m.ReceiptPlacement.find({ receiptId: { $in: [...ids, ...receipts.map(r => r._id)] } }), session);
  const events = await read(m.PurchaseEvent.find({ documentId: { $in: [...ids, ...receipts.map(r => r._id)] }, kind: { $in: ['CORRECTION','REVERSAL'] } }).select('-evidenceIds'), session);
  const lineByDocument = new Map(), receiptByInspection = new Map(), placementByLine = new Map(placements.map(p => [id(p.receiptLineId), p]));
  for (const l of lines) { const k=id(l.documentId); if (!lineByDocument.has(k)) lineByDocument.set(k,[]); lineByDocument.get(k).push(l); }
  for (const r of receipts) { const k=id(r.header.poInspectionId); if (!receiptByInspection.has(k)) receiptByInspection.set(k,[]); receiptByInspection.get(k).push(r); }
  return documents.map(d => ({ ...d, capabilities: capabilities(user, d),
    lines: (lineByDocument.get(id(d._id)) ?? []).map(l => {
      const p = placementByLine.get(id(l._id));
      return { ...l, ...(p && { putaway: placementQuantities(p) }) };
    }),
    goodsReceiptId: receiptByInspection.get(id(d._id))?.[0]?._id ?? null,
    receipts: (receiptByInspection.get(id(d._id)) ?? []).map(r => ({ id: r._id, documentNo: r.documentNo, workflowStatus: r.workflowStatus, version: r.version, reversed: events.some(e => e.kind === 'REVERSAL' && same(e.documentId, r._id)) })),
    reversed: events.some(e => e.kind === 'REVERSAL' && same(e.documentId, d._id)),
    corrections: events.filter(e => same(e.documentId, d._id)),
  }));
}
export async function getDocument(user, documentId, kind) {
  readReceiving(user); const d = await scopedPurchaseRead(user, documentId, kind);
  return serialize((await enriched(user, [d]))[0]);
}
function warehouseFilter(user, warehouseId) {
  const allWarehouses = currentRole(user)?.code === 'ACCOUNTANT' || canAccessWarehouse(user, null);
  if (warehouseId) { if (!allWarehouses && !canAccessWarehouse(user, warehouseId)) throw scopeError(); return { 'header.warehouseId': new mongoose.Types.ObjectId(warehouseId) }; }
  return allWarehouses ? {} : { 'header.warehouseId': { $in: (user.warehouseIds ?? []).map(v => new mongoose.Types.ObjectId(id(v))) } };
}
export async function listDocuments(user, kind, query) {
  readReceiving(user);
  const filter = { documentKind: kind, ...warehouseFilter(user, query.warehouseId), ...(query.purchaseOrderId && { 'header.purchaseOrderId': query.purchaseOrderId }), ...(query.status && { workflowStatus: query.status }) };
  const [documents, total] = await Promise.all([m.BusinessDocument.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(), m.BusinessDocument.countDocuments(filter)]);
  return serialize({ items: await enriched(user, documents), total, page: query.page, limit: query.limit });
}
export async function receivingSummary(user, poId) {
  rights(user, 'read', 'purchase_order', ['OWNER','ACCOUNTANT','WAREHOUSE']);
  const session = await mongoose.startSession();
  try { return await session.withTransaction(async () => {
    const po = await scopedPurchaseRead(user, poId, 'PO', session);
    const quantities = await commitments(po, session);
    const lines = await rows(po._id, session);
    const docs = await read(m.BusinessDocument.find({ 'header.purchaseOrderId': po._id }).select('_id documentKind workflowStatus header'), session);
    const placements = await read(m.ReceiptPlacement.find({ purchaseOrderId: po._id }), session);
    const schedules = await read(m.PurchaseEvent.find({ purchaseOrderId: po._id, kind: 'SUPPLIER_CONFIRMATION' }).sort({ createdAt: -1, _id: -1 }), session);
    const openPlacement = placements.filter(p => exact(p.receivedQtyBase).minus(exact(p.reversedQtyBase)).minus(exact(p.placedQtyBase)).gt(0));
    return serialize({ purchaseOrder: { id: po._id, documentNo: po.documentNo, workflowStatus: po.workflowStatus, version: po.version }, poVersion: po.version, computedAt: new Date(),
      quantities: quantities.map(q => ({ ...q, snapshot: lines.find(l => same(l._id, q.lineId)) })), schedules,
      tripCount: docs.filter(d => d.documentKind === 'PO_INSPECTION' && !d.header.rootInspectionId).length,
      openWork: { draftInspections: docs.filter(d => d.documentKind === 'PO_INSPECTION' && d.workflowStatus === 'DRAFT').length,
        draftReceipts: docs.filter(d => d.documentKind === 'GR_PURCHASE' && d.workflowStatus === 'DRAFT').length,
        unplacedReceiptLines: openPlacement.length,
        unplacedQtyBase: openPlacement.reduce((sum,p) => sum.plus(exact(p.receivedQtyBase)).minus(exact(p.reversedQtyBase)).minus(exact(p.placedQtyBase)), exact('0')).toString() },
    });
  }, txOptions); } finally { await session.endSession(); }
}
export async function receivingTrips(user, poId, query) {
  readReceiving(user); await scopedPurchaseRead(user, poId, 'PO');
  const [result] = await m.BusinessDocument.aggregate([
    { $match: { documentKind: 'PO_INSPECTION', 'header.purchaseOrderId': new mongoose.Types.ObjectId(poId) } },
    { $sort: { createdAt: -1, _id: -1 } },
    { $group: { _id: { $ifNull: ['$header.rootInspectionId','$_id'] }, current: { $first: '$$ROOT' }, tripCreatedAt: { $min: '$createdAt' } } },
    ...(query.status ? [{ $match: { 'current.workflowStatus': query.status } }] : []),
    { $sort: { tripCreatedAt: -1, _id: -1 } },
    { $facet: { total: [{ $count: 'count' }], items: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }] } },
  ]);
  const rootIds = result.items.map(r => r._id);
  const revisions = await m.BusinessDocument.find({ documentKind: 'PO_INSPECTION', $or: [{ _id: { $in: rootIds } }, { 'header.rootInspectionId': { $in: rootIds } }] }).sort({ createdAt: 1, _id: 1 }).lean();
  const data = await enriched(user, revisions);
  return serialize({ items: result.items.map(r => ({ rootInspectionId: r._id, currentInspectionId: r.current._id, revisions: data.filter(d => same(d._id, r._id) || same(d.header.rootInspectionId, r._id)) })), total: result.total[0]?.count ?? 0, page: query.page, limit: query.limit });
}
export async function receivingQueue(user, query) {
  readReceiving(user);
  const base = { ...warehouseFilter(user, query.warehouseId), ...(query.purchaseOrderId && { 'header.purchaseOrderId': new mongoose.Types.ObjectId(query.purchaseOrderId) }) };
  const stage = query.stage;
  const filter = stage === 'DRAFT_INSPECTION' ? { documentKind: 'PO_INSPECTION', workflowStatus: 'DRAFT' }
    : stage === 'AWAITING_POST' ? { documentKind: 'GR_PURCHASE', workflowStatus: 'DRAFT' }
    : stage === 'AWAITING_PUTAWAY' ? { documentKind: 'GR_PURCHASE', workflowStatus: 'POSTED' }
    : { $or: [{ documentKind: 'PO_INSPECTION', workflowStatus: 'DRAFT', 'header.correctionId': { $exists: true } }, { documentKind: 'GR_PURCHASE', workflowStatus: 'POSTED' }] };
  const pipeline = [{ $match: { ...base, ...filter } }];
  if (stage === 'AWAITING_PUTAWAY') pipeline.push({ $lookup: { from: 'receipt_placements', localField: '_id', foreignField: 'receiptId', as: 'placements' } },
    { $match: { $expr: { $gt: [{ $sum: { $map: { input: '$placements', as: 'p', in: { $subtract: [{ $subtract: ['$$p.receivedQtyBase','$$p.reversedQtyBase'] }, '$$p.placedQtyBase'] } } } }, 0] } } });
  if (stage === 'CORRECTION') pipeline.push(
    { $lookup: { from: 'purchase_events', localField: '_id', foreignField: 'documentId', as: 'events' } },
    { $lookup: { from: 'business_documents', localField: 'header.poInspectionId', foreignField: 'header.replacesInspectionId', as: 'replacements' } },
    { $match: { $or: [{ documentKind: 'PO_INSPECTION' }, { 'events.kind': 'REVERSAL', replacements: { $size: 0 } }] } });
  pipeline.push({ $sort: { createdAt: 1, _id: 1 } }, { $facet: { total: [{ $count: 'count' }], items: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }, { $project: { placements: 0, events: 0, replacements: 0 } }] } });
  const [result] = await m.BusinessDocument.aggregate(pipeline);
  return serialize({ items: await enriched(user, result.items), total: result.total[0]?.count ?? 0, page: query.page, limit: query.limit, stage });
}
export async function receivingHistory(user, documentId, query) {
  readReceiving(user); const d = await scopedPurchaseRead(user, documentId);
  if (!['PO','PO_INSPECTION','GR_PURCHASE'].includes(d.documentKind) && !(d.documentKind === 'TO' && d.header.receiptId)) throw notFoundError();
  let docs;
  if (d.documentKind === 'PO') docs = await read(m.BusinessDocument.find({ $or: [{ _id: d._id }, { 'header.purchaseOrderId': d._id }] }).select('_id'));
  else if (d.documentKind === 'PO_INSPECTION') {
    const root = d.header.rootInspectionId ?? d._id;
    const inspections = await read(m.BusinessDocument.find({ documentKind: 'PO_INSPECTION', $or: [{ _id: root }, { 'header.rootInspectionId': root }] }).select('_id'));
    const grs = await read(m.BusinessDocument.find({ documentKind: 'GR_PURCHASE', 'header.poInspectionId': { $in: inspections.map(i => i._id) } }).select('_id'));
    docs = [...inspections, ...grs, ...await read(m.BusinessDocument.find({ documentKind: 'TO', 'header.receiptId': { $in: grs.map(g => g._id) } }).select('_id'))];
  } else docs = [d];
  const filter = { documentId: { $in: docs.map(d => d._id) } };
  const [events, total] = await Promise.all([m.AuditEvent.find(filter).sort({ eventAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).select('documentId actorId action eventAt changes details').lean(), m.AuditEvent.countDocuments(filter)]);
  const actors = await m.User.find({ _id: { $in: events.map(e => e.actorId) } }).select('_id fullName').lean();
  return serialize({ items: events.map(e => ({ ...e, actorName: actors.find(u => same(u._id, e.actorId))?.fullName ?? null })), total, page: query.page, limit: query.limit });
}
