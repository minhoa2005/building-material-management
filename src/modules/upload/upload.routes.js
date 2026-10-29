import { Router } from 'express';
import { uploadSingleImage } from '../../middlewares/upload.js';
import { uploadImage } from './upload.controller.js';

const router = Router();

router.post('/', uploadSingleImage, uploadImage);

export default router;
