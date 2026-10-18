import { User } from './user.model.js';
import { ApiError } from '../../shared/utils/ApiError.js';

export const loginUser = async (_username, _password) => {
  // Skeleton implementation: verify credentials and return token & user profile
  throw new ApiError(501, 'Authentication logic is under development');
};
