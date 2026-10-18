import { catchAsync } from '../../shared/utils/catchAsync.js';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import * as uploadService from './upload.service.js';

export const uploadImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload an image file (field: "file")');
  }

  const result = await uploadService.uploadImageBuffer(
    req.file.buffer,
    req.body.folder || 'sep490/uploads'
  );

  ApiResponse.success(res, {
    statusCode: 201,
    message: 'Image uploaded successfully',
    data: result,
  });
});
