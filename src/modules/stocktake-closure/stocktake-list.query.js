import { z } from 'zod';
import { escapeRegex, validDateRange } from '../../shared/utils/movement-list.js';
import { isOwner, requireWarehouseAccess } from '../../shared/utils/access.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i).transform(value => value.toLowerCase());

// Strict on purpose: unknown keys are rejected instead of silently ignored.
export const stocktakeListQuery = z.object({
  q: z.string().trim().min(1).max(80).optional(),
  warehouseId: objectId.optional(),
  locationId: objectId.optional(),
  status: z.string().regex(/^[A-Z_]{1,30}$/).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict().refine(validDateRange, { message: 'from must be before to' });

/**
 * Builds the Mongo filter for the stocktake list inside the actor's warehouse scope.
 * `from`/`to` bound `header.cutoffAt`, so sessions that were never activated are excluded
 * whenever a cutoff window is requested.
 */
export function buildStocktakeListFilter(user, query) {
  const filter = isOwner(user) ? {} : { 'header.warehouseId': { $in: user.warehouseIds || [] } };
  if (query.warehouseId) {
    requireWarehouseAccess(user, query.warehouseId);
    filter['header.warehouseId'] = query.warehouseId;
  }
  if (query.status) filter.workflowStatus = query.status;
  if (query.locationId) filter['header.scopeLocationIds'] = query.locationId;
  if (query.q) filter.documentNo = { $regex: escapeRegex(query.q), $options: 'i' };
  if (query.from || query.to) {
    filter['header.cutoffAt'] = { ...(query.from && { $gte: new Date(query.from) }), ...(query.to && { $lte: new Date(query.to) }) };
  }
  return filter;
}
