import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import * as legacy from '../src/models/legacy/index.js';
import { registerReviewedModels } from '../src/models/index.js';
import { BusinessDocument as historicalDocument } from '../src/models/rebuild/historical/business-document.model.js';
import { buildHistoricalSource } from '../src/seeds/rebuild/historical-source.js';

test('merged API routes import successfully against the compatibility registry', async () => {
  const { default: app } = await import('../src/app.js');
  assert.equal(typeof app.listen, 'function');
  for (const name of ['PurchaseEvent', 'PurchaseSourceClaim', 'ReceiptPlacement', 'PurchaseEvidenceUpload', 'ReplenishmentSubmission']) {
    assert.ok(legacy[name]?.modelName, name);
  }
  assert.equal(Object.values(legacy).filter(value => value?.modelName).length, 44);
});

test('reviewed products and historical migration schemas never replace runtime models', async () => {
  const connection = mongoose.createConnection();
  try {
    const models = registerReviewedModels(connection);
    assert.equal(models.size, 59);
    assert.ok(models.get('products').schema.path('categoryId').isRequired);
    assert.ok(legacy.Product.schema.path('baseUomId'));
    assert.notEqual(models.get('products').db, legacy.Product.db);
    assert.notEqual(historicalDocument.db, legacy.BusinessDocument.db);
    assert.ok(historicalDocument.discriminators.BusinessDocument_ARRIVAL);
    assert.ok(legacy.BusinessDocument.discriminators.BusinessDocument_PO_INSPECTION);
  } finally { await connection.close(); }
});

test('historical sample data is isolated and retains the approved arrival chain', () => {
  const first = buildHistoricalSource();
  assert.ok(first.business_documents.some(row => row.documentKind === 'ARRIVAL'));
  assert.equal(Object.hasOwn(first, 'purchase_events'), false);
  first.business_documents.length = 0;
  assert.ok(buildHistoricalSource().business_documents.length > 0);
});
