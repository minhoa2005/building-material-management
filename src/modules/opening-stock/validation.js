import { z } from 'zod';
import { documentIdentifier } from '../../shared/utils/document-id.validation.js';
import { objectIdString, decimalStringSchema } from '../../shared/utils/domain.js';
import { empty } from '../../shared/utils/command-validation.js';

const text = max => z.string().trim().min(1, 'Bắt buộc nhập').max(max);
const optional = max => z.string().trim().max(max).optional().transform(value => value || undefined);
const quantity = decimalStringSchema({ positive: true, scale: 6 });
// Allow small client clock skew when checking that the cut-off is not in the future.
export const CLOCK_SKEW_MS = 2 * 60 * 1000;

// One opening row references catalogue codes only (plan 27/11/2026). The service parses each row itself.
export const openingRow = z.object({
  rowNo: z.union([z.number().int().min(0).max(1_000_000), z.string().trim().max(20)]).optional(),
  sku: text(60), manufacturerCode: optional(100), color: optional(160),
  manufacturerLot: optional(100), locationCode: text(60), warehouseCode: optional(60),
  enteredQty: quantity, enteredUnit: text(60),
}).strict();
export const previewBody = z.object({
  warehouseId: objectIdString,
  openingAt: z.iso.datetime({ offset: true }).refine(value => new Date(value).getTime() <= Date.now() + CLOCK_SKEW_MS, 'Mốc tồn đầu không được ở tương lai.'),
  rows: z.array(z.record(z.string(), z.unknown())).min(1, 'Nhập ít nhất một dòng hàng.').max(1000),
}).strict();
export const createBody = previewBody.safeExtend({
  sourceDescription: text(2000), openingImportSource: z.enum(['FILE', 'MANUAL']), idempotencyKey: text(64),
});
export const actionBody = z.object({ idempotencyKey: text(64), expectedVersion: z.number().int().min(1), reason: text(2000) }).strict();
export const closeBody = z.object({ reason: text(2000) }).strict();
export const getOpeningStockSchema = z.object({
  params: z.object({ id: documentIdentifier }).strict(),
  query: empty,
  body: empty,
});
export const openingIdParamsSchema = z.object({
  params: z.object({ id: documentIdentifier }).strict(),
  query: empty,
});
export const warehouseParamsSchema = z.object({
  params: z.object({ warehouseId: objectIdString }).strict(),
  query: empty,
  body: closeBody,
});
