import {
  PurchaseOrder,
  ReplenishmentRequest,
  Supplier,
  Warehouse,
  Product,
  ApprovalHistory,
  AuditLog,
} from "../../models/runtime.js";
import { exact } from "../../models/model-utils.js";
import { requireWarehouseAccess } from "../../shared/utils/access.js";
import { currentRole } from "../../shared/utils/userRole.js";
import { validationError } from "../../shared/utils/ApiError.js";
import {
  command,
  checkVersion,
  saveVersion,
  same,
  hash,
  newId,
} from "../../shared/utils/document-command.js";
import { copyItem, sourceLink } from "../../shared/utils/document-copy.js";
import {
  findPurchase,
  replayPurchase,
  newDocument,
  evidenceFor,
} from "../po-receiving/purchase-core.js";
import { purchaseOrderQuantities } from "./purchase-order.service.js";

async function draftItems(actor, input, session, previous = []) {
  requireWarehouseAccess(actor, input.warehouseId);
  const supplier = await Supplier.findOne({
    _id: input.supplierId,
    status: "ACTIVE",
  }).session(session);
  if (
    !supplier ||
    !(await Warehouse.exists({
      _id: input.warehouseId,
      isActive: true,
    }).session(session))
  )
    throw validationError("Kho hoặc nhà cung cấp không hoạt động");
  // One RR line may be split into several PO lines (e.g. one per supplier lot); their sum stays within the approval.
  let request;
  const items = [],
    totals = new Map();
  const usedItemIds = new Set();
  for (const [index, line] of input.lines.entries()) {
    const rr = await ReplenishmentRequest.findOne({
      "items._id": line.rrLineId,
      workflowStatus: "APPROVED",
    }).session(session);
    if (
      !rr ||
      !same(rr.header.warehouseId, input.warehouseId) ||
      (request && !same(request._id, rr._id))
    )
      throw validationError("Một PO phải thuộc một RR đã duyệt và cùng kho");
    request = rr;
    const approval = await ApprovalHistory.findOne({
      _id: line.approvalId,
      subjectType: "replenishment_requests",
      subjectId: rr._id,
      subjectRevision: rr.header.approvedRevision,
      decision: "APPROVE",
    }).session(session);
    if (!approval || !same(rr.header.latestDecisionId, approval._id))
      throw validationError("Quyết định duyệt nguồn không còn hiệu lực");
    const source = rr.items.id(line.rrLineId),
      decision = approval.itemDecisions.find((row) =>
        same(row.itemId, source._id),
      );
    const amount = exact(line.enteredQty).mul(String(source.baseUnitsPerUnit));
    const total = (totals.get(String(source._id)) ?? exact("0")).plus(amount);
    totals.set(String(source._id), total);
    const product = await Product.findOne({
      _id: source.productId,
      isActive: true,
    }).session(session);
    if (
      !product ||
      !decision ||
      total.gt(String(decision.approvedQtyBase)) ||
      amount.lte(0) ||
      (product.wholeBaseUnits && !amount.isInteger()) ||
      amount.decimalPlaces() > 6
    )
      throw validationError("Sản phẩm hoặc lượng PO vượt nguồn được duyệt");
    const old = line.id ? previous.find((row) => same(row._id, line.id)) : null;
    if (line.id && (!old || !same(old.requestItemId, source._id)))
      throw validationError("Không đổi nguồn của dòng đã lưu");
    if (old) {
      const itemId = String(old._id);
      if (usedItemIds.has(itemId)) throw validationError("ID dòng PO bị trùng");
      usedItemIds.add(itemId);
    }
    const value = exact(line.unitPurchasePrice).mul(line.enteredQty);
    items.push(
      copyItem(source, amount.toFixed(), {
        _id: old?._id ?? newId(),
        lineNo: index + 1,
        requestItemId: source._id,
        unitPurchasePrice: line.unitPurchasePrice,
        lineAmount: value.toFixed(),
        ...(line.note && { note: line.note }),
        sources: [
          sourceLink(rr, source, amount.toFixed(), "REPLENISHMENT_PURCHASE"),
        ],
      }),
    );
  }
  return {
    request,
    supplier,
    items,
    total: items
      .reduce((sum, row) => sum.plus(row.lineAmount), exact("0"))
      .toFixed(),
  };
}
export function createPurchaseOrder(user, input) {
  return command(
    user,
    "CREATE_PURCHASE_ORDER",
    "purchase_order:create",
    null,
    input,
    replayPurchase,
    async (session, actor) => {
      const prepared = await draftItems(actor, input, session);
      // RR cancellation checks for a linked PO. Write the source in the same
      // transaction so a concurrent cancel and PO creation cannot both commit.
      const request = prepared.request;
      const updatedAt = new Date(
        Math.max(Date.now(), (request.updatedAt?.getTime() ?? 0) + 1),
      );
      await ReplenishmentRequest.updateOne(
        { _id: request._id },
        { $set: { updatedAt } },
        { session, timestamps: false },
      );
      const po = await newDocument(
        PurchaseOrder,
        "PO",
        actor,
        {
          warehouseId: input.warehouseId,
          supplierId: input.supplierId,
          expectedOn: input.expectedOn,
          approvedRequestRevision: prepared.request.header.approvedRevision,
          supplierSnapshot: {
            code: prepared.supplier.code,
            name: prepared.supplier.name,
            phone: prepared.supplier.phone,
          },
        },
        prepared.items,
      );
      po.replenishmentRequestId = prepared.request._id;
      po.totalAmount = prepared.total;
      po.currency = input.currency;
      po.sources = [sourceLink(prepared.request)];
      await po.save({ session });
      return { document: po };
    },
  );
}
export function updatePurchaseOrder(user, id, input) {
  return command(
    user,
    "UPDATE_PURCHASE_ORDER",
    "purchase_order:update",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const po = await findPurchase(id, actor, session, { kind: "PO" });
      checkVersion(po, input.expectedVersion);
      if (po.workflowStatus !== "DRAFT")
        throw validationError("Chỉ sửa trực tiếp PO nháp");
      const prepared = await draftItems(actor, input, session, po.items);
      if (!same(prepared.request._id, po.replenishmentRequestId))
        throw validationError("Không đổi RR nguồn của PO");
      po.items = prepared.items;
      po.totalAmount = prepared.total;
      po.currency = input.currency;
      po.header.warehouseId = input.warehouseId;
      po.header.supplierId = input.supplierId;
      po.header.expectedOn = input.expectedOn;
      po.header.supplierSnapshot = {
        code: prepared.supplier.code,
        name: prepared.supplier.name,
        phone: prepared.supplier.phone,
      };
      return {
        document: await saveVersion(po, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
      };
    },
  );
}
export function confirmPurchaseOrder(user, id, input) {
  return command(
    user,
    "CONFIRM_PURCHASE_ORDER",
    "purchase_order:update",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const po = await findPurchase(id, actor, session, { kind: "PO" });
      checkVersion(po, input.expectedVersion);
      if (po.workflowStatus !== "DRAFT" || !po.items.length)
        throw validationError("PO không phải nháp có dòng hàng");
      const rr = await ReplenishmentRequest.findById(
        po.replenishmentRequestId,
      ).session(session);
      if (
        rr?.workflowStatus !== "APPROVED" ||
        rr.header.approvedRevision !== po.header.approvedRequestRevision
      )
        throw validationError("Nguồn RR đã đổi");
      const approval = await ApprovalHistory.findOne({
        _id: rr.header.latestDecisionId,
        subjectType: "replenishment_requests",
        subjectId: rr._id,
        subjectRevision: rr.header.approvedRevision,
        decision: "APPROVE",
      }).session(session);
      const totals = new Map();
      for (const item of po.items) {
        const source = rr.items.id(item.requestItemId),
          decision = approval?.itemDecisions.find((d) =>
            same(d.itemId, item.requestItemId),
          );
        const total = (
          totals.get(String(item.requestItemId)) ?? exact("0")
        ).plus(String(item.qtyBase));
        totals.set(String(item.requestItemId), total);
        if (
          !source ||
          !decision ||
          !same(source.productId, item.productId) ||
          total.gt(String(decision.approvedQtyBase))
        )
          throw validationError("Nguồn duyệt PO không còn hợp lệ");
        if (
          !(await Product.exists({
            _id: item.productId,
            isActive: true,
          }).session(session))
        )
          throw validationError("Sản phẩm đã ngừng hoạt động");
      }
      if (
        !(await Supplier.exists({
          _id: po.header.supplierId,
          status: "ACTIVE",
        }).session(session))
      )
        throw validationError("NCC đã ngừng hoạt động");
      po.workflowStatus = "OPEN";
      po.header.issuedAt = new Date();
      return {
        document: await saveVersion(po, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
      };
    },
  );
}
export function rescheduleExpectedOn(user, id, input) {
  return command(
    user,
    "RESCHEDULE_PO_EXPECTED_ON",
    "purchase_order:update",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const po = await findPurchase(id, actor, session, { kind: "PO" });
      checkVersion(po, input.expectedVersion);
      if (!["OPEN", "PARTIAL"].includes(po.workflowStatus))
        throw validationError("PO không còn mở");

      const before = po.header.expectedOn?.toISOString() ?? null;
      po.header.expectedOn = input.expectedOn;
      return {
        document: await saveVersion(po, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
        reason: input.reason,
        auditChanges: [
          {
            field: "header.expectedOn",
            before,
            after: po.header.expectedOn.toISOString(),
          },
        ],
      };
    },
  );
}
async function validateClose(po, lines, session) {
  const quantities = await purchaseOrderQuantities(po, session),
    seen = new Set();
  for (const row of lines) {
    const available = quantities.find(
      (item) => item.lineId === String(row.poLineId),
    );
    if (
      !available ||
      seen.has(row.poLineId) ||
      exact(row.qtyBase).gt(
        exact(available.outstandingQtyBase).minus(
          available.openDraftCommitmentQtyBase,
        ),
      )
    )
      throw validationError("Lượng chốt thiếu vượt phần chưa cam kết");
    seen.add(row.poLineId);
  }
}
export function requestClose(user, id, input) {
  return command(
    user,
    "REQUEST_PO_CLOSE",
    "purchase_order:update",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const po = await findPurchase(id, actor, session, { kind: "PO" });
      checkVersion(po, input.expectedVersion);
      if (!["OPEN", "PARTIAL"].includes(po.workflowStatus))
        throw validationError("PO không còn mở");
      await evidenceFor(actor, po, input.evidenceIds, session, true);
      await validateClose(po, input.lines, session);
      return {
        document: await saveVersion(po, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
        reason: input.reason,
        auditChanges: [
          {
            field: "closureProposal",
            before: null,
            after: { lines: input.lines, evidenceIds: input.evidenceIds },
          },
        ],
      };
    },
  );
}
export function approveClose(user, id, input) {
  return command(
    user,
    "APPROVE_PO_CLOSE",
    "purchase_order:approve_exception",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const po = await findPurchase(id, actor, session, { kind: "PO" });
      checkVersion(po, input.expectedVersion);
      const request = await AuditLog.findOne({
        _id: input.requestId,
        subjectType: "purchase_orders",
        subjectId: id,
        action: "REQUEST_PO_CLOSE",
        versionAfter: po.version,
      }).session(session);
      if (!request || same(request.actorId, actor._id))
        throw validationError(
          "Đề nghị không đúng phiên bản hoặc người duyệt trùng người lập",
        );
      const proposal = request.changes.find(
        (row) => row.field === "closureProposal",
      )?.after;
      if (!proposal) throw validationError("Thiếu nội dung đề nghị");
      await validateClose(po, proposal.lines, session);
      await evidenceFor(actor, po, input.evidenceIds, session, true);
      const decision = await new ApprovalHistory({
        decisionKey: hash({
          id,
          request: String(request._id),
          key: input.operationKey,
        }),
        subjectType: "purchase_orders",
        subjectId: po._id,
        subjectRevision: po.version,
        decisionScope: "PURCHASE_CLOSE",
        reviewedContent: proposal,
        decision: "APPROVE",
        reason: input.reason,
        requestedBy: request.actorId,
        decidedBy: actor._id,
        decidedAt: new Date(),
        recordedAt: new Date(),
        itemDecisions: proposal.lines.map((row) => ({
          itemId: row.poLineId,
          approvedQtyBase: row.qtyBase,
          outcome: "CANCEL_REMAINDER",
        })),
        authoritySnapshot: {
          roleCode: currentRole(actor).code,
          permissionCode: "purchase_order:approve_exception",
          warehouseIds: actor.warehouseIds,
        },
        evidenceIds: input.evidenceIds,
      }).save({ session });
      po.header.closureDecisionId = decision._id;
      return {
        document: await saveVersion(po, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
        decisionId: decision._id,
      };
    },
  );
}
export function executeClose(user, id, input) {
  return command(
    user,
    "EXECUTE_PO_CLOSE",
    "purchase_order:update",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const po = await findPurchase(id, actor, session, { kind: "PO" });
      checkVersion(po, input.expectedVersion);
      const approval = await ApprovalHistory.findOne({
        _id: input.approvalId,
        subjectId: id,
        subjectType: "purchase_orders",
        decisionScope: "PURCHASE_CLOSE",
        decision: "APPROVE",
      }).session(session);
      if (
        !approval ||
        !same(po.header.closureDecisionId, approval._id) ||
        po.version !== approval.subjectRevision + 1
      )
        throw validationError("Quyết định chốt thiếu không còn đúng phiên bản");
      const lines = approval.itemDecisions.map((row) => ({
        poLineId: String(row.itemId),
        qtyBase: String(row.approvedQtyBase),
      }));
      await validateClose(po, lines, session);
      for (const row of lines) {
        const item = po.items.id(row.poLineId);
        item.cancelledRemainderQtyBase = exact(
          item.cancelledRemainderQtyBase ?? "0",
        )
          .plus(row.qtyBase)
          .toFixed();
        item.cancellationDecisionId = approval._id;
      }
      const quantities = await purchaseOrderQuantities(po, session);
      if (quantities.every((row) => exact(row.outstandingQtyBase).isZero())) {
        po.workflowStatus = "CLOSED";
        po.header.closedAt = new Date();
      }
      po.header.closureReason = input.reason;
      return {
        document: await saveVersion(po, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
        decisionId: approval._id,
      };
    },
  );
}
