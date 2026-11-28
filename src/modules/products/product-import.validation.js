import { z } from 'zod';
import { calendarDateString, decimalStringSchema, saigonDateOnly } from '../../shared/utils/domain.js';

// Cells arrive as strings from Excel or the editable preview; an empty cell means "not given".
const text = max => z.string().trim().min(1, 'Bắt buộc nhập').max(max);
const optional = max => z.string().trim().max(max).optional().transform(value => value || undefined);
const dimension = decimalStringSchema({ positive: true, scale: 3, label: 'Kích thước' });
const rowNo = z.number().int().min(1).optional();

export const productRow = z.object({
  rowNo, sku: text(60), name: text(200), manufacturerCode: text(100), color: text(160),
  categoryCode: text(60), baseUnit: text(60), lengthMm: dimension, widthMm: dimension, heightMm: dimension,
  material: optional(160), surface: optional(100), origin: optional(100), description: optional(2000),
}).strict();

export const lotRow = z.object({
  rowNo, sku: text(60), manufacturerCode: optional(100), color: optional(160),
  manufacturerLot: text(100), tone: text(20), calibre: text(20),
  piecesPerCarton: z.string().trim().regex(/^[1-9]\d{0,14}$/, 'Số viên/thùng phải là số nguyên ≥ 1'),
  cartonLengthMm: dimension, cartonWidthMm: dimension, cartonHeightMm: dimension,
  manufacturedOn: z.string().trim().optional().transform(value => value || undefined)
    .pipe(calendarDateString.refine(value => value <= saigonDateOnly(), 'Ngày sản xuất không được sau hôm nay').optional()),
  notes: optional(500),
}).strict();

// Rows are only shape-checked here; the service parses each one to report errors per column.
const rows = z.array(z.record(z.string(), z.unknown())).max(1000);
export const importBody = z.object({ products: rows.default([]), lots: rows.default([]) }).strict()
  .refine(value => value.products.length > 0 || value.lots.length > 0, 'Cần ít nhất một dòng sản phẩm hoặc lô');

export const importCatalogueSchema = z.object({ body: importBody, query: z.object({}).strict(), params: z.object({}).strict() });
