import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  applyIteration1Upgrade,
  planIteration1Upgrade,
} from "../src/migrations/iteration-1.js";

const id = () => new mongoose.Types.ObjectId();

test("Iteration 1 migration dry-run/apply is backed up, transactional and idempotent", {
  skip: !process.env.MONGODB_TEST_URI,
  timeout: 120_000,
}, async () => {
  const dbName = `sep490_iteration1_migration_${id()}`;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, {
      dbName,
      autoIndex: false,
      autoCreate: false,
      serverSelectionTimeoutMS: 5000,
    });
    const connection = mongoose.connection;
    const productId = id();
    const supplierId = id();
    const lotId = id();
    await connection.db.collection("products").insertOne({
      _id: productId,
      sku: "LEGACY-SKU",
      name: "Legacy product",
    });
    await connection.db.collection("parties").insertOne({
      _id: supplierId,
      code: "legacy-supplier",
      name: "Legacy supplier",
      kind: "SUPPLIER",
      isActive: false,
    });
    await connection.db.collection("lots").insertOne({
      _id: lotId,
      productId,
      manufacturerLot: "LEGACY-LOT",
      tone: "T",
      calibre: "C",
      identificationStatus: "VERIFIED",
    });
    await connection.db.collection("document_lines").insertOne({
      _id: id(),
      lotId,
      documentId: id(),
      lineNo: 1,
      productId,
    });
    await connection.db.collection("stock_balances").insertOne({
      _id: id(),
      lotId,
      accountId: id(),
      qualityCode: "GOOD",
      ownerPartyId: id(),
      qtyBase: mongoose.Types.Decimal128.fromString("0"),
    });
    const before = mongoose.mongo.BSON.EJSON.stringify({
      product: await connection.db.collection("products").findOne({ _id: productId }),
      supplier: await connection.db.collection("parties").findOne({ _id: supplierId }),
      lot: await connection.db.collection("lots").findOne({ _id: lotId }),
    }, { relaxed: false });
    await planIteration1Upgrade(connection.db);
    const afterPreview = mongoose.mongo.BSON.EJSON.stringify({
      product: await connection.db.collection("products").findOne({ _id: productId }),
      supplier: await connection.db.collection("parties").findOne({ _id: supplierId }),
      lot: await connection.db.collection("lots").findOne({ _id: lotId }),
    }, { relaxed: false });
    assert.equal(afterPreview, before, "dry run must not write");

    let backups = 0;
    const summary = await applyIteration1Upgrade(connection, {
      backup: async () => { backups += 1; },
    });
    assert.equal(backups, 1);
    assert.deepEqual(summary.updatedRecords, {
      products: 1,
      parties: 1,
      lots: 1,
    });
    const product = await connection.db.collection("products").findOne({ _id: productId });
    const supplier = await connection.db.collection("parties").findOne({ _id: supplierId });
    const lot = await connection.db.collection("lots").findOne({ _id: lotId });
    assert.equal(product.version, 1);
    assert.equal(supplier.version, 1);
    assert.equal(supplier.cooperationStatus, "SUSPENDED");
    assert.equal(lot.version, 1);
    assert.equal(lot.identityLocked, true);
    assert.equal(lot.verifiedBy, undefined);
    assert.equal(lot.verifiedAt, undefined);
    assert.equal(await connection.db.collection("replenishment_submissions").countDocuments(), 0);
    assert.equal(await connection.db.collection("stock_movements").countDocuments(), 0);
    assert.equal(
      (await connection.db.collection("lots").indexes()).some((index) =>
        JSON.stringify(index.key) === JSON.stringify({ productId: 1, identificationStatus: 1, createdAt: -1, _id: -1 })
      ),
      true,
    );

    const second = await applyIteration1Upgrade(connection, {
      backup: async () => { backups += 1; },
    });
    assert.deepEqual(second.updatedRecords, {});
    assert.equal(backups, 2);
    await assert.rejects(
      applyIteration1Upgrade(connection),
      /backup is required/,
    );

    await connection.db.collection("products").insertOne({
      _id: id(),
      sku: " legacy-sku ",
      name: "Conflicting product",
    });
    await assert.rejects(planIteration1Upgrade(connection.db), /Duplicate normalized/);
    await assert.rejects(
      applyIteration1Upgrade(connection, { backup: async () => { backups += 1; } }),
      /Duplicate normalized/,
    );
    assert.equal(backups, 2, "duplicate conflict must fail before backup/write");
  } finally {
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  }
});