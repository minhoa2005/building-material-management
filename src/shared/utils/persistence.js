import mongoose from 'mongoose';
import { notFoundError, validationError, versionConflict } from './ApiError.js';
import { observePlanning } from './replenishment-observability.js';

export const transactionOptions = { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } };
export async function transaction(work) {
  for (let attempt = 0; ; attempt++) {
    const session = await mongoose.startSession();
    let runs = 0;
    try { return await session.withTransaction(() => {
      if (runs++) observePlanning('transaction_retry', { reason: 'snapshot_conflict' });
      session.replenishmentGuards = undefined;
      return work(session);
    }, transactionOptions); }
    catch (error) {
      if (attempt < 3 && error.code === 11000 && error.message?.includes('warehouseId_1_productId_1')) {
        observePlanning('transaction_retry', { reason: 'first_guard_creation', attempt: attempt + 1 });
        continue;
      }
      throw error;
    } finally { await session.endSession(); }
  }
}

export function serialize(value) {
  if (value == null) return value;
  if (value instanceof Date) return value.toISOString();
  if (value._bsontype === 'ObjectId' || value._bsontype === 'Decimal128') return value.toString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') {
    const plain = value.toObject ? value.toObject() : value;
    return Object.fromEntries(Object.entries(plain).map(([key, child]) => [key, serialize(child)]));
  }
  return value;
}

export const dto = row => ({ ...serialize(row), id: String(row._id) });
export async function page(Model, filter, query, select) {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
  const [rows, total] = await Promise.all([
    Model.find(filter).select(select).sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);
  return { items: rows.map(dto), total, page, limit };
}

// These catalogues deliberately have no synthetic version field.
export async function updateCatalogue(Model, id, expectedUpdatedAt, changes, session) {
  const timestamp = new Date(expectedUpdatedAt);
  if (!expectedUpdatedAt || !Number.isFinite(timestamp.getTime())) throw validationError('Thiếu thời điểm cập nhật đã đọc');
  const current = await Model.findById(id).session(session);
  if (!current) throw notFoundError();
  if (current.updatedAt?.getTime() !== timestamp.getTime()) throw versionConflict('Dữ liệu đã thay đổi, hãy tải lại');
  current.set(changes);
  await current.validate();
  // Always advance the token, including two writes within one millisecond.
  const nextTime = new Date(Math.max(Date.now(), timestamp.getTime() + 1));
  const next = await Model.findOneAndUpdate({ _id: id, updatedAt: timestamp },
    { $set: { ...changes, updatedAt: nextTime } }, { session, timestamps: false, returnDocument: 'after', runValidators: true });
  if (!next) throw versionConflict('Dữ liệu đã thay đổi, hãy tải lại');
  return next;
}
