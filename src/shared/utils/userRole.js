import { PERMISSION_CATALOGUE } from '../../seeds/data/permissions.data.js';
import { ApiError } from './ApiError.js';

const knownPermissions = new Set(PERMISSION_CATALOGUE.map(permission => permission.code));
// A populated, active role is authoritative, including administrator-created roles.
export function currentRole(user) {
  const role = user?.roleId;
  return role && !Array.isArray(role) && typeof role.code === 'string' && role.isActive !== false ? role : null;
}

export function rolePermissions(user) {
  const role = currentRole(user);
  if (!role) return [];
  return [...new Set((role.permissionIds || [])
    .filter(permission=>permission?.isActive!==false).map((permission) => permission?.code)
    .filter((code) => knownPermissions.has(code)))];
}

export function userRoleDto(user) {
  const assigned = currentRole(user);
  if (!assigned) throw new ApiError(401, 'Tài khoản chưa có vai trò hợp lệ; cần hoàn tất chuyển đổi dữ liệu');
  const role = assigned.code.toLowerCase();
  return { role, roles: [role], primaryRole: role };
}
