import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import checkPermission from '../../middlewares/permission.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './location-movement.controller.js';
import * as validation from './location-movement.validation.js';

const router = Router();
router.use(authenticate);
router.post('/', checkPermission('stock_relocation:create', ['WAREHOUSE']), validate(validation.createSchema), controller.create);
router.get('/', checkPermission('stock_relocation:read', ['OWNER', 'WAREHOUSE']), validate(validation.listSchema), controller.list);
router.get('/options', checkPermission('stock_relocation:create', ['WAREHOUSE']), validate(validation.optionsSchema), controller.options);
router.patch('/:id', checkPermission('stock_relocation:create', ['WAREHOUSE']), validate(validation.editSchema), controller.edit);
router.post('/:id/cancel', checkPermission('stock_relocation:create', ['WAREHOUSE']), validate(validation.cancelSchema), controller.cancel);
router.post('/:id/confirm', checkPermission('stock_relocation:confirm', ['WAREHOUSE']), validate(validation.confirmSchema), controller.confirm);
router.get('/:id', checkPermission('stock_relocation:read', ['OWNER', 'WAREHOUSE']), validate(validation.detailSchema), controller.detail);
export default router;
