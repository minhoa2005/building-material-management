import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import * as m from '../../models/index.js';
import { exact } from '../../models/model-utils.js';
import { currentRole, rolePermissions } from '../../shared/utils/userRole.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { pendingTaskQuantity } from '../location-movements/location-movement.service.js';

const id = (v) => v == null ? null : String(v._id ?? v);
const same = (a, b) => id(a) === id(b);
const read = (q, s) => q.session(s).lean();
const fail = (message, status = 409) => { throw new ApiError(status, message); };
const hash = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const fields = (line, quantity = line.qtyBase) => {
  const entered = exact(quantity).div(exact(line.conversionSnapshot));
  if (entered.decimalPlaces() > 6 || entered.gte('100000000000000')) fail('Số lượng không biểu diễn chính xác theo đơn vị của yêu cầu; sử dụng đơn vị cơ sở khi tạo yêu cầu', 400);
  return { productId: line.productId, lotId: line.lotId,
    conversionId: line.conversionId, conversionSnapshot: line.conversionSnapshot,
    enteredQty: entered.toFixed(), qtyBase: exact(quantity).toFixed(), productNameSnapshot: line.productNameSnapshot };
};
function access(user, permission, role = 'WAREHOUSE') {
  if (!user?.isActive || currentRole(user)?.code !== role || !rolePermissions(user).includes(permission)) fail('Không có quyền thực hiện', 403);
}
function assigned(user, warehouseId) {
  if (!(user.warehouseIds ?? []).some((v) => same(v, warehouseId))) fail('Kho ngoài phạm vi được phân công', 403);
}
function version(doc, expected) { if (doc.version !== expected) fail('Chứng từ đã thay đổi; tải lại phiên bản mới'); }
async function authorizeReplay(user, result, operation, s) {
  if (!result) fail('Không tìm thấy chứng từ', 404);
  if (operation === 'REVIEW_TRANSFER_REQUEST') return;
  if (result.documentKind === 'TO') {
    access(user, result.header.taskKind === 'PICK' ? 'stock_transfer:dispatch' : 'stock_transfer:receive');
    assigned(user, result.header.warehouseId);
    return;
  }
  let request = result;
  if (result.documentKind === 'TRANSFER_DISPATCH') request = await doc(result.header.requestId, 'TRANSFER_REQUEST', s);
  if (result.documentKind === 'MWTR') {
    const outbound = await doc(result.header.dispatchId, 'TRANSFER_DISPATCH', s);
    request = await doc(outbound.header.requestId, 'TRANSFER_REQUEST', s);
  }
  assigned(user, ['RECEIVE_TRANSFER', 'CLOSE_TRANSFER_REQUEST'].includes(operation)
    ? request.header.destinationWarehouseId : request.header.sourceWarehouseId);
}
async function doc(idValue, kind, s) {
  const result = await read(m.BusinessDocument.findOne({ _id: idValue, documentKind: kind }), s);
  if (!result) fail('Không tìm thấy chứng từ', 404);
  return result;
}
async function lockDocument(document, s) {
  const result = await m.BusinessDocument.updateOne({ _id: document._id, version: document.version }, { $set: { updatedAt: new Date() } }, { session: s });
  if (!result.matchedCount) fail('Chứng từ đã thay đổi');
}
async function lines(document, s) { return read(m.DocumentLine.find({ documentId: document._id }).sort({ lineNo: 1 }), s); }
async function save(Model, values, s) { const result = new Model(values); await result.save({ session: s }); return result; }
async function document(kind, header, user, s, status = 'OPEN', note) {
  const oid = new mongoose.Types.ObjectId();
  return save(m.BusinessDocument, { _id: oid, documentNo: `${kind === 'INTERNAL_TRANSFER_REQUIREMENT' ? 'ITR' : kind.slice(0, 8)}-${oid}`,
    documentKind: kind, header, createdBy: user._id, workflowStatus: status, note }, s);
}
async function link(parent, child, relation, s) { return save(m.DocumentLink, { parentDocumentId: parent._id, childDocumentId: child._id, relationCode: relation }, s); }
async function lineLink(source, target, quantity, s) { return save(m.LineLink, { sourceLineId: source._id, targetLineId: target._id, relationCode: 'TRANSFER_EXECUTION', linkedQty: quantity }, s); }
async function transaction(user, operation, input, work) {
  const key = `bf04:${id(user)}:${input.idempotencyKey}`;
  const payloadHash = hash({ operation, input });
  const session = await mongoose.startSession();
  const replayResult = async (replay) => {
    if (replay.payloadHash !== payloadHash || replay.operation !== operation) fail('Idempotency key đã dùng cho nội dung khác');
    const result = await read(m.BusinessDocument.findById(replay.documentId), session);
    await authorizeReplay(user, result, operation, session);
    return { id: id(result), documentNo: result.documentNo, status: result.workflowStatus, version: result.version, replayed: true };
  };
  try {
    return await session.withTransaction(async () => {
      const replay = await read(m.BusinessOperation.findOne({ idempotencyKey: key }), session);
      if (replay) return replayResult(replay);
      const result = await work(session, key, payloadHash);
      await save(m.BusinessOperation, { documentId: result._id, operation, operationKey: input.idempotencyKey,
        idempotencyKey: key, payloadHash, documentVersion: result.version, performedBy: user._id }, session);
      await save(m.AuditEvent, { documentId: result._id, actorId: user._id, action: operation,
        details: JSON.stringify({ version: result.version, reason: input.reason ?? null }) }, session);
      return { id: id(result), documentNo: result.documentNo, status: result.workflowStatus, version: result.version, replayed: false };
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } catch (error) {
    if (error.code !== 11000) throw error;
    // A concurrent identical command may win the unique operation key.
    // withTransaction has already rolled back this attempt before replaying it.
    const replay = await read(m.BusinessOperation.findOne({ idempotencyKey: key }), session);
    if (replay) return await replayResult(replay);
    fail('Dữ liệu vừa được tạo bởi thao tác khác; thử lại với cùng idempotency key');
  } finally { await session.endSession(); }
}

export async function createRequest(user, input) {
  access(user, 'stock_transfer:create'); assigned(user, input.sourceWarehouseId);
  return transaction(user, 'CREATE_TRANSFER_REQUEST', input, async (s) => {
    if (await m.Warehouse.countDocuments({ _id: { $in: [input.sourceWarehouseId, input.destinationWarehouseId] }, isActive: true }).session(s) !== 2) fail('Hai kho phải khác nhau và đang hoạt động', 400);
    const request = await document('TRANSFER_REQUEST', { sourceWarehouseId: input.sourceWarehouseId,
      destinationWarehouseId: input.destinationWarehouseId, neededOn: input.neededOn }, user, s, 'PENDING_APPROVAL', input.reason);
    for (const [i, row] of input.lines.entries()) {
      const product = await read(m.Product.findById(row.productId), s);
      const conversion = await read(m.ProductUomVersion.findById(row.conversionId), s);
      if (!product?.isActive || !conversion || !same(conversion.productId, product._id) || conversion.validFrom > new Date()) fail('Sản phẩm/quy đổi không hợp lệ', 400);
      const latest = await read(m.ProductUomVersion.findOne({ productId: product._id, uomId: conversion.uomId, validFrom: { $lte: new Date() } }).sort({ validFrom: -1, version: -1 }), s);
      if (!same(latest, conversion)) fail('Quy đổi đã thay đổi');
      const qty = exact(row.enteredQty).mul(exact(conversion.basePerUnit));
      if (qty.decimalPlaces() > 6 || qty.gte('100000000000000') || (product.wholeBaseUnits && !qty.isInteger())) fail('Số lượng quy đổi không hợp lệ', 400);
      await save(m.DocumentLine, { documentId: request._id, lineNo: i + 1, lineKind: 'STANDARD', productId: product._id,
        conversionId: conversion._id, conversionSnapshot: conversion.basePerUnit, enteredQty: row.enteredQty, qtyBase: qty.toFixed(), productNameSnapshot: product.name }, s);
    }
    return request;
  });
}
export async function reviewRequest(user, requestId, input) {
  access(user, 'stock_transfer:approve', 'OWNER');
  return transaction(user, 'REVIEW_TRANSFER_REQUEST', { ...input, requestId }, async (s) => {
    const request = await doc(requestId, 'TRANSFER_REQUEST', s); version(request, input.expectedVersion);
    if (request.workflowStatus !== 'PENDING_APPROVAL' || same(request.createdBy, user._id)) fail('Yêu cầu không được phép duyệt');
    const nextVersion = request.version + 1;
    await save(m.Approval, { documentId: request._id, documentVersion: nextVersion, decisionKind: 'TRANSFER_APPROVAL',
      decision: input.decision, requestedBy: request.createdBy, decidedBy: user._id, reason: input.reason,
      lines: (await lines(request, s)).map((line) => ({ lineId: line._id, approvedQty: input.decision === 'APPROVE' ? line.qtyBase : '0', outcome: input.decision })) }, s);
    const status = input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    await m.BusinessDocument.updateOne({ _id: request._id, documentKind: 'TRANSFER_REQUEST', version: request.version }, { $set: { workflowStatus: status,
      'header.approvedVersion': nextVersion }, $inc: { version: 1 } }, { session: s });
    return { ...request, version: nextVersion, workflowStatus: status };
  });
}

async function sourceContext(balanceId, warehouseId, s) {
  const balance = await read(m.StockBalance.findById(balanceId), s);
  const account = balance && await read(m.StockAccount.findById(balance.accountId), s);
  const location = account?.locationId && await read(m.Location.findById(account.locationId), s);
  const lot = balance && await read(m.Lot.findById(balance.lotId), s);
  const owner = balance && await read(m.Party.findById(balance.ownerPartyId), s);
  if (!balance || !location?.isActive || !same(location.warehouseId, warehouseId) || owner?.kind !== 'STORE' || !lot) fail('Tồn nguồn không hợp lệ', 400);
  return { balance, location, lot };
}
async function location(idValue, warehouseId, kind, s) {
  const result = await read(m.Location.findById(idValue), s);
  if (!result?.isActive || !same(result.warehouseId, warehouseId) || (kind && result.kind !== kind)) fail('Vị trí không hợp lệ cho nghiệp vụ', 400);
  return result;
}
export async function createDispatch(user, requestId, input) {
  access(user, 'stock_transfer:dispatch');
  return transaction(user, 'CREATE_TRANSFER_OUTBOUND', { ...input, requestId }, async (s) => {
    const request = await doc(requestId, 'TRANSFER_REQUEST', s); assigned(user, request.header.sourceWarehouseId); version(request, input.expectedVersion);
    if (request.workflowStatus !== 'APPROVED') fail('Yêu cầu chưa được duyệt hoặc đã đóng');
    await lockDocument(request, s);
    const requestLines = await lines(request, s);
    const existing = await read(m.BusinessDocument.find({ documentKind: 'TRANSFER_DISPATCH', 'header.requestId': request._id, workflowStatus: { $ne: 'CANCELLED' } }), s);
    const used = await read(m.DocumentLine.find({ documentId: { $in: existing.map((v) => v._id) } }), s);
    const totals = new Map();
    const outbound = await document('TRANSFER_DISPATCH', { requestId: request._id, dispatchedBy: user._id, dispatchedAt: new Date() }, user, s, 'DRAFT');
    for (const [i, row] of input.lines.entries()) {
      const origin = requestLines.find((v) => same(v, row.requestLineId));
      if (!origin) fail('Dòng không thuộc yêu cầu', 400);
      const { balance, location: from, lot } = await sourceContext(row.sourceBalanceId, request.header.sourceWarehouseId, s);
      const product = await read(m.Product.findById(lot.productId), s);
      if (!product?.isActive || (product.wholeBaseUnits && !exact(row.qtyBase).isInteger())) fail('Số lượng sản phẩm phải đúng đơn vị cơ sở', 400);
      if (from.kind !== 'STORAGE' || balance.qualityCode !== 'GOOD' || lot.identificationStatus !== 'VERIFIED' || !same(lot.productId, origin.productId)) fail('Chỉ lấy hàng hợp lệ đúng sản phẩm từ vị trí lưu trữ');
      await location(row.stagingLocationId, request.header.sourceWarehouseId, 'STAGING', s);
      const previous = used.filter((v) => same(v.details?.requestLineId, origin._id)).reduce((n, v) => n.plus(exact(v.qtyBase)), exact('0'));
      const total = (totals.get(id(origin)) ?? previous).plus(exact(row.qtyBase)); totals.set(id(origin), total);
      if (total.gt(exact(origin.qtyBase))) fail('Tổng xuất theo các đợt vượt lượng yêu cầu được duyệt');
      const created = await save(m.DocumentLine, { ...fields(origin, row.qtyBase), lotId: lot._id, documentId: outbound._id, lineNo: i + 1,
        lineKind: 'TRANSFER_OUTBOUND', details: { requestLineId: origin._id, sourceBalanceId: balance._id, stagingLocationId: row.stagingLocationId } }, s);
      await lineLink(origin, created, row.qtyBase, s);
    }
    await link(request, outbound, 'TRANSFER_OUTBOUND', s);
    return outbound;
  });
}

export async function createRequirement(user, sourceId, input) {
  access(user, 'stock_transfer:read');
  return transaction(user, 'CREATE_INTERNAL_REQUIREMENT', { ...input, sourceId }, async (s) => {
    const source = await read(m.BusinessDocument.findById(sourceId), s);
    if (!source || !['TRANSFER_DISPATCH', 'MWTR'].includes(source.documentKind)) fail('Nguồn phải là phiếu xuất hoặc phiếu nhận chuyển kho', 400);
    version(source, input.expectedVersion); await lockDocument(source, s);
    const picking = source.documentKind === 'TRANSFER_DISPATCH';
    access(user, picking ? 'stock_transfer:dispatch' : 'stock_transfer:receive');
    const outbound = picking ? source : await doc(source.header.dispatchId, 'TRANSFER_DISPATCH', s);
    const request = await doc(outbound.header.requestId, 'TRANSFER_REQUEST', s);
    const warehouseId = picking ? request.header.sourceWarehouseId : request.header.destinationWarehouseId; assigned(user, warehouseId);
    if (source.workflowStatus !== (picking ? 'DRAFT' : 'POSTED')) fail('Chứng từ nguồn chưa đủ điều kiện');
    if (await m.BusinessDocument.exists({ documentKind: 'INTERNAL_TRANSFER_REQUIREMENT', 'header.sourceDocumentId': source._id }).session(s)) fail('Chứng từ đã có yêu cầu nội bộ');
    const requirement = await document('INTERNAL_TRANSFER_REQUIREMENT', { warehouseId, sourceDocumentId: source._id, taskKind: picking ? 'PICK' : 'PUTAWAY' }, user, s);
    const task = await document('TO', { warehouseId, taskKind: picking ? 'PICK' : 'PUTAWAY', assignedTo: user._id }, user, s);
    const sourceLines = (await lines(source, s)).filter((line) => picking || line.details.qualityCode !== 'DAMAGED');
    const destinations = input.destinations ?? [];
    if (!picking && (destinations.length !== sourceLines.length || destinations.some((d) => !sourceLines.some((l) => same(l, d.receiptLineId))))) fail('Chọn vị trí đích cho tất cả dòng nhận', 400);
    const contexts = [];
    for (const row of sourceLines) contexts.push(await sourceContext(picking ? row.details.sourceBalanceId : row.details.destinationBalanceId, warehouseId, s));
    await guardLocations([...contexts.map((c) => c.location._id), ...sourceLines.map((row) => picking
      ? row.details.stagingLocationId : destinations.find((d) => same(d.receiptLineId, row._id)).locationId)], s);
    const plannedTotals = new Map();
    for (const [i, row] of sourceLines.entries()) {
      const ctx = contexts[i];
      const planned = (plannedTotals.get(id(ctx.balance)) ?? exact('0')).plus(exact(row.qtyBase));
      plannedTotals.set(id(ctx.balance), planned);
      const pending = await pendingTaskQuantity(ctx.balance, ctx.location._id, s, task._id);
      const reservations = await read(m.Reservation.find({ balanceId: ctx.balance._id, status: 'ACTIVE' }), s);
      const reserved = reservations.reduce((n, v) => n.plus(exact(v.qtyBase)), exact('0'));
      if (planned.plus(pending).plus(reserved).gt(exact(ctx.balance.qtyBase))) fail('Không đủ tồn khả dụng để lập TO');
      if (await m.DefectHold.exists({ balanceId: ctx.balance._id, status: 'ACTIVE' }).session(s)) fail('Tồn nguồn đang bị giữ');
      const targetId = picking ? row.details.stagingLocationId : destinations.find((d) => same(d.receiptLineId, row._id))?.locationId;
      const target = await location(targetId, warehouseId, picking ? 'STAGING' : row.details.qualityCode === 'DAMAGED' ? 'QUARANTINE' : 'STORAGE', s);
      if (same(ctx.location, target)) fail('Vị trí nhận và vị trí lưu đích phải khác nhau', 400);
      const details = { sourceBalanceId: ctx.balance._id, sourceBalanceVersion: ctx.balance.version,
        fromLocationId: ctx.location._id, toLocationId: target._id, qualityCode: ctx.balance.qualityCode, ownerPartyId: ctx.balance.ownerPartyId };
      const plannedLine = await save(m.DocumentLine, { ...fields(row), documentId: requirement._id, lineNo: i + 1, lineKind: 'WAREHOUSE_TASK', details }, s);
      const taskLine = await save(m.DocumentLine, { ...fields(row), documentId: task._id, lineNo: i + 1, lineKind: 'WAREHOUSE_TASK', details }, s);
      await lineLink(row, taskLine, row.qtyBase, s); await lineLink(plannedLine, taskLine, row.qtyBase, s);
    }
    await link(source, requirement, 'INTERNAL_REQUIREMENT', s); await link(requirement, task, 'GENERATED_TO', s);
    if (!sourceLines.length) {
      task.workflowStatus = 'CONFIRMED'; await task.save({ session: s });
      requirement.workflowStatus = 'COMPLETED'; await requirement.save({ session: s });
    }
    return task;
  });
}

async function balanceAt(accountFields, source, quality, s) {
  let account = await read(m.StockAccount.findOne(accountFields), s);
  if (!account) account = await save(m.StockAccount, accountFields, s);
  const filter = { accountId: account._id, lotId: source.lotId, ownerPartyId: source.ownerPartyId, qualityCode: quality };
  return await read(m.StockBalance.findOne(filter), s) ?? await save(m.StockBalance, { ...filter, qtyBase: '0' }, s);
}
async function guardLocations(ids, s) {
  const locations = await read(m.Location.find({ _id: { $in: ids } }), s);
  const warehouseIds = [...new Set(locations.map((v) => id(v.warehouseId)))];
  if (await m.Warehouse.countDocuments({ _id: { $in: warehouseIds }, isActive: true }).session(s) !== warehouseIds.length) fail('Kho đã ngừng hoạt động');
  for (const locationId of [...new Set(ids.map(id))].sort()) {
    const result = await m.Location.updateOne({ _id: locationId, isActive: true }, { $inc: { planningVersion: 1 } }, { session: s });
    if (!result.matchedCount) fail('Vị trí không hoạt động');
  }
  if (await m.LocationLock.exists({ locationId: { $in: ids } }).session(s)) fail('Phạm vi đang khóa kiểm kê');
}
async function move(sourceId, target, qty, line, batch, s) {
  const source = await read(m.StockBalance.findById(sourceId), s);
  const destination = await read(m.StockBalance.findById(target._id), s);
  const quantity = exact(qty), from = exact(source.qtyBase), to = exact(destination.qtyBase);
  if (quantity.gt(from)) fail('Không đủ tồn nguồn');
  if (await m.DefectHold.exists({ balanceId: source._id, status: 'ACTIVE' }).session(s)) fail('Tồn nguồn đang bị giữ');
  // Reserved stock needs a demand-linked transfer; do not release another order's reservation.
  const reserved = (await read(m.Reservation.find({ balanceId: source._id, status: 'ACTIVE' }), s)).reduce((n, v) => n.plus(exact(v.qtyBase)), exact('0'));
  if (quantity.plus(reserved).gt(from)) fail('Phần hàng đang được giữ cho nhu cầu khác chưa được phép xuất');
  for (const [balance, value] of [[source, from.minus(quantity)], [destination, to.plus(quantity)]]) {
    const result = await m.StockBalance.updateOne({ _id: balance._id, version: balance.version }, { $set: { qtyBase: value.toFixed() }, $inc: { version: 1 } }, { session: s });
    if (!result.matchedCount) fail('Tồn đã thay đổi');
  }
  await save(m.StockMovement, { batchId: batch._id, documentId: batch.documentId, lineId: line._id,
    fromBalanceId: source._id, toBalanceId: destination._id, qtyBase: quantity.toFixed(),
    fromBefore: from.toFixed(), fromAfter: from.minus(quantity).toFixed(), toBefore: to.toFixed(), toAfter: to.plus(quantity).toFixed() }, s);
}
export async function confirmTask(user, taskId, input) {
  access(user, 'stock_transfer:read');
  return transaction(user, 'CONFIRM_TRANSFER_TO', { ...input, taskId }, async (s, key, payloadHash) => {
    const task = await doc(taskId, 'TO', s); assigned(user, task.header.warehouseId); version(task, input.expectedVersion);
    if (task.workflowStatus !== 'OPEN' || !['PICK', 'PUTAWAY'].includes(task.header.taskKind)) fail('TO không còn mở');
    const parentLink = await read(m.DocumentLink.findOne({ childDocumentId: task._id, relationCode: 'GENERATED_TO' }), s);
    if (!parentLink) fail('TO không thuộc BF04', 400);
    const requirement = await doc(parentLink.parentDocumentId, 'INTERNAL_TRANSFER_REQUIREMENT', s);
    const picking = task.header.taskKind === 'PICK';
    access(user, picking ? 'stock_transfer:dispatch' : 'stock_transfer:receive');
    const source = await doc(requirement.header.sourceDocumentId, picking ? 'TRANSFER_DISPATCH' : 'MWTR', s);
    const outbound = picking ? source : await doc(source.header.dispatchId, 'TRANSFER_DISPATCH', s);
    const request = await doc(outbound.header.requestId, 'TRANSFER_REQUEST', s);
    if (request.workflowStatus !== 'APPROVED') fail('Yêu cầu không còn hiệu lực');
    if (picking && !same(outbound.createdBy, user._id)) fail('Chỉ người tạo phiếu xuất được xác nhận xuất', 403);
    const taskLines = await lines(task, s);
    await guardLocations(taskLines.flatMap((line) => [line.details.fromLocationId, line.details.toLocationId]), s);
    const sourceLines = await lines(source, s);
    const batch = await save(m.PostingBatch, { documentId: picking ? outbound._id : task._id, operation: picking ? 'TRANSFER_DISPATCH' : 'TRANSFER_PUTAWAY',
      operationKey: input.idempotencyKey, idempotencyKey: key, payloadHash, postedBy: user._id }, s);
    for (const line of taskLines) {
      const sourceLink = await read(m.LineLink.findOne({ sourceLineId: { $in: sourceLines.map((v) => v._id) }, targetLineId: line._id }), s);
      const origin = sourceLines.find((v) => same(v, sourceLink?.sourceLineId));
      if (!origin) fail('Thiếu liên kết dòng nguồn');
      const ctx = await sourceContext(line.details.sourceBalanceId, task.header.warehouseId, s);
      const product = await read(m.Product.findById(ctx.lot.productId), s);
      if (!product?.isActive || !same(product._id, line.productId) || (picking && (ctx.balance.qualityCode !== 'GOOD' || ctx.lot.identificationStatus !== 'VERIFIED'))) fail('Sản phẩm/lô không đủ điều kiện');
      const otherPlanned = await pendingTaskQuantity(ctx.balance, ctx.location._id, s, task._id);
      if (exact(line.qtyBase).plus(otherPlanned).gt(exact(ctx.balance.qtyBase))) fail('Tồn đã được lập kế hoạch cho lệnh khác');
      await location(line.details.toLocationId, task.header.warehouseId, picking ? 'STAGING' : ctx.balance.qualityCode === 'DAMAGED' ? 'QUARANTINE' : 'STORAGE', s);
      if (!same(ctx.lot, line.lotId) || ctx.balance.qualityCode !== line.details.qualityCode) fail('Tồn nguồn không khớp TO');
      const destination = await balanceAt({ locationId: line.details.toLocationId }, ctx.balance, ctx.balance.qualityCode, s);
      await move(ctx.balance._id, destination, line.qtyBase, picking ? origin : line, batch, s);
      if (picking) {
        const transit = await balanceAt({ transitDispatchLineId: origin._id }, ctx.balance, ctx.balance.qualityCode, s);
        await move(destination._id, transit, line.qtyBase, origin, batch, s);
      }
    }
    if (picking) await m.BusinessDocument.updateOne({ _id: outbound._id, documentKind: 'TRANSFER_DISPATCH', workflowStatus: 'DRAFT' }, {
      $set: { workflowStatus: 'POSTED', 'header.dispatchedBy': user._id, 'header.dispatchedAt': new Date() }, $inc: { version: 1 } }, { session: s });
    await m.BusinessDocument.updateOne({ _id: requirement._id }, { $set: { workflowStatus: 'COMPLETED' }, $inc: { version: 1 } }, { session: s });
    const updated = await m.BusinessDocument.updateOne({ _id: task._id, version: task.version, workflowStatus: 'OPEN' }, { $set: { workflowStatus: 'CONFIRMED' }, $inc: { version: 1 } }, { session: s });
    if (!updated.matchedCount) fail('TO đã được xác nhận');
    return { ...task, version: task.version + 1, workflowStatus: 'CONFIRMED' };
  });
}
export async function receiveTransfer(user, dispatchId, input) {
  access(user, 'stock_transfer:receive');
  return transaction(user, 'RECEIVE_TRANSFER', { ...input, dispatchId }, async (s, key, payloadHash) => {
    const outbound = await doc(dispatchId, 'TRANSFER_DISPATCH', s); version(outbound, input.expectedVersion);
    const request = await doc(outbound.header.requestId, 'TRANSFER_REQUEST', s); assigned(user, request.header.destinationWarehouseId);
    if (outbound.workflowStatus !== 'POSTED' || request.workflowStatus !== 'APPROVED') fail('Phiếu xuất chưa thực xuất hoặc yêu cầu đã đóng');
    if (same(outbound.header.dispatchedBy, user._id)) fail('Người nhận phải khác người xuất', 403);
    await lockDocument(outbound, s);
    const sourceLines = await lines(outbound, s);
    await guardLocations(input.lines.map((row) => row.locationId), s);
    const receipt = await document('MWTR', { dispatchId: outbound._id, receivedBy: user._id, receivedAt: new Date() }, user, s, 'POSTED');
    const batch = await save(m.PostingBatch, { documentId: receipt._id, operation: 'TRANSFER_RECEIPT', operationKey: input.idempotencyKey,
      idempotencyKey: key, payloadHash, postedBy: user._id }, s);
    for (const [i, row] of input.lines.entries()) {
      const origin = sourceLines.find((line) => same(line, row.dispatchLineId));
      if (!origin) fail('Dòng không thuộc phiếu xuất', 400);
      const product = await read(m.Product.findById(origin.productId), s);
      if (!product || (product.wholeBaseUnits && !exact(row.qtyBase).isInteger())) fail('Số lượng thực nhận không hợp lệ', 400);
      await location(row.locationId, request.header.destinationWarehouseId, row.qualityCode === 'DAMAGED' ? 'QUARANTINE' : 'RECEIVING', s);
      const account = await read(m.StockAccount.findOne({ transitDispatchLineId: origin._id }), s);
      const transit = account && await read(m.StockBalance.findOne({ accountId: account._id, lotId: origin.lotId, qualityCode: 'GOOD' }), s);
      if (!transit) fail('Không có lượng hàng đang vận chuyển');
      const destination = await balanceAt({ locationId: row.locationId }, transit, row.qualityCode, s);
      const line = await save(m.DocumentLine, { ...fields(origin, row.qtyBase), documentId: receipt._id, lineNo: i + 1, lineKind: 'TRANSFER_RECEIPT',
        details: { dispatchLineId: origin._id, qualityCode: row.qualityCode, destinationBalanceId: destination._id, receivingLocationId: row.locationId } }, s);
      await move(transit._id, destination, row.qtyBase, line, batch, s); await lineLink(origin, line, row.qtyBase, s);
      if (row.qualityCode === 'DAMAGED') {
        const report = await document('DEFECT_CASE', { discoveredAt: new Date(), reason: row.damageReason }, user, s);
        const reportLine = await save(m.DocumentLine, { ...fields(line), documentId: report._id, lineNo: 1, lineKind: 'STANDARD' }, s);
        await link(receipt, report, 'TRANSFER_DAMAGE_REPORT', s); await lineLink(line, reportLine, row.qtyBase, s);
        await save(m.AuditEvent, { documentId: receipt._id, actorId: user._id, action: 'TRANSFER_DAMAGE_REPORT',
          details: JSON.stringify({ reportId: id(report), lineId: id(line), qtyBase: row.qtyBase, reason: row.damageReason, quarantineLocationId: row.locationId }) }, s);
      }
    }
    await link(outbound, receipt, 'TRANSFER_RECEIPT', s);
    return receipt;
  });
}
export async function closeRequest(user, requestId, input) {
  access(user, 'stock_transfer:receive');
  return transaction(user, 'CLOSE_TRANSFER_REQUEST', { ...input, requestId }, async (s) => {
    const request = await doc(requestId, 'TRANSFER_REQUEST', s); assigned(user, request.header.destinationWarehouseId); version(request, input.expectedVersion);
    if (request.workflowStatus !== 'APPROVED') fail('Yêu cầu chưa đủ điều kiện đóng');
    await lockDocument(request, s);
    const requestLines = await lines(request, s);
    const dispatches = await read(m.BusinessDocument.find({ documentKind: 'TRANSFER_DISPATCH', 'header.requestId': request._id }), s);
    if (!dispatches.length || dispatches.some((v) => v.workflowStatus !== 'POSTED')) fail('Còn phiếu xuất chưa hoàn tất');
    const dispatchLines = await read(m.DocumentLine.find({ documentId: { $in: dispatches.map((v) => v._id) } }), s);
    for (const line of requestLines) {
      const shipped = dispatchLines.filter((v) => same(v.details?.requestLineId, line._id)).reduce((n, v) => n.plus(exact(v.qtyBase)), exact('0'));
      if (!shipped.eq(exact(line.qtyBase))) fail('Chưa xuất đủ yêu cầu');
    }
    const accounts = await read(m.StockAccount.find({ transitDispatchLineId: { $in: dispatchLines.map((v) => v._id) } }), s);
    if (await m.StockBalance.exists({ accountId: { $in: accounts.map((v) => v._id) }, qtyBase: { $gt: 0 } }).session(s)) fail('Còn hàng đang vận chuyển hoặc thiếu chưa xử lý');
    const receipts = await read(m.BusinessDocument.find({ documentKind: 'MWTR', 'header.dispatchId': { $in: dispatches.map((v) => v._id) }, workflowStatus: 'POSTED' }), s);
    if (!receipts.length) fail('Chưa có phiếu nhận');
    for (const receipt of receipts) {
      const requirement = await read(m.BusinessDocument.findOne({ documentKind: 'INTERNAL_TRANSFER_REQUIREMENT', 'header.sourceDocumentId': receipt._id }), s);
      if (requirement?.workflowStatus !== 'COMPLETED') fail('Chưa hoàn tất cất hàng cho mọi phiếu nhận');
    }
    await m.BusinessDocument.updateOne({ _id: request._id, version: request.version }, { $set: { workflowStatus: 'COMPLETED' }, $inc: { version: 1 } }, { session: s });
    return { ...request, workflowStatus: 'COMPLETED', version: request.version + 1 };
  });
}
