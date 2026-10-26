import { seedPermissions, seedRoles } from './permission.seed.js';
import { seedWarehouses } from './warehouse.seed.js';
import { seedUsers } from './user.seed.js';

/**
 * Chạy toàn bộ seed theo thứ tự phụ thuộc: permission -> role -> warehouse -> user.
 * Idempotent: chạy nhiều lần không tạo trùng, chỉ insert dữ liệu còn thiếu.
 *
 * @param {{ syncRolePermissions?: boolean }} [options]
 *   syncRolePermissions = true: ghi đè quyền của 5 role về đúng ma trận mặc định.
 */
export async function runSeeds(options = {}) {
  const permissionMap = await seedPermissions();
  const roleMap = await seedRoles(permissionMap, options);
  const warehouseMap = await seedWarehouses();
  await seedUsers(roleMap, warehouseMap);
  console.info('[Seed] Database seed check completed.');
}

/** Giữ tương thích với tên hàm cũ. */
export const seedRolesAndUsers = runSeeds;
