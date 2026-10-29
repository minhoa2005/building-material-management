import crypto from "node:crypto";
import { catchAsync } from "../../shared/utils/catchAsync.js";
import { formatApiResponse } from "../../shared/utils/ApiResponse.js";
import { ApiError } from "../../shared/utils/ApiError.js";
import { uploadImageBuffer } from "../upload/upload.service.js";
import * as defectService from "./defect.service.js";

export const listDefects = catchAsync(async (req, res) => {
  const data = await defectService.listDefects(req.user, req.query);
  formatApiResponse(res, { data: data.items, meta: { total: data.total, page: data.page, limit: data.limit } });
});

export const getDefect = catchAsync(async (req, res) => {
  const data = await defectService.getDefectById(req.params.id, req.user);
  formatApiResponse(res, { data });
});

export const createDefect = catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Inspection evidence is required (image field: file)");
  const uploaded = await uploadImageBuffer(req.file.buffer, "sep490/defects", 'authenticated');
  const data = await defectService.createDefect(req.user, req.body, {
    publicId: uploaded.publicId,
    mediaType: req.file.mimetype,
    sha256: crypto.createHash("sha256").update(req.file.buffer).digest("hex"),
  });
  formatApiResponse(res, { statusCode: 201, message: "Defect inspected and held", data });
});

export const parseDefectDisposition = (req, _res, next) => {
  if (typeof req.body.disposition !== "string") return next();
  try {
    req.body.disposition = JSON.parse(req.body.disposition);
    next();
  } catch {
    next(new ApiError(400, "Disposition must be valid JSON"));
  }
};

export const addDefectEvidence = catchAsync(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Execution evidence is required (image field: file)");
  const uploaded = await uploadImageBuffer(req.file.buffer, "sep490/defects", 'authenticated');
  const data = await defectService.addDefectEvidence(req.user, req.params.id, {
    publicId: uploaded.publicId,
    mediaType: req.file.mimetype,
    sha256: crypto.createHash("sha256").update(req.file.buffer).digest("hex"),
  });
  formatApiResponse(res, { statusCode: 201, message: "Defect evidence added", data });
});

export const decideDefect = catchAsync(async (req, res) => {
  const data = await defectService.decideDefect(req.user, req.params.id, req.body);
  formatApiResponse(res, { message: "Disposition decision recorded", data });
});

export const executeDefect = catchAsync(async (req, res) => {
  const data = await defectService.executeDefect(req.user, req.params.id, req.body);
  formatApiResponse(res, { message: data.repeated ? "Previous disposition result returned" : "Defect disposition posted", data });
});
