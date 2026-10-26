import { ApiError } from "../shared/utils/ApiError.js";

const checkPermission = (requiredPermission, requiredRoles) => {
  return async (req, res, next) => {
    const allowRoles = (requiredRoles || []).map((role) => role.toUpperCase());
    const user = req.user;
    if (!user) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hàng động này"),
      );
    }
    const roleCodes = user.roleIds.map((role) => role.code);
    if (
      !roleCodes.some((role) => allowRoles.includes(role.toUpperCase())) &&
      allowRoles.length > 0
    ) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hàng động này"),
      );
    }
    const permissions = [];
    user.roleIds.forEach((role) => {
      role.permissionIds.forEach((per) => {
        permissions.push(per.code);
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
    console.log("User Permissions:", permissions);
    next();
  };
};

export default checkPermission;
