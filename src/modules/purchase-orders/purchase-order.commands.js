import {
  PurchaseOrder,
  ReplenishmentRequest,
  Supplier,
  Warehouse,
  Product,
  Uom,
  ApprovalHistory,
} from "../../models/runtime.js";
import { exact } from "../../models/model-utils.js";
import { isWholeUnit, normalizedEnteredQty, resolveConversion, toBaseQuantity, withinApproved } from "../../shared/utils/conversions.js";
import { notBeforeSaigonToday, saigonDateOnly } from "../../shared/utils/domain.js";
import { requireWarehouseAccess } from "../../shared/utils/access.js";
import { validationError } from "../../shared/utils/ApiError.js";
import {
  command,
  checkVersion,
  saveVersion,
  same,
  newId,
} from "../../shared/utils/document-command.js";
import { copyItem, sourceLink } from "../../shared/utils/document-copy.js";
import {
  findPurchase,
  replayPurchase,
  newDocument,
  evidenceFor,
} from "../../shared/utils/purchase-core.js";
import { purchaseOrderQuantities, cancelBlocker, receivingStatus, reopenable, hasDraftInspection } from "./purchase-order.service.js";

// A changed or new expected date may not be in the past; an unchanged saved date stays editable.
function checkExpectedOn(next, saved) {
  if (!next) return;
  if (saved && saigonDateOnly(new Date(next)) === saigonDateOnly(saved)) return;
  if (!notBeforeSaigonToday(next)) throw validationError("Ngày dự kiến giao không được trước hôm nay");
}
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
  // One PO line per RR line: lots are split later, at inspection and receipt.
  let request;
  const items = [],
    seen = new Set();
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
    if (seen.has(String(source._id)))
      throw validationError("Gộp lượng của cùng dòng RR");
    seen.add(String(source._id));
    const product = await Product.findOne({
      _id: source.productId,
      isActive: true,
    }).session(session);
    if (!product || !decision)
      throw validationError("Sản phẩm hoặc lượng PO vượt nguồn được duyệt");
    const old = line.id ? previous.find((row) => same(row._id, line.id)) : null;
    if (line.id && (!old || !same(old.requestItemId, source._id)))
      throw validationError("Không đổi nguồn của dòng đã lưu");
    // An edit that omits the unit keeps the saved one; reading it in the RR unit would silently rescale the quantity.
    const uomCode = line.uomCode ?? old?.enteredUnit ?? source.enteredUnit;
    const enteredUom = await Uom.findOne({ code: uomCode }).session(session);
    if (!enteredUom) throw validationError(`Đơn vị ${uomCode} không tồn tại`);
    if (isWholeUnit(product, enteredUom) && !exact(line.enteredQty).isInteger())
      throw validationError(enteredUom.isCarton ? "Số thùng phải là số nguyên" : "Số lượng theo đơn vị gốc phải là số nguyên");
    // Same unit as the RR keeps its snapshot factor (a lot carton may differ from the product default).
    const changedUnit = uomCode !== source.enteredUnit;
    const factor = changedUnit
      ? (await resolveConversion(product, null, uomCode, session)).toFixed()
      : String(source.baseUnitsPerUnit);
    const amount = toBaseQuantity(line.enteredQty, factor, product, enteredUom);
    if (product.wholeBaseUnits && !amount.isInteger())
      throw validationError("Số lượng sau quy đổi sang đơn vị gốc phải là số nguyên");
    if (
      !withinApproved(amount, line.enteredQty, factor, decision.approvedQtyBase, enteredUom.isCarton) ||
      amount.lte(0) ||
      amount.decimalPlaces() > 6
    )
      throw validationError("Sản phẩm hoặc lượng PO vượt nguồn được duyệt");
    const enteredQty = normalizedEnteredQty(amount, factor, product, enteredUom, line.enteredQty);
    // Model amounts keep 6 decimals; round half up instead of failing on long products.
    const value = exact(line.unitPurchasePrice).mul(enteredQty).toDecimalPlaces(6);
    items.push(
      copyItem(source, amount.toFixed(), {
        _id: old?._id ?? newId(),
        lineNo: index + 1,
        requestItemId: source._id,
        unitPurchasePrice: line.unitPurchasePrice,
        lineAmount: value.toFixed(),
        enteredUnit: uomCode,
        baseUnitsPerUnit: factor,
        enteredQty,
        ...(changedUnit && { lotId: undefined, packagingSnapshot: undefined }),
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
      checkExpectedOn(input.expectedOn);
      const prepared = await draftItems(actor, input, session);
      // RR cancellation checks for a linked PO. Write the source in the same
      // transaction so a concurrent cancel and PO creation cannot both commit.
      const request = prepared.request;
      // One PO per RR (unique index); answer 400 instead of a duplicate-key 500.
      if (
        await PurchaseOrder.exists({ replenishmentRequestId: request._id }).session(session)
      )
        throw validationError("Yêu cầu bổ sung đã có đơn mua");
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
      checkExpectedOn(input.expectedOn, po.header.expectedOn);
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
      const cartonUnits = new Set(await Uom.distinct("code", {
        code: { $in: po.items.map((item) => item.enteredUnit) },
        isCarton: true,
      }).session(session));
      const seen = new Set();
      for (const item of po.items) {
        const sourceId = String(item.requestItemId);
        const source = rr.items.id(item.requestItemId),
          decision = approval?.itemDecisions.find((d) =>
            same(d.itemId, item.requestItemId),
          );
        if (
          !source ||
          !decision ||
          seen.has(sourceId) ||
          !same(source.productId, item.productId) ||
          !withinApproved(
            item.qtyBase, item.enteredQty, item.baseUnitsPerUnit, decision.approvedQtyBase,
            cartonUnits.has(item.enteredUnit),
          )
        )
          throw validationError("Nguồn duyệt PO không còn hợp lệ");
        seen.add(sourceId);
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
      if (!(await Warehouse.exists({ _id: po.header.warehouseId, isActive: true }).session(session)))
        throw validationError("Kho đã ngừng hoạt động");
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
      checkExpectedOn(input.expectedOn);

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
    const item = po.items.id(row.poLineId);
    const product = item && await Product.findById(item.productId).session(session);
    if (product?.wholeBaseUnits && !exact(row.qtyBase).isInteger())
      throw validationError("Lượng chốt thiếu phải đúng đơn vị gốc của sản phẩm");
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
// One step by the Accountant (user decision 16/11/2026): no Owner approval and
// evidence optional. The remainder cancellation cannot be undone; the audit
// entry keeps the lines, reason and any evidence.
export function closeRemainder(user, id, input) {
  return command(
    user,
    "CLOSE_PO_REMAINDER",
    "purchase_order:update",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const po = await findPurchase(id, actor, session, { kind: "PO" });
      checkVersion(po, input.expectedVersion);
      if (!["OPEN", "PARTIAL"].includes(po.workflowStatus))
        throw validationError("PO không còn mở");
      // Closing first would strand the counted goods: the draft could no longer be confirmed (user decision 27/11/2026).
      if (await hasDraftInspection(po, session))
        throw validationError("PO còn phiếu kiểm nhận nháp. Xác nhận hoặc hủy phiếu kiểm trước khi chốt thiếu");
      await evidenceFor(actor, po, input.evidenceIds, session);
      await validateClose(po, input.lines, session);
      for (const row of input.lines) {
        const item = po.items.id(row.poLineId);
        item.cancelledRemainderQtyBase = exact(item.cancelledRemainderQtyBase ?? "0")
          .plus(row.qtyBase)
          .toFixed();
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
        reason: input.reason,
        auditChanges: [
          {
            field: "closure",
            before: null,
            after: { lines: input.lines, evidenceIds: input.evidenceIds ?? [] },
          },
        ],
      };
    },
  );
}
// The Accountant reopens a CLOSED PO whose receipt was reversed (user decision 23/11/2026).
// Only the reversed quantity becomes receivable again; the short-closed quantity stays closed.
export function reopenPurchaseOrder(user, id, input) {
  return command(
    user,
    "REOPEN_PURCHASE_ORDER",
    "purchase_order:update",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const po = await findPurchase(id, actor, session, { kind: "PO" });
      checkVersion(po, input.expectedVersion);
      if (po.workflowStatus !== "CLOSED")
        throw validationError("PO không ở trạng thái đã đóng");
      const quantities = await purchaseOrderQuantities(po, session);
      if (!reopenable(po, quantities))
        throw validationError("PO không có lượng chưa nhận để mở lại");
      po.workflowStatus = receivingStatus(quantities);
      po.header.closedAt = undefined;
      return {
        document: await saveVersion(po, input.expectedVersion, session),
        versionBefore: input.expectedVersion,
        reason: input.reason,
        auditChanges: [{ field: "workflowStatus", before: "CLOSED", after: po.workflowStatus }],
      };
    },
  );
}
export function cancelPurchaseOrder(user, id, input) {
  return command(
    user,
    "CANCEL_PURCHASE_ORDER",
    "purchase_order:update",
    id,
    input,
    replayPurchase,
    async (session, actor) => {
      const po = await findPurchase(id, actor, session, { kind: "PO" });
      checkVersion(po, input.expectedVersion);
      const blocker = await cancelBlocker(po, session);
      if (blocker) throw validationError(blocker);
      const requestId = po.replenishmentRequestId;
      // Same RR timestamp write as creation: a concurrent new PO or RR cancel
      // conflicts with this transaction instead of both committing.
      if (requestId)
        await ReplenishmentRequest.updateOne(
          { _id: requestId },
          { $currentDate: { updatedAt: true } },
          { session, timestamps: false },
        );
      po.workflowStatus = "CANCELLED";
      po.cancelReason = input.reason;
      po.cancelledBy = actor._id;
      po.cancelledAt = new Date();
      const saved = await saveVersion(po, input.expectedVersion, session);
      // Releasing the link frees the RR for a new PO; the unique index only
      // covers POs that still hold replenishmentRequestId. sources[] keeps history.
      await PurchaseOrder.updateOne(
        { _id: po._id, version: saved.version },
        { $unset: { replenishmentRequestId: 1 } },
        { session },
      );
      return { document: saved, versionBefore: input.expectedVersion, reason: input.reason };
    },
  );
}
