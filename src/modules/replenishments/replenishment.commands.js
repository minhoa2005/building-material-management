import mongoose from "mongoose";
import {
  Approval,
  BusinessDocument,
  BusinessOperation,
  DocumentLine,
  Product,
  ProductUomVersion,
  ReplenishmentSubmission,
  Uom,
  Warehouse,
} from "../../models/index.js";
import { ExactDecimal } from "../../models/model-utils.js";
import {
  ApiError,
  ERROR_CODES,
  notFoundError,
  operationConflict,
  scopeError,
  validationError,
  versionConflict,
} from "../../shared/utils/ApiError.js";
import {
  calendarDateToInstant,
  idString,
  isPastCalendarDate,
  multiplyBaseQuantity,
  RR_APPROVAL_KIND,
  saigonDateOnly,
  sha256Json,
  sha256Text,
  TRIGGER_TYPE,
} from "../../shared/utils/domain.js";
import {
  canAccessWarehouse,
  hasPermission,
  isOwner,
  requirePermission,
} from "../../shared/utils/access.js";
import { appendAudit } from "../../shared/utils/audit.js";

const APPROVAL_KIND = RR_APPROVAL_KIND;
const ReplenishmentLine =
  DocumentLine.discriminators?.DocumentLine_REPLENISHMENT ?? DocumentLine;
const EDITABLE_STATUSES = ["DRAFT", "REVISION_REQUIRED"];
const transactionOptions = {
  readConcern: { level: "snapshot" },
  writeConcern: { w: "majority" },
};

const requireCreator = (user) =>
  requirePermission(user, "replenishment_request:create", [
    "WAREHOUSE",
    "SALES",
  ]);
const requireUpdater = (user) =>
  requirePermission(user, "replenishment_request:update", [
    "WAREHOUSE",
    "SALES",
  ]);
const requireApprover = (user) =>
  requirePermission(user, "replenishment_request:approve", ["OWNER"]);
const requireReader = (user) =>
  requirePermission(user, "replenishment_request:read", [
    "OWNER",
    "ACCOUNTANT",
    "WAREHOUSE",
    "SALES",
  ]);

function withSession(query, session) {
  return session ? query.session(session) : query;
}

function stateError(message) {
  return new ApiError(409, message, { code: ERROR_CODES.RR_STATE });
}

function selfApprovalError() {
  return new ApiError(403, "Người đề xuất không được tự duyệt yêu cầu", {
    code: ERROR_CODES.RR_SELF_APPROVAL,
  });
}

function conversionChangedError() {
  return new ApiError(
    409,
    "Quy đổi đã thay đổi, vui lòng chọn lại trước khi gửi",
    { code: ERROR_CODES.RR_CONVERSION_CHANGED },
  );
}

function manualSourceError() {
  return new ApiError(409, "Yêu cầu có nguồn không thuộc phạm vi thao tác thủ công", {
    code: ERROR_CODES.RR_SOURCE_READ_ONLY,
  });
}

function reviewQuantityError(message) {
  return new ApiError(400, message, {
    code: ERROR_CODES.RR_REVIEW_QUANTITY,
  });
}

function operationKeyHash(user, rawKey) {
  return sha256Text(`rr-operation:${idString(user._id)}:${rawKey}`);
}

function creationOperationKey(user, creationKey) {
  return sha256Text(
    `rr-create:${idString(user._id)}:${creationKey}`,
  );
}

function commandResult(operation, replayed) {
  return {
    id: idString(operation.documentId),
    version: operation.documentVersion,
    workflowStatus: operation.result?.workflowStatus ?? null,
    operationId: idString(operation._id),
    approvalId: idString(operation.result?.approvalId),
    replayed,
  };
}

async function findOperation(key, session = null) {
  return withSession(
    BusinessOperation.findOne({ idempotencyKey: key }).lean(),
    session,
  );
}

function assertReplay(operation, { user, operationName, documentId, hash }) {
  if (
    !operation ||
    idString(operation.performedBy) !== idString(user._id) ||
    operation.operation !== operationName ||
    idString(operation.documentId) !== idString(documentId) ||
    operation.payloadHash !== hash
  ) {
    throw operationConflict();
  }
  return commandResult(operation, true);
}

async function usableWarehouse(warehouseId, user, session, { requireActive = true } = {}) {
  const warehouse = await withSession(
    Warehouse.findById(warehouseId).lean(),
    session,
  );
  if (!warehouse) throw validationError("Kho không tồn tại");
  if (!canAccessWarehouse(user, warehouse._id)) throw scopeError();
  if (requireActive && !warehouse.isActive) {
    throw stateError("Kho đã ngừng hoạt động");
  }
  return warehouse;
}

async function ownedDocument(user, id, session) {
  const document = await withSession(
    BusinessDocument.findOne({
      _id: id,
      documentKind: "REPLENISHMENT",
      createdBy: user._id,
    }).lean(),
    session,
  );
  if (!document) throw notFoundError("Không tìm thấy yêu cầu bổ sung hàng");
  if (!canAccessWarehouse(user, document.header.warehouseId)) {
    throw scopeError();
  }
  return document;
}

async function prepareLines(rawLines, session) {
  const now = new Date();
  const productIds = [
    ...new Set(rawLines.map((line) => idString(line.productId))),
  ];
  const products = await withSession(
    Product.find({ _id: { $in: productIds } }).lean(),
    session,
  );
  const productById = new Map(
    products.map((product) => [idString(product._id), product]),
  );
  const conversionIds = [
    ...new Set(rawLines.map((line) => idString(line.conversionId))),
  ];
  const conversions = await withSession(
    ProductUomVersion.find({ _id: { $in: conversionIds } }).lean(),
    session,
  );
  const conversionById = new Map(
    conversions.map((conversion) => [idString(conversion._id), conversion]),
  );
  const currentConversions = await withSession(
    ProductUomVersion.find({
      productId: { $in: productIds },
      validFrom: { $lte: now },
    })
      .sort({ validFrom: -1, version: -1 })
      .lean(),
    session,
  );
  const currentByProductUom = new Map();
  for (const conversion of currentConversions) {
    const key = `${idString(conversion.productId)}:${idString(conversion.uomId)}`;
    if (!currentByProductUom.has(key)) currentByProductUom.set(key, conversion);
  }
  const uomIds = [
    ...new Set([
      ...products.map((product) => idString(product.baseUomId)),
      ...conversions.map((conversion) => idString(conversion.uomId)),
    ]),
  ];
  const uoms = await withSession(
    Uom.find({ _id: { $in: uomIds } }).lean(),
    session,
  );
  const uomById = new Map(uoms.map((uom) => [idString(uom._id), uom]));
  const prepared = [];
  const duplicateKeys = new Set();
  for (const [index, raw] of rawLines.entries()) {
    const product = productById.get(idString(raw.productId));
    if (!product || !product.isActive) {
      throw validationError(
        `Dòng ${index + 1}: sản phẩm không tồn tại hoặc đã ngừng hoạt động`,
      );
    }
    const conversion = conversionById.get(idString(raw.conversionId));
    if (
      !conversion ||
      idString(conversion.productId) !== idString(product._id) ||
      !conversion.validFrom ||
      new Date(conversion.validFrom).getTime() > now.getTime()
    ) {
      throw conversionChangedError();
    }
    const current = currentByProductUom.get(
      `${idString(product._id)}:${idString(conversion.uomId)}`,
    );
    if (!current || idString(current._id) !== idString(conversion._id)) {
      throw conversionChangedError();
    }
    const uom = uomById.get(idString(conversion.uomId));
    const baseUom = uomById.get(idString(product.baseUomId));
    if (!uom || !baseUom) {
      throw validationError(`Dòng ${index + 1}: đơn vị tính không tồn tại`);
    }
    const quantity = multiplyBaseQuantity(
      raw.enteredQty,
      conversion.basePerUnit.toString(),
    );
    if (
      !quantity.valid ||
      (product.wholeBaseUnits && !quantity.value.isInteger())
    ) {
      throw validationError(
        `Dòng ${index + 1}: số lượng quy đổi không hợp lệ hoặc không nguyên`,
      );
    }
    const duplicateKey = `${idString(product._id)}:${idString(uom._id)}:${raw.reasonNote}`;
    if (duplicateKeys.has(duplicateKey)) {
      throw validationError(
        "Không được lặp cùng sản phẩm, đơn vị và lý do trong một yêu cầu",
      );
    }
    duplicateKeys.add(duplicateKey);
    prepared.push({
      product,
      conversion,
      uom,
      baseUom,
      enteredQty: raw.enteredQty,
      conversionSnapshot: conversion.basePerUnit.toString(),
      qtyBase: quantity.string,
      reasonNote: raw.reasonNote,
      productNameSnapshot: product.name,
    });
  }
  return prepared;
}

function lineDocument(preparedLine, lineNo) {
  return {
    lineNo,
    lineKind: "REPLENISHMENT",
    productId: preparedLine.product._id,
    conversionId: preparedLine.conversion._id,
    enteredQty: preparedLine.enteredQty,
    conversionSnapshot: preparedLine.conversionSnapshot,
    qtyBase: preparedLine.qtyBase,
    productNameSnapshot: preparedLine.productNameSnapshot,
    details: {
      triggerType: TRIGGER_TYPE,
      reasonNote: preparedLine.reasonNote,
    },
  };
}

async function writeSubmission({
  document,
  version,
  prepared,
  lineDocuments,
  warehouse,
  submittedBy,
  submittedAt,
  session,
}) {
  await new ReplenishmentSubmission({
    documentId: document._id,
    documentVersion: version,
    submittedBy,
    submittedAt,
    warehouseId: document.header.warehouseId,
    warehouseCodeSnapshot: warehouse.code,
    warehouseNameSnapshot: warehouse.name,
    neededOn: document.header.neededOn,
    triggerReason: document.header.triggerReason,
    note: document.note ?? null,
    lines: prepared.map((preparedLine, index) => {
      const line = lineDocuments[index];
      return {
        lineId: line._id,
        lineNo: line.lineNo,
        productId: preparedLine.product._id,
        productSkuSnapshot: preparedLine.product.sku,
        productNameSnapshot: preparedLine.productNameSnapshot,
        baseUomId: preparedLine.product.baseUomId,
        baseUomCodeSnapshot: preparedLine.baseUom.code,
        enteredUomId: preparedLine.uom._id,
        enteredUomCodeSnapshot: preparedLine.uom.code,
        conversionId: preparedLine.conversion._id,
        conversionVersion: preparedLine.conversion.version,
        enteredQty: preparedLine.enteredQty,
        conversionSnapshot: preparedLine.conversionSnapshot,
        qtyBase: preparedLine.qtyBase,
        triggerType: TRIGGER_TYPE,
        reasonNote: preparedLine.reasonNote,
      };
    }),
  }).save({ session });
}

function canonicalLines(lines) {
  return lines.map((line) => ({
    id: line.id ? idString(line.id) : null,
    productId: idString(line.productId),
    conversionId: idString(line.conversionId),
    enteredQty: line.enteredQty,
    reasonNote: line.reasonNote,
  }));
}

function creationPayload(user, input) {
  return {
    action: input.action,
    actorId: idString(user._id),
    creationKey: input.creationKey,
    warehouseId: idString(input.warehouseId),
    neededOn: input.neededOn,
    triggerReason: input.triggerReason,
    note: input.note ?? null,
    lines: canonicalLines(input.lines),
  };
}

function updatePayload(user, id, input) {
  return {
    action: "UPDATE_REPLENISHMENT",
    actorId: idString(user._id),
    targetId: idString(id),
    expectedVersion: input.expectedVersion,
    warehouseId: idString(input.warehouseId),
    neededOn: input.neededOn,
    triggerReason: input.triggerReason,
    note: input.note ?? null,
    lines: canonicalLines(input.lines),
  };
}

function submitPayload(user, id, input) {
  return {
    action: "SUBMIT_REPLENISHMENT",
    actorId: idString(user._id),
    targetId: idString(id),
    expectedVersion: input.expectedVersion,
  };
}

function reviewPayload(user, id, input) {
  return {
    action: "REVIEW_REPLENISHMENT",
    actorId: idString(user._id),
    targetId: idString(id),
    expectedVersion: input.expectedVersion,
    decision: input.decision,
    reason: input.reason?.trim() || null,
    lines: [...input.lines]
      .map((line) => ({
        lineId: idString(line.lineId),
        approvedQtyBase: line.approvedQtyBase,
        reason: line.reason?.trim() || null,
      })),
  };
}

async function replayCreated(user, creationKey, hash) {
  const key = creationOperationKey(user, creationKey);
  const document = await BusinessDocument.findOne({
    documentKind: "REPLENISHMENT",
    createdBy: user._id,
    "header.creationKey": creationKey,
  }).lean();
  if (!document) return null;
  if (!canAccessWarehouse(user, document.header.warehouseId)) throw scopeError();
  const operation = await findOperation(key);
  if (!operation) return null;
  if (
    !["CREATE_REPLENISHMENT", "SUBMIT_REPLENISHMENT"].includes(
      operation.operation,
    )
  ) {
    throw operationConflict();
  }
  return assertReplay(operation, {
    user,
    operationName: operation.operation,
    documentId: document._id,
    hash,
  });
}

async function replayCommand(user, key, operationName, documentId, hash) {
  const operation = await findOperation(key);
  if (!operation) return null;
  return assertReplay(operation, {
    user,
    operationName,
    documentId,
    hash,
  });
}

function isUnknownCommit(error) {
  return error?.hasErrorLabel?.("UnknownTransactionCommitResult");
}

export async function createReplenishment(user, input) {
  requireCreator(user);
  const hash = sha256Json(creationPayload(user, input));
  const operationKey = creationOperationKey(user, input.creationKey);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const existing = await withSession(
        BusinessDocument.findOne({
          documentKind: "REPLENISHMENT",
          createdBy: user._id,
          "header.creationKey": input.creationKey,
        }).lean(),
        session,
      );
      if (existing) {
        if (!canAccessWarehouse(user, existing.header.warehouseId)) throw scopeError();
        const operation = await findOperation(operationKey, session);
        if (!operation) throw operationConflict();
        if (
          !["CREATE_REPLENISHMENT", "SUBMIT_REPLENISHMENT"].includes(
            operation.operation,
          )
        ) {
          throw operationConflict();
        }
        return assertReplay(operation, {
          user,
          operationName: operation.operation,
          documentId: existing._id,
          hash,
        });
      }
      const warehouse = await usableWarehouse(
        input.warehouseId,
        user,
        session,
      );
      if (input.action === "SUBMIT" && isPastCalendarDate(input.neededOn)) {
        throw validationError("Ngày cần không được trước ngày hiện tại khi gửi");
      }
      const prepared = await prepareLines(input.lines, session);
      const now = new Date();
      const status = input.action === "SUBMIT" ? "SUBMITTED" : "DRAFT";
      const documentId = new mongoose.Types.ObjectId();
      const document = new BusinessDocument({
        _id: documentId,
        documentNo: `RR-${String(documentId).toUpperCase()}`,
        documentKind: "REPLENISHMENT",
        workflowStatus: status,
        version: 1,
        createdBy: user._id,
        note: input.note ?? undefined,
        header: {
          warehouseId: warehouse._id,
          neededOn: calendarDateToInstant(input.neededOn),
          triggerReason: input.triggerReason,
          creationKey: input.creationKey,
          ...(status === "SUBMITTED" && {
            submittedBy: user._id,
            submittedAt: now,
          }),
        },
      });
      await document.save({ session });
      const lineDocuments = [];
      for (const [index, preparedLine] of prepared.entries()) {
        const line = new DocumentLine({
          ...lineDocument(preparedLine, index + 1),
          documentId,
        });
        await line.save({ session });
        lineDocuments.push(line);
      }
      if (status === "SUBMITTED") {
        await writeSubmission({
          document,
          version: 1,
          prepared,
          lineDocuments,
          warehouse,
          submittedBy: user._id,
          submittedAt: now,
          session,
        });
      }
      const operationName =
        input.action === "SUBMIT"
          ? "SUBMIT_REPLENISHMENT"
          : "CREATE_REPLENISHMENT";
      const operation = await new BusinessOperation({
        documentId,
        operation: operationName,
        operationKey,
        idempotencyKey: operationKey,
        payloadHash: hash,
        documentVersion: 1,
        performedBy: user._id,
        result: { workflowStatus: status, approvalId: null },
      }).save({ session });
      await appendAudit({
        documentId,
        actorId: user._id,
        action: operationName,
        details: {
          operationId: idString(operation._id),
          workflowStatus: status,
          lineCount: lineDocuments.length,
          warehouseId: idString(warehouse._id),
        },
        session,
      });
      return commandResult(operation, false);
    }, transactionOptions);
  } catch (error) {
    if (error?.code === 11000 || isUnknownCommit(error)) {
      const replay = await replayCreated(user, input.creationKey, hash);
      if (replay) return replay;
      throw error?.code === 11000
        ? operationConflict("Creation key đã được sử dụng bởi một yêu cầu khác")
        : operationConflict("Không thể xác nhận kết quả thao tác");
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function updateReplenishment(user, id, input) {
  requireUpdater(user);
  const key = operationKeyHash(user, input.operationKey);
  const hash = sha256Json(updatePayload(user, id, input));
  const operationName = "UPDATE_REPLENISHMENT";
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const current = await ownedDocument(user, id, session);
      const existingOperation = await findOperation(key, session);
      if (existingOperation) {
        return assertReplay(existingOperation, {
          user,
          operationName,
          documentId: current._id,
          hash,
        });
      }
      if (!EDITABLE_STATUSES.includes(current.workflowStatus)) {
        throw stateError("Trạng thái yêu cầu không cho phép sửa");
      }
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      await usableWarehouse(current.header.warehouseId, user, session);
      const warehouse = await usableWarehouse(
        input.warehouseId,
        user,
        session,
      );
      const allLines = await withSession(
        DocumentLine.find({
          documentId: current._id,
          lineKind: "REPLENISHMENT",
        })
          .sort({ lineNo: 1 })
          .lean(),
        session,
      );
      const currentLines = allLines.filter(
        (line) => line.details?.removedAt == null,
      );
      if (
        currentLines.some(
          (line) => line.details?.triggerType !== TRIGGER_TYPE,
        )
      ) {
        throw manualSourceError();
      }
      const lineById = new Map(
        currentLines.map((line) => [idString(line._id), line]),
      );
      const incomingIds = new Set();
      for (const line of input.lines) {
        if (!line.id) continue;
        const lineId = idString(line.id);
        if (incomingIds.has(lineId)) {
          throw validationError("Một dòng không được xuất hiện hai lần");
        }
        incomingIds.add(lineId);
        const existing = lineById.get(lineId);
        if (!existing) {
          throw validationError(
            "Dòng cần sửa không còn hiện hành hoặc không thuộc yêu cầu",
          );
        }
        if (idString(existing.productId) !== idString(line.productId)) {
          throw validationError(
            "Không đổi sản phẩm trên dòng cũ; hãy bỏ dòng và thêm dòng mới",
          );
        }
      }
      const prepared = await prepareLines(input.lines, session);
      const now = new Date();
      const updated = await BusinessDocument.findOneAndUpdate(
        {
          _id: current._id,
          documentKind: "REPLENISHMENT",
          createdBy: user._id,
          workflowStatus: { $in: EDITABLE_STATUSES },
          version: input.expectedVersion,
        },
        {
          $set: {
            "header.warehouseId": warehouse._id,
            "header.neededOn": calendarDateToInstant(input.neededOn),
            "header.triggerReason": input.triggerReason,
            note: input.note ?? null,
          },
          $inc: { version: 1 },
        },
        { returnDocument: "after", runValidators: true, session },
      ).lean();
      if (!updated) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      let added = 0;
      let removed = 0;
      let edited = 0;
      let nextLineNo =
        allLines.reduce((max, line) => Math.max(max, line.lineNo), 0) + 1;
      for (const [index, lineInput] of input.lines.entries()) {
        const preparedLine = prepared[index];
        if (lineInput.id) {
          const existing = lineById.get(idString(lineInput.id));
          const result = await ReplenishmentLine.updateOne(
            { _id: existing._id, documentId: current._id },
            {
              $set: {
                conversionId: preparedLine.conversion._id,
                enteredQty: preparedLine.enteredQty,
                conversionSnapshot: preparedLine.conversionSnapshot,
                qtyBase: preparedLine.qtyBase,
                productNameSnapshot: preparedLine.productNameSnapshot,
                "details.triggerType": TRIGGER_TYPE,
                "details.reasonNote": preparedLine.reasonNote,
              },
            },
            { session, runValidators: true },
          );
          if (result.matchedCount !== 1) {
            throw stateError("Dòng yêu cầu vừa thay đổi, vui lòng tải lại");
          }
          edited += 1;
        } else {
          await new DocumentLine({
            ...lineDocument(preparedLine, nextLineNo),
            documentId: current._id,
          }).save({ session });
          nextLineNo += 1;
          added += 1;
        }
      }
      for (const line of currentLines) {
        if (incomingIds.has(idString(line._id))) continue;
        const result = await ReplenishmentLine.updateOne(
          {
            _id: line._id,
            documentId: current._id,
            "details.removedAt": null,
          },
          { $set: { "details.removedAt": now } },
          { session, runValidators: true },
        );
        if (result.matchedCount === 1) removed += 1;
      }
      const operation = await new BusinessOperation({
        documentId: current._id,
        operation: operationName,
        operationKey: key,
        idempotencyKey: key,
        payloadHash: hash,
        documentVersion: updated.version,
        performedBy: user._id,
        result: {
          workflowStatus: updated.workflowStatus,
          approvalId: null,
        },
      }).save({ session });
      await appendAudit({
        documentId: current._id,
        actorId: user._id,
        action: operationName,
        details: {
          operationId: idString(operation._id),
          version: updated.version,
          added,
          edited,
          removed,
          warehouseId: idString(warehouse._id),
        },
        session,
      });
      return commandResult(operation, false);
    }, transactionOptions);
  } catch (error) {
    if (error?.code === 11000 || isUnknownCommit(error)) {
      const replay = await replayCommand(user, key, operationName, id, hash);
      if (replay) return replay;
      throw stateError("Thao tác đã được xử lý bởi một yêu cầu khác");
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function submitReplenishment(user, id, input) {
  requireUpdater(user);
  const key = operationKeyHash(user, input.operationKey);
  const hash = sha256Json(submitPayload(user, id, input));
  const operationName = "SUBMIT_REPLENISHMENT";
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const current = await ownedDocument(user, id, session);
      const existingOperation = await findOperation(key, session);
      if (existingOperation) {
        return assertReplay(existingOperation, {
          user,
          operationName,
          documentId: current._id,
          hash,
        });
      }
      if (!EDITABLE_STATUSES.includes(current.workflowStatus)) {
        throw stateError("Chỉ nháp hoặc phiếu bị trả lại mới được gửi");
      }
      if (current.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      const warehouse = await usableWarehouse(
        current.header.warehouseId,
        user,
        session,
      );
      if (isPastCalendarDate(saigonDateOnly(current.header.neededOn))) {
        throw validationError("Ngày cần không được trước ngày hiện tại khi gửi");
      }
      const lineDocuments = await withSession(
        DocumentLine.find({
          documentId: current._id,
          lineKind: "REPLENISHMENT",
          "details.removedAt": null,
        })
          .sort({ lineNo: 1 })
          .lean(),
        session,
      );
      if (!lineDocuments.length) {
        throw stateError("Yêu cầu không còn dòng hiện hành để gửi");
      }
      if (lineDocuments.length > 100) {
        throw validationError("Yêu cầu gửi tối đa 100 dòng hiện hành");
      }
      if (
        lineDocuments.some(
          (line) =>
            line.details?.triggerType !== TRIGGER_TYPE ||
            !line.details?.reasonNote?.trim(),
        )
      ) {
        throw lineDocuments.some(
          (line) => line.details?.triggerType !== TRIGGER_TYPE,
        )
          ? manualSourceError()
          : validationError("Mỗi dòng phải có lý do riêng trước khi gửi");
      }
      const rawLines = lineDocuments.map((line) => ({
        productId: line.productId,
        conversionId: line.conversionId,
        enteredQty: line.enteredQty.toString(),
        reasonNote: line.details.reasonNote,
      }));
      const prepared = await prepareLines(rawLines, session);
      const now = new Date();
      const updated = await BusinessDocument.findOneAndUpdate(
        {
          _id: current._id,
          documentKind: "REPLENISHMENT",
          createdBy: user._id,
          workflowStatus: { $in: EDITABLE_STATUSES },
          version: input.expectedVersion,
        },
        {
          $set: {
            workflowStatus: "SUBMITTED",
            "header.submittedBy": user._id,
            "header.submittedAt": now,
          },
          $inc: { version: 1 },
        },
        { returnDocument: "after", runValidators: true, session },
      ).lean();
      if (!updated) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          current.version,
        );
      }
      await writeSubmission({
        document: updated,
        version: updated.version,
        prepared,
        lineDocuments,
        warehouse,
        submittedBy: user._id,
        submittedAt: now,
        session,
      });
      const operation = await new BusinessOperation({
        documentId: current._id,
        operation: operationName,
        operationKey: key,
        idempotencyKey: key,
        payloadHash: hash,
        documentVersion: updated.version,
        performedBy: user._id,
        result: { workflowStatus: "SUBMITTED", approvalId: null },
      }).save({ session });
      await appendAudit({
        documentId: current._id,
        actorId: user._id,
        action: operationName,
        details: {
          operationId: idString(operation._id),
          version: updated.version,
          submittedAt: now.toISOString(),
          lineCount: lineDocuments.length,
        },
        session,
      });
      return commandResult(operation, false);
    }, transactionOptions);
  } catch (error) {
    if (error?.code === 11000 || isUnknownCommit(error)) {
      const replay = await replayCommand(user, key, operationName, id, hash);
      if (replay) return replay;
      throw stateError("Yêu cầu đã được xử lý bởi một thao tác khác");
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

async function appendApproval({
  document,
  snapshot,
  user,
  input,
  now,
  session,
}) {
  if (idString(document.createdBy) === idString(user._id)) {
    throw selfApprovalError();
  }
  if (
    snapshot.submittedBy &&
    idString(snapshot.submittedBy) === idString(user._id)
  ) {
    throw selfApprovalError();
  }
  if (!snapshot.submittedBy) {
    throw stateError("Lần gửi hiện tại thiếu người gửi");
  }
  let decision = input.decision;
  let status;
  let lines = [];
  const generalReason = input.reason?.trim() || null;
  if (decision === "APPROVE") {
    if (!input.lines.length) {
      throw reviewQuantityError("Duyệt yêu cầu phải gửi lượng duyệt từng dòng");
    }
    const snapshotById = new Map(
      snapshot.lines.map((line) => [idString(line.lineId), line]),
    );
    const submittedById = new Map();
    for (const line of input.lines) {
      const lineId = idString(line.lineId);
      if (submittedById.has(lineId)) {
        throw reviewQuantityError("Dòng duyệt bị lặp");
      }
      const requested = snapshotById.get(lineId);
      if (!requested) {
        throw reviewQuantityError("Dòng duyệt không thuộc lần gửi hiện tại");
      }
      submittedById.set(lineId, line);
    }
    if (submittedById.size !== snapshot.lines.length) {
      throw reviewQuantityError("Phải duyệt đủ toàn bộ dòng đã gửi");
    }
    const productIds = [
      ...new Set(snapshot.lines.map((line) => idString(line.productId))),
    ];
    const products = await withSession(
      Product.find({ _id: { $in: productIds } }).lean(),
      session,
    );
    const productById = new Map(
      products.map((product) => [idString(product._id), product]),
    );
    let positive = 0;
    for (const requested of snapshot.lines) {
      const product = productById.get(idString(requested.productId));
      if (!product) {
        throw stateError("Sản phẩm của lần gửi không còn tồn tại để duyệt");
      }
      const payload = submittedById.get(idString(requested.lineId));
      const approved = new ExactDecimal(payload.approvedQtyBase);
      const requestedQty = new ExactDecimal(requested.qtyBase.toString());
      if (
        approved.isNegative() ||
        approved.gt(requestedQty) ||
        (product.wholeBaseUnits && !approved.isInteger())
      ) {
        throw reviewQuantityError(
          "Lượng duyệt phải nằm trong khoảng đề nghị và đúng độ hạt",
        );
      }
      if (approved.gt(0)) positive += 1;
      const lineReason = payload.reason?.trim() || null;
      if (approved.lt(requestedQty) && !lineReason) {
        throw reviewQuantityError(
          "Dòng bị giảm hoặc bằng 0 phải có lý do riêng",
        );
      }
      lines.push({
        lineId: requested.lineId,
        approvedQty: approved.toString(),
        outcome: approved.lte(0) ? "REJECT" : "APPROVE",
        ...(lineReason && { reason: lineReason }),
      });
    }
    if (!positive) {
      throw reviewQuantityError(
        "Phải duyệt dương ít nhất một dòng; dùng REJECT nếu từ chối toàn bộ",
      );
    }
    status = "APPROVED";
  } else {
    if (input.lines.length) {
      throw reviewQuantityError("Từ chối hoặc trả sửa không nhận lượng duyệt");
    }
    if (!generalReason) {
      throw validationError("Từ chối hoặc trả sửa bắt buộc có lý do chung");
    }
    status = decision === "REJECT" ? "REJECTED" : "REVISION_REQUIRED";
    decision = input.decision;
    lines = [];
  }
  const approval = await new Approval({
    documentId: document._id,
    documentVersion: document.version,
    decisionKind: APPROVAL_KIND,
    decision,
    requestedBy: snapshot.submittedBy,
    decidedBy: user._id,
    decidedAt: now,
    ...(generalReason && { reason: generalReason }),
    lines,
  }).save({ session });
  return { approval, status };
}

export async function reviewReplenishment(user, id, input) {
  requireApprover(user);
  const key = operationKeyHash(user, input.operationKey);
  const hash = sha256Json(reviewPayload(user, id, input));
  const operationName = "REVIEW_REPLENISHMENT";
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const document = await withSession(
        BusinessDocument.findOne({
          _id: id,
          documentKind: "REPLENISHMENT",
        }).lean(),
        session,
      );
      if (!document) {
        throw notFoundError("Không tìm thấy yêu cầu bổ sung hàng");
      }
      if (idString(document.createdBy) === idString(user._id)) {
        throw selfApprovalError();
      }
      const existingOperation = await findOperation(key, session);
      if (existingOperation) {
        return assertReplay(existingOperation, {
          user,
          operationName,
          documentId: document._id,
          hash,
        });
      }
      if (document.workflowStatus !== "SUBMITTED") {
        throw stateError("Chỉ yêu cầu đang chờ duyệt mới được review");
      }
      if (document.version !== input.expectedVersion) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          document.version,
        );
      }
      const snapshot = await withSession(
        ReplenishmentSubmission.findOne({
          documentId: document._id,
          documentVersion: document.version,
        }).lean(),
        session,
      );
      if (!snapshot) {
        throw stateError(
          "Không có snapshot của nội dung đã gửi; không thể review",
        );
      }
      const now = new Date();
      const { approval, status } = await appendApproval({
        document,
        snapshot,
        user,
        input,
        now,
        session,
      });
      const updated = await BusinessDocument.findOneAndUpdate(
        {
          _id: document._id,
          documentKind: "REPLENISHMENT",
          workflowStatus: "SUBMITTED",
          version: input.expectedVersion,
        },
        { $set: { workflowStatus: status } },
        { returnDocument: "after", session },
      ).lean();
      if (!updated) {
        throw versionConflict(
          "Dữ liệu đã thay đổi, vui lòng tải lại.",
          document.version,
        );
      }
      const operation = await new BusinessOperation({
        documentId: document._id,
        operation: operationName,
        operationKey: key,
        idempotencyKey: key,
        payloadHash: hash,
        documentVersion: document.version,
        performedBy: user._id,
        result: {
          workflowStatus: status,
          approvalId: approval._id,
        },
      }).save({ session });
      await appendAudit({
        documentId: document._id,
        actorId: user._id,
        action: operationName,
        details: {
          operationId: idString(operation._id),
          approvalId: idString(approval._id),
          documentVersion: document.version,
          decision: input.decision,
          workflowStatus: status,
        },
        session,
      });
      return commandResult(operation, false);
    }, transactionOptions);
  } catch (error) {
    if (error?.code === 11000 || isUnknownCommit(error)) {
      const replay = await replayCommand(user, key, operationName, id, hash);
      if (replay) return replay;
      throw stateError("Yêu cầu đã được review bởi thao tác khác");
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function getReplenishmentOptions(user, mode) {
  if (mode === "CREATE") {
    const allowed =
      hasPermission(user, "replenishment_request:create", [
        "WAREHOUSE",
        "SALES",
      ]) ||
      hasPermission(user, "replenishment_request:update", [
        "WAREHOUSE",
        "SALES",
      ]);
    if (!allowed) {
      throw new ApiError(403, "Bạn không có quyền tạo yêu cầu bổ sung hàng");
    }
    const warehouses = await Warehouse.find({
      _id: {
        $in: (user.warehouseIds || []).map(
          (warehouseId) => new mongoose.Types.ObjectId(idString(warehouseId)),
        ),
      },
      isActive: true,
    })
      .select("_id code name isActive")
      .sort({ code: 1 })
      .lean();
    return { warehouses: warehouses.map(mapWarehouse) };
  }
  requireReader(user);
  const filter = isOwner(user)
    ? {}
    : {
        _id: {
          $in: (user.warehouseIds || []).map(
            (warehouseId) => new mongoose.Types.ObjectId(idString(warehouseId)),
          ),
        },
      };
  const warehouses = await Warehouse.find(filter)
    .select("_id code name isActive")
    .sort({ code: 1 })
    .lean();
  return { warehouses: warehouses.map(mapWarehouse) };
}

function mapWarehouse(warehouse) {
  return {
    id: idString(warehouse._id),
    code: warehouse.code,
    name: warehouse.name,
    isActive: warehouse.isActive,
  };
}
