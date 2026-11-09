import { catchAsync } from "../../shared/utils/catchAsync.js";
import { formatApiResponse } from "../../shared/utils/ApiResponse.js";
import { validationError } from "../../shared/utils/ApiError.js";
import { uploadImageBuffer } from "../upload/upload.service.js";
import * as service from "./product.service.js";

export const list = catchAsync(async (req, res) => {
  const data = await service.listProducts(req.user, req.validated.query);
  formatApiResponse(res, { data });
});

export const options = catchAsync(async (req, res) => {
  formatApiResponse(res, { data: await service.getProductOptions(req.user) });
});

export const detail = catchAsync(async (req, res) => {
  const data = await service.getProduct(req.user, req.validated.params.id);
  formatApiResponse(res, { data });
});

export const create = catchAsync(async (req, res) => {
  let uploadedUrls = [];
  if (Array.isArray(req.files) && req.files.length > 0) {
    uploadedUrls = await Promise.all(
      req.files.map((file) =>
        uploadImageBuffer(file.buffer).then((uploadRes) => uploadRes.url)
      )
    );
  }
  const existingUrls = Array.isArray(req.validated.body.imageUrls)
    ? req.validated.body.imageUrls
    : [];
  if (existingUrls.length + uploadedUrls.length > 5) {
    throw validationError("Tổng số ảnh sản phẩm không được vượt quá 5 ảnh");
  }
  const input = {
    ...req.validated.body,
    imageUrls: [...existingUrls, ...uploadedUrls],
  };
  const data = await service.createProduct(req.user, input);
  formatApiResponse(res, {
    statusCode: 201,
    message: "Tạo sản phẩm thành công",
    data,
  });
});

export const update = catchAsync(async (req, res) => {
  const data = await service.updateProduct(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, { data });
});

export const changeStatus = catchAsync(async (req, res) => {
  const data = await service.changeProductStatus(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, { data });
});

export const policies = catchAsync(async (req, res) => {
  const data = await service.listPolicies(
    req.user,
    req.validated.params.id,
  );
  formatApiResponse(res, { data });
});

export const configurePolicy = catchAsync(async (req, res) => {
  const data = await service.configurePolicy(
    req.user,
    req.validated.params.id,
    req.validated.params.warehouseId,
    req.validated.body,
  );
  formatApiResponse(res, {
    message: "Lưu chính sách kho thành công",
    data,
  });
});

export const conversions = catchAsync(async (req, res) => {
  const data = await service.listConversions(
    req.user,
    req.validated.params.id,
    req.validated.query,
  );
  formatApiResponse(res, { data });
});

export const createConversion = catchAsync(async (req, res) => {
  const data = await service.createConversion(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, {
    statusCode: 201,
    message: "Tạo quy cách quy đổi thành công",
    data,
  });
});
