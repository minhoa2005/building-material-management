import bcrypt from 'bcryptjs';
import { User, Role } from '../models/index.js';

export const SEED_ACCOUNTS = [
  {
    roleCode: 'ADMIN',
    username: 'admin@ceratile.vn',
    fullName: 'Quản trị viên',
    password: 'Admin@123',
    phone: '0901234567',
  },
  {
    roleCode: 'OWNER',
    username: 'owner@ceratile.vn',
    fullName: 'Chủ cửa hàng',
    password: 'Owner@123',
    phone: '0901234568',
  },
  {
    roleCode: 'SALES',
    username: 'sales@ceratile.vn',
    fullName: 'Nhân viên Bán hàng',
    password: 'Sales@123',
    phone: '0901234569',
  },
  {
    roleCode: 'WAREHOUSE',
    username: 'warehouse@ceratile.vn',
    fullName: 'Thủ kho & Điều phối',
    password: 'Kho@12345678',
    phone: '0901234570',
  },
  {
    roleCode: 'ACCOUNTANT',
    username: 'accountant@ceratile.vn',
    fullName: 'Kế toán công nợ',
    password: 'KeToan@123',
    phone: '0901234571',
  },
];

export async function seedRolesAndUsers() {
  // 1. Ensure Roles exist
  const roles = await Promise.all(
    ['ADMIN', 'OWNER', 'SALES', 'WAREHOUSE', 'ACCOUNTANT'].map(async (code) => {
      let role = await Role.findOne({ code });
      if (!role) {
        role = await Role.create({ code, permissionIds: [] });
      }
      return role;
    })
  );

  const roleMap = new Map(roles.map((r) => [r.code, r._id]));

  // 2. Ensure Users exist
  for (const account of SEED_ACCOUNTS) {
    const existing = await User.findOne({ username: account.username });
    if (!existing) {
      const passwordHash = await bcrypt.hash(account.password, 10);
      const roleId = roleMap.get(account.roleCode);

      await User.create({
        username: account.username,
        fullName: account.fullName,
        passwordHash,
        roleIds: roleId ? [roleId] : [],
        phone: account.phone,
        isActive: true,
      });
      console.info(`[Seed] Created user: ${account.username} (${account.roleCode})`);
    }
  }
}
