import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import checkPermission from "../../middlewares/permission.js";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./product.controller.js";
import * as validation from "./product.validation.js";

const BUSINESS_ROLES = ["OWNER", "ACCOUNTANT", "WAREHOUSE", "SALES"];
const router = Router();
router.use(authenticate);

router.get(
  "/options",
  checkPermission("product:read", BUSINESS_ROLES),
  validate(validation.productOptionsSchema),
  controller.options,
);
router.get(
  "/",
  checkPermission("product:read", BUSINESS_ROLES),
  validate(validation.listProductsSchema),
  controller.list,
);
router.post(
  "/",
  checkPermission("product:create", ["OWNER"]),
  validate(validation.createProductSchema),
  controller.create,
);
router.get(
  "/:id/warehouse-policies",
  checkPermission("product:update", ["OWNER"]),
  validate(validation.listPoliciesSchema),
  controller.policies,
);
router.put(
  "/:id/warehouse-policies/:warehouseId",
  checkPermission("product:update", ["OWNER"]),
  validate(validation.configurePolicySchema),
  controller.configurePolicy,
);
router.get(
  "/:id",
  checkPermission("product:read", BUSINESS_ROLES),
  validate(validation.productIdSchema),
  controller.detail,
);
router.put(
  "/:id",
  checkPermission("product:update", ["OWNER"]),
  validate(validation.updateProductSchema),
  controller.update,
);
router.patch(
  "/:id/status",
  checkPermission("product:update", ["OWNER"]),
  validate(validation.changeProductStatusSchema),
  controller.changeStatus,
);

export default router;
