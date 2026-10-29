import { Router } from 'express';
import locationMovementRouter from './modules/location-movements/location-movement.routes.js';
import healthRouter from './modules/health/health.routes.js';
import authRouter from './modules/auth/auth.routes.js';
import uploadRouter from './modules/upload/upload.routes.js';
import usersRouter from './modules/users/user.routes.js';
import rolesRouter from './modules/roles/role.routes.js';

const router = Router();
router.use('/location-movements', locationMovementRouter);

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/upload', uploadRouter);
router.use('/users', usersRouter);
router.use('/roles', rolesRouter);

export default router;
