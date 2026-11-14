import {
  ReplenishmentRequest,
  PurchaseOrder,
  ApprovalHistory,
  Warehouse,
  User,
  Product,
  Uom,
  SalesOrder,
  Stocktake,
} from "../../models/runtime.js";
import { requirePermission } from "../../shared/utils/access.js";
import { dto, page, serialize } from "../../shared/utils/persistence.js";
import { notFoundError } from "../../shared/utils/ApiError.js";
import { escapeRegex } from "../../shared/utils/domain.js";
import { replenishmentScope } from "./replenishment.access.js";
import { readRequest } from "./replenishment.commands.js";
import { creationDateRange } from "./replenishment.validation.js";

export async function listReplenishments(user, query) {
  requirePermission(user, "replenishment_request:read");
  const filter = replenishmentScope(user);
  const and = [];
  if (query.warehouseId) and.push({ "header.warehouseId": query.warehouseId });
  if (query.createdBy) and.push({ createdBy: query.createdBy });
  if (query.status) filter.workflowStatus = query.status;
  if (query.search)
    filter.documentNo = new RegExp(escapeRegex(query.search), "i");
  const dateRange = creationDateRange(query);
  if (dateRange) filter.createdAt = dateRange;
  const hasPo = query.hasPurchaseOrder ?? query.poCreated;
  if (hasPo !== undefined) {
    const ids = await PurchaseOrder.find({}).distinct("replenishmentRequestId");
    filter._id = { [hasPo ? "$in" : "$nin"]: ids };
  }
  if (query.approvalDecision) {
    const status = {
      APPROVE: "APPROVED",
      REJECT: "REJECTED",
      REVISE: "REVISION_REQUIRED",
    }[query.approvalDecision];
    and.push(
      status
        ? { workflowStatus: status }
        : { "header.latestDecisionId": { $exists: false } },
    );
  }
  if (and.length) filter.$and = and;
  const paged = await page(ReplenishmentRequest, filter, query);
  const warehouseIds = [
    ...new Set(
      paged.items.map((row) => row.header?.warehouseId).filter(Boolean),
    ),
  ];
  const userIds = [
    ...new Set(paged.items.map((row) => row.createdBy).filter(Boolean)),
  ];
  const productIds = [
    ...new Set(
      paged.items
        .flatMap((row) => (row.items || []).map((it) => it.productId))
        .filter(Boolean),
    ),
  ];
  const [warehouses, users, products] = await Promise.all([
    warehouseIds.length
      ? Warehouse.find({ _id: { $in: warehouseIds } })
          .select("_id code name")
          .lean()
      : [],
    userIds.length
      ? User.find({ _id: { $in: userIds } })
          .select("_id fullName")
          .lean()
      : [],
    productIds.length
      ? Product.find({ _id: { $in: productIds } })
          .select("_id sku name isActive imageUrls")
          .lean()
      : [],
  ]);
  const warehouseMap = new Map(warehouses.map((w) => [String(w._id), w]));
  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const productMap = new Map(products.map((p) => [String(p._id), p]));
  paged.items = paged.items.map((item) => {
    const w = warehouseMap.get(String(item.header?.warehouseId));
    const u = userMap.get(String(item.createdBy));
    const items = (item.items || []).map((line) => {
      const prod = productMap.get(String(line.productId));
      return {
        ...line,
        productSkuSnapshot: prod?.sku || line.productSkuSnapshot,
        productNameSnapshot: line.productNameSnapshot || prod?.name,
        productIsActive: prod?.isActive,
        productImageUrl: prod?.imageUrls?.[0] || null,
      };
    });
    return {
      ...item,
      items,
      ...(w && {
        warehouse: { id: String(w._id), code: w.code, name: w.name },
      }),
      ...(u && { createdByUser: { id: String(u._id), fullName: u.fullName } }),
    };
  });
  return paged;
}
export async function getReplenishment(user, id) {
  requirePermission(user, "replenishment_request:read");
  const document = await readRequest(id, user);
  const approvals = await ApprovalHistory.find({
    subjectType: "replenishment_requests",
    subjectId: id,
  })
    .sort({ recordedAt: -1 })
    .lean();
  const purchaseOrders = await PurchaseOrder.find({
    replenishmentRequestId: id,
  })
    .select("_id documentNo workflowStatus")
    .lean();

  const warehouseId = document.header?.warehouseId;
  const warehouse = warehouseId
    ? await Warehouse.findById(warehouseId).select("_id code name").lean()
    : null;

  const productIds = [
    ...new Set(
      (document.items || []).map((it) => it.productId).filter(Boolean),
    ),
  ];
  const sourceDocIds = [
    ...new Set(
      (document.items || [])
        .map((it) => it.details?.source?.documentId)
        .filter(Boolean),
    ),
  ];

  const userIds = [
    document.createdBy,
    document.header?.submittedBy,
    ...approvals.map((a) => a.requestedBy),
    ...approvals.map((a) => a.decidedBy),
  ].filter(Boolean);
  const [users, products, salesOrders, stocktakes] = await Promise.all([
    User.find({ _id: { $in: userIds } })
      .select("_id fullName")
      .lean(),
    productIds.length
      ? Product.find({ _id: { $in: productIds } })
          .select("_id sku name isActive imageUrls wholeBaseUnits")
          .lean()
      : [],
    sourceDocIds.length
      ? SalesOrder.find({ _id: { $in: sourceDocIds } })
          .select("_id documentNo workflowStatus version")
          .lean()
      : [],
    sourceDocIds.length
      ? Stocktake.find({ _id: { $in: sourceDocIds } })
          .select("_id documentNo workflowStatus version")
          .lean()
      : [],
  ]);
  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const productMap = new Map(products.map((p) => [String(p._id), p]));
  const sourceDocMap = new Map(
    [...salesOrders, ...stocktakes].map((d) => [String(d._id), d]),
  );

  const mappedWarehouse = warehouse
    ? { id: String(warehouse._id), code: warehouse.code, name: warehouse.name }
    : undefined;
  const createdByUser = userMap.get(String(document.createdBy));
  const submittedByUser = document.header?.submittedBy
    ? userMap.get(String(document.header.submittedBy))
    : undefined;

  const mappedApprovals = approvals.map((approval) => {
    const appDto = dto(approval);
    const req = userMap.get(String(approval.requestedBy));
    const dec = userMap.get(String(approval.decidedBy));
    const lines = (appDto.itemDecisions || []).map((d) => ({
      lineId: String(d.itemId || d.lineId || ""),
      approvedQtyBase:
        d.approvedQtyBase != null ? String(d.approvedQtyBase) : null,
      outcome: d.outcome,
      reason: d.reason,
    }));
    return {
      ...appDto,
      lines,
      ...(req && {
        requestedByUser: {
          id: String(approval.requestedBy),
          fullName: req.fullName,
        },
      }),
      ...(dec && {
        decidedByUser: {
          id: String(approval.decidedBy),
          fullName: dec.fullName,
        },
      }),
    };
  });

  const baseDoc = dto(document);
  const areaByCode = new Map(
    (await Uom.find({ areaMm2: { $ne: null } }).select("code areaMm2").lean())
      .map((u) => [u.code, String(u.areaMm2)]),
  );
  if (baseDoc.items) {
    baseDoc.items = baseDoc.items.map((item) => {
      const prod = productMap.get(String(item.productId));
      const sourceDoc = item.details?.source?.documentId
        ? sourceDocMap.get(String(item.details.source.documentId))
        : null;

      const details = item.details
        ? {
            ...item.details,
            ...(sourceDoc && {
              source: {
                ...item.details.source,
                documentNo: sourceDoc.documentNo,
                workflowStatus: sourceDoc.workflowStatus,
                version: sourceDoc.version,
              },
            }),
          }
        : item.details;

      return {
        ...item,
        productSkuSnapshot: prod?.sku || item.productSkuSnapshot,
        productNameSnapshot: item.productNameSnapshot || prod?.name,
        productIsActive: prod?.isActive,
        productImageUrl: prod?.imageUrls?.[0] || null,
        productWholeBaseUnits: prod?.wholeBaseUnits,
        enteredUomAreaMm2: areaByCode.get(item.enteredUnit) ?? null,
        details,
      };
    });
  }

  return {
    ...baseDoc,
    ...(mappedWarehouse && { warehouse: mappedWarehouse }),
    ...(createdByUser && {
      createdByUser: {
        id: String(document.createdBy),
        fullName: createdByUser.fullName,
      },
    }),
    ...(submittedByUser && {
      submittedByUser: {
        id: String(document.header.submittedBy),
        fullName: submittedByUser.fullName,
      },
    }),
    approvals: mappedApprovals,
    purchaseOrders: purchaseOrders.map(dto),
  };
}
export async function listReplenishmentSubmissions(user, id, query) {
  requirePermission(user, "replenishment_request:read");
  const document = await readRequest(id, user);
  const submissions = [...(document.submissions || [])].sort(
    (a, b) => b.documentVersion - a.documentVersion,
  );
  return {
    items: serialize(
      submissions.slice(
        (query.page - 1) * query.limit,
        query.page * query.limit,
      ),
    ),
    total: submissions.length,
    page: query.page,
    limit: query.limit,
  };
}
export async function getReplenishmentSubmission(user, id, version) {
  requirePermission(user, "replenishment_request:read");
  const document = await readRequest(id, user);
  const submission = document.submissions?.find(
    (row) => row.documentVersion === Number(version),
  );
  if (!submission) throw notFoundError("Không tìm thấy lần gửi");
  return serialize(submission);
}
