import { Router } from 'express';
import locationMovementRouter from './modules/location-movements/location-movement.routes.js';
import transferReadRouter from './modules/transfers/transfer-read.routes.js';
import transferWriteRouter from './modules/transfers/transfer-write.routes.js';
import { salesOrderRouter, outboundDeliveryRouter } from './modules/sales-orders/sales-read.routes.js';
import healthRouter from './modules/health/health.routes.js';
import authRouter from './modules/auth/auth.routes.js';
import uploadRouter from './modules/upload/upload.routes.js';
import usersRouter from './modules/users/user.routes.js';
import rolesRouter from './modules/roles/role.routes.js';
import replenishmentsRouter from './modules/replenishments/replenishment.routes.js';

const router = Router();
router.use('/location-movements', locationMovementRouter);
router.use('/warehouse-transfers', transferWriteRouter, transferReadRouter);
router.use('/sales-orders', salesOrderRouter);
router.use('/outbound-deliveries', outboundDeliveryRouter);

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/upload', uploadRouter);
router.use('/users', usersRouter);
router.use('/roles', rolesRouter);
router.use('/replenishments', replenishmentsRouter);

export default router;
