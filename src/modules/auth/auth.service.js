import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from '../../models/index.js';
import { ApiError } from '../../shared/utils/ApiError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const loginUser = async (username, password) => {
  const normalizedUsername = username.trim().toLowerCase();

  // Find user by username (include passwordHash) and populate roles + permissions
  const user = await User.findOne({ username: normalizedUsername })
    .select('+passwordHash')
    .populate({
      path: 'roleIds',
      populate: { path: 'permissionIds' },
    });

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không chính xác');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không chính xác');
  }

  const roleCodes = (user.roleIds || []).map((r) => r.code.toLowerCase());
  const primaryRole = roleCodes[0] || 'admin';

  // Aggregate permission codes from all assigned roles
  const permissionSet = new Set();
  (user.roleIds || []).forEach((r) => {
    (r.permissionIds || []).forEach((p) => {
      if (p.code) permissionSet.add(p.code);
    });
  });
  const permissions = Array.from(permissionSet);

  const tokenPayload = {
    userId: user._id,
    username: user.username,
    fullName: user.fullName,
    roles: roleCodes,
    permissions,
  };

  const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    accessToken,
    user: {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      roles: roleCodes,
      primaryRole,
      permissions,
    },
  };
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).populate({
    path: 'roleIds',
    populate: { path: 'permissionIds' },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Người dùng không tồn tại hoặc đã bị vô hiệu hóa');
  }

  const roleCodes = (user.roleIds || []).map((r) => r.code.toLowerCase());
  const primaryRole = roleCodes[0] || 'admin';

  const permissionSet = new Set();
  (user.roleIds || []).forEach((r) => {
    (r.permissionIds || []).forEach((p) => {
      if (p.code) permissionSet.add(p.code);
    });
  });

  return {
    id: user._id,
    username: user.username,
    fullName: user.fullName,
    phone: user.phone,
    roles: roleCodes,
    primaryRole,
    permissions: Array.from(permissionSet),
  };
};
