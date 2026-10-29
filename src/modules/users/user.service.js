import bcrypt from 'bcryptjs';
import { User, Role } from '../../models/index.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { userRoleDto } from '../../shared/utils/userRole.js';

export const listUsers = async ({ page = 1, limit = 10, search = '', role = '', status = 'all' }) => {
  const query = {};

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [{ username: searchRegex }, { fullName: searchRegex }, { phone: searchRegex }];
  }

  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  let roleFilterId = null;
  if (role) {
    const roleDoc = await Role.findOne({ code: role.toUpperCase() });
    if (roleDoc) {
      roleFilterId = roleDoc._id;
      query.roleId = roleFilterId;
    } else {
      return { items: [], total: 0, page: Number(page), limit: Number(limit) };
    }
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    User.find(query)
      .populate('roleId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query),
  ]);

  const mapped = items.map((u) => {
    return {
      id: u._id.toString(),
      username: u.username,
      fullName: u.fullName,
      phone: u.phone,
      ...userRoleDto(u),
      status: u.isActive ? 'active' : 'inactive',
      createdAt: u.createdAt,
      lastLogin: u.updatedAt,
    };
  });

  return { items: mapped, total, page: pageNum, limit: limitNum };
};

export const getUserById = async (id) => {
  const user = await User.findById(id).populate('roleId').lean();
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  return {
    id: user._id.toString(),
    username: user.username,
    fullName: user.fullName,
    phone: user.phone,
    ...userRoleDto(user),
    status: user.isActive ? 'active' : 'inactive',
    createdAt: user.createdAt,
    lastLogin: user.updatedAt,
  };
};

export const createUser = async ({ username, fullName, password, roleCode, phone, isActive = true }) => {
  const normalizedUsername = username.trim().toLowerCase();
  const existing = await User.findOne({ username: normalizedUsername });
  if (existing) {
    throw new ApiError(400, 'Tên đăng nhập đã được sử dụng');
  }

  const roleDoc = await Role.findOne({ code: roleCode.toUpperCase() });
  if (!roleDoc) {
    throw new ApiError(400, 'Vai trò không hợp lệ');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await User.create({
    username: normalizedUsername,
    fullName: fullName.trim(),
    passwordHash,
    roleId: roleDoc._id,
    phone,
    isActive,
  });

  return getUserById(created._id);
};

export const updateUser = async (id, updates) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  if (updates.fullName) user.fullName = updates.fullName.trim();
  if (updates.phone !== undefined) user.phone = updates.phone;
  if (updates.isActive !== undefined) user.isActive = updates.isActive;

  if (updates.roleCode) {
    const roleDoc = await Role.findOne({ code: updates.roleCode.toUpperCase() });
    if (!roleDoc) {
      throw new ApiError(400, 'Vai trò không hợp lệ');
    }
    user.roleId = roleDoc._id;
  }

  if (updates.password) {
    user.passwordHash = await bcrypt.hash(updates.password, 10);
  }

  await user.save();
  return getUserById(user._id);
};

export const toggleUserStatus = async (id, isActive, currentUserId) => {
  if (String(id) === String(currentUserId) && !isActive) {
    throw new ApiError(400, 'Không thể tự vô hiệu hóa tài khoản của chính mình');
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  user.isActive = isActive;
  await user.save();
  return getUserById(user._id);
};
