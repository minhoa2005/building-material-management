import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import checkPermission from '../../middlewares/permission.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { listQuery, dispatchListQuery, detailParams, optionsQuery } from './transfer-read.validation.js';
import * as service from './transfer-read.service.js';

const router = Router();
router.use(authenticate, checkPermission('stock_transfer:read'));
router.get('/', catchAsync(async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, 'Bộ lọc điều chuyển không hợp lệ');
  formatApiResponse(res, { data: await service.listTransfers(req.user, parsed.data) });
}));
router.get('/options', catchAsync(async (req,res) => {
  const parsed=optionsQuery.safeParse(req.query);
  if(!parsed.success)throw new ApiError(400,'Bộ lọc lựa chọn điều chuyển không hợp lệ');
  formatApiResponse(res,{data:await service.transferOptions(req.user,parsed.data.warehouseId)});
}));
router.get('/dispatches', catchAsync(async (req, res) => {
  const parsed = dispatchListQuery.safeParse(req.query);
  if (!parsed.success) throw new ApiError(400, 'Bộ lọc phiếu xuất điều chuyển không hợp lệ');
  formatApiResponse(res, { data: await service.listDispatches(req.user, parsed.data) });
}));
router.get('/dispatches/:id', catchAsync(async (req, res) => {
  const parsed = detailParams.safeParse(req.params);
  if (!parsed.success) throw new ApiError(400, 'Mã phiếu xuất điều chuyển không hợp lệ');
  formatApiResponse(res, { data: await service.getDispatch(req.user, parsed.data.id) });
}));
router.get('/:id', catchAsync(async (req, res) => {
  const parsed = detailParams.safeParse(req.params);
  if (!parsed.success) throw new ApiError(400, 'Mã điều chuyển không hợp lệ');
  formatApiResponse(res, { data: await service.getTransfer(req.user, parsed.data.id) });
}));
export default router;
