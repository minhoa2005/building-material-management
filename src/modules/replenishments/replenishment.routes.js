import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import checkPermission from "../../middlewares/permission.js";
import { validate } from "../../middlewares/validate.js";
import { READ_PERMISSION } from "./replenishment.access.js";
import * as controller from "./replenishment.controller.js";
import * as validation from "./replenishment.validation.js";

const router = Router();
router.use(authenticate);

router.post('/evaluate', validate(validation.evaluateReplenishmentSchema), controller.evaluate);
router.post('/:id/cancel', validate(validation.cancelReplenishmentSchema), controller.cancel);

router.get(
  "/options/lots",
  validate(validation.replenishmentLotOptionsSchema),
  controller.lotOptions,
);
router.get(
  "/options/sources",
  validate(validation.replenishmentSourceOptionsSchema),
  controller.sourceOptions,
);
router.get(
  "/options",
  validate(validation.replenishmentOptionsSchema),
  controller.options,
);
router.get(
  "/",
  checkPermission(READ_PERMISSION),
  validate(validation.listReplenishmentsSchema),
  controller.listReplenishments,
);
router.post(
  "/",
  checkPermission("replenishment_request:create"),
  validate(validation.createReplenishmentSchema),
  controller.create,
);
router.get(
  "/:id/submissions",
  checkPermission(READ_PERMISSION),
  validate(validation.listSubmissionsSchema),
  controller.submissions,
);
router.get(
  "/:id/submissions/:version",
  checkPermission(READ_PERMISSION),
  validate(validation.getSubmissionSchema),
  controller.submission,
);
router.post(
  "/:id/submit",
  checkPermission("replenishment_request:update"),
  validate(validation.submitReplenishmentSchema),
  controller.submit,
);
router.post(
  "/:id/review",
  checkPermission("replenishment_request:approve"),
  validate(validation.reviewReplenishmentSchema),
  controller.review,
);
router.get(
  "/:id",
  checkPermission(READ_PERMISSION),
  validate(validation.getReplenishmentSchema),
  controller.getReplenishment,
);
router.put(
  "/:id",
  checkPermission("replenishment_request:update"),
  validate(validation.updateReplenishmentSchema),
  controller.update,
);

export default router;
