import { z } from 'zod';
import { calendarDateString, decimalStringSchema, objectIdString as oid } from '../../shared/utils/domain.js';
const empty = z.object({}).strict();
const params = z.object({ id: oid }).strict();
const pager = (fallback, max = Number.MAX_SAFE_INTEGER) => z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().min(1).max(max)).default(fallback);
const paging = { page: pager(1), limit: pager(10, 100) };
const dimension = decimalStringSchema({ positive: true, scale: 3 });
const fields = { manufacturerLot: z.string().trim().min(1).max(100), identificationStatus: z.enum(['VERIFIED','UNKNOWN']),
  manufacturedOn: calendarDateString.nullable().optional(), piecesPerCarton: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  cartonLengthMm: dimension, cartonWidthMm: dimension, cartonHeightMm: dimension };
const request = (body, query = empty, routeParams = params) => z.object({ body, query, params: routeParams });
export const listLotsSchema = request(empty, z.object({ ...paging, productId: oid.optional(), manufacturerLot: z.string().max(100).optional(),
  identificationStatus: fields.identificationStatus.optional(), warehouseId: oid.optional() }).strict().refine(q => Number.isSafeInteger((q.page - 1) * q.limit)), empty);
export const lotIdSchema = request(empty);
export const createLotSchema = request(z.object({ productId: oid, ...fields }).strict(), empty, empty);
export const updateLotSchema = request(z.object(fields).partial().extend({ expectedUpdatedAt: z.string().datetime({ offset: true }) }).strict());
export const lotMovementsSchema = request(empty, z.object(paging).strict().refine(q => Number.isSafeInteger((q.page - 1) * q.limit)));


