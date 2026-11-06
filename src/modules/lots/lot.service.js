import mongoose from "mongoose";
import {
  BusinessDocument,
  Location,
  Lot,
  Party,
  PostingBatch,
  Product,
  StockAccount,
  StockBalance,
  StockMovement,
  Warehouse,
} from "../../models/legacy/index.js";
import {
  ApiError,
  ERROR_CODES,
  duplicateError,
  notFoundError,
  scopeError,
  validationError,
  versionConflict,
} from "../../shared/utils/ApiError.js";
import {
  calendarDateToInstant,
  idString,
  isoDate,
  saigonDateOnly,
} from "../../shared/utils/domain.js";
import {
  canAccessWarehouse,
  hasPermission,
  requirePermission,
} from "../../shared/utils/access.js";
import { appendAudit, changedFields } from "../../shared/utils/audit.js";
import { lotHasReferences } from "../../shared/utils/lotIdentity.js";
import {
  mapLotDetail,
  mapLotSummary,
  mapScopedStock,
} from "./lot.mapper.js";

const LOT_ROLES = ["OWNER", "WAREHOUSE"];
const transactionOptions = {
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
};
const identityFields = ["manufacturerLot", "tone", "calibre"];
const auditFields = [
  ...identityFields,
  "identificationStatus",
  "manufacturedOn",
  "notes",
  "verificationReference",
  "verifiedBy",
  "verifiedAt",
  "identityLocked",
  "version",
];
const documentPermissions = {
  GR_PURCHASE: "goods_receipt_inspection:read",
  GR_CUSTOMER_RETURN: "customer_return:read",
  GR_FAILED_DELIVERY: "customer_return:read",
  GI_SALE: "goods_issue:read",
  GI_SUPPLIER_RETURN: "supplier_return:read",
  TO: "stock_relocation:read",
  TRANSFER_DISPATCH: "stock_transfer:read",
  MWTR: "stock_transfer:read",
  ADJUSTMENT: "stock_adjustment:read",
  ST_RESOLUTION: "stock_adjustment:read",
  SCRAP: "defect:read",
};

const requireLotReader = (user) =>
  requirePermission(user, "product_lot:read", LOT_ROLES);
const requireLotCreator = (user) =>
  requirePermission(user, "product_lot:create", LOT_ROLES);
const requireLotUpdater = (user) =>
  requirePermission(user, "product_lot:update", ["OWNER"]);

function withSession(query, session) {
  return session ? query.session(session) : query;
}

function isDuplicateKey(error) {
  return error?.code === 11000;
}

function verificationError(message) {
  return new ApiError(400, message, { code: ERROR_CODES.LOT_VERIFICATION });
}

function identityLockedError(currentVersion) {
  return new ApiError(409, "Nhận dạng lô đã được sử dụng và không thể sửa", {
    code: ERROR_CODES.LOT_IDENTITY_LOCKED,
    details: { currentVersion },
  });
}

function hasUnknown(values) {
  return values.some(
    (value) => String(value ?? "").trim().toUpperCase() === "UNKNOWN",
  );
}

function manufacturedDate(value) {
  if (value == null) return null;
  if (value > saigonDateOnly()) {
    throw validationError("Ngày sản xuất không được ở tương lai");
  }
  return calendarDateToInstant(value);
}

async function findLot(id, session = null) {
  const lot = await withSession(Lot.findById(id).lean(), session);
  if (!lot) throw notFoundError("Không tìm thấy lô hàng");
  return lot;
}

async function productForLot(lot) {
  return Product.findById(lot.productId).lean();
}

async function scopedStockRows(lotIds, user, onlyWarehouseId = null) {
  if (!lotIds.length) return [];
  const balances = await StockBalance.find({ lotId: { $in: lotIds } }).lean();
  if (!balances.length) return [];
  const accounts = await StockAccount.find({
    _id: { $in: balances.map((balance) => balance.accountId) },
  }).lean();
  const locations = await Location.find({
    _id: {
      $in: accounts.map((account) => account.locationId).filter(Boolean),
    },
  }).lean();
  const warehouses = await Warehouse.find({
    _id: { $in: locations.map((location) => location.warehouseId) },
  }).lean();
  const parties = await Party.find({
    _id: { $in: balances.map((balance) => balance.ownerPartyId) },
  }).lean();
  const accountById = new Map(
    accounts.map((account) => [idString(account._id), account]),
  );
  const locationById = new Map(
    locations.map((location) => [idString(location._id), location]),
  );
  const warehouseById = new Map(
    warehouses.map((warehouse) => [idString(warehouse._id), warehouse]),
  );
  const partyById = new Map(
    parties.map((party) => [idString(party._id), party]),
  );
  const owner = hasPermission(user, "product_lot:read", ["OWNER"]);
  const assigned = new Set((user.warehouseIds || []).map(idString));
  return balances
    .map((balance) => {
      const account = accountById.get(idString(balance.accountId));
      const location = locationById.get(idString(account?.locationId));
      if (!account || !location) return null;
      const warehouseId = idString(location.warehouseId);
      if (onlyWarehouseId && warehouseId !== idString(onlyWarehouseId)) return null;
      if (!owner && !assigned.has(warehouseId)) return null;
      const warehouse = warehouseById.get(warehouseId);
      if (!warehouse) return null;
      return {
        lotId: idString(balance.lotId),
        mapped: mapScopedStock(
          balance,
          account,
          location,
          warehouse,
          partyById.get(idString(balance.ownerPartyId)),
        ),
      };
    })
    .filter(Boolean);
}

export async function listLots(user, query) {
  requireLotReader(user);
  if (query.warehouseId && !canAccessWarehouse(user, query.warehouseId)) {
    throw scopeError("Bạn không được phân công kho này");
  }
  const filter = {};
  for (const field of [
    "productId",
    "manufacturerLot",
    "tone",
    "calibre",
    "identificationStatus",
  ]) {
    if (query[field] != null) filter[field] = query[field];
  }
  const [lots, total] = await Promise.all([
    Lot.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Lot.countDocuments(filter),
  ]);
  const [products, stockRows] = await Promise.all([
    Product.find({ _id: { $in: lots.map((lot) => lot.productId) } }).lean(),
    scopedStockRows(
      lots.map((lot) => lot._id),
      user,
      query.warehouseId,
    ),
  ]);
  const productById = new Map(
    products.map((product) => [idString(product._id), product]),
  );
  const stockedLots = new Set(stockRows.map((row) => row.lotId));
  return {
    items: lots.map((lot) =>
      mapLotSummary(
        lot,
        productById.get(idString(lot.productId)),
        stockedLots.has(idString(lot._id)),
      ),
    ),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getLot(user, id) {
  requireLotReader(user);
  const lot = await findLot(id);
  const [product, stockRows] = await Promise.all([
    productForLot(lot),
    scopedStockRows([lot._id], user),
  ]);
  return mapLotDetail(lot, product, stockRows.map((row) => row.mapped));
}

export async function createLot(user, input) {
  requireLotCreator(user);
  const manufacturedOn = manufacturedDate(input.manufacturedOn);
  if (input.identificationStatus === "VERIFIED") {
    if (
      hasUnknown([input.manufacturerLot, input.tone, input.calibre]) ||
      !input.verificationReference
    ) {
      throw verificationError(
        "Lô VERIFIED cần đủ nhận dạng thực và căn cứ xác minh",
      );
    }
  }
  const session = await mongoose.startSession();
  let lot;
  try {
    lot = await session.withTransaction(async () => {
      const product = await withSession(
        Product.findById(input.productId).lean(),
        session,
      );
      if (!product || !product.isActive) {
        throw validationError("Sản phẩm không tồn tại hoặc đã ngừng hoạt động");
      }
      const duplicate = await Lot.findOne({
        productId: input.productId,
        manufacturerLot: input.manufacturerLot,
        tone: input.tone,
        calibre: input.calibre,
      })
        .session(session)
        .lean();
      if (duplicate) throw duplicateError("Nhận dạng lô đã tồn tại");
      const verified = input.identificationStatus === "VERIFIED";
      const created = await new Lot({
        productId: input.productId,
        manufacturerLot: input.manufacturerLot,
        tone: input.tone,
        calibre: input.calibre,
        identificationStatus: input.identificationStatus,
        ...(manufacturedOn && { manufacturedOn }),
        ...(input.verificationReference != null && {
          verificationReference: input.verificationReference,
        }),
        ...(input.notes != null && { notes: input.notes }),
        ...(verified && {
          verifiedBy: user._id,
          verifiedAt: new Date(),
        }),
        version: 1,
        createdBy: user._id,
        identityLocked: false,
      }).save({ session });
      await appendAudit({
        actorId: user._id,
        action: "CREATE_LOT",
        entityType: "LOT",
        entityId: created._id,
        details: {
          productId: idString(created.productId),
          manufacturerLot: created.manufacturerLot,
          tone: created.tone,
          calibre: created.calibre,
          identificationStatus: created.identificationStatus,
        },
        session,
      });
      return created.toObject();
    }, transactionOptions);
  } catch (error) {
    if (isDuplicateKey(error)) throw duplicateError("Nhận dạng lô đã tồn tại");
    throw error;
  } finally {
    await session.endSession();
  }
  return mapLotDetail(lot, await productForLot(lot), []);
}

export async function updateLot(user, id, input) {
  requireLotUpdater(user);
  const session = await mongoose.startSession();
  let updated;
  try {
    updated = await session.withTransaction(async () => {
      const current = await findLot(id, session);
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      const referencesExist = await lotHasReferences(current._id, session);
      if (referencesExist && !current.identityLocked) {
        await Lot.updateOne(
          { _id: current._id, identityLocked: false },
          { $set: { identityLocked: true } },
          { session },
        );
      }
      const identityChanged = identityFields.some(
        (field) =>
          Object.hasOwn(input, field) && input[field] !== current[field],
      );
      if (
        identityChanged &&
        (current.identityLocked || referencesExist)
      ) {
        throw identityLockedError(current.version);
      }
      const targetStatus =
        input.identificationStatus ?? current.identificationStatus;
      if (
        current.identificationStatus === "VERIFIED" &&
        targetStatus === "UNKNOWN"
      ) {
        throw verificationError(
          "Không thể chuyển lô đã xác minh về UNKNOWN trong UC-27",
        );
      }
      if (identityChanged && !input.identificationStatus) {
        throw validationError(
          "Thay đổi nhận dạng lô phải gửi kèm identificationStatus",
        );
      }
      const nextIdentity = {
        manufacturerLot: input.manufacturerLot ?? current.manufacturerLot,
        tone: input.tone ?? current.tone,
        calibre: input.calibre ?? current.calibre,
      };
      const reverify =
        targetStatus === "VERIFIED" &&
        (current.identificationStatus !== "VERIFIED" ||
          identityChanged ||
          Object.hasOwn(input, "verificationReference"));
      if (targetStatus === "VERIFIED") {
        if (
          hasUnknown(Object.values(nextIdentity)) ||
          (reverify && !input.verificationReference)
        ) {
          throw verificationError(
            "Lô VERIFIED cần đủ nhận dạng thực và căn cứ xác minh mới",
          );
        }
      }
      if (
        current.identificationStatus === "VERIFIED" &&
        !identityChanged &&
        input.verificationReference === null
      ) {
        throw verificationError("Không thể xóa căn cứ xác minh của lô VERIFIED");
      }
      const set = {
        identificationStatus: targetStatus,
      };
      for (const field of identityFields) {
        if (input[field] != null) set[field] = input[field];
      }
      const unset = {};
      if (Object.hasOwn(input, "manufacturedOn")) {
        set.manufacturedOn = manufacturedDate(input.manufacturedOn);
        if (set.manufacturedOn == null) {
          delete set.manufacturedOn;
          unset.manufacturedOn = "";
        }
      }
      if (Object.hasOwn(input, "notes")) {
        if (input.notes == null) unset.notes = "";
        else set.notes = input.notes;
      }
      if (Object.hasOwn(input, "verificationReference")) {
        if (input.verificationReference == null) {
          unset.verificationReference = "";
        } else {
          set.verificationReference = input.verificationReference;
        }
      } else if (
        identityChanged &&
        targetStatus !== "VERIFIED" &&
        !input.verificationReference
      ) {
        unset.verificationReference = "";
      }
      if (targetStatus === "VERIFIED") {
        if (reverify) {
          set.verifiedBy = user._id;
          set.verifiedAt = new Date();
        }
      } else {
        unset.verifiedBy = "";
        unset.verifiedAt = "";
      }
      const filter = {
        _id: current._id,
        version: input.expectedVersion,
        ...(identityChanged && { identityLocked: false }),
      };
      const update = { $set: set, $inc: { version: 1 } };
      if (Object.keys(unset).length) update.$unset = unset;
      const next = await Lot.findOneAndUpdate(filter, update, {
        returnDocument: "after",
        runValidators: true,
        session,
      }).lean();
      if (!next) {
        if (identityChanged) throw identityLockedError(current.version);
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      await appendAudit({
        actorId: user._id,
        action: "UPDATE_LOT",
        entityType: "LOT",
        entityId: next._id,
        changes: changedFields(current, next, auditFields),
        session,
      });
      return next;
    }, transactionOptions);
  } catch (error) {
    if (isDuplicateKey(error)) throw duplicateError("Nhận dạng lô đã tồn tại");
    throw error;
  } finally {
    await session.endSession();
  }
  const [product, stockRows] = await Promise.all([
    productForLot(updated),
    scopedStockRows([updated._id], user),
  ]);
  return mapLotDetail(updated, product, stockRows.map((row) => row.mapped));
}

function movementDocumentReference(document, user) {
  const base = {
    id: idString(document?._id),
    documentKind: document?.documentKind ?? null,
    access: "UNAVAILABLE",
  };
  if (!document) return base;
  const permission = documentPermissions[document.documentKind];
  const warehouseId = document.header?.warehouseId;
  if (
    !permission ||
    !hasPermission(user, permission) ||
    (warehouseId && !canAccessWarehouse(user, warehouseId))
  ) {
    return base;
  }
  return {
    ...base,
    access: "READABLE",
    documentNo: document.documentNo,
    workflowStatus: document.workflowStatus,
    version: document.version,
  };
}

export async function getLotMovements(user, id, query) {
  requireLotReader(user);
  requirePermission(user, "stock_movement:read", LOT_ROLES);
  const lot = await findLot(id);
  const lotBalances = await StockBalance.find({ lotId: lot._id }).lean();
  if (!lotBalances.length) {
    return { items: [], total: 0, page: query.page, limit: query.limit };
  }
  const balanceIds = lotBalances.map((balance) => balance._id);
  const movements = await StockMovement.find({
    $or: [
      { fromBalanceId: { $in: balanceIds } },
      { toBalanceId: { $in: balanceIds } },
    ],
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  const endpointIds = [
    ...new Set(
      movements.flatMap((movement) => [
        idString(movement.fromBalanceId),
        idString(movement.toBalanceId),
      ]).filter(Boolean),
    ),
  ];
  const balances = await StockBalance.find({ _id: { $in: endpointIds } }).lean();
  const accounts = await StockAccount.find({
    _id: { $in: balances.map((balance) => balance.accountId) },
  }).lean();
  const locations = await Location.find({
    _id: {
      $in: accounts.map((account) => account.locationId).filter(Boolean),
    },
  }).lean();
  const warehouses = await Warehouse.find({
    _id: { $in: locations.map((location) => location.warehouseId) },
  }).lean();
  const parties = await Party.find({
    _id: { $in: balances.map((balance) => balance.ownerPartyId) },
  }).lean();
  const documents = await BusinessDocument.find({
    _id: { $in: movements.map((movement) => movement.documentId) },
  }).lean();
  const batches = await PostingBatch.find({
    _id: { $in: movements.map((movement) => movement.batchId) },
  }).lean();
  const balanceById = new Map(
    balances.map((balance) => [idString(balance._id), balance]),
  );
  const accountById = new Map(
    accounts.map((account) => [idString(account._id), account]),
  );
  const locationById = new Map(
    locations.map((location) => [idString(location._id), location]),
  );
  const warehouseById = new Map(
    warehouses.map((warehouse) => [idString(warehouse._id), warehouse]),
  );
  const partyById = new Map(
    parties.map((party) => [idString(party._id), party]),
  );
  const documentById = new Map(
    documents.map((document) => [idString(document._id), document]),
  );
  const batchById = new Map(
    batches.map((batch) => [idString(batch._id), batch]),
  );
  const owner = hasPermission(user, "product_lot:read", ["OWNER"]);
  const assigned = new Set((user.warehouseIds || []).map(idString));
  const allowedWarehouse = (warehouseId) =>
    owner || assigned.has(idString(warehouseId));
  const mapEndpoint = (side, balanceId) => {
    if (!balanceId) return null;
    const balance = balanceById.get(idString(balanceId));
    const account = balance && accountById.get(idString(balance.accountId));
    const location = account && locationById.get(idString(account.locationId));
    const warehouse = location && warehouseById.get(idString(location.warehouseId));
    if (
      !balance ||
      !account ||
      !location ||
      !warehouse ||
      !allowedWarehouse(warehouse._id) ||
      idString(balance.lotId) !== idString(lot._id)
    ) {
      return null;
    }
    return {
      balanceId: idString(balance._id),
      qtyBefore:
        side === "from"
          ? balance.qtyBase.toString()
          : balance.qtyBase.toString(),
      warehouse: {
        id: idString(warehouse._id),
        code: warehouse.code,
        name: warehouse.name,
      },
      location: {
        id: idString(location._id),
        code: location.code,
        name: location.name,
      },
      qualityCode: balance.qualityCode,
      ownerParty: partyById.get(idString(balance.ownerPartyId))
        ? {
            id: idString(balance.ownerPartyId),
            code: partyById.get(idString(balance.ownerPartyId)).code,
            name: partyById.get(idString(balance.ownerPartyId)).name,
            kind: partyById.get(idString(balance.ownerPartyId)).kind,
          }
        : { id: idString(balance.ownerPartyId), code: null, name: null, kind: null },
    };
  };
  const items = [];
  for (const movement of movements) {
    const from = mapEndpoint("from", movement.fromBalanceId);
    const to = mapEndpoint("to", movement.toBalanceId);
    if (movement.fromBalanceId && !from) continue;
    if (movement.toBalanceId && !to) continue;
    if (!from && !to) continue;
    const batch = batchById.get(idString(movement.batchId));
    const document = documentById.get(idString(movement.documentId));
    items.push({
      id: idString(movement._id),
      qtyBase: movement.qtyBase.toString(),
      fromBalance: from
        ? {
            ...from,
            qtyBefore: movement.fromBefore?.toString() ?? null,
            qtyAfter: movement.fromAfter?.toString() ?? null,
          }
        : null,
      toBalance: to
        ? {
            ...to,
            qtyBefore: movement.toBefore?.toString() ?? null,
            qtyAfter: movement.toAfter?.toString() ?? null,
          }
        : null,
      batch: batch
        ? {
            id: idString(batch._id),
            operation: batch.operation,
            postedAt: isoDate(batch.postedAt),
            reversalOf: idString(batch.reversalOf),
          }
        : null,
      document: movementDocumentReference(document, user),
      occurredAt: isoDate(movement.createdAt),
    });
  }
  const start = (query.page - 1) * query.limit;
  return {
    items: items.slice(start, start + query.limit),
    total: items.length,
    page: query.page,
    limit: query.limit,
  };
}