import { canAccessWarehouse } from '../../shared/utils/access.js';
import * as m from '../../models/legacy/index.js';
import { exact } from '../../models/model-utils.js';
import { multiplyBaseQuantity, RR_APPROVAL_KIND } from '../../shared/utils/domain.js';
import { validationError, notFoundError } from '../../shared/utils/ApiError.js';
import { purchaseOrderQuantities } from './purchase-order.service.js';
import { id, same, read, fail, rights, scoped, rows, version, bump, command, save, newDoc, lineLink, evidenceFor } from '../po-receiving/purchase-core.js';

const accountant = (u, action = 'update') => rights(u, action, 'purchase_order', ['ACCOUNTANT']);
async function source(user, input, warehouseId, session) {
  const line = await read(m.DocumentLine.findOne({ _id: input.rrLineId, lineKind: 'REPLENISHMENT' }), session);
  if (!line || line.details?.removedAt) throw notFoundError();
  const rr = await scoped(user, line.documentId, 'REPLENISHMENT', session);
  const approval = await read(m.Approval.findOne({ _id: input.approvalId, documentId: rr._id, documentVersion: rr.version, decisionKind: RR_APPROVAL_KIND, decision: 'APPROVE' }), session);
  const decision = approval?.lines.find(r => same(r.lineId, line._id) && r.outcome === 'APPROVE');
  if (rr.workflowStatus !== 'APPROVED' || !same(rr.header.warehouseId, warehouseId) || !decision || !exact(decision.approvedQty).gt(0)) fail('RR_SOURCE', 'Nguồn RR chưa được duyệt đúng phiên bản/kho');
  const product = await read(m.Product.findById(line.productId), session);
  const q = multiplyBaseQuantity(input.enteredQty, line.conversionSnapshot.toString());
  if (!product?.isActive || !q.valid || (product.wholeBaseUnits && !q.value.isInteger())) throw validationError('Sản phẩm hoặc lượng theo RR không hợp lệ');
  if (q.value.gt(exact(decision.approvedQty))) fail('RR_CAP', 'Lượng PO vượt lượng RR được duyệt');
  return { line, rr, approval, decision, product, qty: q.string };
}
async function master(user, input, session) {
  const wh = await read(m.Warehouse.findById(input.warehouseId), session);
  const supplier = await read(m.Party.findOne({ _id: input.supplierId, kind: 'SUPPLIER', isActive: true, cooperationStatus: 'ACTIVE' }), session);
  if (!wh?.isActive || !supplier) throw validationError('Kho/NCC không hoạt động');
  // Scope is checked before creating a document, not after its insertion.
  if (!canAccessWarehouse(user, wh._id)) throw notFoundError();
}
async function draftLines(user, po, input, session) {
  const previous = await rows(po._id, session); const seen = new Set(); const seenIds = new Set(); const keep = new Set();
  const prepared = [];
  for (const l of input.lines) {
    if (seen.has(l.rrLineId)) throw validationError('Gộp các lượng của cùng dòng RR'); seen.add(l.rrLineId);
    const src = await source(user, l, input.warehouseId, session);
    const old = l.id && previous.find(r => same(r._id, l.id));
    if (l.id && (!old || seenIds.has(l.id))) throw validationError('Dòng PO cần sửa không hợp lệ hoặc trùng ID');
    if (l.id) seenIds.add(l.id);
    if (old && !same(old.productId, src.line.productId)) throw validationError('Không đổi sản phẩm dòng đã lưu');
    const conversion = await read(m.ProductUomVersion.findById(src.line.conversionId), session);
    const uom = conversion && await read(m.Uom.findById(conversion.uomId), session);
    prepared.push({ src, old, values: { documentId: po._id, productId: src.line.productId,
      conversionId: src.line.conversionId, conversionSnapshot: src.line.conversionSnapshot, enteredQty: l.enteredQty,
      qtyBase: src.qty, productNameSnapshot: src.line.productNameSnapshot, productSkuSnapshot: src.product.sku, enteredUomCodeSnapshot: uom?.code } });
    if (old) keep.add(id(old._id));
  }
  const draftClaims = await read(m.PurchaseSourceClaim.find({ purchaseOrderId: po._id }), session);
  if (draftClaims.some(c => exact(c.qtyBase).gt(0))) fail('RR_SOURCE', 'PO nháp có claim đã xác nhận');
  await m.PurchaseSourceClaim.deleteMany({ purchaseOrderId: po._id }, { session });
  for (const old of previous) {
    await m.LineLink.deleteMany({ targetLineId: old._id }, { session });
    if (!keep.has(id(old._id))) await m.DocumentLine.deleteOne({ _id: old._id }, { session });
    else await m.DocumentLine.updateOne({ _id: old._id }, { $set: { lineNo: old.lineNo + 1000 } }, { session });
  }
  for (const [i, p] of prepared.entries()) {
    let line;
    if (p.old) { await m.DocumentLine.updateOne({ _id: p.old._id }, { $set: { ...p.values, lineNo: i + 1 } }, { session, runValidators: true }); line = p.old; }
    else line = await save(m.DocumentLine, { ...p.values, lineNo: i + 1 }, session);
    await lineLink(p.src.line._id, line._id, p.src.qty, session, 'REPLENISHMENT_PURCHASE');
    await save(m.PurchaseSourceClaim, { purchaseOrderId: po._id, poLineId: line._id, rrLineId: p.src.line._id, approvalId: p.src.approval._id, qtyBase: '0' }, session);
  }
}
// Conditional write on the RR serializes claims across ALL POs while keeping its approval version unchanged.
async function claim(user, po, poLine, input, session) {
  const src = await source(user, input, po.header.warehouseId, session);
  if (!same(src.line.productId, poLine.productId)) fail('RR_SOURCE', 'RR bổ sung sai SKU');
  const lock = await m.BusinessDocument.updateOne({ _id: src.rr._id, documentKind: 'REPLENISHMENT', version: src.rr.version, workflowStatus: 'APPROVED' }, { $inc: { 'header.purchasingVersion': 1 } }, { session });
  if (lock.matchedCount !== 1) fail('RR_SOURCE', 'Nguồn RR đã thay đổi');
  const claims = await read(m.PurchaseSourceClaim.find({ rrLineId: src.line._id }), session);
  const used = claims.reduce((sum, r) => sum.plus(exact(r.qtyBase)), exact('0'));
  if (used.plus(exact(src.qty)).gt(exact(src.decision.approvedQty))) fail('RR_CAP', 'Allowance RR đã được PO khác sử dụng', { approvedQtyBase: src.decision.approvedQty.toString(), committedQtyBase: used.toString() });
  const prior = claims.find(r => same(r.poLineId, poLine._id));
  if (prior && !same(prior.approvalId, src.approval._id)) fail('RR_SOURCE', 'Claim gắn phiên bản duyệt khác');
  if (prior) { const changed = await m.PurchaseSourceClaim.updateOne({ _id: prior._id, version: prior.version }, { $inc: { version: 1 }, $set: { qtyBase: exact(prior.qtyBase).plus(exact(src.qty)).toString() } }, { session }); if (changed.matchedCount !== 1) fail('RR_SOURCE', 'Claim RR vừa đổi'); }
  else await save(m.PurchaseSourceClaim, { purchaseOrderId: po._id, poLineId: poLine._id, rrLineId: src.line._id, approvalId: src.approval._id, qtyBase: src.qty }, session);
  return src;
}
export async function createPurchaseOrder(user, input) {
  accountant(user, 'create');
  return command(user, 'CREATE_PURCHASE_ORDER', input.warehouseId, input, async session => {
    await master(user, input, session);
    const po = await newDoc('PO', { warehouseId: input.warehouseId, supplierId: input.supplierId, creationKey: input.creationKey, ...(input.expectedOn && { expectedOn: new Date(input.expectedOn) }) }, user, session);
    await draftLines(user, po, input, session);
    return { document: po };
  });
}
export async function updatePurchaseOrder(user, poId, input) {
  accountant(user);
  return command(user, 'UPDATE_PURCHASE_ORDER', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    if (po.workflowStatus !== 'DRAFT') fail('STATE', 'Chỉ sửa PO nháp; PO mở dùng amendment');
    await master(user, input, session);
    await draftLines(user, po, input, session);
    return { document: await bump(po, session, { header: { warehouseId: input.warehouseId, supplierId: input.supplierId, creationKey: po.header.creationKey, ...(input.expectedOn && { expectedOn: new Date(input.expectedOn) }) } }) };
  });
}
export async function confirmPurchaseOrder(user, poId, input) {
  accountant(user);
  return command(user, 'CONFIRM_PURCHASE_ORDER', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    if (po.workflowStatus !== 'DRAFT') fail('STATE', 'PO không còn nháp');
    await master(user, po.header, session);
    const lines = await rows(po._id, session); if (!lines.length) throw validationError('PO cần có dòng hàng');
    for (const l of lines) {
      const links = await read(m.LineLink.find({ targetLineId: l._id, relationCode: 'REPLENISHMENT_PURCHASE' }), session);
      if (links.length !== 1 || !exact(links[0].linkedQty).eq(exact(l.qtyBase))) fail('RR_SOURCE', 'Dòng PO thiếu nguồn RR');
      const rrLine = await read(m.DocumentLine.findById(links[0].sourceLineId), session);
      const rr = rrLine && await read(m.BusinessDocument.findById(rrLine.documentId), session);
      const approval = rr && await read(m.Approval.findOne({ documentId: rr._id, documentVersion: rr.version, decisionKind: RR_APPROVAL_KIND, decision: 'APPROVE' }), session);
      const savedSource = await read(m.PurchaseSourceClaim.findOne({ poLineId: l._id, rrLineId: rrLine?._id }), session);
      if (!approval || !savedSource || !same(savedSource.approvalId, approval._id)) fail('RR_SOURCE', 'Duyệt RR đã đổi so với PO nháp; lưu lại trước khi xác nhận');
      await claim(user, po, l, { rrLineId: id(rrLine._id), approvalId: id(approval._id), enteredQty: l.enteredQty.toString() }, session);
    }
    return { document: await bump(po, session, { workflowStatus: 'OPEN' }) };
  });
}
export async function amendPurchaseOrder(user, poId, input) {
  accountant(user);
  return command(user, 'AMEND_PURCHASE_ORDER', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    if (!['OPEN', 'PARTIAL', 'COMPLETED'].includes(po.workflowStatus)) fail('STATE', 'PO không thể amendment');
    await evidenceFor(user, po._id, input.evidenceIds, session, true);
    const lines = await rows(po._id, session); const events = [];
    for (const r of input.lines) {
      const l = lines.find(l => same(l._id, r.poLineId)); if (!l) throw notFoundError();
      const src = await claim(user, po, l, r, session);
      events.push({ poLineId: l._id, rrLineId: src.line._id, approvalId: src.approval._id, qtyBase: src.qty });
    }
    const event = await save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'AMENDMENT', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, lines: events }, session);
    return { document: await bump(po, session, { ...(input.expectedOn && { 'header.expectedOn': new Date(input.expectedOn) }), ...(events.length && { workflowStatus: 'PARTIAL' }) }), eventId: event._id };
  });
}
export async function supplierConfirmation(user, poId, input) {
  accountant(user);
  return command(user, 'CONFIRM_SUPPLIER_SCHEDULE', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    if (!['OPEN', 'PARTIAL'].includes(po.workflowStatus)) fail('STATE', 'PO không còn mở');
    await evidenceFor(user, po._id, input.evidenceIds, session, true);
    const q = await purchaseOrderQuantities(po, session); const seen = new Set();
    const products = await read(m.Product.find({ _id: { $in: q.map(l => l.productId) } }), session);
    for (const l of input.lines) {
      const current = q.find(r => r.lineId === l.poLineId);
      if (seen.has(l.poLineId) || !current || current.quantityState !== 'KNOWN' || exact(l.qtyBase).gt(exact(current.authorizedOrderedQtyBase))) fail('SCHEDULE', 'Lượng xác nhận NCC không hợp lệ');
      if (products.find(p => same(p._id, current.productId))?.wholeBaseUnits && !exact(l.qtyBase).isInteger()) throw validationError('Số viên xác nhận phải nguyên');
      seen.add(l.poLineId);
    }
    const event = await save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'SUPPLIER_CONFIRMATION', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, lines: input.lines }, session);
    return { document: await bump(po, session), eventId: event._id };
  });
}
export async function requestClose(user, poId, input) {
  accountant(user);
  return command(user, 'REQUEST_PO_REMAINDER_CLOSE', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    if (!['OPEN', 'PARTIAL'].includes(po.workflowStatus)) fail('STATE', 'PO không còn mở');
    await evidenceFor(user, po._id, input.evidenceIds, session, true);
    await validateClose(po, input.lines, session);
    const event = await save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'CLOSE_REQUEST', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, lines: input.lines }, session);
    return { document: await bump(po, session), eventId: event._id };
  });
}
async function validateClose(po, lines, session) {
  const q = await purchaseOrderQuantities(po, session); const seen = new Set();
  const products = await read(m.Product.find({ _id: { $in: q.map(l => l.productId) } }), session);
  const drafts = await read(m.BusinessDocument.find({ documentKind: 'GR_PURCHASE', 'header.purchaseOrderId': po._id, workflowStatus: 'DRAFT' }).select('_id'), session);
  const held = await read(m.DocumentLine.find({ documentId: { $in: drafts.map(d => d._id) } }), session);
  for (const l of lines) {
    const current = q.find(q => same(q.lineId, l.poLineId));
    if (seen.has(l.poLineId) || !current || current.quantityState !== 'KNOWN' || exact(l.qtyBase).gt(exact(current.outstandingQtyBase)) || held.some(r => same(r.details.poLineId, l.poLineId))) fail('CLOSE_SOURCE', 'Phần chốt thiếu vượt nguồn hoặc còn GR nháp xung đột');
    if (products.find(p => same(p._id, current.productId))?.wholeBaseUnits && !exact(l.qtyBase).isInteger()) throw validationError('Số viên chốt thiếu phải nguyên');
    seen.add(l.poLineId);
  }
}
export async function approveClose(user, poId, input) {
  rights(user, 'approve_exception', 'purchase_order', ['OWNER']);
  return command(user, 'APPROVE_PO_REMAINDER_CLOSE', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    const request = await read(m.PurchaseEvent.findOne({ _id: input.requestId, purchaseOrderId: po._id, kind: 'CLOSE_REQUEST' }), session);
    if (!request || request.sourcePoVersion + 1 !== po.version || same(request.actorId, user._id)) fail('CLOSE_APPROVAL', 'Yêu cầu chốt thiếu đã cũ hoặc tự duyệt');
    await evidenceFor(user, po._id, input.evidenceIds, session, true);
    await validateClose(po, request.lines, session);
    const event = await save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'CLOSE_APPROVAL', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: input.evidenceIds, lines: request.lines, relatedEventId: request._id }, session);
    return { document: await bump(po, session), eventId: event._id };
  });
}
export async function executeClose(user, poId, input) {
  accountant(user);
  return command(user, 'EXECUTE_PO_REMAINDER_CLOSE', poId, input, async session => {
    const po = await scoped(user, poId, 'PO', session); version(po, input.expectedVersion);
    const approval = await read(m.PurchaseEvent.findOne({ _id: input.approvalId, purchaseOrderId: po._id, kind: 'CLOSE_APPROVAL' }), session);
    if (!approval || approval.sourcePoVersion + 1 !== po.version) fail('CLOSE_APPROVAL', 'Duyệt chốt thiếu không còn hiện hành');
    await validateClose(po, approval.lines, session);
    const event = await save(m.PurchaseEvent, { purchaseOrderId: po._id, documentId: po._id, kind: 'CLOSE_EXECUTION', sourcePoVersion: po.version, actorId: user._id, reason: input.reason, evidenceIds: approval.evidenceIds, lines: approval.lines, relatedEventId: approval._id }, session);
    // Release only the closed, unreceived allowance. Received authority remains reserved.
    for (const l of approval.lines) {
      let left = exact(l.qtyBase);
      const claims = await read(m.PurchaseSourceClaim.find({ poLineId: l.poLineId }).sort({ _id: 1 }), session);
      for (const c of claims) {
        if (left.isZero()) break;
        const rrLine = await read(m.DocumentLine.findById(c.rrLineId), session);
        if (!rrLine) fail('RR_SOURCE', 'Nguồn claim RR bị thiếu');
        await m.BusinessDocument.updateOne({ _id: rrLine.documentId, documentKind: 'REPLENISHMENT' }, { $inc: { 'header.purchasingVersion': 1 } }, { session });
        const take = exact(c.qtyBase).lt(left) ? exact(c.qtyBase) : left;
        const changed = await m.PurchaseSourceClaim.updateOne({ _id: c._id, version: c.version }, { $set: { qtyBase: exact(c.qtyBase).minus(take).toString() }, $inc: { version: 1 } }, { session });
        if (changed.matchedCount !== 1) fail('RR_SOURCE', 'Claim RR vừa đổi khi chốt thiếu');
        left = left.minus(take);
      }
      if (!left.isZero()) fail('RR_SOURCE', 'Không đủ allowance nguồn để chốt');
    }
    const q = await purchaseOrderQuantities(po, session);
    return { document: await bump(po, session, { workflowStatus: q.every(r => r.quantityState === 'KNOWN' && exact(r.outstandingQtyBase).isZero()) ? 'CLOSED' : 'PARTIAL' }), eventId: event._id };
  });
}
