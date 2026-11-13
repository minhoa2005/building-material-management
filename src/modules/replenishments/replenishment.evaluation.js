import * as m from "../../models/runtime.js";
import { exact } from "../../models/model-utils.js";
import { requirePermission, requireWarehouseAccess } from "../../shared/utils/access.js";
import { ApiError, validationError, forbiddenError, notFoundError } from "../../shared/utils/ApiError.js";
import { same } from "../../shared/utils/document-command.js";
import { resolveConversion, toBaseQuantity } from "../../shared/utils/conversions.js";
import { freeQuantity } from "../../shared/utils/stock.js";
import { canReadRelated, canAccessWarehouse } from "./replenishment.access.js";
import { currentRole } from "../../shared/utils/userRole.js";

export const activeRequests = ["DRAFT", "SUBMITTED", "APPROVED"];
const number = (value) => exact(value == null ? "0" : String(value));
const positive = (value) => (number(value).gt(0) ? number(value) : exact("0"));
const sum = (rows) => rows.reduce((n, v) => n.plus(number(v)), exact("0"));
function pendingRequestQuantity(request, item, po) {
  const quantity = number(
    request.workflowStatus === "APPROVED" ? item.approvedQtyBase : item.qtyBase,
  );
  if (!po) return quantity;
  // One RR can create only one PO. Its unused approval cannot remain a live
  // proposal after that PO is terminal and no longer amendable.
  if (["CLOSED", "CANCELLED", "COMPLETED"].includes(po.workflowStatus))
    return exact("0");
  if (!["OPEN", "PARTIAL"].includes(po.workflowStatus)) return quantity;
  return positive(
    quantity.minus(
      sum(
        po.items
          .filter((p) => same(p.requestItemId, item._id))
          .map((p) => p.qtyBase),
      ),
    ),
  );
}
export function reviewRequired(
  evaluations,
  message = "Cần xác nhận và giải trình các cảnh báo bổ sung hàng",
  invalidLines = [],
) {
  return new ApiError(409, message, {
    code: "ERR-RR-409-004",
    details: {
      requiresReview: true,
      latestEvaluations: evaluations,
      invalidLines,
    },
  });
}
export async function resolveSource(
  line,
  warehouseId,
  user,
  session,
) {
  let source = line.source ?? { triggerType: "MANUAL_OTHER" };
  if (source.triggerType === "MANUAL_OTHER")
    return source;
  if (source.triggerType === "SALES_SHORTAGE") {
    if (
      !["sales_orders", "warehouse_issue_requests"].includes(
        source.documentType,
      )
    )
      throw validationError("Loại chứng từ nguồn bán không hợp lệ");
    let id = source.documentId,
      itemId = source.itemId,
      authorizedViaWir = false;
    if (source.documentType === "warehouse_issue_requests") {
      const wir = await m.WarehouseIssueRequest.findById(id).session(session);
      if (!wir) throw notFoundError("Không tìm thấy nguồn WIR");
      if (!canReadRelated(wir, user))
        throw forbiddenError();
      if (["CANCELLED", "REJECTED"].includes(wir.workflowStatus))
        throw reviewRequired([], "Nguồn WIR không còn hiệu lực", [
          { lineNo: line.lineNo, message: "Nguồn WIR không còn hiệu lực" },
        ]);
      source = { ...source, version: wir.version };
      const item = wir.items.id(itemId);
      if (!item || !same(item.productId, line.productId))
        throw validationError("Dòng WIR không khớp sản phẩm");
      const link = item.sources?.find(
        (s) => s.subjectCollection === "sales_orders",
      );
      itemId = item.details?.salesOrderLineId ?? link?.itemId;
      id = wir.header.salesOrderId ?? link?.documentId;
      authorizedViaWir = true;
    }
    const so = id && (await m.SalesOrder.findById(id).session(session));
    const item = so?.items.id(itemId);
    if (!so) throw notFoundError("Không tìm thấy nguồn SO");
    if (!authorizedViaWir && !canReadRelated(so, user))
      throw forbiddenError();
    if (!item || ["CANCELLED", "REJECTED", "COMPLETED"].includes(so.workflowStatus))
      throw reviewRequired([], "Dòng nhu cầu SO không còn hiệu lực", [
        { lineNo: line.lineNo, message: "Dòng nhu cầu SO không còn hiệu lực" },
      ]);
    if (!same(item.productId, line.productId))
      throw validationError("Sản phẩm không khớp dòng SO");
    if (source.documentType === "sales_orders")
      source = { ...source, version: so.version };
    return {
      ...source,
      salesOrderId: String(so._id),
      salesOrderItemId: String(item._id),
      salesOrderVersion: so.version,
    };
  }
  if (!["STOCK_THRESHOLD", "STOCKTAKE_LOW_STOCK"].includes(source.triggerType))
    throw validationError("Loại nguồn chưa được hỗ trợ");
  if (source.triggerType === "STOCKTAKE_LOW_STOCK") {
    const count = await m.Stocktake.findById(source.documentId).session(
      session,
    );
    if (!count) throw notFoundError("Không tìm thấy nguồn kiểm kê");
    if (!canReadRelated(count, user))
      throw forbiddenError();
    if (!same(count.header.warehouseId, warehouseId))
      throw validationError("Kiểm kê không thuộc kho nhận");
    if (
      !["COMPLETED", "CLOSED"].includes(count.workflowStatus) ||
      !count.header.completedAt
    )
      throw reviewRequired(
        [],
        "Chỉ dùng kiểm kê đã chốt và ghi thời điểm hoàn tất",
        [
          {
            lineNo: line.lineNo,
            message: "Kiểm kê chưa có kết quả chốt hợp lệ",
          },
        ],
      );
    source = { ...source, version: count.version };
    const batches = await m.ProductBatch.find({ productId: line.productId })
      .select("_id")
      .session(session);
    if (
      !count.items.some((i) => same(i.productId, line.productId)) &&
      !(await m.StocktakeSnapshot.exists({
        stocktakeId: count._id,
        batchId: { $in: batches.map((b) => b._id) },
      }).session(session))
    )
      throw validationError("Sản phẩm không thuộc ngữ cảnh kiểm kê");
  }
  return source;
}

async function openRequests(user, productId, warehouseId, excludeRequestId, session) {
  const requests = await m.ReplenishmentRequest.find({
    workflowStatus: { $in: activeRequests },
    "header.warehouseId": warehouseId,
    "items.productId": productId,
    ...(excludeRequestId && { _id: { $ne: excludeRequestId } }),
  }).session(session);
  const purchaseOrders = await m.PurchaseOrder.find({
    replenishmentRequestId: {
      $in: requests.filter((rr) => rr.workflowStatus === "APPROVED").map((rr) => rr._id),
    },
  }).session(session);
  const ordersByRequest = new Map(purchaseOrders.map((po) => [String(po.replenishmentRequestId), po]));
  const canReadOthers = ["OWNER", "ACCOUNTANT"].includes(currentRole(user)?.code);
  let pending = exact("0");
  const relatedRequests = [];
  for (const rr of requests) {
    const po = ordersByRequest.get(String(rr._id));
    const qty = sum(rr.items
      .filter((item) => same(item.productId, productId))
      .map((item) => pendingRequestQuantity(rr, item, po)));
    if (!qty.gt(0)) continue;
    pending = pending.plus(qty);
    if (canReadOthers || same(rr.createdBy, user._id))
      relatedRequests.push({
        id: String(rr._id), documentNo: rr.documentNo,
        workflowStatus: rr.workflowStatus, qtyBase: qty.toFixed(),
      });
  }
  return { pendingRequestQtyBase: pending.toFixed(), relatedRequests };
}

async function incomingPurchaseOrders(productId, warehouseId, excludeRequestId, session) {
  const orders = await m.PurchaseOrder.find({
    workflowStatus: { $in: ["OPEN", "PARTIAL"] },
    "header.warehouseId": warehouseId,
    "items.productId": productId,
    ...(excludeRequestId && { replenishmentRequestId: { $ne: excludeRequestId } }),
  }).session(session);
  const receipts = await m.PurchaseReceipt.find({
    "header.purchaseOrderId": { $in: orders.map((po) => po._id) },
    workflowStatus: "POSTED",
  }).session(session);
  const receivedByLine = new Map();
  for (const receipt of receipts) {
    for (const item of receipt.items) {
      const key = String(receipt.header.purchaseOrderId) + ":" + item.purchaseOrderItemId;
      receivedByLine.set(key, number(receivedByLine.get(key)).plus(number(item.qtyBase)));
    }
  }
  const incoming = [];
  for (const po of orders) {
    const outstanding = sum(po.items
      .filter((item) => same(item.productId, productId))
      .map((item) => positive(number(item.qtyBase)
        .minus(number(item.cancelledRemainderQtyBase))
        .minus(number(receivedByLine.get(String(po._id) + ":" + item._id))))));
    if (outstanding.gt(0))
      incoming.push({
        id: String(po._id), documentNo: po.documentNo, workflowStatus: po.workflowStatus,
        expectedOn: po.header.expectedOn?.toISOString() ?? null,
        outstandingQtyBase: outstanding.toFixed(),
      });
  }
  return incoming;
}

async function availableStock(productId, warehouseId, lotId, session) {
  const locations = await m.WarehouseLocation.find({
    warehouseId, isActive: true, locationType: "STORAGE", isPickable: true,
  }).select("_id").session(session);
  const locationIds = locations.map((location) => location._id);
  const locks = await m.StocktakeLocationLock.find({
    locationId: { $in: locationIds }, status: "LOCKED",
  }).select("locationId").session(session);
  const locked = new Set(locks.map((lock) => String(lock.locationId)));
  const points = await m.StockHoldingPoint.find({
    type: "LOCATION",
    locationId: { $in: locationIds.filter((id) => !locked.has(String(id))) },
  }).select("_id").session(session);
  const batches = await m.ProductBatch.find({
    productId, identificationStatus: "VERIFIED", ...(lotId && { _id: lotId }),
  }).select("_id").session(session);
  const balances = await m.InventoryBalance.find({
    holdingPointId: { $in: points.map((point) => point._id) },
    batchId: { $in: batches.map((batch) => batch._id) },
    qualityStatus: "GOOD", ownerType: "STORE",
  }).session(session);
  let available = exact("0");
  for (const balance of balances)
    available = available.plus(positive(await freeQuantity(balance, session)));
  return available;
}

async function otherWarehouseOptions(user, productId, warehouseId, lotId, session) {
  const warehouses = await m.Warehouse.find({
    _id: { $ne: warehouseId }, isActive: true,
  }).select("_id").sort({ _id: 1 }).session(session);
  const options = [];
  let total = exact("0"), restricted = exact("0");
  for (const warehouse of warehouses) {
    const qty = await availableStock(productId, warehouse._id, lotId, session);
    if (!qty.gt(0)) continue;
    total = total.plus(qty);
    if (canAccessWarehouse(user, warehouse._id))
      options.push({ warehouseId: String(warehouse._id), qtyBase: qty.toFixed() });
    else restricted = restricted.plus(qty);
  }
  return {
    otherWarehouseAvailableQtyBase: total.toFixed(),
    restrictedOtherWarehouseQtyBase: restricted.toFixed(),
    otherWarehouseOptions: options,
  };
}

async function previewQuantity(line, product, previous, session) {
  if (line.enteredQty == null) return null;
  const enteredUnit = line.enteredUnit ?? product.baseUnit;
  const batch = line.lotId && await m.ProductBatch.findOne({
    _id: line.lotId, productId: product._id, identificationStatus: "VERIFIED",
  }).session(session);
  if (line.lotId && !batch) throw validationError("Lô chưa xác minh hoặc không thuộc sản phẩm");
  const reuseSnapshot = previous &&
    same(previous.productId, product._id) &&
    previous.enteredUnit === enteredUnit &&
    String(previous.lotId ?? "") === String(batch?._id ?? "");
  const factor = reuseSnapshot
    ? number(previous.baseUnitsPerUnit)
    : await resolveConversion(product, batch, enteredUnit, session);
  const uom = await m.Uom.findOne({ code: enteredUnit }).session(session);
  return toBaseQuantity(line.enteredQty, factor, product, uom);
}

export async function evaluateLines(user, input, session, options = {}) {
  requirePermission(user, options.permission ?? (
    input.requestId ? "replenishment_request:read" : "replenishment_request:create"
  ));
  requireWarehouseAccess(user, input.warehouseId);
  if (
    !(await m.Warehouse.exists({
      _id: input.warehouseId,
      isActive: true,
    }).session(session))
  )
    throw validationError("Kho không hoạt động");
  let own;
  if (input.requestId) {
    own = await m.ReplenishmentRequest.findById(input.requestId).session(
      session,
    );
    if (
      !own ||
      !canAccessWarehouse(user, own.header.warehouseId) ||
      (!same(own.createdBy, user._id) &&
        !["OWNER", "ACCOUNTANT"].includes(currentRole(user)?.code))
    )
      throw validationError("Phiếu đang sửa không thuộc phạm vi");
  }
  const { warehouseId, requestId } = input;
  const evaluatedAt = new Date().toISOString();
  const result = [];
  for (const [index, line] of input.lines.entries()) {
    const product = await m.Product.findById(line.productId).session(session);
    if (!product?.isActive) throw validationError("Sản phẩm không hoạt động");
    const source = await resolveSource({ ...line, lineNo: index + 1 }, warehouseId, user, session);
    const available = await availableStock(product._id, warehouseId, line.lotId, session);
    const threshold = product.stockThresholds.find((row) => same(row.warehouseId, warehouseId));
    const minimum = threshold ? number(threshold.minimumQty) : null;
    // A zero minimum sets no floor; comparing stock >= 0 would warn on an empty warehouse.
    const stockLimit = minimum?.gt(0) ? minimum : (options.items
      ? number(options.items[index].qtyBase)
      : await previewQuantity(line, product, line.id && own?.items.id(line.id), session));
    const pending = await openRequests(user, product._id, warehouseId, requestId, session);
    const incoming = await incomingPurchaseOrders(product._id, warehouseId, requestId, session);
    const other = await otherWarehouseOptions(user, product._id, warehouseId, line.lotId, session);
    const warnings = [];
    if (number(pending.pendingRequestQtyBase).gt(0)) warnings.push("OPEN_REQUEST");
    if (incoming.length) warnings.push("INCOMING_PO");
    if (stockLimit != null && available.gte(stockLimit)) warnings.push("STOCK_SUFFICIENT");
    result.push({
      lineNo: index + 1,
      productId: String(product._id),
      source,
      availableQtyBase: available.toFixed(),
      minimumQtyBase: minimum?.toFixed() ?? null,
      targetQtyBase: threshold ? number(threshold.targetQty).toFixed() : null,
      ...pending,
      incomingQtyBase: sum(incoming.map((po) => po.outstandingQtyBase)).toFixed(),
      incomingPurchaseOrders: incoming,
      ...other,
      warnings,
      warningRequired: warnings.length > 0,
      evaluatedAt,
    });
  }
  return result;
}
