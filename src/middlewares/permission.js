import { Permission, Role } from "../models/index.js";
import { ApiError } from "../shared/utils/ApiError.js";

const checkPermission = (requiredPermission, requiredRoles) => {
  return async (req, res, next) => {
    const user = req.user;
    const permissions = user.permissions;
    if (!user || user.length === 0) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hàng động này"),
      );
    }
    if (!requiredRoles.includes(user.roles)) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hàng động này"),
      );
    }
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
