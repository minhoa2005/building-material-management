import { z } from 'zod';
import { calendarDateString, decimalStringSchema, normalizeCode, objectIdString as oid } from '../../shared/utils/domain.js';
import { exact } from '../../models/model-utils.js';

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
const conversionDate = z.union([timestamp, calendarDateString]);
const conversionFactor = decimalStringSchema({ positive: true, scale: 12, precision: 24 });
const params = z.object({ id: oid }).strict();
const schema = (body = empty, query = empty, routeParams = params) => z.object({ body, query, params: routeParams });
const pager = (fallback, max = Number.MAX_SAFE_INTEGER) => z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().min(1).max(max)).default(fallback);
const productImageUrlSchema = z.string().trim().min(1).max(2048).refine(value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}, { message: 'Ảnh sản phẩm phải là URL HTTPS hợp lệ' });
const productImageUrlsSchema = z.array(productImageUrlSchema).max(5).refine(
  urls => new Set(urls).size === urls.length,
  { message: 'URL ảnh sản phẩm không được trùng lặp' },
).optional();

const conversionItemSchema = z.object({
  uomId: oid,
  basePerUnit: conversionFactor,
  validFrom: conversionDate.optional(),
  verificationReference: text(500).optional(),
}).strict();

const stockThresholdItemSchema = z.object({
  warehouseId: oid,
  minimumQty: decimalStringSchema({ allowZero: true }),
  targetQty: decimalStringSchema({ allowZero: true }).optional(),
}).strict().refine(
  item => item.targetQty == null || exact(item.targetQty).gte(exact(item.minimumQty)),
  { message: 'Định mức tồn tối đa (targetQty) phải lớn hơn hoặc bằng định mức tồn tối thiểu (minimumQty)' }
);

export const listProductsSchema = schema(empty, z.object({ page: pager(1), limit: pager(10, 100), search: z.string().trim().max(100).optional(), categoryId: oid.optional(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  sortBy: z.enum(['createdAt', 'sku', 'name']).default('createdAt'), sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).strict().refine(q => Number.isSafeInteger((q.page - 1) * q.limit)), empty);
export const productIdSchema = schema();
export const productOptionsSchema = schema(empty, empty, empty);
export const createProductSchema = schema(
  z.object({
    sku: text(60).transform(normalizeCode),
    conversions: z.array(conversionItemSchema).optional().default([]),
    stockThresholds: z.array(stockThresholdItemSchema).optional().default([]),
    imageUrls: productImageUrlsSchema,
    ...fields,
  })
    .strict()
    .refine(
      b => {
        const uomIds = b.conversions.map(c => c.uomId);
        return new Set(uomIds).size === uomIds.length;
      },
      { message: 'Đơn vị quy đổi không được trùng lặp', path: ['conversions'] },
    )
    .refine(
      b => {
        const whIds = b.stockThresholds.map(t => t.warehouseId);
        return new Set(whIds).size === whIds.length;
      },
      { message: 'Kho cấu hình định mức tồn không được trùng lặp', path: ['stockThresholds'] },
    ),
  empty,
  empty,
);
export const updateProductSchema = schema(z.object({ expectedUpdatedAt: timestamp, imageUrls: productImageUrlsSchema, ...fields }).strict());
export const changeProductStatusSchema = schema(z.object({ expectedUpdatedAt: timestamp, isActive: z.boolean(), reason: text(2000) }).strict());
export const listPoliciesSchema = schema();
export const configurePolicySchema = schema(
  z.object({
    expectedUpdatedAt: timestamp.optional(),
    expectedVersion: z.number().int().optional(),
    minimumQty: decimalStringSchema().optional(),
    targetQty: decimalStringSchema().optional(),
    minimumQtyBase: decimalStringSchema().optional(),
    targetQtyBase: decimalStringSchema().optional(),
  }).strip().refine(b => b.minimumQty != null || b.minimumQtyBase != null, {
    message: 'Cần nhập số lượng tồn tối thiểu',
  }),
  empty,
  z.object({ id: oid, warehouseId: oid }).strict(),
);
export const listConversionsSchema = schema(
  empty,
  z.object({
    page: pager(1).optional(),
    limit: pager(50, 100).optional(),
    uomId: oid.optional(),
    productBatchId: z.union([oid, z.literal('null')]).optional(),
  }).strip(),
);
export const createConversionSchema = schema(
  z.object({
    productId: oid.optional(),
    expectedProductVersion: z.number().int().optional(),
    expectedUpdatedAt: z.string().optional(),
    uomId: oid,
    productBatchId: oid.nullable().optional(),
    basePerUnit: conversionFactor,
    validFrom: conversionDate,
    verificationReference: text(500),
  }).strip(),
);
