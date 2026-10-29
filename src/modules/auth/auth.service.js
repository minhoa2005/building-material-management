import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/index.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { rolePermissions, userRoleDto } from '../../shared/utils/userRole.js';
import { generateRefreshToken } from '../../config/jwt.js';

const JWT_SECRET = process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const rolePopulation = { path: 'roleId', populate: { path: 'permissionIds' } };

function profile(user) {
  if (!user || !user.isActive) throw new ApiError(401, 'Người dùng không tồn tại hoặc đã bị vô hiệu hóa');
  return {
    id: user._id, username: user.username, fullName: user.fullName, phone: user.phone,
    ...userRoleDto(user), permissions: rolePermissions(user),
  };
}

function sessionResult(user) {
  const dto = profile(user);
  const accessToken = jwt.sign({
    userId: user._id, username: dto.username, fullName: dto.fullName,
    role: dto.role, roles: dto.roles, permissions: dto.permissions,
  }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { accessToken, user: dto };
}

export const loginUser = async (username, password) => {
  const user = await User.findOne({ username: username.trim().toLowerCase() })
    .select('+passwordHash').populate(rolePopulation);
  if (!user || !user.isActive || !await bcrypt.compare(password, user.passwordHash)) {
    throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không chính xác');
  }
  return { ...sessionResult(user), refreshToken: generateRefreshToken(user._id) };
};

export const getCurrentUser = async (userId) =>
  profile(await User.findById(userId).populate(rolePopulation));

export const refreshToken = async (userId) =>
  sessionResult(await User.findById(userId).populate(rolePopulation));
