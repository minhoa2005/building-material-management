import {
  configureConversion,
  conversionDto,
  syncAreaConversions,
} from "../../shared/utils/conversions.js";
import { hash } from "../../shared/utils/document-command.js";
import {
  Product,
  Category,
  Warehouse,
  Uom,
  OperationRecord,
  Conversion,
  ProductBatch,
  User,
} from "../../models/runtime.js";
import {
  requirePermission,
  requireWarehouseAccess,
} from "../../shared/utils/access.js";
import { escapeRegex } from "../../shared/utils/domain.js";
import {
  notFoundError,
  validationError,
  duplicateError,
} from "../../shared/utils/ApiError.js";
import { appendAudit, changedFields } from "../../shared/utils/audit.js";
import { exact } from "../../models/model-utils.js";
import {
  dto as nativeDto,
  page,
  transaction,
  updateCatalogue,
} from "../../shared/utils/persistence.js";

const dto = (row) => {
  const value = nativeDto(row);
  return {
    ...value,
    imageUrls: value.imageUrls ?? [],
    nominalSize:
      value.lengthMm && value.widthMm
        ? exact(value.lengthMm).toFixed() + "x" + exact(value.widthMm).toFixed()
        : null,
  };
};
async function planningOperation(user, row, input, code, session, warehouseId) {
  const operation = await new OperationRecord({
    actorType: "USER",
    actorId: user._id,
    operationCode: code,
    requestKey:
      String(row._id) +
      ":" +
      input.expectedUpdatedAt +
      ":" +
      (warehouseId ?? ""),
    requestHash: hash(input),
    operationKey: hash({
      actor: String(user._id),
      id: String(row._id),
      code,
      warehouseId,
      input,
    }),
    subjectType: "products",
    subjectId: row._id,
    versionBefore: 0,
    versionAfter: 1,
    resultCode: "UPDATED",
    completedAt: new Date(),
  }).save({ session });
  return operation._id;
}
const fields = [
  "name",
  "manufacturerCode",
  "categoryId",
  "material",
  "baseUnit",
  "wholeBaseUnits",
  "lengthMm",
  "widthMm",
  "heightMm",
  "color",
  "surface",
  "origin",
  "description",
];
async function category(id, session) {
  if (!(await Category.exists({ _id: id, isActive: true }).session(session)))
    throw validationError("Nhóm sản phẩm không tồn tại hoặc đã ngừng sử dụng");
}
async function product(id, session) {
  const row = await Product.findById(id).session(session);
  if (!row) throw notFoundError("Không tìm thấy sản phẩm");
  return row;
}
export async function listProducts(user, query) {
  requirePermission(user, "product:read");
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [
      { sku: search },
      { name: search },
      { manufacturerCode: search },
    ];
  }
  const result = await page(Product, filter, query);
  return { ...result, items: result.items.map(dto) };
}
async function currentConversions(productId, productBatchId, asOf) {
  const rows = await Conversion.aggregate([
    {
      $match: {
        productId,
        productBatchId,
        validFrom: { $lte: asOf },
      },
    },
    // The scope index is ascending on both fields; reverse scanning preserves
    // index order while putting each UOM's newest effective row first.
    { $sort: { uomId: -1, validFrom: -1 } },
    {
      $group: {
        _id: "$uomId",
        conversion: { $first: "$$ROOT" },
      },
    },
    { $replaceRoot: { newRoot: "$conversion" } },
    { $sort: { uomId: 1 } }, // $group order is unspecified; keep the list stable
  ]);
  if (!rows.length) return [];

  const [units, creators] = await Promise.all([
    Uom.find({
      _id: { $in: rows.map((row) => row.uomId) },
      isActive: true,
    }).lean(),
    User.find({
      _id: { $in: rows.map((row) => row.createdBy).filter(Boolean) },
    })
      .select("fullName username")
      .lean(),
  ]);
  const unitById = new Map(units.map((unit) => [String(unit._id), unit]));
  const creatorById = new Map(
    creators.map((creator) => [String(creator._id), creator]),
  );
  return rows.flatMap((row) => {
    const unit = unitById.get(String(row.uomId));
    return unit
      ? [conversionDto(row, unit, creatorById.get(String(row.createdBy)), true)]
      : [];
  });
}

export async function getProduct(user, id) {
  requirePermission(user, "product:read");
  const row = await product(id);
  const latestBatch = await ProductBatch.findOne({
    productId: row._id,
    identificationStatus: "VERIFIED",
  })
    .sort({ createdAt: -1, _id: -1 })
    .select("_id")
    .lean();
  const productBatchId = latestBatch?._id ?? null;
  const asOf = new Date();
  let conversions = await currentConversions(row._id, productBatchId, asOf);
  if (productBatchId && !conversions.length) {
    conversions = await currentConversions(row._id, null, asOf);
  }
  return {
    ...dto(row),
    currentConversions: conversions,
  };
}
export async function getProductOptions(user) {
  requirePermission(user, "product:read");
  const [categories, warehouses] = await Promise.all([
    Category.find({ isActive: true }).sort({ name: 1 }).lean(),
    Warehouse.find({ isActive: true }).select("_id code name").lean(),
  ]);
  return {
    categories: categories.map(nativeDto),
    warehouses: warehouses.map(nativeDto),
    uoms: (await Uom.find({ isActive: true }).lean()).map(nativeDto),
  };
}
export async function createProduct(user, input) {
  requirePermission(user, "product:create");
  try {
    return await transaction(async (session) => {
      await category(input.categoryId, session);
      if (
        !(await Uom.exists({ code: input.baseUnit, isActive: true }).session(
          session,
        ))
      ) {
        throw validationError("Đơn vị gốc không hoạt động");
      }

      const { conversions = [], stockThresholds = [], ...productData } = input;

      const formattedThresholds = [];
      for (const th of stockThresholds) {
        const wh = await Warehouse.findOne({
          _id: th.warehouseId,
          isActive: true,
        }).session(session);
        if (!wh) {
          throw validationError(
            `Kho ${th.warehouseId} không tồn tại hoặc đã ngừng hoạt động`,
          );
        }
        const minQty = String(th.minimumQty ?? "0");
        const targetQty = String(th.targetQty ?? minQty);
        formattedThresholds.push({
          warehouseId: th.warehouseId,
          minimumQty: minQty,
          targetQty,
          updatedBy: user._id,
        });
      }

      const row = await new Product({
        ...productData,
        stockThresholds: formattedThresholds,
        isActive: true,
      }).save({ session });

      for (const th of formattedThresholds) {
        const opInput = {
          warehouseId: th.warehouseId,
          minimumQty: th.minimumQty,
          targetQty: th.targetQty,
        };
        const operation = await new OperationRecord({
          actorType: "USER",
          actorId: user._id,
          operationCode: "CONFIGURE_STOCK_THRESHOLD",
          requestKey: `${row._id}:${th.warehouseId}:${Date.now()}`,
          requestHash: hash(opInput),
          operationKey: hash({
            actor: String(user._id),
            id: String(row._id),
            code: "CONFIGURE_STOCK_THRESHOLD",
            warehouseId: th.warehouseId,
            input: opInput,
          }),
          subjectType: "products",
          subjectId: row._id,
          versionBefore: 0,
          versionAfter: 1,
          resultCode: "CREATED",
          completedAt: new Date(),
        }).save({ session });
        await appendAudit({
          operationId: operation._id,
          actorId: user._id,
          action: "CONFIGURE_STOCK_THRESHOLD",
          entityType: "products",
          entityId: row._id,
          warehouseIds: [th.warehouseId],
          session,
        });
      }

      const createdConversions = [];
      for (const conversion of conversions) {
        createdConversions.push(
          await configureConversion(row, conversion, user, session),
        );
      }
      createdConversions.push(
        ...(await syncAreaConversions(row, user, session, {
          declared: new Set(conversions.map((c) => String(c.uomId))),
        })),
      );

      await appendAudit({
        actorId: user._id,
        action: "CREATE_PRODUCT",
        entityType: "products",
        entityId: row._id,
        session,
      });
      return { ...dto(row), conversions: createdConversions };
    });
  } catch (error) {
    if (error.code === 11000)
      throw duplicateError("Hãng, SKU và màu đã tồn tại");
    throw error;
  }
}
export async function updateProduct(user, id, input) {
  requirePermission(user, "product:update");
  return transaction(async (session) => {
    const before = await product(id, session);
    await category(input.categoryId, session);
    if (
      input.baseUnit !== before.baseUnit ||
      input.wholeBaseUnits !== before.wholeBaseUnits
    )
      throw validationError("Không đổi đơn vị gốc của sản phẩm đã tạo");
    const changes = Object.fromEntries(
      fields.map((field) => [field, input[field] ?? null]),
    );
    const auditFields = [...fields];
    if (input.imageUrls !== undefined) {
      changes.imageUrls = input.imageUrls;
      auditFields.push("imageUrls");
    }
    const row = await updateCatalogue(
      Product,
      id,
      input.expectedUpdatedAt,
      changes,
      session,
    );
    const sizeChanged = ["lengthMm", "widthMm"].some(
      (f) => String(before[f] ?? "") !== String(row[f] ?? ""),
    );
    if (sizeChanged) await syncAreaConversions(row, user, session);
    const operationId = await planningOperation(
      user,
      row,
      input,
      "UPDATE_PRODUCT",
      session,
    );
    await appendAudit({
      operationId,
      actorId: user._id,
      action: "UPDATE_PRODUCT",
      entityType: "products",
      entityId: row._id,
      changes: changedFields(before, row, auditFields),
      session,
    });
    return dto(row);
  });
}
export async function changeProductStatus(user, id, input) {
  requirePermission(user, "product:update");
  return transaction(async (session) => {
    const row = await updateCatalogue(
      Product,
      id,
      input.expectedUpdatedAt,
      { isActive: input.isActive },
      session,
    );
    const operationId = await planningOperation(
      user,
      row,
      input,
      "CHANGE_PRODUCT_STATUS",
      session,
    );
    await appendAudit({
      operationId,
      actorId: user._id,
      action: "CHANGE_PRODUCT_STATUS",
      entityType: "products",
      entityId: row._id,
      details: { reason: input.reason },
      session,
    });
    return dto(row);
  });
}
export async function listPolicies(user, id) {
  requirePermission(user, "product:update");
  const row = await product(id);
  const warehouseIds = (row.stockThresholds || []).map((t) => t.warehouseId);
  const warehouses = await Warehouse.find({
    _id: { $in: warehouseIds },
  }).lean();
  const warehouseMap = new Map(warehouses.map((w) => [String(w._id), w]));

  const items = (row.stockThresholds || []).map((t) => {
    const wh = warehouseMap.get(String(t.warehouseId));
    return {
      id: String(t._id || t.warehouseId),
      warehouseId: String(t.warehouseId),
      warehouse: {
        id: String(wh?._id || t.warehouseId),
        code: wh?.code || "",
        name: wh?.name || "",
        isActive: wh?.isActive ?? true,
      },
      minimumQty: String(t.minimumQty),
      minimumQtyBase: String(t.minimumQty),
      targetQty: String(t.targetQty ?? t.minimumQty),
      targetQtyBase: String(t.targetQty ?? t.minimumQty),
      version: 1,
      updatedBy: t.updatedBy ? { id: String(t.updatedBy), fullName: "" } : null,
      updatedAt: t.updatedAt
        ? t.updatedAt.toISOString()
        : row.updatedAt.toISOString(),
    };
  });
  return { items, updatedAt: row.updatedAt.toISOString() };
}
export async function configurePolicy(user, id, warehouseId, input) {
  requirePermission(user, "product:update");
  requireWarehouseAccess(user, warehouseId);
  return transaction(async (session) => {
    const wh = await Warehouse.findOne({
      _id: warehouseId,
      isActive: true,
    }).session(session);
    if (!wh) throw validationError("Kho không tồn tại hoặc đã ngừng sử dụng");
    const before = await product(id, session);
    const rows = before.stockThresholds.map((row) => row.toObject());
    const minQty = input.minimumQty ?? input.minimumQtyBase ?? "0";
    const targetQty = input.targetQty ?? input.targetQtyBase ?? minQty;
    const index = rows.findIndex(
      (row) => String(row.warehouseId) === String(warehouseId),
    );
    const updated = {
      ...(index >= 0 ? rows[index] : {}),
      warehouseId,
      minimumQty: minQty,
      targetQty,
      updatedBy: user._id,
    };
    if (index >= 0) rows[index] = updated;
    else rows.push(updated);
    const row = await updateCatalogue(
      Product,
      id,
      input.expectedUpdatedAt,
      { stockThresholds: rows },
      session,
    );
    const operationId = await planningOperation(
      user,
      row,
      input,
      "CONFIGURE_STOCK_THRESHOLD",
      session,
      warehouseId,
    );
    await appendAudit({
      operationId,
      actorId: user._id,
      action: "CONFIGURE_STOCK_THRESHOLD",
      entityType: "products",
      entityId: row._id,
      warehouseIds: [warehouseId],
      session,
    });
    const saved = row.stockThresholds.find(
      (value) => String(value.warehouseId) === String(warehouseId),
    );
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
  requirePermission(user, "product:read");
  const productRow = await product(id);
  const filter = { productId: productRow._id };
  if (query.uomId) filter.uomId = query.uomId;
  if (query.productBatchId !== undefined) {
    filter.productBatchId =
      query.productBatchId === "null" ? null : query.productBatchId;
  }
  const pageNumber = query.page ?? 1;
  const limit = query.limit ?? 50;
  const [rows, total] = await Promise.all([
    Conversion.find(filter)
      .sort({ validFrom: -1, _id: -1 })
      .skip((pageNumber - 1) * limit)
      .limit(limit)
      .lean(),
    Conversion.countDocuments(filter),
  ]);
  if (!rows.length) return { items: [], total, page: pageNumber, limit };

  const key = (row) => String(row.productBatchId) + ":" + row.uomId;
  const scopes = new Map(
    rows.map((row) => [
      key(row),
      {
        productBatchId: row.productBatchId,
        uomId: row.uomId,
      },
    ]),
  );
  const [units, creators, effective] = await Promise.all([
    Uom.find({ _id: { $in: rows.map((row) => row.uomId) } }).lean(),
    User.find({
      _id: { $in: rows.map((row) => row.createdBy).filter(Boolean) },
    })
      .select("fullName username")
      .lean(),
    Conversion.aggregate([
      {
        $match: {
          productId: productRow._id,
          $or: [...scopes.values()],
          validFrom: { $lte: new Date() },
        },
      },
      { $sort: { validFrom: -1 } },
      {
        $group: {
          _id: { productBatchId: "$productBatchId", uomId: "$uomId" },
          id: { $first: "$_id" },
        },
      },
    ]),
  ]);
  const uomById = new Map(units.map((unit) => [String(unit._id), unit]));
  const creatorById = new Map(
    creators.map((creator) => [String(creator._id), creator]),
  );
  const currentIds = new Set(effective.map((row) => String(row.id)));
  return {
    items: rows.map((row) =>
      conversionDto(
        row,
        uomById.get(String(row.uomId)),
        creatorById.get(String(row.createdBy)),
        currentIds.has(String(row._id)),
      ),
    ),
    total,
    page: pageNumber,
    limit,
  };
}

export async function createConversion(user, id, input) {
  requirePermission(user, "product:update");
  return transaction(async (session) =>
    configureConversion(await product(id, session), input, user, session),
  );
}
