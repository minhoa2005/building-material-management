import { isDocumentId } from '../../models/document-identity.js';
import { ReplenishmentLock, SalesOrder, Warehouse, ProductBatch, InventoryBalance, models } from '../../models/runtime.js';

// All warehouses for the affected products participate: another warehouse can
// supply the same SO. This deliberately trades some product-level contention
// for a complete guard set while no persisted source-option allocation exists.
export async function guardCommandCoverage(targetId, input, session) {
  const ids = new Set(targetId ? [String(targetId)] : []), products = new Set();
  function visit(value, key = '') {
    if (value?._bsontype === 'ObjectId') value = String(value);
    if (Array.isArray(value)) { for (const v of value) visit(v, key); return; }
    if (value && typeof value === 'object') { for (const [k, v] of Object.entries(value)) visit(v, k); return; }
    if (typeof value !== 'string' || (!/^[a-f\d]{24}$/i.test(value)&&!isDocumentId(value))) return;
    if (key === 'productId') products.add(value);
    if (key === 'id' || key === '_id' || key.endsWith('Id')) ids.add(value);
  }
  visit(input);
  const documentModels = [...models.values()].filter(Model => Model.schema.path('items') && Model.schema.path('workflowStatus'));
  const loaded = new Set();
  for (let pass = 0; pass < 32; pass++) {
    const before = ids.size;
    for (const Model of documentModels) {
      const rootIds=Model.schema.path('_id')?.instance==='DocumentIdentity'?[...ids]:[...ids].filter(id=>/^[a-f\d]{24}$/i.test(id));
      const rows = await Model.find({ $or: [{ _id: { $in: rootIds } }, { 'items._id': { $in: [...ids].filter(id=>/^[a-f\d]{24}$/i.test(id)) } }] }).session(session).lean();
      for (const row of rows) {
        const identity = Model.collection.name + ':' + row._id;
        if (loaded.has(identity)) continue;
        loaded.add(identity);
        for (const item of row.items ?? []) if (item.productId) products.add(String(item.productId));
        visit(row.header); visit(row.sources);
        for (const item of row.items ?? []) { visit(item.sources); visit(item.details); }
      }
    }
    if (ids.size === before) break;
    if (pass === 31 || ids.size > 10000) throw new Error('Coverage source chain exceeds supported depth');
  }
  if (ids.size) {
    const objectIds=[...ids].filter(id=>/^[a-f\d]{24}$/i.test(id));
    const balances = await InventoryBalance.find({ _id: { $in: objectIds } }).session(session).lean();
    const batches = await ProductBatch.find({ _id: { $in: [...objectIds, ...balances.map(b => b.batchId)] } }).session(session).lean();
    for (const batch of batches) products.add(String(batch.productId));
  }
  if (!products.size) return;
  const orders = await SalesOrder.find({ 'items.productId': { $in: [...products] } }).select('_id').session(session).lean();
  const warehouses = await Warehouse.find({}).select('_id').session(session).lean();
  await guardReplenishment({ salesOrderIds: orders.map(o => o._id), pairs: warehouses.flatMap(w => [...products].map(productId => ({ warehouseId: w._id, productId }))) }, session);
}

// Called before location/balance writes. The session carries the touched keys so
// nested operations cannot accidentally increment or reacquire a guard twice.
export async function guardReplenishment({ pairs = [], salesOrderIds = [] }, session) {
  if (!session?.inTransaction()) throw new Error('Replenishment guards require a transaction');
  const state = session.replenishmentGuards ??= { pairs: new Map(), orders: new Set() };
  for (const id of [...new Set(salesOrderIds.map(String))].sort()) {
    if (state.orders.has(id)) continue;
    if (state.pairs.size) throw new Error('Acquire sales demand guards before warehouse guards');
    await SalesOrder.updateOne({ _id: id }, { $inc: { replenishmentPlanningVersion: 1 } }, { session, timestamps: false });
    state.orders.add(id);
  }
  const keys = new Map(pairs.map(p => [String(p.warehouseId) + ':' + String(p.productId), p]));
  for (const [key, pair] of [...keys].sort(([a], [b]) => a.localeCompare(b))) {
    if (state.pairs.has(key)) continue;
    const row = await ReplenishmentLock.findOneAndUpdate(pair,
      { $inc: { version: 1 }, $setOnInsert: pair },
      { session, upsert: true, returnDocument: 'after' });
    state.pairs.set(key, row._id);
  }
}

export async function completeReplenishmentGuards(session, operationId) {
  const ids = [...(session.replenishmentGuards?.pairs.values() ?? [])];
  if (ids.length) await ReplenishmentLock.updateMany({ _id: { $in: ids } },
    { $set: { lastOperationId: operationId } }, { session });
}
