import * as m from '../../models/runtime.js';
import { exact, ExactDecimal } from '../../models/model-utils.js';
import { checkBinCapacity } from '../../models/capacity.js';
import { dto, transaction } from '../../shared/utils/persistence.js';
import { command, scopedDocument, same, checkVersion, saveVersion, newId } from '../../shared/utils/document-command.js';
import { nextDocumentFields } from '../../shared/utils/document-number.js';
import { makeItem } from '../../shared/utils/document-items.js';
import { requirePermission, requireWarehouseAccess, isOwner } from '../../shared/utils/access.js';
import { validationError, forbiddenError } from '../../shared/utils/ApiError.js';
import { guardWarehouses, guardLocations, beginStock, balanceAt, receiveStock, verifyCapacity } from '../../shared/utils/stock.js';
import { appendAudit } from '../../shared/utils/audit.js';
import { resolveConversion, toBaseQuantity } from '../../shared/utils/conversions.js';
import { normalizeCode } from '../../shared/utils/domain.js';
import { fold, pickProduct, preloadProductsBySkus } from '../../shared/utils/product-lookup.js';
import { openingRow, CLOCK_SKEW_MS } from './validation.js';

const ACTIVE = ['DRAFT', 'POSTED'];
const LIMIT = '100000000000000';
const replay = (id, user, session) => { allowed(user, 'opening_stock:read'); return scopedDocument(m.OpeningStock, id, user, session); };
const vnTime = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' });
function portionFor(item) {
  return { packagingState: item.packagingState, quantityBase: String(item.qtyBase), packagingSnapshot: item.packagingSnapshot,
    ...(item.packagingState === 'SEALED' ? { sealedPackCount: exact(item.qtyBase).div(String(item.packagingSnapshot.baseUnitsPerPackage)).toNumber() } : { measuredVolumeMm3: item.measuredVolumeMm3 }) };
}
function allowed(user, permission) {
  requirePermission(user, permission);
  if (!isOwner(user)) throw forbiddenError();
}
const hasActiveDocuments = (warehouseId, session) =>
  m.OpeningStock.exists({ 'header.warehouseId': warehouseId, workflowStatus: { $in: ACTIVE } }).session(session ?? null);

export async function options(user) {
  allowed(user, 'opening_stock:read');
  const [warehouses, counts, units, locations] = await Promise.all([
    m.Warehouse.find({ isActive: true }).select('_id code name openingCutoffAt openingClosedAt').lean(),
    m.OpeningStock.aggregate([{ $match: { workflowStatus: { $in: ACTIVE } } },
      { $group: { _id: { warehouseId: '$header.warehouseId', status: '$workflowStatus' }, count: { $sum: 1 } } }]),
    m.Uom.find({ isActive: true, areaMm2: null }).select('code name isCarton').lean(),
    m.WarehouseLocation.find({ isActive: true, locationType: 'STORAGE' }).select('_id warehouseId code name').lean(),
  ]);
  const count = (warehouseId, status) => counts.find(row => same(row._id.warehouseId, warehouseId) && row._id.status === status)?.count ?? 0;
  const active = new Set(warehouses.map(w => String(w._id)));
  return {
    warehouses: warehouses.map(row => {
      const draftCount = count(row._id, 'DRAFT'), postedCount = count(row._id, 'POSTED'), closed = Boolean(row.openingClosedAt);
      return { id: String(row._id), code: row.code, name: row.name, closed, draftCount, postedCount,
        cutoffAt: (draftCount + postedCount > 0 || closed) && row.openingCutoffAt ? row.openingCutoffAt.toISOString() : null };
    }),
    units: units.map(u => ({ code: u.code, name: u.name, isCarton: Boolean(u.isCarton) })),
    locations: locations.filter(l => active.has(String(l.warehouseId)))
      .map(l => ({ id: String(l._id), warehouseId: String(l.warehouseId), code: l.code, name: l.name ?? null })),
  };
}
export async function list(user) {
  allowed(user, 'opening_stock:read');
  const rows = await m.OpeningStock.find(isOwner(user) ? {} : { 'header.warehouseId': { $in: user.warehouseIds || [] } }).sort({ createdAt: -1 }).lean();
  return { items: rows.map(dto), total: rows.length };
}
export async function get(user, id) {
  allowed(user, 'opening_stock:read');
  const document = dto(await replay(id, user));
  const [products, batches, locations, warehouse] = await Promise.all([
    m.Product.find({ _id: { $in: document.items.map(i => i.productId) } }).select('_id sku').lean(),
    m.ProductBatch.find({ _id: { $in: document.items.map(i => i.lotId) } }).select('_id manufacturerLot tone calibre').lean(),
    m.WarehouseLocation.find({ warehouseId: document.header.warehouseId }).select('_id code name').lean(),
    m.Warehouse.findById(document.header.warehouseId).select('code name').lean(),
  ]);
  return { ...document, header: { ...document.header, warehouseName: warehouse?.name }, items: document.items.map(item => ({ ...item,
    sku: products.find(p => same(p._id, item.productId))?.sku,
    manufacturerLot: batches.find(b => same(b._id, item.lotId))?.manufacturerLot,
    tone: batches.find(b => same(b._id, item.lotId))?.tone,
    calibre: batches.find(b => same(b._id, item.lotId))?.calibre,
    locationCode: locations.find(l => same(l._id, item.locationId))?.code,
  })) };
}

// Opening stock may be entered in parts until the Owner closes the warehouse (D2).
async function openWarehouse(user, warehouseId, session, lock = false) {
  requireWarehouseAccess(user, warehouseId);
  if (lock) await guardWarehouses([warehouseId], session);
  const warehouse = await m.Warehouse.findOne({ _id: warehouseId, isActive: true }).session(session ?? null);
  if (!warehouse) throw validationError('Kho không tồn tại hoặc đã ngừng hoạt động.');
  if (warehouse.openingClosedAt) throw validationError('Kho đã chốt tồn đầu; sai lệch sau đó xử lý bằng kiểm kê.');
  return warehouse;
}

// The first stock move recorded by WMS at or before the cut-off: the count could already include it (D1b).
async function firstStockActivity(warehouseId, at, session) {
  const locationIds = (await m.WarehouseLocation.find({ warehouseId }).select('_id').session(session ?? null).lean()).map(l => l._id);
  const points = await m.StockHoldingPoint.find({ locationId: { $in: locationIds } }).select('_id').session(session ?? null).lean();
  const balanceIds = (await m.InventoryBalance.find({ holdingPointId: { $in: points.map(p => p._id) } }).select('_id').session(session ?? null).lean()).map(b => b._id);
  if (!balanceIds.length) return null;
  const first = await m.StockTransaction.findOne({ operation: { $ne: 'OPENING' }, occurredAt: { $lte: at },
    $or: [{ 'movements.toBalanceId': { $in: balanceIds } }, { 'movements.fromBalanceId': { $in: balanceIds } }] })
    .sort({ occurredAt: 1 }).select('occurredAt').session(session ?? null).lean();
  return first?.occurredAt ?? null;
}

// One cut-off per warehouse: set by its first live draft, then fixed until every draft/posting is cancelled.
async function resolveCutoff(warehouse, openingAt, session) {
  if (warehouse.openingCutoffAt && await hasActiveDocuments(warehouse._id, session)) return { cutoffAt: warehouse.openingCutoffAt, fixed: true };
  const at = new Date(openingAt);
  if (at.getTime() > Date.now() + CLOCK_SKEW_MS) throw validationError('Mốc tồn đầu không được ở tương lai.');
  const first = await firstStockActivity(warehouse._id, at, session);
  if (first) throw validationError(`Kho đã có nghiệp vụ nhập/xuất từ ngày ${vnTime.format(first)}. Chọn mốc sớm hơn ngày đó.`);
  return { cutoffAt: at, fixed: false };
}

const CAPACITY_MESSAGES = {
  'Bin capacity exceeded': 'Vượt sức chứa của vị trí (tính cả tồn hiện có)',
  'Carton dimensions do not fit bin': 'Thùng không vừa vị trí',
  'Bin capacity dimensions required': 'Vị trí hoặc kho chưa khai báo kích thước',
  'Carton packaging differs from fixed batch specification': 'Quy cách thùng khác quy cách lô',
};

function allowedUnit(uoms, product, entered) {
  const isAllowed = uom => uom.code === product.baseUnit || (uom.isCarton && uom.areaMm2 == null);
  const byCode = uoms.find(uom => fold(uom.code) === fold(entered));
  const rule = `chỉ nhận đơn vị gốc (${product.baseUnit}) hoặc đơn vị thùng`;
  if (byCode) return isAllowed(byCode) ? { uom: byCode } : { error: `ĐVT ${byCode.code} không dùng được cho tồn đầu; ${rule}` };
  const byName = uoms.filter(uom => isAllowed(uom) && fold(uom.name) === fold(entered));
  if (byName.length > 1) return { error: `Tên ĐVT trùng nhiều mã (${byName.map(u => u.code).sort().join(', ')}), hãy nhập mã` };
  if (byName.length === 1) return { uom: byName[0] };
  return { error: `ĐVT không tồn tại hoặc đã ngừng; ${rule}` };
}

// Splits whole cartons (SEALED) from loose pieces (LOOSE). Loose pieces are always stored in the base unit (D5).
function openingItems(product, batch, uom, qty, location, rowErrors) {
  const per = exact(batch.piecesPerCarton);
  const sealed = qty.dividedToIntegerBy(per).mul(per);
  const loose = qty.minus(sealed);
  const packagingSnapshot = { packageUnit: 'Thùng', baseUnitsPerPackage: String(batch.piecesPerCarton),
    outerLengthMm: batch.cartonLengthMm, outerWidthMm: batch.cartonWidthMm, outerHeightMm: batch.cartonHeightMm };
  const base = { lineKind: 'STANDARD', productId: product._id, lotId: batch._id, productNameSnapshot: product.name,
    baseUnitSnapshot: product.baseUnit, packagingSnapshot, locationId: location._id, ownerType: 'STORE', qualityStatus: 'GOOD' };
  const items = [];
  if (sealed.gt(0)) {
    const byCarton = uom.code !== product.baseUnit;
    items.push({ ...base, packagingState: 'SEALED', qtyBase: sealed.toFixed(),
      enteredUnit: byCarton ? uom.code : product.baseUnit,
      enteredQty: byCarton ? sealed.div(per).toFixed() : sealed.toFixed(),
      baseUnitsPerUnit: byCarton ? String(batch.piecesPerCarton) : '1' });
  }
  if (loose.gt(0)) {
    const { lengthMm, widthMm, heightMm } = product;
    if ([lengthMm, widthMm, heightMm].some(size => size == null || !exact(size).gt(0))) {
      rowErrors.push({ field: 'enteredQty', message: 'Sản phẩm thiếu kích thước để tính thể tích hàng lẻ.' });
      return [];
    }
    const volume = loose.mul(exact(lengthMm)).mul(exact(widthMm)).mul(exact(heightMm)).toDecimalPlaces(3, ExactDecimal.ROUND_CEIL);
    if (volume.gte(LIMIT)) { rowErrors.push({ field: 'enteredQty', message: 'Thể tích hàng lẻ vượt giới hạn lưu tồn.' }); return []; }
    items.push({ ...base, packagingState: 'LOOSE', qtyBase: loose.toFixed(), enteredUnit: product.baseUnit,
      enteredQty: loose.toFixed(), baseUnitsPerUnit: '1', measuredVolumeMm3: volume.toFixed() });
  }
  return items;
}

// Capacity per location, including stock already there (same rule as verifyCapacity).
async function capacityErrors(warehouse, rows, batchesById, session) {
  const locationIds = [...new Set(rows.flatMap(r => r.items.map(i => String(i.locationId))))];
  if (!locationIds.length) return new Map();
  const locations = await m.WarehouseLocation.find({ _id: { $in: locationIds } }).session(session ?? null).lean();
  const points = await m.StockHoldingPoint.find({ type: 'LOCATION', locationId: { $in: locationIds } }).session(session ?? null).lean();
  const balances = await m.InventoryBalance.find({ holdingPointId: { $in: points.map(p => p._id) } }).session(session ?? null).lean();
  const missing = balances.map(b => String(b.batchId)).filter(id => !batchesById.has(id));
  for (const batch of missing.length ? await m.ProductBatch.find({ _id: { $in: missing } }).session(session ?? null).lean() : []) batchesById.set(String(batch._id), batch);
  const errors = new Map();
  for (const locationId of locationIds) {
    const point = points.find(p => same(p.locationId, locationId)) ?? { _id: locationId, type: 'LOCATION', locationId };
    const added = rows.flatMap(r => r.items).filter(i => same(i.locationId, locationId))
      .map(item => ({ holdingPointId: point._id, batchId: item.lotId, quantityBase: item.qtyBase, packagingPortions: [portionFor(item)] }));
    try {
      checkBinCapacity({ warehouses: [warehouse], warehouse_locations: locations, product_batches: [...batchesById.values()],
        stock_holding_points: [point], inventory_balances: [...balances.filter(b => same(b.holdingPointId, point._id)), ...added] });
    } catch (error) {
      errors.set(locationId, CAPACITY_MESSAGES[error.message] ?? error.message);
    }
  }
  return errors;
}

// Resolves file/manual rows against existing catalogue codes only. It never writes to the database.
async function resolveRows(input, warehouse, session, { warnings = false } = {}) {
  const raws = input.rows;
  const parsed = raws.map(raw => openingRow.safeParse(raw));
  const ok = parsed.filter(p => p.success).map(p => p.data);
  // Sequential: a transaction session does not support parallel operations.
  const locations = await m.WarehouseLocation.find({ warehouseId: warehouse._id }).session(session ?? null).lean();
  const uoms = await m.Uom.find({ isActive: true }).session(session ?? null).lean();
  const cache = await preloadProductsBySkus(ok.map(r => r.sku), session);
  const productIds = [...cache.values()].flat().map(p => p._id);
  const lotNames = [...new Set(ok.map(r => r.manufacturerLot).filter(Boolean))];
  const batches = productIds.length && lotNames.length
    ? await m.ProductBatch.find({ productId: { $in: productIds }, manufacturerLot: { $in: lotNames } }).session(session ?? null).lean() : [];
  const locks = await m.StocktakeLocationLock.find({ locationId: { $in: locations.map(l => l._id) }, status: 'LOCKED' }).select('locationId').session(session ?? null).lean();
  const factors = new Map();
  const rows = [];
  for (const [index, raw] of raws.entries()) {
    const result = { index, rowNo: raw.rowNo ?? index + 1, errors: [], warnings: [], items: [] };
    rows.push(result);
    const error = (field, message) => result.errors.push({ field, message });
    if (!parsed[index].success) {
      for (const issue of parsed[index].error.issues) {
        if (issue.code === 'unrecognized_keys') issue.keys.forEach(field => error(field, 'Cột không có trong mẫu'));
        else error(issue.path[0] === undefined ? undefined : String(issue.path[0]), issue.message);
      }
      continue;
    }
    const row = parsed[index].data;
    if (row.warehouseCode && fold(row.warehouseCode) !== fold(warehouse.code)) error('warehouseCode', `Dòng ghi kho ${row.warehouseCode}, khác kho đã chọn ${warehouse.code}`);
    const found = pickProduct(cache.get(normalizeCode(row.sku)) ?? [], row);
    let product = found.product;
    if (found.error) error(found.error.field, found.error.message);
    else if (!product.isActive) { error('sku', 'Sản phẩm đã ngừng hoạt động'); product = null; }
    let batch;
    if (!row.manufacturerLot) error('manufacturerLot', 'Thiếu số lô');
    else if (product) {
      batch = batches.find(b => same(b.productId, product._id) && b.manufacturerLot === row.manufacturerLot);
      if (!batch) error('manufacturerLot', `Lô chưa có trong danh mục của SKU ${product.sku}`);
      else if (batch.identificationStatus !== 'VERIFIED') { error('manufacturerLot', 'Lô chưa xác minh'); batch = null; }
      else if (!Number.isSafeInteger(batch.piecesPerCarton) || batch.piecesPerCarton < 1) { error('manufacturerLot', 'Lô thiếu số viên mỗi thùng hợp lệ'); batch = null; }
    }
    const location = locations.find(l => fold(l.code) === fold(row.locationCode));
    if (!location) error('locationCode', `Vị trí chưa có trong kho ${warehouse.code}`);
    else if (!location.isActive) error('locationCode', 'Vị trí đã ngừng hoạt động');
    else if (location.locationType !== 'STORAGE') error('locationCode', 'Vị trí không phải khu lưu trữ');
    else if (locks.some(lock => same(lock.locationId, location._id))) error('locationCode', 'Vị trí đang khóa kiểm kê');
    let uom;
    if (product) {
      const unit = allowedUnit(uoms, product, row.enteredUnit);
      if (unit.error) error('enteredUnit', unit.error);
      uom = unit.uom;
    }
    if (!product || !batch || !uom) continue;
    const factorKey = `${product._id}|${batch._id}|${uom.code}`;
    let factor = factors.get(factorKey);
    if (!factor) {
      try { factor = await resolveConversion(product, batch, uom.code, session ?? null); factors.set(factorKey, factor); }
      catch { error('enteredUnit', `Thiếu quy đổi ${uom.code} cho SKU ${product.sku}, lô ${batch.manufacturerLot}`); continue; }
    }
    const qty = toBaseQuantity(row.enteredQty, factor, product, uom);
    if (!qty.gt(0) || qty.decimalPlaces() > 6 || qty.gte(LIMIT)) { error('enteredQty', 'Số lượng quy đổi sang đơn vị gốc không hợp lệ'); continue; }
    if (product.wholeBaseUnits && !qty.isInteger()) {
      error('enteredQty', uom.code === product.baseUnit
        ? `Số lượng ${product.baseUnit} phải là số nguyên`
        : `${row.enteredQty} ${uom.name} × ${factor.toFixed()} = ${qty.toFixed()} ${product.baseUnit}, không phải số nguyên; hãy nhập theo ${product.baseUnit}`);
      continue;
    }
    if (result.errors.length) continue;
    result.items = openingItems(product, batch, uom, qty, location, result.errors);
    Object.assign(result, { product: product.name, sku: product.sku, batch: batch.manufacturerLot, tone: batch.tone ?? null, calibre: batch.calibre ?? null,
      location: location.code, quantityBase: qty.toFixed(), unit: product.baseUnit, pair: `${batch._id}|${location._id}` });
  }

  const good = rows.filter(r => !r.errors.length && r.items.length);
  const fileErrors = [];
  if (good.length) {
    const capacity = await capacityErrors(warehouse, good, new Map(batches.map(b => [String(b._id), b])), session);
    for (const row of good) {
      const message = capacity.get(String(row.items[0].locationId));
      if (message) row.errors.push({ field: 'locationCode', message });
    }
  }

  if (warnings) {
    // D3: same lot + location is allowed; warn so a re-uploaded file is noticed before saving.
    const clean = good.filter(r => !r.errors.length);
    const firstRow = new Map();
    for (const row of clean) {
      const first = firstRow.get(row.pair);
      if (first) row.warnings.push({ field: 'locationCode', message: `Trùng lô và vị trí với dòng ${first.rowNo}` });
      else firstRow.set(row.pair, row);
    }
    const pairs = [...firstRow.values()].map(r => ({ lotId: r.items[0].lotId, locationId: r.items[0].locationId }));
    const others = pairs.length ? await m.OpeningStock.find({ 'header.warehouseId': warehouse._id, workflowStatus: { $in: ACTIVE },
      $or: pairs.map(pair => ({ items: { $elemMatch: pair } })) }).select('documentNo workflowStatus items.lotId items.locationId items.qtyBase').session(session ?? null).lean() : [];
    for (const row of clean) {
      const [lotId, locationId] = row.pair.split('|');
      for (const other of others) {
        const quantity = other.items.filter(i => same(i.lotId, lotId) && same(i.locationId, locationId)).reduce((sum, i) => sum.plus(String(i.qtyBase)), exact('0'));
        if (quantity.gt(0)) {
          row.warnings.push({ field: 'locationCode', message: `Lô ${row.batch} tại ${row.location} đã có trong phiếu ${other.documentNo} (${quantity.toFixed()} ${row.unit}, ${other.workflowStatus === 'POSTED' ? 'Đã ghi' : 'Nháp'})` });
        }
      }
    }
  }

  for (const row of rows) row.status = row.errors.length ? 'ERROR' : row.warnings.length ? 'WARNING' : 'OK';
  return { rows, fileErrors, valid: rows.every(r => !r.errors.length) && !fileErrors.length };
}

const publicRow = ({ items, pair, ...row }) => row;
const firstError = rows => {
  const row = rows.find(r => r.errors.length);
  return row ? `Dòng ${row.rowNo}${row.errors[0].field ? ` (${row.errors[0].field})` : ''}: ${row.errors[0].message}` : '';
};

export async function preview(user, input) {
  allowed(user, 'opening_stock:create');
  const warehouse = await openWarehouse(user, input.warehouseId);
  const { cutoffAt } = await resolveCutoff(warehouse, input.openingAt);
  const result = await resolveRows(input, warehouse, null, { warnings: true });
  return { valid: result.valid, cutoffAt: cutoffAt.toISOString(), fileErrors: result.fileErrors, rows: result.rows.map(publicRow) };
}
export function create(user, input) {
  return command(user, 'CREATE_OPENING_STOCK', 'opening_stock:create', null, input, replay, async (session, actor) => {
    allowed(actor, 'opening_stock:create');
    // Same warehouse lock as post and close: a closed warehouse never gets a new draft.
    const warehouse = await openWarehouse(actor, input.warehouseId, session, true);
    const result = await resolveRows(input, warehouse, session);
    if (!result.valid) throw validationError('Dữ liệu tồn đầu còn lỗi; kiểm tra lại trước khi lưu. ' + (firstError(result.rows) || result.fileErrors[0] || ''));
    const { cutoffAt, fixed } = await resolveCutoff(warehouse, input.openingAt, session);
    if (!fixed) await m.Warehouse.updateOne({ _id: warehouse._id }, { $set: { openingCutoffAt: cutoffAt } }, { session });
    let lineNo = 0;
    const items = result.rows.flatMap(r => r.items).map(item => ({ _id: newId(), lineNo: ++lineNo, ...item }));
    const document = await new m.OpeningStock({ ...await nextDocumentFields(m.OpeningStock, 'OPENING', input.warehouseId, session),
      workflowStatus: 'DRAFT', version: 1, createdBy: actor._id, occurredAt: cutoffAt,
      header: { warehouseId: input.warehouseId, openingImportSource: input.openingImportSource, cutoverKey: 'TONDAU-' + warehouse.code, openingAt: cutoffAt,
        coveredLocationIds: [...new Set(items.map(i => String(i.locationId)))], sourceDescription: input.sourceDescription, preparedBy: actor._id, preparedAt: new Date() },
      items }).save({ session });
    return { document };
  });
}
export function act(user, id, action, input) {
  const permission = action === 'post' ? 'opening_stock:post' : 'opening_stock:create';
  return command(user, 'OPENING_STOCK_' + action.toUpperCase(), permission, id, input, replay, async (session, actor) => {
    allowed(actor, permission);
    const document = await replay(id, actor, session), before = document.version;
    checkVersion(document, input.expectedVersion);
    const warehouseId = document.header.warehouseId;
    if (action === 'cancel') {
      if (document.workflowStatus !== 'DRAFT' || !same(document.createdBy, actor._id)) throw forbiddenError();
      await guardWarehouses([warehouseId], session);
      Object.assign(document, { workflowStatus: 'CANCELLED', cancelledBy: actor._id, cancelledAt: new Date(), cancelReason: input.reason });
      const saved = await saveVersion(document, before, session);
      // The cut-off may be chosen again once no draft or posting remains (D1b).
      if (!await hasActiveDocuments(warehouseId, session)) await m.Warehouse.updateOne({ _id: warehouseId }, { $unset: { openingCutoffAt: '' } }, { session });
      return { document: saved, versionBefore: before, reason: input.reason };
    }
    if (document.workflowStatus !== 'DRAFT') throw validationError('Phiếu đã ghi tồn hoặc đã hủy; không thể ghi tồn lần nữa.');
    await openWarehouse(actor, warehouseId, session, true);
    const covered = document.header.coveredLocationIds;
    await guardLocations(covered, session);
    const locations = await m.WarehouseLocation.find({ _id: { $in: covered } }).session(session);
    if (locations.length !== new Set(covered.map(String)).size || locations.some(l => !same(l.warehouseId, warehouseId) || l.locationType !== 'STORAGE')) {
      throw validationError('Vị trí trong phiếu không còn là khu lưu trữ của kho; hủy nháp và nhập lại.');
    }
    let posting;
    if (document.items.length) {
      posting = beginStock(document, actor, 'OPENING', input);
      posting.occurredAt = document.header.openingAt;
      for (const item of document.items) {
        // Revalidate identities and retain the accepted historical conversion snapshot.
        await makeItem({ productId: item.productId, lotId: item.lotId, enteredUnit: item.enteredUnit, enteredQty: String(item.enteredQty) }, item.lineNo, session, { previous: item });
        if (!covered.some(locationId => same(locationId, item.locationId))) throw validationError('Dòng hàng nằm ngoài vị trí của phiếu.');
        const balance = await balanceAt({ type: 'LOCATION', locationId: item.locationId }, { batchId: item.lotId, ownerType: 'STORE' }, item.qualityStatus, session);
        // Adds to any balance already there (D3).
        await receiveStock(balance, item, [portionFor(item)], posting, actor, session);
      }
      await verifyCapacity(covered, session);
      await posting.save({ session });
    }
    Object.assign(document.header, { verifiedBy: actor._id, verifiedAt: new Date(), verifiedVersion: before, verificationNote: input.reason });
    Object.assign(document, { workflowStatus: 'POSTED', postedBy: actor._id, postedAt: new Date(), stockTransactionId: posting?._id });
    return { document: await saveVersion(document, before, session), versionBefore: before, stockTransactionId: posting?._id, reason: input.reason };
  });
}
// After closing, differences are corrected by stocktake only (D2).
export async function closeWarehouse(user, warehouseId, { reason }) {
  allowed(user, 'opening_stock:post');
  return transaction(async session => {
    await openWarehouse(user, warehouseId, session, true);
    if (await m.OpeningStock.exists({ 'header.warehouseId': warehouseId, workflowStatus: 'DRAFT' }).session(session)) {
      throw validationError('Còn phiếu nháp chưa ghi tồn hoặc hủy; xử lý hết trước khi chốt.');
    }
    const closedAt = new Date();
    const result = await m.Warehouse.updateOne({ _id: warehouseId, openingClosedAt: null }, { $set: { openingClosedAt: closedAt, openingClosedBy: user._id } }, { session });
    if (!result.matchedCount) throw validationError('Kho đã chốt tồn đầu.');
    await appendAudit({ actorId: user._id, action: 'CLOSE_OPENING_STOCK', entityType: 'warehouses', entityId: warehouseId, details: { reason }, warehouseIds: [warehouseId], session });
    return { warehouseId: String(warehouseId), closedAt: closedAt.toISOString() };
  });
}
