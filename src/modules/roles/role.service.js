import { Role, Permission, User } from '../../models/index.js';
import { ApiError } from '../../shared/utils/ApiError.js';

export const listRoles = async () => {
  const roles = await Role.find().populate('permissionIds').lean();

  // Count active users per role
  const userCounts = await User.aggregate([
    { $unwind: '$roleIds' },
    { $group: { _id: '$roleIds', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(userCounts.map((c) => [c._id.toString(), c.count]));

  return roles.map((r) => ({
    id: r._id.toString(),
    code: r.code,
    roleKey: r.code.toLowerCase(),
    userCount: countMap.get(r._id.toString()) || 0,
    permissions: (r.permissionIds || []).map((p) => p.code),
  }));
};

export const updateRolePermissions = async (roleCode, permissionCodes = []) => {
  const role = await Role.findOne({ code: roleCode.toUpperCase() });
  if (!role) {
    throw new ApiError(404, `Không tìm thấy vai trò ${roleCode}`);
  }

  // Ensure permissions exist in database
  const permissionDocs = await Promise.all(
    permissionCodes.map(async (code) => {
      let p = await Permission.findOne({ code });
      if (!p) {
        p = await Permission.create({ code });
      }
      return p;
    })
  );

  role.permissionIds = permissionDocs.map((p) => p._id);
  await role.save();

  return {
    id: role._id.toString(),
    code: role.code,
    roleKey: role.code.toLowerCase(),
    permissions: permissionCodes,
  };
};
