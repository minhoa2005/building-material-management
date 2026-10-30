import { z } from 'zod';
import { exact } from '../../models/model-utils.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId').transform((s) => s.toLowerCase());
const quantity = z.string().regex(/^\d{1,14}(\.\d{1,6})?$/, 'Use a decimal string with at most 6 decimal places')
  .refine((s) => exact(s).gt(0), 'Quantity must be positive')
  .transform((s) => exact(s).toFixed());

export const createBody = z.object({
  idempotencyKey: z.string().trim().min(1).max(64).regex(/^[\w.-]+$/),
  warehouseId: objectId,
  reason: z.string().trim().min(1).max(2000),
  lines: z.array(z.object({
    sourceBalanceId: objectId,
    sourceBalanceVersion: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    toLocationId: objectId,
    conversionId: objectId,
    enteredQty: quantity,
  }).strict()).min(1).max(100),
}).strict().superRefine((body, ctx) => {
  const seen = new Set();
  body.lines.forEach((line, index) => {
    const key = `${line.sourceBalanceId}:${line.toLocationId}`;
    if (seen.has(key)) ctx.addIssue({ code: 'custom', path: ['lines', index], message: 'Merge duplicate source/destination lines' });
    seen.add(key);
  });
});

export const createSchema = z.object({ body: createBody });
export const detailSchema = z.object({ params: z.object({ id: objectId }).strict() });
export const listSchema = z.object({ query: z.object({
  warehouseId: objectId.optional(), status: z.enum(['OPEN', 'PARTIAL', 'CONFIRMED', 'CANCELLED']).optional(),
  q: z.string().trim().min(1).max(80).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict() });
export const optionsSchema = z.object({ query: z.object({ warehouseId: objectId.optional() }).strict() });
export const editSchema = z.object({ params: z.object({ id: objectId }).strict(),
  body: z.object({ idempotencyKey: createBody.shape.idempotencyKey,
    reason: createBody.shape.reason, lines: createBody.shape.lines,
    expectedVersion: z.number().int().min(1) }).strict().superRefine((body, ctx) => {
      const seen = new Set();
      body.lines.forEach((line, index) => {
        const key = `${line.sourceBalanceId}:${line.toLocationId}`;
        if (seen.has(key)) ctx.addIssue({ code: 'custom', path: ['lines', index], message: 'Merge duplicate source/destination lines' });
        seen.add(key);
      });
    }) });
export const cancelSchema = z.object({ params: z.object({ id: objectId }).strict(), body: z.object({
  expectedVersion: z.number().int().min(1),
  idempotencyKey: z.string().trim().min(1).max(64).regex(/^[\w.-]+$/),
  reason: z.string().trim().min(1).max(2000),
}).strict() });
export const confirmSchema = z.object({ params: z.object({ id: objectId }).strict(), body: z.object({
  expectedVersion: z.number().int().min(1),
  idempotencyKey: z.string().trim().min(1).max(64).regex(/^[\w.-]+$/),
  lines: z.array(z.object({ lineId: objectId, actualQtyBase: quantity }).strict()).min(1).max(100),
}).strict().superRefine((body, ctx) => {
  const ids = new Set();
  body.lines.forEach((line, index) => {
    if (ids.has(line.lineId)) ctx.addIssue({ code: 'custom', path: ['lines', index], message: 'Duplicate line' });
    ids.add(line.lineId);
  });
}) });
