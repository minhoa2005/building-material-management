import { nextDocumentFields } from '../../shared/utils/document-number.js';
import * as m from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { command, checkVersion, saveVersion, same, newId, hash } from '../../shared/utils/document-command.js';
import { dto, page, serialize } from '../../shared/utils/persistence.js';
import { requirePermission, requireWarehouseAccess, isOwner } from '../../shared/utils/access.js';
import { validationError, notFoundError } from '../../shared/utils/ApiError.js';
import { sourceContext, beginStock, moveStock, receiveStock, splitPortions, remainingReservation, verifyCapacity, heldQuantity } from '../../shared/utils/stock.js';
import { copyItem, sourceLink } from '../../shared/utils/document-copy.js';
async function scoped(user, id, session) { const document = await m.Stocktake.findById(id).session(session); if (!document)
    throw notFoundError(); requireWarehouseAccess(user, document.header.warehouseId); return document; }
export async function listStocktakes(user, query) { requirePermission(user, 'stocktake:read'); const filter = isOwner(user) ? {} : { 'header.warehouseId': { $in: user.warehouseIds || [] } }; if (query.warehouseId) {
    requireWarehouseAccess(user, query.warehouseId);
    filter['header.warehouseId'] = query.warehouseId;
} if (query.status)
    filter.workflowStatus = query.status; return page(m.Stocktake, filter, query); }
export async function getStocktake(user, id) { requirePermission(user, 'stocktake:read'); const document = await scoped(user, id); const scope = { stocktakeId: document._id, scopeVersion: document.header.scopeVersion }; return { ...dto(document), snapshots: (await m.StocktakeSnapshot.find(scope)).map(dto), counts: (await m.StocktakeCount.find(scope).sort({ attemptNo: -1 })).map(dto), locks: (await m.StocktakeLocationLock.find(scope)).map(dto) }; }
export const approvalContent = plan => serialize({ planId: plan._id, planVersion: plan.version, scopeVersion: plan.header.scopeVersion, items: plan.items, selectedCounts: plan.selectedCounts });
export function closeStocktake(user, id, input) {
    return command(user, 'CLOSE_STOCKTAKE', 'stock_adjustment:post', id, input, (id, a, s) => scoped(a, id, s), async (session, actor, operationId) => {
        const document = await scoped(actor, id, session);
        checkVersion(document, input.expectedVersion);
        if (!['COUNTING', 'RECONCILING', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS'].includes(document.workflowStatus))
            throw validationError('Đợt không ở trạng thái có thể chốt');
        const scope = { stocktakeId: document._id, scopeVersion: document.header.scopeVersion };
        const locks = await m.StocktakeLocationLock.find({ ...scope, status: 'LOCKED' }).session(session);
        const locations = document.header.scopeLocationIds;
        if (!locations.length || locks.length !== locations.length || locations.some(id => !locks.some(l => same(l.locationId, id))))
            throw validationError('Phạm vi khóa không đầy đủ');
        // Serialize against every physical-stock writer before checking frozen balances.
        for (const id of locations) {
            const location = await m.WarehouseLocation.findOneAndUpdate({ _id: id, warehouseId: document.header.warehouseId, isActive: true }, { $inc: { operationVersion: 1 } }, { session });
            if (!location)
                throw validationError('Vị trí không hoạt động hoặc sai kho');
        }
        const snapshots = await m.StocktakeSnapshot.find(scope).session(session), counts = await m.StocktakeCount.find(scope).session(session);
        const plan = input.planId ? document.resolutionPlans.id(input.planId) : null;
        if (input.planId && !plan)
            throw validationError('Không có phương án thuộc đợt');
        const selected = plan?.selectedCounts || input.selectedCounts;
        if (!selected || new Set(selected.map(s => String(s.snapshotId))).size !== snapshots.length || selected.length !== snapshots.length)
            throw validationError('Phải chọn đủ kết quả từng dòng mốc');
        const selectedCounts = new Map();
        for (const snapshot of snapshots) {
            const selectedRow = selected.find(s => same(s.snapshotId, snapshot._id));
            const count = selectedRow && counts.find(c => same(c._id, selectedRow.countId) && same(c.snapshotId, snapshot._id));
            if (!count || counts.some(c => same(c.snapshotId, snapshot._id) && c.attemptNo > count.attemptNo))
                throw validationError('Thiếu kết quả hoặc có lần đếm mới cần duyệt lại');
            selectedCounts.set(String(snapshot._id), count);
        }
        for (const locationId of locations)
            if (!snapshots.some(s => same(s.locationId, locationId)) && !counts.some(c => same(c.locationId, locationId) && c.targetType === 'EMPTY_LOCATION' && exact(c.countedQtyBase).isZero()))
                throw validationError('Ô trống chưa được xác nhận đã kiểm');
        const projection = new Map(), contexts = new Map();
        for (const snapshot of snapshots) {
            if (!snapshot.sourceBalanceId)
                throw validationError('Dòng phát hiện cần được đối chiếu với nhóm tồn trước chốt');
            const ctx = await sourceContext(snapshot.sourceBalanceId, session);
            if (!same(ctx.location?._id, snapshot.locationId) || !same(ctx.batch._id, snapshot.batchId) || ctx.balance.ownerType !== snapshot.ownerType || String(ctx.balance.ownerId ?? '') !== String(snapshot.ownerId ?? '') || ctx.balance.qualityStatus !== snapshot.qualityStatus || !exact(ctx.balance.quantityBase).eq(String(snapshot.bookQtyBase)) || (snapshot.sourceBalanceVersion != null && ctx.balance.version !== snapshot.sourceBalanceVersion))
                throw validationError('Số dư không còn khớp mốc kiểm kê');
            if ((await heldQuantity(ctx.balance._id, session)).gt(0))
                throw validationError('Còn phần hàng bị chặn chưa xử lý; giữ khóa kiểm kê');
            contexts.set(String(ctx.balance._id), ctx);
            projection.set(String(ctx.balance._id), exact(ctx.balance.quantityBase));
        }
        let posting, adjustment;
        if (plan) {
            if (plan.version !== input.expectedPlanVersion || !['APPROVED', 'EXECUTED'].includes(plan.workflowStatus) || plan.header.scopeVersion !== document.header.scopeVersion || !same(plan.header.stocktakeId, document._id))
                throw validationError('Phương án hoặc phiên bản không còn hiệu lực');
            const approval = await m.ApprovalHistory.findById(plan.header.approvalId).session(session);
            if (!approval || approval.decision !== 'APPROVE' || approval.subjectType !== 'stocktake_resolution_plans' || approval.decisionScope !== 'STOCKTAKE' || !same(approval.subjectId, plan._id) || approval.subjectRevision !== plan.version || same(approval.decidedBy, plan.createdBy) || hash(approval.reviewedContent) !== hash(approvalContent(plan)))
                throw validationError('Thiếu phê duyệt độc lập đúng nội dung và phiên bản');
            if (document.resolutionPlans.some(p => p.header.planVersion > plan.header.planVersion && !['CANCELLED', 'REJECTED'].includes(p.workflowStatus)))
                throw validationError('Đã có phương án mới');
            posting = beginStock(document, actor, 'STOCKTAKE_CLOSE', input);
            const groupDeltas = new Map();
            for (const item of plan.items) {
                const details = item.details, quantity = exact(item.qtyBase);
                const from = details.fromBalanceId && contexts.get(String(details.fromBalanceId)), to = details.toBalanceId && contexts.get(String(details.toBalanceId));
                if (!quantity.gt(0) || (!from && !to) || (details.fromBalanceId && !from) || (details.toBalanceId && !to))
                    throw validationError('Dòng phương án ngoài phạm vi mốc');
                const ctx = from || to;
                if (ctx.product.wholeBaseUnits && !quantity.isInteger()) throw validationError('Lượng xử lý phải nguyên theo đơn vị gốc');
                if (!same(ctx.product._id, item.productId) || !same(ctx.batch._id, item.lotId))
                    throw validationError('Sai sản phẩm/lô của phương án');
                const count = counts.find(c => same(c._id, details.countId));
                if (!count || ![...selectedCounts.values()].some(c => same(c._id, count._id)))
                    throw validationError('Phương án không theo kết quả đã chọn');
                const records = plan.executionRecords.filter(e => same(e.itemId, item._id));
                if (!records.length || !records.reduce((n, r) => n.plus(String(r.quantityBase)), exact('0')).eq(quantity))
                    throw validationError('Kho chưa ghi đủ lượng thực hiện');
                for (const execution of records) {
                    const worker = await m.User.findById(execution.performedBy).populate({ path: 'roleId', populate: { path: 'permissionIds' } }).session(session);
                    requirePermission(worker, 'stock_adjustment:update');
                    requireWarehouseAccess(worker, document.header.warehouseId);
                    if (same(worker._id, actor._id) || execution.performedAt < approval.decidedAt || !execution.evidenceIds.length)
                        throw validationError('Căn cứ thực hiện phải sau duyệt và độc lập người chốt');
                    const evidenceCount = await m.Attachment.countDocuments({ _id: { $in: execution.evidenceIds }, status: 'ATTACHED', ownerDocumentId: { $in: [document._id, plan._id] }, uploadedBy: worker._id }).session(session);
                    if (evidenceCount !== execution.evidenceIds.length)
                        throw validationError('Bằng chứng thực hiện không thuộc phương án');
                }
                if (details.actionKind === 'DELTA') {
                    const delta = exact(details.deltaQty);
                    if (!delta.abs().eq(quantity))
                        throw validationError('Lượng điều chỉnh không khớp phương án');
                    const key = [ctx.batch._id, ctx.balance.ownerType, ctx.balance.ownerId ?? ''].join(':');
                    const signs = groupDeltas.get(key) || new Set();
                    signs.add(delta.gt(0) ? 1 : -1);
                    groupDeltas.set(key, signs);
                    if (signs.size > 1)
                        throw validationError('Đổi chất lượng/vị trí phải dùng RECLASS/RELOCATE, không tạo hai điều chỉnh bù nhau');
                    projection.set(String(ctx.balance._id), projection.get(String(ctx.balance._id)).plus(delta));
                }
                else {
                    if (!from || !to || !same(from.batch._id, to.batch._id) || from.balance.ownerType !== to.balance.ownerType || String(from.balance.ownerId ?? '') !== String(to.balance.ownerId ?? ''))
                        throw validationError('Không đổi lô/chủ khi chốt');
                    if (details.actionKind === 'RECLASS' && (!same(from.location._id, to.location._id) || from.balance.qualityStatus === to.balance.qualityStatus))
                        throw validationError('RECLASS phải đổi chất lượng tại cùng vị trí');
                    if (details.actionKind === 'RELOCATE' && (same(from.location._id, to.location._id) || from.balance.qualityStatus !== to.balance.qualityStatus))
                        throw validationError('RELOCATE chỉ chuyển vị trí');
                    projection.set(String(from.balance._id), projection.get(String(from.balance._id)).minus(quantity));
                    projection.set(String(to.balance._id), projection.get(String(to.balance._id)).plus(quantity));
                }
            }
        }
        for (const snapshot of snapshots) {
            const after = projection.get(String(snapshot.sourceBalanceId)), count = selectedCounts.get(String(snapshot._id));
            if (!after.eq(String(count.countedQtyBase)) || after.lt(0))
                throw validationError('Phương án chưa giải quyết đúng toàn bộ chênh lệch');
        }
        if (plan) {
            for (const item of plan.items) {
                const d = item.details, ctx = contexts.get(String(d.fromBalanceId || d.toBalanceId));
                if (d.actionKind !== 'DELTA') {
                    const reserved = await m.StockReservation.find({ balanceId: d.fromBalanceId }).session(session);
                    if (d.actionKind === 'RECLASS' && reserved.some(r => remainingReservation(r).gt(0)))
                        throw validationError('Phải xử lý cam kết hàng trước khi đổi chất lượng');
                    await moveStock(d.fromBalanceId, d.toBalanceId, String(item.qtyBase), item._id, posting, actor, session, { preserveReservations: d.actionKind === 'RELOCATE' });
                    continue;
                }
                if (!adjustment)
                    adjustment = new m.StockAdjustment({ ...await nextDocumentFields(m.StockAdjustment, 'ADJ', document.header.warehouseId, session), workflowStatus: 'POSTED', version: 1, createdBy: actor._id, postedBy: actor._id, postedAt: new Date(), stockTransactionId: posting._id, header: { stocktakeId: document._id, resolutionPlanId: plan._id, warehouseId: document.header.warehouseId }, items: [] });
                const balance = await m.InventoryBalance.findById(ctx.balance._id).session(session), before = exact(balance.quantityBase), delta = exact(d.deltaQty);
                if (delta.gt(0)) {
                    await receiveStock(balance, item, input.packaging?.find(p => same(p.lineId, item._id))?.portions, posting, actor, session);
                }
                else {
                    const { kept } = splitPortions(balance.packagingPortions, delta.abs(), actor._id);
                    balance.packagingPortions = kept;
                    balance.quantityBase = before.plus(delta).toFixed();
                    await saveVersion(balance, balance.version, session);
                    posting.movements.push({ transactionId: posting._id, lineNo: posting.movements.length + 1, sourceLineId: item._id, fromBalanceId: balance._id, quantityBase: delta.abs().toFixed(), fromBefore: before.toFixed(), fromAfter: balance.quantityBase });
                }
                adjustment.items.push(copyItem(item, item.qtyBase, { lineKind: 'ADJUSTMENT', details: { countId: d.countId, approvalId: plan.header.approvalId, deltaQty: delta.toFixed() }, planItemId: item._id, snapshotIds: snapshots.filter(s => same(s.sourceBalanceId, balance._id)).map(s => s._id), countIds: [d.countId], stockBalanceId: balance._id, quantityDeltaBase: delta.toFixed(), beforeQty: before.toFixed(), afterQty: before.plus(delta).toFixed(), reason: plan.header.reason || input.reason, sources: [sourceLink(document)] }));
            }
            await verifyCapacity(locations, session);
            if (posting.movements.length)
                await posting.save({ session });
            if (adjustment)
                await adjustment.save({ session });
            plan.workflowStatus = 'CLOSED';
            plan.header.closedBy = actor._id;
            plan.header.closedAt = new Date();
            if (posting.movements.length)
                plan.header.closureBatchId = posting._id;
        }
        for (const snapshot of snapshots) {
            const balance = await m.InventoryBalance.findById(snapshot.sourceBalanceId).session(session);
            const reserved = await m.StockReservation.find({ balanceId: balance._id }).session(session);
            if (reserved.reduce((n, r) => n.plus(remainingReservation(r)), exact('0')).gt(String(balance.quantityBase)))
                throw validationError('Tồn sau chốt thấp hơn lượng đã giữ');
        }
        const closureId = posting?.movements.length ? posting._id : operationId;
        document.tenLoaiPhieu = 'Đợt kiểm kê';
        document.workflowStatus = 'COMPLETED';
        document.header.completedAt = new Date();
        document.header.closedBy = actor._id;
        document.header.closureReferenceId = closureId;
        for (const lock of locks) {
            lock.status = 'RELEASED';
            lock.releasedBy = actor._id;
            lock.releasedAt = new Date();
            lock.closureReferenceId = closureId;
            await saveVersion(lock, lock.version, session);
        }
        return { document: await saveVersion(document, input.expectedVersion, session), versionBefore: input.expectedVersion, stockTransactionId: posting?.movements.length ? posting._id : undefined, reason: input.reason, auditChanges: [{ field: 'selectedCountIds', after: [...selectedCounts.values()].map(c => String(c._id)) }], resultRefs: adjustment ? [{ documentType: 'stock_adjustments', documentId: adjustment._id }] : [] };
    });
}
