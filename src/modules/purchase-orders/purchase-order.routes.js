import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import checkPermission from "../../middlewares/permission.js";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./purchase-order.controller.js";
import * as validation from "./purchase-order.validation.js";

const router = Router();
router.use(authenticate);
router.get(
  "/",
  checkPermission("purchase_order:read"),
  validate(validation.listPurchaseOrdersSchema),
  controller.list,
);
router.get("/supplier-options", checkPermission("purchase_order:read"),
  validate(validation.purchaseOrderSupplierOptionsSchema), controller.supplierOptions);
router.get("/:id", checkPermission("purchase_order:read"),
  validate(validation.getPurchaseOrderSchema), controller.get);

export default router;
