import { catchAsync } from "../../shared/utils/catchAsync.js";
import { formatApiResponse } from "../../shared/utils/ApiResponse.js";
import * as service from "./lot.service.js";

export const list = catchAsync(async (req, res) => {
  const data = await service.listLots(req.user, req.validated.query);
  formatApiResponse(res, { data });
});

export const detail = catchAsync(async (req, res) => {
  const data = await service.getLot(req.user, req.validated.params.id);
  formatApiResponse(res, { data });
});

export const create = catchAsync(async (req, res) => {
  const data = await service.createLot(req.user, req.validated.body);
  formatApiResponse(res, {
    statusCode: 201,
    message: "Tạo lô hàng thành công",
    data,
  });
});

export const update = catchAsync(async (req, res) => {
  const data = await service.updateLot(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, { data });
});

export const movements = catchAsync(async (req, res) => {
  const data = await service.getLotMovements(
    req.user,
    req.validated.params.id,
    req.validated.query,
  );
  formatApiResponse(res, { data });
});