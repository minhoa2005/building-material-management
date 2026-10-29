import { BusinessDocument, DocumentLine, DocumentLink, LineLink, Approval, CustomerReturnAssessment, ReturnSourceClaim, ReturnSourceGuard, DemandReopening, StockBalance, StockMovement, StockAccount, Location, Party, Evidence } from '../../models/index.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { getSourceContext } from '../customer-returns/customer-return.service.js';
import { batch, command, copyLine, createCommand, dec, document, evidenceFor, guardLocations, movement, oid, requireWarehouse, same, targetBalance } from './workflow.shared.js';

export async function reassessCustomerReturn(user, id, input) {
  return command(user, id, 'CUSTOMER_RETURN', input, 'CUSTOMER_RETURN_REASSESS', async (doc, session) => {
    requireWarehouse(user, doc.header.warehouseId);
    if (doc.workflowStatus !== 'INSPECTED') throw new ApiError(409, 'Chỉ bổ sung kiểm tra trước quyết định chấp nhận');
    await evidenceFor(id, input.evidenceIds, session);
    const sourceLines = await DocumentLine.find({ documentId: id }).session(session);
    if (sourceLines.length !== input.lines.length || new Set(input.lines.map((x) => x.returnLineId)).size !== input.lines.length) throw new ApiError(400, 'Cần đánh giá từng dòng đúng một lần');
    for (const facts of input.lines) {
      const line = sourceLines.find((x) => same(x._id, facts.returnLineId));
      if (!line) throw new ApiError(400, 'Dòng kiểm tra không thuộc hồ sơ');
      const physical = await LineLink.find({ sourceLineId: line._id, relationCode: 'CR_CUSTODY_RECEIPT' }).session(session);
      const qty = physical.reduce((n, x) => n.plus(dec(x.linkedQty)), dec('0'));
      if (!qty.eq(dec(facts.qtyReceived))) throw new ApiError(409, 'Bổ sung đánh giá không được sửa lượng đã giữ hộ thực tế');
      const latest = await CustomerReturnAssessment.findOne({ returnLineId: line._id }).sort({ assessmentNo: -1 }).session(session);
      const excluded = facts.installationStatus === 'INSTALLED' || facts.damageCause === 'CUSTOMER' || facts.deadlineStatus === 'EXCEEDED';
      const unknown = [facts.packagingCondition, facts.installationStatus, facts.damageCause, facts.deadlineStatus].includes('UNKNOWN');
      const { qtyReceived, ...conditions } = facts;
      await CustomerReturnAssessment.create([{ ...conditions, assessmentNo: (latest?.assessmentNo || 0) + 1, documentVersion: doc.version + 1, eligibilityStatus: excluded ? 'INELIGIBLE' : unknown ? 'PENDING' : 'CASE_REVIEW', assessedBy: user._id }], { session });
    }
    return { status: 'INSPECTED' };
  });
}

export async function handBackCustomerReturn(user, id, input) {
  return command(user, id, 'CUSTOMER_RETURN', input, 'CUSTOMER_RETURN_HANDBACK', async (doc, session) => {
    requireWarehouse(user, doc.header.warehouseId);
    if (doc.workflowStatus !== 'REJECTED') throw new ApiError(409, 'Chỉ bàn giao lại hàng khách bị từ chối');
    await evidenceFor(id, input.evidenceIds, session);
    const release = await document('CUSTODY_RELEASE', user, null, session, 'POSTED', input.note);
    const posting = await batch(release, user, input, 'CUSTOMER_RETURN_HANDBACK', session);
    let lineNo = 0;
    for (const entry of input.lines) {
      const source = await DocumentLine.findOne({ _id: entry.lineId, documentId: id }).session(session);
      if (!source) throw new ApiError(404, 'Dòng không thuộc phiếu trả');
      const links = await LineLink.find({ sourceLineId: source._id, relationCode: 'CR_CUSTODY_RECEIPT' }).session(session);
      const arrived = links.reduce((n, x) => n.plus(dec(x.linkedQty)), dec('0'));
      const releases = await LineLink.find({ sourceLineId: source._id, relationCode: 'CR_HANDBACK' }).session(session);
      const total = releases.reduce((n, x) => n.plus(dec(x.linkedQty)), dec(entry.qtyBase));
      if (total.gt(arrived)) throw new ApiError(409, 'Bàn giao lại vượt lượng giữ hộ còn lại');
      const arrival = await StockMovement.findOne({ lineId: { $in: links.map((x) => x.targetLineId) } }).session(session);
      const from = arrival && await StockBalance.findOne({ _id: arrival.toBalanceId, ownerPartyId: doc.header.customerId }).session(session);
      if (!from) throw new ApiError(409, 'Không tìm thấy tồn giữ hộ của khách');
      const account = await StockAccount.findById(from.accountId).session(session);
      await guardLocations([account.locationId], session);
      const line = await copyLine(source, release, entry.qtyBase, session, 'STANDARD', undefined, ++lineNo);
      await movement(posting, release, line, from, null, entry.qtyBase, session);
      await LineLink.create([{ sourceLineId: source._id, targetLineId: line._id, relationCode: 'CR_HANDBACK', linkedQty: entry.qtyBase }], { session });
      if (total.eq(arrived)) await ReturnSourceClaim.updateMany({ requestLineId: source._id, status: 'OPEN' }, { $set: { status: 'RELEASED' } }, { session });
    }
    await DocumentLink.create([{ parentDocumentId: id, childDocumentId: release._id, relationCode: 'CUSTOMER_RETURN_HANDBACK' }], { session });
    return { status: 'REJECTED', releaseId: String(release._id) };
  });
}

export async function receiveCustomerReturn(user, id, input) {
  return command(user, id, 'CUSTOMER_RETURN', input, 'CUSTOMER_RETURN_RECEIPT', async (doc, session) => {
    requireWarehouse(user, doc.header.warehouseId);
    if (!['ACCEPTED', 'PARTIAL'].includes(doc.workflowStatus)) throw new ApiError(409, 'Cần quyết định chấp nhận hợp lệ trước khi nhập sở hữu');
    await evidenceFor(id, input.evidenceIds, session);
    const approval = await Approval.findOne({ documentId: id, decision: 'APPROVE', decisionKind: { $in: ['STANDARD_ACCEPTANCE', 'EXCEPTION_APPROVAL'] } }).sort({ documentVersion: -1 }).session(session);
    if (!approval || (doc.workflowStatus === 'ACCEPTED' && approval.documentVersion !== doc.version - 1)) throw new ApiError(409, 'Quyết định không còn đúng phiên bản');
    const store = await Party.findOne({ kind: 'STORE' }).session(session);
    if (!store) throw new ApiError(409, 'Thiếu chủ sở hữu cửa hàng');
    const receipt = await document('GR_CUSTOMER_RETURN', user, { warehouseId: doc.header.warehouseId }, session, 'POSTED', input.note);
    const posting = await batch(receipt, user, input, 'CUSTOMER_RETURN_RECEIPT', session);
    let lineNo = 0;
    for (const entry of input.lines) {
      const source = await DocumentLine.findOne({ _id: entry.lineId, documentId: id }).session(session);
      const approved = approval.lines.find((x) => same(x.lineId, entry.lineId));
      const assessment = source && await CustomerReturnAssessment.findOne({ returnLineId: source._id }).sort({ assessmentNo: -1 }).session(session);
      if (!source || !approved || assessment?.eligibilityStatus !== 'CASE_REVIEW') throw new ApiError(409, 'Dòng chưa đủ điều kiện hoặc chưa được chấp nhận');
      const prior = await LineLink.find({ sourceLineId: source._id, relationCode: 'CR_OWNED_RECEIPT' }).session(session);
      const posted = prior.reduce((n, x) => n.plus(dec(x.linkedQty)), dec('0'));
      if (posted.plus(dec(entry.qtyBase)).gt(dec(approved.approvedQty))) throw new ApiError(409, 'Nhập vượt lượng được chấp nhận còn lại');
      const location = await Location.findOne({ _id: entry.locationId, warehouseId: doc.header.warehouseId, isActive: true, kind: entry.qualityCode === 'GOOD' ? 'RECEIVING' : 'QUARANTINE' }).session(session);
      if (!location) throw new ApiError(400, 'Hàng tốt vào khu nhận; hàng lỗi vào khu cách ly cùng kho');
      if (assessment.damageCause === 'SUPPLIER' && entry.qualityCode === 'GOOD') throw new ApiError(409, 'Hàng đã xác định hỏng không thể nhập phẩm cấp tốt');
      const custodyLinks = await LineLink.find({ sourceLineId: source._id, relationCode: 'CR_CUSTODY_RECEIPT' }).session(session);
      const custodyMovement = await StockMovement.findOne({ lineId: { $in: custodyLinks.map((x) => x.targetLineId) } }).session(session);
      const from = custodyMovement && await StockBalance.findById(custodyMovement.toBalanceId).session(session);
      if (!from || !same(from.ownerPartyId, doc.header.customerId)) throw new ApiError(409, 'Không tìm thấy lượng giữ hộ của khách');
      const fromAccount = await StockAccount.findById(from.accountId).session(session);
      await guardLocations([fromAccount.locationId, location._id], session);
      const to = await targetBalance(location._id, source.lotId, entry.qualityCode, store._id, session);
      const line = await copyLine(source, receipt, entry.qtyBase, session, 'STANDARD', undefined, ++lineNo);
      await movement(posting, receipt, line, from, to, entry.qtyBase, session);
      await LineLink.create([{ sourceLineId: source._id, targetLineId: line._id, relationCode: 'CR_OWNED_RECEIPT', linkedQty: entry.qtyBase }], { session });
      if (posted.plus(dec(entry.qtyBase)).eq(dec(approved.approvedQty))) await ReturnSourceClaim.updateMany({ requestLineId: source._id, status: 'OPEN' }, { $set: { status: 'CONSUMED', consumedQty: approved.approvedQty } }, { session });
    }
    await DocumentLink.create([{ parentDocumentId: id, childDocumentId: receipt._id, relationCode: 'CUSTOMER_RETURN_RECEIPT' }], { session });
    const open = await ReturnSourceClaim.exists({ requestLineId: { $in: approval.lines.map((x) => x.lineId) }, status: 'OPEN' }).session(session);
    return { status: open ? 'PARTIAL' : 'RECEIVED', receiptId: String(receipt._id) };
  });
}

export async function createFailedDelivery(user, input, uploaded) {
  requireWarehouse(user, input.warehouseId);
  return createCommand(user, input, 'FAILED_DELIVERY_CREATE', async (session, operationId) => {
    const evidenceId = oid();
    const doc = await document('FAILED_DELIVERY', user, { warehouseId: input.warehouseId, failureEvidenceId: evidenceId, reason: input.note }, session, 'OPEN', input.note);
    await Evidence.create([{ _id: evidenceId, documentId: doc._id, ...uploaded, uploadedBy: user._id }], { session });
    // The operation row is inserted by createCommand after the source claims.
    let lineNo = 0;
    for (const entry of [...input.lines].sort((a, b) => a.salesIssueLineId.localeCompare(b.salesIssueLineId))) {
      const issue = await DocumentLine.findById(entry.salesIssueLineId).session(session);
      if (!issue) throw new ApiError(404, 'Không tìm thấy dòng thực xuất');
      await ReturnSourceGuard.findOneAndUpdate({ salesIssueLineId: issue._id }, { $inc: { version: 1 } }, { upsert: true, new: true, session });
      const context = await getSourceContext(issue, session);
      if (!same(context.issueDocument.header.warehouseId, input.warehouseId)) throw new ApiError(403, 'Nguồn xuất không thuộc kho nhận quay về');
      const claims = await ReturnSourceClaim.find({ salesIssueLineId: issue._id, claimKind: 'FD', status: { $in: ['OPEN', 'CONSUMED'] } }).session(session);
      const used = claims.reduce((n, x) => n.plus(dec(x.qtyBase)), dec(context.deliveredQty));
      if (used.plus(dec(entry.qtyBase)).gt(context.issuedQty)) throw new ApiError(409, 'FD vượt lượng đã xuất nhưng khách chưa nhận còn lại');
      const line = await copyLine(issue, doc, entry.qtyBase, session, 'FAILED_DELIVERY', { salesIssueLineId: issue._id }, ++lineNo);
      await ReturnSourceClaim.create([{ requestLineId: line._id, salesIssueLineId: issue._id, claimKind: 'FD', qtyBase: entry.qtyBase, status: 'OPEN', operationId }], { session });
      await LineLink.create([{ sourceLineId: issue._id, targetLineId: line._id, relationCode: 'FAILED_DELIVERY_SOURCE', linkedQty: entry.qtyBase }], { session });
      await DocumentLink.updateOne({ parentDocumentId: doc._id, childDocumentId: issue.documentId, relationCode: 'RETURN_SOURCE' }, { $setOnInsert: { parentDocumentId: doc._id, childDocumentId: issue.documentId, relationCode: 'RETURN_SOURCE' } }, { upsert: true, session });
    }
    return doc;
  });
}

export async function inspectFailedDelivery(user, id, input) {
  return command(user, id, 'FAILED_DELIVERY', input, 'FAILED_DELIVERY_INSPECT', async (doc, session) => {
    requireWarehouse(user, doc.header.warehouseId);
    if (!['OPEN', 'INSPECTED', 'PARTIAL'].includes(doc.workflowStatus)) throw new ApiError(409, 'FD không còn chờ kiểm tra');
    await evidenceFor(id, input.evidenceIds, session);
    const lines = await DocumentLine.find({ documentId: id }).session(session);
    if (input.lines.some((entry) => !lines.some((x) => same(x._id, entry.lineId)))) throw new ApiError(400, 'Dòng kiểm tra không thuộc FD');
    const priorLinks = await DocumentLink.find({ parentDocumentId: id, relationCode: 'FAILED_DELIVERY_INSPECTION' }).session(session);
    const inspection = await document('INSPECTION', user, null, session, 'POSTED', input.note);
    let lineNo = 0;
    for (const entry of input.lines) {
      const source = lines.find((x) => same(x._id, entry.lineId));
      const priorInspections = await DocumentLine.find({ documentId: { $in: priorLinks.map((x) => x.childDocumentId) }, 'details.inspectedSourceLineId': source._id }).session(session);
      if (priorInspections.reduce((n, x) => n.plus(dec(x.qtyBase)), dec(entry.qtyBase)).gt(dec(source.qtyBase))) throw new ApiError(409, 'Tổng lượng kiểm thực về vượt FD');
      await copyLine(source, inspection, entry.qtyBase, session, 'INSPECTION', { inspectedSourceLineId: source._id, qualityCode: entry.qualityCode, ownershipDecision: 'ACCEPT', inspectedBy: user._id, inspectedAt: new Date(), packagingCondition: entry.packagingCondition }, ++lineNo);
    }
    await DocumentLink.create([{ parentDocumentId: id, childDocumentId: inspection._id, relationCode: 'FAILED_DELIVERY_INSPECTION' }], { session });
    return { status: 'INSPECTED', inspectionId: String(inspection._id) };
  });
}

export async function receiveFailedDelivery(user, id, input) {
  return command(user, id, 'FAILED_DELIVERY', input, 'FAILED_DELIVERY_RECEIPT', async (doc, session) => {
    requireWarehouse(user, doc.header.warehouseId);
    if (!['INSPECTED', 'PARTIAL'].includes(doc.workflowStatus)) throw new ApiError(409, 'Cần kiểm thực tế trước khi nhận FD');
    await evidenceFor(id, input.evidenceIds, session);
    const store = await Party.findOne({ kind: 'STORE' }).session(session);
    if (!store) throw new ApiError(409, 'Thiếu chủ sở hữu cửa hàng');
    const receipt = await document('GR_FAILED_DELIVERY', user, { warehouseId: doc.header.warehouseId }, session, 'POSTED', input.note);
    const posting = await batch(receipt, user, input, 'FAILED_DELIVERY_RECEIPT', session);
    const inspections = await DocumentLink.find({ parentDocumentId: id, relationCode: 'FAILED_DELIVERY_INSPECTION' }).session(session);
    let lineNo = 0;
    for (const entry of input.lines) {
      const source = await DocumentLine.findOne({ _id: entry.lineId, documentId: id }).session(session);
      if (!source) throw new ApiError(404, 'Dòng FD không tồn tại');
      const inspected = await DocumentLine.find({ documentId: { $in: inspections.map((x) => x.childDocumentId) }, 'details.inspectedSourceLineId': source._id, 'details.qualityCode': entry.qualityCode }).session(session);
      if (!inspected.length) throw new ApiError(409, 'Phẩm cấp nhận phải khớp kiểm tra');
      const previous = await LineLink.find({ sourceLineId: source._id, relationCode: 'FD_RECEIPT' }).session(session);
      const received = previous.reduce((n, x) => n.plus(dec(x.linkedQty)), dec(entry.qtyBase));
      const priorReceipts = await DocumentLine.find({ lineKind: 'FAILED_DELIVERY_RECEIPT', 'details.failedDeliveryLineId': source._id }).session(session);
      const remainingByInspection = inspected.map((inspection) => ({ inspection, quantity: dec(inspection.qtyBase).minus(priorReceipts.filter((x) => same(x.details.inspectionLineId, inspection._id)).reduce((n, x) => n.plus(dec(x.qtyBase)), dec('0'))) }));
      if (dec(entry.qtyBase).gt(remainingByInspection.reduce((n, x) => n.plus(x.quantity), dec('0')))) throw new ApiError(409, 'Nhận vượt lượng đã kiểm thực về theo phẩm cấp');
      const issue = await DocumentLine.findById(source.details.salesIssueLineId).session(session);
      await ReturnSourceGuard.findOneAndUpdate({ salesIssueLineId: issue._id }, { $inc: { version: 1 } }, { upsert: true, new: true, session });
      const context = await getSourceContext(issue, session);
      const location = await Location.findOne({ _id: entry.locationId, warehouseId: doc.header.warehouseId, isActive: true, kind: entry.qualityCode === 'GOOD' ? 'RECEIVING' : 'QUARANTINE' }).session(session);
      if (!location) throw new ApiError(400, 'Chọn vị trí nhận hoặc cách ly đúng phẩm cấp');
      await guardLocations([location._id], session);
      const to = await targetBalance(location._id, source.lotId, entry.qualityCode, store._id, session);
      const claim = await ReturnSourceClaim.findOne({ requestLineId: source._id, status: 'OPEN' }).session(session);
      if (!claim) throw new ApiError(409, 'Không còn lượng FD đã giữ nguồn');
      let remaining = dec(entry.qtyBase);
      for (const portion of remainingByInspection) {
        if (remaining.isZero()) break;
        if (portion.quantity.lte(0)) continue;
        const quantity = remaining.lt(portion.quantity) ? remaining : portion.quantity;
        const line = await copyLine(source, receipt, quantity.toString(), session, 'FAILED_DELIVERY_RECEIPT', { failedDeliveryLineId: source._id, salesIssueLineId: issue._id, inspectionLineId: portion.inspection._id, claimId: claim._id }, ++lineNo);
        await movement(posting, receipt, line, null, to, quantity.toString(), session);
        await LineLink.create([{ sourceLineId: source._id, targetLineId: line._id, relationCode: 'FD_RECEIPT', linkedQty: quantity.toString() }], { session });
        await DemandReopening.create([{ receiptLineId: line._id, salesOrderLineId: context.requestLine.details.salesOrderLineId, issueRequestLineId: context.requestLine._id, outboundDeliveryLineId: context.outboundLine._id, reopenedQty: quantity.toString(), sourceVersion: context.salesOrder.version, postingBatchId: posting._id }], { session });
        remaining = remaining.minus(quantity);
      }
      for (const parent of [context.salesOrder, context.requestDocument, context.outboundDocument]) {
        const updated = await BusinessDocument.updateOne({ _id: parent._id, version: parent.version }, { $set: { workflowStatus: parent.documentKind === 'SALES_ORDER' ? 'IN_PROGRESS' : 'OPEN' }, $inc: { version: 1 } }, { session });
        if (updated.modifiedCount !== 1) throw new ApiError(409, 'Nguồn bán đã đổi; hủy toàn bộ lần nhập và thử lại');
      }
      if (received.eq(dec(source.qtyBase))) await ReturnSourceClaim.updateOne({ _id: claim._id }, { $set: { status: 'CONSUMED' } }, { session });
    }
    await DocumentLink.create([{ parentDocumentId: id, childDocumentId: receipt._id, relationCode: 'FAILED_DELIVERY_RECEIPT' }], { session });
    const sourceLines = await DocumentLine.find({ documentId: id }).session(session);
    const open = await ReturnSourceClaim.exists({ requestLineId: { $in: sourceLines.map((x) => x._id) }, status: 'OPEN' }).session(session);
    return { status: open ? 'PARTIAL' : 'RECEIVED', receiptId: String(receipt._id) };
  });
}
