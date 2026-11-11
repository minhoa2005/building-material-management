import { nextDocumentFields } from '../../shared/utils/document-number.js';
import * as m from '../../models/runtime.js';
import { exact } from '../../models/model-utils.js';
import { command, checkVersion, saveVersion, same, newId, hash } from '../../shared/utils/document-command.js';
import { copyItem, sourceLink } from '../../shared/utils/document-copy.js';
import { dto, page, transaction } from '../../shared/utils/persistence.js';
import { requirePermission, requireWarehouseAccess, hasPermission } from '../../shared/utils/access.js';
import { currentRole } from '../../shared/utils/userRole.js';
import { validationError, notFoundError } from '../../shared/utils/ApiError.js';
import { guardLocations, sourceContext, freeQuantity, locationAt, balanceAt, beginStock, moveStock, remainingReservation, verifyCapacity } from '../../shared/utils/stock.js';
import { orderSource, redactPrices } from './sales-read.service.js';
import { escapeRegex } from '../../shared/utils/domain.js';
const sum = (rows, field) => rows.reduce((n, row) => n.plus(String(row[field])), exact('0'));
function unique(rows, key) { if (new Set(rows.map(r => r[key])).size !== rows.length)
    throw validationError('Không được lặp dòng nguồn'); }
function positive(value) { if (!exact(value).gt(0))
    throw validationError('Số lượng phải lớn hơn 0'); }
function open(document) { if (['CANCELLED', 'COMPLETED', 'CLOSED', 'DELIVERED'].includes(document.workflowStatus))
    throw validationError('Chứng từ không còn mở'); }
const reference = (document, item) => ({ documentType: document.constructor.collection.name, documentId: document._id, itemId: item._id });
async function ownOrder(user, id, session) {
    const order = await orderSource(user, id, session, { replay: true });
    if (!same(order.createdBy, user._id))
        throw notFoundError();
    return order;
}
async function requestSource(user, id, session, own = false) {
    const request = await m.WarehouseIssueRequest.findById(id).session(session);
    if (!request)
        throw notFoundError();
    const order = await (own ? ownOrder : orderSource)(user, request.header.salesOrderId, session);
    return { request, order };
}
async function deliverySource(user, id, session) {
    const delivery = await m.DeliveryOrder.findById(id).session(session);
    if (!delivery)
        throw notFoundError();
    requireWarehouseAccess(user, delivery.header.warehouseId);
    const { request, order } = await requestSource(user, delivery.header.issueRequestId, session);
    return { delivery, request, order };
}
async function taskSource(user, id, session) {
    const task = await m.TransferOrder.findOne({ _id: id, 'header.taskKind': 'PICK', 'sources.subjectCollection': 'sales_goods_issues' }).session(session);
    if (!task)
        throw notFoundError();
    requireWarehouseAccess(user, task.header.warehouseId);
    const issue = await m.SalesGoodsIssue.findById(task.sources[0].documentId).session(session);
    if (!issue)
        throw notFoundError();
    return { task, issue, ...await deliverySource(user, issue.header.deliveryOrderId, session) };
}
async function committed(order, session) {
    const requests = await m.WarehouseIssueRequest.find({ 'header.salesOrderId': order._id, workflowStatus: { $ne: 'CANCELLED' } }).session(session);
    return line => sum(requests.flatMap(d => d.items).filter(i => same(i.details.salesOrderLineId, line._id)), 'qtyBase')
        .plus(sum((order.cancellations || []).filter(c => same(c.salesOrderLineId, line._id) && c.sourceKind === 'UNISSUED'), 'cancelledQtyBase'));
}
export function updateSalesOrder(user, id, input) {
    return command(user, 'UPDATE_SALES_REMAINDER', 'sales_order:update', id, input, (id, a, s) => ownOrder(a, id, s), async (session, actor) => {
        const order = await ownOrder(actor, id, session);
        checkVersion(order, input.expectedVersion);
        open(order);
        unique(input.lines, 'lineId');
        const used = await committed(order, session);
        for (const row of input.lines) {
            const item = order.items.id(row.lineId);
            if (!item)
                throw validationError('Dòng không thuộc đơn');
            positive(row.quantity);
            const quantity = exact(row.quantity).mul(String(item.baseUnitsPerUnit));
            const product = await m.Product.findById(item.productId).session(session);
            if (!product || quantity.lt(used(item)) || (product.wholeBaseUnits && !quantity.isInteger()))
                throw validationError('Lượng mới không hợp lệ hoặc thấp hơn phần đã cam kết');
            if (row.unitSellingPrice != null && !exact(row.unitSellingPrice).eq(String(item.unitSellingPrice))) {
                if (used(item).gt(0))
                    throw validationError('Không đổi giá dòng đã chuyển xuống yêu cầu xuất');
                item.unitSellingPrice = row.unitSellingPrice;
                item.priceRevision += 1;
            }
            item.enteredQty = row.quantity;
            item.qtyBase = quantity.toFixed();
            item.lineAmount = exact(row.quantity).mul(String(item.unitSellingPrice)).toFixed();
        }
        order.orderAmount = sum(order.items, 'lineAmount').toFixed();
        order.updatedBy = actor._id;
        return { document: await saveVersion(order, input.expectedVersion, session), versionBefore: input.expectedVersion, reason: input.reason };
    });
}
async function reopening(order, receiptLineId, quantity, session) {
    const receipt = await m.FailedDeliveryReceipt.findOne({ workflowStatus: 'POSTED', 'demandReopenings.receiptLineId': receiptLineId }).session(session);
    const row = receipt?.demandReopenings.find(r => same(r.receiptLineId, receiptLineId));
    if (!row || !order.items.id(row.salesOrderLineId))
        throw validationError('Không có lượng giao thất bại đã nhập lại');
    const posting = await m.StockTransaction.findOne({ _id: row.stockTransactionId, sourceId: receipt._id }).session(session);
    const posted = posting?.movements.filter(m => same(m.sourceLineId, receiptLineId)).reduce((n, m) => n.plus(String(m.quantityBase)), exact('0'));
    if (!posting || !same(receipt.stockTransactionId, posting._id) || !posted?.eq(String(row.reopenedQtyBase)) || await m.StockTransaction.exists({ reversedTransactionId: posting._id }).session(session))
        throw validationError('Nguồn tái mở chưa ghi tồn hợp lệ hoặc đã bị đảo');
    const cancelled = sum((order.cancellations || []).filter(c => same(c.reopeningReceiptLineId, receiptLineId)), 'cancelledQtyBase');
    const transferred = sum((receipt.commitmentTransfers || []).filter(c => same(c.reopeningReceiptLineId, receiptLineId)), 'quantityBase');
    if (exact(quantity).plus(cancelled).plus(transferred).gt(String(row.reopenedQtyBase)))
        throw validationError('Vượt lượng tái mở chưa dùng');
    return { receipt, row };
}
export function cancelSalesRemainder(user, id, input) {
    return command(user, 'CANCEL_SALES_REMAINDER', 'sales_order:update', id, input, (id, a, s) => ownOrder(a, id, s), async (session, actor, operationId) => {
        const order = await ownOrder(actor, id, session);
        checkVersion(order, input.expectedVersion);
        open(order);
        unique(input.lines, 'lineId');
        const used = await committed(order, session);
        for (const line of input.lines) {
            const item = order.items.id(line.lineId);
            if (!item)
                throw validationError('Dòng không thuộc đơn');
            positive(line.qtyBase);
            if (line.reopeningReceiptLineId) {
                const { row } = await reopening(order, line.reopeningReceiptLineId, line.qtyBase, session);
                if (!same(row.salesOrderLineId, item._id))
                    throw validationError('Sai dòng tái mở');
            }
            else if (exact(line.qtyBase).plus(used(item)).gt(String(item.qtyBase)))
                throw validationError('Phần này đã cấp yêu cầu xuất hoặc đã hủy');
            const product = await m.Product.findById(item.productId).session(session);
            if (product?.wholeBaseUnits && !exact(line.qtyBase).isInteger())
                throw validationError('Số lượng phải nguyên đơn vị gốc');
            order.cancellations.push({ salesOrderId: order._id, salesOrderLineId: item._id, sourceKind: line.reopeningReceiptLineId ? 'FAILED_DELIVERY_RETURN' : 'UNISSUED', reopeningReceiptLineId: line.reopeningReceiptLineId, cancelledQtyBase: line.qtyBase, reason: input.reason, sourceVersion: order.version, cancelledBy: actor._id, cancelledAt: new Date(), operationId });
        }
        if (order.items.every(i => sum(order.cancellations.filter(c => same(c.salesOrderLineId, i._id)), 'cancelledQtyBase').eq(String(i.qtyBase))))
            order.workflowStatus = 'CANCELLED';
        return { document: await saveVersion(order, input.expectedVersion, session), versionBefore: input.expectedVersion, reason: input.reason };
    });
}
export function createIssueRequest(user, id, input) {
    return command(user, 'CREATE_ISSUE_REQUEST', 'issue_request:create', id, input, async (id, a, s) => { const r = await m.WarehouseIssueRequest.findById(id).session(s); if (!r)
        throw notFoundError(); await ownOrder(a, r.header.salesOrderId, s); }, async (session, actor) => {
        const order = await ownOrder(actor, id, session);
        checkVersion(order, input.expectedVersion);
        open(order);
        requireWarehouseAccess(actor, input.warehouseId);
        unique(input.lines, 'lineId');
        if (!await m.Warehouse.exists({ _id: input.warehouseId, isActive: true }).session(session))
            throw validationError('Kho không hoạt động');
        const used = await committed(order, session);
        const request = new m.WarehouseIssueRequest({ ...await nextDocumentFields(m.WarehouseIssueRequest, 'WIR', input.warehouseId, session), workflowStatus: 'OPEN', version: 1, createdBy: actor._id, header: { salesOrderId: order._id, salesOrderVersion: order.version, requestedWarehouseId: input.warehouseId, neededOn: input.neededOn, deliveryAddressSnapshot: order.header.deliveryAddressSnapshot, requestedBy: actor._id, requestedAt: new Date() }, items: [] });
        for (const row of input.lines) {
            const item = order.items.id(row.lineId);
            if (!item || exact(row.qtyBase).plus(used(item)).gt(String(item.qtyBase)))
                throw validationError('Vượt lượng SO còn được yêu cầu');
            positive(row.qtyBase);
            const product = await m.Product.findById(item.productId).session(session);
            if (!product?.isActive || (product.wholeBaseUnits && !exact(row.qtyBase).isInteger()))
                throw validationError('Lượng yêu cầu không đúng đơn vị gốc');
            request.items.push(copyItem(item, row.qtyBase, { lineKind: 'ISSUE_REQUEST', details: { salesOrderLineId: item._id, releaseKey: String(newId()) }, sources: [sourceLink(order, item, row.qtyBase)] }));
        }
        await request.save({ session });
        await saveVersion(order, order.version, session);
        return { document: request };
    });
}
// Compare eligible physical sources inside the requested warehouse and lot scope.
async function fifoSources(warehouseId, productId, lotId, session) {
    const frozen = await m.StocktakeLocationLock.find({ status: 'LOCKED' }).session(session).distinct('locationId');
    const locations = await m.WarehouseLocation.find({ warehouseId, _id: { $nin: frozen }, isActive: true, locationType: 'STORAGE', isPickable: true }).session(session).lean();
    const points = await m.StockHoldingPoint.find({ type: 'LOCATION', locationId: { $in: locations.map(l => l._id) } }).session(session).lean();
    const batches = await m.ProductBatch.find({ productId, identificationStatus: 'VERIFIED', ...(lotId && { _id: lotId }) }).session(session).lean();
    const balances = await m.InventoryBalance.find({ holdingPointId: { $in: points.map(p => p._id) }, batchId: { $in: batches.map(b => b._id) }, ownerType: 'STORE', qualityStatus: 'GOOD', quantityBase: { $gt: 0 } }).session(session).lean();
    const receipts = await m.StockTransaction.aggregate([{ $unwind: '$movements' }, { $match: { 'movements.toBalanceId': { $in: balances.map(b => b._id) } } }, { $group: { _id: '$movements.toBalanceId', firstReceivedAt: { $min: '$occurredAt' } } }]).session(session);
    const candidates = [];
    for (const balance of balances) {
        if (!(await freeQuantity(balance, session)).gt(0)) continue;
        const firstReceivedAt = receipts.find(r => same(r._id, balance._id))?.firstReceivedAt;
        candidates.push({ id: String(balance._id), firstReceivedAt: firstReceivedAt || null });
    }
    return candidates.sort((a,b) => (a.firstReceivedAt ? +new Date(a.firstReceivedAt) : Infinity) - (b.firstReceivedAt ? +new Date(b.firstReceivedAt) : Infinity) || a.id.localeCompare(b.id));
}
export function createDelivery(user, input) {
    return command(user, 'CREATE_OUTBOUND_DELIVERY', 'outbound_delivery:create', input.issueRequestId, input, async (id, a, s) => { const d = await m.DeliveryOrder.findById(id).session(s); if (!d)
        throw notFoundError(); await requestSource(a, d.header.issueRequestId, s, true); requireWarehouseAccess(a, d.header.warehouseId); }, async (session, actor, operationId) => {
        const { request, order } = await requestSource(actor, input.issueRequestId, session, true);
        checkVersion(request, input.expectedVersion);
        open(request);
        open(order);
        requireWarehouseAccess(actor, input.warehouseId);
        const existing = await m.DeliveryOrder.find({ 'header.issueRequestId': request._id, workflowStatus: { $ne: 'CANCELLED' } }).session(session);
        const oldReturns = await m.FailedDeliveryReceipt.find({ 'demandReopenings.issueRequestLineId': { $in: request.items.map(i => i._id) }, workflowStatus: 'POSTED' }).session(session);
        const oldReuses = oldReturns.flatMap(r => r.commitmentTransfers || []);
        const delivery = new m.DeliveryOrder({ ...await nextDocumentFields(m.DeliveryOrder, 'OD', input.warehouseId, session), workflowStatus: 'RELEASED', version: 1, createdBy: actor._id, header: { warehouseId: input.warehouseId, issueRequestId: request._id, plannedOn: input.plannedOn, recipientName: input.recipientName, recipientPhone: input.recipientPhone, deliveryAddress: input.deliveryAddress, releasedBy: actor._id, releasedAt: new Date() }, items: [] });
        const quantities = new Map();
        for (const row of input.lines) {
            positive(row.qtyBase);
            const source = request.items.id(row.lineId);
            if (!source)
                throw validationError('Dòng không thuộc yêu cầu xuất');
            const ctx = await sourceContext(row.sourceBalanceId, session);
            if (!same(ctx.location?.warehouseId, input.warehouseId) || ctx.location.locationType !== 'STORAGE' || !ctx.location.isPickable || ctx.balance.ownerType !== 'STORE' || ctx.balance.qualityStatus !== 'GOOD' || ctx.batch.identificationStatus !== 'VERIFIED' || !same(ctx.product._id, source.productId) || (source.lotId && !same(source.lotId, ctx.batch._id)))
                throw validationError('Tồn không phù hợp dòng yêu cầu hoặc kho xuất');
            if (!ctx.product.isActive || (ctx.product.wholeBaseUnits && !exact(row.qtyBase).isInteger()))
                throw validationError('Lượng giao không đúng đơn vị gốc');
            if (ctx.balance.version !== row.sourceBalanceVersion)
                throw validationError('Tồn đã thay đổi, tải lại');
            await guardLocations([ctx.location._id], session);
            if (exact(row.qtyBase).gt(await freeQuantity(ctx.balance, session)))
                throw validationError('Không đủ lượng khả dụng');
            const candidates = await fifoSources(input.warehouseId, source.productId, source.lotId, session);
            const selected = candidates.find(c => c.id === row.sourceBalanceId);
            const oldest = candidates[0];
            if (oldest?.firstReceivedAt && selected && (!selected.firstReceivedAt || +new Date(oldest.firstReceivedAt) < +new Date(selected.firstReceivedAt)) && !input.fifoExceptionReason?.trim())
                throw validationError('Có nguồn tương thích nhận trước; chọn nguồn FIFO hoặc ghi lý do ngoại lệ');
            const total = (quantities.get(row.lineId) || exact('0')).plus(row.qtyBase);
            quantities.set(row.lineId, total);
            const item = copyItem(source, row.qtyBase, { lineNo: delivery.items.length + 1, lineKind: 'OUTBOUND_DELIVERY', lotId: ctx.batch._id, details: { issueRequestLineId: source._id }, sources: [sourceLink(request, source, row.qtyBase)] });
            delivery.items.push(item);
            if (row.reopeningReceiptLineId) {
                const { receipt, row: back } = await reopening(order, row.reopeningReceiptLineId, row.qtyBase, session);
                if (!same(back.issueRequestLineId, source._id))
                    throw validationError('Sai yêu cầu của lượng giao bù');
                receipt.commitmentTransfers.push({ reopeningReceiptLineId: row.reopeningReceiptLineId, fromDeliveryOrderLineId: back.deliveryOrderLineId, toDeliveryOrderLineId: item._id, quantityBase: row.qtyBase, sourceVersion: receipt.version, targetVersion: 1, transferredBy: actor._id, transferredAt: new Date(), operationId });
                await saveVersion(receipt, receipt.version, session);
                quantities.set(row.lineId, total.minus(row.qtyBase));
            }
            // Other reservations are already deducted by freeQuantity; never reserve them twice.
            await new m.StockReservation({ demandRef: { documentType: 'sales_orders', documentId: order._id, itemId: source.details.salesOrderLineId }, executionRef: reference(delivery, item), balanceId: ctx.balance._id, reservedQty: row.qtyBase, creationKey: hash({ od: String(delivery._id), item: String(item._id) }), createdBy: actor._id }).save({ session });
            await m.InventoryBalance.updateOne({ _id: ctx.balance._id, version: ctx.balance.version }, { $inc: { version: 1 } }, { session });
        }
        for (const [id, quantity] of quantities) {
            const source = request.items.id(id), oldItems = existing.flatMap(d => d.items).filter(i => same(i.details.issueRequestLineId, id));
            const used = sum(oldItems, 'qtyBase').minus(sum(oldReuses.filter(r => oldItems.some(i => same(i._id, r.toDeliveryOrderLineId))), 'quantityBase'));
            if (quantity.plus(used).gt(String(source.qtyBase)))
                throw validationError('Vượt hạn mức yêu cầu xuất');
        }
        await delivery.save({ session });
        await saveVersion(request, request.version, session);
        await saveVersion(order, order.version, session);
        return { document: delivery, reason: input.fifoExceptionReason };
    });
}
export function createPicking(user, id, input) {
    return command(user, 'CREATE_SALES_PICKING', 'picking_task:create', id, input, async (id, a, s) => taskSource(a, id, s), async (session, actor) => {
        const { delivery, request, order } = await deliverySource(actor, id, session);
        checkVersion(delivery, input.expectedVersion);
        open(delivery);
        unique(input.lines, 'reservationId');
        const issue = new m.SalesGoodsIssue({ ...await nextDocumentFields(m.SalesGoodsIssue, 'GI', delivery.header.warehouseId, session), workflowStatus: 'DRAFT', version: 1, createdBy: actor._id, header: { warehouseId: delivery.header.warehouseId, deliveryOrderId: delivery._id }, items: [] });
        const task = new m.TransferOrder({ ...await nextDocumentFields(m.TransferOrder, 'PICK', delivery.header.warehouseId, session), workflowStatus: 'OPEN', version: 1, createdBy: actor._id, header: { warehouseId: delivery.header.warehouseId, taskKind: 'PICK', assignedTo: actor._id }, sources: [sourceLink(issue)], items: [] });
        for (const row of input.lines) {
            positive(row.qtyBase);
            const reservation = await m.StockReservation.findById(row.reservationId).session(session);
            const source = reservation && delivery.items.id(reservation.executionRef?.itemId);
            if (!source || !same(reservation.executionRef.documentId, delivery._id) || exact(row.qtyBase).gt(remainingReservation(reservation)))
                throw validationError('Lượng giữ không thuộc lệnh giao hoặc không đủ');
            const ctx = await sourceContext(reservation.balanceId, session);
            const dest = await locationAt(row.toLocationId, delivery.header.warehouseId, ['STAGING'], session);
            await guardLocations([ctx.location?._id, dest._id], session);
            if (!ctx.product.isActive || (ctx.product.wholeBaseUnits && !exact(row.qtyBase).isInteger()) || ctx.balance.ownerType !== 'STORE' || ctx.balance.qualityStatus !== 'GOOD' || ctx.batch.identificationStatus !== 'VERIFIED')
                throw validationError('Tồn không đủ điều kiện soạn');
            const wir = request.items.id(source.details.issueRequestLineId), so = wir && order.items.id(wir.details.salesOrderLineId);
            if (!so)
                throw validationError('Đứt chuỗi nguồn SO');
            const gi = copyItem(source, row.qtyBase, { lineNo: issue.items.length + 1, lineKind: 'SALES_GOODS_ISSUE', salesOrderItemId: so._id, details: { outboundDeliveryLineId: source._id }, salePriceSnapshot: { saleUnit: so.enteredUnit, baseUnitsPerSaleUnit: so.baseUnitsPerUnit, unitSellingPrice: so.unitSellingPrice, salesOrderRevision: so.priceRevision }, sources: [sourceLink(delivery, source, row.qtyBase)] });
            issue.items.push(gi);
            const pick = copyItem(gi, row.qtyBase, { lineNo: task.items.length + 1, lineKind: 'WAREHOUSE_TASK', details: { fromLocationId: ctx.location._id, toLocationId: dest._id, qualityCode: 'GOOD', sourceBalanceId: ctx.balance._id, sourceBalanceVersion: ctx.balance.version }, sources: [sourceLink(issue, gi, row.qtyBase)] });
            task.items.push(pick);
            reservation.movedQty = exact(reservation.movedQty).plus(row.qtyBase).toFixed();
            await saveVersion(reservation, reservation.version, session);
            await new m.StockReservation({ demandRef: reservation.demandRef, executionRef: reference(task, pick), balanceId: ctx.balance._id, reservedQty: row.qtyBase, previousReservationId: reservation._id, creationKey: hash({ task: String(task._id), line: String(pick._id) }), createdBy: actor._id }).save({ session });
        }
        await issue.save({ session });
        await task.save({ session });
        await saveVersion(delivery, delivery.version, session);
        return { document: task, resultRefs: [{ documentType: 'sales_goods_issues', documentId: issue._id }] };
    });
}
export function confirmPicking(user, id, input) {
    return command(user, 'CONFIRM_SALES_PICKING', 'picking_task:confirm', id, input, async (id, a, s) => taskSource(a, id, s), async (session, actor) => {
        const { task, issue } = await taskSource(actor, id, session);
        checkVersion(task, input.expectedVersion);
        if (!['OPEN', 'PARTIAL'].includes(task.workflowStatus))
            throw validationError('Tác vụ đã kết thúc');
        if (!same(task.header.assignedTo, actor._id))
            throw validationError('Chỉ người được giao soạn xác nhận');
        unique(input.lines, 'lineId');
        const posting = beginStock(task, actor, 'SALES_PICK', input), destinations = [];
        for (const row of input.lines) {
            positive(row.qtyBase);
            const item = task.items.id(row.lineId);
            if (!item)
                throw validationError('Dòng không thuộc tác vụ');
            const reservation = await m.StockReservation.findOne({ 'executionRef.documentId': task._id, 'executionRef.itemId': item._id, balanceId: item.details.sourceBalanceId }).session(session);
            if (!reservation || exact(row.qtyBase).gt(remainingReservation(reservation)))
                throw validationError('Vượt lượng còn phải soạn');
            const ctx = await sourceContext(reservation.balanceId, session);
            if (ctx.balance.qualityStatus !== 'GOOD' || ctx.balance.ownerType !== 'STORE' || !ctx.product.isActive || ctx.batch.identificationStatus !== 'VERIFIED' || !same(ctx.location?._id, item.details.fromLocationId) || !ctx.location?.isActive || !ctx.location.isPickable)
                throw validationError('Tồn nguồn không còn đủ điều kiện soạn');
            const target = await locationAt(item.details.toLocationId, task.header.warehouseId, ['STAGING'], session);
            if (target.locationType !== 'STAGING') throw validationError('Đích soạn không còn là vị trí tập kết');
            await guardLocations([item.details.fromLocationId, item.details.toLocationId], session);
            const dest = await balanceAt({ type: 'LOCATION', locationId: item.details.toLocationId }, ctx.balance, 'GOOD', session);
            reservation.movedQty = exact(reservation.movedQty).plus(row.qtyBase).toFixed();
            await saveVersion(reservation, reservation.version, session);
            await moveStock(ctx.balance._id, dest._id, row.qtyBase, item._id, posting, actor, session, { excludeTaskId: task._id });
            await new m.StockReservation({ demandRef: reservation.demandRef, executionRef: { documentType: 'sales_goods_issues', documentId: issue._id, itemId: item.sources[0].itemId }, balanceId: dest._id, reservedQty: row.qtyBase, previousReservationId: reservation._id, originMovementId: posting.movements.at(-1)._id, creationKey: hash({ posting: String(posting._id), item: String(item._id) }), createdBy: actor._id }).save({ session });
            destinations.push(item.details.toLocationId);
        }
        await verifyCapacity(destinations, session);
        await posting.save({ session });
        const remaining = await m.StockReservation.find({ 'executionRef.documentId': task._id }).session(session);
        task.workflowStatus = remaining.every(r => remainingReservation(r).isZero()) ? 'CONFIRMED' : 'PARTIAL';
        if (task.workflowStatus === 'CONFIRMED') {
            task.header.confirmedBy = actor._id;
            task.header.confirmedAt = new Date();
            issue.workflowStatus = 'PICKED';
            await saveVersion(issue, issue.version, session);
        }
        return { document: await saveVersion(task, input.expectedVersion, session), versionBefore: input.expectedVersion, stockTransactionId: posting._id };
    });
}
export async function listSalesOrders(user, query) {
    requirePermission(user, 'sales_order:read');
    const named = ['OWNER', 'ACCOUNTANT', 'SALES', 'ADMIN'].includes(currentRole(user)?.code);
    let filter = currentRole(user)?.code === 'SALES' ? { createdBy: user._id } : {};
    if (!named) {
        const ids = await m.WarehouseIssueRequest.find({ 'header.requestedWarehouseId': { $in: user.warehouseIds || [] } }).distinct('header.salesOrderId');
        filter._id = { $in: ids };
    }
    if (query.q)
        filter.documentNo = new RegExp(escapeRegex(query.q), 'i');
    if (query.status)
        filter.workflowStatus = query.status;
    return page(m.SalesOrder, filter, query, 'documentNo documentKind workflowStatus version createdAt header.customerId header.neededOn');
}
export async function salesOptions(user) {
    if (!hasPermission(user, 'sales_order:create') && !hasPermission(user, 'outbound_delivery:create') && !hasPermission(user, 'picking_task:create'))
        requirePermission(user, 'sales_order:create');
    const warehouseFilter = currentRole(user)?.code === 'OWNER' ? {} : { _id: { $in: user.warehouseIds || [] } };
    const warehouses = await m.Warehouse.find({ ...warehouseFilter, isActive: true }).lean();
    const ids = warehouses.map(w => w._id);
    const locations = await m.WarehouseLocation.find({ warehouseId: { $in: ids }, isActive: true }).lean();
    const points = await m.StockHoldingPoint.find({ type: 'LOCATION', locationId: { $in: locations.map(l => l._id) } }).lean();
    const balances = await m.InventoryBalance.find({ holdingPointId: { $in: points.map(p => p._id) }, ownerType: 'STORE', qualityStatus: 'GOOD', quantityBase: { $gt: 0 } }).lean();
    const chronology = await m.StockTransaction.aggregate([{ $unwind: '$movements' }, { $match: { 'movements.toBalanceId': { $in: balances.map(b=>b._id) } } }, { $group: { _id: '$movements.toBalanceId', firstReceivedAt: { $min: '$occurredAt' } } }]);
    balances.sort((a,b)=>(+(chronology.find(r=>same(r._id,a._id))?.firstReceivedAt || 8640000000000000))-(+(chronology.find(r=>same(r._id,b._id))?.firstReceivedAt || 8640000000000000)));
    const uoms=await m.Uom.find({isActive:true}).select('_id code name isCarton').lean();
    const conversions=await m.Conversion.find({uomId:{$in:uoms.map(u=>u._id)},validFrom:{$lte:new Date()}}).sort({validFrom:-1}).lean();
    return { units:uoms.map(dto), conversions:conversions.filter((c,index,all)=>all.findIndex(x=>same(x.productId,c.productId)&&String(x.productBatchId||'')===String(c.productBatchId||'')&&same(x.uomId,c.uomId))===index).map(dto), customers: (await m.Customer.find({}).select('_id code name phone').lean()).map(dto), products: (await m.Product.find({ isActive: true }).select('_id name sku baseUnit').lean()).map(dto), batches: (await m.ProductBatch.find({ identificationStatus: 'VERIFIED' }).lean()).map(dto), warehouses: warehouses.map(dto), locations: locations.map(dto), holdingPoints: points.map(dto), balances: await Promise.all(balances.map(async (b) => ({ ...dto(b), firstReceivedAt: chronology.find(r=>same(r._id,b._id))?.firstReceivedAt?.toISOString() || null, availableQtyBase: (await freeQuantity(b)).toFixed() }))) };
}
export async function listPicking(user, query) { requirePermission(user, 'picking_task:read'); const filter = { 'header.taskKind': 'PICK', 'sources.subjectCollection': 'sales_goods_issues', 'header.warehouseId': { $in: user.warehouseIds || [] } }; if (currentRole(user)?.code === 'OWNER')
    delete filter['header.warehouseId']; if (query.warehouseId) {
    requireWarehouseAccess(user, query.warehouseId);
    filter['header.warehouseId'] = query.warehouseId;
} if (currentRole(user)?.code === 'SALES') {
    const orders = await m.SalesOrder.find({ createdBy: user._id }).distinct('_id');
    const requests = await m.WarehouseIssueRequest.find({ 'header.salesOrderId': { $in: orders } }).distinct('_id');
    const deliveries = await m.DeliveryOrder.find({ 'header.issueRequestId': { $in: requests } }).distinct('_id');
    const issues = await m.SalesGoodsIssue.find({ 'header.deliveryOrderId': { $in: deliveries } }).distinct('_id');
    filter['sources.documentId'] = { $in: issues };
} if (query.status)
    filter.workflowStatus = query.status; if (query.q)
    filter.documentNo = new RegExp(escapeRegex(query.q), 'i'); return page(m.TransferOrder, filter, query); }
export async function getPicking(user, id) { requirePermission(user, 'picking_task:read'); return transaction(async (session) => { const { task, issue, delivery } = await taskSource(user, id, session); const postings = await m.StockTransaction.find({ sourceId: task._id, operation: 'SALES_PICK' }).session(session); return { ...dto(task), issue: redactedIssue(user, issue), deliveryId: String(delivery._id), items: task.items.map(i => ({ ...dto(i), actualQtyBase: sum(postings.flatMap(p => p.movements).filter(v => same(v.sourceLineId, i._id)), 'quantityBase').toFixed() })) }; }); }
function redactedIssue(user, issue) { return ['OWNER', 'ACCOUNTANT', 'SALES'].includes(currentRole(user)?.code) ? dto(issue) : redactPrices(dto(issue)); }
