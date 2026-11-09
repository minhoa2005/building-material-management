import { Role,Warehouse } from '../../models/runtime.js';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { formatApiResponse } from '../../shared/utils/ApiResponse.js';
import { dto } from '../../shared/utils/persistence.js';
import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import checkPermission from '../../middlewares/permission.js';
import * as userController from './user.controller.js';
import * as userValidation from './user.validation.js';

const router = Router();

router.use(authenticate);

// UC-95..97: chỉ vai trò có quyền user:* (mặc định là ADMIN) mới thao tác được.
router.get('/', checkPermission('user:read'), validate(userValidation.listUsersSchema), userController.listUsers);
router.post('/', checkPermission('user:create'), validate(userValidation.createUserSchema), userController.createUser);
router.get('/options',checkPermission('user:read'),catchAsync(async(req,res)=>{const [roles,warehouses]=await Promise.all([Role.find({isActive:{$ne:false}}).select('code name').lean(),Warehouse.find({isActive:{$ne:false}}).select('code name').lean()]);formatApiResponse(res,{data:{roles:roles.map(r => ({ ...dto(r), name: r.name || { ADMIN: 'Quản trị viên', OWNER: 'Chủ cửa hàng', SALES: 'Nhân viên Bán hàng', WAREHOUSE: 'Thủ kho & Điều phối', ACCOUNTANT: 'Kế toán công nợ' }[r.code] || r.code })),warehouses:warehouses.map(dto)}});}));
router.get('/:id', checkPermission('user:read'), userController.getUserById);
router.put('/:id', checkPermission('user:update'), validate(userValidation.updateUserSchema), userController.updateUser);
router.patch('/:id/status', checkPermission('user:update'), validate(userValidation.toggleStatusSchema), userController.toggleUserStatus);

export default router;

