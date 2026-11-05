import { Schema, appendOnly, code, date, decimal, exact, integer, options, ref, rules, sameId, text } from '../model-utils.js';
import { QUALITY_CODES } from '../constants.js';

const id = Schema.Types.ObjectId;
export function stockSchemas() {
  const points = new Schema({
    type: code(['LOCATION','IN_TRANSIT']), locationId: ref('Location', false), dispatchLineId: id,
  }, options('stock_holding_points'));
  for (const field of ['locationId','dispatchLineId']) {
    points.index({ [field]: 1 }, { unique: true, partialFilterExpression: { [field]: { $type: 'objectId' } } });
  }
  rules(points, function () {
    if ((this.type === 'LOCATION') !== Boolean(this.locationId) || (this.type === 'IN_TRANSIT') !== Boolean(this.dispatchLineId)) {
      this.invalidate('type', 'Holding point requires its matching location or dispatch item');
    }
  });
  const balances = new Schema({
    holdingPointId: ref('StockAccount'), batchId: ref('Lot'), qualityStatus: code(QUALITY_CODES),
    ownerType: code(['STORE','SUPPLIER','CUSTOMER']), ownerId: { type: id, default: null },
    quantityBase: decimal(), version: integer(0),
  }, options('inventory_balances'));
  balances.index({ holdingPointId: 1, batchId: 1, qualityStatus: 1, ownerType: 1, ownerId: 1 }, { unique: true });
  rules(balances, function () {
    if ((this.ownerType === 'STORE') === Boolean(this.ownerId)) this.invalidate('ownerId', 'Store-owned stock has no external owner; other stock requires one');
  });
  const transactions = new Schema({
    sourceType: text(80), sourceId: { type: id, required: true }, operation: text(40), eventKey: text(100),
    requestKey: text(120, { unique: true }), requestHash: text(64, { match: /^[a-f\d]{64}$/i }),
    performedBy: ref('User'), occurredAt: date(), recordedAt: date(), reversedTransactionId: ref('PostingBatch', false),
  }, options('stock_transactions'));
  transactions.index({ sourceId: 1, operation: 1, eventKey: 1 }, { unique: true });
  transactions.index({ reversedTransactionId: 1 }, { unique: true, partialFilterExpression: { reversedTransactionId: { $type: 'objectId' } } });
  appendOnly(transactions);
  const movements = new Schema({
    transactionId: ref('PostingBatch'), lineNo: integer(1), sourceLineId: { type: id, required: true },
    fromBalanceId: ref('StockBalance', false), toBalanceId: ref('StockBalance', false), quantityBase: decimal({ positive: true }),
    fromBefore: decimal({ required: false }), fromAfter: decimal({ required: false }),
    toBefore: decimal({ required: false }), toAfter: decimal({ required: false }),
  }, options('stock_movements'));
  movements.index({ transactionId: 1, lineNo: 1 }, { unique: true });
  rules(movements, function () {
    if ((!this.fromBalanceId && !this.toBalanceId) || sameId(this.fromBalanceId, this.toBalanceId)) this.invalidate('toBalanceId','Invalid movement endpoints');
    for (const side of ['from','to']) {
      const present = Boolean(this[side+'BalanceId']);
      const before = this[side+'Before'], after = this[side+'After'];
      if (present !== (before != null) || present !== (after != null)) this.invalidate(side+'After','Endpoint requires both quantities');
      else if (present && this.quantityBase) {
        const change = exact(this.quantityBase).times(side === 'from' ? -1 : 1);
        if (!exact(before).plus(change).eq(String(after))) this.invalidate(side+'After','Movement quantity does not reconcile');
      }
    }
  });
  appendOnly(movements);
  return { StockAccount: points, StockBalance: balances, PostingBatch: transactions, StockMovement: movements };
}
