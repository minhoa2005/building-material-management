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
  Lot,
  PurchaseEvent,
  PurchaseSourceClaim,
} from "../../models/legacy/index.js";
import { ExactDecimal } from "../../models/model-utils.js";
import {
  escapeRegex,
  idString,
  isoDate,
  calendarDateRange,
} from "../../shared/utils/domain.js";
import { scopeError, notFoundError } from "../../shared/utils/ApiError.js";
import {
  canAccessWarehouse,
  hasPermission,
  requirePermission,
} from "../../shared/utils/access.js";
import { currentRole } from "../../shared/utils/userRole.js";

const PO_READ_ROLES = ["OWNER", "ACCOUNTANT", "WAREHOUSE"];
const canReadAllPurchaseOrders = (user) => ["OWNER", "ACCOUNTANT"].includes(currentRole(user)?.code);
function scopedWarehouseFilter(user, warehouseId) {
  if (warehouseId) {
    if (!canReadAllPurchaseOrders(user) && !canAccessWarehouse(user, warehouseId)) throw scopeError();
    return {
      "header.warehouseId": new mongoose.Types.ObjectId(idString(warehouseId)),
    };
  }
  if (canReadAllPurchaseOrders(user)) return {};
  return {
    "header.warehouseId": {
      $in: (user.warehouseIds || []).map(
        (warehouseId) => new mongoose.Types.ObjectId(idString(warehouseId)),
      ),
    },
  };
}

async function loadBatchGraph(batchIds, session = null) {
  const batches = new Map();
  let pending = [...new Set(batchIds.filter(Boolean).map(idString))];
  while (pending.length) {
    const records = await PostingBatch.find({
      _id: { $in: pending },
    }).session(session).lean();
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

async function resolveGrLines(poLines, poDocuments, session = null) {
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
  const grLineDocuments = new Map();
  const directDocuments = await BusinessDocument.find({documentKind:'GR_PURCHASE','header.purchaseOrderId':{$in:poDocuments.map(d=>d._id)}}).session(session).lean();
  const directLines = await DocumentLine.find({documentId:{$in:directDocuments.map(d=>d._id)}}).session(session).lean();
  const directInspections = await BusinessDocument.find({_id:{$in:directDocuments.map(d=>d.header.poInspectionId).filter(Boolean)},documentKind:'PO_INSPECTION'}).session(session).lean();
  const inspectedLines = await DocumentLine.find({_id:{$in:directLines.map(l=>l.details?.inspectionLineId).filter(Boolean)}}).session(session).lean();
  const directDocById=new Map(directDocuments.map(d=>[idString(d._id),d]));
  const inspectionById=new Map(directInspections.map(d=>[idString(d._id),d]));
  const inspectedById=new Map(inspectedLines.map(l=>[idString(l._id),l]));
  const poLineById=new Map(poLines.map(l=>[idString(l._id),l]));
  const grsWithLines = new Set(directLines.map(l => idString(l.documentId)));
  for(const gr of directDocuments) if(!grsWithLines.has(idString(gr._id))) {
    for(const p of poLines.filter(p=>idString(p.documentId)===idString(gr.header.purchaseOrderId))) states.get(idString(p._id)).broken=true;
  }
  for(const line of directLines) {
    const gr=directDocById.get(idString(line.documentId));
    const po=poById.get(idString(gr.header.purchaseOrderId));
    const source=poLineById.get(idString(line.details?.poLineId));
    const inspection=inspectionById.get(idString(gr.header.poInspectionId));
    const inspected=inspectedById.get(idString(line.details?.inspectionLineId));
    const valid=source && idString(source.documentId)===idString(po._id) && line.lineKind==='PURCHASE_RECEIPT'
      && idString(line.productId)===idString(source.productId) && idString(gr.header.warehouseId)===idString(po.header.warehouseId)
      && idString(gr.header.supplierId)===idString(po.header.supplierId) && inspection?.workflowStatus==='CONFIRMED'
      && idString(inspection.header.warehouseId)===idString(po.header.warehouseId)
      && idString(inspection.header.supplierId)===idString(po.header.supplierId) && inspected?.lineKind==='PO_INSPECTION'
      && idString(inspection.header.purchaseOrderId)===idString(po._id) && idString(inspected?.documentId)===idString(inspection._id)
      && idString(inspected?.details?.poLineId)===idString(source._id)
      && idString(inspected?.productId)===idString(line.productId) && idString(inspected?.lotId)===idString(line.lotId)
      && inspected?.details?.qualityCode==='GOOD' && line.details?.qualityCode==='GOOD'
      && idString(inspected?.conversionId)===idString(line.conversionId)
      && new ExactDecimal(inspected.conversionSnapshot.toString()).eq(new ExactDecimal(line.conversionSnapshot.toString())) && new ExactDecimal(inspected.qtyBase.toString()).eq(new ExactDecimal(line.qtyBase.toString()));
    if(!valid) { for(const p of poLines.filter(p=>idString(p.documentId)===idString(po?._id))) states.get(idString(p._id)).broken=true; continue; }
    states.get(idString(source._id)).grLines.add(idString(line._id));grLineDocuments.set(idString(line._id),gr);
  }
  // Only PO -> PO_INSPECTION links are supported; malformed sources are unknown.
  const links=await LineLink.find({sourceLineId:{$in:poLines.map(l=>l._id)}}).session(session).lean();
  const targets=await DocumentLine.find({_id:{$in:links.map(l=>l.targetLineId)}}).session(session).lean();
  const documents=await BusinessDocument.find({_id:{$in:targets.map(l=>l.documentId)}}).session(session).lean();
  const targetById = new Map(targets.map(l => [idString(l._id), l]));
  const documentById = new Map(documents.map(d => [idString(d._id), d]));
  for(const link of links) {
    const source=poLineById.get(idString(link.sourceLineId));
    const target=targetById.get(idString(link.targetLineId));
    const document=target && documentById.get(idString(target.documentId));
    if(!document || document.documentKind!=='PO_INSPECTION' || target.lineKind!=='PO_INSPECTION'
      || idString(target.details?.poLineId)!==idString(source._id)
      || idString(document.header.purchaseOrderId)!==idString(source.documentId)
      || idString(target.productId)!==idString(source.productId)) states.get(idString(source._id)).broken=true;
  }
  return { states, grLineDocuments };
}

async function grLineReceivedQuantities(grLineDocuments, storePartyId, session = null) {
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
  }).session(session).lean();
  const batches = await loadBatchGraph(
    movements.map((movement) => movement.batchId), session,
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
  }).session(session).lean();
  const accounts = await StockAccount.find({
    _id: { $in: balances.map((balance) => balance.accountId) },
  }).session(session).lean();
  const locations = await Location.find({
    _id: { $in: accounts.map((account) => account.locationId).filter(Boolean) },
  }).session(session).lean();
  const documents = await BusinessDocument.find({
    _id: {
      $in: movements.map((movement) => movement.documentId),
    },
  }).session(session).lean();
  const balanceById = new Map(
    balances.map((balance) => [idString(balance._id), balance]),
  );
  const lots=await Lot.find({_id:{$in:balances.map(b=>b.lotId)}}).session(session).lean();
  const lotById=new Map(lots.map(l=>[idString(l._id),l]));
  const grLines=await DocumentLine.find({_id:{$in:grLineIds}}).session(session).lean();
  const grById=new Map(grLines.map(l=>[idString(l._id),l]));
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
        if(idString(batch.documentId)!==idString(grDocument._id)) throw new Error('wrong batch document');
        let ancestor=batch; const ancestry=new Set();
        while(ancestor) {
          if(ancestry.has(idString(ancestor._id)) || idString(ancestor.documentId)!==idString(grDocument._id)) throw new Error('wrong reversal ancestry');
          ancestry.add(idString(ancestor._id));
          if(!ancestor.reversalOf) break;
          ancestor=batches.get(idString(ancestor.reversalOf));
          if(!ancestor || !lineMovements.some(m=>idString(m.batchId)===idString(ancestor._id))) throw new Error('reversal has no source movement for receipt line');
        }
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
        let direction=0;
        for (const balanceId of [
          movement.fromBalanceId,
          movement.toBalanceId,
        ]) {
          if (!balanceId) continue;
          const balance = balanceById.get(idString(balanceId));
          if (!balance) throw new Error("missing balance");
          const grLine=grById.get(lineId);
          const lot=lotById.get(idString(balance.lotId));
          if(!lot || idString(lot.productId)!==idString(grLine.productId) || (grLine.lotId && idString(grLine.lotId)!==idString(lot._id))) throw new Error('wrong receipt product/lot');
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
            direction=idString(balanceId)===idString(movement.toBalanceId)?1:-1;
          }
        }
        // A ledger row is counted once, not once per endpoint. The batch-chain
        // sign already represents reversal/reversal-of-reversal; the movement
        // direction is part of that same fact and must not be inverted again.
        if (storeEndpoints === 1) {
          if(direction!==sign) throw new Error('receipt direction contradicts reversal ancestry');
          result.qty = result.qty.plus(
            new ExactDecimal(movement.qtyBase.toString()).mul(direction),
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

async function computedDocuments(documents, session = null) {
  if (!documents.length) return [];
  const events = await PurchaseEvent.find({ purchaseOrderId: { $in: documents.map(d => d._id) }, kind: { $in: ['AMENDMENT','CLOSE_EXECUTION','SUPPLIER_CONFIRMATION'] } }).sort({ createdAt: -1, _id: -1 }).session(session).lean();
  const lines = await DocumentLine.find({
    documentId: { $in: documents.map((document) => document._id) },
  })
    .sort({ lineNo: 1 })
    .session(session).lean();
  const linesByDocument = new Map();
  for (const line of lines) {
    const key = idString(line.documentId);
    const values = linesByDocument.get(key) || [];
    values.push(line);
    linesByDocument.set(key, values);
  }
  const { states, grLineDocuments } = await resolveGrLines(lines, documents, session);
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
  const store = await Party.findOne({ kind: "STORE" }).select("_id").session(session).lean();
  const receivedByGrLine = await grLineReceivedQuantities(
    grLineDocuments,
    store?._id, session,
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
      const originalOrdered = new ExactDecimal(line.qtyBase.toString());
      const ownEvents = events.filter(e => idString(e.purchaseOrderId) === idString(document._id));
      const sumEvents = kind => ownEvents.filter(e => e.kind === kind).flatMap(e => e.lines).filter(l => idString(l.poLineId) === idString(line._id)).reduce((sum,l) => sum.plus(new ExactDecimal(l.qtyBase.toString())), new ExactDecimal(0));
      const ordered = originalOrdered.plus(sumEvents('AMENDMENT'));
      const closed = sumEvents('CLOSE_EXECUTION');
      const confirmation = ownEvents.filter(e => e.kind === 'SUPPLIER_CONFIRMATION').flatMap(e => e.lines).find(l => idString(l.poLineId) === idString(line._id));
      const closedWithoutBasis = ["CANCELLED", "CLOSED"].includes(
        document.workflowStatus,
      ) && !ownEvents.some(e => e.kind === 'CLOSE_EXECUTION');
      if (!state || state.broken || closedWithoutBasis) {
        return emptyComputedLine(line);
      }
      if (state.received.plus(closed).gt(ordered)) {
        return emptyComputedLine(line);
      }
      const outstanding = ordered.minus(closed).minus(state.received);
      return {
        lineId: idString(line._id),
        lineNo: line.lineNo,
        productId: idString(line.productId),
        productNameSnapshot: line.productNameSnapshot, productSkuSnapshot: line.productSkuSnapshot,
        orderedQtyBase: originalOrdered.toString(),
        authorizedOrderedQtyBase: ordered.toString(),
        netPostedReceiptQtyBase: state.received.toString(),
        closedRemainderQtyBase: closed.toString(),
        confirmedQtyBase: confirmation?.qtyBase.toString() ?? null,
        receivedQtyBase: state.received.toString(),
        cancelledQtyBase: closed.toString(),
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

async function mapPreviewLines(computedLines, session = null) {
  const products = await Product.find({
    _id: { $in: computedLines.map((line) => line.productId) },
  }).session(session).lean();
  const uoms = await Uom.find({
    _id: { $in: products.map((product) => product.baseUomId) },
  }).session(session).lean();
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
        sku: line.productSkuSnapshot ?? product?.sku ?? null,
        name: line.productNameSnapshot ?? product?.name ?? null,
      },
      baseUom: product
        ? {
            id: idString(product.baseUomId),
            code: uom?.code ?? null,
            name: uom?.name ?? null,
          }
        : null,
      orderedQtyBase: line.orderedQtyBase,
      authorizedOrderedQtyBase: line.authorizedOrderedQtyBase ?? null,
      netPostedReceiptQtyBase: line.netPostedReceiptQtyBase ?? null,
      closedRemainderQtyBase: line.closedRemainderQtyBase ?? null,
      confirmedQtyBase: line.confirmedQtyBase,
      receivedQtyBase: line.receivedQtyBase,
      outstandingQtyBase: line.outstandingQtyBase,
      quantityState: line.quantityState,
    };
  });
}

export async function listPurchaseOrders(user, query) {
  const session = null;
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
  const sourceQuery = BusinessDocument.find(filter).sort({ createdAt: -1, _id: -1 });
  if (!query.outstanding) sourceQuery.skip((query.page - 1) * query.limit).limit(query.limit);
  const documents = await sourceQuery.session(session).lean();
  let computed = await computedDocuments(documents);
  if (query.outstanding) {
    computed = computed.filter(
      (item) => item.outstandingStatus === query.outstanding,
    );
  }
  const total = query.outstanding ? computed.length : await BusinessDocument.countDocuments(filter);
  const pageItems = query.outstanding ? computed.slice((query.page - 1) * query.limit, query.page * query.limit) : computed;
  const [suppliers, warehouses, previews] = await Promise.all([
    Party.find({
      _id: {
        $in: pageItems
          .map((item) => item.document.header.supplierId)
          .filter(Boolean),
      },
    })
      .select("_id code name")
      .session(session).lean(),
    Warehouse.find({
      _id: {
        $in: pageItems
          .map((item) => item.document.header.warehouseId)
          .filter(Boolean),
      },
    })
      .select("_id code name isActive")
      .session(session).lean(),
    mapPreviewLines(pageItems.flatMap(item => item.lines.slice(0, 3))),
  ]);
  const supplierById = new Map(
    suppliers.map((supplier) => [idString(supplier._id), supplier]),
  );
  const warehouseById = new Map(
    warehouses.map((warehouse) => [idString(warehouse._id), warehouse]),
  );
  return {
    items: pageItems.map((item) => {
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
        linePreview: item.lines.slice(0, 3).map(l => previews.find(p => p.lineId === l.lineId)),
      };
    }),
    total,
    page: query.page,
    limit: query.limit,
  };
}

export async function purchaseOrderQuantities(document, session = null) {
  const [computed] = await computedDocuments([document], session);
  return computed?.lines ?? [];
}

export async function getPurchaseOrder(user, id) {
  requirePermission(user, "purchase_order:read", PO_READ_ROLES);
  const document = await BusinessDocument.findOne({ _id: id, documentKind: "PO" }).lean();
  if (!document) throw notFoundError("Không tìm thấy đơn mua hàng");
  if (!canReadAllPurchaseOrders(user) && !canAccessWarehouse(user, document.header.warehouseId)) throw scopeError();
  const [computed] = await computedDocuments([document]);
  const [supplier, warehouse, lines] = await Promise.all([
    Party.findById(document.header.supplierId).select("_id code name").lean(),
    Warehouse.findById(document.header.warehouseId).select("_id code name isActive").lean(),
    mapPreviewLines(computed.lines),
  ]);
  let draftEdit = null;
  if (document.workflowStatus === 'DRAFT'
    && hasPermission(user, 'purchase_order:update', ['ACCOUNTANT'])
    && canAccessWarehouse(user, document.header.warehouseId)) {
    const [savedLines, sources] = await Promise.all([
      DocumentLine.find({ documentId: document._id }).sort({ lineNo: 1 }).lean(),
      PurchaseSourceClaim.find({ purchaseOrderId: document._id }).lean(),
    ]);
    draftEdit = { lines: savedLines.map(line => {
      const claims = sources.filter(source => idString(source.poLineId) === idString(line._id));
      const source = claims.length === 1 ? claims[0] : null;
      return {
        id: idString(line._id),
        rrLineId: source ? idString(source.rrLineId) : null,
        approvalId: source ? idString(source.approvalId) : null,
        enteredQty: line.enteredQty.toString(),
        enteredUomCode: line.enteredUomCodeSnapshot ?? null,
      };
    }) };
  }
  return {
    id: idString(document._id), documentNo: document.documentNo,
    workflowStatus: document.workflowStatus, version: document.version,
    supplier: supplier ? { id: idString(supplier._id), code: supplier.code, name: supplier.name } : null,
    warehouse: warehouse ? { id: idString(warehouse._id), code: warehouse.code, name: warehouse.name, isActive: warehouse.isActive } : null,
    expectedOn: isoDate(document.header.expectedOn), createdAt: isoDate(document.createdAt),
    outstandingStatus: computed.outstandingStatus, lines, draftEdit,
  };
}
