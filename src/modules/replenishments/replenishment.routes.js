import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import checkPermission from "../../middlewares/permission.js";
import { validate } from "../../middlewares/validate.js";
import { READ_PERMISSION, BUSINESS_ROLES } from "./replenishment.access.js";
import * as controller from "./replenishment.controller.js";
import * as validation from "./replenishment.validation.js";

const router = Router();
router.use(authenticate);
router.use(checkPermission(READ_PERMISSION, BUSINESS_ROLES));
router.get(
  "/",
  validate(validation.listReplenishmentsSchema),
  controller.listReplenishments,
);
router.get(
  "/:id",
  validate(validation.getReplenishmentSchema),
  controller.getReplenishment,
);

export default router;
