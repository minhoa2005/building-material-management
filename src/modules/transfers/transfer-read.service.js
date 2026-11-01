import mongoose from 'mongoose';
import { BusinessDocument, DocumentLine, DocumentLink, Approval, Warehouse, LineLink, StockAccount, StockBalance, DemandSupplyAllocation, Evidence } from '../../models/index.js';
import { currentRole, rolePermissions } from '../../shared/utils/userRole.js';
import { exact } from '../../models/model-utils.js';
import { ApiError } from '../../shared/utils/ApiError.js';

const id = (v) => String(v?._id ?? v);
const read = (query, session) => query.session(session).lean();
const sum = (lines) => lines.reduce((n, line) => n.plus(exact(line.qtyBase)), exact('0')).toFixed();
const denied = () => { throw new ApiError(404, 'Không tìm thấy điều chuyển trong phạm vi được phép'); };

async function scope(user, session) {
  const role = currentRole(user)?.code;
  if (!user.isActive || !['OWNER', 'ACCOUNTANT', 'WAREHOUSE', 'SALES'].includes(role)
    || !rolePermissions(user).includes('stock_transfer:read')) throw new ApiError(403, 'Không có quyền xem điều chuyển');
  if (role === 'OWNER' || role === 'ACCOUNTANT') return {};
  if (role === 'WAREHOUSE') return { $or: [
    { 'header.sourceWarehouseId': { $in: user.warehouseIds } },
    { 'header.destinationWarehouseId': { $in: user.warehouseIds } },
  ] };
  const orders = await read(BusinessDocument.find({ documentKind: 'SALES_ORDER', createdBy: user._id }), session);
  const requests = await read(BusinessDocument.find({ documentKind: 'ISSUE_REQUEST', 'header.salesOrderId': { $in: orders.map((x) => x._id) } }), session);
  const demand = await read(DocumentLine.find({ documentId: { $in: [...orders, ...requests].map((x) => x._id) } }), session);
  const allocations = await read(DemandSupplyAllocation.find({ demandLineId: { $in: demand.map((x) => x._id) }, status: { $ne: 'CANCELLED' } }), session);
  const supply = await read(DocumentLine.find({ _id: { $in: allocations.map((x) => x.supplyLineId) } }), session);
  const supplyDocs = await read(BusinessDocument.find({ _id: { $in: supply.map((x) => x.documentId) } }), session);
  const candidates = supplyDocs.flatMap((doc) => doc.documentKind === 'TRANSFER_REQUEST' ? [doc._id]
    : doc.documentKind === 'TRANSFER_DISPATCH' ? [doc.header.requestId] : []);
  // Confirmed scope: one related demand grants the overall TR progress,
  // including mixed-demand TRs; the Sales DTO omits all operational internals.
  return { _id: { $in: candidates } };
}

async function snapshot(action) {
  const session = await mongoose.startSession();
  try { return await session.withTransaction(() => action(session), { readConcern: { level: 'snapshot' } }); }
  finally { await session.endSession(); }
}

async function loadProgress(document, session) {
  const dispatches = await read(BusinessDocument.find({ documentKind: 'TRANSFER_DISPATCH', 'header.requestId': document._id }).sort({ createdAt: 1, _id: 1 }), session);
  const receipts = await read(BusinessDocument.find({ documentKind: 'MWTR', 'header.dispatchId': { $in: dispatches.map((x) => x._id) } }).sort({ createdAt: 1, _id: 1 }), session);
  const allLines = await read(DocumentLine.find({ documentId: { $in: [document._id, ...dispatches.map((x) => x._id), ...receipts.map((x) => x._id)] } }).sort({ lineNo: 1 }), session);
  const linesFor = (doc) => allLines.filter((line) => id(line.documentId) === id(doc));
  const postedDispatches = new Set(dispatches.filter((x) => x.workflowStatus === 'POSTED').map(id));
  const dispatchLines = allLines.filter((x) => postedDispatches.has(id(x.documentId)));
  const postedReceipts = new Set(receipts.filter((x) => x.workflowStatus === 'POSTED' && postedDispatches.has(id(x.header.dispatchId))).map(id));
  const received = allLines.filter((x) => postedReceipts.has(id(x.documentId)) && x.lineKind === 'TRANSFER_RECEIPT'
    && dispatchLines.some((source) => id(source) === id(x.details.dispatchLineId) && id(source.productId) === id(x.productId) && id(source.lotId) === id(x.lotId)
      && receipts.some((receipt) => id(receipt) === id(x.documentId) && id(receipt.header.dispatchId) === id(source.documentId))));
  const accounts = await read(StockAccount.find({ transitDispatchLineId: { $in: dispatchLines.map((x) => x._id) } }), session);
  const balances = await read(StockBalance.find({ accountId: { $in: accounts.map((x) => x._id) } }), session);
  const warehouses = await read(Warehouse.find({ _id: { $in: [document.header.sourceWarehouseId, document.header.destinationWarehouseId] } }), session);
  const approval = await read(Approval.findOne({ documentId: document._id, documentVersion: document.header.approvedVersion ?? document.version, decisionKind: 'TRANSFER_APPROVAL' }).sort({ decidedAt: -1, _id: -1 }), session);
  const basic = {
    id: id(document), documentNo: document.documentNo, status: document.workflowStatus, version: document.version,
    sourceWarehouseId: id(document.header.sourceWarehouseId), destinationWarehouseId: id(document.header.destinationWarehouseId),
    sourceWarehouseName: warehouses.find((x) => id(x) === id(document.header.sourceWarehouseId))?.name ?? null,
    destinationWarehouseName: warehouses.find((x) => id(x) === id(document.header.destinationWarehouseId))?.name ?? null,
    createdAt: document.createdAt, neededOn: document.header.neededOn ?? null,
    // Totals are base-unit amounts; consumers must not label them BOX or square metres.
    requestedQtyBase: sum(linesFor(document)), dispatchedQtyBase: sum(dispatchLines), receivedQtyBase: sum(received),
    inTransitQtyBase: sum(balances),
    receivedByQuality: Object.fromEntries(['GOOD', 'PENDING', 'DAMAGED', 'BLOCKED'].map((quality) => [quality, sum(received.filter((x) => x.details.qualityCode === quality))])),
  };
  const productIds = [...new Set(allLines.map((line) => id(line.productId)))];
  basic.quantitiesByProduct = productIds.map((productId) => ({ productId,
    requestedQtyBase: sum(linesFor(document).filter((line) => id(line.productId) === productId)),
    dispatchedQtyBase: sum(dispatchLines.filter((line) => id(line.productId) === productId)),
    receivedQtyBase: sum(received.filter((line) => id(line.productId) === productId)),
  }));
  if (productIds.length > 1) {
    for (const field of ['requestedQtyBase', 'dispatchedQtyBase', 'receivedQtyBase', 'inTransitQtyBase', 'receivedByQuality']) basic[field] = null;
  }
  return { basic, dispatches, receipts, allLines, linesFor, approval };
}

export async function listTransfers(user, filters) {
  return snapshot(async (session) => {
    const predicate = { $and: [{ documentKind: 'TRANSFER_REQUEST' }, await scope(user, session)] };
    for (const field of ['sourceWarehouseId', 'destinationWarehouseId']) if (filters[field]) predicate.$and.push({ [`header.${field}`]: filters[field] });
    if (filters.status) predicate.$and.push({ workflowStatus: filters.status });
    if (filters.from || filters.to) predicate.$and.push({ createdAt: { ...(filters.from && { $gte: new Date(filters.from) }), ...(filters.to && { $lte: new Date(filters.to) }) } });
    const total = await BusinessDocument.countDocuments(predicate).session(session);
    const docs = await read(BusinessDocument.find(predicate).sort({ createdAt: -1, _id: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit), session);
    const items = [];
    for (const doc of docs) items.push((await loadProgress(doc, session)).basic);
    return { items, total, page: filters.page, limit: filters.limit };
  });
}

export async function getTransfer(user, documentId) {
  return snapshot(async (session) => {
    const document = await read(BusinessDocument.findOne({ $and: [{ _id: documentId, documentKind: 'TRANSFER_REQUEST' }, await scope(user, session)] }), session);
    if (!document) denied();
    const progress = await loadProgress(document, session);
    // Sales receives related fulfilment progress only, without operational notes,
    // carrier identities or approval/evidence internals.
    if (currentRole(user).code === 'SALES') return progress.basic;
    const requestLines = progress.linesFor(document);
    const links = await read(LineLink.find({ sourceLineId: { $in: requestLines.map((x) => x._id) }, targetLineId: { $in: progress.allLines.map((x) => x._id) } }), session);
    const handovers = await read(BusinessDocument.find({ documentKind: 'HANDOVER', 'header.relatedDocumentId': { $in: progress.dispatches.map((x) => x._id) } }), session);
    const differences = await read(DocumentLine.find({ lineKind: 'DISCREPANCY', 'details.sourceLineId': { $in: progress.allLines.map((x) => x._id) } }), session);
    const taskLinks = await read(LineLink.find({ sourceLineId: { $in: progress.allLines.map((x) => x._id) } }), session);
    const taskLines = await read(DocumentLine.find({ _id: { $in: taskLinks.map((link) => link.targetLineId) }, lineKind: 'WAREHOUSE_TASK' }), session);
    const requirements = await read(BusinessDocument.find({ documentKind: 'INTERNAL_TRANSFER_REQUIREMENT', 'header.sourceDocumentId': { $in: [...progress.dispatches, ...progress.receipts].map((v) => v._id) } }), session);
    const generatedLinks = await read(DocumentLink.find({ parentDocumentId: { $in: requirements.map((item) => item._id) }, relationCode: 'GENERATED_TO' }), session);
    const tasks = await read(BusinessDocument.find({ _id: { $in: [...taskLines.map((line) => line.documentId), ...generatedLinks.map((item) => item.childDocumentId)] }, documentKind: 'TO',
      'header.warehouseId': { $in: [document.header.sourceWarehouseId, document.header.destinationWarehouseId] } }), session);
    const evidence = await read(Evidence.find({ documentId: { $in: [document._id, ...progress.dispatches.map((x) => x._id), ...progress.receipts.map((x) => x._id), ...handovers.map((x) => x._id)] } }), session);
    const lineDto = (line) => ({ id: id(line), lineNo: line.lineNo, productId: id(line.productId), productName: line.productNameSnapshot,
      lotId: line.lotId ? id(line.lotId) : null, enteredQty: line.enteredQty.toString(), conversionId: id(line.conversionId),
      conversionSnapshot: line.conversionSnapshot.toString(), qtyBase: line.qtyBase.toString(),
      ...(line.lineKind === 'TRANSFER_RECEIPT' && { dispatchLineId: id(line.details.dispatchLineId), qualityCode: line.details.qualityCode }),
      ...(line.lineKind === 'TRANSFER_OUTBOUND' && { requestLineId: id(line.details.requestLineId), sourceBalanceId: id(line.details.sourceBalanceId), stagingLocationId: id(line.details.stagingLocationId) }),
    });
    const docDto = (doc) => ({ id: id(doc), documentNo: doc.documentNo, status: doc.workflowStatus, version: doc.version, createdAt: doc.createdAt,
      lines: progress.linesFor(doc).map(lineDto) });
    return { ...progress.basic, reason: document.note ?? null, createdBy: id(document.createdBy),
      lines: requestLines.map((line) => ({ ...lineDto(line), approvedQtyBase: progress.approval?.decision === 'APPROVE'
        ? progress.approval.lines.find((x) => id(x.lineId) === id(line))?.approvedQty.toString() ?? null : null })),
      dispatches: progress.dispatches.map(docDto), receipts: progress.receipts.map(docDto),
      handovers: handovers.map((doc) => ({ id: id(doc), documentNo: doc.documentNo, dispatchId: id(doc.header.relatedDocumentId), handedOverAt: doc.header.handedOverAt })),
      lineLinks: links.map((link) => ({ sourceLineId: id(link.sourceLineId), targetLineId: id(link.targetLineId), relationCode: link.relationCode, qtyBase: link.linkedQty.toString() })),
      differences: differences.map((line) => ({ id: id(line), sourceLineId: id(line.details.sourceLineId), kind: line.details.discrepancyKind,
        qtyBase: line.qtyBase.toString(), resolutionStatus: line.details.resolutionStatus })),
      internalRequirements: requirements.map((item) => ({ id: id(item), documentNo: item.documentNo, sourceDocumentId: id(item.header.sourceDocumentId), taskKind: item.header.taskKind, status: item.workflowStatus })),
      tasks: tasks.map((task) => ({ id: id(task), documentNo: task.documentNo, version: task.version, taskKind: task.header.taskKind, status: task.workflowStatus, warehouseId: id(task.header.warehouseId) })),
      evidence: evidence.map((item) => ({ id: id(item), documentId: id(item.documentId), mediaType: item.mediaType, uploadedAt: item.uploadedAt })),
      // Display the saved lifecycle; never mutate/close a TR from a GET or infer
      // completion merely because one receipt matched its dispatch.
      completionStatus: document.workflowStatus,
    };
  });
}
