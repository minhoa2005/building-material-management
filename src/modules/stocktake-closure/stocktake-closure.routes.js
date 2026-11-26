import { documentIdentifier } from '../../shared/utils/document-id.validation.js';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import { ApiError, validationError } from '../../shared/utils/ApiError.js';
import { objectId } from '../sales-orders/sales.validation.js';
import { stocktakeListQuery } from './stocktake-list.query.js';
import { resolutionListQuery } from './stocktake-resolution.query.js';
import * as resolution from './stocktake-resolution.service.js';
import { getCountSheet } from './stocktake-count-sheet.service.js';
import { operation } from '../sales-orders/sales-execution.validation.js';
import * as service from './stocktake-closure.service.js';
import * as commands from './stocktake-commands.service.js';
import * as reconciliation from './stocktake-reconciliation.service.js';
import * as evidence from './stocktake-evidence.service.js';
import { decimalStringSchema } from '../../shared/utils/domain.js';
import { QUALITY_CODES } from '../../models/constants.js';
import { DISCREPANCY_REASONS } from '../../models/stocktake-resolution-details.schema.js';
const qty = decimalStringSchema({ positive: true });
const portion = z.object({ packagingState: z.enum(['SEALED', 'OPEN', 'LOOSE']), sealedPackCount: z.number().int().nonnegative().optional(), quantityBase: qty, measuredVolumeMm3: qty.optional(), extraOccupiedVolumeMm3: decimalStringSchema().optional(), packagingSnapshot: z.object({ packageUnit: z.string().min(1).max(60), baseUnitsPerPackage: qty, outerLengthMm: decimalStringSchema({ positive: true, scale: 3 }), outerWidthMm: decimalStringSchema({ positive: true, scale: 3 }), outerHeightMm: decimalStringSchema({ positive: true, scale: 3 }) }).strict().optional() }).strict();
const packagingSchema = z.array(z.object({ lineId: objectId, portions: z.array(portion).min(1).max(100) }).strict()).max(200);
// Approve/Clear Difference (22 Nov 2026). No closing reason. Since 23 Nov 2026 the counter chooses each line's
// reason (POST /:id/count-reason) and the Owner only approves, so the lines carry no reason here.
export const approveBody = operation.extend({
    all: z.boolean().optional(),
    lines: z.array(z.object({ snapshotId: objectId }).strict()).max(5000).optional(),
    packaging: packagingSchema.optional(),
}).strict().refine(v => v.all === true || !!v.lines?.length, 'Chọn ít nhất một dòng chênh lệch hoặc chọn tất cả');
// Counter's reason for a differing line (user decision 23 Nov 2026); "OTHER" needs the typed reason.
export const countReasonBody = operation.extend({ snapshotId: objectId, countId: objectId, reasonCode: z.enum(DISCREPANCY_REASONS), reasonNote: z.string().trim().min(1).max(500).optional() }).strict()
    .refine(v => v.reasonCode !== 'OTHER' || !!v.reasonNote, 'Lý do "Khác" cần ghi rõ lý do');
export const recountBody = operation.extend({ snapshotIds: z.array(objectId).min(1).max(5000), note: z.string().trim().min(1).max(1000).optional() }).strict();
function parse(schema, value) { const r = schema.safeParse(value); if (!r.success)
    throw validationError('Dữ liệu kiểm kê không hợp lệ'); return r.data; }
const oid = objectId;
const text = z.string().trim().min(1).max(2000);
const nonnegative = decimalStringSchema();
const scope = z.object({ locationIds: z.array(oid).min(1).max(5000), batchIds: z.array(oid).max(5000).optional(), productIds: z.array(oid).max(5000).optional() }).strict();
const createBody = z.object({ idempotencyKey: text.max(70), warehouseId: oid, reason: text, plannedAt: z.iso.datetime({ offset: true }).optional(), assignedCounterIds: z.array(oid).min(1), scope, note: z.string().max(2000).optional() }).strict();
const updateBody = operation.extend({ reason: text.optional(), plannedAt: z.iso.datetime({ offset: true }).optional(), assignedCounterIds: z.array(oid).min(1).optional(), scope: scope.optional(), note: z.string().max(2000).optional() }).strict();
const activateBody = operation.strict();
const entry = z.object({ enteredQty: nonnegative, enteredUnit: text.max(60), baseUnitsPerUnit: qty, quantityBase: nonnegative }).strict();
const discovered = z.object({ locationId: oid, batchId: oid, ownerType: z.enum(['STORE', 'SUPPLIER', 'CUSTOMER']), ownerId: oid.optional(), qualityStatus: z.enum(QUALITY_CODES) }).strict();
const correctionBody = operation.extend({ emptyCountId: oid, discovered, countedQtyBase: nonnegative, quantityEntries: z.array(entry).max(100).optional(), correctionReason: text, conditionNote: z.string().max(2000).optional(), evidenceIds: z.array(oid).min(1).max(50) }).strict();
const countBody = operation.extend({ targetType: z.enum(['STOCK', 'EMPTY_LOCATION']), snapshotId: oid.optional(), discovered: discovered.optional(), locationId: oid.optional(), countedQtyBase: nonnegative, quantityEntries: z.array(entry).max(100).optional(), previousCountId: oid.optional(), recountReason: text.optional(), conditionNote: z.string().max(2000).optional(), evidenceIds: z.array(oid).max(50).optional() }).strict()
    .refine(v => v.targetType === 'STOCK' ? !!v.snapshotId !== !!v.discovered && !v.locationId : !!v.locationId && !v.snapshotId && !v.discovered, 'Chọn mốc tồn, hàng phát hiện ngoài sổ hoặc vị trí trống');
const stocktakeLotsQuery = z.object({ manufacturerLot: z.string().trim().max(100).optional(), page: z.coerce.number().int().min(1).max(100000).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) }).strict();
const router = Router();
router.use(authenticate);
router.get('/options', catchAsync(async (req, res) => formatApiResponse(res, { data: await commands.stocktakeOptions(req.user) })));
router.post('/', catchAsync(async (req, res) => formatApiResponse(res, { data: await commands.createStocktake(req.user, parse(createBody, req.body)) })));
router.post('/:id/update', catchAsync(async (req, res) => formatApiResponse(res, { data: await commands.updateStocktake(req.user, parse(documentIdentifier, req.params.id), parse(updateBody, req.body)) })));
router.post('/:id/activate', catchAsync(async (req, res) => formatApiResponse(res, { data: await commands.activateStocktake(req.user, parse(documentIdentifier, req.params.id), parse(activateBody, req.body)) })));
router.post('/:id/counts', catchAsync(async (req, res) => formatApiResponse(res, { data: await commands.recordCount(req.user, parse(documentIdentifier, req.params.id), parse(countBody, req.body)) })));
router.post('/:id/correct-empty-location', catchAsync(async (req, res) => formatApiResponse(res, { data: await commands.correctEmptyLocation(req.user, parse(documentIdentifier, req.params.id), parse(correctionBody, req.body)) })));
router.post('/:id/cancel', catchAsync(async (req, res) => formatApiResponse(res, { data: await commands.cancelStocktake(req.user, parse(documentIdentifier, req.params.id), parse(operation.extend({ reason: text }).strict(), req.body)) })));
router.post('/:id/count-reason', catchAsync(async (req, res) => formatApiResponse(res, { data: await commands.setCountReason(req.user, parse(documentIdentifier, req.params.id), parse(countReasonBody, req.body)) })));
router.post('/:id/reconcile', catchAsync(async (req, res) => formatApiResponse(res, { data: await commands.reconcileStocktake(req.user, parse(documentIdentifier, req.params.id), parse(operation.strict(), req.body)) })));
router.post('/:id/recount', catchAsync(async (req, res) => formatApiResponse(res, { data: await reconciliation.recountStocktake(req.user, parse(documentIdentifier, req.params.id), parse(recountBody, req.body)) })));
router.post('/:id/approve-differences', catchAsync(async (req, res) => formatApiResponse(res, { data: await reconciliation.approveStocktakeDifferences(req.user, parse(documentIdentifier, req.params.id), parse(approveBody, req.body)) })));
router.get('/', catchAsync(async (req, res) => formatApiResponse(res, { data: await service.listStocktakes(req.user, parse(stocktakeListQuery, req.query)) })));
// Retired workflow, read-only: resolution plans of sessions created before 22 Nov 2026 stay readable.
// Literal segments are registered before `/:id` so they are not parsed as a stocktake identifier.
router.get('/resolution-plans', catchAsync(async (req, res) => formatApiResponse(res, { data: await resolution.listResolutionPlans(req.user, parse(resolutionListQuery, req.query)) })));
router.get('/resolution-plans/:planId', catchAsync(async (req, res) => formatApiResponse(res, { data: await resolution.getResolutionPlan(req.user, parse(oid, req.params.planId)) })));
// One JPEG/PNG/PDF (max 5 MB) per request; the service checks the step, assignment and real file content.
const multipart = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 } }).single('file');
router.post('/:id/evidence', (req, res, next) => multipart(req, res, e => next(e ? new ApiError(e.code === 'LIMIT_FILE_SIZE' ? 413 : 400, 'Một tệp JPEG/PNG/PDF tối đa 5 MB') : undefined)),
    catchAsync(async (req, res) => formatApiResponse(res, { data: await evidence.uploadStocktakeEvidence(req.user, parse(documentIdentifier, req.params.id), req.file) })));
router.get('/:id/evidence/:evidenceId', catchAsync(async (req, res) => formatApiResponse(res, { data: await evidence.downloadStocktakeEvidence(req.user, parse(documentIdentifier, req.params.id), parse(oid, req.params.evidenceId)) })));
router.get('/:id/lots', catchAsync(async (req, res) => formatApiResponse(res, { data: await service.listStocktakeLots(req.user, parse(documentIdentifier, req.params.id), parse(stocktakeLotsQuery, req.query)) })));
router.get('/:id/count-sheet', catchAsync(async (req, res) => formatApiResponse(res, { data: await getCountSheet(req.user, parse(documentIdentifier, req.params.id)) })));
router.get('/:id', catchAsync(async (req, res) => formatApiResponse(res, { data: await service.getStocktake(req.user, parse(documentIdentifier, req.params.id)) })));
export default router;
