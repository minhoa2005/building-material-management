import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { SEED_ACCOUNTS } from './data/accounts.data.js';

export { SEED_ACCOUNTS };

/**
 * Đảm bảo các tài khoản mẫu tồn tại.
 *  - Tài khoản chưa có: tạo mới (mật khẩu hash bcrypt, gán role + kho).
 *  - Tài khoản đã có: KHÔNG đổi mật khẩu; giữ role hiện tại; dữ liệu cũ cần migration riêng, chỉ bổ sung kho nếu rỗng.
 */
export async function seedUsers(roleMap, warehouseMap = new Map()) {
  for (const account of SEED_ACCOUNTS) {
    if (!roleMap.get(account.roleCode)) throw new Error(`Missing role ${account.roleCode}; no users were changed.`);
  }
  for (const account of SEED_ACCOUNTS) {
    const roleId = roleMap.get(account.roleCode);
    const warehouseIds = (account.warehouseCodes || [])
      .map((code) => warehouseMap.get(code))
      .filter(Boolean);

    const existing = await User.findOne({ username: account.username });
    if (!existing) {
      const passwordHash = await bcrypt.hash(account.password, 10);
      await User.create({
        username: account.username,
        fullName: account.fullName,
        passwordHash,
        roleId,
        warehouseIds,
        phone: account.phone,
        isActive: true,
      });
      console.info(`[Seed] Created user: ${account.username} (${account.roleCode})`);
      continue;
    }

    let changed = false;
    if (!existing.roleId || existing.get('roleIds') !== undefined) {
      throw new Error(`User ${existing._id} requires the explicit single-role migration.`);
    }
    if (warehouseIds.length > 0 && (!existing.warehouseIds || existing.warehouseIds.length === 0)) {
      existing.warehouseIds = warehouseIds;
      changed = true;
    }
    if (changed) {
      await existing.save();
      console.info(`[Seed] Updated role/warehouse scope for user: ${account.username}`);
    }
  }
}
