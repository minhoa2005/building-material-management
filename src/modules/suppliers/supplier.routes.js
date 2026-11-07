import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import checkPermission from "../../middlewares/permission.js";
import { validate } from "../../middlewares/validate.js";
import * as controller from "./supplier.controller.js";
import * as validation from "./supplier.validation.js";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  checkPermission("supplier:read"),
  validate(validation.listSuppliersSchema),
  controller.list,
);

router.get("/names", checkPermission("supplier:read"), controller.getNames);

router.post(
  "/",
  checkPermission("supplier:create"),
  validate(validation.createSupplierSchema),
  controller.create,
);
router.get(
  "/:id/history",
  checkPermission("supplier:read"),
  validate(validation.supplierHistorySchema),
  controller.history,
);
router.get(
  "/:id/documents",
  checkPermission("supplier:read"),
  validate(validation.supplierDocumentsSchema),
  controller.documents,
);
router.get(
  "/:id",
  checkPermission("supplier:read"),
  validate(validation.supplierIdSchema),
  controller.detail,
);
router.put(
  "/:id",
  checkPermission("supplier:update"),
  validate(validation.updateSupplierSchema),
  controller.update,
);
router.patch(
  "/:id/status",
  checkPermission("supplier:activate"),
  validate(validation.changeSupplierStatusSchema),
  controller.changeStatus,
);

export default router;
