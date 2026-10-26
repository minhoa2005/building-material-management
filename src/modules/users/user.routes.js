import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import checkPermission from '../../middlewares/permission.js';
import * as userController from './user.controller.js';
import * as userValidation from './user.validation.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'OWNER']));

// UC-95..97: chỉ vai trò có quyền user:* (mặc định là ADMIN) mới thao tác được.
router.get('/', checkPermission('user:read'), validate(userValidation.listUsersSchema), userController.listUsers);
router.post('/', checkPermission('user:create'), validate(userValidation.createUserSchema), userController.createUser);
router.get('/:id', checkPermission('user:read'), userController.getUserById);
router.put('/:id', checkPermission('user:update'), validate(userValidation.updateUserSchema), userController.updateUser);
router.patch('/:id/status', checkPermission('user:update'), validate(userValidation.toggleStatusSchema), userController.toggleUserStatus);

export default router;
