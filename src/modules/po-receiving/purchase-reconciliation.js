import * as m from '../../models/index.js';
import { exact } from '../../models/model-utils.js';
import { id, same, read } from './purchase-core.js';
import { purchaseOrderQuantities } from '../purchase-orders/purchase-order.service.js';

// Read-only diagnostic: never repairs balances or invents historical sources.
export async function reconcilePurchasing(session = null) {
  const issues = [];
  const balances = await read(m.StockBalance.find({}), session);
  const movements = await read(m.StockMovement.find({}), session);
  const ledger = new Map(balances.map(b => [id(b._id), exact('0')]));
  for (const movement of movements) {
    for (const [key, sign] of [['fromBalanceId',-1],['toBalanceId',1]]) {
      if (!movement[key]) continue;
      const balanceId = id(movement[key]);
      if (!ledger.has(balanceId)) { issues.push({ code: 'MISSING_BALANCE', balanceId }); continue; }
      ledger.set(balanceId, ledger.get(balanceId).plus(exact(movement.qtyBase).mul(sign)));
    }
  }
  for (const b of balances) if (!ledger.get(id(b._id)).eq(exact(b.qtyBase))) issues.push({ code: 'LEDGER_BALANCE', balanceId: id(b._id) });
  const placements = await read(m.ReceiptPlacement.find({}), session);
  const taskLines = await read(m.DocumentLine.find({ 'details.placementId': { $in: placements.map(p => p._id) }, lineKind: 'WAREHOUSE_TASK' }), session);
  const taskDocs = await read(m.BusinessDocument.find({ _id: { $in: taskLines.map(l => l.documentId) }, documentKind: 'TO' }), session);
  const totals = new Map();
  for (const p of placements) {
    const own = movements.filter(r => same(r.lineId, p.receiptLineId));
    const received = own.reduce((sum,r) => sum.plus(exact(r.qtyBase).mul(r.toBalanceId ? 1 : -1)), exact('0'));
    if (!received.eq(exact(p.receivedQtyBase).minus(exact(p.reversedQtyBase)))) issues.push({ code: 'RECEIPT_PROJECTION', receiptLineId: id(p.receiptLineId) });
    let placed = exact('0'), claimed = exact('0');
    for (const line of taskLines.filter(l => same(l.details.placementId, p._id))) {
      const actual = movements.filter(r => same(r.lineId, line._id)).reduce((sum,r) => sum.plus(exact(r.qtyBase)), exact('0'));
      placed = placed.plus(actual);
      const d = taskDocs.find(d => same(d._id, line.documentId));
      if (d && ['DRAFT','OPEN','PARTIAL'].includes(d.workflowStatus)) claimed = claimed.plus(exact(line.qtyBase).minus(actual));
    }
    if (!placed.eq(exact(p.placedQtyBase)) || !claimed.eq(exact(p.claimedQtyBase))) issues.push({ code: 'PLACEMENT_PROJECTION', receiptLineId: id(p.receiptLineId) });
    const remaining = received.minus(placed);
    if (remaining.isNegative() || claimed.gt(remaining)) issues.push({ code: 'PLACEMENT_CAP', receiptLineId: id(p.receiptLineId) });
    totals.set(id(p.sourceBalanceId), (totals.get(id(p.sourceBalanceId)) ?? exact('0')).plus(remaining));
  }
  for (const [balanceId, remaining] of totals) {
    const b = balances.find(b => same(b._id, balanceId));
    if (!b || remaining.gt(exact(b.qtyBase))) issues.push({ code: 'PLACEMENT_PHYSICAL_SOURCE', balanceId });
  }
  const claims = await read(m.PurchaseSourceClaim.find({}), session);
  const approvals = await read(m.Approval.find({ _id: { $in: claims.map(c => c.approvalId) } }), session);
  const byRr = new Map();
  for (const c of claims) byRr.set(id(c.rrLineId), (byRr.get(id(c.rrLineId)) ?? exact('0')).plus(exact(c.qtyBase)));
  for (const [lineId, used] of byRr) {
    const authority = approvals.flatMap(a => a.lines).filter(l => same(l.lineId, lineId) && l.outcome === 'APPROVE');
    if (!authority.length || used.gt(exact(authority[0].approvedQty))) issues.push({ code: 'RR_ALLOWANCE', rrLineId: lineId });
  }
  const pos = await read(m.BusinessDocument.find({ documentKind: 'PO' }), session);
  for (const po of pos) {
    const q = await purchaseOrderQuantities(po, session);
    for (const line of q) {
      if (line.quantityState !== 'KNOWN') { issues.push({ code: 'PO_SOURCE_INCOMPLETE', poId: id(po._id), lineId: line.lineId }); continue; }
      const used = claims.filter(c => same(c.poLineId, line.lineId)).reduce((sum,c) => sum.plus(exact(c.qtyBase)), exact('0'));
      const expected = po.workflowStatus === 'DRAFT' ? exact('0') : exact(line.authorizedOrderedQtyBase).minus(exact(line.closedRemainderQtyBase));
      if (!used.eq(expected)) issues.push({ code: 'PO_ALLOWANCE_PROJECTION', poId: id(po._id), lineId: line.lineId });
    }
  }
  return { ok: issues.length === 0, checked: { balances: balances.length, movements: movements.length, placements: placements.length, claims: claims.length, purchaseOrders: pos.length }, issues };
}
