import mongoose from 'mongoose';
import {
  BusinessDocument, DocumentLine, ExternalReference, ExternalReferenceLine,
  SalesOrderCancellation, DemandReopening, OdCommitmentTransfer, Reservation,
  LineLink, Evidence, PostingBatch, StockMovement,
} from '../../models/index.js';
import { currentRole, rolePermissions } from '../../shared/utils/userRole.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { exact } from '../../models/model-utils.js';
import { cloudinary } from '../../config/cloudinary.js';

const id = (v) => v == null ? null : String(v._id ?? v);
const ids = (values) => values.map((v) => v._id);
const same = (a, b) => id(a) === id(b);
const read = (query, session) => query.session(session).lean();
const missing = () => { throw new ApiError(404, 'Không tìm thấy chứng từ trong phạm vi được phép'); };
const qty = (rows) => rows.reduce((sum, row) => sum.plus(exact(row.qtyBase)), exact('0')).toFixed();
const hasWarehouse = (user, warehouse) => (user.warehouseIds ?? []).some((value) => same(value, warehouse));
const docDto = (doc) => ({ id: id(doc), documentNo: doc.documentNo, documentKind: doc.documentKind, status: doc.workflowStatus, version: doc.version, createdAt: doc.createdAt });
const lineDto = (line) => ({ id: id(line), lineNo: line.lineNo, productId: id(line.productId), productName: line.productNameSnapshot,
  lotId: id(line.lotId), enteredQty: line.enteredQty.toString(), conversionId: id(line.conversionId), conversionSnapshot: line.conversionSnapshot.toString(), qtyBase: line.qtyBase.toString() });

// Full batch reversals cancel their original ledger legs. A reversal of a
// reversal restores them; posted document quantities alone are not actuals.
export async function effectiveStockLines(lines, documents, session) {
  const batches = await read(PostingBatch.find({ documentId: { $in: ids(documents) }, reversalOf: null }), session);
  const all = [...batches];
  let frontier = batches;
  while (frontier.length) {
    frontier = await read(PostingBatch.find({ reversalOf: { $in: ids(frontier) } }), session);
    const seen = new Set(all.map(id));
    if (frontier.some((batch) => seen.has(id(batch)))) throw new ApiError(409, 'Lịch sử đảo giao dịch không hợp lệ');
    all.push(...frontier);
  }
  const movements = await read(StockMovement.find({ batchId: { $in: ids(batches) }, lineId: { $in: ids(lines) } }), session);
  const effective = (batch) => {
    const child = all.find((candidate) => same(candidate.reversalOf, batch._id));
    return child ? 1 - effective(child) : 1;
  };
  return lines.map((line) => ({ ...line, qtyBase: movements.filter((movement) => same(movement.lineId, line._id) && same(movement.documentId, line.documentId))
    .reduce((sum, movement) => sum.plus(exact(movement.qtyBase).mul(effective(batches.find((batch) => same(batch, movement.batchId))))), exact('0')).toFixed() }));
}

function permit(user, permission) {
  if (!user?.isActive || !['OWNER', 'ACCOUNTANT', 'WAREHOUSE', 'SALES'].includes(currentRole(user)?.code)
    || !rolePermissions(user).includes(permission)) throw new ApiError(403, 'Không có quyền xem chứng từ');
}

async function snapshot(action) {
  const session = await mongoose.startSession();
  try { return await session.withTransaction(() => action(session), { readConcern: { level: 'snapshot' } }); }
  finally { await session.endSession(); }
}

async function orderSource(user, orderId, session) {
  const order = await read(BusinessDocument.findOne({ _id: orderId, documentKind: 'SALES_ORDER' }), session);
  if (!order || (currentRole(user).code === 'SALES' && !same(order.createdBy, user._id))) missing();
  return order;
}

async function outboundSource(user, delivery, session) {
  if (!delivery || delivery.documentKind !== 'OUTBOUND_DELIVERY') missing();
  if (currentRole(user).code === 'WAREHOUSE' && !hasWarehouse(user, delivery.header.warehouseId)) missing();
  const request = await read(BusinessDocument.findOne({ _id: delivery.header.issueRequestId, documentKind: 'ISSUE_REQUEST' }), session);
  if (!request) missing();
  const order = await orderSource(user, request.header.salesOrderId, session);
  return { request, order };
}

async function outboundDetail(user, delivery, session) {
  const { request, order } = await outboundSource(user, delivery, session);
  const lines = await read(DocumentLine.find({ documentId: delivery._id, lineKind: 'OUTBOUND_DELIVERY' }).sort({ lineNo: 1 }), session);
  const requestLines = await read(DocumentLine.find({ _id: { $in: lines.map((line) => line.details.issueRequestLineId) }, documentId: request._id, lineKind: 'ISSUE_REQUEST' }), session);
  const orderLines = await read(DocumentLine.find({ _id: { $in: requestLines.map((line) => line.details.salesOrderLineId) }, documentId: order._id, lineKind: 'SALES_ORDER' }), session);
  for (const line of lines) {
    const parent = requestLines.find((value) => same(value, line.details.issueRequestLineId));
    if (!parent || !same(parent.productId, line.productId)
      || !orderLines.some((value) => same(value, parent.details.salesOrderLineId) && same(value.productId, line.productId))) missing();
  }
  const issueLines = await read(DocumentLine.find({ lineKind: 'SALES_GOODS_ISSUE', 'details.outboundDeliveryLineId': { $in: ids(lines) } }), session);
  const issues = await read(BusinessDocument.find({ _id: { $in: issueLines.map((line) => line.documentId) }, documentKind: 'GI_SALE', 'header.warehouseId': delivery.header.warehouseId }), session);
  const validIssueLines = issueLines.filter((line) => issues.some((doc) => same(doc, line.documentId))
    && lines.some((source) => same(source, line.details.outboundDeliveryLineId) && same(source.productId, line.productId)));
  const postedIssueLines = await effectiveStockLines(validIssueLines.filter((line) => issues.some((doc) => same(doc, line.documentId) && doc.workflowStatus === 'POSTED')), issues.filter((doc) => doc.workflowStatus === 'POSTED'), session);
  const podLines = await read(DocumentLine.find({ lineKind: 'DELIVERY_CONFIRMATION', 'details.salesIssueLineId': { $in: ids(postedIssueLines) } }), session);
  const pods = await read(BusinessDocument.find({ _id: { $in: podLines.map((line) => line.documentId) }, documentKind: 'DELIVERY_CONFIRMATION',
    'header.salesOrderId': order._id, 'header.warehouseId': delivery.header.warehouseId }), session);
  const confirmedPods = podLines.filter((line) => pods.some((doc) => same(doc, line.documentId) && doc.workflowStatus === 'CONFIRMED')
    && postedIssueLines.some((source) => same(source, line.details.salesIssueLineId) && same(source.productId, line.productId)));
  const returnLines = await read(DocumentLine.find({ lineKind: 'FAILED_DELIVERY_RECEIPT', 'details.salesIssueLineId': { $in: ids(postedIssueLines) } }), session);
  const returnDocs = await read(BusinessDocument.find({ _id: { $in: returnLines.map((line) => line.documentId) }, documentKind: 'GR_FAILED_DELIVERY', workflowStatus: 'POSTED',
    'header.warehouseId': delivery.header.warehouseId }), session);
  const returns = await effectiveStockLines(returnLines.filter((line) => returnDocs.some((doc) => same(doc, line.documentId))
    && postedIssueLines.some((source) => same(source, line.details.salesIssueLineId) && same(source.productId, line.productId))), returnDocs, session);
  const reservations = await read(Reservation.find({ executionLineId: { $in: [...ids(lines), ...ids(validIssueLines)] } }), session);
  const commitments = await read(OdCommitmentTransfer.find({ $or: [{ fromOdLineId: { $in: ids(lines) } }, { toOdLineId: { $in: ids(lines) } }] }), session);
  const taskLinks = await read(LineLink.find({ sourceLineId: { $in: [...ids(lines), ...ids(validIssueLines)] } }), session);
  const taskLines = await read(DocumentLine.find({ _id: { $in: taskLinks.map((link) => link.targetLineId) }, lineKind: 'WAREHOUSE_TASK' }), session);
  const tasks = await read(BusinessDocument.find({ _id: { $in: taskLines.map((line) => line.documentId) }, documentKind: 'TO', 'header.warehouseId': delivery.header.warehouseId }), session);
  return { ...docDto(delivery), warehouseId: id(delivery.header.warehouseId), plannedOn: delivery.header.plannedOn,
    issueRequest: docDto(request), salesOrder: docDto(order),
    lines: lines.map((line) => {
      const source = requestLines.find((value) => same(value, line.details.issueRequestLineId));
      const issued = postedIssueLines.filter((value) => same(value.details.outboundDeliveryLineId, line._id));
      const delivered = confirmedPods.filter((value) => issued.some((issue) => same(issue, value.details.salesIssueLineId)));
      const returned = returns.filter((value) => issued.some((issue) => same(issue, value.details.salesIssueLineId)));
      return { ...lineDto(line), issueRequestLineId: id(source), salesOrderLineId: id(source.details.salesOrderLineId), requestQtyBase: source.qtyBase.toString(),
        grossIssuedQtyBase: qty(issued), returnedFailedDeliveryQtyBase: qty(returned), netIssuedQtyBase: exact(qty(issued)).minus(qty(returned)).toFixed(), deliveredQtyBase: qty(delivered) };
    }),
    goodsIssues: issues.map(docDto), deliveryConfirmations: pods.map(docDto), failedDeliveryReceipts: returnDocs.map(docDto), tasks: tasks.map(docDto),
    reservations: reservations.map((row) => ({ id: id(row), demandLineId: id(row.demandLineId), executionLineId: id(row.executionLineId), qtyBase: row.qtyBase.toString(), status: row.status })),
    commitmentTransfers: commitments.map((row) => ({ id: id(row), fromOdLineId: id(row.fromOdLineId), toOdLineId: id(row.toOdLineId), qtyBase: row.qtyBase.toString(), operationId: id(row.operationId) })),
  };
}

export async function getOutboundDelivery(user, deliveryId) {
  permit(user, 'outbound_delivery:read');
  return snapshot(async (session) => outboundDetail(user, await read(BusinessDocument.findById(deliveryId), session), session));
}

export async function listOutboundDeliveries(user, filters) {
  permit(user, 'outbound_delivery:read');
  return snapshot(async (session) => {
    const orderFilter = { documentKind: 'SALES_ORDER', ...(currentRole(user).code === 'SALES' && { createdBy: user._id }), ...(filters.salesOrderId && { _id: filters.salesOrderId }) };
    const orders = await read(BusinessDocument.find(orderFilter).select('_id'), session);
    const requests = await read(BusinessDocument.find({ documentKind: 'ISSUE_REQUEST', 'header.salesOrderId': { $in: ids(orders) }, ...(filters.issueRequestId && { _id: filters.issueRequestId }) }).select('_id'), session);
    const filter = { documentKind: 'OUTBOUND_DELIVERY', 'header.issueRequestId': { $in: ids(requests) } };
    if (currentRole(user).code === 'WAREHOUSE') filter['header.warehouseId'] = { $in: user.warehouseIds };
    if (filters.warehouseId) {
      if (currentRole(user).code === 'WAREHOUSE' && !hasWarehouse(user, filters.warehouseId)) return { items: [], total: 0, page: filters.page, limit: filters.limit };
      filter['header.warehouseId'] = filters.warehouseId;
    }
    if (filters.status) filter.workflowStatus = filters.status;
    if (filters.q) filter.documentNo = { $regex: filters.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (filters.from || filters.to) filter.createdAt = { ...(filters.from && { $gte: new Date(filters.from) }), ...(filters.to && { $lte: new Date(filters.to) }) };
    const total = await BusinessDocument.countDocuments(filter).session(session);
    const documents = await read(BusinessDocument.find(filter).sort({ createdAt: -1, _id: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit), session);
    const items = [];
    for (const document of documents) {
      const detail = await outboundDetail(user, document, session);
      items.push({ ...docDto(document), warehouseId: detail.warehouseId, plannedOn: detail.plannedOn, salesOrderId: detail.salesOrder.id, issueRequestId: detail.issueRequest.id,
        lines: detail.lines.map(({ id: lineId, productId, qtyBase, grossIssuedQtyBase, netIssuedQtyBase, deliveredQtyBase }) => ({ id: lineId, productId, qtyBase, grossIssuedQtyBase, netIssuedQtyBase, deliveredQtyBase })) });
    }
    return { items, total, page: filters.page, limit: filters.limit };
  });
}

export async function getSalesEvidence(user, orderId, evidenceId) {
  permit(user, 'sales_order:read');
  if (currentRole(user).code === 'WAREHOUSE') missing();
  return snapshot(async (session) => {
    await orderSource(user, orderId, session);
    const evidence = await read(Evidence.findOne({ _id: evidenceId, documentId: orderId }), session);
    if (!evidence || !evidence.objectKey.startsWith('sep490/sales-source/')) missing();
    const format = evidence.mediaType.split('/')[1];
    const expiresAt = Math.floor(Date.now() / 1000) + 60;
    return { url: cloudinary.utils.private_download_url(evidence.objectKey, format,
      { resource_type: 'image', type: 'authenticated', expires_at: expiresAt }), expiresAt: new Date(expiresAt * 1000).toISOString() };
  });
}

export async function getSalesOrder(user, orderId) {
  permit(user, 'sales_order:read');
  return snapshot(async (session) => {
    const order = await orderSource(user, orderId, session);
    const warehouseRole = currentRole(user).code === 'WAREHOUSE';
    const requests = await read(BusinessDocument.find({ documentKind: 'ISSUE_REQUEST', 'header.salesOrderId': order._id }), session);
    const deliveries = await read(BusinessDocument.find({ documentKind: 'OUTBOUND_DELIVERY', 'header.issueRequestId': { $in: ids(requests) },
      ...(warehouseRole && { 'header.warehouseId': { $in: user.warehouseIds } }) }), session);
    const scopedRequests = requests.filter((request) => !warehouseRole || hasWarehouse(user, request.header.requestedWarehouseId) || deliveries.some((delivery) => same(delivery.header.issueRequestId, request._id)));
    if (warehouseRole && !scopedRequests.length) missing();
    const permittedDeliveryLines = warehouseRole ? await read(DocumentLine.find({ documentId: { $in: ids(deliveries) }, lineKind: 'OUTBOUND_DELIVERY' }), session) : [];
    const requestLines = (await read(DocumentLine.find({ documentId: { $in: ids(scopedRequests) }, lineKind: 'ISSUE_REQUEST' }), session))
      .filter((line) => !warehouseRole
        || scopedRequests.some((request) => same(request, line.documentId) && hasWarehouse(user, request.header.requestedWarehouseId))
        || permittedDeliveryLines.some((deliveryLine) => same(deliveryLine.details.issueRequestLineId, line._id)));
    const lines = await read(DocumentLine.find({ documentId: order._id, lineKind: 'SALES_ORDER', ...(warehouseRole && { _id: { $in: requestLines.map((line) => line.details.salesOrderLineId) } }) }).sort({ lineNo: 1 }), session);
    const source = warehouseRole ? null : await read(ExternalReference.findById(order.header.externalReferenceId), session);
    const sourceLines = warehouseRole ? [] : await read(ExternalReferenceLine.find({ _id: { $in: lines.map((line) => line.details.externalLineId) }, referenceId: order.header.externalReferenceId }), session);
    const cancellations = await read(SalesOrderCancellation.find({ salesOrderId: order._id, salesOrderLineId: { $in: ids(lines) } }), session);
    const history = [];
    for (const delivery of deliveries) history.push(await outboundDetail(user, delivery, session));
    const deliveryLineIds = history.flatMap((delivery) => delivery.lines.map((line) => line.id));
    const reopenings = await read(DemandReopening.find({ salesOrderLineId: { $in: ids(lines) }, outboundDeliveryLineId: { $in: deliveryLineIds } }), session);
    const payments = await read(BusinessDocument.find({ documentKind: 'PAYMENT_CONFIRMATION', 'header.salesOrderId': order._id }).sort({ createdAt: 1 }), session);
    const evidence = warehouseRole ? [] : await read(Evidence.find({ documentId: order._id }), session);
    return { ...docDto(order), customerId: id(order.header.customerId), neededOn: order.header.neededOn, deliveryAddress: order.header.deliveryAddressSnapshot,
      source: source ? { id: id(source), sourceSystem: source.sourceSystem, referenceNo: source.referenceNo, referenceKind: source.referenceKind, referenceDate: source.referenceDate ?? null,
        sourceVersion: source.sourceVersion ?? null, verifiedAt: source.verifiedAt ?? null } : null,
      lines: lines.map((line) => ({ ...lineDto(line), requiredTone: line.details.requiredTone ?? null, requiredCalibre: line.details.requiredCalibre ?? null,
        ...(!warehouseRole && { externalLineId: id(line.details.externalLineId), sourceLineKey: sourceLines.find((value) => same(value, line.details.externalLineId))?.lineKey ?? null }) })),
      issueRequests: scopedRequests.map(docDto), outboundDeliveries: history,
      cancellations: cancellations.map((row) => ({ id: id(row), salesOrderLineId: id(row.salesOrderLineId), qtyBase: row.cancelledQtyBase.toString(), cancelledAt: row.cancelledAt })),
      reopenings: reopenings.map((row) => ({ id: id(row), salesOrderLineId: id(row.salesOrderLineId), outboundDeliveryLineId: id(row.outboundDeliveryLineId), receiptLineId: id(row.receiptLineId), qtyBase: row.reopenedQty.toString() })),
      paymentConfirmations: payments.map((doc) => ({ ...docDto(doc), deliveredOrderVersion: doc.header.deliveredOrderVersion, confirmedAt: doc.header.confirmedAt })),
      evidence: evidence.map((row) => ({ id: id(row), mediaType: row.mediaType, uploadedAt: row.uploadedAt })),
    };
  });
}
