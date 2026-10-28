import test from 'node:test';
import assert from 'node:assert/strict';
import { User, Role, Permission } from '../src/models/index.js';
import * as userService from '../src/modules/users/user.service.js';
import * as roleService from '../src/modules/roles/role.service.js';

test('userService: listUsers returns correct structure', async (t) => {
  const originalFind = User.find;
  const originalCount = User.countDocuments;

  t.after(() => {
    User.find = originalFind;
    User.countDocuments = originalCount;
  });

  User.find = () => ({
    populate: () => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            lean: async () => [
              {
                _id: '6ad71e8ab077eb989721f6a9',
                username: 'admin@ceratile.vn',
                fullName: 'Quản trị viên',
                phone: '0901234567',
                roleId: { code: 'ADMIN' },
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          }),
        }),
      }),
    }),
  });

  User.countDocuments = async () => 1;

  const result = await userService.listUsers({ page: 1, limit: 10 });
  assert.equal(result.total, 1);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].username, 'admin@ceratile.vn');
  assert.equal(result.items[0].role, 'admin');
});

test('roleService: updateRolePermissions updates permissions for a role', async (t) => {
  const originalRoleFindOne = Role.findOne;
  const originalPermFindOne = Permission.findOne;
  const originalPermCreate = Permission.create;

  t.after(() => {
    Role.findOne = originalRoleFindOne;
    Permission.findOne = originalPermFindOne;
    Permission.create = originalPermCreate;
  });

  const mockRole = {
    _id: 'mock_role_id',
    code: 'SALES',
    permissionIds: [],
    save: async () => {},
  };

  Role.findOne = async () => mockRole;
  Permission.findOne = async ({ code }) => ({ _id: `perm_${code}`, code });

  const res = await roleService.updateRolePermissions('SALES', ['inventory.view', 'orders.create']);
  assert.equal(res.code, 'SALES');
  assert.deepEqual(res.permissions, ['inventory.view', 'orders.create']);
});
