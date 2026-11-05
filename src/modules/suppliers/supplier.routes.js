import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import checkPermission from "../../middlewares/permission.js";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./supplier.controller.js";
import * as validation from "./supplier.validation.js";

const READ_ROLES = ["OWNER", "ACCOUNTANT"];
const router = Router();
router.use(authenticate);

router.get(
  "/",
  checkPermission("supplier:read", READ_ROLES),
  validate(validation.listSuppliersSchema),
  controller.list,
);

router.get("/names", controller.getNames);

router.post(
  "/",
  checkPermission("supplier:create", ["ACCOUNTANT"]),
  validate(validation.createSupplierSchema),
  controller.create,
);
router.get(
  "/:id/history",
  checkPermission("supplier:read", READ_ROLES),
  validate(validation.supplierHistorySchema),
  controller.history,
);
router.get(
  "/:id/documents",
  checkPermission("supplier:read", READ_ROLES),
  validate(validation.supplierDocumentsSchema),
  controller.documents,
);
router.get(
  "/:id",
  checkPermission("supplier:read", READ_ROLES),
  validate(validation.supplierIdSchema),
  controller.detail,
);
router.put(
  "/:id",
  checkPermission("supplier:update", ["ACCOUNTANT"]),
  validate(validation.updateSupplierSchema),
  controller.update,
);
router.patch(
  "/:id/status",
  checkPermission("supplier:activate", ["OWNER"]),
  validate(validation.changeSupplierStatusSchema),
  controller.changeStatus,
);

export default router;
