import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import * as roleController from "./role.controller.js";
import * as roleValidation from "./role.validation.js";
import checkPermission from "../../middlewares/permission.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  checkPermission("access_control:read"),
  roleController.listRoles,
);
router.put(
  "/:code/permissions",
  checkPermission("access_control:update"),
  validate(roleValidation.updateRolePermissionsSchema),
  roleController.updateRolePermissions,
);

router.get('/permissions',checkPermission('access_control:read'),roleController.listPermissions);
router.post('/',checkPermission('access_control:create'),validate(roleValidation.createRoleSchema),roleController.createRole);
export default router;
