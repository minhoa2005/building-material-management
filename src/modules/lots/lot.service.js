import { hash } from "../../shared/utils/document-command.js";
import {
  ProductBatch,
  Product,
  InventoryBalance,
  StockHoldingPoint,
  WarehouseLocation,
  StockTransaction,
  OperationRecord,
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
export async function listLots(user, query) {
  requirePermission(user, "product_lot:read");
  const filter = {};
  if (query.productId) filter.productId = query.productId;
  if (query.identificationStatus)
    filter.identificationStatus = query.identificationStatus;
  if (query.manufacturerLot)
    filter.manufacturerLot = new RegExp(
      escapeRegex(query.manufacturerLot),
      "i",
    );
  if (query.warehouseId)
    filter._id = {
      $in: await InventoryBalance.find({
        holdingPointId: { $in: await scopedPoints(user, query.warehouseId) },
      }).distinct("batchId"),
    };
  return page(ProductBatch, filter, query);
}
export async function getLot(user, id) {
  requirePermission(user, "product_lot:read");
  const row = await batch(id);
  const balances = await InventoryBalance.find({
    batchId: id,
    holdingPointId: { $in: await scopedPoints(user) },
  }).lean();
  return { ...dto(row), balances: balances.map(dto) };
}
export async function createLot(user, input) {
  requirePermission(user, "product_lot:create");
  try {
    return await transaction(async (session) => {
      const product = await Product.findOne({
        _id: input.productId,
        isActive: true,
      }).session(session);
      if (!product) throw validationError("Sản phẩm không hợp lệ");
      const row = await new ProductBatch(input).save({ session });
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
    const { expectedUpdatedAt, ...changes } = input;
    const immutable = [
      "manufacturerLot",
      "piecesPerCarton",
      "cartonLengthMm",
      "cartonWidthMm",
      "cartonHeightMm",
    ];
    const identityChanged = immutable.some(
      (field) =>
        field in changes && String(changes[field]) !== String(before[field]),
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
