import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { SEED_ACCOUNTS } from './data/accounts.data.js';

export { SEED_ACCOUNTS };

/**
 * Đảm bảo các tài khoản mẫu tồn tại.
 *  - Tài khoản chưa có: tạo mới (mật khẩu hash bcrypt, gán role + kho).
 *  - Tài khoản đã có: KHÔNG đổi mật khẩu; chỉ bổ sung role/kho nếu đang rỗng.
 */
export async function seedUsers(roleMap, warehouseMap = new Map()) {
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
        roleIds: roleId ? [roleId] : [],
        warehouseIds,
        phone: account.phone,
        isActive: true,
      });
      console.info(`[Seed] Created user: ${account.username} (${account.roleCode})`);
      continue;
    }

    let changed = false;
    if (roleId && (!existing.roleIds || existing.roleIds.length === 0)) {
      existing.roleIds = [roleId];
      changed = true;
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
