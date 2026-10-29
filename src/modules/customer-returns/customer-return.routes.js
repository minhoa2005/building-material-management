import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import checkPermission from "../../middlewares/permission.js";
import { validate } from "../../middlewares/validate.js";
import { uploadSingleImage } from "../../middlewares/upload.js";
import * as controller from "./customer-return.controller.js";
import * as validation from "./customer-return.validation.js";

const router = Router();
router.use(authenticate);

router.get("/", checkPermission("customer_return:read", ["OWNER", "SALES", "WAREHOUSE", "ACCOUNTANT"]), validate(validation.listCustomerReturnsSchema), controller.listCustomerReturns);
router.post("/", checkPermission("customer_return:create", ["SALES"]), validate(validation.createCustomerReturnSchema), controller.createCustomerReturn);
router.get("/:id", checkPermission("customer_return:read", ["OWNER", "SALES", "WAREHOUSE", "ACCOUNTANT"]), validate(validation.customerReturnIdSchema), controller.getCustomerReturn);
router.post("/:id/evidence", checkPermission("customer_return:read", ["SALES", "WAREHOUSE"]), uploadSingleImage, validate(validation.addCustomerReturnEvidenceSchema), controller.addCustomerReturnEvidence);
router.post("/:id/inspect", checkPermission("customer_return:inspect", ["WAREHOUSE"]), validate(validation.inspectCustomerReturnSchema), controller.inspectCustomerReturn);
router.post("/:id/decision", checkPermission("customer_return:accept", ["SALES"]), validate(validation.decideCustomerReturnSchema), controller.decideCustomerReturn);
router.post("/:id/exception-decision", checkPermission("customer_return:approve_exception", ["OWNER"]), validate(validation.decideCustomerReturnExceptionSchema), controller.approveCustomerReturnException);

export default router;
