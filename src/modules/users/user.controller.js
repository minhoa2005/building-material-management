import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import * as userService from './user.service.js';

export const listUsers = catchAsync(async (req, res) => {
  const result = await userService.listUsers(req.query);
  formatApiResponse(res, { data: result });
});

export const getUserById = catchAsync(async (req, res) => {
  const result = await userService.getUserById(req.params.id);
  formatApiResponse(res, { data: result });
});

export const createUser = catchAsync(async (req, res) => {
  const result = await userService.createUser(req.body);
  formatApiResponse(res, { statusCode: 201, message: 'Tạo tài khoản thành công', data: result });
});

export const updateUser = catchAsync(async (req, res) => {
  const result = await userService.updateUser(req.params.id, req.body);
  formatApiResponse(res, { message: 'Cập nhật tài khoản thành công', data: result });
});

export const toggleUserStatus = catchAsync(async (req, res) => {
  const result = await userService.toggleUserStatus(req.params.id, req.body.isActive, req.user._id);
  formatApiResponse(res, { message: 'Cập nhật trạng thái thành công', data: result });
});
