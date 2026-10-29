import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i).transform((value) => value.toLowerCase());
export const listQuery = z.object({
  sourceWarehouseId: objectId.optional(),
  destinationWarehouseId: objectId.optional(),
  status: z.string().trim().min(1).max(30).regex(/^[A-Z_]+$/).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict().refine((value) => !value.from || !value.to || new Date(value.from) <= new Date(value.to), { message: 'from must be before to' });
export const detailParams = z.object({ id: objectId }).strict();
