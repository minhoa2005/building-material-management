import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { objectIdString as oid } from '../../shared/utils/domain.js';
import { schema, handle, key, ver, qty, reason, evidenceIds, commandBody } from '../po-receiving/po-receiving.routes.js';
import * as c from './purchase-order.commands.js';

const form = { warehouseId: oid, supplierId: oid, expectedOn: z.string().datetime({ offset: true }).optional(),
  lines: z.array(z.object({ id: oid.optional(), rrLineId: oid, approvalId: oid, enteredQty: qty }).strict()).min(1).max(100) };
const action = fields => z.object({ ...commandBody, ...fields }).strict();
const closeLines = z.array(z.object({ poLineId: oid, qtyBase: qty }).strict()).min(1).max(100);
const router = Router(); router.use(authenticate);
router.post('/', validate(schema(z.object({ ...form, creationKey: key }).strict(),z.object({}).strict())), handle((u,v) => c.createPurchaseOrder(u,v.body)));
router.put('/:id', validate(schema(action(form))), handle((u,v) => c.updatePurchaseOrder(u,v.params.id,v.body)));
router.post('/:id/confirm', validate(schema(action({}))), handle((u,v) => c.confirmPurchaseOrder(u,v.params.id,v.body)));
router.post('/:id/amendments', validate(schema(action({ reason, evidenceIds, expectedOn: form.expectedOn,
  lines: z.array(z.object({ poLineId: oid, rrLineId: oid, approvalId: oid, enteredQty: qty }).strict()).max(100) }))), handle((u,v) => c.amendPurchaseOrder(u,v.params.id,v.body)));
router.post('/:id/supplier-confirmations', validate(schema(action({ reason, evidenceIds,
  lines: z.array(z.object({ poLineId: oid, qtyBase: qty, expectedOn: z.string().datetime({ offset: true }) }).strict()).min(1).max(100) }))), handle((u,v) => c.supplierConfirmation(u,v.params.id,v.body)));
router.post('/:id/close-requests', validate(schema(action({ reason, evidenceIds, lines: closeLines }))), handle((u,v) => c.requestClose(u,v.params.id,v.body)));
router.post('/:id/close-approvals', validate(schema(action({ reason, evidenceIds, requestId: oid }))), handle((u,v) => c.approveClose(u,v.params.id,v.body)));
router.post('/:id/close-executions', validate(schema(action({ reason, approvalId: oid }))), handle((u,v) => c.executeClose(u,v.params.id,v.body)));
export default router;
