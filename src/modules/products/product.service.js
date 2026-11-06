import mongoose from "mongoose";
import {
  Product,
  ProductUomVersion,
  ProductWarehousePolicy,
  Uom,
  Warehouse,
} from "../../models/legacy/index.js";
import { ExactDecimal } from "../../models/model-utils.js";
import {
  ApiError,
  duplicateError,
  notFoundError,
  validationError,
  versionConflict,
} from "../../shared/utils/ApiError.js";
import {
  escapeRegex,
  idString,
} from "../../shared/utils/domain.js";
import {
  hasPermission,
  requirePermission,
} from "../../shared/utils/access.js";
import { appendAudit, changedFields } from "../../shared/utils/audit.js";
import {
  mapConversion,
  mapPolicy,
  mapProductDetail,
  mapProductSummary,
} from "./product.mapper.js";

const BUSINESS_ROLES = ["OWNER", "ACCOUNTANT", "WAREHOUSE", "SALES"];
const transactionOptions = {
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
};
const editableFields = [
  "name",
  "nominalSize",
  "category",
  "brand",
  "material",
  "surface",
  "lengthMm",
  "widthMm",
  "thicknessMm",
  "origin",
  "description",
];
const optionalFields = editableFields.filter((field) => field !== "name");
const isDuplicateKey = (error) => error?.code === 11000;

function requireProductReader(user) {
  requirePermission(user, "product:read", BUSINESS_ROLES);
}

function requireProductEditor(user) {
  requirePermission(user, "product:update", ["OWNER"]);
}

function requireProductCreator(user) {
  requirePermission(user, "product:create", ["OWNER"]);
}

function buildReadSession(query, session) {
  return session ? query.session(session) : query;
}

async function loadUoms(ids, session = null) {
  const unique = [...new Set(ids.filter(Boolean).map(idString))];
  if (!unique.length) return new Map();
  const query = Uom.find({ _id: { $in: unique } })
    .select("_id code name")
    .lean();
  const items = await buildReadSession(query, session);
  return new Map(items.map((item) => [idString(item._id), item]));
}

export async function currentConversionsByProduct(productIds, session = null) {
  const ids = [...new Set(productIds.filter(Boolean).map(idString))];
  if (!ids.length) return new Map();
  const query = ProductUomVersion.find({
    productId: { $in: ids },
    validFrom: { $lte: new Date() },
  })
    .sort({ productId: 1, uomId: 1, validFrom: -1, version: -1 })
    .lean();
  const conversions = await buildReadSession(query, session);
  const seen = new Set();
  const result = new Map(ids.map((id) => [id, []]));
  for (const conversion of conversions) {
    const key = `${idString(conversion.productId)}:${idString(conversion.uomId)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.get(idString(conversion.productId)).push(conversion);
  }
  return result;
}

async function detailWithMasters(product) {
  const conversions = await currentConversionsByProduct([product._id]);
  const current = conversions.get(idString(product._id)) || [];
  const uoms = await loadUoms([
    product.baseUomId,
    ...current.map((conversion) => conversion.uomId),
  ]);
  return mapProductDetail(product, uoms, current);
}

export async function listProducts(user, query) {
  requireProductReader(user);
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.nominalSize) filter.nominalSize = query.nominalSize;
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [{ sku: search }, { name: search }];
  }
  const direction = query.sortOrder === "asc" ? 1 : -1;
  const sort = { [query.sortBy]: direction, _id: -1 };
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  const uoms = await loadUoms(products.map((product) => product.baseUomId));
  return {
    items: products.map((product) => mapProductSummary(product, uoms)),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getProduct(user, id) {
  requireProductReader(user);
  const product = await Product.findById(id).lean();
  if (!product) throw notFoundError("Không tìm thấy sản phẩm");
  return detailWithMasters(product);
}

export async function createProduct(user, input) {
  requireProductCreator(user);
  const session = await mongoose.startSession();
  let product;
  try {
    product = await session.withTransaction(async () => {
      const uom = await Uom.findById(input.baseUomId).session(session).lean();
      if (!uom) throw validationError("Đơn vị tính cơ bản không tồn tại");
      const duplicate = await Product.findOne({
        sku: { $regex: `^${escapeRegex(input.sku)}$`, $options: "i" },
      })
        .session(session)
        .lean();
      if (duplicate) throw duplicateError("SKU đã tồn tại");
      const created = new Product({
        sku: input.sku,
        name: input.name,
        baseUomId: input.baseUomId,
        wholeBaseUnits: input.wholeBaseUnits,
        ...(input.nominalSize != null && { nominalSize: input.nominalSize }),
        ...(input.category != null && { category: input.category }),
        ...(input.brand != null && { brand: input.brand }),
        ...(input.material != null && { material: input.material }),
        ...(input.surface != null && { surface: input.surface }),
        ...(input.lengthMm != null && { lengthMm: input.lengthMm }),
        ...(input.widthMm != null && { widthMm: input.widthMm }),
        ...(input.thicknessMm != null && {
          thicknessMm: input.thicknessMm,
        }),
        ...(input.origin != null && { origin: input.origin }),
        ...(input.description != null && { description: input.description }),
        isActive: true,
        version: 1,
      });
      await created.save({ session });
      await new ProductUomVersion({
        productId: created._id,
        uomId: created.baseUomId,
        version: 1,
        basePerUnit: "1",
        validFrom: new Date(),
        createdBy: user._id,
      }).save({ session });
      await appendAudit({
        actorId: user._id,
        action: "CREATE_PRODUCT",
        entityType: "PRODUCT",
        entityId: created._id,
        details: { sku: created.sku, name: created.name, baseUomId: idString(created.baseUomId) },
        session,
      });
      return created.toObject();
    }, transactionOptions);
  } catch (error) {
    if (isDuplicateKey(error)) throw duplicateError("SKU đã tồn tại");
    throw error;
  } finally {
    await session.endSession();
  }
  return detailWithMasters(product);
}

export async function updateProduct(user, id, input) {
  requireProductEditor(user);
  const session = await mongoose.startSession();
  let updated;
  try {
    updated = await session.withTransaction(async () => {
      const current = await Product.findById(id).session(session).lean();
      if (!current) throw notFoundError("Không tìm thấy sản phẩm");
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      const set = { name: input.name };
      const unset = {};
      for (const field of optionalFields) {
        if (input[field] != null) set[field] = input[field];
        else unset[field] = "";
      }
      const update = { $set: set, $inc: { version: 1 } };
      if (Object.keys(unset).length) update.$unset = unset;
      const next = await Product.findOneAndUpdate(
        { _id: id, version: input.expectedVersion },
        update,
        { returnDocument: "after", runValidators: true, session },
      ).lean();
      if (!next) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      await appendAudit({
        actorId: user._id,
        action: "UPDATE_PRODUCT",
        entityType: "PRODUCT",
        entityId: next._id,
        changes: changedFields(current, next, editableFields),
        session,
      });
      return next;
    }, transactionOptions);
  } finally {
    await session.endSession();
  }
  return detailWithMasters(updated);
}

export async function changeProductStatus(user, id, input) {
  requireProductEditor(user);
  const session = await mongoose.startSession();
  let updated;
  try {
    updated = await session.withTransaction(async () => {
      const current = await Product.findById(id).session(session).lean();
      if (!current) throw notFoundError("Không tìm thấy sản phẩm");
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      if (current.isActive === input.isActive) return current;
      const next = await Product.findOneAndUpdate(
        { _id: id, version: input.expectedVersion },
        { $set: { isActive: input.isActive }, $inc: { version: 1 } },
        { returnDocument: "after", runValidators: true, session },
      ).lean();
      if (!next) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      await appendAudit({
        actorId: user._id,
        action: "CHANGE_PRODUCT_STATUS",
        entityType: "PRODUCT",
        entityId: next._id,
        changes: [{ path: "isActive", before: current.isActive, after: next.isActive }],
        details: { reason: input.reason },
        session,
      });
      return next;
    }, transactionOptions);
  } finally {
    await session.endSession();
  }
  return detailWithMasters(updated);
}

export async function createConversion(user, productId, input) {
  requireProductEditor(user);
  const session = await mongoose.startSession();
  let conversion;
  try {
    conversion = await session.withTransaction(async () => {
      const product = await Product.findById(productId).session(session).lean();
      if (!product) throw notFoundError("Không tìm thấy sản phẩm");
      if (product.version !== input.expectedProductVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          product.version,
        );
      }
      if (!product.isActive) {
        throw new ApiError(409, "Sản phẩm đã ngừng hoạt động");
      }
      const uom = await Uom.findById(input.uomId).session(session).lean();
      if (!uom) throw validationError("Đơn vị tính không tồn tại");
      if (idString(product.baseUomId) === idString(input.uomId)) {
        throw validationError("Đơn vị cơ bản đã có hệ số 1 và không thể tạo lại");
      }
      const factor = new ExactDecimal(input.basePerUnit);
      if (uom.code === "BOX" && product.wholeBaseUnits && !factor.isInteger()) {
        throw validationError(
          "Hệ số quy đổi thùng phải nguyên với sản phẩm tính theo viên",
        );
      }
      const validFrom = new Date(input.validFrom);
      if (validFrom.getTime() < Date.now()) {
        throw validationError("Thời điểm hiệu lực không được ở quá khứ");
      }
      if (!input.verificationReference) {
        throw validationError("Quy đổi không phải đơn vị gốc cần căn cứ xác minh");
      }
      const guard = await Product.findOneAndUpdate(
        {
          _id: productId,
          version: input.expectedProductVersion,
          isActive: true,
        },
        { $inc: { version: 1 } },
        { returnDocument: "after", session },
      ).lean();
      if (!guard) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          product.version,
        );
      }
      const latest = await ProductUomVersion.findOne({
        productId,
        uomId: input.uomId,
      })
        .sort({ version: -1 })
        .session(session)
        .lean();
      const created = await new ProductUomVersion({
        productId,
        uomId: input.uomId,
        version: (latest?.version ?? 0) + 1,
        basePerUnit: input.basePerUnit,
        validFrom,
        createdBy: user._id,
        verificationReference: input.verificationReference,
      }).save({ session });
      await appendAudit({
        actorId: user._id,
        action: "CREATE_PRODUCT_UOM_VERSION",
        entityType: "PRODUCT_UOM_VERSION",
        entityId: created._id,
        details: {
          productId: idString(productId),
          uomId: idString(input.uomId),
          version: created.version,
          basePerUnit: created.basePerUnit.toString(),
          productVersion: guard.version,
        },
        session,
      });
      return {
        conversion: created.toObject(),
        productVersion: guard.version,
        uom,
      };
    }, transactionOptions);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new ApiError(409, "Phiên bản quy đổi vừa được tạo bởi yêu cầu khác");
    }
    throw error;
  } finally {
    await session.endSession();
  }
  const uoms = new Map([[idString(conversion.uom._id), conversion.uom]]);
  return {
    productId: idString(productId),
    productVersion: conversion.productVersion,
    conversion: mapConversion(conversion.conversion, uoms),
  };
}

export async function listConversions(user, productId, query) {
  requireProductReader(user);
  if (!(await Product.exists({ _id: productId }))) {
    throw notFoundError("Không tìm thấy sản phẩm");
  }
  const filter = { productId };
  if (query.uomId) filter.uomId = query.uomId;
  const [items, total] = await Promise.all([
    ProductUomVersion.find(filter)
      .sort({ validFrom: -1, version: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    ProductUomVersion.countDocuments(filter),
  ]);
  const uoms = await loadUoms(items.map((item) => item.uomId));
  return {
    items: items.map((item) => mapConversion(item, uoms)),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function configurePolicy(user, productId, warehouseId, input) {
  requireProductEditor(user);
  const session = await mongoose.startSession();
  let policy;
  let warehouse;
  try {
    const result = await session.withTransaction(async () => {
      const product = await Product.findById(productId).session(session).lean();
      if (!product || !product.isActive) {
        throw new ApiError(400, "Sản phẩm không tồn tại hoặc đã ngừng hoạt động");
      }
      const selectedWarehouse = await Warehouse.findById(warehouseId)
        .session(session)
        .lean();
      if (!selectedWarehouse || !selectedWarehouse.isActive) {
        throw new ApiError(400, "Kho không tồn tại hoặc đã ngừng hoạt động");
      }
      const minimum = new ExactDecimal(input.minimumQtyBase);
      const target = input.targetQtyBase == null
        ? minimum
        : new ExactDecimal(input.targetQtyBase);
      if (target.lt(minimum)) {
        throw validationError("Lượng mục tiêu phải lớn hơn hoặc bằng lượng tối thiểu");
      }
      if (
        product.wholeBaseUnits &&
        (!minimum.isInteger() || !target.isInteger())
      ) {
        throw validationError("Sản phẩm tính theo viên yêu cầu số lượng nguyên");
      }
      const existing = await ProductWarehousePolicy.findOne({
        productId,
        warehouseId,
      })
        .session(session)
        .lean();
      let next;
      if (input.expectedVersion === 0) {
        if (existing) {
          throw versionConflict(
            "Chính sách kho đã tồn tại, vui lòng tải lại.",
            existing.version,
          );
        }
        try {
          next = await new ProductWarehousePolicy({
            productId,
            warehouseId,
            minimumQty: input.minimumQtyBase,
            targetQty: target.toString(),
            version: 1,
            updatedBy: user._id,
          }).save({ session });
        } catch (error) {
          if (isDuplicateKey(error)) {
            throw new ApiError(409, "Chính sách kho vừa được tạo bởi yêu cầu khác");
          }
          throw error;
        }
        await appendAudit({
          actorId: user._id,
          action: "CREATE_PRODUCT_WAREHOUSE_POLICY",
          entityType: "PRODUCT_WAREHOUSE_POLICY",
          entityId: next._id,
          details: {
            productId: idString(productId),
            warehouseId: idString(warehouseId),
            minimumQtyBase: minimum.toString(),
            targetQtyBase: target.toString(),
          },
          session,
        });
        next = next.toObject();
      } else {
        if (!existing) {
          throw versionConflict(
            "Chính sách kho chưa tồn tại, vui lòng tải lại.",
            0,
          );
        }
        if (existing.version !== input.expectedVersion) {
          throw versionConflict(
            "Dữ liệu đã thay đổi, vui lòng tải lại.",
            existing.version,
          );
        }
        next = await ProductWarehousePolicy.findOneAndUpdate(
          { _id: existing._id, version: input.expectedVersion },
          {
            $set: {
              minimumQty: input.minimumQtyBase,
              targetQty: target.toString(),
              updatedBy: user._id,
            },
            $inc: { version: 1 },
          },
          { returnDocument: "after", runValidators: true, session },
        ).lean();
        if (!next) {
          throw versionConflict(
            "Dữ liệu đã thay đổi, vui lòng tải lại.",
            existing.version,
          );
        }
        await appendAudit({
          actorId: user._id,
          action: "UPDATE_PRODUCT_WAREHOUSE_POLICY",
          entityType: "PRODUCT_WAREHOUSE_POLICY",
          entityId: next._id,
          changes: changedFields(existing, next, ["minimumQty", "targetQty"]),
          session,
        });
      }
      return { next, selectedWarehouse };
    }, transactionOptions);
    policy = result.next;
    warehouse = result.selectedWarehouse;
  } finally {
    await session.endSession();
  }
  return mapPolicy(policy, warehouse);
}

export async function listPolicies(user, productId) {
  requireProductEditor(user);
  if (!(await Product.exists({ _id: productId }))) {
    throw notFoundError("Không tìm thấy sản phẩm");
  }
  const policies = await ProductWarehousePolicy.find({ productId })
    .sort({ warehouseId: 1 })
    .lean();
  const warehouses = new Map(
    (
      await Warehouse.find({
        _id: { $in: policies.map((policy) => policy.warehouseId) },
      })
        .select("_id code name isActive")
        .lean()
    ).map((warehouse) => [idString(warehouse._id), warehouse]),
  );
  return {
    items: policies.map((policy) =>
      mapPolicy(policy, warehouses.get(idString(policy.warehouseId))),
    ),
  };
}

export async function getProductOptions(user) {
  requireProductReader(user);
  const canConfigurePolicies = hasPermission(user, "product:update", ["OWNER"]);
  const [uoms, warehouses] = await Promise.all([
    Uom.find().sort({ code: 1 }).lean(),
    canConfigurePolicies
      ? Warehouse.find({ isActive: true })
          .select("_id code name isActive")
          .sort({ code: 1 })
          .lean()
      : [],
  ]);
  return {
    uoms: uoms.map((uom) => ({
      id: idString(uom._id),
      code: uom.code,
      name: uom.name,
    })),
    ...(canConfigurePolicies && {
      warehouses: warehouses.map((warehouse) => ({
        id: idString(warehouse._id),
        code: warehouse.code,
        name: warehouse.name,
        isActive: warehouse.isActive,
      })),
    }),
  };
}

// Resolve a product for internal commands without leaking master existence.
export async function requireActiveProduct(productId, session = null) {
  const query = Product.findById(productId).lean();
  const product = await buildReadSession(query, session);
  if (!product || !product.isActive) {
    throw validationError("Sản phẩm không tồn tại hoặc đã ngừng hoạt động");
  }
  return product;
}