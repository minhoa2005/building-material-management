import { documentIdentifier } from '../../shared/utils/document-id.validation.js';
import { z } from 'zod';
import { exact } from '../../models/model-utils.js';
const oid = z.string().regex(/^[a-f\d]{24}$/i).transform((v) => v.toLowerCase());
const qty = z.string().regex(/^\d{1,14}(\.\d{1,6})?$/).refine((v) => exact(v).gt(0)).transform((v) => exact(v).toFixed());
const key = z.string().trim().min(1).max(48).regex(/^[\w.-]+$/);
const version = z.number().int().min(1);
const reason = z.string().trim().min(1).max(2000);
const unique = (field) => (rows) => new Set(rows.map((r) => r[field])).size === rows.length;
export const createRequestBody = z.object({ idempotencyKey: key, sourceWarehouseId: oid, destinationWarehouseId: oid,
  reason, neededOn: z.iso.datetime({ offset: true }).optional(),
  lines: z.array(z.object({ productId: oid, enteredUnit: z.string().trim().min(1).max(60), lotId: oid.optional(), enteredQty: qty }).strict()).min(1).max(100).refine(unique('productId')),
}).strict().refine((v) => v.sourceWarehouseId !== v.destinationWarehouseId);
export const reviewBody = z.object({ idempotencyKey: key, expectedVersion: version, decision: z.enum(['APPROVE', 'REJECT', 'REVISE']), reason }).strict();
export const dispatchBody = z.object({ idempotencyKey: key, expectedVersion: version,
  lines: z.array(z.object({ requestLineId: oid, sourceBalanceId: oid, stagingLocationId: oid, qtyBase: qty }).strict()).min(1).max(100),
}).strict();
export const requirementBody = z.object({ idempotencyKey: key, expectedVersion: version,
  // A receipt containing only damaged goods has no putaway destinations, but it
  // still needs a completed ITR/TO pair so the request can close.
  destinations: z.array(z.object({ receiptLineId: oid, locationId: oid }).strict()).max(100).refine(unique('receiptLineId')).optional(),
}).strict();
export const commandBody = z.object({ idempotencyKey: key, expectedVersion: version, recipientName:z.string().trim().min(1).max(160).optional(), vehiclePlate:z.string().trim().min(1).max(20).optional() }).strict();
export const receiptBody = z.object({ idempotencyKey: key, expectedVersion: version,
  lines: z.array(z.object({ dispatchLineId: oid, locationId: oid, qtyBase: qty,
    qualityCode: z.enum(['GOOD', 'DAMAGED']), damageReason: z.string().trim().min(1).max(1000).optional(),
  }).strict().refine((v) => v.qualityCode !== 'DAMAGED' || Boolean(v.damageReason))).min(1).max(100),
}).strict();
export const params = z.object({ id: documentIdentifier }).strict();

export const updateRequestBody = createRequestBody.safeExtend({ expectedVersion: version });

export const cancelDispatchBody=z.object({idempotencyKey:key,expectedVersion:version,reason}).strict();
export const partialCloseBody=z.object({idempotencyKey:key,expectedVersion:version,reason}).strict();
export const cancelRequestBody=z.object({idempotencyKey:key,expectedVersion:version,reason}).strict();
