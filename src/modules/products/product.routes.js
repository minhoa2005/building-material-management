import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/auth.js";
import checkPermission from "../../middlewares/permission.js";
import { validate } from "../../middlewares/validate.js";
import { validationError } from "../../shared/utils/ApiError.js";
import * as controller from "./product.controller.js";
import * as validation from "./product.validation.js";

const router = Router();
router.use(authenticate);

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
}).array("images", 5);

const uploadProductImages = (req, res, next) => {
  multerUpload(req, res, (err) => {
    if (err) {
      if (err.name === "MulterError") {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(validationError("Dung lượng mỗi ảnh tối đa 5MB"));
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return next(validationError("Chỉ được gửi tối đa 5 ảnh"));
        }
        return next(validationError(`Lỗi tải ảnh: ${err.message}`));
      }
      return next(err);
    }
    next();
  });
};

const parseMultipartPayload = (req, _res, next) => {
  try {
    if (typeof req.body?.payload === "string") {
      const parsed = JSON.parse(req.body.payload);
      req.body = { ...parsed, ...req.body };
      delete req.body.payload;
    }
    next();
  } catch {
    next(validationError("Dữ liệu biểu mẫu không hợp lệ"));
  }
};

router.get(
  "/options",
  checkPermission("product:read"),
  validate(validation.productOptionsSchema),
  controller.options,
);
router.get(
  "/",
  checkPermission("product:read"),
  validate(validation.listProductsSchema),
  controller.list,
);
router.post(
  "/",
  checkPermission("product:create"),
  uploadProductImages,
  parseMultipartPayload,
  validate(validation.createProductSchema),
  controller.create,
);
router.get(
  "/:id/warehouse-policies",
  checkPermission("product:update"),
  validate(validation.listPoliciesSchema),
  controller.policies,
);
router.put(
  "/:id/warehouse-policies/:warehouseId",
  checkPermission("product:update"),
  validate(validation.configurePolicySchema),
  controller.configurePolicy,
);
router.get(
  "/:id/conversions",
  checkPermission("product:read"),
  validate(validation.listConversionsSchema),
  controller.conversions,
);
router.post(
  "/:id/conversions",
  checkPermission("product:update"),
  validate(validation.createConversionSchema),
  controller.createConversion,
);
router.get(
  "/:id",
  checkPermission("product:read"),
  validate(validation.productIdSchema),
  controller.detail,
);
router.put(
  "/:id",
  checkPermission("product:update"),
  validate(validation.updateProductSchema),
  controller.update,
);
router.patch(
  "/:id/status",
  checkPermission("product:update"),
  validate(validation.changeProductStatusSchema),
  controller.changeStatus,
);

export default router;
