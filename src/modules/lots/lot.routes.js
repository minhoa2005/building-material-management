import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import checkPermission from "../../middlewares/permission.js";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./lot.controller.js";
import * as validation from "./lot.validation.js";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  checkPermission("product_lot:read"),
  validate(validation.listLotsSchema),
  controller.list,
);
router.post(
  "/",
  checkPermission("product_lot:create"),
  validate(validation.createLotSchema),
  controller.create,
);
router.get(
  "/:id/movements",
  checkPermission("product_lot:read"),
  checkPermission("stock_movement:read"),
  validate(validation.lotMovementsSchema),
  controller.movements,
);
router.get(
  "/:id",
  checkPermission("product_lot:read"),
  validate(validation.lotIdSchema),
  controller.detail,
);
router.put(
  "/:id",
  checkPermission("product_lot:update"),
  validate(validation.updateLotSchema),
  controller.update,
);

export default router;