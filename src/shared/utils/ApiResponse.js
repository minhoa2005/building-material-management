export class ApiResponse {
  static success(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) {
    return res.status(statusCode).json({
      success: true,
      message,
      ...(data !== null && { data }),
      ...(meta !== null && { meta }),
    });
  }
}
