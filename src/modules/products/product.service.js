import { guardCommandCoverage, completeReplenishmentGuards } from '../../shared/utils/replenishment-guard.js';
import { hash } from '../../shared/utils/document-command.js';
import { Product, Category, Warehouse, Uom, OperationRecord } from '../../models/runtime.js';
import { requirePermission, requireWarehouseAccess } from '../../shared/utils/access.js';
import { escapeRegex } from '../../shared/utils/domain.js';
import { notFoundError, validationError, duplicateError } from '../../shared/utils/ApiError.js';
import { appendAudit, changedFields } from '../../shared/utils/audit.js';
import { exact } from '../../models/model-utils.js';
import { dto as nativeDto, page, transaction, updateCatalogue } from '../../shared/utils/persistence.js';

const dto = row => { const value=nativeDto(row); return {...value,nominalSize:value.lengthMm&&value.widthMm?exact(value.lengthMm).toFixed()+'x'+exact(value.widthMm).toFixed():null}; };
async function planningOperation(user, row, input, code, session, warehouseId) {
  const operation = await new OperationRecord({ actorType: 'USER', actorId: user._id, operationCode: code,
    requestKey: String(row._id) + ':' + input.expectedUpdatedAt + ':' + (warehouseId ?? ''), requestHash: hash(input),
    operationKey: hash({ actor: String(user._id), id: String(row._id), code, warehouseId, input }),
    subjectType: 'products', subjectId: row._id, versionBefore: 0, versionAfter: 1,
    resultCode: 'UPDATED', completedAt: new Date() }).save({ session });
  await completeReplenishmentGuards(session, operation._id);
  return operation._id;
}
const fields = ['name', 'manufacturerCode', 'categoryId', 'material', 'baseUnit', 'wholeBaseUnits', 'lengthMm', 'widthMm', 'heightMm', 'color', 'surface', 'origin', 'description'];
async function category(id, session) {
  if (!await Category.exists({ _id: id, isActive: true }).session(session)) throw validationError('Nhóm sản phẩm không tồn tại hoặc đã ngừng sử dụng');
}
async function product(id, session) {
  const row = await Product.findById(id).session(session);
  if (!row) throw notFoundError('Không tìm thấy sản phẩm');
  return row;
}
export async function listProducts(user, query) {
  requirePermission(user, 'product:read');
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.search) { const search = new RegExp(escapeRegex(query.search), 'i'); filter.$or = [{ sku: search }, { name: search }, { manufacturerCode: search }]; }
  const result=await page(Product, filter, query); return {...result,items:result.items.map(dto)};
}
export async function getProduct(user, id) {
  requirePermission(user, 'product:read');
  return dto(await product(id));
}
export async function getProductOptions(user) {
  requirePermission(user, 'product:read');
  const [categories, warehouses] = await Promise.all([
    Category.find({ isActive: true }).sort({ name: 1 }).lean(),
    Warehouse.find({ isActive: true }).select('_id code name').lean(),
  ]);
  return { categories: categories.map(nativeDto), warehouses: warehouses.map(nativeDto), uoms: (await Uom.find({isActive:true}).lean()).map(nativeDto) };
}
export async function createProduct(user, input) {
  requirePermission(user, 'product:create');
  try {
    return await transaction(async session => {
      await category(input.categoryId, session);
      if (!await Uom.exists({code:input.baseUnit,isActive:true}).session(session)) throw validationError('Đơn vị gốc không hoạt động');
      const row = await new Product({ ...input, isActive: true }).save({ session });
      await appendAudit({ actorId: user._id, action: 'CREATE_PRODUCT', entityType: 'products', entityId: row._id, session });
      return dto(row);
    });
  } catch (error) { if (error.code === 11000) throw duplicateError('Hãng, SKU và màu đã tồn tại'); throw error; }
}
export async function updateProduct(user, id, input) {
  requirePermission(user, 'product:update');
  return transaction(async session => {
    await guardCommandCoverage(null, { productId: id }, session);
    const before = await product(id, session);
    await category(input.categoryId, session);
    if (input.baseUnit !== before.baseUnit || input.wholeBaseUnits !== before.wholeBaseUnits) throw validationError('Không đổi đơn vị gốc của sản phẩm đã tạo');
    const changes = Object.fromEntries(fields.map(field => [field, input[field] ?? null]));
    const row = await updateCatalogue(Product, id, input.expectedUpdatedAt, changes, session);
    const operationId = await planningOperation(user, row, input, 'UPDATE_PRODUCT', session);
    await appendAudit({ operationId, actorId: user._id, action: 'UPDATE_PRODUCT', entityType: 'products', entityId: row._id, changes: changedFields(before, row, fields), session });
    return dto(row);
  });
}
export async function changeProductStatus(user, id, input) {
  requirePermission(user, 'product:update');
  return transaction(async session => {
    await guardCommandCoverage(null, { productId: id }, session);
    const row = await updateCatalogue(Product, id, input.expectedUpdatedAt, { isActive: input.isActive }, session);
    const operationId = await planningOperation(user, row, input, 'CHANGE_PRODUCT_STATUS', session);
    await appendAudit({ operationId, actorId: user._id, action: 'CHANGE_PRODUCT_STATUS', entityType: 'products', entityId: row._id, details: { reason: input.reason }, session });
    return dto(row);
  });
}
export async function listPolicies(user, id) {
  requirePermission(user, 'product:update');
  const row = await product(id);
  return { items: row.stockThresholds.map(nativeDto), updatedAt: row.updatedAt.toISOString() };
}
export async function configurePolicy(user, id, warehouseId, input) {
  requirePermission(user, 'product:update');
  requireWarehouseAccess(user, warehouseId);
  return transaction(async session => {
    await guardCommandCoverage(null, { productId: id }, session);
    if (!await Warehouse.exists({ _id: warehouseId, isActive: true }).session(session)) throw validationError('Kho không tồn tại hoặc đã ngừng sử dụng');
    const before = await product(id, session);
    const rows = before.stockThresholds.map(row => row.toObject());
    const index = rows.findIndex(row => String(row.warehouseId) === String(warehouseId));
    const updated = { ...(index >= 0 ? rows[index] : {}), warehouseId, minimumQty: input.minimumQty, targetQty: input.targetQty, updatedBy: user._id };
    if (index >= 0) rows[index] = updated; else rows.push(updated);
    const row = await updateCatalogue(Product, id, input.expectedUpdatedAt, { stockThresholds: rows }, session);
    const operationId = await planningOperation(user, row, input, 'CONFIGURE_STOCK_THRESHOLD', session, warehouseId);
    await appendAudit({ operationId, actorId: user._id, action: 'CONFIGURE_STOCK_THRESHOLD', entityType: 'products', entityId: row._id, warehouseIds: [warehouseId], session });
    return { ...nativeDto(row.stockThresholds.find(value => String(value.warehouseId) === String(warehouseId))), updatedAt: row.updatedAt.toISOString() };
  });
}
