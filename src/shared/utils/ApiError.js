export class ApiError extends Error {
  constructor(statusCode, message, { code = null, fieldErrors = [], details = null } = {}) {
    super(message);
    this.statusCode = statusCode;
    if (code) this.code = code;
    if (fieldErrors.length) this.fieldErrors = fieldErrors;
    if (details != null) this.details = details;
  }
}

export const ERROR_CODES = Object.freeze({
  VALIDATION: "ERR-CORE-400-001",
  UNAUTHENTICATED: "ERR-CORE-401-001",
  FORBIDDEN: "ERR-CORE-403-001",
  WAREHOUSE_SCOPE: "ERR-CORE-403-002",
  NOT_FOUND: "ERR-CORE-404-001",
  VERSION_CONFLICT: "ERR-CORE-409-001",
  DUPLICATE: "ERR-CORE-409-002",
  OPERATION_CONFLICT: "ERR-CORE-409-003",
  PAYLOAD_TOO_LARGE: "ERR-CORE-413-001",
  RR_STATE: "ERR-RR-409-001",
  RR_SELF_APPROVAL: "ERR-RR-403-001",
  RR_CONVERSION_CHANGED: "ERR-RR-409-002",
  RR_SOURCE_READ_ONLY: "ERR-RR-409-003",
  RR_REVIEW_QUANTITY: "ERR-RR-400-001",
  LOT_IDENTITY_LOCKED: "ERR-LOT-409-001",
  LOT_VERIFICATION: "ERR-LOT-400-001",
});

export const validationError = (message, fieldErrors = []) =>
  new ApiError(400, message, { code: ERROR_CODES.VALIDATION, fieldErrors });
export const notFoundError = (message = "Không tìm thấy dữ liệu") =>
  new ApiError(404, message, { code: ERROR_CODES.NOT_FOUND });
export const forbiddenError = (message = "Bạn không có quyền thực hiện hành động này") =>
  new ApiError(403, message, { code: ERROR_CODES.FORBIDDEN });
export const scopeError = (message = "Bạn không được phân công kho này") =>
  new ApiError(403, message, { code: ERROR_CODES.WAREHOUSE_SCOPE });
export const versionConflict = (message, currentVersion, code = ERROR_CODES.VERSION_CONFLICT) =>
  new ApiError(409, message, {
    code,
    details: currentVersion == null ? null : { currentVersion },
  });
export const duplicateError = (message = "Dữ liệu đã tồn tại") =>
  new ApiError(409, message, { code: ERROR_CODES.DUPLICATE });
export const operationConflict = (message = "Operation key đã được dùng với nội dung khác") =>
  new ApiError(409, message, { code: ERROR_CODES.OPERATION_CONFLICT });