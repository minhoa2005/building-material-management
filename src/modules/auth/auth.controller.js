import { catchAsync } from '../../shared/utils/catchAsync.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import * as authService from './auth.service.js';

export const login = catchAsync(async (req, res) => {
  const result = await authService.loginUser(req.body.username, req.body.password);
  ApiResponse.success(res, { message: 'Login successful', data: result });
});
