import { decimal, rules } from '../model-utils.js';
import { simplifySchemaEntries, simplifyData } from './field-cleanup.js';

// Existing IDs remain stable. These names identify embedded records, not collections.
export const embeddedTables = Object.freeze({
  stock_thresholds: ['products', 'stockThresholds', 'StockThreshold'],
  external_reference_lines: ['external_references', 'items', 'ExternalReferenceLine'],
  return_inspections: ['customer_returns', 'inspections', 'ReturnInspection'],
  external_payment_confirmations: ['sales_orders', 'paymentConfirmations', 'ExternalPaymentConfirmation'],
  supplier_acknowledgements: ['supplier_return_issues', 'acknowledgements', 'SupplierAcknowledgement'],
  sales_order_cancellations: ['sales_orders', 'cancellations', 'SalesOrderCancellation'],
  delivery_demand_reopenings: ['failed_delivery_receipts', 'demandReopenings', 'DeliveryDemandReopening'],
  delivery_commitment_transfers: ['failed_delivery_receipts', 'commitmentTransfers', 'DeliveryCommitmentTransfer'],
  stock_movements: ['stock_transactions', 'movements', 'StockMovement'],
  stock_holds: ['defect_reports', 'holds', 'StockHold'],
  defect_resolution_plans: ['defect_reports', 'resolutionPlans', 'DefectResolutionPlan'],
  stocktake_resolution_plans: ['stocktakes', 'resolutionPlans', 'StocktakeResolutionPlan'],
  delivery_confirmations: ['sales_orders', 'deliveryConfirmations', 'DeliveryConfirmation'],
});
export const removedCollections = Object.freeze([...Object.keys(embeddedTables), 'storage_stacks', 'storage_stack_items']);

export function consolidateSchemas(entries) {
  simplifySchemaEntries(entries);
  const byCollection = new Map(entries.map(entry => [entry.collection, entry]));
  for (const [old, [parent, field, modelName]] of Object.entries(embeddedTables)) {
    const child = byCollection.get(old).schema.clone();
    child.clearIndexes();
    child.set('excludeIndexes', true);
    child.set('embeddedCollection', old);
    child.set('embeddedModel', modelName);
    byCollection.get(parent).schema.add({ [field]: [child] });
    byCollection.get(parent).schema.index({ [field + '._id']: 1 }, { unique: true, sparse: true });
    rules(byCollection.get(parent).schema, function () {
      const rows = this[field] || [];
      if (new Set(rows.map(row => String(row._id))).size !== rows.length) this.invalidate(field, 'Duplicate embedded ID');
      const key = old === 'stock_thresholds' ? 'warehouseId' : old === 'external_reference_lines' ? 'lineKey' : old === 'stock_movements' ? 'lineNo' : null;
      if (key && new Set(rows.map(row => String(row[key]))).size !== rows.length) this.invalidate(field, 'Duplicate embedded key');
      const same = (a,b) => String(a) === String(b);
      const ownsItem = id => this.items?.some(item => same(item._id,id));
      for (const row of rows) {
        if (old === 'stock_movements' && !same(row.transactionId,this._id)) this.invalidate(field,'Movement belongs to another transaction');
        if (old === 'stock_holds' && !ownsItem(row.defectReportLineId)) this.invalidate(field,'Hold belongs to another defect report');
        if (old === 'stocktake_resolution_plans' && !same(row.header.stocktakeId,this._id)) this.invalidate(field,'Plan belongs to another stocktake');
        if (old === 'delivery_confirmations' && !same(row.header.salesOrderId,this._id)) this.invalidate(field,'Confirmation belongs to another sales order');
        if (old === 'defect_resolution_plans' && (
          row.items.some(item => !ownsItem(item.details?.defectLineId)) ||
          (row.header.defectReportId && !same(row.header.defectReportId,this._id)) ||
          row.sources.some(source => source.subjectCollection === 'defect_reports' && !same(source.documentId,this._id))
        )) this.invalidate(field,'Plan belongs to another defect report');
      }
    });
  }
  byCollection.get('stock_transactions').schema.index({ 'movements.fromBalanceId': 1, occurredAt: 1 });
  byCollection.get('stock_transactions').schema.index({ 'movements.toBalanceId': 1, occurredAt: 1 });
  byCollection.get('defect_reports').schema.index({ 'holds.allocations.balanceId': 1, 'holds.status': 1 });
  const portions = byCollection.get('storage_stack_items').schema.clone();
  portions.remove('stackId');
  portions.remove('balanceId');
  portions.remove('version');
  portions.clearIndexes();
  portions.set('excludeIndexes', true);
  portions.add({ measuredVolumeMm3: decimal({ required: false }), extraOccupiedVolumeMm3: decimal({ required: false }) });
  byCollection.get('inventory_balances').schema.add({ packagingPortions: [portions] });
  const location = byCollection.get('warehouse_locations').schema;
  location.remove('usableHeightMm');
  // Height is shared by all bins in the warehouse.
  return entries.filter(entry => !removedCollections.includes(entry.collection));
}

// Read-only projection for legacy-shaped validation and migration comparisons.
// The returned extra arrays must never be persisted as collections.
export function expandEmbedded(data) {
  const result = { ...data };
  for (const [old, [parent, field]] of Object.entries(embeddedTables)) {
    result[old] = data[old] || data[parent].flatMap(row => row[field] || []);
    if (!data[old] && ['stock_thresholds','external_reference_lines'].includes(old)) {
      const key = old === 'stock_thresholds' ? 'productId' : 'referenceId';
      result[old] = data[parent].flatMap(owner => (owner[field] || []).map(row => ({...row,[key]:owner._id})));
    }
  }
  return result;
}

export function consolidateData(data) {
  const clone = value => Array.isArray(value) ? value.map(clone) : value && typeof value === 'object' && !value._bsontype && !(value instanceof Date)
    ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)])) : value;
  const result = clone(data);
  data = result;
  const find = (collection, id) => result[collection]?.find(row => String(row._id) === String(id));
  const itemParent = (collection, id) => result[collection]?.find(row => row.items?.some(item => String(item._id) === String(id)));
  for (const [old, [parent, field]] of Object.entries(embeddedTables)) {
    for (const row of result[parent]) row[field] ??= [];
    for (const row of data[old] || []) {
      let owner;
      if (old === 'stock_thresholds') owner = find(parent, row.productId);
      if (old === 'external_reference_lines') owner = find(parent, row.referenceId);
      if (old === 'return_inspections') owner = itemParent(parent, row.returnLineId);
      if (old === 'external_payment_confirmations') owner = find(parent, row.header.salesOrderId);
      if (old === 'sales_order_cancellations') owner = find(parent, row.salesOrderId);
      if (old === 'delivery_demand_reopenings') owner = itemParent(parent, row.receiptLineId);
      if (old === 'delivery_commitment_transfers') owner = itemParent(parent, row.reopeningReceiptLineId);
      if (old === 'stock_movements') owner = find(parent, row.transactionId);
      if (old === 'stock_holds') owner = itemParent(parent, row.defectReportLineId);
      if (old === 'stocktake_resolution_plans') owner = find(parent, row.header.stocktakeId);
      if (old === 'delivery_confirmations') owner = find(parent, row.header.salesOrderId);
      if (old === 'defect_resolution_plans') {
        const owners = new Set((row.items || []).map(item => itemParent(parent, item.details?.defectLineId)));
        if (row.header.defectReportId) owners.add(find(parent, row.header.defectReportId));
        for (const source of row.sources || []) if (source.subjectCollection === parent) owners.add(find(parent, source.documentId));
        if (owners.size === 1) owner = [...owners][0];
      }
      if (old === 'supplier_acknowledgements') {
        const owners = new Set(row.items.map(item => itemParent(parent, item.details.dispatchLineId)));
        if (owners.size === 1) owner = [...owners][0];
      }
      if (!owner) throw new Error('Cannot unambiguously embed ' + old + ' record ' + row._id);
      if (owner[field].some(existing => String(existing._id) === String(row._id))) throw new Error('Duplicate consolidation input: ' + old);
      owner[field].push(row);
    }
    delete result[old];
  }
  for (const balance of result.inventory_balances) balance.packagingPortions ??= [];
  for (const row of data.storage_stack_items || []) {
    const stack = find('storage_stacks', row.stackId);
    if (!stack || stack.isCleared) continue;
    const balance = find('inventory_balances', row.balanceId);
    if (!balance) throw new Error('Packaging balance missing');
    const { stackId, ...portion } = row;
    if (stack.volumeMethod === 'PACKAGES' && data.storage_stack_items.find(item => String(item.stackId) === String(stack._id)) === row) {
      portion.extraOccupiedVolumeMm3 = stack.supportVolumeMm3;
    }
    if (stack.volumeMethod === 'MEASURED') {
      const members = data.storage_stack_items.filter(item => String(item.stackId) === String(stack._id));
      if (members.length !== 1) throw new Error('Mixed measured stack requires manual volume allocation: ' + stack._id);
      portion.measuredVolumeMm3 = String(stack.occupiedLengthMm * stack.occupiedWidthMm * stack.occupiedHeightMm);
    }
    balance.packagingPortions.push(portion);
  }
  for (const location of result.warehouse_locations) delete location.usableHeightMm;
  delete result.storage_stacks;
  delete result.storage_stack_items;
  return simplifyData(result);
}
