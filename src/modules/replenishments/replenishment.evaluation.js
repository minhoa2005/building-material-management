import * as m from "../../models/runtime.js";
import { exact } from "../../models/model-utils.js";
import {
  requirePermission,
  requireWarehouseAccess,
} from "../../shared/utils/access.js";
import {
  ApiError,
  validationError,
  forbiddenError,
  notFoundError,
} from "../../shared/utils/ApiError.js";
import { sha256Json } from "../../shared/utils/domain.js";
import { same } from "../../shared/utils/document-command.js";
import {
  freeQuantity,
  remainingReservation,
} from "../../shared/utils/stock.js";
import { canReadRelated, canAccessWarehouse } from "./replenishment.access.js";
import { currentRole } from "../../shared/utils/userRole.js";

export const activeRequests = ["DRAFT", "SUBMITTED", "APPROVED"];
const number = (value) => exact(value == null ? "0" : String(value));
const positive = (value) => (number(value).gt(0) ? number(value) : exact("0"));
const sum = (rows) => rows.reduce((n, v) => n.plus(number(v)), exact("0"));
const min = (a, b) => (number(a).lt(number(b)) ? number(a) : number(b));
function pendingRequestQuantity(request, item, po) {
  const quantity = number(
    request.workflowStatus === "APPROVED" ? item.approvedQtyBase : item.qtyBase,
  );
  if (!po || po.workflowStatus === "DRAFT") return quantity;
  // One RR can create only one PO. Its unused approval cannot remain a live
  // proposal after that PO is terminal and no longer amendable.
  if (["CLOSED", "CANCELLED", "COMPLETED"].includes(po.workflowStatus))
    return exact("0");
  if (!["OPEN", "PARTIAL"].includes(po.workflowStatus))
    throw reviewRequired([], "Trạng thái PO chưa xác định được hiệu lực nguồn");
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
  message = "Nguồn bổ sung đã thay đổi; kiểm tra lại trước khi lưu",
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
  options = {},
) {
  let source = line.source ?? { triggerType: "MANUAL_OTHER" };
  if (source.triggerType === "MANUAL_OTHER")
    return {
      source,
      canonicalKey: "MANUAL:" + warehouseId + ":" + line.productId,
    };
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
      if (!options.internal && !canReadRelated(wir, user))
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
    if (!options.internal && !authorizedViaWir && !canReadRelated(so, user))
      throw forbiddenError();
    if (!item || ["CANCELLED", "COMPLETED"].includes(so.workflowStatus))
      throw reviewRequired([], "Dòng nhu cầu SO không còn hiệu lực", [
        { lineNo: line.lineNo, message: "Dòng nhu cầu SO không còn hiệu lực" },
      ]);
    if (!same(item.productId, line.productId))
      throw validationError("Sản phẩm không khớp dòng SO");
    if (source.documentType === "sales_orders")
      source = { ...source, version: so.version };
    return {
      source: {
        ...source,
        salesOrderId: String(so._id),
        salesOrderItemId: String(item._id),
        salesOrderVersion: so.version,
      },
      canonicalKey: "SO:" + so._id + ":" + item._id,
      so,
      item,
    };
  }
  if (!["STOCK_THRESHOLD", "STOCKTAKE_LOW_STOCK"].includes(source.triggerType))
    throw validationError("Loại nguồn chưa được hỗ trợ");
  if (source.triggerType === "STOCKTAKE_LOW_STOCK") {
    const count = await m.Stocktake.findById(source.documentId).session(
      session,
    );
    if (!count) throw notFoundError("Không tìm thấy nguồn kiểm kê");
    if (!options.internal && !canReadRelated(count, user))
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
  return {
    source,
    canonicalKey: "THRESHOLD:" + warehouseId + ":" + line.productId,
  };
}

async function canonicalSaved(request, item, session) {
  if (item.details?.canonicalSourceKey) return item.details.canonicalSourceKey;
  const trigger = item.details?.triggerType ?? "MANUAL_OTHER";
  if (trigger === "MANUAL_OTHER")
    return `MANUAL:${request.header.warehouseId}:${item.productId}`;
  if (["STOCK_THRESHOLD", "STOCKTAKE_LOW_STOCK"].includes(trigger))
    return `THRESHOLD:${request.header.warehouseId}:${item.productId}`;
  const link = item.sources?.find(
    (s) => s.subjectCollection === "sales_orders",
  );
  if (link?.documentId && link?.itemId)
    return `SO:${link.documentId}:${link.itemId}`;
  const id = item.details?.sourceSalesOrderLineId;
  const order =
    id && (await m.SalesOrder.findOne({ "items._id": id }).session(session));
  if (order) return `SO:${order._id}:${id}`;
  throw reviewRequired(
    [],
    "Liên kết nguồn của RR cũ chưa xác định; cần đối chiếu trước khi bổ sung",
  );
}

async function expectedSupply(productId, input, session) {
  const result = [];
  const pos = await m.PurchaseOrder.find({
    workflowStatus: { $in: ["OPEN", "PARTIAL"] },
    "items.productId": productId,
    ...(input.excludePurchaseOrderId && {
      _id: { $ne: input.excludePurchaseOrderId },
    }),
  }).session(session);
  for (const po of pos) {
    const rr = await m.ReplenishmentRequest.findById(
      po.replenishmentRequestId,
    ).session(session);
    if (!rr) throw reviewRequired([], "Nguồn PO thiếu RR hợp lệ để đối chiếu");
    const receipts = await m.PurchaseReceipt.find({
      "header.purchaseOrderId": po._id,
      workflowStatus: "POSTED",
    }).session(session);
    for (const item of po.items.filter((i) => same(i.productId, productId))) {
      const rrItem = rr.items.id(item.requestItemId);
      if (!rrItem)
        throw reviewRequired([], "Dòng PO thiếu liên kết RR để đối chiếu");
      const received = sum(
        receipts
          .flatMap((r) => r.items)
          .filter((i) => same(i.purchaseOrderItemId, item._id))
          .map((i) => i.qtyBase),
      );
      const outstanding = positive(
        number(item.qtyBase)
          .minus(number(item.cancelledRemainderQtyBase))
          .minus(received),
      );
      const slices = outstanding.gt(0)
        ? [{ quantity: outstanding, date: po.header.expectedOn }]
        : [];
      result.push({
        documentType: "purchase_orders",
        documentId: po._id,
        itemId: item._id,
        warehouseId: po.header.warehouseId,
        canonicalKey: await canonicalSaved(rr, rrItem, session),
        outstanding,
        slices,
        version: po.version,
      });
    }
  }
  const transfers = await m.WarehouseTransferRequest.find({
    workflowStatus: "APPROVED",
    "items.productId": productId,
  }).session(session);
  for (const tr of transfers) {
    const dispatches = await m.TransferDispatch.find({
      "header.requestId": tr._id,
      workflowStatus: "POSTED",
    }).session(session);
    const receipts = await m.TransferReceipt.find({
      "header.dispatchId": { $in: dispatches.map((d) => d._id) },
      workflowStatus: "POSTED",
    }).session(session);
    for (const item of tr.items.filter((i) => same(i.productId, productId))) {
      const ids = dispatches
        .flatMap((d) => d.items)
        .filter((i) => same(i.details?.requestLineId, item._id))
        .map((i) => i._id);
      const received = sum(
        receipts
          .flatMap((r) => r.items)
          .filter((i) => ids.some((id) => same(i.details?.dispatchLineId, id)))
          .map((i) => i.qtyBase),
      );
      const outstanding = positive(
        number(item.approvedQtyBase).minus(received),
      );
      result.push({
        documentType: "warehouse_transfer_requests",
        documentId: tr._id,
        itemId: item._id,
        warehouseId: tr.header.destinationWarehouseId,
        canonicalKey: null,
        outstanding,
        slices: [{ quantity: outstanding, date: tr.header.neededOn }],
        version: tr.version,
      });
    }
  }
  return result;
}

async function effectiveMovements(documents, session) {
  const roots = await m.StockTransaction.find({
    sourceId: { $in: documents.map((d) => d._id) },
    reversedTransactionId: { $exists: false },
  }).session(session);
  const all = [...roots];
  let frontier = roots;
  while (frontier.length) {
    const next = await m.StockTransaction.find({
      reversedTransactionId: { $in: frontier.map((t) => t._id) },
    }).session(session);
    if (next.some((t) => all.some((old) => same(old._id, t._id))))
      throw reviewRequired([], "Chuỗi đảo tồn có vòng lặp");
    all.push(...next);
    frontier = next;
  }
  const active = (row) => {
    const children = all.filter((t) => same(t.reversedTransactionId, row._id));
    if (children.length > 1)
      throw reviewRequired(
        [],
        "Một giao dịch có nhiều nhánh đảo không xác định",
      );
    return children.length ? !active(children[0]) : true;
  };
  const result = new Map();
  for (const root of roots)
    for (const movement of root.movements) {
      const id = String(movement.sourceLineId);
      result.set(
        id,
        (result.get(id) ?? exact("0")).plus(
          active(root) ? number(movement.quantityBase) : exact("0"),
        ),
      );
    }
  return result;
}

async function eligibleReservedQuantity(reservations, item, session) {
  let result = exact("0");
  for (const balanceId of [
    ...new Set(reservations.map((r) => String(r.balanceId))),
  ]) {
    const balance =
      await m.InventoryBalance.findById(balanceId).session(session);
    if (!balance)
      throw reviewRequired([], "Giữ hàng thiếu số dư nguồn để đối chiếu");
    if (balance.qualityStatus !== "GOOD" || balance.ownerType !== "STORE")
      continue;
    const batch = await m.ProductBatch.findById(balance.batchId).session(
      session,
    );
    if (!batch || !same(batch.productId, item.productId))
      throw reviewRequired([], "Giữ hàng không khớp sản phẩm nhu cầu");
    if (
      batch.identificationStatus !== "VERIFIED" ||
      (item.lotId && !same(item.lotId, batch._id))
    )
      continue;
    const point = await m.StockHoldingPoint.findById(
      balance.holdingPointId,
    ).session(session);
    if (!point) throw reviewRequired([], "Giữ hàng thiếu điểm giữ hàng");
    // In-transit stock is expected supply, checked against its TR and date.
    if (point.type === "IN_TRANSIT") continue;
    const location = await m.WarehouseLocation.findById(
      point.locationId,
    ).session(session);
    if (
      !location?.isActive ||
      !["STORAGE", "RECEIVING", "STAGING"].includes(location.locationType)
    )
      continue;
    if (
      !(await m.Warehouse.exists({
        _id: location.warehouseId,
        isActive: true,
      }).session(session)) ||
      (await m.StocktakeLocationLock.exists({
        locationId: location._id,
        status: "LOCKED",
      }).session(session))
    )
      continue;
    const reports = await m.DefectReport.find({
      "holds.allocations.balanceId": balanceId,
    }).session(session);
    const held = sum(
      reports
        .flatMap((r) => r.holds ?? [])
        .filter((h) => h.status === "ACTIVE")
        .flatMap((h) => h.allocations)
        .filter((a) => same(a.balanceId, balanceId))
        .map((a) => a.quantityBase),
    );
    let capacity = positive(number(balance.quantityBase).minus(held));
    const all = await m.StockReservation.find({ balanceId })
      .sort({ _id: 1 })
      .session(session);
    for (const row of all) {
      const assigned = min(capacity, remainingReservation(row));
      capacity = capacity.minus(assigned);
      if (reservations.some((r) => same(r._id, row._id)))
        result = result.plus(assigned);
    }
  }
  return result;
}

async function salesDemand(order, item, session) {
  const reservations = await m.StockReservation.find({
    "demandRef.documentType": "sales_orders",
    "demandRef.documentId": order._id,
    "demandRef.itemId": item._id,
  }).session(session);
  const wirs = await m.WarehouseIssueRequest.find({
    "header.salesOrderId": order._id,
  }).session(session);
  const wirIds = wirs.flatMap((w) =>
    w.items
      .filter((i) => same(i.details?.salesOrderLineId, item._id))
      .map((i) => i._id),
  );
  const deliveries = await m.DeliveryOrder.find({
    "header.issueRequestId": { $in: wirs.map((w) => w._id) },
  }).session(session);
  const deliveryIds = deliveries.flatMap((d) =>
    d.items
      .filter((i) =>
        wirIds.some((id) => same(id, i.details?.issueRequestLineId)),
      )
      .map((i) => i._id),
  );
  const issues = await m.SalesGoodsIssue.find({
    workflowStatus: "POSTED",
    "items.details.outboundDeliveryLineId": { $in: deliveryIds },
  }).session(session);
  const issued = await effectiveMovements(issues, session);
  const issuedItems = issues
    .flatMap((g) => g.items)
    .filter((i) =>
      deliveryIds.some((id) => same(id, i.details?.outboundDeliveryLineId)),
    );
  if (issuedItems.some((i) => !issued.has(String(i._id))))
    throw reviewRequired([], "Phiếu xuất bán thiếu giao dịch tồn có hiệu lực");
  const ledgerGross = sum(issuedItems.map((i) => issued.get(String(i._id))));
  const consumed = sum(reservations.map((r) => r.consumedQty));
  if (consumed.gt(ledgerGross))
    throw reviewRequired([], "Lượng giữ đã dùng không khớp giao dịch xuất bán");
  const gross = ledgerGross;
  const receipts = await m.FailedDeliveryReceipt.find({
    workflowStatus: "POSTED",
    "demandReopenings.salesOrderLineId": item._id,
  }).session(session);
  const returned = await effectiveMovements(receipts, session);
  let reopened = exact("0");
  for (const receipt of receipts)
    for (const opening of receipt.demandReopenings ?? []) {
      if (!same(opening.salesOrderLineId, item._id)) continue;
      const effective = returned.get(String(opening.receiptLineId));
      if (!effective || effective.isZero()) {
        // A reversed receipt contributes no reopened demand. An absent original
        // transaction is corrupt history and must not mean zero supply.
        if (
          !(await m.StockTransaction.exists({
            _id: receipt.stockTransactionId,
          }).session(session)) ||
          !(await m.StockTransaction.exists({
            reversedTransactionId: receipt.stockTransactionId,
          }).session(session))
        )
          throw reviewRequired(
            [],
            "Phiếu về kho thiếu giao dịch tái mở nhu cầu",
          );
        continue;
      }
      if (number(opening.reopenedQtyBase).gt(effective))
        throw reviewRequired([], "Lượng tái mở vượt lượng đã thực về kho");
      reopened = reopened.plus(number(opening.reopenedQtyBase));
    }
  if (reopened.gt(gross))
    throw reviewRequired([], "Lượng tái mở vượt lượng đã thực xuất");
  const cancelled = sum(
    (order.cancellations ?? [])
      .filter((c) => same(c.salesOrderLineId, item._id))
      .map((c) => c.cancelledQtyBase),
  );
  return {
    remaining: positive(
      number(item.qtyBase).minus(cancelled).minus(gross).plus(reopened),
    ),
    reservations,
    reserved: await eligibleReservedQuantity(reservations, item, session),
  };
}

// Unreserved stock is a shared pool, not a copy available to every SO and then
// again to reserve replenishment. Allocate it deterministically by SO need date,
// creation time and stable IDs, considering every live demand for the product.
async function earlierSalesNeed(
  productId,
  resolved,
  requests,
  supplies,
  deadline,
  session,
) {
  const orders = await m.SalesOrder.find({
    workflowStatus: { $nin: ["CANCELLED", "COMPLETED", "REJECTED"] },
    "items.productId": productId,
  })
    .sort({ "header.neededOn": 1, createdAt: 1, _id: 1 })
    .session(session);
  let needed = exact("0");
  for (const order of orders)
    for (const item of [...order.items]
      .filter((i) => same(i.productId, productId))
      .sort((a, b) => String(a._id).localeCompare(String(b._id)))) {
      const key = `SO:${order._id}:${item._id}`;
      if (key === resolved.canonicalKey) return needed;
      const demand = await salesDemand(order, item, session);
      const reserved = demand.reserved;
      let pending = exact("0");
      for (const rr of requests)
        for (const row of rr.items.filter((i) =>
          same(i.productId, productId),
        )) {
          if ((await canonicalSaved(rr, row, session)) !== key) continue;
          const po = await m.PurchaseOrder.findOne({
            replenishmentRequestId: rr._id,
          }).session(session);
          const qty = pendingRequestQuantity(rr, row, po);
          pending = pending.plus(qty);
        }
      const dedicated = sum(
        supplies
          .filter((s) => s.canonicalKey === key)
          .flatMap((s) =>
            s.slices
              .filter((slice) => slice.date && new Date(slice.date) <= deadline)
              .map((slice) => slice.quantity),
          ),
      );
      needed = needed.plus(
        positive(
          demand.remaining.minus(reserved).minus(pending).minus(dedicated),
        ),
      );
    }
  return needed;
}

async function otherWarehouseOptions(
  product,
  warehouseId,
  requiredBatchId,
  user,
  session,
) {
  const options = [];
  let total = exact("0"),
    restricted = exact("0");
  const warehouses = await m.Warehouse.find({
    _id: { $ne: warehouseId },
    isActive: true,
  })
    .sort({ _id: 1 })
    .session(session);
  const batches = await m.ProductBatch.find({
    productId: product._id,
    identificationStatus: "VERIFIED",
    ...(requiredBatchId && { _id: requiredBatchId }),
  })
    .select("_id")
    .session(session);
  for (const warehouse of warehouses) {
    const locations = await m.WarehouseLocation.find({
      warehouseId: warehouse._id,
      isActive: true,
      locationType: "STORAGE",
      isPickable: true,
    }).session(session);
    const points = await m.StockHoldingPoint.find({
      type: "LOCATION",
      locationId: { $in: locations.map((l) => l._id) },
    }).session(session);
    const balances = await m.InventoryBalance.find({
      holdingPointId: { $in: points.map((p) => p._id) },
      batchId: { $in: batches.map((b) => b._id) },
      qualityStatus: "GOOD",
      ownerType: "STORE",
    }).session(session);
    let qty = exact("0");
    for (const balance of balances) {
      const point = points.find((p) => same(p._id, balance.holdingPointId));
      if (
        await m.StocktakeLocationLock.exists({
          locationId: point.locationId,
          status: "LOCKED",
        }).session(session)
      )
        continue;
      const reports = await m.DefectReport.find({
        "holds.allocations.balanceId": balance._id,
      }).session(session);
      const held = sum(
        reports
          .flatMap((r) => r.holds ?? [])
          .filter((h) => h.status === "ACTIVE")
          .flatMap((h) => h.allocations)
          .filter((a) => same(a.balanceId, balance._id))
          .map((a) => a.quantityBase),
      );
      qty = qty.plus(
        positive((await freeQuantity(balance, session)).minus(held)),
      );
    }
    if (!qty.gt(0)) continue;
    total = total.plus(qty);
    if (canAccessWarehouse(user, warehouse._id))
      options.push({
        warehouseId: String(warehouse._id),
        qtyBase: qty.toFixed(),
      });
    else restricted = restricted.plus(qty);
  }
  return {
    otherWarehouseAvailableQtyBase: total.toFixed(),
    restrictedOtherWarehouseQtyBase: restricted.toFixed(),
    otherWarehouseOptions: options,
  };
}

// No browser-provided stock numbers enter this calculation.
export async function evaluateLines(user, input, session, options = {}) {
  if (!options.internal)
    requirePermission(
      user,
      options.permission ??
        (input.requestId
          ? "replenishment_request:read"
          : "replenishment_request:create"),
    );
  requireWarehouseAccess(user, input.warehouseId);
  if (
    !(await m.Warehouse.exists({
      _id: input.warehouseId,
      isActive: true,
    }).session(session))
  )
    throw validationError("Kho không hoạt động");
  if (input.requestId) {
    const own = await m.ReplenishmentRequest.findById(input.requestId).session(
      session,
    );
    if (
      !own ||
      !canAccessWarehouse(user, own.header.warehouseId) ||
      (!options.internal &&
        !same(own.createdBy, user._id) &&
        !["OWNER", "ACCOUNTANT"].includes(currentRole(user)?.code))
    )
      throw validationError("Phiếu đang sửa không thuộc phạm vi");
  }
  const result = new Array(input.lines.length);
  const ordered = input.lines
    .map((line, index) => ({ line, index }))
    .sort(
      (a, b) =>
        Number(b.line.source?.triggerType === "SALES_SHORTAGE") -
          Number(a.line.source?.triggerType === "SALES_SHORTAGE") ||
        a.index - b.index,
    );
  for (const { index, line } of ordered) {
    const product = await m.Product.findById(line.productId).session(session);
    if (!product?.isActive) throw validationError("Sản phẩm không hoạt động");
    const resolved = await resolveSource(
      { ...line, lineNo: index + 1 },
      input.warehouseId,
      user,
      session,
      options,
    );
    let available = exact("0"),
      ownReserved = exact("0"),
      deferred = exact("0");
    const locations = await m.WarehouseLocation.find({
      warehouseId: input.warehouseId,
      isActive: true,
      locationType: { $in: ["STORAGE", "RECEIVING", "STAGING"] },
    }).session(session);
    const points = await m.StockHoldingPoint.find({
      type: "LOCATION",
      locationId: { $in: locations.map((l) => l._id) },
    }).session(session);
    const batches = await m.ProductBatch.find({
      productId: product._id,
      identificationStatus: "VERIFIED",
      ...(resolved.item?.lotId && { _id: resolved.item.lotId }),
    }).session(session);
    const balances = await m.InventoryBalance.find({
      holdingPointId: { $in: points.map((p) => p._id) },
      batchId: { $in: batches.map((b) => b._id) },
      qualityStatus: "GOOD",
      ownerType: "STORE",
    }).session(session);
    for (const balance of balances) {
      const point = points.find((p) => same(p._id, balance.holdingPointId));
      if (
        await m.StocktakeLocationLock.exists({
          locationId: point.locationId,
          status: "LOCKED",
        }).session(session)
      )
        continue;
      const location = locations.find((l) => same(l._id, point.locationId));
      const reports = await m.DefectReport.find({
        "holds.allocations.balanceId": balance._id,
      }).session(session);
      const held = sum(
        reports
          .flatMap((r) => r.holds ?? [])
          .filter((h) => h.status === "ACTIVE")
          .flatMap((h) => h.allocations)
          .filter((a) => same(a.balanceId, balance._id))
          .map((a) => a.quantityBase),
      );
      const free = positive((await freeQuantity(balance, session)).minus(held));
      if (location.locationType === "STORAGE" && location.isPickable)
        available = available.plus(free);
      else deferred = deferred.plus(free);
      if (resolved.so) {
        const reservations = await m.StockReservation.find({
          balanceId: balance._id,
          "demandRef.documentType": "sales_orders",
          "demandRef.documentId": resolved.so._id,
          "demandRef.itemId": resolved.item._id,
        }).session(session);
        ownReserved = ownReserved.plus(
          sum(reservations.map(remainingReservation)),
        );
      }
    }
    const requests = await m.ReplenishmentRequest.find({
      workflowStatus: { $in: activeRequests },
      ...(input.requestId && { _id: { $ne: input.requestId } }),
      "items.productId": product._id,
    }).session(session);
    let pending = exact("0");
    const relatedRequests = [],
      relatedFingerprint = [];
    for (const rr of requests) {
      const po = await m.PurchaseOrder.findOne({
        replenishmentRequestId: rr._id,
      }).session(session);
      for (const item of rr.items.filter((i) =>
        same(i.productId, product._id),
      )) {
        const key = await canonicalSaved(rr, item, session);
        const matches =
          resolved.source.triggerType === "MANUAL_OTHER"
            ? same(rr.header.warehouseId, input.warehouseId)
            : key === resolved.canonicalKey;
        if (!matches) continue;
        const qty = pendingRequestQuantity(rr, item, po);
        pending = pending.plus(qty);
        relatedFingerprint.push([
          String(rr._id),
          rr.version,
          qty.toFixed(),
          po?.version ?? null,
        ]);
        if (
          qty.gt(0) &&
          canAccessWarehouse(user, rr.header.warehouseId) &&
          (["OWNER", "ACCOUNTANT"].includes(currentRole(user)?.code) ||
            same(rr.createdBy, user._id))
        )
          relatedRequests.push({
            id: String(rr._id),
            documentNo: rr.documentNo,
            workflowStatus: rr.workflowStatus,
            qtyBase: qty.toFixed(),
          });
      }
    }
    let incoming = exact("0"),
      sharedIncoming = exact("0");
    const supplies =
      resolved.source.triggerType === "MANUAL_OTHER"
        ? []
        : await expectedSupply(product._id, input, session);
    const allocations = await m.SupplyAllocation.find({}).session(session);
    const deadline = new Date(input.neededOn + "T23:59:59+07:00");
    const ownAllocation = (a) =>
      resolved.so &&
      a.demandRef.documentType === "sales_orders" &&
      same(a.demandRef.documentId, resolved.so._id) &&
      same(a.demandRef.itemId, resolved.item._id);
    for (const supply of supplies) {
      const relevant =
        supply.canonicalKey === resolved.canonicalKey ||
        same(supply.warehouseId, input.warehouseId);
      const linked = allocations.filter(
        (a) =>
          a.sourceRef.documentType === supply.documentType &&
          same(a.sourceRef.documentId, supply.documentId) &&
          same(a.sourceRef.itemId, supply.itemId),
      );
      const outstanding = (a) =>
        positive(
          number(a.allocatedQty)
            .minus(a.receivedAssignedQty)
            .minus(a.releasedQty),
        );
      if (sum(linked.map(outstanding)).gt(supply.outstanding))
        throw reviewRequired([], "Phân bổ nguồn cung vượt lượng còn hiệu lực");
      let timely = exact("0");
      for (const slice of supply.slices) {
        if (!slice.date || !Number.isFinite(new Date(slice.date).getTime())) {
          if (relevant && slice.quantity.gt(0))
            throw reviewRequired(
              [],
              "Nguồn đang về chưa có ngày dự kiến để kiểm hạn",
            );
        } else if (new Date(slice.date) <= deadline)
          timely = timely.plus(slice.quantity);
      }
      const other = sum(
        linked.filter((a) => !ownAllocation(a)).map(outstanding),
      );
      const own = sum(linked.filter(ownAllocation).map(outstanding));
      const free = positive(timely.minus(other).minus(own));
      if (resolved.so && supply.canonicalKey === resolved.canonicalKey)
        incoming = incoming.plus(positive(timely.minus(other)));
      else {
        incoming = incoming.plus(min(positive(timely.minus(other)), own));
        if (
          same(supply.warehouseId, input.warehouseId) &&
          !supply.canonicalKey?.startsWith("SO:")
        )
          sharedIncoming = sharedIncoming.plus(free);
      }
      relatedFingerprint.push([
        supply.documentType,
        String(supply.documentId),
        String(supply.itemId),
        supply.version,
        timely.toFixed(),
        other.toFixed(),
        own.toFixed(),
      ]);
    }
    let remaining = exact("0"),
      minimum = null,
      target = null;
    if (resolved.so) {
      const demand = await salesDemand(resolved.so, resolved.item, session);
      remaining = demand.remaining;
      // The SO ceiling is global: already reserved for this source in another
      // warehouse must not produce another purchase at the selected warehouse.
      ownReserved = demand.reserved;
    } else if (resolved.source.triggerType !== "MANUAL_OTHER") {
      const threshold = product.stockThresholds.find((t) =>
        same(t.warehouseId, input.warehouseId),
      );
      if (!threshold)
        throw validationError("Chưa cấu hình ngưỡng tồn cho kho/sản phẩm");
      minimum = String(threshold.minimumQty);
      target = String(threshold.targetQty);
      remaining = available.lt(minimum) ? exact(target) : exact("0");
    }
    const priorNeed =
      resolved.source.triggerType === "MANUAL_OTHER"
        ? exact("0")
        : await earlierSalesNeed(
            product._id,
            resolved,
            requests,
            supplies,
            deadline,
            session,
          );
    const physical = available.plus(deferred);
    const freePhysical = positive(physical.minus(priorNeed));
    const priorIncoming = positive(priorNeed.minus(physical));
    const freeIncoming = positive(sharedIncoming.minus(priorIncoming));
    const onHand = min(
      positive(remaining.minus(ownReserved).minus(pending).minus(incoming)),
      freePhysical,
    );
    const genericIncomingUsed = min(
      positive(
        remaining
          .minus(ownReserved)
          .minus(pending)
          .minus(incoming)
          .minus(onHand),
      ),
      freeIncoming,
    );
    incoming = incoming.plus(genericIncomingUsed);
    const suggested = positive(
      remaining.minus(onHand).minus(ownReserved).minus(incoming).minus(pending),
    );
    // Stock elsewhere is an option until an authorized TR/allocation exists;
    // showing the option does not invent a transport plan or consume its stock.
    const otherOptions = await otherWarehouseOptions(
      product,
      input.warehouseId,
      resolved.item?.lotId,
      user,
      session,
    );
    const stable = {
      canonicalKey: resolved.canonicalKey,
      warehouseId: String(input.warehouseId),
      neededOn: input.neededOn,
      productId: String(product._id),
      source: resolved.source,
      availableQtyBase: available.toFixed(),
      onHandCoverageQtyBase: onHand.toFixed(),
      otherWarehouseCoverageQtyBase: "0",
      reservedForDemandQtyBase: ownReserved.toFixed(),
      remainingDemandQtyBase: remaining.toFixed(),
      incomingCoverageQtyBase: incoming.toFixed(),
      pendingRequestCoverageQtyBase: pending.toFixed(),
      suggestedQtyBase: suggested.toFixed(),
      minimumQtyBase: minimum,
      targetQtyBase: target,
      warningRequired:
        resolved.source.triggerType === "MANUAL_OTHER" && pending.gt(0),
      quantityState: "KNOWN",
      ...otherOptions,
      supplyStatus: suggested.lte(0)
        ? "COVERED"
        : number(otherOptions.otherWarehouseAvailableQtyBase).gt(0)
          ? "OPTIONS_AVAILABLE"
          : onHand.plus(ownReserved).plus(incoming).plus(pending).gt(0)
            ? "PARTIAL"
            : "NONE",
    };
    result[index] = {
      lineNo: index + 1,
      ...stable,
      evaluationKey: sha256Json({
        ...stable,
        relatedFingerprint,
        productUpdatedAt: product.updatedAt,
      }),
      evaluatedAt: new Date().toISOString(),
      relatedRequests,
    };
  }
  return result;
}
