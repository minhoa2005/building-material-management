import { ApiError, ERROR_CODES } from "../shared/utils/ApiError.js";

export const errorHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let error = err;
  if (!(error instanceof ApiError)) {
    if (err?.type === "entity.too.large" || err?.status === 413) {
      error = new ApiError(413, "Dữ liệu gửi lên vượt quá giới hạn 1 MiB", {
        code: ERROR_CODES.PAYLOAD_TOO_LARGE,
      });
    } else if (err instanceof SyntaxError && err.status === 400) {
      error = new ApiError(400, "JSON không hợp lệ", {
        code: ERROR_CODES.VALIDATION,
      });
    } else {
      const statusCode =
        error.statusCode || (error.name === "ValidationError" ? 400 : 500);
      const message = error.message || "Internal server error";
      error = new ApiError(statusCode, message);
      error.stack = err.stack;
    }
  }

  const { statusCode, message, code, fieldErrors, details } = error;
  const response = {
    success: false,
    message,
    ...(code && { code }),
    ...(fieldErrors && { fieldErrors }),
    ...(details != null && { details }),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  if (statusCode >= 500) {
    console.error(err);
  }

  return res.status(statusCode).json(response);
};