import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import * as authService from './auth.service.js';

export const login = catchAsync(async (req, res) => {
  const result = await authService.loginUser(req.body.username, req.body.password);
  formatApiResponse(res, { message: 'Login successful', data: result });
});

export const getMe = catchAsync(async (req, res) => {
  const result = await authService.getCurrentUser(req.user._id);
  formatApiResponse(res, { data: result });
});
