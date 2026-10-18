import { Router } from 'express';
import healthRouter from './modules/health/health.routes.js';
import authRouter from './modules/auth/auth.routes.js';
import uploadRouter from './modules/upload/upload.routes.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/upload', uploadRouter);

export default router;
