import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import checkPermission from '../../middlewares/permission.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './location-movement.controller.js';
import * as validation from './location-movement.validation.js';

const router = Router();
router.use(authenticate);
router.post('/', checkPermission('stock_relocation:create', ['WAREHOUSE']), validate(validation.createSchema), controller.create);
router.get('/:id', checkPermission('stock_relocation:read', ['OWNER', 'WAREHOUSE']), validate(validation.detailSchema), controller.detail);
export default router;
