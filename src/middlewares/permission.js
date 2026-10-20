import { Permission, Role } from "../models/index.js";
import { ApiError } from "../shared/utils/ApiError.js";

const checkPermission = (requiredPermission, requiredRoles) => {
  return async (req, res, next) => {
    const userPermissions = req.user;
    if (!userPermissions || userPermissions.length === 0) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hàng động này"),
      );
    }
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(userPermissions.roleIds.code)) {
        return next(
          new ApiError(403, "Bạn không có quyền thực hiện hàng động này"),
        );
      }
    }
    const checkPermission = await Permission.find({
      _id: { $in: userPermissions.roleIds.map((role) => role.permissionIds) },
    });
    const hasPermission = checkPermission.some(
      (permission) => requiredPermission === permission.code,
    );
    if (!hasPermission) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hàng động này"),
      );
    }
    next();
  };
};

export default checkPermission;
