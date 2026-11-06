import { ProductBatch, InventoryBalance, models } from '../../models/runtime.js';

export async function lockLotIdentity(batchId, session) {
  const batch = await ProductBatch.findById(batchId).session(session);
  if (!batch) throw new Error('Batch no longer exists');
  const updatedAt = new Date(Math.max(Date.now(), (batch.updatedAt?.getTime() ?? 0) + 1));
  const result = await ProductBatch.updateOne({ _id: batchId, updatedAt: batch.updatedAt },
    { $set: { updatedAt } }, { session, timestamps: false });
  if (result.matchedCount !== 1) throw new Error('Batch changed concurrently');
}
export async function lotHasReferences(batchId, session) {
  if (await InventoryBalance.exists({ batchId }).session(session)) return true;
  for (const Model of models.values()) {
    if (Model.schema.path('items') && await Model.exists({ 'items.lotId': batchId }).session(session)) return true;
  }
  return false;
}

