import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import checkPermission from '../../middlewares/permission.js';
import { validate } from '../../middlewares/validate.js';
import * as controller from './controller.js';
import * as validation from './validation.js';

const router = Router();
router.use(authenticate);

router.get('/options', checkPermission('opening_stock:read'), controller.options);
router.get('/', checkPermission('opening_stock:read'), controller.list);
router.post('/preview', checkPermission('opening_stock:create'), controller.preview);
router.post('/', checkPermission('opening_stock:create'), controller.create);
router.post('/warehouses/:warehouseId/close', checkPermission('opening_stock:post'), validate(validation.warehouseParamsSchema), controller.close);
router.get('/:id', checkPermission('opening_stock:read'), validate(validation.getOpeningStockSchema), controller.get);
router.post('/:id/post', checkPermission('opening_stock:post'), validate(validation.openingIdParamsSchema), controller.post);
router.post('/:id/cancel', checkPermission('opening_stock:create'), validate(validation.openingIdParamsSchema), controller.cancel);

export default router;
