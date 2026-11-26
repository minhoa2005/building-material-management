import * as m from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { dto, page, serialize } from '../../shared/utils/persistence.js';
import { requirePermission, requireWarehouseAccess } from '../../shared/utils/access.js';
import { notFoundError } from '../../shared/utils/ApiError.js';
import { buildStocktakeListFilter } from './stocktake-list.query.js';
import { listLots } from '../lots/lot.service.js';
async function scoped(user, id, session) { const document = await m.Stocktake.findById(id).session(session); if (!document)
    throw notFoundError(); requireWarehouseAccess(user, document.header.warehouseId); return document; }

// Verified lots a counter may record as found stock: only lots inside the session's optional
// product/lot filter (the same guard recordCount applies), so the picker never offers a lot the
// command would reject. With no filter every verified lot is allowed.
export async function listStocktakeLots(user, id, query) {
    requirePermission(user, 'stocktake:read');
    const { header } = await scoped(user, id);
    const scopeFilter = {};
    if (header.scope?.batchIds?.length) scopeFilter._id = { $in: header.scope.batchIds };
    if (header.scope?.productIds?.length) scopeFilter.productId = { $in: header.scope.productIds };
    return listLots(user, { ...query, identificationStatus: 'VERIFIED' }, scopeFilter);
}

// Blind count was removed on 22 Nov 2026 (user decision following lecturer feedback): every authorized reader
// receives the frozen book quantity as soon as the session is COUNTING. Slips and their lines are returned as stored.
export async function listStocktakes(user, query) {
    requirePermission(user, 'stocktake:read');
    return page(m.Stocktake, buildStocktakeListFilter(user, query), query);
}

const unitOf = (units, code) => ({ uomCode: code ?? null, uomName: (code && units.get(code)?.name) ?? null });

// Reconciliation view of one snapshot line: book quantity, every attempt, the newest result, its difference
// and the settlement or recount state, all with the base unit of measure so a client can always show "number + unit".
function reconciliationLine(snapshot, attempts, header, context) {
    const latest = attempts.at(-1) ?? null;
    const settled = header.settledLines?.find(row => String(row.snapshotId) === String(snapshot._id)) ?? null;
    const recount = header.recountLines?.find(row => String(row.snapshotId) === String(snapshot._id)) ?? null;
    // Counter's reason, only while it belongs to the newest attempt (a recount needs a new one).
    const reason = latest && header.countReasons?.find(row => String(row.snapshotId) === String(snapshot._id) && String(row.countId) === String(latest._id)) || null;
    const difference = latest ? exact(String(latest.countedQtyBase)).minus(String(snapshot.bookQtyBase)) : null;
    const batch = context.batches.get(String(snapshot.batchId)), product = batch && context.products.get(String(batch.productId));
    let status = 'NOT_COUNTED';
    if (settled) status = 'SETTLED';
    else if (recount) status = 'RECOUNT_REQUESTED';
    else if (latest) status = difference.isZero() ? 'MATCHED' : 'DIFFERENCE';
    const unit = unitOf(context.units, snapshot.baseUnitSnapshot);
    return {
        snapshotId: String(snapshot._id), origin: snapshot.origin, locationId: String(snapshot.locationId), batchId: String(snapshot.batchId),
        productId: batch ? String(batch.productId) : null, sku: product?.sku ?? null, productName: product?.name ?? null, manufacturerLot: batch?.manufacturerLot ?? null,
        qualityStatus: snapshot.qualityStatus, ownerType: snapshot.ownerType, ownerId: snapshot.ownerId ? String(snapshot.ownerId) : null,
        ...unit,
        bookQtyBase: String(snapshot.bookQtyBase),
        countedQtyBase: latest ? String(latest.countedQtyBase) : null,
        differenceBase: difference ? difference.toFixed() : null,
        latestCountId: latest ? String(latest._id) : null,
        attemptCount: attempts.length,
        status,
        attempts: attempts.map(row => ({
            countId: String(row._id), attemptNo: row.attemptNo, countedQtyBase: String(row.countedQtyBase), ...unit,
            quantityEntries: serialize(row.quantityEntries), countedBy: String(row.countedBy), countedAt: row.countedAt.toISOString(), recountReason: row.recountReason ?? null,
        })),
        settlement: settled && { outcome: settled.outcome, deltaQtyBase: String(settled.deltaQtyBase), ...unit, reasonCode: settled.reasonCode ?? null, reasonNote: settled.reasonNote ?? null, adjustmentId: settled.adjustmentId ? String(settled.adjustmentId) : null, settledBy: String(settled.settledBy), settledAt: settled.settledAt.toISOString() },
        countReason: reason && { reasonCode: reason.reasonCode, reasonNote: reason.reasonNote ?? null, setBy: String(reason.setBy), setAt: reason.setAt.toISOString() },
        recount: recount && { afterAttemptNo: recount.afterAttemptNo, requestedBy: String(recount.requestedBy), requestedAt: recount.requestedAt.toISOString(), note: recount.note ?? null },
    };
}

export async function getStocktake(user, id) {
    requirePermission(user, 'stocktake:read');
    const document = await scoped(user, id);
    const scope = { stocktakeId: document._id, scopeVersion: document.header.scopeVersion };
    const [snapshots, counts, locks] = await Promise.all([
        m.StocktakeSnapshot.find(scope),
        m.StocktakeCount.find(scope).sort({ attemptNo: -1 }),
        m.StocktakeLocationLock.find(scope),
    ]);
    // Catalogue labels are current metadata, never a replacement for frozen quantities/units.
    const batchIds = [...new Set(snapshots.map(row => String(row.batchId)))];
    const [warehouses, locations, batches] = await Promise.all([
        m.Warehouse.find({ _id: document.header.warehouseId }).select('_id code name').lean(),
        m.WarehouseLocation.find({ _id: { $in: document.header.scopeLocationIds }, warehouseId: document.header.warehouseId }).select('_id warehouseId code name').lean(),
        m.ProductBatch.find({ _id: { $in: batchIds } }).select('_id productId manufacturerLot').lean(),
    ]);
    const productIds = [...new Set(batches.map(row => String(row.productId)))];
    const [products, conversionRows] = await Promise.all([
        m.Product.find({ _id: { $in: productIds } }).select('_id sku name baseUnit').lean(),
        m.Conversion.find({ productId: { $in: productIds }, validFrom: { $lte: new Date() } }).select('productId productBatchId uomId basePerUnit validFrom').sort({ validFrom: -1 }).lean(),
    ]);
    // Current factors only (latest validFrom per product/batch/unit): counters convert what they count now.
    const seen = new Set();
    const conversions = conversionRows.filter(row => {
        const key = `${row.productId}|${row.productBatchId ?? ''}|${row.uomId}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
    const units = await m.Uom.find({ _id: { $in: [...new Set(conversions.map(row => String(row.uomId)))] } }).select('_id code name').lean();
    const unitById = new Map(units.map(unit => [String(unit._id), unit]));
    // Base units are Uom codes (snapshot, count and product); resolve their names once for every payload below.
    const baseCodes = [...new Set([...snapshots.map(row => row.baseUnitSnapshot), ...counts.map(row => row.baseUnitSnapshot), ...products.map(row => row.baseUnit)].filter(Boolean))];
    const baseUnits = new Map((await m.Uom.find({ code: { $in: baseCodes } }).select('_id code name').lean()).map(unit => [unit.code, unit]));
    const attemptsBySnapshot = new Map();
    for (const count of [...counts].reverse())
        if (count.snapshotId)
            attemptsBySnapshot.set(String(count.snapshotId), [...(attemptsBySnapshot.get(String(count.snapshotId)) ?? []), count]);
    const context = { units: baseUnits, batches: new Map(batches.map(row => [String(row._id), row])), products: new Map(products.map(row => [String(row._id), row])) };
    return {
        ...dto(document),
        snapshots: snapshots.map(row => ({ ...dto(row), ...unitOf(baseUnits, row.baseUnitSnapshot) })),
        counts: counts.map(row => ({ ...dto(row), ...unitOf(baseUnits, row.baseUnitSnapshot) })),
        locks: locks.map(dto),
        lines: snapshots.map(row => reconciliationLine(row, attemptsBySnapshot.get(String(row._id)) ?? [], document.header, context)),
        lookups: {
            warehouses: warehouses.map(row => ({ id: String(row._id), code: row.code, name: row.name })),
            locations: locations.map(row => ({ id: String(row._id), warehouseId: String(row.warehouseId), code: row.code, name: row.name })),
            batches: batches.map(row => ({ id: String(row._id), productId: String(row.productId), manufacturerLot: row.manufacturerLot })),
            products: products.map(row => ({ id: String(row._id), sku: row.sku, name: row.name, ...unitOf(baseUnits, row.baseUnit) })),
            units: [...baseUnits.values()].map(unit => ({ id: String(unit._id), code: unit.code, name: unit.name })),
            conversions: conversions.filter(row => unitById.has(String(row.uomId))).map(row => ({
                productId: String(row.productId),
                productBatchId: row.productBatchId ? String(row.productBatchId) : null,
                unit: { code: unitById.get(String(row.uomId)).code, name: unitById.get(String(row.uomId)).name },
                basePerUnit: String(row.basePerUnit),
            })),
        },
    };
}
