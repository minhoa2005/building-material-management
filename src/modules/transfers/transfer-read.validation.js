import { documentIdentifier } from '../../shared/utils/document-id.validation.js';
import { movementListFields, validDateRange } from '../../shared/utils/movement-list.js';
import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i).transform((value) => value.toLowerCase());
export const listQuery = z.object({
  sourceWarehouseId: objectId.optional(),
  destinationWarehouseId: objectId.optional(),
  status: z.string().trim().min(1).max(30).regex(/^[A-Z_]+$/).optional(),
  ...movementListFields,
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict().refine(validDateRange, { message: 'from must be before to' });
export const detailParams = z.object({ id: documentIdentifier }).strict();
export const optionsQuery = z.object({ warehouseId: objectId.optional() }).strict();
