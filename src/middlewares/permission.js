import { forbiddenError } from "../shared/utils/ApiError.js";
import { currentRole, rolePermissions } from "../shared/utils/userRole.js";

const checkPermission =
  (requiredPermission, requiredRoles = []) =>
  (req, _res, next) => {
    const role = currentRole(req.user);
    if (
      !role ||
!rolePermissions(req.user).includes(requiredPermission)
    ) {
      return next(forbiddenError());
    }
    next();
  };

export default checkPermission;
