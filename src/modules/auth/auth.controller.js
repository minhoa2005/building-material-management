import { catchAsync } from "../../shared/utils/catchAsync.js";
import { formatApiResponse } from "../../shared/utils/ApiResponse.js";
import * as authService from "./auth.service.js";
import { verifyRefreshToken } from "../../config/jwt.js";
import { setCookie } from "../../config/cookie.js";
import { ApiError } from "../../shared/utils/ApiError.js";

export const login = catchAsync(async (req, res) => {
  const result = await authService.loginUser(
    req.body.username,
    req.body.password,
  );
  setCookie(res, "refresh_token", result.refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }); // Set refresh token in cookie for 7 days
  formatApiResponse(res, {
    message: "Login successful",
    data: { accessToken: result.accessToken, user: result.user },
  });
});

export const getMe = catchAsync(async (req, res) => {
  const result = await authService.getCurrentUser(req.user._id);
  formatApiResponse(res, { data: result });
});

export const refreshToken = catchAsync(async (req, res) => {
  const decoded = verifyRefreshToken(req.cookies.refresh_token);
  if (decoded.success === false) {
    throw new ApiError(401, "Token không hợp lệ hoặc đã hết hạn");
  }
  const result = await authService.refreshToken(decoded.userId);
  formatApiResponse(res, {
    message: "Token refreshed successfully",
    data: result,
  });
});
