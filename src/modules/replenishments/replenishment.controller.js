import { catchAsync } from "../../shared/utils/catchAsync.js";
import { formatApiResponse } from "../../shared/utils/ApiResponse.js";
import * as service from "./replenishment.service.js";
import * as commands from "./replenishment.commands.js";
import { getReplenishmentSourceOptions } from "./replenishment.sources.js";

export const evaluate = catchAsync(async (req, res) => {
  const data = await commands.evaluateReplenishment(req.user, req.validated.body);
  formatApiResponse(res, { data });
});
export const cancel = catchAsync(async (req, res) => {
  const data = await commands.cancelReplenishment(req.user, req.validated.params.id, req.validated.body);
  formatApiResponse(res, { message: 'Đã rút/hủy yêu cầu bổ sung', data });
});

export const listReplenishments = catchAsync(async (req, res) => {
  const data = await service.listReplenishments(req.user, req.validated.query);
  formatApiResponse(res, { data });
});

export const getReplenishment = catchAsync(async (req, res) => {
  const data = await service.getReplenishment(
    req.user,
    req.validated.params.id,
  );
  formatApiResponse(res, { data });
});

export const options = catchAsync(async (req, res) => {
  const data = await commands.getReplenishmentOptions(
    req.user,
    req.validated.query.mode,
    req.validated.query.requestId,
  );
  formatApiResponse(res, { data });
});

export const lotOptions = catchAsync(async (req, res) => {
  const data = await commands.getReplenishmentLotOptions(req.user, req.validated.query);
  formatApiResponse(res, { data });
});

export const sourceOptions = catchAsync(async (req, res) => {
  const data = await getReplenishmentSourceOptions(req.user, req.validated.query);
  formatApiResponse(res, { data });
});

export const create = catchAsync(async (req, res) => {
  const data = await commands.createReplenishment(
    req.user,
    req.validated.body,
  );
  formatApiResponse(res, {
    statusCode: data.replayed ? 200 : 201,
    message: data.replayed
      ? "Yêu cầu đã được lưu trước đó"
      : data.workflowStatus === "SUBMITTED"
        ? "Gửi yêu cầu bổ sung hàng thành công"
        : "Lưu nháp yêu cầu bổ sung hàng thành công",
    data,
  });
});

export const update = catchAsync(async (req, res) => {
  const data = await commands.updateReplenishment(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, {
    message: "Cập nhật yêu cầu bổ sung hàng thành công",
    data,
  });
});

export const submit = catchAsync(async (req, res) => {
  const data = await commands.submitReplenishment(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, {
    message: data.replayed
      ? "Yêu cầu đã được gửi trước đó"
      : "Gửi yêu cầu bổ sung hàng thành công",
    data,
  });
});

export const review = catchAsync(async (req, res) => {
  const data = await commands.reviewReplenishment(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, {
    message: "Ghi nhận quyết định duyệt yêu cầu thành công",
    data,
  });
});

export const submissions = catchAsync(async (req, res) => {
  const data = await service.listReplenishmentSubmissions(
    req.user,
    req.validated.params.id,
    req.validated.query,
  );
  formatApiResponse(res, { data });
});

export const submission = catchAsync(async (req, res) => {
  const data = await service.getReplenishmentSubmission(
    req.user,
    req.validated.params.id,
    req.validated.params.version,
  );
  formatApiResponse(res, { data });
});
