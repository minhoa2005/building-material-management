import test from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';
import { PDFDocument } from 'pdf-lib';
import { inspectFile } from '../src/modules/po-receiving/purchase-evidence.service.js';

test('evidence decodes actual PNG/JPEG/PDF bytes and ignores claimed MIME', async () => {
  const png = PNG.sync.write(new PNG({ width: 1, height: 1 }));
  assert.equal((await inspectFile({ buffer: png, mimetype: 'text/plain' })).mediaType, 'image/png');
  const jpg = jpeg.encode({ width: 1, height: 1, data: Buffer.from([0,0,0,255]) }).data;
  assert.equal((await inspectFile({ buffer: jpg })).mediaType, 'image/jpeg');
  const pdf = await PDFDocument.create(); pdf.addPage();
  assert.equal((await inspectFile({ buffer: Buffer.from(await pdf.save()) })).mediaType, 'application/pdf');
});
test('truncated signatures, malformed PDFs, empty, oversized and huge images are rejected', async () => {
  for (const buffer of [Buffer.alloc(0), Buffer.from('%PDF-1.7\nnot a document\n%%EOF'), Buffer.from([255,216,255,217]), Buffer.from([137,80,78,71,13,10,26,10])]) {
    await assert.rejects(inspectFile({ buffer }), e => e.statusCode === 400);
  }
  await assert.rejects(inspectFile({ buffer: Buffer.alloc(5 * 1024 * 1024 + 1) }), e => e.statusCode === 413);
  const huge = PNG.sync.write(new PNG({ width: 1, height: 1 })); huge.writeUInt32BE(1000000, 16);
  await assert.rejects(inspectFile({ buffer: huge }), e => e.statusCode === 400);
});
