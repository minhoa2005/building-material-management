import test from 'node:test';
import assert from 'node:assert/strict';
import { prepare } from '../src/modules/po-receiving/po-receiving.service.js';

for (const qualityCode of ['DAMAGED', 'PENDING', 'BLOCKED']) {
  for (const ownershipDecision of ['ACCEPT', 'REJECT']) {
    test(`${qualityCode} must enter supplier custody instead of ${ownershipDecision}`, async () => {
      await assert.rejects(prepare({}, { lines: [{ qualityCode, ownershipDecision }] }, {}, null, {}, {}), /phải tạm giữ/);
    });
  }
}
