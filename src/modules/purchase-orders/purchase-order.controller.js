import { catchAsync } from "../../shared/utils/catchAsync.js";
import { formatApiResponse } from "../../shared/utils/ApiResponse.js";
import * as service from "./purchase-order.service.js";

export const list = catchAsync(async (req, res) => {
  const data = await service.listPurchaseOrders(req.user, req.validated.query);
  formatApiResponse(res, { data });
});
export const supplierOptions = catchAsync(async (req, res) => {
  const data = await service.listPurchaseOrderSupplierOptions(req.user, req.validated.query);
  formatApiResponse(res, { data });
});
export const get = catchAsync(async (req, res) => {
  const data = await service.getPurchaseOrder(req.user, req.validated.params.id);
  formatApiResponse(res, { data });
});
