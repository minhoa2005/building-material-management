import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import checkPermission from "../../middlewares/permission.js";
import { validate } from "../../middlewares/validate.js";
import { uploadSingleImage } from "../../middlewares/upload.js";
import * as controller from "./defect.controller.js";
import * as validation from "./defect.validation.js";

const router = Router();
router.use(authenticate);

router.get("/", checkPermission("defect:read", ["OWNER", "WAREHOUSE"]), validate(validation.listDefectsSchema), controller.listDefects);
router.get("/:id", checkPermission("defect:read", ["OWNER", "WAREHOUSE"]), validate(validation.defectIdSchema), controller.getDefect);
router.post("/", checkPermission("defect:create", ["WAREHOUSE"]), uploadSingleImage, controller.parseDefectDisposition, validate(validation.createDefectSchema), controller.createDefect);
router.post("/:id/decision", checkPermission("defect:approve", ["OWNER"]), validate(validation.decideDefectSchema), controller.decideDefect);
router.post("/:id/evidence", checkPermission("defect:execute", ["WAREHOUSE"]), uploadSingleImage, validate(validation.addDefectEvidenceSchema), controller.addDefectEvidence);
router.post("/:id/execute", checkPermission("defect:execute", ["WAREHOUSE"]), validate(validation.executeDefectSchema), controller.executeDefect);

export default router;
