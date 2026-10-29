import { ApiError } from '../../shared/utils/ApiError.js';
import { BusinessDocument, DocumentLine, DocumentLink, LineLink, Party, StockBalance, StockAccount, Location, Reservation, DefectHold, Evidence, Approval, AuditEvent } from '../../models/index.js';
import { batch, command, copyLine, createCommand, dec, document, dto, evidenceFor, guardLocations, movement, requireWarehouse, same, scopedDocument, warehouseScope } from './workflow.shared.js';

export async function listSupplierReturns(user, filters) {
  const query = { documentKind: 'SUPPLIER_RETURN', ...warehouseScope(user) };
  if (filters.supplierId) query['header.supplierId'] = filters.supplierId;
  if (filters.status) query.workflowStatus = filters.status;
  if (filters.search) query.$or = ['documentNo', 'note', 'header.agreementReference'].map((key) => ({ [key]: { $regex: filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }));
  const [items, total] = await Promise.all([BusinessDocument.find(query).sort({ createdAt: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(), BusinessDocument.countDocuments(query)]);
  return dto({ items, total, page: filters.page, limit: filters.limit });
}
export async function supplierReturnDetail(user, id) {
  const doc = await scopedDocument(user, id, 'SUPPLIER_RETURN');
  const [lines, links, evidence, history, agreements] = await Promise.all([DocumentLine.find({ documentId: id }).lean(), DocumentLink.find({ parentDocumentId: id }).lean(), Evidence.find({ documentId: id }).lean(), AuditEvent.find({ documentId: id }).sort({ eventAt: 1 }).lean(), Approval.find({ documentId: id }).sort({ decidedAt: 1 }).lean()]);
  const linkedDocuments = await Promise.all(links.map(async (link) => ({ ...link, document: await BusinessDocument.findById(link.childDocumentId).lean(), lines: await DocumentLine.find({ documentId: link.childDocumentId }).lean() })));
  return dto({ ...doc.toObject(), lines, evidence, history, agreements, linkedDocuments });
}
export async function createSupplierReturn(user, input) {
  requireWarehouse(user, input.warehouseId);
  return createCommand(user, input, 'SUPPLIER_RETURN_CREATE', async (session) => {
    const supplier = await Party.findOne({ _id: input.supplierId, kind: 'SUPPLIER', isActive: true }).session(session);
    if (!supplier) throw new ApiError(400, 'Nhà cung cấp không hoạt động');
    const doc = await document('SUPPLIER_RETURN', user, { warehouseId: input.warehouseId, supplierId: supplier._id }, session, 'AGREEMENT_PENDING', input.note);
    let number = 0;
    for (const item of input.lines) {
      const source = await DocumentLine.findById(item.originLineId).session(session);
      const origin = source && await BusinessDocument.findById(source.documentId).session(session);
      const balance = await StockBalance.findById(item.balanceId).session(session);
      const account = balance && await StockAccount.findById(balance.accountId).session(session);
      const location = account?.locationId && await Location.findById(account.locationId).session(session);
      if (!source || !origin || !['GR_PURCHASE', 'DEFECT_CASE'].includes(origin.documentKind) || !balance || !same(source.lotId, balance.lotId) || !location || !same(location.warehouseId, input.warehouseId)) throw new ApiError(400, 'Nguồn trả phải khớp lô và tồn tại kho được chọn');
      if (origin.documentKind === 'GR_PURCHASE' && origin.workflowStatus !== 'POSTED') throw new ApiError(409, 'Phiếu nhập nguồn chưa ghi sổ');
      await guardLocations([location._id], session);
      // Verify the supplier against the source receipt's PO, or the defect's traced receipt.
      let receipt = origin;
      if (origin.documentKind === 'DEFECT_CASE') {
        const sourceLine = origin.header.sourceLineId && await DocumentLine.findById(origin.header.sourceLineId).session(session);
        receipt = sourceLine && await BusinessDocument.findById(sourceLine.documentId).session(session);
      }
      let frontier = receipt ? (await DocumentLine.find({ documentId: receipt._id }).select('_id').session(session)).map((x) => x._id) : [];
      const poIds = [];
      const visited = new Set();
      for (let depth = 0; frontier.length && depth < 8; depth++) {
        frontier = frontier.filter((x) => !visited.has(String(x)));
        frontier.forEach((x) => visited.add(String(x)));
        const sourceLinks = await LineLink.find({ targetLineId: { $in: frontier } }).session(session);
        const parents = await DocumentLine.find({ _id: { $in: sourceLinks.map((x) => x.sourceLineId) } }).session(session);
        poIds.push(...parents.map((x) => x.documentId));
        frontier = parents.map((x) => x._id);
      }
      const purchase = await BusinessDocument.findOne({ _id: { $in: poIds }, documentKind: 'PO', 'header.supplierId': supplier._id }).session(session);
      if (!purchase) throw new ApiError(409, 'Nguồn chưa truy được phiếu nhập và đơn mua của nhà cung cấp này');
      const sourceChanged = await BusinessDocument.updateOne({ _id: origin._id, version: origin.version }, { $inc: { version: 1 } }, { session });
      if (sourceChanged.modifiedCount !== 1) throw new ApiError(409, 'Nguồn trả vừa thay đổi');
      const previousProposals = await DocumentLine.find({ lineKind: 'SUPPLIER_RETURN', 'details.originLineId': source._id }).session(session);
      if (previousProposals.reduce((n, x) => n.plus(dec(x.details.phase === 'VERIFIED' ? x.details.agreedQty : x.qtyBase)), dec(item.qtyBase)).gt(dec(source.qtyBase))) throw new ApiError(409, 'Tổng lượng đề xuất trả vượt nguồn gốc');
      const reserved = await Reservation.find({ balanceId: balance._id, status: 'ACTIVE' }).session(session);
      const available = dec(balance.qtyBase).minus(reserved.reduce((n, row) => n.plus(dec(row.qtyBase)), dec('0')));
      if (dec(item.qtyBase).gt(available) || dec(item.qtyBase).gt(dec(source.qtyBase))) throw new ApiError(409, 'Số lượng trả vượt nguồn hoặc tồn chưa giữ chỗ');
      const owner = await Party.findById(balance.ownerPartyId).session(session);
      if (!['STORE', 'SUPPLIER'].includes(owner?.kind) || (owner.kind === 'SUPPLIER' && !same(owner._id, supplier._id))) throw new ApiError(409, 'Không được trả hàng thuộc khách hoặc nhà cung cấp khác');
      const updated = await StockBalance.updateOne({ _id: balance._id, version: balance.version }, { $inc: { version: 1 } }, { session });
      if (updated.modifiedCount !== 1) throw new ApiError(409, 'Tồn đã thay đổi');
      const line = await copyLine(source, doc, item.qtyBase, session, 'SUPPLIER_RETURN', { phase: 'PROPOSED', originLineId: source._id, sourceBalanceId: balance._id, ownerPartyId: balance.ownerPartyId }, ++number);
      await Reservation.create([{ demandLineId: line._id, executionLineId: line._id, balanceId: balance._id, qtyBase: item.qtyBase, status: 'ACTIVE' }], { session });
      await LineLink.create([{ sourceLineId: source._id, targetLineId: line._id, relationCode: 'SUPPLIER_RETURN_SOURCE', linkedQty: item.qtyBase }], { session });
      if (balance.qualityCode !== 'GOOD' && !await DefectHold.exists({ balanceId: balance._id, status: 'ACTIVE' }).session(session)) throw new ApiError(409, 'Hàng nghi lỗi cần hồ sơ cách ly và chứng cứ trước khi đề xuất trả');
    }
    return doc;
  });
}
export async function supplierAgreement(user, id, input) {
  return command(user, id, 'SUPPLIER_RETURN', input, 'SUPPLIER_AGREEMENT', async (doc, session) => {
    if (doc.workflowStatus !== 'AGREEMENT_PENDING') throw new ApiError(409, 'Phiếu không còn chờ thỏa thuận');
    await evidenceFor(id, input.evidenceIds, session);
    const lines = await DocumentLine.find({ documentId: id }).session(session);
    if (lines.length !== input.lines.length || lines.some((line) => !input.lines.some((x) => same(x.lineId, line._id)))) throw new ApiError(400, 'Cần ghi thỏa thuận cho từng dòng');
    const approvalLines = [];
    for (const line of lines) {
      const fact = input.lines.find((x) => same(x.lineId, line._id));
      if (dec(fact.qtyBase).gt(dec(line.qtyBase))) throw new ApiError(409, 'Lượng thỏa thuận vượt đề xuất');
      Object.assign(line.details, { phase: 'VERIFIED', agreedQty: fact.qtyBase, agreementVersion: doc.version, agreementVerifiedBy: user._id, agreementVerifiedAt: new Date(), agreementEvidenceId: input.evidenceIds[0] });
      await line.save({ session });
      approvalLines.push({ lineId: line._id, approvedQty: fact.qtyBase, outcome: 'SUPPLIER_AGREEMENT' });
      const reservation = await Reservation.findOne({ demandLineId: line._id, status: 'ACTIVE' }).session(session);
      if (reservation) { reservation.status = dec(fact.qtyBase).isZero() ? 'RELEASED' : 'ACTIVE'; reservation.qtyBase = dec(fact.qtyBase).isZero() ? reservation.qtyBase : fact.qtyBase; await reservation.save({ session }); }
    }
    await Approval.create([{ documentId: id, documentVersion: doc.version, decisionKind: 'SUPPLIER_AGREEMENT', decision: 'APPROVE', requestedBy: doc.createdBy, decidedBy: user._id, reason: input.reference, lines: approvalLines }], { session });
    await BusinessDocument.updateOne({ _id: id, documentKind: 'SUPPLIER_RETURN' }, { $set: { 'header.agreementReference': input.reference, 'header.agreedAt': new Date() } }, { session });
    return { status: input.lines.some((x) => dec(x.qtyBase).gt(0)) ? 'READY' : 'REFUSED' };
  });
}
export async function dispatchSupplierReturn(user, id, input) {
  return command(user, id, 'SUPPLIER_RETURN', input, 'SUPPLIER_RETURN_DISPATCH', async (doc, session) => {
    requireWarehouse(user, doc.header.warehouseId);
    if (!['READY', 'PARTIAL'].includes(doc.workflowStatus)) throw new ApiError(409, 'Cần thỏa thuận đã được Kế toán xác minh');
    await evidenceFor(id, input.evidenceIds, session);
    const dispatch = await document('GI_SUPPLIER_RETURN', user, { warehouseId: doc.header.warehouseId }, session, 'POSTED', input.note);
    const posting = await batch(dispatch, user, input, 'SUPPLIER_RETURN_DISPATCH', session);
    let lineNo = 0;
    for (const entry of input.lines) {
      const line = await DocumentLine.findOne({ _id: entry.lineId, documentId: id, lineKind: 'SUPPLIER_RETURN' }).session(session);
      if (!line || line.details.phase !== 'VERIFIED') throw new ApiError(409, 'Dòng chưa được xác minh');
      const reservation = await Reservation.findOne({ demandLineId: line._id, status: 'ACTIVE' }).session(session);
      if (!reservation || dec(entry.qtyBase).gt(dec(reservation.qtyBase))) throw new ApiError(409, 'Lượng thực xuất vượt phần thỏa thuận còn lại');
      const balance = await StockBalance.findById(reservation.balanceId).session(session);
      const account = await StockAccount.findById(balance.accountId).session(session);
      await guardLocations([account.locationId], session);
      const physical = await copyLine(line, dispatch, entry.qtyBase, session, 'STANDARD', undefined, ++lineNo);
      await movement(posting, dispatch, physical, balance, null, entry.qtyBase, session);
      await LineLink.create([{ sourceLineId: line._id, targetLineId: physical._id, relationCode: 'SUPPLIER_RETURN_DISPATCH', linkedQty: entry.qtyBase }], { session });
      const remaining = dec(reservation.qtyBase).minus(dec(entry.qtyBase));
      if (remaining.isZero()) reservation.status = 'CONSUMED'; else reservation.qtyBase = remaining.toString();
      await reservation.save({ session });
      const hold = await DefectHold.findOne({ balanceId: balance._id, status: 'ACTIVE' }).session(session);
      if (hold) {
        const remainingHold = dec(hold.qtyBase).minus(dec(entry.qtyBase));
        if (remainingHold.lt(0)) throw new ApiError(409, 'Thực xuất vượt lượng cách ly');
        await DefectHold.updateOne({ _id: hold._id }, { $set: { status: 'RESOLVED' } }, { session });
        if (remainingHold.gt(0)) await DefectHold.create([{ defectDocumentId: hold.defectDocumentId, balanceId: hold.balanceId, qtyBase: remainingHold.toString(), evidenceId: hold.evidenceId, recordedBy: user._id, status: 'ACTIVE' }], { session });
      }
    }
    await DocumentLink.create([{ parentDocumentId: id, childDocumentId: dispatch._id, relationCode: 'SUPPLIER_RETURN_DISPATCH' }], { session });
    const sourceLines = await DocumentLine.find({ documentId: id }).session(session);
    const remaining = await Reservation.exists({ demandLineId: { $in: sourceLines.map((x) => x._id) }, status: 'ACTIVE' }).session(session);
    return { status: remaining ? 'PARTIAL' : 'DISPATCHED', dispatchId: String(dispatch._id) };
  });
}
export async function acknowledgeSupplierReturn(user, id, input) {
  return command(user, id, 'SUPPLIER_RETURN', input, 'SUPPLIER_RETURN_ACK', async (doc, session) => {
    if (!['PARTIAL', 'DISPATCHED', 'ACKNOWLEDGED'].includes(doc.workflowStatus)) throw new ApiError(409, 'Chưa có hàng thực xuất để ghi nhận biên nhận');
    await evidenceFor(id, input.evidenceIds, session);
    const links = await DocumentLink.find({ parentDocumentId: id, relationCode: 'SUPPLIER_RETURN_DISPATCH' }).session(session);
    const ack = await document('SUPPLIER_ACK', user, null, session, 'CONFIRMED', input.note);
    let lineNo = 0;
    for (const entry of input.lines) {
      const source = await DocumentLine.findOne({ _id: entry.lineId, documentId: { $in: links.map((x) => x.childDocumentId) } }).session(session);
      if (!source) throw new ApiError(400, 'Biên nhận phải tham chiếu dòng thực xuất của phiếu này');
      const previous = await DocumentLine.find({ lineKind: 'SUPPLIER_ACK', 'details.dispatchLineId': source._id }).session(session);
      const total = previous.reduce((n, row) => n.plus(dec(row.qtyBase)), dec(entry.qtyBase));
      if (total.gt(dec(source.qtyBase))) throw new ApiError(409, 'Biên nhận vượt lượng thực xuất chưa đối chiếu');
      await copyLine(source, ack, entry.qtyBase, session, 'SUPPLIER_ACK', { dispatchLineId: source._id, outcome: entry.outcome, acknowledgedAt: new Date() }, ++lineNo);
    }
    await DocumentLink.create([{ parentDocumentId: id, childDocumentId: ack._id, relationCode: 'SUPPLIER_RETURN_ACK' }], { session });
    return { status: doc.workflowStatus === 'PARTIAL' ? 'PARTIAL' : 'ACKNOWLEDGED', acknowledgementId: String(ack._id) };
  });
}
export async function closeSupplierReturn(user, id, input) {
  return command(user, id, 'SUPPLIER_RETURN', input, 'SUPPLIER_RETURN_CLOSE', async (doc, session) => {
    if (doc.workflowStatus !== 'ACKNOWLEDGED') throw new ApiError(409, 'Cần xuất hết và ghi biên nhận trước khi đối chiếu đóng');
    const links = await DocumentLink.find({ parentDocumentId: id, relationCode: 'SUPPLIER_RETURN_DISPATCH' }).session(session);
    const dispatched = await DocumentLine.find({ documentId: { $in: links.map((x) => x.childDocumentId) } }).session(session);
    for (const line of dispatched) {
      const acks = await DocumentLine.find({ lineKind: 'SUPPLIER_ACK', 'details.dispatchLineId': line._id }).session(session);
      if (!acks.reduce((n, x) => n.plus(dec(x.qtyBase)), dec('0')).eq(dec(line.qtyBase)) || acks.some((x) => x.details.outcome !== 'ACCEPTED')) throw new ApiError(409, 'Còn lượng chưa nhận hoặc tranh chấp; giữ phiếu mở');
    }
    if (!dispatched.length) throw new ApiError(409, 'Phiếu chưa có thực xuất');
    return { status: 'COMPLETED', reconciliationNote: input.note };
  });
}
