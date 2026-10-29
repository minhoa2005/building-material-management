import { formatApiResponse } from '../../shared/utils/ApiResponse.js';

export const checkHealth = (_req, res) => {
  formatApiResponse(res, { message: 'Service is healthy', data: { status: 'ok' } });
};
