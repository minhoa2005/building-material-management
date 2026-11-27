import { ApiError, ERROR_CODES } from "../shared/utils/ApiError.js";
import { recordError } from "../shared/utils/errorLog.js";

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let error = err;
  if (!(error instanceof ApiError)) {
    if (err?.type === "entity.too.large" || err?.status === 413) {
      // body-parser reports the limit in bytes; only the import routes allow more than 1 MiB.
      const message = err.limit > 1024 * 1024
        ? "Dữ liệu gửi lên vượt quá giới hạn 8 MB, hãy tách file"
        : "Dữ liệu gửi lên vượt quá giới hạn 1 MiB";
      error = new ApiError(413, message, {
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
    // Grouped in error_logs for the administrator's monitoring screen; never blocks the response.
    void recordError({ source: "HTTP", error: err, statusCode, method: req?.method, path: req?.originalUrl, userId: req?.user?._id });
  }

  return res.status(statusCode).json(response);
};