import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from '../../models/index.js';
import { ApiError } from '../../shared/utils/ApiError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const loginUser = async (username, password) => {
  const normalizedUsername = username.trim().toLowerCase();

  // Find user by username (include passwordHash)
  const user = await User.findOne({ username: normalizedUsername })
    .select('+passwordHash')
    .populate('roleIds');

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không chính xác');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không chính xác');
  }

  const roleCodes = (user.roleIds || []).map((r) => r.code.toLowerCase());
  const primaryRole = roleCodes[0] || 'admin';

  const tokenPayload = {
    userId: user._id,
    username: user.username,
    fullName: user.fullName,
    roles: roleCodes,
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
    },
  };
};
