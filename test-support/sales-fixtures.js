import mongoose from 'mongoose';
import { buildDemoData } from '../src/seeds/data/demo.data.js';
import { BusinessDocument, DocumentLine, ExternalReference, ExternalReferenceLine, BusinessOperation, OutboxEvent } from '../src/models/index.js';

// Sales tests exercise a full source graph, but do not need to rebuild every
// unrelated stocktake/notification index. Production seeding has its own suite.
export async function seedSalesFixtures() {
  if (!/^sep490_sales_(create|iteration1)_[a-f0-9]{24}$/.test(mongoose.connection.name)) {
    throw new Error('Sales fixtures require an isolated random test database');
  }
  if ((await mongoose.connection.db.listCollections().toArray()).length) throw new Error('Test database must be empty');
  const groups = await buildDemoData();
  await Promise.all(groups.map(async ({ Model, documents }) => {
    if (!documents.length) return;
    for (const document of documents) await document.validate();
    const now = new Date();
    await Model.collection.insertMany(documents.map((document) => ({ createdAt: now, updatedAt: now, ...document.toObject() })));
  }));
  await Promise.all([BusinessDocument, DocumentLine, ExternalReference, ExternalReferenceLine, BusinessOperation, OutboxEvent].map(async (Model) => {
    const indexes = Model.schema.indexes().filter(([, options]) => options.unique).map(([keys, options]) => ({
      key: keys, name: Object.entries(keys).map(([key, direction]) => `${key}_${direction}`).join('_'), ...options,
    }));
    await Model.collection.createIndexes(indexes);
  }));
}
