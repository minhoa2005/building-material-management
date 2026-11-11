import { nextDocumentFields } from '../../shared/utils/document-number.js';
import {
  ReplenishmentRequest,
  Warehouse,
  Product,
  PurchaseOrder,
  ApprovalHistory,
  Conversion,
  Uom,
  ProductBatch,
} from "../../models/runtime.js";
import { exact } from "../../models/model-utils.js";
import {
  requirePermission,
  requireWarehouseAccess,
  isOwner,
} from "../../shared/utils/access.js";
import { currentRole } from "../../shared/utils/userRole.js";
import {
  validationError,
  forbiddenError,
  notFoundError,
} from "../../shared/utils/ApiError.js";
import { dto, page, serialize } from "../../shared/utils/persistence.js";
import {
  command,
  scopedDocument,
  checkVersion,
  saveVersion,
  newId,
  same,
  hash,
} from "../../shared/utils/document-command.js";
import { makeItem } from "../../shared/utils/document-items.js";
import { evaluateLines, reviewRequired } from "./replenishment.evaluation.js";
import { transaction } from "../../shared/utils/persistence.js";

export async function readRequest(id, user, session) {
  const document = await scopedDocument(
    ReplenishmentRequest,
    id,
    user,
    session,
  );
  const role = currentRole(user)?.code;
  if (
    ["SALES", "WAREHOUSE"].includes(role) &&
    !same(document.createdBy, user._id)
  )
    throw notFoundError();
  return document;
}
const replay = (id, user, session) => readRequest(id, user, session);
async function header(input, user, session) {
  requireWarehouseAccess(user, input.warehouseId);
  const warehouse = await Warehouse.findOne({
    _id: input.warehouseId,
    isActive: true,
  }).session(session);
  if (!warehouse) throw validationError("Kho không hợp lệ");
  return {
    warehouseId: warehouse._id,
    neededOn: new Date(input.neededOn + "T00:00:00+07:00"),
    triggerReason: input.triggerReason,
  };
}
const snapshotNames = [
  "availableQty",
  "otherWarehouseCoverageQty",
  "remainingDemandQty",
  "reservedForDemandQty",
  "onHandCoverageQty",
  "incomingCoverageQty",
  "pendingRequestCoverageQty",
  "minimumQty",
  "targetQty",
];
function evaluatedDetails(line, evaluation) {
  return {
    triggerType: evaluation.source.triggerType,
    source: evaluation.source,
    canonicalSourceKey: evaluation.canonicalKey,
    evaluationKey: evaluation.evaluationKey,
    evaluatedAt: new Date(evaluation.evaluatedAt),
    reasonNote: line.reasonNote,
    independentNeedConfirmed: line.independentNeedConfirmed === true,
    independentNeedReason: line.independentNeedReason,
    quantityAdjustmentReason: line.quantityAdjustmentReason,
    ...(exact(evaluation.suggestedQtyBase).gt(0) && {
      suggestedQty: evaluation.suggestedQtyBase,
    }),
    ...Object.fromEntries(
      snapshotNames
        .filter((name) => evaluation[name + "Base"] != null)
        .map((name) => [name + "Snapshot", evaluation[name + "Base"]]),
    ),
  };
}
function checkAssessments(
  lines,
  evaluated,
  quantities,
  { requireAdjustmentReason = true } = {},
) {
  const totals = new Map(),
    invalid = [];
  for (const [index, line] of lines.entries()) {
    const evaluation = evaluated[index];
    if (exact(quantities[index]).isZero()) continue;
    if (evaluation.source.triggerType !== "MANUAL_OTHER") {
      const amount = exact(quantities[index]);
      if (amount.isZero()) continue;
      totals.set(
        evaluation.canonicalKey,
        (totals.get(evaluation.canonicalKey) ?? exact("0")).plus(amount),
      );
      if (
        line.evaluationKey !== evaluation.evaluationKey ||
        amount.gt(evaluation.suggestedQtyBase) ||
        (requireAdjustmentReason &&
          amount.lt(evaluation.suggestedQtyBase) &&
          !line.quantityAdjustmentReason?.trim())
      )
        invalid.push(index);
    } else if (
      evaluation.warningRequired &&
      (line.evaluationKey !== evaluation.evaluationKey ||
        line.independentNeedConfirmed !== true ||
        !line.independentNeedReason?.trim())
    )
      invalid.push(index);
  }
  for (const [index, evaluation] of evaluated.entries()) {
    if (
      totals.has(evaluation.canonicalKey) &&
      totals.get(evaluation.canonicalKey).gt(evaluation.suggestedQtyBase)
    )
      invalid.push(index);
  }
  if (invalid.length) {
    const error = reviewRequired(evaluated);
    error.details.invalidLines = [...new Set(invalid)].map((index) => ({
      lineNo: index + 1,
      message:
        "Nguồn, lượng còn thiếu hoặc xác nhận nhu cầu độc lập cần được kiểm tra lại",
    }));
    throw error;
  }
}
async function items(input, actor, session, previous = [], requestId) {
  const evaluated = await evaluateLines(
    actor,
    { ...input, requestId },
    session,
  );
  const result = [],
    seen = new Set();
  for (const [index, line] of input.lines.entries()) {
    const old = line.id
      ? previous.find((item) => same(item._id, line.id))
      : null;
    if (line.id && (!old || seen.has(line.id)))
      throw validationError("Dòng hàng không thuộc yêu cầu hoặc bị trùng");
    if (line.id) seen.add(line.id);
    if (
      old?.details?.triggerType &&
      old.details.triggerType !== "MANUAL_OTHER" &&
      old.details.canonicalSourceKey !== evaluated[index].canonicalKey
    )
      throw validationError(
        "Không đổi nguồn của dòng đã lưu; xóa dòng và chọn nguồn hợp lệ",
      );
    const value = await makeItem(line, index + 1, session, {
      previous: old,
      lineKind: "REPLENISHMENT",
    });
    const source = evaluated[index].source;
    const sources = source.documentId
      ? [
          {
            subjectCollection: source.documentType,
            documentId: source.documentId,
            ...(source.itemId && { itemId: source.itemId }),
            relationCode:
              source.triggerType === "SALES_SHORTAGE"
                ? "REPLENISHES_DEMAND"
                : "STOCKTAKE_REPLENISHMENT",
            linkedQty: value.qtyBase,
          },
        ]
      : [];
    const reasonNote = line.reasonNote ?? old?.details?.reasonNote;
    result.push({
      ...value,
      sources,
      details: evaluatedDetails({ ...line, reasonNote }, evaluated[index]),
    });
  }
  checkAssessments(
    input.lines,
    evaluated,
    result.map((row) => row.qtyBase),
  );
  return result;
}
export function savedAssessmentInput(document, overrides = []) {
  return {
    warehouseId: String(document.header.warehouseId),
    neededOn: new Date(
      new Date(document.header.neededOn).getTime() + 7 * 3600000,
    )
      .toISOString()
      .slice(0, 10),
    requestId: String(document._id),
    lines: document.items.map((item) => {
      const details = item.details?.toObject
        ? item.details.toObject()
        : (item.details ?? {});
      const override =
        overrides.find((row) => same(row.lineId, item._id)) ?? {};
      if (
        details.triggerType &&
        details.triggerType !== "MANUAL_OTHER" &&
        !details.source
      )
        throw reviewRequired(
          [],
          "Nguồn RR cũ cần được chuẩn hóa trước khi thực hiện tiếp",
        );
      return {
        id: String(item._id),
        productId: String(item.productId),
        enteredUnit: item.enteredUnit,
        enteredQty: String(item.enteredQty),
        ...(item.lotId && { lotId: String(item.lotId) }),
        source: details.source
          ? serialize(details.source)
          : { triggerType: "MANUAL_OTHER" },
        reasonNote: details.reasonNote,
        evaluationKey: override.evaluationKey ?? details.evaluationKey,
        independentNeedConfirmed:
          override.independentNeedConfirmed ?? details.independentNeedConfirmed,
        independentNeedReason:
          override.independentNeedReason ?? details.independentNeedReason,
        quantityAdjustmentReason:
          override.quantityAdjustmentReason ?? details.quantityAdjustmentReason,
      };
    }),
  };
}
export async function assessSavedRequest(
  document,
  actor,
  session,
  {
    evaluations = [],
    quantities,
    excludePurchaseOrderId,
    selectedItemIds,
    requireAdjustmentReason = true,
  } = {},
) {
  const input = savedAssessmentInput(document, evaluations);
  if (excludePurchaseOrderId)
    input.excludePurchaseOrderId = excludePurchaseOrderId;
  const evaluated = await evaluateLines(actor, input, session, {
    internal: true,
  });
  const indexes = document.items
    .map((item, index) =>
      !selectedItemIds || selectedItemIds.some((id) => same(id, item._id))
        ? index
        : -1,
    )
    .filter((index) => index >= 0);
  checkAssessments(
    indexes.map((i) => input.lines[i]),
    indexes.map((i) => evaluated[i]),
    indexes.map(
      (i) => (quantities ?? document.items.map((item) => item.qtyBase))[i],
    ),
    { requireAdjustmentReason },
  );
  document.items.forEach((item, index) => {
    item.details = evaluatedDetails(input.lines[index], evaluated[index]);
  });
  return evaluated;
}
export async function evaluateReplenishment(user, input) {
  requirePermission(
    user,
    input.requestId
      ? "replenishment_request:read"
      : "replenishment_request:create",
  );
  return transaction(async (session) => {
    if (input.requestId) await readRequest(input.requestId, user, session);
    return evaluateLines(user, input, session, {
      permission: input.requestId
        ? "replenishment_request:read"
        : "replenishment_request:create",
    });
  });
}
async function submission(document, user, session) {
  const warehouse = await Warehouse.findById(
    document.header.warehouseId,
  ).session(session);
  const snapshots = [];
  for (const item of document.items) {
    const product = await Product.findById(item.productId).session(session);
    if (!product?.isActive) throw validationError("Sản phẩm đã ngừng sử dụng");
    snapshots.push({
      lineId: item._id,
      lineNo: item.lineNo,
      productId: item.productId,
      productSkuSnapshot: product.sku,
      productNameSnapshot: item.productNameSnapshot,
      baseUomCodeSnapshot: item.baseUnitSnapshot,
      enteredUomCodeSnapshot: item.enteredUnit,
      conversionVersion: document.version,
      enteredQty: item.enteredQty,
      conversionSnapshot: item.baseUnitsPerUnit,
      evaluation: item.details.toObject
        ? item.details.toObject()
        : item.details,
      qtyBase: item.qtyBase,
      triggerType: item.details.triggerType,
      reasonNote: item.details.reasonNote,
      baseUnitSnapshot: item.baseUnitSnapshot,
      enteredUnit: item.enteredUnit,
      baseUnitsPerUnit: item.baseUnitsPerUnit,
    });
  }
  const now = new Date();
  document.header.submittedBy = user._id;
  document.header.submittedAt = now;
  document.submissions ??= [];
  document.submissions.push({
    documentVersion: document.version,
    submittedBy: user._id,
    submittedAt: now,
    warehouseId: warehouse._id,
    warehouseCodeSnapshot: warehouse.code,
    warehouseNameSnapshot: warehouse.name,
    neededOn: document.header.neededOn,
    triggerReason: document.header.triggerReason,
    note: document.note,
    lines: snapshots,
  });
  document.workflowStatus = "SUBMITTED";
}
export async function requireEditableRequest(user, requestId) {
  const document = await readRequest(requestId, user);
  if (!same(document.createdBy, user._id))
    throw forbiddenError("Chỉ người lập được sửa");
  if (!["DRAFT", "REVISION_REQUIRED"].includes(document.workflowStatus))
    throw validationError("Yêu cầu không còn được sửa");
  if (await PurchaseOrder.exists({ replenishmentRequestId: requestId }))
    throw validationError("Yêu cầu đã có đơn mua");
}

export async function getReplenishmentOptions(user, mode, requestId) {
  requirePermission(
    user,
    requestId
      ? "replenishment_request:update"
      : mode === "CREATE"
        ? "replenishment_request:create"
        : "replenishment_request:read",
  );
  if (requestId) await requireEditableRequest(user, requestId);
  const scope = isOwner(user) ? {} : { _id: { $in: user.warehouseIds || [] } };
  const [warehouses, products, units] = await Promise.all([
    Warehouse.find({ ...scope, isActive: true })
      .select("_id code name")
      .lean(),
    Product.find({ isActive: true })
      .select("_id sku name baseUnit lengthMm widthMm imageUrls")
      .lean(),
    Uom.find({ isActive: true }).select("_id code name").lean(),
  ]);
  const conversions = await Conversion.aggregate([
    {
      $match: {
        productId: { $in: products.map((product) => product._id) },
        productBatchId: null,
        uomId: { $in: units.map((unit) => unit._id) },
        validFrom: { $lte: new Date() },
      },
    },
    { $sort: { productId: -1, uomId: -1, validFrom: -1 } },
    {
      $group: {
        _id: { productId: "$productId", uomId: "$uomId" },
        basePerUnit: { $first: "$basePerUnit" },
      },
    },
  ]);
  const unitById = new Map(units.map((unit) => [String(unit._id), dto(unit)]));
  const unitByCode = new Map([...unitById.values()].map((unit) => [unit.code, unit]));
  const unitsByProduct = new Map(products.map((product) => {
    const base = unitByCode.get(product.baseUnit);
    return [String(product._id), base ? [{ ...base, basePerUnit: "1" }] : []];
  }));
  for (const { _id, basePerUnit } of conversions) {
    const productUnits = unitsByProduct.get(String(_id.productId));
    const unit = unitById.get(String(_id.uomId));
    if (unit.code !== productUnits[0]?.code) {
      productUnits.push({ ...unit, basePerUnit: exact(basePerUnit).toFixed() });
    }
  }
  return {
    warehouses: warehouses.map(dto),
    products: products.map((product) => ({
      ...dto(product),
      units: unitsByProduct.get(String(product._id)),
    })),
    sources: [],
  };
}

export async function getReplenishmentLotOptions(user, query) {
  const { productId, warehouseId, requestId } = query;
  requirePermission(
    user,
    requestId ? "replenishment_request:update" : "replenishment_request:create",
  );
  requireWarehouseAccess(user, warehouseId);
  if (requestId) await requireEditableRequest(user, requestId);
  if (!(await Warehouse.exists({ _id: warehouseId, isActive: true })))
    throw validationError("Kho không hợp lệ");
  if (!(await Product.exists({ _id: productId, isActive: true })))
    throw validationError("Sản phẩm không hợp lệ");

  const result = await page(
    ProductBatch,
    { productId, identificationStatus: "VERIFIED" },
    { ...query, sortBy: "manufacturerLot", sortOrder: "asc" },
    "manufacturerLot piecesPerCarton",
  );
  return {
    ...result,
    items: result.items.map(({ id, manufacturerLot, piecesPerCarton }) => ({
      id,
      manufacturerLot,
      piecesPerCarton,
    })),
  };
}
export function createReplenishment(user, input) {
  return command(
    user,
    "CREATE_REPLENISHMENT",
    "replenishment_request:create",
    null,
    input,
    replay,
    async (session, actor) => {
      const document = new ReplenishmentRequest({
        ...await nextDocumentFields(ReplenishmentRequest,'RR',input.warehouseId,session),
        workflowStatus: "DRAFT",
        version: 1,
        createdBy: actor._id,
        note: input.note,
        header: {
          ...(await header(input, actor, session)),
          creationKey: input.creationKey,
        },
        items: await items(input, actor, session),
      });
      if (input.action === "SUBMIT") await submission(document, actor, session);
      await document.save({ session });
      return { document };
    },
  );
}
export function updateReplenishment(user, id, input) {
  return command(
    user,
    "UPDATE_REPLENISHMENT",
    "replenishment_request:update",
    id,
    input,
    replay,
    async (session, actor) => {
      const document = await readRequest(id, actor, session);
      checkVersion(document, input.expectedVersion);
      if (!same(document.createdBy, actor._id))
        throw forbiddenError("Chỉ người lập được sửa");
      if (!["DRAFT", "REVISION_REQUIRED"].includes(document.workflowStatus))
        throw validationError("Yêu cầu không còn được sửa");
      if (
        await PurchaseOrder.exists({ replenishmentRequestId: id }).session(
          session,
        )
      )
        throw validationError("Yêu cầu đã có đơn mua");
      document.items = await items(input, actor, session, document.items, id);
      document.header.set(await header(input, actor, session));
      document.note = input.note;
      document.updatedBy = actor._id;
      return {
        document: await saveVersion(document, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
      };
    },
  );
}
export function submitReplenishment(user, id, input) {
  return command(
    user,
    "SUBMIT_REPLENISHMENT",
    "replenishment_request:update",
    id,
    input,
    replay,
    async (session, actor) => {
      const document = await readRequest(id, actor, session);
      checkVersion(document, input.expectedVersion);
      if (!same(document.createdBy, actor._id))
        throw forbiddenError("Chỉ người lập được gửi");
      if (!["DRAFT", "REVISION_REQUIRED"].includes(document.workflowStatus))
        throw validationError("Yêu cầu không thể gửi ở trạng thái hiện tại");
      await assessSavedRequest(document, actor, session, {
        evaluations: input.evaluations,
      });
      document.version = input.expectedVersion + 1;
      await submission(document, actor, session);
      return {
        document: await saveVersion(document, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
      };
    },
  );
}
export function reviewReplenishment(user, id, input) {
  return command(
    user,
    "REVIEW_REPLENISHMENT",
    "replenishment_request:approve",
    id,
    input,
    replay,
    async (session, actor) => {
      const document = await readRequest(id, actor, session);
      checkVersion(document, input.expectedVersion);
      if (same(document.createdBy, actor._id))
        throw forbiddenError("Người duyệt phải khác người lập");
      if (document.workflowStatus !== "SUBMITTED")
        throw validationError("Chỉ duyệt yêu cầu đã gửi");
      if (!input.reason?.trim())
        throw validationError("Cần ghi căn cứ quyết định");
      const seen = new Set();
      for (const decision of input.lines) {
        if (
          seen.has(decision.lineId) ||
          !document.items.some((item) => same(item._id, decision.lineId))
        )
          throw validationError("Dòng duyệt bị trùng hoặc sai nguồn");
        seen.add(decision.lineId);
      }
      if (input.decision === "APPROVE" && seen.size !== document.items.length)
        throw validationError("Phải xét tất cả dòng hàng");
      const products = await Product.find({
        _id: { $in: document.items.map((item) => item.productId) },
      }).session(session);
      let positive = false;
      const itemDecisions = document.items.map((item) => {
        const decision = input.lines.find((row) => same(row.lineId, item._id));
        const quantity =
          input.decision === "APPROVE"
            ? exact(decision.approvedQtyBase)
            : exact("0");
        const product = products.find((row) => same(row._id, item.productId));
        if (!product || (product.wholeBaseUnits && !quantity.isInteger()))
          throw validationError(
            "Lượng duyệt phải đúng đơn vị gốc của sản phẩm",
          );
        if (quantity.gt(String(item.qtyBase)))
          throw validationError("Lượng duyệt vượt lượng đề nghị");
        if (quantity.gt(0)) positive = true;
        item.approvedQtyBase = quantity.toFixed();
        return {
          itemId: item._id,
          approvedQtyBase: quantity.toFixed(),
          outcome: input.decision,
          reason: decision?.reason || input.reason,
        };
      });
      if (input.decision === "APPROVE" && !positive)
        throw validationError("Duyệt cần có lượng lớn hơn 0");
      if (input.decision === "APPROVE")
        await assessSavedRequest(document, actor, session, {
          evaluations: document.items.map((item) => ({
            lineId: String(item._id),
            quantityAdjustmentReason:
              input.lines.find((row) => same(row.lineId, item._id))?.reason ||
              input.reason,
            ...(input.evaluations?.find((row) => same(row.lineId, item._id)) ??
              {}),
          })),
          quantities: document.items.map((item) => item.approvedQtyBase),
        });
      const approval = await new ApprovalHistory({
        decisionKey: hash({
          id,
          version: document.version,
          key: input.operationKey,
        }),
        subjectType: "replenishment_requests",
        subjectId: document._id,
        subjectRevision: document.version,
        decisionScope: "REPLENISHMENT",
        reviewedContent: document.toObject(),
        decision: input.decision,
        reason: input.reason,
        itemDecisions,
        requestedBy: document.createdBy,
        decidedBy: actor._id,
        decidedAt: new Date(),
        recordedAt: new Date(),
        authoritySnapshot: {
          roleCode: currentRole(actor).code,
          permissionCode: "replenishment_request:approve",
          warehouseIds: actor.warehouseIds,
        },
      }).save({ session });
      document.header.latestDecisionId = approval._id;
      if (input.decision === "APPROVE")
        document.header.approvedRevision = document.version;
      document.workflowStatus = {
        APPROVE: "APPROVED",
        REJECT: "REJECTED",
        REVISE: "REVISION_REQUIRED",
      }[input.decision];
      return {
        document: await saveVersion(document, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
        decisionId: approval._id,
      };
    },
  );
}

export function cancelReplenishment(user, id, input) {
  const permission = isOwner(user)
    ? "replenishment_request:approve"
    : "replenishment_request:update";
  return command(
    user,
    "CANCEL_REPLENISHMENT",
    permission,
    id,
    input,
    replay,
    async (session, actor) => {
      const document = await readRequest(id, actor, session);
      checkVersion(document, input.expectedVersion);
      if (
        await PurchaseOrder.exists({ replenishmentRequestId: id }).session(
          session,
        )
      )
        throw validationError("Yêu cầu đã có PO; xử lý theo luồng PO");
      if (document.workflowStatus === "APPROVED") {
        if (!isOwner(actor)) throw forbiddenError("Owner xử lý phần đã duyệt");
      } else if (
        !["DRAFT", "SUBMITTED", "REVISION_REQUIRED"].includes(
          document.workflowStatus,
        ) ||
        !same(document.createdBy, actor._id)
      )
        throw forbiddenError("Chỉ người lập được rút yêu cầu chưa duyệt");
      if (!input.reason?.trim())
        throw validationError("Cần lý do rút/hủy yêu cầu");
      document.workflowStatus = "CANCELLED";
      document.cancelReason = input.reason;
      document.cancelledBy = actor._id;
      document.cancelledAt = new Date();
      return {
        document: await saveVersion(document, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
        reason: input.reason,
      };
    },
  );
}
