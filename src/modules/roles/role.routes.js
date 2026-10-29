import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import * as roleController from "./role.controller.js";
import * as roleValidation from "./role.validation.js";
import checkPermission from "../../middlewares/permission.js";

const router = Router();

router.use(authenticate);
router.use(authorize(["ADMIN", "OWNER"]));

router.get(
  "/",
  checkPermission("access_control:read", ["OWNER", "ADMIN"]),
  roleController.listRoles,
);
router.put(
  "/:code/permissions",
  checkPermission("access_control:update", ["ADMIN"]),
  validate(roleValidation.updateRolePermissionsSchema),
  roleController.updateRolePermissions,
);

export default router;
