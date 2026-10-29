import { ApiError } from '../shared/utils/ApiError.js';

export const validate = (schema) => (req, _res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) Object.assign(req.query, parsed.query);
    if (parsed.params) Object.assign(req.params, parsed.params);
    next();
  } catch (error) {
    const message = error.issues
      ? error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
      : error.message;
    next(new ApiError(400, message));
  }
};
