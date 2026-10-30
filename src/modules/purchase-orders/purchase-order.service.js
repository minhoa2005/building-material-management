import mongoose from "mongoose";
import {
  BusinessDocument,
  DocumentLine,
  LineLink,
  Party,
  PostingBatch,
  Product,
  StockAccount,
  StockBalance,
  StockMovement,
  Uom,
  Warehouse,
  Location,
} from "../../models/index.js";
import { ExactDecimal } from "../../models/model-utils.js";
import {
  escapeRegex,
  idString,
  isoDate,
  calendarDateRange,
} from "../../shared/utils/domain.js";
import { scopeError } from "../../shared/utils/ApiError.js";
import {
  canAccessWarehouse,
  requirePermission,
} from "../../shared/utils/access.js";
import { currentRole } from "../../shared/utils/userRole.js";

const PO_READ_ROLES = ["OWNER", "ACCOUNTANT", "WAREHOUSE"];
const expectedNextKind = {
  PO: "ARRIVAL",
  ARRIVAL: "INSPECTION",
  INSPECTION: "GR_PURCHASE",
};

function scopedWarehouseFilter(user, warehouseId) {
  if (warehouseId) {
    if (!canAccessWarehouse(user, warehouseId)) throw scopeError();
    return {
      "header.warehouseId": new mongoose.Types.ObjectId(idString(warehouseId)),
    };
  }
  if (currentRole(user)?.code === "OWNER") return {};
  return {
    "header.warehouseId": {
      $in: (user.warehouseIds || []).map(
        (warehouseId) => new mongoose.Types.ObjectId(idString(warehouseId)),
      ),
    },
  };
}

async function loadBatchGraph(batchIds) {
  const batches = new Map();
  let pending = [...new Set(batchIds.filter(Boolean).map(idString))];
  while (pending.length) {
    const records = await PostingBatch.find({
      _id: { $in: pending },
    }).lean();
    if (!records.length) break;
    pending = [];
    for (const batch of records) {
      if (!batches.has(idString(batch._id))) {
        batches.set(idString(batch._id), batch);
        if (batch.reversalOf) pending.push(idString(batch.reversalOf));
      }
    }
  }
  return batches;
}

function batchSign(batch, batches) {
  let sign = 1;
  const seen = new Set();
  while (batch?.reversalOf) {
    if (seen.has(idString(batch._id))) throw new Error("batch cycle");
    seen.add(idString(batch._id));
    sign *= -1;
    batch = batches.get(idString(batch.reversalOf));
    if (!batch) throw new Error("missing reversal batch");
  }
  return sign;
}

async function resolveGrLines(poLines, poDocuments) {
  const states = new Map();
  for (const line of poLines) {
    states.set(idString(line._id), {
      broken: false,
      grLines: new Set(),
      received: new ExactDecimal(0),
    });
  }
  const poById = new Map(
    poDocuments.map((document) => [idString(document._id), document]),
  );
  let frontier = poLines
    .map((line) => {
      const document = poById.get(idString(line.documentId));
      return document
        ? {
            line,
            document,
            poLineId: idString(line._id),
            productId: idString(line.productId),
            warehouseId: idString(document.header.warehouseId),
          }
        : null;
    })
    .filter(Boolean);
  const visited = new Set(frontier.map((entry) => `${entry.poLineId}:${idString(entry.line._id)}`));
  const grLineDocuments = new Map();
  while (frontier.length) {
    const links = await LineLink.find({
      sourceLineId: { $in: frontier.map((entry) => entry.line._id) },
    }).lean();
    if (!links.length) break;
    const targetLineIds = [
      ...new Set(links.map((link) => idString(link.targetLineId))),
    ];
    const targetLines = await DocumentLine.find({
      _id: { $in: targetLineIds },
    }).lean();
    const targetDocuments = await BusinessDocument.find({
      _id: { $in: targetLines.map((line) => line.documentId) },
    }).lean();
    const targetLineById = new Map(
      targetLines.map((line) => [idString(line._id), line]),
    );
    const targetDocumentById = new Map(
      targetDocuments.map((document) => [idString(document._id), document]),
    );
    const linksBySource = new Map();
    for (const link of links) {
      const key = idString(link.sourceLineId);
      const values = linksBySource.get(key) || [];
      values.push(link);
      linksBySource.set(key, values);
    }
    const next = [];
    for (const entry of frontier) {
      const state = states.get(entry.poLineId);
      const outgoing = linksBySource.get(idString(entry.line._id)) || [];
      for (const link of outgoing) {
        const targetLine = targetLineById.get(idString(link.targetLineId));
        const targetDocument = targetLine
          ? targetDocumentById.get(idString(targetLine.documentId))
          : null;
        const expectedKind = expectedNextKind[entry.document.documentKind];
        const targetWarehouse = targetDocument?.header?.warehouseId;
        const inspectionSourceMismatch =
          expectedKind === "INSPECTION" &&
          (!targetLine?.details?.inspectedSourceLineId ||
            idString(targetLine.details.inspectedSourceLineId) !==
              idString(entry.line._id));
        if (
          !expectedKind ||
          !targetLine ||
          !targetDocument ||
          targetDocument.documentKind !== expectedKind ||
          idString(targetLine.productId) !== entry.productId ||
          (targetWarehouse &&
            idString(targetWarehouse) !== entry.warehouseId) ||
          (expectedKind === "INSPECTION" &&
            (targetLine.lineKind !== "INSPECTION" || inspectionSourceMismatch))
        ) {
          state.broken = true;
          continue;
        }
        if (expectedKind === "GR_PURCHASE") {
          state.grLines.add(idString(targetLine._id));
          grLineDocuments.set(idString(targetLine._id), targetDocument);
          continue;
        }
        const key = `${entry.poLineId}:${idString(targetLine._id)}`;
        if (visited.has(key)) continue;
        visited.add(key);
        next.push({
          line: targetLine,
          document: targetDocument,
          poLineId: entry.poLineId,
          productId: entry.productId,
          warehouseId: entry.warehouseId,
        });
      }
    }
    frontier = next;
  }
  return { states, grLineDocuments };
}

async function grLineReceivedQuantities(grLineDocuments, storePartyId) {
  const grLineIds = [...grLineDocuments.keys()];
  const results = new Map(
    grLineIds.map((lineId) => [
      lineId,
      { qty: new ExactDecimal(0), incomplete: false, posted: false },
    ]),
  );
  if (!grLineIds.length) return results;
  const movements = await StockMovement.find({
    lineId: { $in: grLineIds },
  }).lean();
  const batches = await loadBatchGraph(
    movements.map((movement) => movement.batchId),
  );
  const balanceIds = [
    ...new Set(
      movements
        .flatMap((movement) => [
          idString(movement.fromBalanceId),
          idString(movement.toBalanceId),
        ])
        .filter(Boolean),
    ),
  ];
  const balances = await StockBalance.find({
    _id: { $in: balanceIds },
  }).lean();
  const accounts = await StockAccount.find({
    _id: { $in: balances.map((balance) => balance.accountId) },
  }).lean();
  const locations = await Location.find({
    _id: { $in: accounts.map((account) => account.locationId).filter(Boolean) },
  }).lean();
  const documents = await BusinessDocument.find({
    _id: {
      $in: movements.map((movement) => movement.documentId),
    },
  }).lean();
  const balanceById = new Map(
    balances.map((balance) => [idString(balance._id), balance]),
  );
  const accountById = new Map(
    accounts.map((account) => [idString(account._id), account]),
  );
  const locationById = new Map(
    locations.map((location) => [idString(location._id), location]),
  );
  const documentById = new Map(
    documents.map((document) => [idString(document._id), document]),
  );
  const movementsByLine = new Map();
  for (const movement of movements) {
    const list = movementsByLine.get(idString(movement.lineId)) || [];
    list.push(movement);
    movementsByLine.set(idString(movement.lineId), list);
  }
  for (const [lineId, grDocument] of grLineDocuments) {
    const result = results.get(lineId);
    const lineMovements = movementsByLine.get(lineId) || [];
    if (grDocument.workflowStatus !== "POSTED") {
      if (lineMovements.length) result.incomplete = true;
      continue;
    }
    result.posted = true;
    if (!lineMovements.length || !storePartyId) {
      result.incomplete = true;
      continue;
    }
    for (const movement of lineMovements) {
      try {
        const batch = batches.get(idString(movement.batchId));
        if (!batch) throw new Error("missing batch");
        const sign = batchSign(batch, batches);
        const document = documentById.get(idString(movement.documentId));
        if (
          !document ||
          document.documentKind !== "GR_PURCHASE" ||
          idString(document._id) !== idString(grDocument._id)
        ) {
          throw new Error("wrong receipt document");
        }
        let storeEndpoints = 0;
        for (const balanceId of [
          movement.fromBalanceId,
          movement.toBalanceId,
        ]) {
          if (!balanceId) continue;
          const balance = balanceById.get(idString(balanceId));
          if (!balance) throw new Error("missing balance");
          const account = accountById.get(idString(balance.accountId));
          const location = account
            ? locationById.get(idString(account.locationId))
            : null;
          if (
            !account ||
            !location ||
            idString(location.warehouseId) !==
              idString(grDocument.header.warehouseId)
          ) {
            throw new Error("wrong receipt warehouse");
          }
          if (idString(balance.ownerPartyId) === idString(storePartyId)) {
            storeEndpoints += 1;
          }
        }
        // A ledger row is counted once, not once per endpoint. The batch-chain
        // sign already represents reversal/reversal-of-reversal; the movement
        // direction is part of that same fact and must not be inverted again.
        if (storeEndpoints === 1) {
          result.qty = result.qty.plus(
            new ExactDecimal(movement.qtyBase.toString()).mul(sign),
          );
        } else if (storeEndpoints > 1) {
          throw new Error("receipt movement does not cross ownership");
        }
      } catch {
        result.incomplete = true;
      }
    }
    if (result.qty.isNegative()) result.incomplete = true;
  }
  return results;
}

function emptyComputedLine(line) {
  const ordered = new ExactDecimal(line.qtyBase.toString());
  return {
    lineId: idString(line._id),
    lineNo: line.lineNo,
    productId: idString(line.productId),
    orderedQtyBase: ordered.toString(),
    confirmedQtyBase: null,
    receivedQtyBase: null,
    cancelledQtyBase: null,
    outstandingQtyBase: null,
    quantityState: "INCOMPLETE",
  };
}

function quantityStatus(lines) {
  if (!lines.length || lines.some((line) => line.quantityState === "INCOMPLETE")) {
    return "UNKNOWN";
  }
  return lines.some(
    (line) => new ExactDecimal(line.outstandingQtyBase).gt(0),
  )
    ? "YES"
    : "NO";
}

async function computedDocuments(documents) {
  if (!documents.length) return [];
  const lines = await DocumentLine.find({
    documentId: { $in: documents.map((document) => document._id) },
  })
    .sort({ lineNo: 1 })
    .lean();
  const linesByDocument = new Map();
  for (const line of lines) {
    const key = idString(line.documentId);
    const values = linesByDocument.get(key) || [];
    values.push(line);
    linesByDocument.set(key, values);
  }
  const { states, grLineDocuments } = await resolveGrLines(lines, documents);
  const grOwners = new Map();
  for (const [poLineId, state] of states) {
    for (const grLineId of state.grLines) {
      const owners = grOwners.get(grLineId) || new Set();
      owners.add(poLineId);
      grOwners.set(grLineId, owners);
    }
  }
  for (const owners of grOwners.values()) {
    if (owners.size > 1) {
      for (const poLineId of owners) states.get(poLineId).broken = true;
    }
  }
  const store = await Party.findOne({ kind: "STORE" }).select("_id").lean();
  const receivedByGrLine = await grLineReceivedQuantities(
    grLineDocuments,
    store?._id,
  );
  for (const [poLineId, state] of states) {
    if (state.broken) continue;
    for (const grLineId of state.grLines) {
      const received = receivedByGrLine.get(grLineId);
      if (!received || received.incomplete) {
        state.broken = true;
        continue;
      }
      state.received = state.received.plus(received.qty);
    }
  }
  return documents.map((document) => {
    const documentLines = linesByDocument.get(idString(document._id)) || [];
    const lineResults = documentLines.map((line) => {
      const state = states.get(idString(line._id));
      const ordered = new ExactDecimal(line.qtyBase.toString());
      const closedWithoutBasis = ["CANCELLED", "CLOSED"].includes(
        document.workflowStatus,
      );
      if (!state || state.broken || closedWithoutBasis) {
        return emptyComputedLine(line);
      }
      if (state.received.gt(ordered)) {
        return emptyComputedLine(line);
      }
      const outstanding = ordered.minus(state.received);
      return {
        lineId: idString(line._id),
        lineNo: line.lineNo,
        productId: idString(line.productId),
        orderedQtyBase: ordered.toString(),
        confirmedQtyBase: null,
        receivedQtyBase: state.received.toString(),
        cancelledQtyBase: "0",
        outstandingQtyBase: outstanding.toString(),
        quantityState: "KNOWN",
      };
    });
    return {
      document,
      lines: lineResults,
      outstandingStatus: quantityStatus(lineResults),
    };
  });
}

async function mapPreviewLines(computedLines) {
  const products = await Product.find({
    _id: { $in: computedLines.map((line) => line.productId) },
  }).lean();
  const uoms = await Uom.find({
    _id: { $in: products.map((product) => product.baseUomId) },
  }).lean();
  const productById = new Map(
    products.map((product) => [idString(product._id), product]),
  );
  const uomById = new Map(uoms.map((uom) => [idString(uom._id), uom]));
  return computedLines.map((line) => {
    const product = productById.get(line.productId);
    const uom = product ? uomById.get(idString(product.baseUomId)) : null;
    return {
      lineId: line.lineId,
      lineNo: line.lineNo,
      product: {
        id: line.productId,
        sku: product?.sku ?? null,
        name: product?.name ?? null,
      },
      baseUom: product
        ? {
            id: idString(product.baseUomId),
            code: uom?.code ?? null,
            name: uom?.name ?? null,
          }
        : null,
      orderedQtyBase: line.orderedQtyBase,
      confirmedQtyBase: line.confirmedQtyBase,
      receivedQtyBase: line.receivedQtyBase,
      outstandingQtyBase: line.outstandingQtyBase,
      quantityState: line.quantityState,
    };
  });
}

export async function listPurchaseOrders(user, query) {
  requirePermission(user, "purchase_order:read", PO_READ_ROLES);
  const filter = {
    documentKind: "PO",
    ...scopedWarehouseFilter(user, query.warehouseId),
  };
  if (query.supplierId) {
    filter["header.supplierId"] = new mongoose.Types.ObjectId(
      idString(query.supplierId),
    );
  }
  if (query.status) filter.workflowStatus = query.status;
  if (query.search) {
    filter.documentNo = new RegExp(escapeRegex(query.search), "i");
  }
  const created = calendarDateRange(query.createdFrom, query.createdTo);
  if (created) filter.createdAt = created;
  const documents = await BusinessDocument.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  let computed = await computedDocuments(documents);
  if (query.outstanding) {
    computed = computed.filter(
      (item) => item.outstandingStatus === query.outstanding,
    );
  }
  const total = computed.length;
  const pageItems = computed.slice(
    (query.page - 1) * query.limit,
    query.page * query.limit,
  );
  const [suppliers, warehouses, previews] = await Promise.all([
    Party.find({
      _id: {
        $in: pageItems
          .map((item) => item.document.header.supplierId)
          .filter(Boolean),
      },
    })
      .select("_id code name")
      .lean(),
    Warehouse.find({
      _id: {
        $in: pageItems
          .map((item) => item.document.header.warehouseId)
          .filter(Boolean),
      },
    })
      .select("_id code name isActive")
      .lean(),
    Promise.all(
      pageItems.map((item) =>
        mapPreviewLines(item.lines.slice(0, 3)),
      ),
    ),
  ]);
  const supplierById = new Map(
    suppliers.map((supplier) => [idString(supplier._id), supplier]),
  );
  const warehouseById = new Map(
    warehouses.map((warehouse) => [idString(warehouse._id), warehouse]),
  );
  return {
    items: pageItems.map((item, index) => {
      const supplier = supplierById.get(
        idString(item.document.header.supplierId),
      );
      const warehouse = warehouseById.get(
        idString(item.document.header.warehouseId),
      );
      return {
        id: idString(item.document._id),
        documentNo: item.document.documentNo,
        workflowStatus: item.document.workflowStatus,
        version: item.document.version,
        supplier: supplier
          ? {
              id: idString(supplier._id),
              code: supplier.code,
              name: supplier.name,
            }
          : null,
        warehouse: warehouse
          ? {
              id: idString(warehouse._id),
              code: warehouse.code,
              name: warehouse.name,
              isActive: warehouse.isActive,
            }
          : null,
        expectedOn: isoDate(item.document.header.expectedOn),
        createdAt: isoDate(item.document.createdAt),
        lineCount: item.lines.length,
        outstandingStatus: item.outstandingStatus,
        linePreview: previews[index],
      };
    }),
    total,
    page: query.page,
    limit: query.limit,
  };
}