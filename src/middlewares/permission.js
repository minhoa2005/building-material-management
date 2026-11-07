import { forbiddenError } from "../shared/utils/ApiError.js";
import { hasPermission } from "../shared/utils/access.js";

const checkPermission =
  (requiredPermission) =>
  (req, _res, next) => {
    if (!hasPermission(req.user, requiredPermission)) {
      return next(forbiddenError());
    }
    next();
  };

export default checkPermission;
