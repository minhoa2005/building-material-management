import { z } from 'zod';
import { decimalStringSchema, normalizeCode, objectIdString as oid } from '../../shared/utils/domain.js';

const empty = z.object({}).strict();
const text = max => z.string().trim().min(1).max(max);
const decimal = decimalStringSchema({ positive: true, scale: 3 });
const fields = {
  name: text(200), manufacturerCode: text(100), categoryId: oid, material: text(160).nullable().optional(),
  surface: text(100).nullable().optional(), origin: text(100).nullable().optional(), description: text(2000).nullable().optional(),
  baseUnit: text(60), wholeBaseUnits: z.boolean().default(true),
  lengthMm: decimal, widthMm: decimal, heightMm: decimal, color: text(160),
};
const timestamp = z.string().datetime({ offset: true });
const params = z.object({ id: oid }).strict();
const schema = (body = empty, query = empty, routeParams = params) => z.object({ body, query, params: routeParams });
const pager = (fallback, max = Number.MAX_SAFE_INTEGER) => z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().min(1).max(max)).default(fallback);
export const listProductsSchema = schema(empty, z.object({ page: pager(1), limit: pager(10, 100), search: z.string().trim().max(100).optional(), categoryId: oid.optional(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  sortBy: z.enum(['createdAt', 'sku', 'name']).default('createdAt'), sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).strict().refine(q => Number.isSafeInteger((q.page - 1) * q.limit)), empty);
export const productIdSchema = schema();
export const productOptionsSchema = schema(empty, empty, empty);
export const createProductSchema = schema(z.object({ sku: text(60).transform(normalizeCode), ...fields }).strict(), empty, empty);
export const updateProductSchema = schema(z.object({ expectedUpdatedAt: timestamp, ...fields }).strict());
export const changeProductStatusSchema = schema(z.object({ expectedUpdatedAt: timestamp, isActive: z.boolean(), reason: text(2000) }).strict());
export const listPoliciesSchema = schema();
export const configurePolicySchema = schema(z.object({ expectedUpdatedAt: timestamp,
  minimumQty: decimalStringSchema(), targetQty: decimalStringSchema() }).strict(), empty, z.object({ id: oid, warehouseId: oid }).strict());
