import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { uploadSourceEvidence } from '../src/modules/sales-orders/sales-create.service.js';
import { cloudinary } from '../src/config/cloudinary.js';

test('Cloudinary stores source image privately and allows signed retrieval', {
  skip: process.env.LIVE_SALES_EVIDENCE_TEST !== 'true', timeout: 60000,
}, async () => {
  let key;
  try {
    const user = { _id: new mongoose.Types.ObjectId(), isActive: true,
      roleId: { code: 'SALES', permissionIds: [{ code: 'sales_order:create' }] } };
    const result = await uploadSourceEvidence(user, { buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY9sAAAAASUVORK5CYII=', 'base64') });
    const receipt = jwt.verify(result.receipt, process.env.JWT_SECRET || 'wmsd_default_super_secret_jwt_key_2026',
      { algorithms: ['HS256'], audience: 'sales-source-evidence' });
    key = receipt.objectKey;
    assert.equal(receipt.actorId, String(user._id));
    const url = cloudinary.utils.private_download_url(key, 'png', { type: 'authenticated', resource_type: 'image', expires_at: Math.floor(Date.now() / 1000) + 60 });
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200);
    assert.ok((await response.arrayBuffer()).byteLength > 0);
    const publicUrl = cloudinary.url(key, { type: 'authenticated', secure: true, format: 'png' });
    const denied = await fetch(publicUrl, { signal: AbortSignal.timeout(20000) });
    assert.ok([401, 403, 404].includes(denied.status));
  } finally {
    if (key) {
      const removed = await cloudinary.uploader.destroy(key, { type: 'authenticated', resource_type: 'image', invalidate: true });
      assert.equal(removed.result, 'ok');
    }
  }
});
