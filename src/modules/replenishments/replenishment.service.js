import {
  BusinessDocument,
  DocumentLine,
  Approval,
  User,
  Warehouse,
  Product,
  ProductUomVersion,
  Uom,
  DocumentLink,
  LineLink,
  Reservation,
  DemandSupplyAllocation,
  REPLENISHMENT_RELATIONS,
} from "../../models/index.js";
import { ApiError } from "../../shared/utils/ApiError.js";
import {
  replenishmentScope,
  objectId,
  idString,
  sameId,
  canReadRelated,
  canAccessWarehouse,
} from "./replenishment.access.js";
import { creationDateRange } from "./replenishment.validation.js";
import { getCurrentAvailability } from "./replenishment.availability.js";
import {
  indexById,
  mapHeader,
  mapApproval,
  mapLine,
  mapUser,
  mapSavedSource,
  mapEvaluationSnapshot,
  mapRelatedReference,
  decimalString,
  isoDate,
} from "./replenishment.mapper.js";

const APPROVAL_KIND = "REPLENISHMENT_APPROVAL";
export const approvalSort = { documentVersion: -1, decidedAt: -1, _id: -1 };
const distinctIds = (values) => [
  ...new Set(values.filter((value) => value != null).map(idString)),
];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function latestApprovalLookup() {
  return [
    {
      $lookup: {
        from: Approval.collection.name,
        let: { documentId: "$_id" },
        pipeline: [
          {
            $match: {
              decisionKind: APPROVAL_KIND,
              $expr: { $eq: ["$documentId", "$$documentId"] },
            },
          },
          { $sort: approvalSort },
          { $limit: 1 },
        ],
        as: "_approvals",
      },
    },
    {
      $set: {
        _latestApproval: {
          $ifNull: [{ $arrayElemAt: ["$_approvals", 0] }, null],
        },
      },
    },
    { $unset: "_approvals" },
  ];
}

export function buildListPipeline(user, query) {
  const scope = replenishmentScope(user);
  if (query.warehouseId) {
    if (!canAccessWarehouse(user, query.warehouseId)) {
      throw new ApiError(403, "Bạn không có quyền xem kho này");
    }
    scope["header.warehouseId"] = objectId(query.warehouseId);
  }
  const filters = {};
  if (query.createdBy) filters.createdBy = objectId(query.createdBy);
  if (query.status) filters.workflowStatus = query.status;
  if (query.search)
    filters.documentNo = { $regex: escapeRegex(query.search), $options: "i" };
  const range = creationDateRange(query);
  if (range) filters.createdAt = range;
  const pipeline = [
    { $match: { $and: [scope, filters] } },
    { $sort: { createdAt: -1, _id: -1 } },
  ];
  if (query.approvalDecision) {
    pipeline.push(...latestApprovalLookup(), {
      $match:
        query.approvalDecision === "NONE"
          ? { _latestApproval: null }
          : { "_latestApproval.decision": query.approvalDecision },
    });
  }
  pipeline.push({
    $facet: {
      items: [
        { $skip: (query.page - 1) * query.limit },
        { $limit: query.limit },
        ...(!query.approvalDecision ? latestApprovalLookup() : []),
        {
          $lookup: {
            from: DocumentLine.collection.name,
            let: { documentId: "$_id" },
            pipeline: [
              {
                $match: {
                  lineKind: "REPLENISHMENT",
                  $expr: { $eq: ["$documentId", "$$documentId"] },
                },
              },
              { $sort: { lineNo: 1 } },
              { $limit: 3 },
            ],
            as: "_linePreview",
          },
        },
        {
          $lookup: {
            from: DocumentLine.collection.name,
            let: { documentId: "$_id" },
            pipeline: [
              {
                $match: {
                  lineKind: "REPLENISHMENT",
                  $expr: { $eq: ["$documentId", "$$documentId"] },
                },
              },
              { $count: "value" },
            ],
            as: "_lineCount",
          },
        },
      ],
      total: [{ $count: "value" }],
    },
  });
  return pipeline;
}

async function loadMasters(documents, lines, approvals = []) {
  const userIds = distinctIds([
    ...documents.flatMap((item) => [item.createdBy, item.header?.submittedBy]),
    ...approvals.flatMap((item) => [item.requestedBy, item.decidedBy]),
  ]);
  const [users, warehouses, products, conversions] = await Promise.all([
    User.find({ _id: { $in: userIds } })
      .select("_id fullName")
      .lean(),
    Warehouse.find({
      _id: {
        $in: distinctIds(documents.map((item) => item.header?.warehouseId)),
      },
    })
      .select("_id code name")
      .lean(),
    Product.find({
      _id: { $in: distinctIds(lines.map((item) => item.productId)) },
    })
      .select("_id sku name baseUomId isActive")
      .lean(),
    ProductUomVersion.find({
      _id: { $in: distinctIds(lines.map((item) => item.conversionId)) },
    })
      .select("_id uomId version")
      .lean(),
  ]);
  const uoms = await Uom.find({
    _id: {
      $in: distinctIds([
        ...products.map((item) => item.baseUomId),
        ...conversions.map((item) => item.uomId),
      ]),
    },
  })
    .select("_id code name")
    .lean();
  return {
    users: indexById(users),
    warehouses: indexById(warehouses),
    products: indexById(products),
    conversions: indexById(conversions),
    uoms: indexById(uoms),
  };
}

export async function listReplenishments(user, query) {
  const [result] = await BusinessDocument.aggregate(
    buildListPipeline(user, query),
  ).allowDiskUse(true);
  const documents = result?.items || [];
  const previews = documents.flatMap((item) => item._linePreview);
  const masters = await loadMasters(
    documents,
    previews,
    documents.map((item) => item._latestApproval).filter(Boolean),
  );
  return {
    items: documents.map((document) => ({
      ...mapHeader(document, masters),
      lineCount: document._lineCount[0]?.value ?? 0,
      linePreview: document._linePreview.map((line) => mapLine(line, masters)),
      latestDecision: mapApproval(
        document._latestApproval,
        document.version,
        masters.users,
      ),
    })),
    total: result?.total[0]?.value ?? 0,
    page: query.page,
    limit: query.limit,
  };
}

// Resolve only stored references. There is no evaluation, pending-RR creation,
// receipt-progress calculation or demand/supply total in this read model.
async function loadRelations(document, lines, user) {
  const rrLineIds = lines.map((line) => line._id);
  const [documentLinks, lineLinks, sourceLines] = await Promise.all([
    DocumentLink.find({
      $or: [
        { parentDocumentId: document._id },
        { childDocumentId: document._id },
      ],
      relationCode: { $in: Object.values(REPLENISHMENT_RELATIONS) },
    }).lean(),
    LineLink.find({
      $or: [
        { sourceLineId: { $in: rrLineIds } },
        { targetLineId: { $in: rrLineIds } },
      ],
      relationCode: { $in: Object.values(REPLENISHMENT_RELATIONS) },
    }).lean(),
    DocumentLine.find({
      _id: {
        $in: distinctIds(
          lines.flatMap((line) => [
            line.details?.sourceSalesOrderLineId,
            line.details?.sourceIssueRequestLineId,
          ]),
        ),
      },
    }).lean(),
  ]);
  const purchaseLinks = lineLinks.filter(
    (link) =>
      link.relationCode === REPLENISHMENT_RELATIONS.PURCHASE &&
      rrLineIds.some((id) => sameId(id, link.sourceLineId)),
  );
  const [purchaseLines, wirLines] = await Promise.all([
    DocumentLine.find({
      _id: { $in: distinctIds(purchaseLinks.map((link) => link.targetLineId)) },
    }).lean(),
    DocumentLine.find({
      lineKind: "ISSUE_REQUEST",
      "details.salesOrderLineId": {
        $in: sourceLines
          .filter((line) => line.lineKind === "SALES_ORDER")
          .map((line) => line._id),
      },
    }).lean(),
  ]);
  const relatedDocumentIds = distinctIds([
    ...documentLinks.flatMap((link) => [
      link.parentDocumentId,
      link.childDocumentId,
    ]),
    ...sourceLines.map((line) => line.documentId),
    ...wirLines.map((line) => line.documentId),
    ...purchaseLines.map((line) => line.documentId),
    ...lines.map((line) => line.details?.sourceStocktakeId),
  ]).filter((id) => id !== idString(document._id));
  const documents = indexById(
    await BusinessDocument.find({ _id: { $in: relatedDocumentIds } }).lean(),
  );
  const sources = indexById(sourceLines);
  const canonical = new Map();
  for (const rrLine of lines) {
    const source = sources.get(
      idString(rrLine.details?.sourceSalesOrderLineId),
    );
    const parent = documents.get(idString(source?.documentId));
    if (
      source?.lineKind === "SALES_ORDER" &&
      parent?.documentKind === "SALES_ORDER" &&
      sameId(source.productId, rrLine.productId) &&
      canReadRelated(parent, user)
    ) {
      canonical.set(idString(source._id), source._id);
    }
  }
  // Only genuine WIR releases of the same SO/product may extend its demand IDs.
  for (const line of wirLines) {
    const source = sources.get(idString(line.details.salesOrderLineId));
    const wir = documents.get(idString(line.documentId));
    if (
      canonical.has(idString(source?._id)) &&
      wir?.documentKind === "ISSUE_REQUEST" &&
      sameId(wir.header?.salesOrderId, source.documentId) &&
      sameId(line.productId, source.productId) &&
      canReadRelated(wir, user)
    )
      canonical.set(idString(line._id), source._id);
  }
  const demandIds = [...canonical.keys()];
  const [reservations, allocations] = await Promise.all([
    Reservation.find({ demandLineId: { $in: demandIds }, status: "ACTIVE" })
      .sort({ _id: 1 })
      .lean(),
    DemandSupplyAllocation.find({ demandLineId: { $in: demandIds } })
      .sort({ _id: 1 })
      .lean(),
  ]);
  const supplyLines = indexById(
    await DocumentLine.find({
      _id: { $in: distinctIds(allocations.map((item) => item.supplyLineId)) },
    }).lean(),
  );
  const supplyDocuments = await BusinessDocument.find({
    _id: {
      $in: distinctIds(
        [...supplyLines.values()].map((line) => line.documentId),
      ),
    },
  }).lean();
  for (const item of supplyDocuments) documents.set(idString(item._id), item);
  return {
    documents,
    sources,
    purchaseLines: indexById(purchaseLines),
    documentLinks,
    lineLinks,
    purchaseLinks,
    canonical,
    reservations,
    allocations,
    supplyLines,
  };
}

function sourceReferences(line, relations, user) {
  const details = line.details || {};
  const references = [];
  for (const [field, kind] of [
    ["sourceSalesOrderLineId", "SALES_ORDER"],
    ["sourceIssueRequestLineId", "ISSUE_REQUEST"],
  ]) {
    if (!details[field]) continue;
    const source = relations.sources.get(idString(details[field]));
    const document = relations.documents.get(idString(source?.documentId));
    const salesSource = relations.sources.get(
      idString(details.sourceSalesOrderLineId),
    );
    const sameChain =
      kind !== "ISSUE_REQUEST" ||
      (salesSource?.lineKind === "SALES_ORDER" &&
        sameId(source?.details?.salesOrderLineId, salesSource._id) &&
        sameId(document?.header?.salesOrderId, salesSource.documentId));
    const readable =
      sameChain &&
      source?.lineKind === kind &&
      sameId(source.productId, line.productId) &&
      document?.documentKind === kind &&
      canReadRelated(document, user);
    references.push({
      lineId: idString(details[field]),
      documentKind: kind,
      access: readable ? "READABLE" : "UNAVAILABLE",
      ...(readable && {
        document: mapRelatedReference(
          source.documentId,
          kind,
          relations.documents,
          user,
        ),
      }),
    });
  }
  if (details.sourceStocktakeId) {
    references.push(
      mapRelatedReference(
        details.sourceStocktakeId,
        "STOCKTAKE",
        relations.documents,
        user,
      ),
    );
  }
  return references;
}

function mapRelations(document, lines, relations, user) {
  const poIds = distinctIds([
    ...relations.documentLinks
      .filter(
        (link) =>
          sameId(link.parentDocumentId, document._id) &&
          link.relationCode === REPLENISHMENT_RELATIONS.PURCHASE,
      )
      .map((link) => link.childDocumentId),
    ...[...relations.purchaseLines.values()].map((line) => line.documentId),
  ]).sort();
  const canonicalId = (item) =>
    idString(relations.canonical.get(idString(item.demandLineId)));
  const rrLineIds = new Set(lines.map((line) => idString(line._id)));
  return {
    reservations: relations.reservations.map((item) => ({
      id: idString(item._id),
      demandLineId: idString(item.demandLineId),
      canonicalSalesOrderLineId: canonicalId(item),
      qtyBase: decimalString(item.qtyBase),
      status: item.status,
    })),
    allocations: relations.allocations.map((item) => {
      const supply = relations.supplyLines.get(idString(item.supplyLineId));
      const parent = relations.documents.get(idString(supply?.documentId));
      const demand = relations.sources.get(canonicalId(item));
      const reference =
        supply &&
        sameId(supply.productId, demand?.productId) &&
        canReadRelated(parent, user)
          ? mapRelatedReference(
              supply.documentId,
              null,
              relations.documents,
              user,
            )
          : null;
      return {
        id: idString(item._id),
        demandLineId: idString(item.demandLineId),
        canonicalSalesOrderLineId: canonicalId(item),
        qtyBase: decimalString(item.qtyBase),
        status: item.status,
        supply: reference
          ? {
              lineId: idString(supply._id),
              document: reference,
              access: "READABLE",
            }
          : { access: "UNAVAILABLE" },
      };
    }),
    purchaseReferences: poIds.map((id) =>
      mapRelatedReference(id, "PO", relations.documents, user),
    ),
    sourceLineLinks: relations.lineLinks
      .filter(
        (link) =>
          rrLineIds.has(idString(link.targetLineId)) &&
          link.relationCode !== REPLENISHMENT_RELATIONS.PURCHASE,
      )
      .map((link) => ({
        id: idString(link._id),
        relationCode: link.relationCode,
        sourceLineId: idString(link.sourceLineId),
        replenishmentLineId: idString(link.targetLineId),
        linkedQtyBase: decimalString(link.linkedQty),
      })),
    purchaseLineLinks: relations.purchaseLinks.map((link) => {
      const target = relations.purchaseLines.get(idString(link.targetLineId));
      return {
        id: idString(link._id),
        replenishmentLineId: idString(link.sourceLineId),
        purchaseLineId: idString(link.targetLineId),
        linkedQtyBase: decimalString(link.linkedQty),
        purchaseOrder: target
          ? mapRelatedReference(
              target.documentId,
              "PO",
              relations.documents,
              user,
            )
          : null,
      };
    }),
    sourceDocumentLinks: relations.documentLinks
      .filter((link) => sameId(link.childDocumentId, document._id))
      .map((link) => {
        const kind = {
          [REPLENISHMENT_RELATIONS.SALES_ORDER]: "SALES_ORDER",
          [REPLENISHMENT_RELATIONS.STOCKTAKE]: "STOCKTAKE",
          [REPLENISHMENT_RELATIONS.ISSUE_REQUEST]: "ISSUE_REQUEST",
        }[link.relationCode];
        return {
          relationCode: link.relationCode,
          source: mapRelatedReference(
            link.parentDocumentId,
            kind ?? null,
            relations.documents,
            user,
          ),
        };
      }),
  };
}

export async function getReplenishment(user, id) {
  const document = await BusinessDocument.findOne({
    ...replenishmentScope(user),
    _id: objectId(id),
  }).lean();
  if (!document) throw new ApiError(404, "Không tìm thấy yêu cầu bổ sung hàng");
  const [lines, approvals] = await Promise.all([
    DocumentLine.find({ documentId: document._id, lineKind: "REPLENISHMENT" })
      .sort({ lineNo: 1 })
      .lean(),
    Approval.find({ documentId: document._id, decisionKind: APPROVAL_KIND })
      .sort(approvalSort)
      .lean(),
  ]);
  const [masters, availability, relations] = await Promise.all([
    loadMasters([document], lines, approvals),
    getCurrentAvailability(
      document.header.warehouseId,
      lines.map((line) => line.productId),
    ),
    loadRelations(document, lines, user),
  ]);
  const currentApproval = approvals.find(
    (approval) => approval.documentVersion === document.version,
  );
  const approvedLines = indexById(
    (currentApproval?.decision === "APPROVE"
      ? currentApproval.lines || []
      : []
    ).map((line) => ({ ...line, _id: line.lineId })),
  );
  return {
    ...mapHeader(document, masters),
    updatedAt: isoDate(document.updatedAt),
    submittedBy: mapUser(document.header.submittedBy, masters.users),
    submittedAt: isoDate(document.header.submittedAt),
    triggerReason: document.header.triggerReason,
    note: document.note ?? null,
    lines: lines.map((line) => {
      const mapped = mapLine(line, masters);
      return {
        ...mapped,
        approvedQtyBase: decimalString(
          approvedLines.get(idString(line._id))?.approvedQty,
        ),
        reasonNote: line.details?.reasonNote ?? null,
        quantityAdjustmentReason:
          line.details?.quantityAdjustmentReason ?? null,
        source: {
          ...mapSavedSource(line.details),
          references: sourceReferences(line, relations, user),
        },
        evaluationSnapshot: mapEvaluationSnapshot(line.details),
        currentStock: {
          warehouseId: idString(document.header.warehouseId),
          productId: idString(line.productId),
          scope: "PRODUCT_WAREHOUSE",
          baseUom: mapped.baseUom,
          availableQtyBase: availability.quantities.get(
            idString(line.productId),
          ),
          computedAt: isoDate(availability.computedAt),
        },
      };
    }),
    latestDecision: mapApproval(approvals[0], document.version, masters.users),
    approvalHistory: approvals.map((approval) =>
      mapApproval(approval, document.version, masters.users, true),
    ),
    ...mapRelations(document, lines, relations, user),
  };
}
