import mongoose from 'mongoose';
import * as m from '../../models/index.js';
import { exact } from '../../models/model-utils.js';
import { canAccessWarehouse } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { multiplyBaseQuantity } from '../../shared/utils/domain.js';
import { validationError, notFoundError } from '../../shared/utils/ApiError.js';
import { lockLotIdentity } from '../../shared/utils/lotIdentity.js';
import { appendAudit } from '../../shared/utils/audit.js';
import { purchaseOrderQuantities } from '../purchase-orders/purchase-order.service.js';
import { id, same, read, rights, fail, version, scoped, scopedPurchaseRead, rows, save, newDoc, link, lineLink, bump, serialize, command, location, guardLocations, balance, adjust, batch, receipt, operationKey, txOptions } from './purchase-core.js';

export async function activePo(user, poId, expected, session) {
  const po = await scoped(user, poId, 'PO', session); version(po, expected);
  if (!['OPEN', 'PARTIAL'].includes(po.workflowStatus)) fail('STATE', 'PO không còn mở để nhận hàng');
  const wh = await read(m.Warehouse.findById(po.header.warehouseId), session);
  const supplier = await read(m.Party.findOne({ _id: po.header.supplierId, kind: 'SUPPLIER' }), session);
  if (!wh?.isActive || !supplier) fail('SOURCE', 'Kho/NCC nguồn không hợp lệ');
  return po;
}
export async function commitments(po, session) {
  const computed = await purchaseOrderQuantities(po, session);
  const drafts = await read(m.BusinessDocument.find({ documentKind: 'GR_PURCHASE', 'header.purchaseOrderId': po._id, workflowStatus: 'DRAFT' }), session);
  const draftRows = await read(m.DocumentLine.find({ documentId: { $in: drafts.map(d => d._id) } }), session);
  const held = new Map(computed.map(r => [r.lineId, exact('0')]));
  let invalid = false;
  for (const r of draftRows) {
    const key = id(r.details?.poLineId);
    if (!held.has(key)) { invalid = true; continue; }
    held.set(key, held.get(key).plus(exact(r.qtyBase)));
  }
  return computed.map(r => {
    const amount = held.get(r.lineId);
    const headroom = r.quantityState === 'KNOWN' && r.outstandingQtyBase != null ? exact(r.outstandingQtyBase).minus(amount) : null;
    return { ...r, openDraftCommitmentQtyBase: invalid ? null : amount.toString(), acceptanceHeadroomQtyBase: invalid || !headroom || headroom.isNegative() ? null : headroom.toString() };
  });
}
export async function prepare(user, po, input, session) {
  const sources = new Map((await rows(po._id, session)).map(r => [id(r._id), r]));
  const seen = new Set(); const result = [];
  for (const [i, r] of input.lines.entries()) {
    if (seen.has(r.clientLineKey)) throw validationError('Mã dòng bị trùng', [{ field: 'lines.' + i + '.clientLineKey', message: 'Trùng mã dòng' }]);
    seen.add(r.clientLineKey);
    const source = sources.get(id(r.poLineId));
    if (!source) throw validationError('Dòng không thuộc PO');
    const product = await read(m.Product.findById(source.productId), session);
    const lot = await read(m.Lot.findById(r.lotId), session);
    if (!product?.isActive || !lot || !same(lot.productId, product._id)) throw validationError('Sản phẩm/lô không hợp lệ');
    const qty = multiplyBaseQuantity(r.enteredQty, source.conversionSnapshot.toString());
    if (!qty.valid || (product.wholeBaseUnits && !qty.value.isInteger())) throw validationError('Lượng nhập không hợp lệ');
    await location(user, r.plannedReceiptLocationId, po.header.warehouseId, ['RECEIVING'], session);
    const conv = await read(m.ProductUomVersion.findById(source.conversionId), session);
    const uom = conv && await read(m.Uom.findById(conv.uomId), session);
    result.push({ source, productId: source.productId, lotId: lot._id, conversionId: source.conversionId, conversionSnapshot: source.conversionSnapshot,
      enteredQty: r.enteredQty, qtyBase: qty.string, productNameSnapshot: source.productNameSnapshot,
      productSkuSnapshot: source.productSkuSnapshot ?? product.sku, enteredUomCodeSnapshot: source.enteredUomCodeSnapshot ?? uom?.code,
      lotLabelSnapshot: [lot.manufacturerLot, lot.tone, lot.calibre].filter(Boolean).join(' / '),
      details: { clientLineKey: r.clientLineKey, poLineId: source._id, qualityCode: 'GOOD', plannedReceiptLocationId: r.plannedReceiptLocationId, ...(r.handlingNote && { handlingNote: r.handlingNote }) } });
  }
  if (input.scheduleId) {
    const schedule = await read(m.PurchaseEvent.findOne({ _id: input.scheduleId, purchaseOrderId: po._id, kind: 'SUPPLIER_CONFIRMATION' }), session);
    if (!schedule) throw validationError('Lịch giao không thuộc PO');
  }
  return result;
}
export async function writeRows(documentId, prepared, session, previous = []) {
  const keys = new Set(prepared.map(r => r.details.clientLineKey));
  for (const old of previous.filter(r => !keys.has(r.details.clientLineKey))) {
    await m.LineLink.deleteMany({ targetLineId: old._id }, { session });
    await m.DocumentLine.deleteOne({ _id: old._id, documentId }, { session });
  }
  // Move existing line numbers out of the way before reordering (unique document/lineNo).
  const Line = m.DocumentLine.discriminators.DocumentLine_PO_INSPECTION;
  for (const old of previous.filter(r => keys.has(r.details.clientLineKey))) await Line.updateOne({ _id: old._id }, { $set: { lineNo: old.lineNo + 1000 } }, { session });
  for (const [i, r] of prepared.entries()) {
    const { source, ...fields } = r;
    const old = previous.find(p => p.details.clientLineKey === fields.details.clientLineKey);
    const values = { ...fields, documentId, lineNo: i + 1, lineKind: 'PO_INSPECTION' };
    if (old) {
      if (!same(old.details.poLineId, source._id)) throw validationError('Không đổi nguồn của dòng đã lưu; thêm dòng mới');
      await Line.updateOne({ _id: old._id, documentId }, { $set: values }, { session, runValidators: true });
      await m.LineLink.updateOne({ sourceLineId: source._id, targetLineId: old._id, relationCode: 'SOURCE' }, { $set: { linkedQty: fields.qtyBase } }, { session });
    } else {
      const line = await save(m.DocumentLine, values, session);
      await lineLink(source._id, line._id, fields.qtyBase, session);
    }
    await lockLotIdentity(fields.lotId, session);
  }
}
export function header(po, input, creationKey) {
  return { purchaseOrderId: po._id, warehouseId: po.header.warehouseId, supplierId: po.header.supplierId, sourcePoVersion: po.version, creationKey,
    arrivedAt: new Date(input.arrivedAt), ...(input.deliveryReference && { deliveryReference: input.deliveryReference }), ...(input.delivererName && { delivererName: input.delivererName }),
    ...(input.delivererContact && { delivererContact: input.delivererContact }), ...(input.scheduleId && { scheduleId: input.scheduleId }) };
}
export async function createInspection(user, poId, input) {
  rights(user, 'create');
  return command(user, 'CREATE_PO_INSPECTION', poId, input, async session => {
    const po = await activePo(user, poId, input.expectedPoVersion, session);
    const prepared = await prepare(user, po, input, session);
    const d = await newDoc('PO_INSPECTION', header(po, input, input.creationKey), user, session);
    await writeRows(d._id, prepared, session); await link(po, d, 'PO_INSPECTION', session);
    return { document: d };
  });
}
export async function updateInspection(user, inspectionId, input) {
  rights(user, 'update');
  return command(user, 'UPDATE_PO_INSPECTION', inspectionId, input, async session => {
    const d = await scoped(user, inspectionId, 'PO_INSPECTION', session); version(d, input.expectedVersion);
    if (d.workflowStatus !== 'DRAFT') fail('STATE', 'Chỉ sửa phiếu đang nháp');
    const po = await activePo(user, d.header.purchaseOrderId, input.expectedPoVersion, session);
    const prepared = await prepare(user, po, input, session);
    const next = await bump(d, session, { header: { ...header(po, input, d.header.creationKey), ...Object.fromEntries(['rootInspectionId', 'replacesInspectionId', 'correctionId'].filter(k => d.header[k]).map(k => [k, d.header[k]])) } });
    await writeRows(d._id, prepared, session, await rows(d._id, session));
    return { document: next };
  });
}
export async function confirmInspection(user, inspectionId, input) {
  rights(user, 'update');
  return command(user, 'CONFIRM_PO_INSPECTION', inspectionId, input, async session => {
    const d = await scoped(user, inspectionId, 'PO_INSPECTION', session); version(d, input.expectedVersion);
    if (d.workflowStatus !== 'DRAFT') fail('STATE', 'Phiếu không còn nháp');
    const po = await activePo(user, d.header.purchaseOrderId, input.expectedPoVersion, session);
    if (d.header.sourcePoVersion !== po.version) fail('VERSION', 'PO đã đổi; lưu lại nháp trên phiên bản mới trước khi chốt');
    const stored = await rows(d._id, session);
    if (!stored.length) throw validationError('Cần ít nhất một dòng nhận lượng dương');
    await prepare(user, po, { lines: stored.map(r => ({ ...r.details, lotId: id(r.lotId), enteredQty: r.enteredQty.toString() })), scheduleId: d.header.scheduleId }, session);
    const q = await commitments(po, session);
    if (q.some(r => r.acceptanceHeadroomQtyBase == null)) fail('SOURCE', 'PO thiếu căn cứ lượng nhận');
    const free = new Map(q.map(r => [r.lineId, exact(r.acceptanceHeadroomQtyBase)]));
    for (const r of stored) {
      const left = free.get(id(r.details.poLineId))?.minus(exact(r.qtyBase));
      if (!left || left.isNegative()) fail('HEADROOM', 'Lượng nhập vượt phần PO còn được nhận', { quantities: q }, [{ clientLineKey: r.details.clientLineKey, message: 'Vượt headroom' }]);
      free.set(id(r.details.poLineId), left);
    }
    await bump(po, session);
    const gr = await newDoc('GR_PURCHASE', { warehouseId: po.header.warehouseId, purchaseOrderId: po._id, poInspectionId: d._id, supplierId: po.header.supplierId, delivererName: d.header.delivererName, delivererContact: d.header.delivererContact }, user, session);
    await link(po, gr, 'PO_RECEIPT', session); await link(d, gr, 'INSPECTION_RECEIPT', session);
    for (const [i, r] of stored.entries()) {
      const line = await save(m.DocumentLine, { documentId: gr._id, lineNo: i + 1, lineKind: 'PURCHASE_RECEIPT', productId: r.productId, lotId: r.lotId, conversionId: r.conversionId, conversionSnapshot: r.conversionSnapshot,
        enteredQty: r.enteredQty, qtyBase: r.qtyBase, productNameSnapshot: r.productNameSnapshot, productSkuSnapshot: r.productSkuSnapshot, enteredUomCodeSnapshot: r.enteredUomCodeSnapshot, lotLabelSnapshot: r.lotLabelSnapshot,
        details: { poLineId: r.details.poLineId, inspectionLineId: r._id, qualityCode: 'GOOD', receivingLocationId: r.details.plannedReceiptLocationId } }, session);
      await lineLink(r._id, line._id, r.qtyBase, session);
    }
    return { document: await bump(d, session, { workflowStatus: 'CONFIRMED', 'header.inspectedBy': user._id, 'header.inspectedAt': new Date() }), goodsReceiptId: gr._id };
  });
}
export async function postReceipt(user, receiptId, input) {
  rights(user, 'post');
  return command(user, 'POST_PURCHASE_RECEIPT', receiptId, input, async (session, key, hash) => {
    const gr = await scoped(user, receiptId, 'GR_PURCHASE', session); version(gr, input.expectedVersion);
    if (gr.workflowStatus !== 'DRAFT') fail('STATE', 'GR không còn nháp');
    const inspection = await scoped(user, gr.header.poInspectionId, 'PO_INSPECTION', session);
    const po = await activePo(user, gr.header.purchaseOrderId, input.expectedPoVersion, session);
    if (inspection.workflowStatus !== 'CONFIRMED' || !same(inspection.header.purchaseOrderId, po._id) || !same(gr.header.supplierId, po.header.supplierId) || !same(gr.header.warehouseId, po.header.warehouseId) || !same(inspection.header.warehouseId, po.header.warehouseId) || !same(inspection.header.supplierId, po.header.supplierId)) fail('SOURCE', 'Nguồn GR không khớp');
    const lines = await rows(gr._id, session); const inspected = await rows(inspection._id, session);
    if (!lines.length || lines.length !== inspected.length) fail('SOURCE', 'GR phải bao phủ đúng lượng đã chốt');
    const seen = new Set();
    for (const r of lines) {
      const source = inspected.find(s => same(s._id, r.details.inspectionLineId));
      if (!source || seen.has(id(source._id)) || !same(source.details.poLineId, r.details.poLineId) || !same(source.productId, r.productId) || !same(source.lotId, r.lotId) || !exact(source.qtyBase).eq(exact(r.qtyBase)) || r.details.qualityCode !== 'GOOD') fail('SOURCE', 'Dòng GR không khớp hồ sơ nhận');
      seen.add(id(source._id));
      await location(user, r.details.receivingLocationId, po.header.warehouseId, ['RECEIVING'], session);
      const product = await read(m.Product.findById(r.productId), session);
      const lot = await read(m.Lot.findById(r.lotId), session);
      if (!product?.isActive || !lot || !same(lot.productId, product._id)) fail('SOURCE', 'Sản phẩm/lô không hợp lệ');
    }
    const q = await commitments(po, session);
    if (q.some(r => r.acceptanceHeadroomQtyBase == null)) fail('HEADROOM', 'PO có cam kết vượt nguồn hoặc thiếu căn cứ');
    const received = new Map(q.map(r => [r.lineId, exact(r.outstandingQtyBase)]));
    for (const r of lines) received.set(id(r.details.poLineId), received.get(id(r.details.poLineId)).minus(exact(r.qtyBase)));
    await guardLocations(lines.map(r => r.details.receivingLocationId), session);
    const store = await read(m.Party.findOne({ kind: 'STORE' }), session); if (!store) fail('SOURCE', 'Thiếu STORE');
    const posting = await batch(gr, user, key, hash, session);
    for (const r of lines) {
      const target = await balance(r.details.receivingLocationId, r.lotId, store._id, 'GOOD', session);
      if (await m.DefectHold.exists({ balanceId: target._id, status: 'ACTIVE' }).session(session)) fail('HOLD', 'Balance đích đang bị giữ do lỗi');
      const numbers = await adjust(target, exact(r.qtyBase), session);
      await save(m.StockMovement, { batchId: posting._id, documentId: gr._id, lineId: r._id, toBalanceId: target._id, qtyBase: r.qtyBase, toBefore: numbers.before, toAfter: numbers.after }, session);
      await save(m.ReceiptPlacement, { purchaseOrderId: po._id, receiptId: gr._id, receiptLineId: r._id, sourceBalanceId: target._id, receivedQtyBase: r.qtyBase }, session);
    }
    await bump(po, session, { workflowStatus: [...received.values()].every(q => q.isZero()) ? 'COMPLETED' : 'PARTIAL' });
    return { document: await bump(gr, session, { workflowStatus: 'POSTED' }), goodsReceiptId: gr._id, postingBatchId: posting._id };
  });
}
export async function cancelDraft(user, documentId, kind, input) {
  rights(user, 'update');
  return command(user, kind === 'GR_PURCHASE' ? 'CANCEL_PURCHASE_RECEIPT' : 'CANCEL_PO_INSPECTION', documentId, input, async session => {
    const d = await scoped(user, documentId, kind, session); version(d, input.expectedVersion);
    if (d.workflowStatus !== 'DRAFT') fail('STATE', 'Chỉ hủy phiếu nháp');
    if (kind === 'GR_PURCHASE') { const po = await scoped(user, d.header.purchaseOrderId, 'PO', session); version(po, input.expectedPoVersion); await bump(po, session); }
    return { document: await bump(d, session, { workflowStatus: 'CANCELLED' }) };
  });
}
export async function changeDestinations(user, documentId, input) {
  rights(user, 'update');
  return command(user, 'CHANGE_GR_DESTINATIONS', documentId, input, async session => {
    const gr = await scoped(user, documentId, 'GR_PURCHASE', session); version(gr, input.expectedVersion);
    if (gr.workflowStatus !== 'DRAFT') fail('STATE', 'Chỉ đổi đích GR nháp');
    const lines = await rows(gr._id, session); const seen = new Set();
    for (const r of input.lines) {
      if (seen.has(r.lineId)) throw validationError('Dòng đổi đích bị trùng'); seen.add(r.lineId);
      const old = lines.find(l => same(l._id, r.lineId)); if (!old) throw notFoundError();
      await location(user, r.receivingLocationId, gr.header.warehouseId, ['RECEIVING'], session);
      await m.DocumentLine.discriminators.DocumentLine_PURCHASE_RECEIPT.updateOne({ _id: old._id }, { $set: { 'details.receivingLocationId': r.receivingLocationId } }, { session, runValidators: true });
      await appendAudit({ documentId: gr._id, actorId: user._id, action: 'GR_DESTINATION', changes: [{ path: 'lines.' + id(old._id) + '.receivingLocationId', before: id(old.details.receivingLocationId), after: r.receivingLocationId }], session });
    }
    return { document: await bump(gr, session) };
  });
}
export async function inspectionContext(user, poId) {
  if (currentRole(user)?.code === 'WAREHOUSE') rights(user, 'create');
  else rights(user, 'read', 'purchase_order', ['OWNER', 'ACCOUNTANT']);
  const session = await mongoose.startSession();
  try { return await session.withTransaction(async () => {
    const po = await scopedPurchaseRead(user, poId, 'PO', session);
    const lines = await rows(po._id, session); const quantities = await commitments(po, session);
    const locations = await read(m.Location.find({ warehouseId: po.header.warehouseId, kind: 'RECEIVING', isActive: true }), session);
    return serialize({ purchaseOrder: po, lines, quantities, locations, computedAt: new Date() });
  }, txOptions); } finally { await session.endSession(); }
}
export async function receivingOperation(user, poId, rawKey) {
  rights(user, 'read', 'purchase_order', ['OWNER', 'ACCOUNTANT', 'WAREHOUSE']);
  await scoped(user, poId, 'PO');
  const op = await read(m.BusinessOperation.findOne({ idempotencyKey: operationKey(user, rawKey), performedBy: user._id }));
  if (!op) return { status: 'NOT_FOUND' };
  const d = await scoped(user, op.documentId);
  const targetPoId = d.documentKind === 'PO' ? d._id : d.header?.purchaseOrderId;
  let belongs = same(targetPoId, poId);
  if (d.documentKind === 'TO') belongs = Boolean(await m.DocumentLine.exists({ documentId: d._id, 'details.placementId': { $in: (await m.ReceiptPlacement.find({ purchaseOrderId: poId }).select('_id').lean()).map(p => p._id) } }));
  if (!belongs) throw notFoundError();
  return { status: 'COMMITTED', receipt: receipt(op, true) };
}
