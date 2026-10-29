import { cloudinary } from '../../config/cloudinary.js';
import { ApiError } from '../../shared/utils/ApiError.js';

export const uploadImageBuffer = (buffer, folder = 'sep490/products') => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new ApiError(400, 'No file buffer provided'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(new ApiError(500, `Cloudinary upload failed: ${error.message}`));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
        });
      }
    );

    uploadStream.end(buffer);
  });
};
