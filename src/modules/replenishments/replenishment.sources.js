import { Product, ProductBatch, SalesOrder, Stocktake, StocktakeSnapshot } from "../../models/runtime.js";
import { isOwner, requirePermission, requireWarehouseAccess } from "../../shared/utils/access.js";
import { page } from "../../shared/utils/persistence.js";
import { currentRole } from "../../shared/utils/userRole.js";
import { objectId, sameId } from "./replenishment.access.js";
import { requireEditableRequest } from "./replenishment.commands.js";

function itemLabel(item) {
  return item.productNameSnapshot ?? `Dòng ${item.lineNo ?? ""}`.trimEnd();
}

async function salesOrderOptions(user, query) {
  const { productId } = query;
  const broad = ["OWNER", "ACCOUNTANT"].includes(currentRole(user)?.code);
  const result = await page(SalesOrder, {
    workflowStatus: { $nin: ["CANCELLED", "REJECTED", "COMPLETED"] },
    ...(!broad && { createdBy: user._id }),
    ...(productId && { "items.productId": productId }),
  }, query, "documentNo version items._id items.productId items.productNameSnapshot items.lineNo");
  return {
    ...result,
    items: result.items.map((order) => ({
      id: order.id,
      documentNo: order.documentNo,
      documentType: "sales_orders",
      version: order.version,
      items: (order.items ?? [])
        .filter((item) => !productId || sameId(item.productId, productId))
        .map((item) => ({ id: item._id, productId: item.productId, label: itemLabel(item) })),
    })),
  };
}

function snapshotProductsLookup(productId) {
  return {
    $lookup: {
      from: StocktakeSnapshot.collection.name,
      localField: "_id",
      foreignField: "stocktakeId",
      pipeline: [
        {
          $lookup: {
            from: ProductBatch.collection.name,
            localField: "batchId",
            foreignField: "_id",
            pipeline: [
              ...(productId ? [{ $match: { productId } }] : []),
              { $project: { productId: 1, _id: 0 } },
            ],
            as: "batch",
          },
        },
        { $unwind: "$batch" },
        ...(productId ? [{ $limit: 1 }] : []),
        { $group: { _id: "$batch.productId" } },
      ],
      as: "snapshotProducts",
    },
  };
}

async function stocktakeOptions(user, query) {
  const { warehouseId, page, limit } = query;
  const productId = query.productId && objectId(query.productId);
  if (warehouseId) requireWarehouseAccess(user, warehouseId);
  const warehouseScope = warehouseId ? { "header.warehouseId": objectId(warehouseId) }
    : isOwner(user) ? { "header.warehouseId": { $type: "objectId" } }
    : { "header.warehouseId": { $in: (user.warehouseIds || []).map(objectId) } };
  const [result] = await Stocktake.aggregate([
    { $match: {
      ...warehouseScope,
      workflowStatus: { $in: ["COMPLETED", "CLOSED"] },
      "header.completedAt": { $type: "date" },
    } },
    { $sort: { createdAt: -1, _id: -1 } },
    { $project: { documentNo: 1, version: 1, "header.warehouseId": 1,
      "items.productId": 1, "items.productNameSnapshot": 1, "items.lineNo": 1 } },
    ...(productId ? [
      snapshotProductsLookup(productId),
      { $match: { $or: [{ "items.productId": productId }, { "snapshotProducts._id": productId }] } },
    ] : []),
    { $facet: {
      documents: [
        { $skip: (page - 1) * limit },
        { $limit: limit },
        ...(!productId ? [snapshotProductsLookup()] : []),
      ],
      count: [{ $count: "total" }],
    } },
  ]);
  const documents = result.documents;
  const snapshotProductIds = documents.flatMap((document) => document.snapshotProducts.map((row) => row._id));
  const products = await Product.find({ _id: { $in: snapshotProductIds } }).select("name").lean();
  const productNames = new Map(products.map((product) => [String(product._id), product.name]));
  return {
    items: documents.map((document) => {
      const labels = new Map(document.snapshotProducts.map(({ _id }) => {
        const id = String(_id);
        return [id, productNames.get(id) ?? id];
      }));
      for (const item of document.items ?? []) {
        if (!productId || sameId(item.productId, productId)) {
          labels.set(String(item.productId), itemLabel(item));
        }
      }
      return {
        id: String(document._id),
        documentNo: document.documentNo,
        documentType: "stocktakes",
        version: document.version,
        warehouseId: String(document.header.warehouseId),
        items: [...labels].map(([productId, label]) => ({ productId, label })),
      };
    }),
    total: result.count[0]?.total ?? 0,
    page,
    limit,
  };
}

export async function getReplenishmentSourceOptions(user, query) {
  const { type, requestId } = query;
  requirePermission(user, requestId ? "replenishment_request:update" : "replenishment_request:create");
  requirePermission(user, type === "stocktakes" ? "stocktake:read" : "sales_order:read");
  if (requestId) await requireEditableRequest(user, requestId);
  return type === "stocktakes" ? stocktakeOptions(user, query) : salesOrderOptions(user, query);
}
