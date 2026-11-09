import { guardCommandCoverage, completeReplenishmentGuards } from '../../shared/utils/replenishment-guard.js';
import { hash } from '../../shared/utils/document-command.js';
import { Product, Category, Warehouse, Uom, OperationRecord, ProductBatch } from '../../models/runtime.js';
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
  const warehouseIds = (row.stockThresholds || []).map(t => t.warehouseId);
  const warehouses = await Warehouse.find({ _id: { $in: warehouseIds } }).lean();
  const warehouseMap = new Map(warehouses.map(w => [String(w._id), w]));

  const items = (row.stockThresholds || []).map(t => {
    const wh = warehouseMap.get(String(t.warehouseId));
    return {
      id: String(t._id || t.warehouseId),
      warehouseId: String(t.warehouseId),
      warehouse: {
        id: String(wh?._id || t.warehouseId),
        code: wh?.code || '',
        name: wh?.name || '',
        isActive: wh?.isActive ?? true,
      },
      minimumQty: String(t.minimumQty),
      minimumQtyBase: String(t.minimumQty),
      targetQty: String(t.targetQty ?? t.minimumQty),
      targetQtyBase: String(t.targetQty ?? t.minimumQty),
      version: 1,
      updatedBy: t.updatedBy ? { id: String(t.updatedBy), fullName: '' } : null,
      updatedAt: t.updatedAt ? t.updatedAt.toISOString() : row.updatedAt.toISOString(),
    };
  });
  return { items, updatedAt: row.updatedAt.toISOString() };
}
export async function configurePolicy(user, id, warehouseId, input) {
  requirePermission(user, 'product:update');
  requireWarehouseAccess(user, warehouseId);
  return transaction(async session => {
    await guardCommandCoverage(null, { productId: id }, session);
    const wh = await Warehouse.findOne({ _id: warehouseId, isActive: true }).session(session);
    if (!wh) throw validationError('Kho không tồn tại hoặc đã ngừng sử dụng');
    const before = await product(id, session);
    const rows = before.stockThresholds.map(row => row.toObject());
    const minQty = input.minimumQty ?? input.minimumQtyBase ?? '0';
    const targetQty = input.targetQty ?? input.targetQtyBase ?? minQty;
    const index = rows.findIndex(row => String(row.warehouseId) === String(warehouseId));
    const updated = { ...(index >= 0 ? rows[index] : {}), warehouseId, minimumQty: minQty, targetQty, updatedBy: user._id };
    if (index >= 0) rows[index] = updated; else rows.push(updated);
    const row = await updateCatalogue(Product, id, input.expectedUpdatedAt, { stockThresholds: rows }, session);
    const operationId = await planningOperation(user, row, input, 'CONFIGURE_STOCK_THRESHOLD', session, warehouseId);
    await appendAudit({ operationId, actorId: user._id, action: 'CONFIGURE_STOCK_THRESHOLD', entityType: 'products', entityId: row._id, warehouseIds: [warehouseId], session });
    const saved = row.stockThresholds.find(value => String(value.warehouseId) === String(warehouseId));
    return {
      id: String(saved?._id || warehouseId),
      warehouseId: String(warehouseId),
      warehouse: {
        id: String(wh._id),
        code: wh.code,
        name: wh.name,
        isActive: wh.isActive,
      },
      minimumQty: String(saved?.minimumQty || minQty),
      minimumQtyBase: String(saved?.minimumQty || minQty),
      targetQty: String(saved?.targetQty || targetQty),
      targetQtyBase: String(saved?.targetQty || targetQty),
      version: 1,
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}
export async function listConversions(user, id, query = {}) {
  requirePermission(user, 'product:read');
  const row = await product(id);
  const [batches, uoms, customOps] = await Promise.all([
    ProductBatch.find({ productId: id }).sort({ createdAt: -1 }).lean(),
    Uom.find({ isActive: true }).lean(),
    OperationRecord.find({
      subjectType: 'products',
      subjectId: id,
      operationCode: 'CREATE_PRODUCT_CONVERSION',
    }).sort({ completedAt: -1 }).lean(),
  ]);

  const uomMap = new Map(uoms.map(u => [String(u._id), u]));
  const boxUom = uoms.find(u => ['BOX', 'Thùng', 'HOP', 'Hộp'].includes(u.code) || ['Thùng', 'Hộp', 'Kiện'].includes(u.name)) || { _id: 'box', code: 'BOX', name: 'Hộp' };

  const items = [];
  const seenKeys = new Set();

  for (const b of batches) {
    if (!b.piecesPerCarton) continue;
    const key = `BOX:${b.piecesPerCarton}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    items.push({
      id: String(b._id),
      version: 1,
      uom: {
        id: String(boxUom._id),
        code: boxUom.code,
        name: boxUom.name,
      },
      basePerUnit: String(b.piecesPerCarton),
      validFrom: (b.manufacturedOn || b.createdAt || row.createdAt).toISOString(),
      verificationReference: b.manufacturerLot ? `Quy cách lô ${b.manufacturerLot} (${b.piecesPerCarton} ${row.baseUnit}/hộp)` : 'Quy cách NSX tiêu chuẩn',
      createdBy: null,
      isCurrent: true,
    });
  }

  for (const op of customOps) {
    if (!op.requestKey) continue;
    const parts = op.requestKey.split(':');
    if (parts.length >= 3) {
      const uomId = parts[1];
      const basePerUnit = parts[2];
      const uom = uomMap.get(uomId);
      const key = `${uom?.code || uomId}:${basePerUnit}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      items.push({
        id: String(op._id),
        version: 1,
        uom: uom ? { id: String(uom._id), code: uom.code, name: uom.name } : { id: uomId, code: 'BOX', name: 'Hộp' },
        basePerUnit: String(basePerUnit),
        validFrom: op.completedAt.toISOString(),
        verificationReference: op.correlationId || 'Căn cứ quy cách đóng gói bổ sung',
        createdBy: op.actorId ? { id: String(op.actorId), fullName: '' } : null,
        isCurrent: true,
      });
    }
  }

  return {
    items,
    total: items.length,
    page: 1,
    limit: query.limit || 50,
  };
}
export async function createConversion(user, id, input) {
  requirePermission(user, 'product:update');
  return transaction(async session => {
    const row = await product(id, session);
    const targetUom = await Uom.findOne({ _id: input.uomId, isActive: true }).session(session);
    if (!targetUom) throw validationError('Đơn vị quy đổi không tồn tại hoặc đã ngừng hoạt động');

    if (String(targetUom.code).toLowerCase() === String(row.baseUnit).toLowerCase() ||
        String(targetUom.name).toLowerCase() === String(row.baseUnit).toLowerCase()) {
      throw validationError('Đơn vị quy đổi không được trùng với đơn vị cơ sở');
    }

    const factorNum = Number(input.basePerUnit);
    if (isNaN(factorNum) || factorNum <= 0) {
      throw validationError('Hệ số quy đổi phải lớn hơn 0');
    }

    if (row.wholeBaseUnits && ['BOX', 'Thùng', 'Hộp'].includes(targetUom.code) && !Number.isInteger(factorNum)) {
      throw validationError('Sản phẩm tính theo đơn vị nguyên viên yêu cầu quy cách hộp phải là số nguyên');
    }

    let batchId = null;
    if (['BOX', 'Thùng', 'HOP', 'Hộp'].includes(targetUom.code) || ['Thùng', 'Hộp'].includes(targetUom.name)) {
      const existingBatch = await ProductBatch.findOne({
        productId: id,
        piecesPerCarton: Math.round(factorNum),
      }).session(session);

      if (!existingBatch) {
        const newBatch = await new ProductBatch({
          productId: id,
          manufacturerLot: `QC-${Math.round(factorNum)}V`,
          identificationStatus: 'VERIFIED',
          manufacturedOn: new Date(input.validFrom),
          piecesPerCarton: Math.round(factorNum),
          cartonLengthMm: row.lengthMm,
          cartonWidthMm: row.widthMm,
          cartonHeightMm: row.heightMm,
        }).save({ session });
        batchId = newBatch._id;
      } else {
        batchId = existingBatch._id;
      }
    }

    const requestKey = `${id}:${input.uomId}:${input.basePerUnit}:${Date.now()}`;
    const operation = await new OperationRecord({
      actorType: 'USER',
      actorId: user._id,
      operationCode: 'CREATE_PRODUCT_CONVERSION',
      requestKey,
      requestHash: hash(input),
      operationKey: hash({ actor: String(user._id), id: String(row._id), code: 'CREATE_PRODUCT_CONVERSION', input }),
      subjectType: 'products',
      subjectId: row._id,
      versionBefore: 0,
      versionAfter: 1,
      correlationId: input.verificationReference,
      resultCode: 'CREATED',
      completedAt: new Date(),
    }).save({ session });

    await appendAudit({
      operationId: operation._id,
      actorId: user._id,
      action: 'CREATE_PRODUCT_CONVERSION',
      entityType: 'products',
      entityId: row._id,
      details: {
        uomId: input.uomId,
        uomName: targetUom.name,
        basePerUnit: input.basePerUnit,
        verificationReference: input.verificationReference,
      },
      session,
    });

    return {
      id: String(batchId || operation._id),
      productId: String(id),
      version: 1,
      productVersion: 1,
      uom: {
        id: String(targetUom._id),
        code: targetUom.code,
        name: targetUom.name,
      },
      basePerUnit: String(input.basePerUnit),
      validFrom: new Date(input.validFrom).toISOString(),
      verificationReference: input.verificationReference,
      createdBy: { id: String(user._id), fullName: user.fullName || user.username },
      isCurrent: true,
    };
  });
}
