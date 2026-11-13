import { documentIdentifier } from '../../shared/utils/document-id.validation.js';
import { movementListFields, validDateRange } from '../../shared/utils/movement-list.js';
import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i).transform((value) => value.toLowerCase());
const listFields = {
  sourceWarehouseId: objectId.optional(),
  destinationWarehouseId: objectId.optional(),
  status: z.string().trim().max(180).regex(/^[A-Z_]+(?:,[A-Z_]+)*$/).transform(value => value.split(',')).optional(),
  ...movementListFields,
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};
export const listQuery = z.object(listFields).strict().refine(validDateRange, { message: 'from must be before to' });
export const dispatchListQuery = z.object({ ...listFields, receivable: z.enum(['true', 'false']).optional() })
  .strict().refine(validDateRange, { message: 'from must be before to' });
export const detailParams = z.object({ id: documentIdentifier }).strict();
export const optionsQuery = z.object({ warehouseId: objectId.optional() }).strict();
