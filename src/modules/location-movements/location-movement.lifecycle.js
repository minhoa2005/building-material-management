import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import {
  BusinessDocument, DocumentLine, BusinessOperation, AuditEvent, Location, LocationLock,
  StockAccount, StockBalance, Reservation, PostingBatch, StockMovement, DefectHold,
  Lot, Product, Party,
} from '../../models/index.js';
import { exact } from '../../models/model-utils.js';
import { currentRole, rolePermissions } from '../../shared/utils/userRole.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { checkLocations, netMovedQuantity, pendingTaskQuantity, validateLines } from './location-movement.service.js';

const id = (value) => value == null ? null : String(value._id ?? value);
const same = (a, b) => id(a) === id(b);
const conflict = (message) => { throw new ApiError(409, message); };
const transactionOptions = { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } };
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const read = (query, session) => query.session(session).lean();

function authorize(user, action) {
  if (!user?.isActive || currentRole(user)?.code !== 'WAREHOUSE'
    || !rolePermissions(user).includes(`stock_relocation:${action}`)) {
    throw new ApiError(403, 'Bạn không có quyền thực hiện thao tác chuyển vị trí');
  }
}

async function ownOrder(user, documentId, session) {
  const document = await read(BusinessDocument.findOne({
    _id: documentId, documentKind: 'TO', 'header.taskKind': 'RELOCATE',
  }), session);
  if (!document || !same(document.createdBy, user._id)
    || !(user.warehouseIds ?? []).some((warehouseId) => same(warehouseId, document.header.warehouseId))) {
    throw new ApiError(404, 'Không tìm thấy lệnh chuyển vị trí do bạn tạo trong kho được phân công');
  }
  return document;
}

async function repeatOperation(user, document, operation, input, session) {
  const key = `relocation:${operation}:${id(document)}:${input.idempotencyKey}`;
  const prior = await read(BusinessOperation.findOne({ idempotencyKey: key }), session);
  if (!prior) return { key, replay: null };
  if (!same(prior.performedBy, user._id) || prior.payloadHash !== hash(input)) conflict('Idempotency key đã dùng với nội dung khác');
  return { key, replay: { id: id(document), documentNo: document.documentNo,
    workflowStatus: document.workflowStatus, version: document.version, replayed: true } };
}

async function saveOperation(user, document, operation, key, input, version, session) {
  const record = new BusinessOperation({ documentId: document._id, operation,
    operationKey: input.idempotencyKey, idempotencyKey: key, payloadHash: hash(input),
    documentVersion: version, performedBy: user._id, reason: input.reason ?? null });
  await record.save({ session });
  await new AuditEvent({ documentId: document._id, actorId: user._id,
    action: operation, details: JSON.stringify({ operationId: id(record), version }) }).save({ session });
}

async function runTransaction(work) {
  const session = await mongoose.startSession();
  try { return await session.withTransaction(() => work(session), transactionOptions); }
  finally { await session.endSession(); }
}

export async function editLocationMovement(user, documentId, input) {
  authorize(user, 'create');
  return runTransaction(async (session) => {
    const document = await ownOrder(user, documentId, session);
    const { key, replay } = await repeatOperation(user, document, 'EDIT_RELOCATION', input, session);
    if (replay) return replay;
    if (document.workflowStatus !== 'OPEN') conflict('Chỉ sửa lệnh chưa được xác nhận');
    if (document.version !== input.expectedVersion) conflict('Lệnh đã thay đổi; tải lại trước khi sửa');
    if (await PostingBatch.exists({ documentId }).session(session)) conflict('Lệnh đã có bút toán tồn kho');
    const previous = await read(DocumentLine.find({ documentId, lineKind: 'WAREHOUSE_TASK' }).sort({ lineNo: 1 }), session);
    if (await Reservation.exists({ executionLineId: { $in: previous.map((line) => line._id) }, status: 'ACTIVE' }).session(session)) {
      conflict('Lệnh đã có liên kết giữ hàng; không thể thay nội dung');
    }
    const prepared = await validateLines({ ...input, warehouseId: id(document.header.warehouseId) }, session, documentId);
    await new AuditEvent({ documentId, actorId: user._id, action: 'EDIT_RELOCATION_OLD_HEADER',
      details: JSON.stringify({ version: document.version, reason: document.note ?? null }) }).save({ session });
    await DocumentLine.deleteMany({ documentId, lineKind: 'WAREHOUSE_TASK' }).session(session);
    for (const line of prepared) await new DocumentLine({ ...line, documentId }).save({ session });
    // Keep an immutable per-line image so replacing draft lines does not erase edit history.
    for (const line of previous) await new AuditEvent({ documentId, actorId: user._id,
      action: 'EDIT_RELOCATION_OLD_LINE', details: JSON.stringify({ lineNo: line.lineNo,
        sourceBalanceId: id(line.details.sourceBalanceId), toLocationId: id(line.details.toLocationId),
        qtyBase: line.qtyBase.toString(), conversionId: id(line.conversionId) }) }).save({ session });
    const result = await BusinessDocument.updateOne({ _id: documentId, version: input.expectedVersion, workflowStatus: 'OPEN' },
      { $set: { note: input.reason }, $inc: { version: 1 } }, { session });
    if (result.matchedCount !== 1) conflict('Lệnh đã thay đổi; tải lại trước khi sửa');
    await saveOperation(user, document, 'EDIT_RELOCATION', key, input, document.version + 1, session);
    return { id: documentId, documentNo: document.documentNo, workflowStatus: 'OPEN', version: document.version + 1, replayed: false };
  });
}

export async function cancelLocationMovement(user, documentId, input) {
  authorize(user, 'create');
  return runTransaction(async (session) => {
    const document = await ownOrder(user, documentId, session);
    const { key, replay } = await repeatOperation(user, document, 'CANCEL_RELOCATION', input, session);
    if (replay) return replay;
    if (!['OPEN', 'PARTIAL'].includes(document.workflowStatus)) conflict('Chỉ hủy lệnh đang mở hoặc phần chưa thực hiện');
    if (document.version !== input.expectedVersion) conflict('Lệnh đã thay đổi; tải lại trước khi hủy');
    const lineIds = (await read(DocumentLine.find({ documentId }).select('_id'), session)).map((line) => line._id);
    if (await Reservation.exists({ executionLineId: { $in: lineIds }, status: 'ACTIVE' }).session(session)) {
      conflict('Lệnh còn liên kết giữ hàng; cần xử lý trước khi hủy');
    }
    const result = await BusinessDocument.updateOne({ _id: documentId, version: input.expectedVersion,
      workflowStatus: { $in: ['OPEN', 'PARTIAL'] } },
    { $set: { workflowStatus: 'CANCELLED' }, $inc: { version: 1 } }, { session });
    if (result.matchedCount !== 1) conflict('Lệnh đã thay đổi; tải lại trước khi hủy');
    await saveOperation(user, document, 'CANCEL_RELOCATION', key, input, document.version + 1, session);
    return { id: documentId, documentNo: document.documentNo, workflowStatus: 'CANCELLED',
      version: document.version + 1, replayed: false };
  });
}

async function carryReservations(source, destination, sourceBefore, moved, session) {
  const reservations = await read(Reservation.find({ balanceId: source._id, status: 'ACTIVE' }).sort({ _id: 1 }), session);
  const reserved = reservations.reduce((total, item) => total.plus(exact(item.qtyBase)), exact('0'));
  if (reserved.gt(sourceBefore)) conflict('Lượng giữ hàng vượt tồn nguồn');
  let toCarry = exact(moved).minus(sourceBefore.minus(reserved));
  if (toCarry.lte(0)) return;
  for (const reservation of reservations) {
    if (toCarry.lte(0)) break;
    const quantity = exact(reservation.qtyBase);
    const part = quantity.lt(toCarry) ? quantity : toCarry;
    if (part.eq(quantity)) {
      await Reservation.updateOne({ _id: reservation._id, balanceId: source._id, status: 'ACTIVE' },
        { $set: { balanceId: destination._id } }, { session });
    } else {
      await Reservation.updateOne({ _id: reservation._id, balanceId: source._id, status: 'ACTIVE' },
        { $set: { qtyBase: quantity.minus(part).toFixed() } }, { session });
      await new Reservation({ demandLineId: reservation.demandLineId, executionLineId: reservation.executionLineId,
        balanceId: destination._id, qtyBase: part.toFixed(), status: 'ACTIVE' }).save({ session });
    }
    toCarry = toCarry.minus(part);
  }
  if (toCarry.gt(0)) conflict('Không thể chuyển đủ lượng giữ hàng');
}

async function destinationBalance(line, session) {
  let account = await read(StockAccount.findOne({ locationId: line.details.toLocationId }), session);
  if (!account) {
    const created = new StockAccount({ locationId: line.details.toLocationId });
    await created.save({ session });
    account = created;
  }
  let balance = await read(StockBalance.findOne({ accountId: account._id, lotId: line.lotId,
    qualityCode: line.details.qualityCode, ownerPartyId: line.details.ownerPartyId }), session);
  if (!balance) {
    const created = new StockBalance({ accountId: account._id, lotId: line.lotId,
      qualityCode: line.details.qualityCode, ownerPartyId: line.details.ownerPartyId, qtyBase: '0' });
    await created.save({ session });
    balance = created;
  }
  return balance;
}

export async function confirmLocationMovement(user, documentId, input) {
  authorize(user, 'confirm');
  return runTransaction(async (session) => {
    const document = await ownOrder(user, documentId, session);
    const key = `relocation:confirm:${documentId}:${input.idempotencyKey}`;
    const payloadHash = hash(input);
    const prior = await read(PostingBatch.findOne({ idempotencyKey: key }), session);
    if (prior) {
      if (prior.payloadHash !== payloadHash || !same(prior.postedBy, user._id)) conflict('Idempotency key đã dùng với nội dung khác');
      return { id: documentId, documentNo: document.documentNo, workflowStatus: document.workflowStatus,
        version: document.version, batchId: id(prior), replayed: true };
    }
    if (!['OPEN', 'PARTIAL'].includes(document.workflowStatus)) conflict('Lệnh không còn chờ xác nhận');
    if (document.version !== input.expectedVersion) conflict('Lệnh đã thay đổi; tải lại trước khi xác nhận');
    const lines = await read(DocumentLine.find({ documentId, lineKind: 'WAREHOUSE_TASK' }), session);
    const byLine = new Map(lines.map((line) => [id(line), line]));
    const selected = input.lines.map((entry) => ({ ...entry, line: byLine.get(entry.lineId) }));
    if (selected.some((entry) => !entry.line)) throw new ApiError(400, 'Dòng xác nhận không thuộc lệnh');
    const locations = [...new Set(selected.flatMap(({ line }) => [id(line.details.fromLocationId), id(line.details.toLocationId)]))].sort();
    for (const locationId of locations) {
      const result = await Location.updateOne({ _id: locationId, warehouseId: document.header.warehouseId, isActive: true },
        { $inc: { planningVersion: 1 } }, { session });
      if (result.matchedCount !== 1) conflict('Vị trí đã ngừng hoạt động hoặc đổi kho');
    }
    if (await LocationLock.exists({ locationId: { $in: locations } }).session(session)) conflict('Vị trí đang bị khóa kiểm kê');
    const placeRecords = await read(Location.find({ _id: { $in: locations } }), session);
    const byLocation = new Map(placeRecords.map((item) => [id(item), item]));
    const previousMovements = await read(StockMovement.find({ documentId }), session);
    const batches = await read(PostingBatch.find({ documentId }), session);
    const movedByLine = new Map(lines.map((line) => [id(line), netMovedQuantity(
      previousMovements.filter((movement) => same(movement.lineId, line._id)), batches)]));
    const batch = new PostingBatch({ documentId, operation: 'CONFIRM_RELOCATION',
      operationKey: input.idempotencyKey, idempotencyKey: key, payloadHash,
      postedBy: user._id });
    await batch.save({ session });
    for (const { line, actualQtyBase } of selected) {
      const quantity = exact(actualQtyBase);
      const remaining = exact(line.qtyBase).minus(movedByLine.get(id(line)));
      if (quantity.gt(remaining) || remaining.lte(0)) conflict('Số lượng xác nhận vượt phần còn lại');
      const from = byLocation.get(id(line.details.fromLocationId));
      const to = byLocation.get(id(line.details.toLocationId));
      checkLocations(from, to, document.header.warehouseId);
      const source = await read(StockBalance.findById(line.details.sourceBalanceId), session);
      const account = source && await read(StockAccount.findById(source.accountId), session);
      if (!source || !account || !same(account.locationId, from._id)
        || !same(source.lotId, line.lotId) || !same(source.ownerPartyId, line.details.ownerPartyId)
        || source.qualityCode !== line.details.qualityCode) conflict('Tồn nguồn không còn khớp với lệnh');
      if (await DefectHold.exists({ balanceId: source._id, status: 'ACTIVE' }).session(session)) conflict('Hàng nguồn đang bị giữ do lỗi');
      const lot = await read(Lot.findById(line.lotId), session);
      const product = lot && await read(Product.findById(lot.productId), session);
      const owner = await read(Party.findById(source.ownerPartyId), session);
      if (!lot || !product?.isActive || !owner || !same(product._id, line.productId)) conflict('Sản phẩm, lô hoặc chủ hàng không hợp lệ');
      if (to.allocatable && (source.qualityCode !== 'GOOD' || lot.identificationStatus !== 'VERIFIED' || owner.kind !== 'STORE')) {
        conflict('Hàng chưa đủ điều kiện để đưa vào vị trí khả dụng');
      }
      const before = exact(source.qtyBase);
      const otherPending = await pendingTaskQuantity(source, from._id, session, documentId);
      if (quantity.plus(otherPending).gt(before)) conflict('Không đủ tồn nguồn sau các lệnh đang mở');
      const destination = await destinationBalance(line, session);
      const destinationBefore = exact(destination.qtyBase);
      await carryReservations(source, destination, before, quantity, session);
      const sourceAfter = before.minus(quantity);
      const destinationAfter = destinationBefore.plus(quantity);
      const sourceWrite = await StockBalance.updateOne({ _id: source._id, version: source.version },
        { $set: { qtyBase: sourceAfter.toFixed() }, $inc: { version: 1 } }, { session });
      const destinationWrite = await StockBalance.updateOne({ _id: destination._id, version: destination.version },
        { $set: { qtyBase: destinationAfter.toFixed() }, $inc: { version: 1 } }, { session });
      if (sourceWrite.matchedCount !== 1 || destinationWrite.matchedCount !== 1) conflict('Tồn đã thay đổi trong lúc xác nhận');
      await new StockMovement({ batchId: batch._id, documentId, lineId: line._id,
        fromBalanceId: source._id, toBalanceId: destination._id, qtyBase: quantity.toFixed(),
        fromBefore: before.toFixed(), fromAfter: sourceAfter.toFixed(),
        toBefore: destinationBefore.toFixed(), toAfter: destinationAfter.toFixed() }).save({ session });
      movedByLine.set(id(line), movedByLine.get(id(line)).plus(quantity));
    }
    const complete = lines.every((line) => movedByLine.get(id(line)).eq(exact(line.qtyBase)));
    const status = complete ? 'CONFIRMED' : 'PARTIAL';
    const updated = await BusinessDocument.updateOne({ _id: documentId, version: input.expectedVersion,
      workflowStatus: { $in: ['OPEN', 'PARTIAL'] } },
    { $set: { workflowStatus: status }, $inc: { version: 1 } }, { session });
    if (updated.matchedCount !== 1) conflict('Lệnh đã thay đổi trong lúc xác nhận');
    await new AuditEvent({ documentId, actorId: user._id, action: 'CONFIRM_RELOCATION',
      details: JSON.stringify({ batchId: id(batch), status, lineCount: selected.length }) }).save({ session });
    return { id: documentId, documentNo: document.documentNo, workflowStatus: status,
      version: document.version + 1, batchId: id(batch), replayed: false };
  });
}
