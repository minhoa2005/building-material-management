import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadImageBuffer } from '../src/modules/upload/upload.service.js';
import { cloudinary } from '../src/config/cloudinary.js';
test('return evidence rejects false images and stores private, retrievable evidence', { skip: process.env.LIVE_RETURN_EVIDENCE_TEST !== 'true', timeout: 60000 }, async () => {
  await assert.rejects(uploadImageBuffer(Buffer.from('not an image'), 'sep490/return-verification', 'authenticated'), (e) => e.statusCode === 400);
  let objectKey;
  try {
    const result = await uploadImageBuffer(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY9sAAAAASUVORK5CYII=', 'base64'), 'sep490/return-verification', 'authenticated');
    objectKey = result.publicId;
    const signed = cloudinary.utils.private_download_url(objectKey, result.format, { type: 'authenticated', resource_type: 'image', expires_at: Math.floor(Date.now() / 1000) + 60 });
    const response = await fetch(signed, { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200);
    assert.ok((await response.arrayBuffer()).byteLength);
    const unsigned = await fetch(cloudinary.url(objectKey, { type: 'authenticated', secure: true, format: result.format }), { signal: AbortSignal.timeout(20000) });
    assert.ok([401, 403, 404].includes(unsigned.status));
  } finally {
    if (objectKey) assert.equal((await cloudinary.uploader.destroy(objectKey, { type: 'authenticated', resource_type: 'image', invalidate: true })).result, 'ok');
  }
});
