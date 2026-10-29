import { Router } from 'express';
import locationMovementRouter from './modules/location-movements/location-movement.routes.js';
import transferReadRouter from './modules/transfers/transfer-read.routes.js';
import { salesOrderRouter, outboundDeliveryRouter } from './modules/sales-orders/sales-read.routes.js';
import healthRouter from './modules/health/health.routes.js';
import authRouter from './modules/auth/auth.routes.js';
import uploadRouter from './modules/upload/upload.routes.js';
import usersRouter from './modules/users/user.routes.js';
import rolesRouter from './modules/roles/role.routes.js';
import defectsRouter from './modules/defects/defect.routes.js';
import customerReturnsRouter from './modules/customer-returns/customer-return.routes.js';
import returnWorkflowsRouter from './modules/return-workflows/workflow.routes.js';

const router = Router();
router.use('/location-movements', locationMovementRouter);
router.use('/warehouse-transfers', transferReadRouter);
router.use('/sales-orders', salesOrderRouter);
router.use('/outbound-deliveries', outboundDeliveryRouter);

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/upload', uploadRouter);
router.use('/users', usersRouter);
router.use('/roles', rolesRouter);
router.use('/defects', defectsRouter);
router.use('/customer-returns', customerReturnsRouter);

router.use(returnWorkflowsRouter);
export default router;
