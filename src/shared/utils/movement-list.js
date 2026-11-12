import { z } from 'zod';
import { Warehouse } from '../../models/runtime.js';
import { dto, serialize } from './persistence.js';

export const movementListFields = {
  q: z.string().trim().min(1).max(80).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  sortBy: z.enum(['createdAt', 'documentNo', 'workflowStatus', 'warehouse', 'destinationWarehouse']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
};
export const validDateRange = value => !value.from || !value.to || new Date(value.from) <= new Date(value.to);
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function movementListPipeline(scope, query, warehouseFields, warehouseCollection) {
  const filters = {};
  if(query.searchFilter)Object.assign(filters,query.searchFilter);
  else if (query.q) filters.documentNo = { $regex: escapeRegex(query.q), $options: 'i' };
  if (query.status) filters.workflowStatus = query.status;
  for (const field of warehouseFields) {
    const key = field.split('.').at(-1);
    if (query[key]) filters[field] = query[key];
  }
  // Aggregate does not cast ObjectId values; services supply cast warehouse filters.
  if (query.from || query.to) filters.createdAt = { ...(query.from && { $gte: new Date(query.from) }), ...(query.to && { $lte: new Date(query.to) }) };
  const sortField = query.sortBy === 'warehouse' ? warehouseFields[0] : query.sortBy === 'destinationWarehouse' ? warehouseFields.at(-1) : null;
  const lookups = sortField ? [
    { $lookup: { from: warehouseCollection, localField: sortField, foreignField: '_id', as: '_sortWarehouse' } },
    { $set: { _warehouseName: { $ifNull: [{ $arrayElemAt: ['$_sortWarehouse.name', 0] }, ''] } } },
  ] : [];
  const direction = query.sortOrder === 'asc' ? 1 : -1;
  return [{ $match: scope }, { $facet: {
    summary: [{ $group: { _id: '$workflowStatus', count: { $sum: 1 } } }],
    warehouses: [{ $project: { ids: warehouseFields.map(field => '$' + field) } }, { $unwind: '$ids' },
      { $group: { _id: '$ids' } }, { $lookup: { from: warehouseCollection, localField: '_id', foreignField: '_id', as: 'warehouse' } },
      { $unwind: '$warehouse' }, { $replaceRoot: { newRoot: '$warehouse' } }, { $project: { _id: 1, name: 1, code: 1 } }, { $sort: { name: 1, _id: 1 } }],
    items: [{ $match: filters }, ...lookups, { $sort: { [sortField ? '_warehouseName' : query.sortBy || 'createdAt']: direction, _id: -1 } },
      { $skip: ((query.page || 1) - 1) * (query.limit || 20) }, { $limit: Number(query.limit || 20) }, { $project: { _sortWarehouse: 0, _warehouseName: 0 } }],
    total: [{ $match: filters }, { $count: 'value' }],
  } }];
}

export async function movementList(Model, scope, query, warehouseFields, completedStatus) {
  const [data] = await Model.aggregate(movementListPipeline(scope, query, warehouseFields, Warehouse.collection.name));
  const states = data.summary;
  const total = states.reduce((sum, state) => sum + state.count, 0);
  const count = status => states.find(state => state._id === status)?.count || 0;
  const completed = count(completedStatus), cancelled = count('CANCELLED') + count('REJECTED');
  return { items: data.items.map(dto), total: data.total[0]?.value || 0,
    page: Number(query.page || 1), limit: Number(query.limit || 20),
    summary: { total, incomplete: total - completed - cancelled, completed, cancelled },
    warehouses: data.warehouses.map(row => ({ id: String(row._id), code: row.code, name: row.name })),
    capturedAt: serialize(new Date()),
  };
}
