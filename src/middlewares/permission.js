import { ApiError } from "../shared/utils/ApiError.js";
import { currentRole, rolePermissions } from "../shared/utils/userRole.js";

const checkPermission =
  (requiredPermission, requiredRoles = []) =>
  (req, _res, next) => {
    const role = currentRole(req.user);
    if (
      !role ||
      (requiredRoles.length &&
        !requiredRoles.some((code) => code.toUpperCase() === role.code)) ||
      !rolePermissions(req.user).includes(requiredPermission)
    ) {
      return next(
        new ApiError(403, "Bạn không có quyền thực hiện hành động này"),
      );
    }
    next();
  };

export default checkPermission;
