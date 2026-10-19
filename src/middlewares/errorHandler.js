import { ApiError } from '../shared/utils/ApiError.js';

export const errorHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal server error';
    error = new ApiError(statusCode, message);
    error.stack = err.stack;
  }

  const { statusCode, message } = error;
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  if (statusCode >= 500) {
    console.error(err);
  }

  return res.status(statusCode).json(response);
};
