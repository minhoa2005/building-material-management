import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import {
  BusinessDocument, DocumentLine, BusinessOperation, AuditEvent,
  Warehouse, Location, Lot, Product, ProductUomVersion, Uom, Party,
  StockAccount, StockBalance, Reservation, LocationLock, DefectHold,
  StockMovement, PostingBatch,
} from '../../models/index.js';
import { exact } from '../../models/model-utils.js';
import { currentRole, rolePermissions } from '../../shared/utils/userRole.js';
import { ApiError } from '../../shared/utils/ApiError.js';

const id = (value) => value == null ? null : String(value._id ?? value);
const same = (a, b) => id(a) === id(b);
const read = (query, session) => query.session(session).lean();
const conflict = (message) => { throw new ApiError(409, message); };
const notFound = () => { throw new ApiError(404, 'Không tìm thấy lệnh chuyển vị trí trong phạm vi được phép'); };
const operationName = 'CREATE_RELOCATION';
const transactionOptions = { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } };

function requirePermission(user, action) {
  const roles = action === 'create' ? ['WAREHOUSE'] : ['OWNER', 'WAREHOUSE'];
  if (!user?.isActive || !roles.includes(currentRole(user)?.code)
    || !rolePermissions(user).includes(`stock_relocation:${action}`)) {
    throw new ApiError(403, 'Bạn không có quyền thực hiện hành động này');
  }
}

function hasWarehouse(user, warehouseId) {
  return currentRole(user)?.code === 'OWNER'
    || (user.warehouseIds ?? []).some((value) => same(value, warehouseId));
}

// A relocation preserves the storage purpose. Receiving -> storage, staging
// and quarantine workflow transitions use their dedicated task/decision UCs.
export function checkLocations(source, destination, warehouseId) {
  if (!source || !destination || !same(source.warehouseId, warehouseId)
    || !same(destination.warehouseId, warehouseId)) {
    throw new ApiError(400, 'Vị trí nguồn và đích phải thuộc cùng kho đã chọn');
  }
  if (same(source, destination)) throw new ApiError(400, 'Vị trí nguồn và đích phải khác nhau');
  if (!source.isActive || !destination.isActive) conflict('Vị trí nguồn hoặc đích đã ngừng hoạt động');
  if (source.kind !== destination.kind) {
    conflict('Chuyển vị trí phải giữ loại khu lưu hàng; dùng nghiệp vụ put-away, picking hoặc xử lý hàng lỗi cho việc đổi khu');
  }
}

// One ledger row represents BOTH movement legs. Count it once, subtracting
// reversal batches rather than treating the planned quantity as actual.
export function netMovedQuantity(movements, batches) {
  const byId = new Map(batches.map((batch) => [id(batch), batch]));
  const sign = (batch) => {
    let direction = 1;
    const seen = new Set();
    while (batch?.reversalOf) {
      if (seen.has(id(batch))) conflict('Lịch sử đảo giao dịch không hợp lệ');
      seen.add(id(batch));
      direction *= -1;
      batch = byId.get(id(batch.reversalOf));
      if (!batch) conflict('Thiếu giao dịch gốc của bút toán đảo');
    }
    return direction;
  };
  return movements.reduce((total, movement) => {
    const batch = byId.get(id(movement.batchId));
    if (!batch) return total;
    return total.plus(exact(movement.qtyBase).mul(sign(batch)));
  }, exact('0'));
}

export async function pendingTaskQuantity(balance, sourceLocationId, session, excludeDocumentId = null) {
  const lines = await read(DocumentLine.find({
    lineKind: 'WAREHOUSE_TASK', lotId: balance.lotId,
    'details.fromLocationId': sourceLocationId, 'details.qualityCode': balance.qualityCode,
  }), session);
  const docs = await read(BusinessDocument.find({
    _id: { $in: lines.map((line) => line.documentId) }, documentKind: 'TO',
    workflowStatus: { $in: ['DRAFT', 'OPEN', 'PARTIAL'] },
  }), session);
  const openIds = new Set(docs.map(id));
  let pending = exact('0');
  for (const line of lines) {
    if (!openIds.has(id(line.documentId))) continue;
    if (excludeDocumentId && same(line.documentId, excludeDocumentId)) continue;
    if (line.details.ownerPartyId && !same(line.details.ownerPartyId, balance.ownerPartyId)) continue;
    // Legacy tasks without owner/source cannot safely be attributed to another owner.
    const movements = await read(StockMovement.find({ documentId: line.documentId, lineId: line._id }), session);
    const batches = await read(PostingBatch.find({ _id: { $in: movements.map((m) => m.batchId) }, documentId: line.documentId }), session);
    const remaining = exact(line.qtyBase).minus(netMovedQuantity(movements, batches));
    if (remaining.gt(0)) pending = pending.plus(remaining);
  }
  return pending;
}

export async function validateLines(input, session, excludeDocumentId = null) {
  const warehouse = await read(Warehouse.findById(input.warehouseId), session);
  if (!warehouse?.isActive) conflict('Kho không tồn tại hoặc đã ngừng hoạt động');
  const balances = await read(StockBalance.find({ _id: { $in: input.lines.map((line) => line.sourceBalanceId) } }), session);
  const accounts = await read(StockAccount.find({ _id: { $in: balances.map((balance) => balance.accountId) } }), session);
  const byBalance = new Map(balances.map((balance) => [id(balance), balance]));
  const byAccount = new Map(accounts.map((account) => [id(account), account]));
  const locationIds = [...new Set([
    ...accounts.map((account) => id(account.locationId)).filter(Boolean),
    ...input.lines.map((line) => line.toLocationId),
  ])].sort();

  // Serialize overlapping planners. Other task/stocktake writers must use this
  // same guard; no quantity, reservation or stock-balance version is changed.
  for (const locationId of locationIds) {
    const result = await Location.updateOne(
      { _id: locationId, warehouseId: input.warehouseId, isActive: true },
      { $inc: { planningVersion: 1 } }, { session },
    );
    if (result.matchedCount !== 1) throw new ApiError(400, 'Vị trí không hoạt động hoặc không thuộc kho được phép');
  }
  if (await LocationLock.exists({ locationId: { $in: locationIds } }).session(session)) {
    conflict('Vị trí đang bị khóa kiểm kê');
  }
  const locations = await read(Location.find({ _id: { $in: locationIds } }), session);
  const byLocation = new Map(locations.map((location) => [id(location), location]));
  const totals = new Map();
  const prepared = [];
  for (const [index, line] of input.lines.entries()) {
    const balance = byBalance.get(line.sourceBalanceId);
    const account = byAccount.get(id(balance?.accountId));
    if (!balance || !account?.locationId) throw new ApiError(400, 'Không tìm thấy tồn tại vị trí nguồn');
    const source = byLocation.get(id(account.locationId));
    const destination = byLocation.get(line.toLocationId);
    checkLocations(source, destination, input.warehouseId);
    if (balance.version !== line.sourceBalanceVersion) conflict('Tồn nguồn đã thay đổi; tải lại dữ liệu trước khi tạo lệnh');
    if (await DefectHold.exists({ balanceId: balance._id, status: 'ACTIVE' }).session(session)) {
      conflict('Hàng nguồn đang bị giữ do lỗi; xử lý hàng lỗi trước khi chuyển vị trí');
    }
    const lot = await read(Lot.findById(balance.lotId), session);
    const product = lot && await read(Product.findById(lot.productId), session);
    const owner = await read(Party.findById(balance.ownerPartyId), session);
    if (!lot || !product?.isActive || !owner) conflict('Thông tin sản phẩm, lô hoặc chủ hàng không hợp lệ');
    if (destination.allocatable && (balance.qualityCode !== 'GOOD' || lot.identificationStatus !== 'VERIFIED' || owner.kind !== 'STORE')) {
      conflict('Hàng chưa đủ điều kiện không được chuyển vào vị trí cấp hàng khả dụng');
    }
    const conversion = await read(ProductUomVersion.findById(line.conversionId), session);
    if (!conversion || !same(conversion.productId, product._id) || conversion.validFrom > new Date()) {
      throw new ApiError(400, 'Phiên bản quy đổi không hợp lệ cho sản phẩm');
    }
    const latest = await read(ProductUomVersion.findOne({
      productId: product._id, uomId: conversion.uomId, validFrom: { $lte: new Date() },
    }).sort({ validFrom: -1, version: -1 }), session);
    if (!same(latest, conversion)) conflict('Quy đổi đã thay đổi; chọn lại phiên bản hiện hành');
    if (!await Uom.exists({ _id: conversion.uomId }).session(session)) conflict('Đơn vị tính không tồn tại');
    const qty = exact(line.enteredQty).mul(exact(conversion.basePerUnit));
    if (qty.decimalPlaces() > 6 || qty.gte('100000000000000') || (product.wholeBaseUnits && !qty.isInteger())) {
      throw new ApiError(400, 'Số lượng quy đổi không hợp lệ; không tự làm tròn số lượng hoặc số viên');
    }
    const reservations = await read(Reservation.find({ balanceId: balance._id, status: 'ACTIVE' }), session);
    const reserved = reservations.reduce((sum, reservation) => sum.plus(exact(reservation.qtyBase)), exact('0'));
    if (reserved.gt(exact(balance.qtyBase))) conflict('Lượng giữ hàng vượt tồn nguồn; cần đối chiếu trước khi chuyển');
    // Reserved stock may relocate (BF-03-A1). Creation never releases or moves
    // reservations; UC-37 must re-read and carry them with the actual stock.
    const requested = (totals.get(id(balance)) ?? exact('0')).plus(qty);
    totals.set(id(balance), requested);
    const pending = await pendingTaskQuantity(balance, source._id, session, excludeDocumentId);
    if (requested.plus(pending).gt(exact(balance.qtyBase))) conflict('Không đủ lượng nguồn sau các nhiệm vụ đang mở');
    prepared.push({
      lineNo: index + 1, lineKind: 'WAREHOUSE_TASK', productId: product._id, lotId: lot._id,
      conversionId: conversion._id, enteredQty: line.enteredQty,
      conversionSnapshot: conversion.basePerUnit, qtyBase: qty.toFixed(), productNameSnapshot: product.name,
      details: {
        fromLocationId: source._id, toLocationId: destination._id, qualityCode: balance.qualityCode,
        sourceBalanceId: balance._id, sourceBalanceVersion: balance.version, ownerPartyId: balance.ownerPartyId,
      },
    });
  }
  return prepared;
}

function creationResult(operation, document, replayed) {
  return {
    id: id(document), documentNo: document.documentNo, documentKind: 'TO', taskKind: 'RELOCATE',
    warehouseId: id(document.header.warehouseId), workflowStatus: document.workflowStatus,
    version: document.version, operationId: id(operation), replayed,
  };
}

async function findReplay(user, key, hash, session) {
  const operation = await read(BusinessOperation.findOne({ idempotencyKey: key }), session);
  if (!operation) return null;
  if (operation.payloadHash !== hash || operation.operation !== operationName || !same(operation.performedBy, user._id)) {
    conflict('Idempotency key đã được dùng với nội dung khác');
  }
  const document = await read(BusinessDocument.findOne({ _id: operation.documentId, documentKind: 'TO', 'header.taskKind': 'RELOCATE' }), session);
  if (!document || !hasWarehouse(user, document.header.warehouseId)) notFound();
  return creationResult(operation, document, true);
}

export async function createLocationMovement(user, input) {
  requirePermission(user, 'create');
  if (!hasWarehouse(user, input.warehouseId)) throw new ApiError(403, 'Bạn không được phân công kho này');
  const key = `relocation:${id(user)}:${input.idempotencyKey}`;
  const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const replay = await findReplay(user, key, hash, session);
      if (replay) return replay;
      const lines = await validateLines(input, session);
      const documentId = new mongoose.Types.ObjectId();
      const document = new BusinessDocument({
        _id: documentId, documentNo: `LM-${documentId}`, documentKind: 'TO',
        workflowStatus: 'OPEN', createdBy: user._id, note: input.reason,
        header: { warehouseId: input.warehouseId, taskKind: 'RELOCATE', assignedTo: user._id },
      });
      await document.save({ session });
      for (const line of lines) await new DocumentLine({ ...line, documentId }).save({ session });
      const operation = new BusinessOperation({
        documentId, operation: operationName, operationKey: input.idempotencyKey,
        idempotencyKey: key, payloadHash: hash, documentVersion: 1, performedBy: user._id, reason: input.reason,
      });
      await operation.save({ session });
      await new AuditEvent({
        documentId, actorId: user._id, action: operationName,
        details: JSON.stringify({ operationId: id(operation), lineCount: lines.length, warehouseId: input.warehouseId }),
      }).save({ session });
      return creationResult(operation, document, false);
    }, transactionOptions);
  } catch (error) {
    // A concurrent request can win the unique key after our snapshot. Look up
    // the committed result outside the aborted transaction before replying.
    if (error.code === 11000 || error.hasErrorLabel?.('UnknownTransactionCommitResult')) {
      const replay = await findReplay(user, key, hash, null);
      if (replay) return replay;
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

async function detailWithinSession(user, documentId, session) {
  const document = await read(BusinessDocument.findOne({
    _id: documentId, documentKind: 'TO', 'header.taskKind': 'RELOCATE',
  }), session);
  if (!document || !hasWarehouse(user, document.header.warehouseId)) notFound();
  const warehouse = await read(Warehouse.findById(document.header.warehouseId), session);
  const lines = await read(DocumentLine.find({ documentId, lineKind: 'WAREHOUSE_TASK' }).sort({ lineNo: 1 }), session);
  const batches = await read(PostingBatch.find({ documentId }).sort({ postedAt: 1, _id: 1 }), session);
  const operations = await read(BusinessOperation.find({ documentId }).sort({ performedAt: 1, _id: 1 }), session);
  const movements = await read(StockMovement.find({ documentId, batchId: { $in: batches.map((batch) => batch._id) } }).sort({ createdAt: 1, _id: 1 }), session);
  // Authorize ledger endpoints as well as the header: a corrupt/source-mismatched
  // historical link must not disclose another warehouse's balance history.
  const endpointIds = [...new Set(movements.flatMap((m) => [id(m.fromBalanceId), id(m.toBalanceId)]).filter(Boolean))];
  const endpoints = await read(StockBalance.find({ _id: { $in: endpointIds } }), session);
  const accounts = await read(StockAccount.find({ _id: { $in: endpoints.map((balance) => balance.accountId) } }), session);
  const accountLocations = await read(Location.find({ _id: { $in: accounts.map((account) => account.locationId).filter(Boolean) } }), session);
  if (endpoints.length !== endpointIds.length || accounts.length !== new Set(endpoints.map((balance) => id(balance.accountId))).size
    || accounts.some((account) => !account.locationId)
    || accounts.some((account) => !accountLocations.some((location) => same(location, account.locationId) && same(location.warehouseId, document.header.warehouseId)))
    || movements.some((movement) => !lines.some((line) => same(line, movement.lineId)))) notFound();
  const resultLines = [];
  for (const line of lines) {
    const from = await read(Location.findById(line.details.fromLocationId), session);
    const to = await read(Location.findById(line.details.toLocationId), session);
    if ((from && !same(from.warehouseId, document.header.warehouseId))
      || (to && !same(to.warehouseId, document.header.warehouseId))) notFound();
    const lot = await read(Lot.findById(line.lotId), session);
    const conversion = await read(ProductUomVersion.findById(line.conversionId), session);
    const uom = conversion && await read(Uom.findById(conversion.uomId), session);
    const actualQty = netMovedQuantity(movements.filter((m) => same(m.lineId, line._id)), batches);
    resultLines.push({
      id: id(line), lineNo: line.lineNo, productId: id(line.productId), productName: line.productNameSnapshot,
      lotId: id(line.lotId), lot: lot ? { manufacturerLot: lot.manufacturerLot, tone: lot.tone, calibre: lot.calibre } : null,
      fromLocationId: id(line.details.fromLocationId), fromLocationCode: from?.code ?? null,
      toLocationId: id(line.details.toLocationId), toLocationCode: to?.code ?? null,
      qualityCode: line.details.qualityCode, ownerPartyId: id(line.details.ownerPartyId),
      sourceBalanceId: id(line.details.sourceBalanceId), sourceBalanceVersion: line.details.sourceBalanceVersion ?? null,
      enteredQty: line.enteredQty.toString(), conversionId: id(line.conversionId),
      enteredUomId: id(conversion?.uomId), enteredUomCode: uom?.code ?? null, conversionVersion: conversion?.version ?? null,
      conversionSnapshot: line.conversionSnapshot.toString(), plannedQtyBase: line.qtyBase.toString(),
      actualQtyBase: actualQty.toFixed(), remainingQtyBase: exact(line.qtyBase).minus(actualQty).toFixed(),
    });
  }
  return {
    id: id(document), documentNo: document.documentNo, documentKind: 'TO', taskKind: 'RELOCATE',
    warehouseId: id(document.header.warehouseId), warehouseName: warehouse?.name ?? null,
    workflowStatus: document.workflowStatus, version: document.version, reason: document.note ?? null,
    createdBy: id(document.createdBy), assignedTo: id(document.header.assignedTo), createdAt: document.createdAt,
    lines: resultLines,
    operations: operations.map((operation) => ({ id: id(operation), operation: operation.operation,
      reason: operation.reason ?? null, performedBy: id(operation.performedBy),
      performedAt: operation.performedAt, documentVersion: operation.documentVersion })),
    postings: batches.map((batch) => ({
      id: id(batch), operation: batch.operation, operationKey: batch.operationKey,
      postedBy: id(batch.postedBy), postedAt: batch.postedAt, reversalOf: id(batch.reversalOf),
      movements: movements.filter((m) => same(m.batchId, batch._id)).map((m) => ({
        id: id(m), lineId: id(m.lineId), fromBalanceId: id(m.fromBalanceId), toBalanceId: id(m.toBalanceId),
        qtyBase: m.qtyBase.toString(), fromBefore: m.fromBefore?.toString() ?? null, fromAfter: m.fromAfter?.toString() ?? null,
        toBefore: m.toBefore?.toString() ?? null, toAfter: m.toAfter?.toString() ?? null,
      })),
    })),
  };
}

export async function getLocationMovement(user, documentId) {
  requirePermission(user, 'read');
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => detailWithinSession(user, documentId, session), transactionOptions);
  } finally {
    await session.endSession();
  }
}

export async function listLocationMovements(user, filters) {
  requirePermission(user, 'read');
  const warehouseIds = currentRole(user)?.code === 'OWNER'
    ? null : (user.warehouseIds ?? []).map(id);
  if (filters.warehouseId && !hasWarehouse(user, filters.warehouseId)) {
    throw new ApiError(403, 'Bạn không được phân công kho này');
  }
  const query = { documentKind: 'TO', 'header.taskKind': 'RELOCATE' };
  if (filters.warehouseId) query['header.warehouseId'] = filters.warehouseId;
  else if (warehouseIds) query['header.warehouseId'] = { $in: warehouseIds };
  if (filters.status) query.workflowStatus = filters.status;
  if (filters.q) query.documentNo = { $regex: filters.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const [documents, total] = await Promise.all([
    BusinessDocument.find(query).sort({ createdAt: -1, _id: -1 })
      .skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(),
    BusinessDocument.countDocuments(query),
  ]);
  const warehouses = await Warehouse.find({ _id: { $in: documents.map((doc) => doc.header.warehouseId) } }).lean();
  const names = new Map(warehouses.map((warehouse) => [id(warehouse), warehouse.name]));
  return {
    items: documents.map((doc) => ({
      id: id(doc), documentNo: doc.documentNo, warehouseId: id(doc.header.warehouseId),
      warehouseName: names.get(id(doc.header.warehouseId)) ?? null,
      workflowStatus: doc.workflowStatus, version: doc.version, reason: doc.note ?? null,
      createdBy: id(doc.createdBy), createdAt: doc.createdAt,
    })),
    total, page: filters.page, limit: filters.limit,
  };
}

export async function locationMovementOptions(user, warehouseId) {
  requirePermission(user, 'create');
  const assigned = (user.warehouseIds ?? []).map(id);
  const warehouses = await Warehouse.find({ _id: { $in: assigned }, isActive: true }).sort({ name: 1 }).lean();
  if (!warehouseId) return { warehouses: warehouses.map((warehouse) => ({ id: id(warehouse), name: warehouse.name, code: warehouse.code })), locations: [], balances: [] };
  if (!hasWarehouse(user, warehouseId)) throw new ApiError(403, 'Bạn không được phân công kho này');
  const warehouse = warehouses.find((item) => same(item, warehouseId));
  if (!warehouse) conflict('Kho đã ngừng hoạt động');
  const locations = await Location.find({ warehouseId, isActive: true }).sort({ code: 1 }).lean();
  const accounts = await StockAccount.find({ locationId: { $in: locations.map((item) => item._id) } }).lean();
  const balances = await StockBalance.find({ accountId: { $in: accounts.map((item) => item._id) }, qtyBase: { $gt: 0 } }).lean();
  const lots = await Lot.find({ _id: { $in: balances.map((item) => item.lotId) } }).lean();
  const products = await Product.find({ _id: { $in: lots.map((item) => item.productId) } }).lean();
  const versions = await ProductUomVersion.find({ productId: { $in: products.map((item) => item._id) }, validFrom: { $lte: new Date() } })
    .sort({ validFrom: -1, version: -1 }).lean();
  const uoms = await Uom.find({ _id: { $in: versions.map((item) => item.uomId) } }).lean();
  const lotById = new Map(lots.map((item) => [id(item), item]));
  const productById = new Map(products.map((item) => [id(item), item]));
  const locationById = new Map(locations.map((item) => [id(item), item]));
  const accountById = new Map(accounts.map((item) => [id(item), item]));
  const uomById = new Map(uoms.map((item) => [id(item), item]));
  const latest = new Map();
  for (const version of versions) {
    const key = `${id(version.productId)}:${id(version.uomId)}`;
    if (!latest.has(key)) latest.set(key, version);
  }
  const holds = await DefectHold.find({ balanceId: { $in: balances.map((item) => item._id) }, status: 'ACTIVE' }).lean();
  const held = new Set(holds.map((item) => id(item.balanceId)));
  return {
    warehouses: warehouses.map((item) => ({ id: id(item), name: item.name, code: item.code })),
    locations: locations.map((item) => ({ id: id(item), code: item.code, kind: item.kind, allocatable: item.allocatable })),
    balances: balances.map((balance) => {
      const account = accountById.get(id(balance.accountId));
      const location = locationById.get(id(account?.locationId));
      const lot = lotById.get(id(balance.lotId));
      const product = productById.get(id(lot?.productId));
      return {
        id: id(balance), version: balance.version, qtyBase: balance.qtyBase.toString(),
        locationId: id(location), locationCode: location?.code ?? null,
        productId: id(product), productName: product?.name ?? null, productSku: product?.sku ?? null,
        lotId: id(lot), manufacturerLot: lot?.manufacturerLot ?? null, tone: lot?.tone ?? null,
        calibre: lot?.calibre ?? null, qualityCode: balance.qualityCode, held: held.has(id(balance)),
        conversions: [...latest.values()].filter((version) => same(version.productId, product?._id)).map((version) => ({
          id: id(version), uomCode: uomById.get(id(version.uomId))?.code ?? null,
          basePerUnit: version.basePerUnit.toString(),
        })),
      };
    }),
  };
}
