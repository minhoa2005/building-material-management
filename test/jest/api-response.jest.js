import { formatApiResponse } from '../../src/shared/utils/ApiResponse.js';

test('formats a successful API response with the default status', () => {
  const response = {
    status: (statusCode) => ({ json: (body) => ({ statusCode, body }) }),
  };

  expect(formatApiResponse(response, { data: [] })).toEqual({
    statusCode: 200,
    body: { success: true, message: 'Success', data: [] },
  });
});
