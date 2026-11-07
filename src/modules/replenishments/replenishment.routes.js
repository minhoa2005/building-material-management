import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import checkPermission from "../../middlewares/permission.js";
import { validate } from "../../middlewares/validate.js";
import { READ_PERMISSION, BUSINESS_ROLES } from "./replenishment.access.js";
import * as controller from "./replenishment.controller.js";
import * as validation from "./replenishment.validation.js";

const REQUEST_ROLES = ["WAREHOUSE", "SALES"];
const router = Router();
router.use(authenticate);

router.post('/evaluate', validate(validation.evaluateReplenishmentSchema), controller.evaluate);
router.post('/:id/cancel', validate(validation.cancelReplenishmentSchema), controller.cancel);

router.get(
  "/options",
  validate(validation.replenishmentOptionsSchema),
  controller.options,
);
router.get(
  "/",
  checkPermission(READ_PERMISSION, BUSINESS_ROLES),
  validate(validation.listReplenishmentsSchema),
  controller.listReplenishments,
);
router.post(
  "/",
  checkPermission("replenishment_request:create", REQUEST_ROLES),
  validate(validation.createReplenishmentSchema),
  controller.create,
);
router.get(
  "/:id/submissions",
  checkPermission(READ_PERMISSION, BUSINESS_ROLES),
  validate(validation.listSubmissionsSchema),
  controller.submissions,
);
router.get(
  "/:id/submissions/:version",
  checkPermission(READ_PERMISSION, BUSINESS_ROLES),
  validate(validation.getSubmissionSchema),
  controller.submission,
);
router.post(
  "/:id/submit",
  checkPermission("replenishment_request:update", REQUEST_ROLES),
  validate(validation.submitReplenishmentSchema),
  controller.submit,
);
router.post(
  "/:id/review",
  checkPermission("replenishment_request:approve", ["OWNER"]),
  validate(validation.reviewReplenishmentSchema),
  controller.review,
);
router.get(
  "/:id",
  checkPermission(READ_PERMISSION, BUSINESS_ROLES),
  validate(validation.getReplenishmentSchema),
  controller.getReplenishment,
);
router.put(
  "/:id",
  checkPermission("replenishment_request:update", REQUEST_ROLES),
  validate(validation.updateReplenishmentSchema),
  controller.update,
);

export default router;
