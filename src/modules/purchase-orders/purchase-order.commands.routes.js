import { Router } from 'express';
import { z } from 'zod';
import { decimalStringSchema } from '../../shared/utils/domain.js';
import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { objectIdString as oid } from '../../shared/utils/domain.js';
import { schema, handle, key, ver, qty, reason, evidenceIds, commandBody } from '../po-receiving/po-receiving.routes.js';
import * as c from './purchase-order.commands.js';

const evaluations = z.array(z.object({ lineId: oid, evaluationKey: z.string().min(1).max(200) }).strict()).max(100).optional();
const form = { evaluations, warehouseId: oid, supplierId: oid, currency: z.string().regex(/^[A-Z]{3}$/), expectedOn: z.string().datetime({ offset: true }).optional(),
  lines: z.array(z.object({ id: oid.optional(), rrLineId: oid, approvalId: oid, enteredQty: qty, unitPurchasePrice: decimalStringSchema() }).strict()).min(1).max(100) };
const action = fields => z.object({ ...commandBody, evaluations, ...fields }).strict();
const closeLines = z.array(z.object({ poLineId: oid, qtyBase: qty }).strict()).min(1).max(100);
const router = Router(); router.use(authenticate);
router.post('/', validate(schema(z.object({ ...form, creationKey: key }).strict(),z.object({}).strict())), handle((u,v) => c.createPurchaseOrder(u,v.body)));
router.put('/:id', validate(schema(action(form))), handle((u,v) => c.updatePurchaseOrder(u,v.params.id,v.body)));
router.post('/:id/confirm', validate(schema(action({}))), handle((u,v) => c.confirmPurchaseOrder(u,v.params.id,v.body)));
router.post('/:id/expected-on', validate(schema(action({ expectedOn: z.string().datetime({ offset: true }), reason }))), handle((u,v) => c.rescheduleExpectedOn(u,v.params.id,v.body)));
router.post('/:id/close-requests', validate(schema(action({ reason, evidenceIds, lines: closeLines }))), handle((u,v) => c.requestClose(u,v.params.id,v.body)));
router.post('/:id/close-approvals', validate(schema(action({ reason, evidenceIds, requestId: oid }))), handle((u,v) => c.approveClose(u,v.params.id,v.body)));
router.post('/:id/close-executions', validate(schema(action({ reason, approvalId: oid }))), handle((u,v) => c.executeClose(u,v.params.id,v.body)));
export default router;

