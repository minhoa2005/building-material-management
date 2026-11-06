import { Role, Permission, User } from '../../models/runtime.js';
import { ApiError } from '../../shared/utils/ApiError.js';

export const listRoles = async () => {
  const roles = await Role.find().populate('permissionIds').lean();

  // Count each account once under its single assigned role
  const userCounts = await User.aggregate([
    { $group: { _id: '$roleId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(userCounts.map((c) => [c._id.toString(), c.count]));

  return roles.map((r) => ({
    id: r._id.toString(),
    code: r.code, name:r.name, description:r.description, isActive:r.isActive, isSystemRole:r.isSystemRole,
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
      const p = await Permission.findOne({ code, isActive:true });
      if (!p) {
        throw new ApiError(400, `Quyền không thuộc danh mục: ${code}`);
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

export async function createRole(input){
 const codes=[...new Set(input.permissionCodes)];const permissions=await Permission.find({code:{$in:codes},isActive:true});if(permissions.length!==codes.length)throw new ApiError(400,'Chỉ chọn quyền đang hoạt động trong danh mục');
 const role=await Role.create({code:input.code,name:input.name,description:input.description,isSystemRole:false,permissionIds:permissions.map(p=>p._id)});return {id:String(role._id),code:role.code,name:role.name,permissions:codes};
}
export async function listPermissions(){return (await Permission.find({isActive:true}).select('code name description').lean()).map(p=>({id:String(p._id),code:p.code,name:p.name,description:p.description}));}

