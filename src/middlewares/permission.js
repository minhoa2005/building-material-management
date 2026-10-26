import { Permission, Role } from "../models/index.js";
import { ApiError } from "../shared/utils/ApiError.js";

const checkPermission = (requiredPermission, requiredRoles) => {
  return async (req, res, next) => {
    const roleCodes = user.roleIds.map((role) => role.code);
    const allowRoles = requiredRoles.map((role) => role.toUpperCase());
    const user = req.user;
    if (!user || user.length === 0) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hàng động này"),
      );
    }
    if (!roleCodes.some((role) => allowRoles.includes(role.toUpperCase()))) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hàng động này"),
      );
    }
    const permissions = [];
    user.roleIds.forEach((role) => {
      role.permissionIds.forEach((per) => {
        permission.push(per.code);
      });
    });
    const hasPermission = permissions.some(
      (permission) => permission === requiredPermission,
    );
    if (!hasPermission) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hàng động này"),
      );
    }
    console.log("User Permissions:", user.roleIds[0].permissionIds);
    next();
  };
};

export default checkPermission;
