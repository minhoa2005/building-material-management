import { catchAsync } from "../../shared/utils/catchAsync.js";
import { formatApiResponse } from "../../shared/utils/ApiResponse.js";
import * as service from "./replenishment.service.js";

export const listReplenishments = catchAsync(async (req, res) => {
  const data = await service.listReplenishments(req.user, req.validated.query);
  formatApiResponse(res, { data });
});

// TODO: Hỗ trợ người dùng xem chi tiết sản phẩm trong yêu cầu bổ sung nhấn
// vào chứng từ tham chiếu liên kết để chuyển tới trang chi tiết chứng từ đó.
export const getReplenishment = catchAsync(async (req, res) => {
  const data = await service.getReplenishment(
    req.user,
    req.validated.params.id,
  );
  formatApiResponse(res, { data });
});
