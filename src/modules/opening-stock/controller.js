import { respondWithData } from '../../shared/utils/catchAsync.js';
import { validationError } from '../../shared/utils/ApiError.js';
import { databaseId } from '../../models/document-identity.js';
import { previewBody, createBody, actionBody } from './validation.js';
import * as service from './service.js';

const parseBody = (schema, value) => {
  const result = schema.safeParse(value);
  if (!result.success) throw validationError(result.error.issues[0].message);
  return result.data;
};

export const options = respondWithData(req => service.options(req.user));
export const list = respondWithData(req => service.list(req.user));
export const get = respondWithData(req => service.get(req.user, databaseId(req.validated.params.id)));
export const preview = respondWithData(req => service.preview(req.user, parseBody(previewBody, req.body)));
export const create = respondWithData(req => service.create(req.user, parseBody(createBody, req.body)));
export const post = respondWithData(req =>
  service.act(req.user, databaseId(req.validated.params.id), 'post', parseBody(actionBody, req.body)));
export const cancel = respondWithData(req =>
  service.act(req.user, databaseId(req.validated.params.id), 'cancel', parseBody(actionBody, req.body)));
export const close = respondWithData(req =>
  service.closeWarehouse(req.user, req.validated.params.warehouseId, req.validated.body));
