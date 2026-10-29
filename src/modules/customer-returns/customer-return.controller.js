import crypto from "node:crypto";
import { catchAsync } from "../../shared/utils/catchAsync.js";
import { formatApiResponse } from "../../shared/utils/ApiResponse.js";
import { ApiError } from "../../shared/utils/ApiError.js";
import { uploadImageBuffer } from "../upload/upload.service.js";
import * as customerReturnService from "./customer-return.service.js";

export const listCustomerReturns = catchAsync(async (req, res) => {
  const result = await customerReturnService.listCustomerReturns(req.user, req.query);
  formatApiResponse(res, {
    data: result.items,
    meta: { total: result.total, page: result.page, limit: result.limit },
  });
});

export const getCustomerReturn = catchAsync(async (req, res) => {
  const data = await customerReturnService.getCustomerReturnById(req.params.id, req.user);
  formatApiResponse(res, { data });
});

export const createCustomerReturn = catchAsync(async (req, res) => {
  const data = await customerReturnService.createCustomerReturn(req.user, req.body);
  formatApiResponse(res, { statusCode: 201, message: "Customer return request created", data });
});

export const addCustomerReturnEvidence = catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Evidence image is required (image field: file)");
  const uploaded = await uploadImageBuffer(req.file.buffer, "sep490/customer-returns", 'authenticated');
  const data = await customerReturnService.addCustomerReturnEvidence(req.user, req.params.id, {
    publicId: uploaded.publicId,
    mediaType: req.file.mimetype,
    sha256: crypto.createHash("sha256").update(req.file.buffer).digest("hex"),
  });
  formatApiResponse(res, { statusCode: 201, message: "Customer return evidence added", data });
});

export const inspectCustomerReturn = catchAsync(async (req, res) => {
  const data = await customerReturnService.inspectCustomerReturn(req.user, req.params.id, req.body);
  formatApiResponse(res, { message: "Customer return inspected and placed in customer custody", data });
});

export const decideCustomerReturn = catchAsync(async (req, res) => {
  const data = await customerReturnService.decideOrdinaryCustomerReturn(req.user, req.params.id, req.body);
  formatApiResponse(res, { message: "Customer return decision recorded", data });
});

export const approveCustomerReturnException = catchAsync(async (req, res) => {
  const data = await customerReturnService.approveCustomerReturnException(req.user, req.params.id, req.body);
  formatApiResponse(res, { message: "Customer return exception approved", data });
});
