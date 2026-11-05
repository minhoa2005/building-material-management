import { catchAsync } from "../../shared/utils/catchAsync.js";
import { formatApiResponse } from "../../shared/utils/ApiResponse.js";
import * as service from "./supplier.service.js";

export const list = catchAsync(async (req, res) => {
  const data = await service.listSuppliers(req.user, req.validated.query);
  formatApiResponse(res, { data });
});

export const detail = catchAsync(async (req, res) => {
  const data = await service.getSupplier(req.user, req.validated.params.id);
  formatApiResponse(res, { data });
});

export const create = catchAsync(async (req, res) => {
  const data = await service.createSupplier(req.user, req.validated.body);
  formatApiResponse(res, {
    statusCode: 201,
    message: "Tạo nhà cung cấp thành công",
    data,
  });
});

export const update = catchAsync(async (req, res) => {
  const data = await service.updateSupplier(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, { data });
});

export const changeStatus = catchAsync(async (req, res) => {
  const data = await service.changeSupplierStatus(
    req.user,
    req.validated.params.id,
    req.validated.body,
  );
  formatApiResponse(res, { data });
});

export const history = catchAsync(async (req, res) => {
  const data = await service.getSupplierHistory(
    req.user,
    req.validated.params.id,
    req.validated.query,
  );
  formatApiResponse(res, { data });
});

export const documents = catchAsync(async (req, res) => {
  const data = await service.getSupplierDocuments(
    req.user,
    req.validated.params.id,
    req.validated.query,
  );
  formatApiResponse(res, { data });
});

export const getNames = catchAsync(async (req, res) => {
  const data = await service.getSupplierNames();
  formatApiResponse(res, { data });
});
