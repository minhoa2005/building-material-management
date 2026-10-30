import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import * as service from './location-movement.service.js';
import * as lifecycle from './location-movement.lifecycle.js';

export const create = catchAsync(async (req, res) => {
  const result = await service.createLocationMovement(req.user, req.body);
  formatApiResponse(res, {
    statusCode: result.replayed ? 200 : 201,
    message: result.replayed ? 'Yêu cầu đã được lưu trước đó' : 'Tạo lệnh chuyển vị trí thành công',
    data: result,
  });
});

export const detail = catchAsync(async (req, res) => {
  formatApiResponse(res, { data: await service.getLocationMovement(req.user, req.params.id) });
});

export const list = catchAsync(async (req, res) => {
  formatApiResponse(res, { data: await service.listLocationMovements(req.user, req.query) });
});

export const options = catchAsync(async (req, res) => {
  formatApiResponse(res, { data: await service.locationMovementOptions(req.user, req.query.warehouseId) });
});

export const edit = catchAsync(async (req, res) => {
  formatApiResponse(res, { data: await lifecycle.editLocationMovement(req.user, req.params.id, req.body) });
});

export const cancel = catchAsync(async (req, res) => {
  formatApiResponse(res, { data: await lifecycle.cancelLocationMovement(req.user, req.params.id, req.body) });
});

export const confirm = catchAsync(async (req, res) => {
  formatApiResponse(res, { data: await lifecycle.confirmLocationMovement(req.user, req.params.id, req.body) });
});
