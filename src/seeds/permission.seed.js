import { Permission, Role } from '../models/index.js';
import { ROLE_CODES } from '../models/constants.js';
import { PERMISSION_CATALOGUE, ROLE_PERMISSIONS } from './data/permissions.data.js';

/**
 * Đảm bảo toàn bộ permission trong catalogue tồn tại (chỉ insert mã còn thiếu).
 * @returns {Promise<Map<string, import('mongoose').Types.ObjectId>>} code -> _id
 */
export async function seedPermissions() {
  const codes = PERMISSION_CATALOGUE.map((p) => p.code);
  const existing = await Permission.find({ code: { $in: codes } }).lean();
  const existingCodes = new Set(existing.map((p) => p.code));

  const missing = codes.filter((code) => !existingCodes.has(code));
  if (missing.length > 0) {
    await Permission.insertMany(missing.map((code) => ({ code })), { ordered: false });
    console.info(`[Seed] Inserted ${missing.length} permission(s).`);
  }

  const all = await Permission.find({ code: { $in: codes } }).lean();
  return new Map(all.map((p) => [p.code, p._id]));
}

/**
 * Đảm bảo 5 vai trò tồn tại và có quyền mặc định.
 *  - Role chưa có: tạo mới với quyền mặc định.
 *  - Role đã có nhưng chưa có quyền nào: gán quyền mặc định.
 *  - Role đã có quyền: giữ nguyên (tôn trọng chỉnh sửa của Admin), trừ khi `syncRolePermissions = true`
 *    thì ghi đè về đúng ma trận mặc định.
 * @returns {Promise<Map<string, import('mongoose').Types.ObjectId>>} roleCode -> _id
 */
export async function seedRoles(permissionMap, { syncRolePermissions = false } = {}) {
  const roleMap = new Map();

  for (const code of ROLE_CODES) {
    const permissionIds = (ROLE_PERMISSIONS[code] || [])
      .map((permissionCode) => permissionMap.get(permissionCode))
      .filter(Boolean);

    let role = await Role.findOne({ code });
    if (!role) {
      role = await Role.create({ code, permissionIds });
      console.info(`[Seed] Created role ${code} with ${permissionIds.length} permission(s).`);
    } else if (syncRolePermissions || !role.permissionIds || role.permissionIds.length === 0) {
      role.permissionIds = permissionIds;
      await role.save();
      console.info(`[Seed] Assigned ${permissionIds.length} default permission(s) to role ${code}.`);
    }
    roleMap.set(code, role._id);
  }

  return roleMap;
}
