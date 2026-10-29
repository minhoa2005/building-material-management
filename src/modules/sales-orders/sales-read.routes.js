import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import checkPermission from '../../middlewares/permission.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { detailParams, outboundQuery, createOrderBody, evidenceParams } from './sales.validation.js';
import { createSalesOrder, uploadSourceEvidence } from './sales-create.service.js';
import { uploadSingleImage } from '../../middlewares/upload.js';
import * as service from './sales-read.service.js';

const parse = (schema, value) => {
  const result = schema.safeParse(value);
  if (!result.success) throw new ApiError(400, 'ID hoặc bộ lọc không hợp lệ');
  return result.data;
};
export const salesOrderRouter = Router();
salesOrderRouter.use(authenticate);
const upload = (req, res, next) => uploadSingleImage(req, res, (error) => next(error?.name === 'MulterError' ? new ApiError(400, 'Ảnh tối đa 5 MB, gửi đúng một file ở trường file') : error));
salesOrderRouter.post('/source-evidence', checkPermission('sales_order:create'), upload, catchAsync(async (req, res) => {
  formatApiResponse(res, { statusCode: 201, data: await uploadSourceEvidence(req.user, req.file) });
}));
salesOrderRouter.get('/:id/evidence/:evidenceId', checkPermission('sales_order:read'), catchAsync(async (req, res) => {
  const params = parse(evidenceParams, req.params);
  res.set('Cache-Control', 'no-store');
  formatApiResponse(res, { data: await service.getSalesEvidence(req.user, params.id, params.evidenceId) });
}));
salesOrderRouter.post('/', checkPermission('sales_order:create'), catchAsync(async (req, res) => {
  const data = await createSalesOrder(req.user, parse(createOrderBody, req.body));
  formatApiResponse(res, { statusCode: data.replayed ? 200 : 201, data });
}));
salesOrderRouter.get('/:id', checkPermission('sales_order:read'), catchAsync(async (req, res) => {
  formatApiResponse(res, { data: await service.getSalesOrder(req.user, parse(detailParams, req.params).id) });
}));

export const outboundDeliveryRouter = Router();
outboundDeliveryRouter.use(authenticate, checkPermission('outbound_delivery:read'));
outboundDeliveryRouter.get('/', catchAsync(async (req, res) => {
  formatApiResponse(res, { data: await service.listOutboundDeliveries(req.user, parse(outboundQuery, req.query)) });
}));
outboundDeliveryRouter.get('/:id', catchAsync(async (req, res) => {
  formatApiResponse(res, { data: await service.getOutboundDelivery(req.user, parse(detailParams, req.params).id) });
}));
