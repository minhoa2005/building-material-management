import jwt from "jsonwebtoken";
import { ApiError, ERROR_CODES } from "../shared/utils/ApiError.js";
import { User } from "../models/index.js";
import { currentRole } from "../shared/utils/userRole.js";

const unauthenticated = (message) =>
  new ApiError(401, message, { code: ERROR_CODES.UNAUTHENTICATED });

const JWT_SECRET =
  process.env.JWT_SECRET || "wmsd_default_super_secret_jwt_key_2026";

export const authenticate = async (req, _res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.claim_access_token) {
      token = req.cookies.claim_access_token;
    }

    if (!token) {
      return next(
        unauthenticated("Yêu cầu đăng nhập để truy cập tài nguyên này"),
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).populate({
      path: "roleId",
      populate: { path: "permissionIds" },
    });
    if (!user || !user.isActive || !currentRole(user)) {
      return next(
        unauthenticated("Tài khoản không hợp lệ hoặc đã bị vô hiệu hóa"),
      );
    }

    req.user = user;
    next();
  } catch (_err) {
    next(unauthenticated("Phiên đăng nhập không hợp lệ hoặc đã hết hạn"));
  }
};

export const authorize =
  (allowedRoles = []) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(unauthenticated("Chưa xác thực"));
    }

    const assigned = currentRole(req.user);
    const hasRole = assigned && allowedRoles.some((role) => assigned.code === role.toUpperCase());

    if (!hasRole) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hành động này", {
          code: ERROR_CODES.FORBIDDEN,
        }),
      );
    }

    next();
  };
