import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import * as m from "../src/models/index.js";
import {
  createReplenishmentSchema,
  reviewReplenishmentSchema,
} from "../src/modules/replenishments/replenishment.validation.js";
import {
  createProductSchema,
  changeProductStatusSchema,
} from "../src/modules/products/product.validation.js";
import {
  createSupplierSchema,
  changeSupplierStatusSchema,
} from "../src/modules/suppliers/supplier.validation.js";
import { planIteration1Upgrade } from "../src/migrations/iteration-1.js";

const id = () => new mongoose.Types.ObjectId();
const hasIndex = (Model, fields, predicate = () => true) =>
  Model.schema.indexes().some(
    ([keys, options]) =>
      JSON.stringify(keys) === JSON.stringify(fields) && predicate(options),
  );

test("Iteration 1 master models validate dimensions, versioning and contact/status fields", async () => {
  const product = new m.Product({
    sku: "it1-tile",
    name: "Iteration 1 tile",
    baseUomId: id(),
    lengthMm: "600.5",
    widthMm: "600",
    version: 1,
  });
  await product.validate();
  assert.equal(product.sku, "IT1-TILE");
  await assert.rejects(
    new m.Product({
      sku: "BAD-DIM",
      name: "Bad dimensions",
      baseUomId: id(),
      lengthMm: "600",
    }).validate(),
    /widthMm/,
  );
  assert.ok(hasIndex(m.Product, { isActive: 1, createdAt: -1, _id: -1 }));
  const conversion = new m.ProductUomVersion({
    productId: id(),
    uomId: id(),
    version: 1,
    basePerUnit: "4",
    validFrom: new Date(),
    createdBy: id(),
    verificationReference: "Verified packaging reference",
  });
  await conversion.validate();
  assert.ok(
    hasIndex(
      m.ProductUomVersion,
      { productId: 1, uomId: 1, validFrom: -1, version: -1 },
    ),
  );
  await new m.Party({
    code: "ncc-it1",
    kind: "SUPPLIER",
    name: "Supplier",
    phone: "0900000000",
    email: "supplier@example.com",
    cooperationStatus: "ACTIVE",
    isActive: true,
    version: 1,
  }).validate();
  assert.ok(
    hasIndex(m.Party, {
      kind: 1,
      cooperationStatus: 1,
      createdAt: -1,
      _id: -1,
    }),
  );
});

test("lot identity metadata, audit trace and approval reasons are persisted append-only", async () => {
  const lot = new m.Lot({
    productId: id(),
    manufacturerLot: "UNKNOWN",
    tone: "UNKNOWN",
    calibre: "UNKNOWN",
    identificationStatus: "UNKNOWN",
    identityLocked: false,
    version: 1,
  });
  await lot.validate();
  assert.equal(lot.identityLocked, false);
  await assert.rejects(
    new m.Lot({
      productId: id(),
      manufacturerLot: "LOT",
      tone: "T1",
      calibre: "C1",
      identificationStatus: "VERIFIED",
      verifiedBy: id(),
    }).validate(),
    /verifiedAt/,
  );
  assert.ok(
    hasIndex(m.AuditEvent, {
      entityType: 1,
      entityId: 1,
      eventAt: -1,
      _id: -1,
    }),
  );
  const submission = new m.ReplenishmentSubmission({
    documentId: id(),
    documentVersion: 3,
    submittedBy: id(),
    submittedAt: new Date(),
    warehouseId: id(),
    warehouseCodeSnapshot: "WH01",
    warehouseNameSnapshot: "Main",
    neededOn: new Date(),
    triggerReason: "Reason",
    lines: [{
      lineId: id(),
      lineNo: 1,
      productId: id(),
      productSkuSnapshot: "SKU",
      productNameSnapshot: "Product",
      baseUomId: id(),
      baseUomCodeSnapshot: "PIECE",
      enteredUomId: id(),
      enteredUomCodeSnapshot: "BOX",
      conversionId: id(),
      conversionVersion: 1,
      enteredQty: "1",
      conversionSnapshot: "4",
      qtyBase: "4",
      triggerType: "MANUAL_OTHER",
      reasonNote: "Reserve",
    }],
  });
  await submission.validate();
  assert.ok(
    hasIndex(
      m.ReplenishmentSubmission,
      { documentId: 1, documentVersion: 1 },
      (options) => options.unique,
    ),
  );
  assert.ok(
    hasIndex(m.Approval, {
      documentId: 1,
      documentVersion: 1,
      decisionKind: 1,
    }, (options) => options.unique),
  );
  assert.equal(
    m.ReplenishmentSubmission.schema.path("lines").schema.path("lineId")
      .options.ref,
    "DocumentLine",
  );
  await assert.rejects(
    m.ReplenishmentSubmission.findOneAndUpdate(
      {},
      { $set: { documentVersion: 4 } },
    ).exec(),
    /append-only/,
  );
});

test("RR creation and review contracts reject client quantities, actor fields and extra lines", () => {
  const body = {
    action: "SAVE_DRAFT",
    creationKey: "key-1",
    warehouseId: String(id()),
    neededOn: "2026-12-01",
    triggerReason: "Reason",
    note: "Note",
    lines: [{
      productId: String(id()),
      conversionId: String(id()),
      enteredQty: "10.5",
      reasonNote: "Need stock",
    }],
  };
  const parsed = createReplenishmentSchema.parse({
    body,
    query: {},
    params: {},
  });
  assert.equal(parsed.body.lines[0].enteredQty, "10.5");
  for (const mutation of [
    { ...body, qtyBase: "10" },
    { ...body, lines: [{ ...body.lines[0], enteredQty: 10 }] },
    { ...body, lines: [{ ...body.lines[0], qtyBase: "10" }] },
    { ...body, createdBy: String(id()) },
  ]) {
    assert.throws(() =>
      createReplenishmentSchema.parse({ body: mutation, query: {}, params: {} }),
    );
  }
  assert.throws(() =>
    reviewReplenishmentSchema.parse({
      body: {
        expectedVersion: 2,
        operationKey: "review",
        decision: "APPROVE",
        lines: [{ lineId: String(id()), approvedQtyBase: -1 }],
      },
      query: {},
      params: { id: String(id()) },
    }),
  );
});

test("product and supplier contracts own codes, status and server-managed fields", () => {
  const productBody = {
    sku: " it1-contract ",
    name: "Contract product",
    baseUomId: String(id()),
    wholeBaseUnits: true,
    lengthMm: "600",
    widthMm: "600",
  };
  const parsed = createProductSchema.parse({
    body: productBody,
    query: {},
    params: {},
  });
  assert.equal(parsed.body.sku, "IT1-CONTRACT");
  for (const mutation of [
    { ...productBody, isActive: false },
    { ...productBody, version: 2 },
    { ...productBody, basePerUnit: "1" },
    { ...productBody, lengthMm: undefined },
  ]) {
    assert.throws(() =>
      createProductSchema.parse({ body: mutation, query: {}, params: {} }),
    );
  }
  assert.throws(() =>
    changeProductStatusSchema.parse({
      body: { expectedVersion: 1, isActive: false },
      query: {},
      params: { id: String(id()) },
    }),
  );
  const supplierBody = {
    code: " ncc-it1 ",
    name: "Supplier",
    taxCode: "",
    email: "supplier@example.com",
  };
  const supplier = createSupplierSchema.parse({
    body: supplierBody,
    query: {},
    params: {},
  });
  assert.equal(supplier.body.code, "NCC-IT1");
  assert.equal(supplier.body.taxCode, null);
  for (const mutation of [
    { ...supplierBody, kind: "CUSTOMER" },
    { ...supplierBody, cooperationStatus: "TERMINATED" },
    { ...supplierBody, isActive: false },
    { ...supplierBody, email: "not-an-email" },
  ]) {
    assert.throws(() =>
      createSupplierSchema.parse({ body: mutation, query: {}, params: {} }),
    );
  }
  assert.throws(() =>
    changeSupplierStatusSchema.parse({
      body: {
        expectedVersion: 1,
        cooperationStatus: "TERMINATED",
        reason: " ",
      },
      query: {},
      params: { id: String(id()) },
    }),
  );
});

test("Iteration 1 migration is dry-run, maps legacy supplier state and locks referenced lots", async () => {
  const productId = id();
  const supplierId = id();
  const lotId = id();
  const records = {
    products: [{ _id: productId, sku: "SKU", name: "Product" }],
    parties: [{
      _id: supplierId,
      code: "NCC",
      kind: "SUPPLIER",
      isActive: false,
    }],
    lots: [{
      _id: lotId,
      productId,
      manufacturerLot: "L",
      tone: "T",
      calibre: "C",
      identificationStatus: "VERIFIED",
    }],
    document_lines: [{ _id: id(), lotId }],
    stock_balances: [{ _id: id(), lotId }],
  };
  const db = {
    collection(name) {
      return {
        find() {
          return { async toArray() { return records[name] ?? []; } };
        },
        async distinct() {
          return ["document_lines", "stock_balances"].includes(name)
            ? [lotId]
            : [];
        },
      };
    },
  };
  const before = JSON.stringify(records);
  const plan = await planIteration1Upgrade(db);
  assert.equal(JSON.stringify(records), before);
  assert.deepEqual(
    plan.changes.find(({ collection }) => collection === "parties").set,
    { version: 1, cooperationStatus: "SUSPENDED" },
  );
  assert.equal(
    plan.changes.find(({ collection }) => collection === "lots").set
      .identityLocked,
    true,
  );
  assert.ok(plan.indexes.length > 0);
  records.products.push({ _id: id(), sku: " sku ", name: "Duplicate" });
  await assert.rejects(planIteration1Upgrade(db), /Duplicate normalized/);
});