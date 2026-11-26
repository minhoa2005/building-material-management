import { hash } from "../../shared/utils/document-command.js";
import { exact } from "../../models/model-utils.js";
import {
  ProductBatch,
  Product,
  InventoryBalance,
  StockHoldingPoint,
  WarehouseLocation,
  Uom,
  StockTransaction,
  OperationRecord,
  User,
  Warehouse,
} from "../../models/runtime.js";
import {
  requirePermission,
  requireWarehouseAccess,
  isOwner,
} from "../../shared/utils/access.js";
import {
  duplicateError,
  notFoundError,
  validationError,
} from "../../shared/utils/ApiError.js";
import { escapeRegex } from "../../shared/utils/domain.js";
import {
  dto,
  page,
  serialize,
  transaction,
  updateCatalogue,
} from "../../shared/utils/persistence.js";
import { appendAudit, changedFields } from "../../shared/utils/audit.js";
import {
  lotHasReferences,
  lockLotIdentity,
} from "../../shared/utils/lotIdentity.js";
import { syncLotConversions } from "../../shared/utils/conversions.js";

async function batch(id, session) {
  const row = await ProductBatch.findById(id).session(session);
  if (!row) throw notFoundError("Không tìm thấy lô hàng");
  return row;
}
// Product base unit as stocktake lines expose it: uomCode (Product.baseUnit) and uomName (Uom.name).
async function baseUnits(products) {
  const codes = [...new Set(products.map((p) => p?.baseUnit).filter(Boolean))];
  const units = codes.length ? await Uom.find({ code: { $in: codes } }).select("code name").lean() : [];
  const names = new Map(units.map((unit) => [unit.code, unit.name]));
  return (product) => ({
    uomCode: product?.baseUnit ?? null,
    uomName: (product?.baseUnit && names.get(product.baseUnit)) ?? null,
  });
}
async function scopedPoints(user, warehouseId) {
  if (warehouseId) requireWarehouseAccess(user, warehouseId);
  const filter = warehouseId
    ? { warehouseId }
    : isOwner(user)
      ? {}
      : { warehouseId: { $in: user.warehouseIds || [] } };
  const locations = await WarehouseLocation.find(filter).select("_id").lean();
  return StockHoldingPoint.find({
    type: "LOCATION",
    locationId: { $in: locations.map((row) => row._id) },
  }).distinct("_id");
}
// `scopeFilter` lets server-side callers (e.g. a stocktake's product/lot filter) narrow the list
// beyond what the public query accepts; it is never read from the request.
export async function listLots(user, query, scopeFilter = {}) {
  requirePermission(user, "product_lot:read");
  const filter = { ...scopeFilter };
  if (query.productId) filter.productId = query.productId;
  if (query.identificationStatus)
    filter.identificationStatus = query.identificationStatus;
  if (query.manufacturerLot)
    filter.manufacturerLot = new RegExp(
      escapeRegex(query.manufacturerLot),
      "i",
    );
  for (const field of ["tone", "calibre"])
    if (query[field])
      filter[field] = new RegExp(escapeRegex(query[field]), "i");
  if (query.warehouseId)
    filter._id = {
      $in: await InventoryBalance.find({
        holdingPointId: { $in: await scopedPoints(user, query.warehouseId) },
      }).distinct("batchId"),
    };
  const result = await page(ProductBatch, filter, query);
  const ids = result.items.map((row) => row.id);
  const scopedPointIds = await scopedPoints(user);
  const [products, balances] = await Promise.all([
    Product.find({ _id: { $in: result.items.map((row) => row.productId) } })
      .select("sku name baseUnit")
      .lean(),
    InventoryBalance.find({
      batchId: { $in: ids }, holdingPointId: { $in: scopedPointIds },
    }).select("_id batchId quantityBase").lean(),
  ]);
  const unitOf = await baseUnits(products);
  const stockedIds = new Set(balances.filter((balance) => exact(balance.quantityBase).gt(0)).map((balance) => String(balance.batchId)));
  return {
    ...result,
    items: result.items.map((row) => {
      const product = products.find((p) => String(p._id) === row.productId);
      return {
        ...row,
        product: product && {
          id: String(product._id),
          sku: product.sku,
          name: product.name,
        },
        ...unitOf(product),
        hasScopedStock: stockedIds.has(row.id),
      };
    }),
  };
}
export async function getLot(user, id) {
  requirePermission(user, "product_lot:read");
  const row = await batch(id);
  const balances = await InventoryBalance.find({
    batchId: id,
    holdingPointId: { $in: await scopedPoints(user) },
  }).lean();
  const points = await StockHoldingPoint.find({
    _id: { $in: balances.map((b) => b.holdingPointId) },
  }).lean();
  const locations = await WarehouseLocation.find({
    _id: { $in: points.map((p) => p.locationId).filter(Boolean) },
  })
    .select("code name warehouseId")
    .lean();
  const [warehouses, verifier, product] = await Promise.all([
    Warehouse.find({ _id: { $in: locations.map((l) => l.warehouseId) } })
      .select("code name")
      .lean(),
    row.verifiedBy && User.findById(row.verifiedBy).select("fullName").lean(),
    Product.findById(row.productId).select("sku name baseUnit").lean(),
  ]);
  const unitOf = await baseUnits([product]);
  const byId = (rows, key) => rows.find((r) => String(r._id) === String(key));
  const ref = (r) => r && { id: String(r._id), code: r.code, name: r.name };
  const stock = balances
    .filter((b) => !/^0(\.0+)?$/.test(String(b.quantityBase)))
    .map((b) => {
      const location = byId(locations, byId(points, b.holdingPointId)?.locationId);
      return {
        warehouse: ref(byId(warehouses, location?.warehouseId)),
        location: ref(location),
        quality: b.qualityStatus,
        quantityBase: String(b.quantityBase),
      };
    })
    .filter((s) => s.warehouse);
  return {
    ...dto(row),
    product: product && {
      id: String(product._id),
      sku: product.sku,
      name: product.name,
    },
    ...unitOf(product),
    verifiedBy: verifier && { id: String(verifier._id), fullName: verifier.fullName },
    identityLocked: await lotHasReferences(id),
    stock,
    balances: balances.map((balance) => dto(balance)),
  };
}
// Who verified the lot and when, set once it becomes VERIFIED.
const verification = (user, input, before) =>
  input.identificationStatus === "VERIFIED" &&
  before?.identificationStatus !== "VERIFIED"
    ? { verifiedAt: new Date(), verifiedBy: user._id }
    : {};
export async function createLot(user, input) {
  requirePermission(user, "product_lot:create");
  try {
    return await transaction(async (session) => {
      const product = await Product.findOne({
        _id: input.productId,
        isActive: true,
      }).session(session);
      if (!product) throw validationError("Sản phẩm không hợp lệ");
      const row = await new ProductBatch({
        ...input,
        ...verification(user, input),
      }).save({ session });
      await syncLotConversions(row, product, user, session);
      await appendAudit({
        actorId: user._id,
        action: "CREATE_PRODUCT_BATCH",
        entityType: "product_batches",
        entityId: row._id,
        session,
      });
      return dto(row);
    });
  } catch (error) {
    // Unique index: productId + manufacturerLot.
    if (error.code === 11000)
      throw duplicateError("Lô nhà máy này đã tồn tại cho sản phẩm");
    throw error;
  }
}
export async function updateLot(user, id, input) {
  requirePermission(user, "product_lot:update");
  return transaction(async (session) => {
    const before = await batch(id, session);
    const { expectedUpdatedAt, ...edits } = input;
    const changes = { ...edits, ...verification(user, input, before) };
    const immutable = [
      "manufacturerLot",
      "tone",
      "calibre",
      "piecesPerCarton",
      "cartonLengthMm",
      "cartonWidthMm",
      "cartonHeightMm",
    ];
    // null and missing are the same "unset" value for the optional tone/calibre.
    const same = (a, b) => String(a ?? "") === String(b ?? "");
    const identityChanged = immutable.some(
      (field) => field in changes && !same(changes[field], before[field]),
    );
    if (identityChanged && (await lotHasReferences(id, session)))
      throw validationError(
        "Lô đã có chứng từ hoặc tồn; không đổi nhận diện và quy cách",
      );
    const row = await updateCatalogue(
      ProductBatch,
      id,
      expectedUpdatedAt,
      changes,
      session,
    );
    if (row.identificationStatus === "VERIFIED") {
      const product = await Product.findById(row.productId).session(session);
      if (!product) throw validationError("Sản phẩm không hợp lệ");
      await syncLotConversions(row, product, user, session);
    }
    const operation = await new OperationRecord({
      actorType: "USER",
      actorId: user._id,
      operationCode: "UPDATE_PRODUCT_BATCH",
      requestKey: id + ":" + expectedUpdatedAt,
      requestHash: hash(input),
      operationKey: hash({ actor: String(user._id), id, input }),
      subjectType: "product_batches",
      subjectId: row._id,
      versionBefore: 0,
      versionAfter: 1,
      resultCode: "UPDATED",
      completedAt: new Date(),
    }).save({ session });
    await appendAudit({
      operationId: operation._id,
      actorId: user._id,
      action: "UPDATE_PRODUCT_BATCH",
      entityType: "product_batches",
      entityId: row._id,
      changes: changedFields(before, row, Object.keys(changes)),
      session,
    });
    return dto(row);
  });
}
export async function getLotMovements(user, id, query) {
  requirePermission(user, "product_lot:read");
  requirePermission(user, "stock_movement:read");
  await batch(id);
  const balances = await InventoryBalance.find({
    batchId: id,
    holdingPointId: { $in: await scopedPoints(user) },
  }).distinct("_id");
  const allowed = new Set(balances.map(String));
  const transactions = await StockTransaction.find({
    $or: [
      { "movements.fromBalanceId": { $in: balances } },
      { "movements.toBalanceId": { $in: balances } },
    ],
  })
    .sort({ occurredAt: -1 })
    .lean();
  const movements = transactions.flatMap((row) =>
    row.movements
      .filter(
        (m) =>
          allowed.has(String(m.fromBalanceId)) ||
          allowed.has(String(m.toBalanceId)),
      )
      .map((m) => ({
        ...serialize(m),
        id: String(m._id),
        sourceId: String(row.sourceId),
        sourceType: row.sourceType,
        occurredAt: row.occurredAt,
        // Hide endpoint quantities outside the user's warehouse scope.
        fromBalanceId: allowed.has(String(m.fromBalanceId))
          ? String(m.fromBalanceId)
          : null,
        fromBefore: allowed.has(String(m.fromBalanceId))
          ? String(m.fromBefore)
          : null,
        fromAfter: allowed.has(String(m.fromBalanceId))
          ? String(m.fromAfter)
          : null,
        toBalanceId: allowed.has(String(m.toBalanceId))
          ? String(m.toBalanceId)
          : null,
        toBefore: allowed.has(String(m.toBalanceId))
          ? String(m.toBefore)
          : null,
        toAfter: allowed.has(String(m.toBalanceId)) ? String(m.toAfter) : null,
      })),
  );
  return {
    items: movements.slice(
      (query.page - 1) * query.limit,
      query.page * query.limit,
    ),
    total: movements.length,
    page: query.page,
    limit: query.limit,
  };
}
