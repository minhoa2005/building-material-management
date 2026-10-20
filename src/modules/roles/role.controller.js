import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import * as roleService from './role.service.js';

export const listRoles = catchAsync(async (_req, res) => {
  const result = await roleService.listRoles();
  formatApiResponse(res, { data: result });
});

export const updateRolePermissions = catchAsync(async (req, res) => {
  const result = await roleService.updateRolePermissions(req.params.code, req.body.permissionCodes);
  formatApiResponse(res, { message: 'Cập nhật phân quyền thành công', data: result });
});
