import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import { validationError } from '../../shared/utils/ApiError.js';
import { objectId } from '../sales-orders/sales.validation.js';
import { operationalReport, reportOptions } from './operational-reports.service.js';
const query = z.object({ group: z.enum(['inventory', 'purchases', 'receipts', 'issues', 'sales', 'transfers', 'defects', 'returns', 'supplierReturns', 'stocktakes', 'adjustments']).default('inventory'), warehouseId: objectId.optional(), from: z.iso.datetime({ offset: true }).optional(), to: z.iso.datetime({ offset: true }).optional() }).strict().refine(v => !v.from || !v.to || new Date(v.from) <= new Date(v.to));
const router = Router();
router.use(authenticate);
router.get('/options', catchAsync(async (req, res) => formatApiResponse(res, { data: await reportOptions(req.user) })));
router.get('/', catchAsync(async (req, res) => { const parsed = query.safeParse(req.query); if (!parsed.success)
    throw validationError('Bộ lọc báo cáo không hợp lệ'); formatApiResponse(res, { data: await operationalReport(req.user, parsed.data) }); }));
export default router;
