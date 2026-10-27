import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Role, StockMovement, BusinessDocument, DOCUMENT_KINDS } from '../src/models/index.js';
import { runSeeds } from '../src/seeds/index.js';

// Never use the database named in the URI. Only drop our own random test DB.
async function temporaryDatabase(action) {
  const dbName = `sep490_seed_verification_${new mongoose.Types.ObjectId()}`;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName, autoIndex: false, serverSelectionTimeoutMS: 5000 });
    await action(mongoose.connection.db);
  } finally {
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

test('atomic full seed against a MongoDB replica set', { skip: !process.env.MONGODB_TEST_URI }, async (t) => {
  await t.test('empty DB gets all collections/kinds and a second run preserves existing data', async () => temporaryDatabase(async (db) => {
    const result = await runSeeds();
    assert.equal(result.seeded, true);
    assert.equal(Object.keys(result.counts).length, 37);
    assert.deepEqual(new Set(await BusinessDocument.distinct('documentKind')), new Set(DOCUMENT_KINDS));
    const before = await StockMovement.countDocuments();
    const owner = await Role.findOne({ code: 'OWNER' });
    owner.permissionIds = [];
    await owner.save();
    assert.deepEqual(await runSeeds(), { seeded: false, reason: 'DATABASE_NOT_EMPTY' });
    assert.equal(await StockMovement.countDocuments(), before);
    assert.equal((await Role.findById(owner._id)).permissionIds.length, 0);
    for (const [name, count] of Object.entries(result.counts)) {
      assert.equal(await mongoose.model(name).countDocuments(), count, name);
    }
    assert.equal((await db.listCollections({}, { nameOnly: true }).toArray()).filter(({ name }) => !name.startsWith('system.')).length, 37);
  }));
  await t.test('an unrelated existing document blocks every seed insert', async () => temporaryDatabase(async (db) => {
    await db.collection('legacy_records').insertOne({ sentinel: true });
    assert.equal((await runSeeds()).seeded, false);
    assert.equal(await BusinessDocument.countDocuments(), 0);
    assert.equal(await db.collection('legacy_records').countDocuments(), 1);
  }));
  await t.test('data arriving during fixture preparation is detected before inserts', async (child) => temporaryDatabase(async (db) => {
    const startSession = mongoose.startSession.bind(mongoose);
    child.mock.method(mongoose, 'startSession', async () => {
      await db.collection('users').insertOne({ username: 'existing-account', sentinel: true });
      return startSession();
    });
    assert.deepEqual(await runSeeds(), { seeded: false, reason: 'DATABASE_NOT_EMPTY' });
    assert.equal(await BusinessDocument.countDocuments(), 0);
    assert.equal(await db.collection('users').countDocuments(), 1);
  }));
  await t.test('concurrent seed runs commit exactly one complete dataset', async () => temporaryDatabase(async () => {
    const results = await Promise.all([runSeeds(), runSeeds()]);
    assert.equal(results.filter(({ seeded }) => seeded).length, 1);
    const result = results.find(({ seeded }) => seeded);
    for (const [name, count] of Object.entries(result.counts)) {
      assert.equal(await mongoose.model(name).countDocuments(), count, name);
    }
  }));
  await t.test('failure rolls back all fixture inserts', async (child) => temporaryDatabase(async (db) => {
    child.mock.method(Role, 'insertMany', async () => { throw new Error('Simulated insert failure'); });
    await assert.rejects(runSeeds(), /Simulated insert failure/);
    for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
      if (!name.startsWith('system.')) assert.equal(await db.collection(name).countDocuments(), 0, name);
    }
  }));
});
