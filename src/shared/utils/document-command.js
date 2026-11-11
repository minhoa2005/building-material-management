import mongoose from "mongoose";
import { createHash } from "node:crypto";
import { OperationRecord, SystemEvent, User } from "../../models/runtime.js";
import { transaction, serialize } from "./persistence.js";
import { requirePermission, requireWarehouseAccess } from "./access.js";
import {
  operationConflict,
  versionConflict,
  notFoundError,
} from "./ApiError.js";
import { appendAudit } from "./audit.js";
import {
  guardCommandCoverage,
  completeReplenishmentGuards,
} from "./replenishment-guard.js";
import { observePlanning } from "./replenishment-observability.js";

export const same = (left, right) =>
  left != null && right != null && String(left) === String(right);
export const newId = () => new mongoose.Types.ObjectId();
export const hash = (value) =>
  createHash("sha256")
    .update(JSON.stringify(serialize(value)))
    .digest("hex");
export function checkVersion(document, expectedVersion) {
  if (document.version !== expectedVersion)
    throw versionConflict(
      "Chứng từ đã thay đổi, hãy tải lại",
      document.version,
    );
}
export async function scopedDocument(Model, id, user, session) {
  const document = await Model.findById(id).session(session);
  if (!document) throw notFoundError();
  if (document.header?.warehouseId)
    requireWarehouseAccess(user, document.header.warehouseId);
  return document;
}

export async function saveVersion(document, previousVersion, session) {
  document.version = previousVersion + 1;
  await document.validate();
  // Use the complete validated record so nested array/discriminator validators run.
  const plain = document.toObject();
  delete plain._id;
  const updated = await document.constructor.findOneAndUpdate(
    { _id: document._id, version: previousVersion },
    { $set: plain },
    { session, returnDocument: "after" },
  );
  if (!updated) throw versionConflict("Chứng từ đã thay đổi", previousVersion);
  return updated;
}

function receipt(operation, replayed) {
  return {
    id: String(operation.subjectId),
    version: operation.versionAfter,
    workflowStatus: operation.resultCode,
    operationId: String(operation._id),
    ...(operation.decisionId && { decisionId: String(operation.decisionId) }),
    resultRefs: serialize(operation.resultRefs),
    replayed,
  };
}

// The same operation key and payload returns the committed receipt. Authorization
// and record scope are checked again on replay, never copied from an old token.
export async function command(
  user,
  code,
  permission,
  targetId,
  input,
  authorizeReplay,
  work,
) {
  const started = Date.now();
  const requestKey =
    input.operationKey ?? input.creationKey ?? input.idempotencyKey;
  if (typeof requestKey !== "string" || !requestKey.trim())
    throw operationConflict("Thiếu mã thao tác");
  const requestHash = hash({
    code,
    targetId: targetId ? String(targetId) : null,
    input,
  });
  const operationKey = hash({ actor: String(user._id), code, requestKey });
  const replay = async (operation, actor, session) => {
    if (operation.requestHash !== requestHash) throw operationConflict();
    await authorizeReplay(operation.subjectId, actor, session);
    return receipt(operation, true);
  };
  for (let attempt = 0; ; attempt++)
    try {
      return await transaction(async (session) => {
        session.replenishmentGuards = undefined;
        const actor = await User.findById(user._id)
          .populate({ path: "roleId", populate: { path: "permissionIds" } })
          .session(session);
        requirePermission(actor, permission);
        const prior = await OperationRecord.findOne({ operationKey }).session(
          session,
        );
        if (prior) return replay(prior, actor, session);
        await guardCommandCoverage(targetId, input, session);
        const operationId = newId();
        const {
          document,
          versionBefore = 0,
          resultRefs = [],
          stockTransactionId,
          decisionId,
          auditChanges = [],
          reason,
        } = await work(session, actor, operationId);
        const subjectType = document.constructor.collection.name;
        const operation = await new OperationRecord({
          _id: operationId,
          actorType: "USER",
          actorId: actor._id,
          operationCode: code,
          requestKey,
          requestHash,
          operationKey,
          subjectType,
          subjectId: document._id,
          versionBefore,
          versionAfter: document.version ?? 1,
          resultCode: document.workflowStatus ?? document.status,
          completedAt: new Date(),
          resultRefs,
          stockTransactionId,
          decisionId,
        }).save({ session });
        await completeReplenishmentGuards(session, operation._id);
        await appendAudit({
          actorId: actor._id,
          action: code,
          entityType: subjectType,
          entityId: document._id,
          versionBefore,
          versionAfter: document.version ?? 1,
          operationId: operation._id,
          transactionId: stockTransactionId,
          changes: auditChanges,
          details: { reason },
          warehouseIds: document.header?.warehouseId
            ? [document.header.warehouseId]
            : document.warehouseId
              ? [document.warehouseId]
              : [],
          session,
        });
        await new SystemEvent({
          eventKey: operationKey,
          handlerCode: "BUSINESS_NOTIFICATION",
          eventType: code,
          sourceType: subjectType,
          sourceId: document._id,
          sourceVersion: document.version ?? 1,
          payload: { operationId: String(operation._id) },
          payloadVersion: 1,
          status: "PENDING",
          attempts: 0,
          occurredAt: new Date(),
        }).save({ session });
        return receipt(operation, false);
      });
    } catch (error) {
      if (error.code === "ERR-RR-409-004")
        observePlanning("coverage_conflict", {
          operationCode: code,
          durationMs: Date.now() - started,
        });
      if (
        error.code === 11000 ||
        error.hasErrorLabel?.("UnknownTransactionCommitResult")
      ) {
        const actor = await User.findById(user._id).populate({
          path: "roleId",
          populate: { path: "permissionIds" },
        });
        requirePermission(actor, permission);
        const prior = await OperationRecord.findOne({ operationKey });
        if (prior) return replay(prior, actor);
        if (
          error.code === 11000 &&
          (error.message?.includes("warehouseId_1_productId_1") ||
            error.message?.includes("document_sequences")) &&
          attempt < 3
        )
          continue;
      }
      throw error;
    }
}
