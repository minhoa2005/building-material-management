import { ApiResponse } from '../../shared/utils/ApiResponse.js';

export const checkHealth = (_req, res) => {
  ApiResponse.success(res, { message: 'Service is healthy', data: { status: 'ok' } });
};
