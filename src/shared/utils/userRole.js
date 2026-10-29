import { ROLE_CODES } from '../../models/constants.js';
import { ROLE_PERMISSIONS } from '../../seeds/data/permissions.data.js';
import { ApiError } from './ApiError.js';

// Only a populated, current role is authoritative. Legacy arrays never grant rights.
export function currentRole(user) {
  const role = user?.roleId;
  return role && !Array.isArray(role) && ROLE_CODES.includes(role.code) ? role : null;
}

export function rolePermissions(user) {
  const role = currentRole(user);
  if (!role) return [];
  const allowed = ROLE_PERMISSIONS[role.code];
  return [...new Set((role.permissionIds || [])
    .map((permission) => permission?.code)
    .filter((code) => allowed.includes(code)))];
}

export function userRoleDto(user) {
  const assigned = currentRole(user);
  if (!assigned) throw new ApiError(401, 'Tài khoản chưa có vai trò hợp lệ; cần hoàn tất chuyển đổi dữ liệu');
  const role = assigned.code.toLowerCase();
  return { role, roles: [role], primaryRole: role };
}
