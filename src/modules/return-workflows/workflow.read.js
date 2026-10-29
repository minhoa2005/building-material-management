import { BusinessDocument, DocumentLine, DocumentLink, LineLink, Evidence, AuditEvent, Lot, ProductUomVersion, Warehouse, Location, Party, StockBalance, StockAccount, StockMovement, PostingBatch, Reservation, ExternalReference, ExternalReferenceLine } from '../../models/index.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { command, dec, dto, evidenceFor, same, scopedDocument, warehouseScope } from './workflow.shared.js';

export async function failedDetail(user, id) {
  const doc = await scopedDocument(user, id, 'FAILED_DELIVERY');
  const [lines, evidence, links, history] = await Promise.all([DocumentLine.find({ documentId: id }).lean(), Evidence.find({ documentId: id }).lean(), DocumentLink.find({ parentDocumentId: id }).lean(), AuditEvent.find({ documentId: id }).sort({ eventAt: 1 }).lean()]);
  return dto({ ...doc.toObject(), lines, evidence, history, linkedDocuments: await Promise.all(links.map(async (x) => ({ ...x, document: await BusinessDocument.findById(x.childDocumentId).lean(), lines: await DocumentLine.find({ documentId: x.childDocumentId }).lean() }))) });
}
export async function listFailed(user, filters) {
  const query = { documentKind: 'FAILED_DELIVERY', ...warehouseScope(user) };
  if (filters.status) query.workflowStatus = filters.status;
  if (filters.search) {
    const expression = { $regex: filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    query.$or = [{ documentNo: expression }, { note: expression }, { 'header.reason': expression }];
  }
  return dto({ items: await BusinessDocument.find(query).sort({ createdAt: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(), total: await BusinessDocument.countDocuments(query), page: filters.page, limit: filters.limit });
}
export async function options(user) {
  const role = currentRole(user)?.code;
  const warehouseQuery = role === 'WAREHOUSE' ? { _id: { $in: user.warehouseIds || [] }, isActive: true } : { isActive: true };
  const warehouses = await Warehouse.find(warehouseQuery).lean();
  const locations = role === 'SALES' ? [] : await Location.find({ warehouseId: { $in: warehouses.map((x) => x._id) }, isActive: true }).lean();
  const accounts = await StockAccount.find({ locationId: { $in: locations.map((x) => x._id) } }).lean();
  const balances = role === 'WAREHOUSE' ? await StockBalance.find({ accountId: { $in: accounts.map((x) => x._id) }, qtyBase: { $gt: 0 } }).limit(500).lean() : [];
  const kinds = role === 'SALES' ? ['GI_SALE', 'SALES_ORDER', 'ISSUE_REQUEST', 'OUTBOUND_DELIVERY', 'DELIVERY_CONFIRMATION'] : role === 'ACCOUNTANT' ? ['PO', 'GR_PURCHASE', 'SUPPLIER_RETURN', 'GI_SUPPLIER_RETURN', 'SALES_ORDER'] : ['GI_SALE', 'PO', 'GR_PURCHASE', 'GR_CUSTOMER_RETURN', 'GR_FAILED_DELIVERY', 'MWTR', 'DEFECT_CASE', 'STOCKTAKE'];
  const query = { documentKind: { $in: kinds } };
  if (role === 'WAREHOUSE') query.$or = [{ 'header.warehouseId': { $in: user.warehouseIds || [] } }, { documentKind: 'PO', 'header.warehouseId': { $in: user.warehouseIds || [] } }];
  // Sales gets only their orders and the source chain belonging to those orders.
  let docs = await BusinessDocument.find(role === 'SALES' ? { documentKind: 'SALES_ORDER', createdBy: user._id } : query).limit(500).lean();
  if (role === 'WAREHOUSE') {
    const requests = await BusinessDocument.find({ documentKind: 'TRANSFER_REQUEST', 'header.destinationWarehouseId': { $in: user.warehouseIds || [] } }).select('_id').lean();
    const dispatches = await BusinessDocument.find({ documentKind: 'TRANSFER_DISPATCH', 'header.requestId': { $in: requests.map((x) => x._id) } }).select('_id').lean();
    docs.push(...await BusinessDocument.find({ documentKind: 'MWTR', 'header.dispatchId': { $in: dispatches.map((x) => x._id) } }).limit(500).lean());
  }
  if (role === 'SALES') {
    const requests = await BusinessDocument.find({ documentKind: 'ISSUE_REQUEST', 'header.salesOrderId': { $in: docs.map((x) => x._id) } }).lean();
    const outbound = await BusinessDocument.find({ documentKind: 'OUTBOUND_DELIVERY', 'header.issueRequestId': { $in: requests.map((x) => x._id) } }).lean();
    const odLines = await DocumentLine.find({ documentId: { $in: outbound.map((x) => x._id) } }).select('_id').lean();
    const giLines = await DocumentLine.find({ lineKind: 'SALES_GOODS_ISSUE', 'details.outboundDeliveryLineId': { $in: odLines.map((x) => x._id) } }).lean();
    docs = await BusinessDocument.find({ _id: { $in: giLines.map((x) => x.documentId) }, workflowStatus: 'POSTED' }).lean();
  }
  const sourceLines = await DocumentLine.find({ documentId: { $in: docs.map((x) => x._id) } }).limit(1000).lean();
  if (role === 'SALES') {
    const orders = await BusinessDocument.find({ documentKind: 'SALES_ORDER', createdBy: user._id }).select('_id').lean();
    const historicalRefs = await ExternalReference.find({ documentId: { $in: orders.map((x) => x._id) }, referenceKind: 'HISTORICAL_DELIVERY', status: 'VERIFIED' }).select('_id').lean();
    const historicalLines = await ExternalReferenceLine.find({ referenceId: { $in: historicalRefs.map((x) => x._id) }, lotId: { $ne: null }, conversionId: { $ne: null } }).lean();
    for (const row of historicalLines) sourceLines.push({ _id: row._id, documentId: row.referenceId, productId: row.productId, lotId: row.lotId, productNameSnapshot: `Nguồn giao lịch sử ${row.lineKey}`, qtyBase: row.eligibleQty, details: { historicalExternalLineId: String(row._id) } });
  }
  const lots = await Lot.find(role === 'ACCOUNTANT' ? {} : { _id: { $in: [...balances.map((x) => x.lotId), ...sourceLines.map((x) => x.lotId).filter(Boolean)] } }).limit(1000).lean();
  const conversions = role === 'ACCOUNTANT' ? await ProductUomVersion.find({ productId: { $in: sourceLines.map((x) => x.productId) } }).lean() : [];
  const parties = await Party.find({ kind: { $in: role === 'SALES' ? ['CUSTOMER'] : ['CUSTOMER', 'SUPPLIER', 'STORE'] }, isActive: true }).select('_id code name kind').limit(500).lean();
  return dto({ warehouses, locations, balances, accounts, lots, conversions, parties, sourceDocuments: docs, sourceLines });
}

export async function traceLot(user, id) {
  const lot = await Lot.findById(id).lean();
  if (!lot) throw new ApiError(404, 'Không tìm thấy lô');
  const role = currentRole(user)?.code;
  const lineMap = new Map((await DocumentLine.find({ lotId: id }).lean()).map((x) => [String(x._id), x]));
  let frontier = [...lineMap.keys()];
  for (let depth = 0; frontier.length && depth < 20; depth++) {
    const links = await LineLink.find({ $or: [{ sourceLineId: { $in: frontier } }, { targetLineId: { $in: frontier } }] }).lean();
    const nextIds = [...new Set(links.flatMap((x) => [String(x.sourceLineId), String(x.targetLineId)]))].filter((x) => !lineMap.has(x));
    const nextLines = await DocumentLine.find({ _id: { $in: nextIds } }).lean();
    frontier = nextLines.map((x) => String(x._id)); nextLines.forEach((x) => lineMap.set(String(x._id), x));
    if (lineMap.size > 5000) throw new ApiError(400, 'Lịch sử quá lớn; cần chia phạm vi truy xuất');
  }
  const lines = [...lineMap.values()];
  let docs = await BusinessDocument.find({ _id: { $in: lines.map((x) => x.documentId) } }).lean();
  if (role === 'WAREHOUSE') {
    const allowed = new Set((user.warehouseIds || []).map(String));
    const permitted = new Set(docs.filter((doc) => allowed.has(String(doc.header?.warehouseId)) || allowed.has(String(doc.header?.sourceWarehouseId)) || allowed.has(String(doc.header?.destinationWarehouseId))).map((x) => String(x._id)));
    const connected = await LineLink.find({ sourceLineId: { $in: lines.map((x) => x._id) }, targetLineId: { $in: lines.map((x) => x._id) } }).lean();
    for (let depth = 0; depth < 20; depth++) {
      let changed = false;
      for (const link of connected) {
        const source = lineMap.get(String(link.sourceLineId)), target = lineMap.get(String(link.targetLineId));
        for (const [a, b] of [[source, target], [target, source]]) {
          const candidate = docs.find((x) => same(x._id, b?.documentId));
          if (a && b && candidate && permitted.has(String(a.documentId)) && !candidate.header?.warehouseId && !candidate.header?.sourceWarehouseId && !candidate.header?.destinationWarehouseId && !permitted.has(String(b.documentId))) { permitted.add(String(b.documentId)); changed = true; }
        }
      }
      if (!changed) break;
    }
    docs = docs.filter((doc) => permitted.has(String(doc._id)));
  } else if (role === 'ACCOUNTANT') docs = docs.filter((doc) => ['PO', 'GR_PURCHASE', 'SUPPLIER_RETURN', 'GI_SUPPLIER_RETURN', 'SUPPLIER_ACK'].includes(doc.documentKind));
  const docIds = docs.map((x) => x._id), allowed = new Set(docIds.map(String));
  const permittedLines = lines.filter((x) => allowed.has(String(x.documentId)));
  const lineIds = permittedLines.map((x) => x._id);
  const [documentLinks, lineLinks, history, evidence, externalReferences] = await Promise.all([
    DocumentLink.find({ parentDocumentId: { $in: docIds }, childDocumentId: { $in: docIds } }).lean(),
    LineLink.find({ sourceLineId: { $in: lineIds }, targetLineId: { $in: lineIds } }).lean(),
    AuditEvent.find({ documentId: { $in: docIds } }).sort({ eventAt: 1 }).lean(),
    Evidence.find({ documentId: { $in: docIds } }).select('_id documentId uploadedAt uploadedBy mediaType').lean(),
    ExternalReference.find({ _id: { $in: docs.flatMap((x) => x.externalReferenceIds || []) } }).lean(),
  ]);
  if (!docs.length && role !== 'OWNER') throw new ApiError(404, 'Không có lịch sử lô trong phạm vi được phép');
  const [movements, postingBatches, reservations] = await Promise.all([
    StockMovement.find({ documentId: { $in: docIds }, lineId: { $in: lineIds } }).lean(),
    PostingBatch.find({ documentId: { $in: docIds } }).sort({ postedAt: 1 }).lean(),
    Reservation.find({ $or: [{ demandLineId: { $in: lineIds } }, { executionLineId: { $in: lineIds } }] }).lean(),
  ]);
  return dto({ lot, documents: docs, lines: permittedLines, documentLinks, lineLinks, history, evidence, externalReferences, movements, postingBatches, reservations });
}
export async function recordExternalReference(user, input) {
  return command(user, input.documentId, { $in: ['PO', 'GR_PURCHASE', 'GI_SUPPLIER_RETURN', 'SUPPLIER_RETURN', 'SALES_ORDER'] }, input, 'EXTERNAL_REFERENCE', async (doc, session) => {
    await evidenceFor(doc._id, [input.evidenceId], session);
    const sourceLines = await DocumentLine.find({ documentId: doc._id }).session(session);
    if (input.referenceKind === 'HISTORICAL_DELIVERY') {
      if (doc.documentKind !== 'SALES_ORDER' || !same(doc.header.customerId, input.customerId) || !input.warehouseId) throw new ApiError(400, 'Nguồn lịch sử cần đơn bán, đúng khách hàng và kho');
      if (!await Warehouse.exists({ _id: input.warehouseId, isActive: true }).session(session)) throw new ApiError(400, 'Kho không hoạt động');
      const requests = await BusinessDocument.find({ documentKind: 'ISSUE_REQUEST', 'header.salesOrderId': doc._id }).select('_id').session(session);
      const outbound = await BusinessDocument.find({ documentKind: 'OUTBOUND_DELIVERY', 'header.issueRequestId': { $in: requests.map((x) => x._id) } }).select('_id').session(session);
      const outboundLines = await DocumentLine.find({ documentId: { $in: outbound.map((x) => x._id) } }).select('_id').session(session);
      if (await DocumentLine.exists({ lineKind: 'SALES_GOODS_ISSUE', 'details.outboundDeliveryLineId': { $in: outboundLines.map((x) => x._id) } }).session(session)) throw new ApiError(409, 'Đơn đã có nguồn thực xuất WMS; dùng nguồn GI/POD để tránh tính trần giao hai lần');
    }
    for (const entry of input.lines) {
      const line = sourceLines.find((x) => same(x._id, entry.lineId));
      if (!line || dec(entry.qtyBase).gt(dec(line.qtyBase))) throw new ApiError(409, 'Lượng tham chiếu vượt dòng nguồn');
      const priorReferences = await ExternalReference.find({ documentId: doc._id, referenceKind: input.referenceKind, status: { $ne: 'DISPUTED' } }).select('_id').session(session);
      const priorMatches = await ExternalReferenceLine.find({ sourceLineId: line._id, referenceId: { $in: priorReferences.map((x) => x._id) } }).session(session);
      if (priorMatches.reduce((n, x) => n.plus(dec(x.eligibleQty)), dec(entry.qtyBase)).gt(dec(line.qtyBase))) throw new ApiError(409, 'Tổng lượng đối chiếu cùng loại vượt dòng nguồn');
      if (input.referenceKind === 'HISTORICAL_DELIVERY') {
        const lot = entry.lotId && await Lot.findOne({ _id: entry.lotId, productId: line.productId }).session(session);
        const conversion = entry.conversionId && await ProductUomVersion.findOne({ _id: entry.conversionId, productId: line.productId }).session(session);
        if (!lot || !conversion || dec(entry.returnedQty || '0').gt(dec(entry.qtyBase))) throw new ApiError(400, 'Cần lô, quy cách có căn cứ và lượng đã trả lịch sử không vượt lượng giao');
      }
    }
    const [reference] = await ExternalReference.create([{ documentId: doc._id, sourceSystem: input.sourceSystem, referenceKind: input.referenceKind, referenceNo: input.referenceNo, referenceDate: input.referenceDate, sourceVersion: input.sourceVersion, correlationId: input.correlationId, evidenceId: input.evidenceId, status: input.status, note: input.note, customerId: input.customerId, warehouseId: input.warehouseId, ...(input.status === 'VERIFIED' ? { verifiedBy: user._id, verifiedAt: new Date() } : {}) }], { session });
    for (const entry of input.lines) {
      const source = sourceLines.find((x) => same(x._id, entry.lineId));
      await ExternalReferenceLine.create([{ referenceId: reference._id, lineKey: String(source.lineNo), productId: source.productId, eligibleQty: entry.qtyBase, sourceLineId: source._id, lotId: entry.lotId, conversionId: entry.conversionId, returnedQty: entry.returnedQty }], { session });
    }
    await BusinessDocument.updateOne({ _id: doc._id }, { $addToSet: { externalReferenceIds: reference._id } }, { session });
    return { referenceId: String(reference._id) };
  });
}
