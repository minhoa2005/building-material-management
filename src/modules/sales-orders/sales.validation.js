import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i).transform((value) => value.toLowerCase());
export const detailParams = z.object({ id: objectId }).strict();
export const evidenceParams = z.object({ id: objectId, evidenceId: objectId }).strict();
const label = (max) => z.string().trim().min(1).max(max);
export const createOrderBody = z.object({
  idempotencyKey: label(70), customerId: objectId, neededOn: z.iso.datetime({ offset: true }), deliveryAddress: label(500),
  evidenceReceipt: label(4000),
  source: z.object({ sourceSystem: z.enum(['MISA', 'PAPER']), referenceNo: label(100),
    referenceDate: z.iso.datetime({ offset: true }).optional(), sourceVersion: label(100).optional() }).strict(),
  lines: z.array(z.object({ sourceLineKey: label(100), productId: objectId, conversionId: objectId,
    quantity: z.string().regex(/^(?:0|[1-9]\d{0,13})(?:\.\d{1,6})?$/).refine((v) => /[1-9]/.test(v)),
    requiredTone: label(60).optional(), requiredCalibre: label(60).optional() }).strict()).min(1).max(200),
}).strict().refine((v) => new Set(v.lines.map((line) => line.sourceLineKey)).size === v.lines.length, { message: 'Duplicate source lines' });
export const outboundQuery = z.object({
  q: label(100).optional(),
  warehouseId: objectId.optional(), salesOrderId: objectId.optional(), issueRequestId: objectId.optional(),
  status: z.string().regex(/^[A-Z_]{1,30}$/).optional(),
  from: z.iso.datetime({ offset: true }).optional(), to: z.iso.datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict().refine((q) => !q.from || !q.to || new Date(q.from) <= new Date(q.to), { message: 'Invalid date range' });
