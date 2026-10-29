import { cloudinary } from '../../config/cloudinary.js';
import { ApiError } from '../../shared/utils/ApiError.js';

export const uploadImageBuffer = (buffer, folder = 'sep490/products', type = 'upload') => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject(new ApiError(400, 'No file buffer provided'));
    }
    if (type === 'authenticated') {
      const image = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        || (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255)
        || buffer.subarray(0, 6).toString().startsWith('GIF8')
        || (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP');
      if (!image) return reject(new ApiError(400, 'Evidence must be a PNG, JPEG, GIF or WebP image'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        type,
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
