import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { PNG } from 'pngjs';
import { PDFDocument } from 'pdf-lib';
import { cloudinary } from '../src/config/cloudinary.js';
import { evidenceStorage } from '../src/modules/po-receiving/purchase-evidence.service.js';

test('purchase PNG and PDF remain private on real storage; signed retrieval and cleanup work', {
  skip: process.env.LIVE_PURCHASE_EVIDENCE_TEST !== 'true', timeout: 90000,
}, async () => {
  const png = PNG.sync.write(new PNG({ width: 1, height: 1 }));
  const pdf = await PDFDocument.create(); pdf.addPage();
  for (const [resourceType, format, bytes] of [['image','png',png], ['raw','pdf',Buffer.from(await pdf.save())]]) {
    const key = 'sep490/purchase-evidence/test-' + new mongoose.Types.ObjectId() + (resourceType === 'raw' ? '.pdf' : '');
    try {
      const result = await evidenceStorage.upload(bytes, { public_id: key, resource_type: resourceType, type: 'authenticated', overwrite: false });
      assert.equal(result.public_id, key); assert.equal(result.type, 'authenticated');
      await evidenceStorage.exists(key, resourceType);
      const signed = evidenceStorage.download(key, format, resourceType, Math.floor(Date.now() / 1000) + 60);
      const response = await fetch(signed, { signal: AbortSignal.timeout(20000) });
      assert.equal(response.status, 200, resourceType + ' signed download status');
      assert.ok((await response.arrayBuffer()).byteLength > 0);
      const publicUrl = cloudinary.url(key, { type: 'authenticated', resource_type: resourceType, secure: true, ...(resourceType === 'image' && { format }) });
      const denied = await fetch(publicUrl, { signal: AbortSignal.timeout(20000) });
      assert.ok([401,403,404].includes(denied.status), 'unsigned delivery must be denied');
    } finally {
      const result = await evidenceStorage.destroy(key, resourceType);
      assert.ok(['ok','not found'].includes(result.result));
    }
  }
});
