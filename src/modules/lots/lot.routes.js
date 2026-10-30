import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import checkPermission from "../../middlewares/permission.js";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./lot.controller.js";
import * as validation from "./lot.validation.js";

const LOT_ROLES = ["OWNER", "WAREHOUSE"];
const router = Router();
router.use(authenticate);

router.get(
  "/",
  checkPermission("product_lot:read", LOT_ROLES),
  validate(validation.listLotsSchema),
  controller.list,
);
router.post(
  "/",
  checkPermission("product_lot:create", LOT_ROLES),
  validate(validation.createLotSchema),
  controller.create,
);
router.get(
  "/:id/movements",
  checkPermission("product_lot:read", LOT_ROLES),
  checkPermission("stock_movement:read", LOT_ROLES),
  validate(validation.lotMovementsSchema),
  controller.movements,
);
router.get(
  "/:id",
  checkPermission("product_lot:read", LOT_ROLES),
  validate(validation.lotIdSchema),
  controller.detail,
);
router.put(
  "/:id",
  checkPermission("product_lot:update", ["OWNER"]),
  validate(validation.updateLotSchema),
  controller.update,
);

export default router;