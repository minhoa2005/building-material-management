import { catchAsync } from "../../shared/utils/catchAsync.js";
import { formatApiResponse } from "../../shared/utils/ApiResponse.js";
import * as service from "./purchase-order.service.js";

export const list = catchAsync(async (req, res) => {
  const data = await service.listPurchaseOrders(req.user, req.validated.query);
  formatApiResponse(res, { data });
});