import mongoose from "mongoose";
import {
  AuditEvent,
  BusinessDocument,
  Party,
  Warehouse,
} from "../../models/legacy/index.js";
import { currentRole } from "../../shared/utils/userRole.js";
import {
  ApiError,
  duplicateError,
  notFoundError,
  versionConflict,
} from "../../shared/utils/ApiError.js";
import { escapeRegex, idString, isoDate } from "../../shared/utils/domain.js";
import { hasPermission, requirePermission } from "../../shared/utils/access.js";
import { appendAudit, changedFields } from "../../shared/utils/audit.js";
import {
  mapSupplierDetail,
  mapSupplierDocument,
  mapSupplierSummary,
  supplierStatus,
} from "./supplier.mapper.js";

const transactionOptions = {
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
};
const editableFields = [
  "name",
  "phone",
  "email",
  "address",
  "taxCode",
  "contactPerson",
  "notes",
];
const supplierReadRoles = ["OWNER", "ACCOUNTANT"];
const documentPermissions = {
  PO: "purchase_order:read",
  GR_PURCHASE: "goods_receipt_inspection:read",
  SUPPLIER_RETURN: "supplier_return:read",
};
const isDuplicateKey = (error) => error?.code === 11000;

const requireSupplierReader = (user) =>
  requirePermission(user, "supplier:read", supplierReadRoles);
const requireSupplierCreator = (user) =>
  requirePermission(user, "supplier:create", ["ACCOUNTANT"]);
const requireSupplierEditor = (user) =>
  requirePermission(user, "supplier:update", ["ACCOUNTANT"]);
const requireSupplierStatusEditor = (user) =>
  requirePermission(user, "supplier:activate", ["OWNER"]);

function withSession(query, session) {
  return session ? query.session(session) : query;
}

function warehouseScope(user) {
  if (currentRole(user)?.code === "OWNER") return {};
  return {
    "header.warehouseId": {
      $in: (user.warehouseIds || []).map(
        (id) => new mongoose.Types.ObjectId(idString(id)),
      ),
    },
  };
}

function supplierFilter(supplierId) {
  return { "header.supplierId": supplierId };
}

async function findSupplier(id, session = null) {
  const query = Party.findOne({ _id: id, kind: "SUPPLIER" }).lean();
  const supplier = await withSession(query, session);
  if (!supplier) throw notFoundError("Không tìm thấy nhà cung cấp");
  return supplier;
}

export async function listSuppliers(user, query) {
  requireSupplierReader(user);
  const filter = { kind: "SUPPLIER" };
  const and = [];
  if (query.cooperationStatus === "ACTIVE") {
    and.push({
      $or: [
        { cooperationStatus: "ACTIVE" },
        { cooperationStatus: null, isActive: { $ne: false } },
      ],
    });
  } else if (query.cooperationStatus === "SUSPENDED") {
    and.push({
      $or: [
        { cooperationStatus: "SUSPENDED" },
        { cooperationStatus: null, isActive: false },
      ],
    });
  } else if (query.cooperationStatus === "TERMINATED") {
    filter.cooperationStatus = "TERMINATED";
  }
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search), "i");
    and.push({ $or: [{ code: search }, { name: search }] });
  }
  if (and.length) filter.$and = and;
  const [items, total] = await Promise.all([
    Party.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Party.countDocuments(filter),
  ]);
  return {
    items: items.map(mapSupplierSummary),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function getSupplier(user, id) {
  requireSupplierReader(user);
  return mapSupplierDetail(await findSupplier(id));
}

export async function createSupplier(user, input) {
  requireSupplierCreator(user);
  const session = await mongoose.startSession();
  let supplier;
  try {
    supplier = await session.withTransaction(async () => {
      const duplicate = await Party.findOne({
        code: { $regex: `^${escapeRegex(input.code)}$`, $options: "i" },
      })
        .session(session)
        .lean();
      if (duplicate) throw duplicateError("Mã nhà cung cấp đã tồn tại");
      const created = await new Party({
        code: input.code,
        name: input.name,
        kind: "SUPPLIER",
        ...(input.phone != null && { phone: input.phone }),
        ...(input.email != null && { email: input.email }),
        ...(input.address != null && { address: input.address }),
        ...(input.taxCode != null && { taxCode: input.taxCode }),
        ...(input.contactPerson != null && {
          contactPerson: input.contactPerson,
        }),
        ...(input.notes != null && { notes: input.notes }),
        cooperationStatus: "ACTIVE",
        isActive: true,
        version: 1,
      }).save({ session });
      await appendAudit({
        actorId: user._id,
        action: "CREATE_SUPPLIER",
        entityType: "SUPPLIER",
        entityId: created._id,
        details: {
          code: created.code,
          name: created.name,
          cooperationStatus: created.cooperationStatus,
        },
        session,
      });
      return created.toObject();
    }, transactionOptions);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw duplicateError("Mã nhà cung cấp đã tồn tại");
    }
    throw error;
  } finally {
    await session.endSession();
  }
  return mapSupplierDetail(supplier);
}

export async function updateSupplier(user, id, input) {
  requireSupplierEditor(user);
  const session = await mongoose.startSession();
  let updated;
  try {
    updated = await session.withTransaction(async () => {
      const current = await findSupplier(id, session);
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      const set = { name: input.name };
      const unset = {};
      for (const field of editableFields.filter((field) => field !== "name")) {
        if (input[field] != null) set[field] = input[field];
        else unset[field] = "";
      }
      const update = { $set: set, $inc: { version: 1 } };
      if (Object.keys(unset).length) update.$unset = unset;
      const next = await Party.findOneAndUpdate(
        { _id: id, kind: "SUPPLIER", version: input.expectedVersion },
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
        action: "UPDATE_SUPPLIER",
        entityType: "SUPPLIER",
        entityId: next._id,
        changes: changedFields(current, next, editableFields),
        session,
      });
      return next;
    }, transactionOptions);
  } finally {
    await session.endSession();
  }
  return mapSupplierDetail(updated);
}

export async function changeSupplierStatus(user, id, input) {
  requireSupplierStatusEditor(user);
  const session = await mongoose.startSession();
  let updated;
  try {
    updated = await session.withTransaction(async () => {
      const current = await findSupplier(id, session);
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      if (supplierStatus(current) === input.cooperationStatus) return current;
      const isActive = input.cooperationStatus === "ACTIVE";
      const next = await Party.findOneAndUpdate(
        { _id: id, kind: "SUPPLIER", version: input.expectedVersion },
        {
          $set: {
            cooperationStatus: input.cooperationStatus,
            isActive,
            statusReason: input.reason,
          },
          $inc: { version: 1 },
        },
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
        action: "CHANGE_SUPPLIER_STATUS",
        entityType: "SUPPLIER",
        entityId: next._id,
        changes: [
          {
            path: "cooperationStatus",
            before: supplierStatus(current),
            after: next.cooperationStatus,
          },
          {
            path: "isActive",
            before: current.isActive,
            after: next.isActive,
          },
        ],
        details: { reason: input.reason },
        session,
      });
      return next;
    }, transactionOptions);
  } finally {
    await session.endSession();
  }
  return mapSupplierDetail(updated);
}

export async function getSupplierHistory(user, id, query) {
  requireSupplierReader(user);
  await findSupplier(id);
  const filter = { entityType: "SUPPLIER", entityId: id };
  const [events, total] = await Promise.all([
    AuditEvent.find(filter)
      .sort({ eventAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    AuditEvent.countDocuments(filter),
  ]);
  return {
    items: events.map((event) => ({
      id: idString(event._id),
      action: event.action,
      actorId: idString(event.actorId),
      eventAt: isoDate(event.eventAt),
      changes: (event.changes || []).map((change) => ({
        path: change.path,
        before: change.before ?? null,
        after: change.after ?? null,
      })),
      details: event.details ?? null,
    })),
    total,
    page: query.page,
    limit: query.limit,
  };
}

async function supplierDocumentIdsForGr(supplierId, scope) {
  const grDocuments = await BusinessDocument.find({
    documentKind: "GR_PURCHASE",
    ...scope,
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  if (!grDocuments.length) return { documents: [], total: 0 };
  const matched = [];
  const directPos = await BusinessDocument.find({
    _id: {
      $in: grDocuments.map((d) => d.header.purchaseOrderId).filter(Boolean),
    },
    documentKind: "PO",
  }).lean();
  const poById = new Map(directPos.map((d) => [idString(d._id), d]));
  const inspections = await BusinessDocument.find({
    _id: {
      $in: grDocuments.map((d) => d.header.poInspectionId).filter(Boolean),
    },
    documentKind: "PO_INSPECTION",
    workflowStatus: "CONFIRMED",
  }).lean();
  const inspectionById = new Map(inspections.map((d) => [idString(d._id), d]));
  for (const document of grDocuments) {
    if (document.header.purchaseOrderId) {
      const po = poById.get(idString(document.header.purchaseOrderId));
      const inspection = inspectionById.get(
        idString(document.header.poInspectionId),
      );
      if (
        po &&
        inspection &&
        idString(po.header.supplierId) === idString(supplierId) &&
        idString(document.header.supplierId) === idString(supplierId) &&
        idString(inspection.header.supplierId) === idString(supplierId) &&
        idString(po.header.warehouseId) ===
          idString(document.header.warehouseId) &&
        idString(inspection.header.purchaseOrderId) === idString(po._id) &&
        idString(inspection.header.warehouseId) ===
          idString(po.header.warehouseId)
      )
        matched.push(document);
      continue;
    }
  }
  return { documents: matched, total: matched.length };
}

export async function getSupplierDocuments(user, id, query) {
  requireSupplierReader(user);
  await findSupplier(id);
  const permission = documentPermissions[query.kind];
  if (!hasPermission(user, permission)) {
    throw new ApiError(403, "Bạn không có quyền xem loại chứng từ này");
  }
  const scope = warehouseScope(user);
  let documents;
  let total;
  if (query.kind === "GR_PURCHASE") {
    const result = await supplierDocumentIdsForGr(id, scope);
    total = result.total;
    documents = result.documents.slice(
      (query.page - 1) * query.limit,
      query.page * query.limit,
    );
  } else {
    const filter = {
      documentKind: query.kind,
      ...supplierFilter(id),
      ...scope,
    };
    [documents, total] = await Promise.all([
      BusinessDocument.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      BusinessDocument.countDocuments(filter),
    ]);
  }
  const warehouses = new Map(
    (
      await Warehouse.find({
        _id: {
          $in: documents
            .map((document) => document.header?.warehouseId)
            .filter(Boolean),
        },
      })
        .select("_id code name")
        .lean()
    ).map((warehouse) => [idString(warehouse._id), warehouse]),
  );
  return {
    items: documents.map((document) =>
      mapSupplierDocument(
        document,
        warehouses.get(idString(document.header?.warehouseId)),
      ),
    ),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export const getSupplierNames = async () => {
  const suppliers = await Party.find({ kind: "SUPPLIER" })
    .select("_id name")
    .lean();
  return suppliers;
};
