import { documentIdentifier } from '../../shared/utils/document-id.validation.js';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import { validationError } from '../../shared/utils/ApiError.js';
import { objectId, outboundQuery } from '../sales-orders/sales.validation.js';
import { operation } from '../sales-orders/sales-execution.validation.js';
import * as service from './stocktake-closure.service.js';
import { decimalStringSchema } from '../../shared/utils/domain.js';
const qty = decimalStringSchema({ positive: true });
const portion = z.object({ packagingState: z.enum(['SEALED', 'OPEN', 'LOOSE']), sealedPackCount: z.number().int().nonnegative().optional(), quantityBase: qty, measuredVolumeMm3: qty.optional(), extraOccupiedVolumeMm3: decimalStringSchema().optional(), packagingSnapshot: z.object({ packageUnit: z.string().min(1).max(60), baseUnitsPerPackage: qty, outerLengthMm: decimalStringSchema({ positive: true, scale: 3 }), outerWidthMm: decimalStringSchema({ positive: true, scale: 3 }), outerHeightMm: decimalStringSchema({ positive: true, scale: 3 }) }).strict().optional() }).strict();
const packagingSchema = z.array(z.object({ lineId: objectId, portions: z.array(portion).min(1).max(100) }).strict()).max(200);
export const closureBody = operation.extend({ planId: documentIdentifier.optional(), expectedPlanVersion: z.number().int().positive().optional(), reason: z.string().trim().min(1).max(2000), selectedCounts: z.array(z.object({ snapshotId: objectId, countId: objectId }).strict()).max(5000).optional(), packaging: packagingSchema.optional() }).strict().refine(v => v.planId ? !!v.expectedPlanVersion : !!v.selectedCounts, 'Chọn phương án/phiên bản hoặc kết quả đếm không lệch');
function parse(schema, value) { const r = schema.safeParse(value); if (!r.success)
    throw validationError('Dữ liệu kiểm kê không hợp lệ'); return r.data; }
const router = Router();
router.use(authenticate);
router.get('/', catchAsync(async (req, res) => formatApiResponse(res, { data: await service.listStocktakes(req.user, parse(outboundQuery, req.query)) })));
router.get('/:id', catchAsync(async (req, res) => formatApiResponse(res, { data: await service.getStocktake(req.user, parse(objectId, req.params.id)) })));
router.post('/:id/close', catchAsync(async (req, res) => formatApiResponse(res, { data: await service.closeStocktake(req.user, parse(objectId, req.params.id), parse(closureBody, req.body)) })));
export default router;
