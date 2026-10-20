import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import * as userController from './user.controller.js';
import * as userValidation from './user.validation.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'OWNER']));

router.get('/', validate(userValidation.listUsersSchema), userController.listUsers);
router.post('/', validate(userValidation.createUserSchema), userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', validate(userValidation.updateUserSchema), userController.updateUser);
router.patch('/:id/status', validate(userValidation.toggleStatusSchema), userController.toggleUserStatus);

export default router;
