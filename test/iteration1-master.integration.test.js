import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import * as models from "../src/models/index.js";
import { buildDemoData } from "../src/seeds/data/demo.data.js";
import { saigonDateOnly } from "../src/shared/utils/domain.js";

const id = () => new mongoose.Types.ObjectId();
const str = (value) => String(value);
const futureDay = () =>
  saigonDateOnly(new Date(Date.now() + 10 * 86_400_000));

test("Iteration 1 master APIs enforce permissions, versions, history and scopes", {
  skip: !process.env.MONGODB_TEST_URI,
  timeout: 300_000,
}, async (t) => {
  const dbName = `sep490_iteration1_master_${id()}`;
  let server;
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, {
      dbName,
      autoIndex: false,
      serverSelectionTimeoutMS: 5000,
    });
    for (const Model of Object.values(models).filter((value) => value?.modelName)) {
      await Model.createIndexes();
    }
    const demo = await buildDemoData();
    for (const { Model, documents } of demo) {
      if (documents.length) await Model.insertMany(documents);
    }
    const users = await models.User.find().lean();
    const user = (username) => users.find((item) => item.username === username);
    const owner = user("owner@ceratile.vn");
    const sales = user("sales@ceratile.vn");
    const accountant = user("accountant@ceratile.vn");
    const warehouse = user("warehouse@ceratile.vn");
    const admin = user("admin@ceratile.vn");
    const warehouses = await models.Warehouse.find().lean();
    const wh = (code) => warehouses.find((item) => item.code === code);
    const piece = await models.Uom.findOne({ code: "PIECE" }).lean();
    const box = await models.Uom.findOne({ code: "BOX" }).lean();
    const demoProduct = await models.Product.findOne({ sku: "GACH-DEMO-1" }).lean();
    const supplier = await models.Party.findOne({ kind: "SUPPLIER" }).lean();
    const store = await models.Party.findOne({ kind: "STORE" }).lean();

    process.env.JWT_SECRET = "iteration1-master-integration-only";
    const { default: app } = await import("../src/app.js");
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const token = (account) => jwt.sign({ userId: str(account._id) }, process.env.JWT_SECRET);
    async function api(method, path, account, body) {
      const headers = account ? { Authorization: `Bearer ${token(account)}` } : {};
      if (body !== undefined) headers["Content-Type"] = "application/json";
      const response = await fetch(`${base}${path}`, {
        method,
        headers,
        ...(body !== undefined && { body: JSON.stringify(body) }),
      });
      return { status: response.status, body: await response.json() };
    }
    async function ok(method, path, account, body, expected = 200) {
      const result = await api(method, path, account, body);
      assert.equal(result.status, expected, JSON.stringify(result.body));
      return result.body.data;
    }

    let createdProduct;
    await t.test("authentication and admin business-permission separation remain enforced", async () => {
      assert.equal((await api("GET", "/products")).status, 401);
      assert.equal((await api("GET", "/products", admin)).status, 403);
      const salesList = await ok("GET", "/products?limit=5", sales);
      assert.ok(Array.isArray(salesList.items));
      const oversized = await api("POST", "/products", owner, {
        sku: "TOO-LARGE",
        name: "Too large",
        baseUomId: str(piece._id),
        description: "x".repeat(1024 * 1024 + 32),
      });
      assert.equal(oversized.status, 413);
      assert.equal(oversized.body.code, "ERR-CORE-413-001");
    });

    await t.test("UC-17/18/19/20 read, create and update products with optimistic versions", async () => {
      const result = await api("POST", "/products", owner, {
        sku: " it1-product ",
        name: "Iteration 1 product",
        baseUomId: str(piece._id),
        wholeBaseUnits: true,
        nominalSize: "600x600",
        category: "Tile",
        brand: "Demo",
        material: "Ceramic",
        surface: "Gloss",
        lengthMm: "600",
        widthMm: "600",
        thicknessMm: "9.5",
        origin: "Việt Nam",
        description: "Created for UC-19",
      });
      assert.equal(result.status, 201, JSON.stringify(result.body));
      createdProduct = result.body.data;
      assert.equal(createdProduct.sku, "IT1-PRODUCT");
      assert.equal(createdProduct.version, 1);
      assert.equal(createdProduct.currentConversions.length, 1);
      assert.equal(createdProduct.currentConversions[0].basePerUnit, "1");
      assert.equal(createdProduct.currentConversions[0].createdBy, str(owner._id));

      assert.equal((await api("POST", "/products", sales, {
        sku: "NO-ACCESS",
        name: "Nope",
        baseUomId: str(piece._id),
      })).status, 403);
      const duplicate = await api("POST", "/products", owner, {
        sku: "It1-Product",
        name: "Duplicate",
        baseUomId: str(piece._id),
      });
      assert.equal(duplicate.status, 409);
      assert.equal(duplicate.body.code, "ERR-CORE-409-002");
      assert.equal((await api("POST", "/products", owner, {
        sku: "BAD-DIM",
        name: "Bad dimensions",
        baseUomId: str(piece._id),
        lengthMm: "600",
      })).status, 400);

      const snapshotDocument = await models.BusinessDocument.create({
        documentNo: "IT1-SNAPSHOT-RR",
        documentKind: "REPLENISHMENT",
        workflowStatus: "DRAFT",
        createdBy: sales._id,
        header: {
          warehouseId: wh("WH01")._id,
          neededOn: new Date(`${futureDay()}T00:00:00+07:00`),
          triggerReason: "Snapshot guard",
          creationKey: "it1:snapshot",
        },
      });
      const snapshotLine = await models.DocumentLine.create({
        documentId: snapshotDocument._id,
        lineNo: 1,
        lineKind: "REPLENISHMENT",
        productId: createdProduct.id,
        conversionId: createdProduct.currentConversions[0].id,
        enteredQty: "1",
        conversionSnapshot: "1",
        qtyBase: "1",
        productNameSnapshot: "Original product name",
        details: { triggerType: "MANUAL_OTHER", reasonNote: "Snapshot check" },
      });
      const updated = await ok("PUT", `/products/${createdProduct.id}`, owner, {
        expectedVersion: 1,
        name: "Updated product name",
        nominalSize: "600x600",
        brand: "Demo",
        lengthMm: "600.5",
        widthMm: "600.5",
      });
      assert.equal(updated.version, 2);
      assert.equal(updated.category, null);
      assert.equal(updated.lengthMm, "600.5");
      const untouched = await models.DocumentLine.findById(snapshotLine._id).lean();
      assert.equal(untouched.productNameSnapshot, "Original product name");
      const stale = await api("PUT", `/products/${createdProduct.id}`, owner, {
        expectedVersion: 1,
        name: "Stale",
      });
      assert.equal(stale.status, 409);
      assert.equal(stale.body.details.currentVersion, 2);

      const detail = await ok("GET", `/products/${createdProduct.id}`, sales);
      assert.equal(detail.name, "Updated product name");
      const searched = await ok("GET", "/products?search=it1-product&limit=5", sales);
      assert.equal(searched.total, 1);
      assert.equal(searched.items[0].id, createdProduct.id);
    });

    await t.test("duplicate SKU creation is serialized by the unique identity, not only a pre-check", async () => {
      const request = (sku, name) => api("POST", "/products", owner, {
        sku,
        name,
        baseUomId: str(piece._id),
      });
      const [first, second] = await Promise.all([
        request("IT1-RACE-SKU", "Race one"),
        request("it1-race-sku", "Race two"),
      ]);
      assert.deepEqual([first.status, second.status].sort(), [201, 409]);
    });

    await t.test("UC-21 status no-op is history-free and deactivation remains readable", async () => {
      const auditBefore = await models.AuditEvent.countDocuments({
        entityType: "PRODUCT",
        entityId: createdProduct.id,
      });
      const noop = await ok("PATCH", `/products/${createdProduct.id}/status`, owner, {
        expectedVersion: 2,
        isActive: true,
        reason: "No transition",
      });
      assert.equal(noop.version, 2);
      assert.equal(await models.AuditEvent.countDocuments({
        entityType: "PRODUCT",
        entityId: createdProduct.id,
      }), auditBefore);
      const inactive = await ok("PATCH", `/products/${createdProduct.id}/status`, owner, {
        expectedVersion: 2,
        isActive: false,
        reason: "Stop selling",
      });
      assert.equal(inactive.isActive, false);
      assert.equal(inactive.version, 3);
      const listed = await ok("GET", "/products?isActive=false&limit=100", sales);
      assert.ok(listed.items.some((item) => item.id === createdProduct.id));
    });

    await t.test("UC-22 conversion versions preserve history and reject invalid/future-current cases", async () => {
      await ok("PATCH", `/products/${createdProduct.id}/status`, owner, {
        expectedVersion: 3,
        isActive: true,
        reason: "Reactivate for conversion tests",
      });
      const current = await ok("GET", `/products/${createdProduct.id}`, owner);
      assert.equal(current.version, 4);
      const future = new Date(Date.now() + 86_400_000).toISOString();
      const first = await api("POST", `/products/${createdProduct.id}/conversions`, owner, {
        expectedProductVersion: current.version,
        uomId: str(box._id),
        basePerUnit: "4",
        validFrom: future,
        verificationReference: "Supplier packaging sheet",
      });
      assert.equal(first.status, 201, JSON.stringify(first.body));
      assert.equal(first.body.data.productVersion, current.version + 1);
      const detail = await ok("GET", `/products/${createdProduct.id}`, owner);
      assert.equal(detail.currentConversions.length, 1);
      const history = await ok("GET", `/products/${createdProduct.id}/conversions?limit=100`, owner);
      assert.equal(history.total, 2);
      assert.ok(history.items.some((item) => item.verificationReference === "Supplier packaging sheet"));
      assert.equal((await api("POST", `/products/${createdProduct.id}/conversions`, owner, {
        expectedProductVersion: first.body.data.productVersion,
        uomId: str(piece._id),
        basePerUnit: "1",
        validFrom: future,
        verificationReference: "Base",
      })).status, 400);
      const freshState = await models.Product.findById(createdProduct.id).lean();
      assert.equal((await api("POST", `/products/${createdProduct.id}/conversions`, owner, {
        expectedProductVersion: freshState.version,
        uomId: str(box._id),
        basePerUnit: "4.5",
        validFrom: future,
        verificationReference: "Fractional",
      })).status, 400);
    });

    await t.test("UC-23 policy create/update/default target is Owner-only and versioned", async () => {
      assert.equal((await api("GET", `/products/${createdProduct.id}/warehouse-policies`, accountant)).status, 403);
      const created = await ok("PUT", `/products/${createdProduct.id}/warehouse-policies/${wh("WH01")._id}`, owner, {
        expectedVersion: 0,
        minimumQtyBase: "1000",
      });
      assert.equal(created.minimumQtyBase, "1000");
      assert.equal(created.targetQtyBase, "1000");
      assert.equal(created.version, 1);
      const updated = await ok("PUT", `/products/${createdProduct.id}/warehouse-policies/${wh("WH01")._id}`, owner, {
        expectedVersion: 1,
        minimumQtyBase: "1000",
        targetQtyBase: "1200",
      });
      assert.equal(updated.targetQtyBase, "1200");
      assert.equal(updated.version, 2);
      assert.equal((await api("PUT", `/products/${createdProduct.id}/warehouse-policies/${wh("WH01")._id}`, owner, {
        expectedVersion: 2,
        minimumQtyBase: "1300",
        targetQtyBase: "1200",
      })).status, 400);
      const policies = await ok("GET", `/products/${createdProduct.id}/warehouse-policies`, owner);
      assert.ok(policies.items.some((policy) => policy.warehouse.id === str(wh("WH01")._id)));
    });

    await t.test("concurrent conversion versions are serialized by the product guard", async () => {
      const current = await models.Product.findById(createdProduct.id).lean();
      const future = new Date(Date.now() + 2 * 86_400_000).toISOString();
      const request = (factor, reference) => api(
        "POST",
        `/products/${createdProduct.id}/conversions`,
        owner,
        {
          expectedProductVersion: current.version,
          uomId: str(box._id),
          basePerUnit: factor,
          validFrom: future,
          verificationReference: reference,
        },
      );
      const [first, second] = await Promise.all([
        request("6", "Race conversion A"),
        request("7", "Race conversion B"),
      ]);
      assert.deepEqual([first.status, second.status].sort(), [201, 409]);
      const versions = await models.ProductUomVersion.find({
        productId: createdProduct.id,
        uomId: box._id,
      }).sort({ version: 1 }).lean();
      assert.equal(new Set(versions.map((item) => item.version)).size, versions.length);
    });

    await t.test("product lookup separates UOM catalogue from Owner policy warehouses", async () => {
      const ownerOptions = await ok("GET", "/products/options", owner);
      assert.ok(ownerOptions.uoms.length >= 3);
      assert.ok(ownerOptions.warehouses.length >= 3);
      const salesOptions = await ok("GET", "/products/options", sales);
      assert.ok(salesOptions.uoms.length >= 3);
      assert.equal(salesOptions.warehouses, undefined);
    });

    let createdSupplier;
    await t.test("UC-28/30/31 supplier read/create/update separates Accountant and Owner rights", async () => {
      const result = await api("POST", "/suppliers", accountant, {
        code: " ncc-it1 ",
        name: "Iteration 1 Supplier",
        phone: "0909999999",
        email: "supplier-it1@example.com",
        address: "Address",
        taxCode: "",
        contactPerson: "Contact",
        notes: "Created",
      });
      assert.equal(result.status, 201, JSON.stringify(result.body));
      createdSupplier = result.body.data;
      assert.equal(createdSupplier.code, "NCC-IT1");
      assert.equal(createdSupplier.cooperationStatus, "ACTIVE");
      assert.equal(createdSupplier.version, 1);
      assert.equal(createdSupplier.taxCode, null);
      assert.equal((await api("GET", "/suppliers", warehouse)).status, 403);
      assert.equal((await api("GET", "/suppliers", sales)).status, 403);
      assert.equal((await api("PUT", `/suppliers/${createdSupplier.id}`, owner, {
        expectedVersion: 1,
        name: "Owner cannot edit",
      })).status, 403);
      assert.equal((await api("PATCH", `/suppliers/${createdSupplier.id}/status`, accountant, {
        expectedVersion: 1,
        cooperationStatus: "SUSPENDED",
        reason: "Accountant cannot change status",
      })).status, 403);
      const updated = await ok("PUT", `/suppliers/${createdSupplier.id}`, accountant, {
        expectedVersion: 1,
        name: "Iteration 1 Supplier Updated",
        phone: "0908888888",
        email: "supplier-it1@example.com",
        taxCode: "TAX-1",
        contactPerson: "New Contact",
      });
      assert.equal(updated.version, 2);
      assert.equal(updated.cooperationStatus, "ACTIVE");
      assert.equal(updated.name, "Iteration 1 Supplier Updated");
    });

    await t.test("concurrent supplier codes serialize on the global Party identity", async () => {
      const request = (code, name) => api("POST", "/suppliers", accountant, {
        code,
        name,
      });
      const [first, second] = await Promise.all([
        request("it1-race-supplier", "Race Supplier A"),
        request("IT1-RACE-SUPPLIER", "Race Supplier B"),
      ]);
      assert.deepEqual([first.status, second.status].sort(), [201, 409]);
    });

    await t.test("UC-29/32 status history is Owner-only, idempotent on no-op and restores TERMINATED", async () => {
      const terminated = await ok("PATCH", `/suppliers/${createdSupplier.id}/status`, owner, {
        expectedVersion: 2,
        cooperationStatus: "TERMINATED",
        reason: "Contract ended",
      });
      assert.equal(terminated.cooperationStatus, "TERMINATED");
      assert.equal(terminated.isActive, false);
      assert.equal(terminated.version, 3);
      const historyBefore = await ok("GET", `/suppliers/${createdSupplier.id}/history?limit=100`, owner);
      const noop = await ok("PATCH", `/suppliers/${createdSupplier.id}/status`, owner, {
        expectedVersion: 3,
        cooperationStatus: "TERMINATED",
        reason: "No transition",
      });
      assert.equal(noop.version, 3);
      const historyAfter = await ok("GET", `/suppliers/${createdSupplier.id}/history?limit=100`, owner);
      assert.equal(historyAfter.total, historyBefore.total);
      const active = await ok("PATCH", `/suppliers/${createdSupplier.id}/status`, owner, {
        expectedVersion: 3,
        cooperationStatus: "ACTIVE",
        reason: "Reopened with signed contract",
      });
      assert.equal(active.cooperationStatus, "ACTIVE");
      assert.equal(active.isActive, true);
      assert.equal(active.version, 4);
      assert.ok((await ok("GET", `/suppliers/${createdSupplier.id}/history?limit=100`, owner))
        .items.some((event) => event.action === "CHANGE_SUPPLIER_STATUS"));
      assert.equal((await api("GET", "/suppliers?limit=100", owner)).status, 200);
    });

    await t.test("supplier documents resolve PO and GR chains within Accountant warehouse scope", async () => {
      const poDocuments = await ok(
        "GET",
        `/suppliers/${supplier._id}/documents?kind=PO&limit=100`,
        owner,
      );
      assert.ok(poDocuments.items.some((document) => document.documentNo === "DEMO-PO"));
      const grDocuments = await ok(
        "GET",
        `/suppliers/${supplier._id}/documents?kind=GR_PURCHASE&limit=100`,
        owner,
      );
      assert.ok(grDocuments.items.some((document) => document.documentNo === "DEMO-GR-P"));
      const supplierList = await ok("GET", "/suppliers?limit=100", owner);
      assert.ok(supplierList.items.every((item) => item.kind === undefined));
      assert.ok(supplierList.items.some((item) => item.id === str(supplier._id)));
    });

    let createdLot;
    let identityLockedLot;
    await t.test("UC-24/26 Warehouse can create lots; only Owner can update them", async () => {
      const result = await api("POST", "/lots", warehouse, {
        productId: str(demoProduct._id),
        manufacturerLot: "IT1-LOT-1",
        tone: "T-IT1",
        calibre: "C-IT1",
        identificationStatus: "VERIFIED",
        manufacturedOn: futureDay(),
        verificationReference: "Warehouse verification record",
        notes: "Created by Warehouse",
      });
      assert.equal(result.status, 400, "manufacturedOn must not be in the future");
      const valid = await api("POST", "/lots", warehouse, {
        productId: str(demoProduct._id),
        manufacturerLot: "IT1-LOT-1",
        tone: "T-IT1",
        calibre: "C-IT1",
        identificationStatus: "VERIFIED",
        manufacturedOn: "2026-01-01",
        verificationReference: "Warehouse verification record",
        notes: "Created by Warehouse",
      });
      assert.equal(valid.status, 201, JSON.stringify(valid.body));
      createdLot = valid.body.data;
      assert.equal(createdLot.identificationStatus, "VERIFIED");
      assert.equal(createdLot.identityLocked, false);
      assert.equal(valid.body.data.verifiedBy, str(warehouse._id));
      assert.equal((await api("POST", "/lots", warehouse, {
        productId: str(demoProduct._id),
        manufacturerLot: "IT1-LOT-1",
        tone: "T-IT1",
        calibre: "C-IT1",
        identificationStatus: "VERIFIED",
        verificationReference: "Duplicate",
      })).status, 409);
      assert.equal((await api("POST", "/lots", warehouse, {
        productId: str(demoProduct._id),
        manufacturerLot: "IT1-NO-REF",
        tone: "T",
        calibre: "C",
        identificationStatus: "VERIFIED",
      })).status, 400);
      assert.equal((await api("PUT", `/lots/${createdLot.id}`, warehouse, {
        expectedVersion: 1,
        notes: "Warehouse cannot update",
      })).status, 403);
      const updated = await ok("PUT", `/lots/${createdLot.id}`, owner, {
        expectedVersion: 1,
        notes: "Owner metadata update",
      });
      assert.equal(updated.version, 2);
      assert.equal(updated.notes, "Owner metadata update");
      const unknown = await api("POST", "/lots", owner, {
        productId: str(demoProduct._id),
        manufacturerLot: "IT1-UNKNOWN-LOT",
        tone: "UNKNOWN",
        calibre: "UNKNOWN",
        identificationStatus: "UNKNOWN",
        notes: "Explicit unknown",
      });
      assert.equal(unknown.status, 201);
      assert.equal(unknown.body.data.identificationStatus, "UNKNOWN");
      assert.equal(unknown.body.data.verificationReference, null);
    });

    await t.test("lot list/detail expose catalog metadata but scope stock presence to assignments", async () => {
      const list = await ok("GET", "/lots?manufacturerLot=IT1-LOT-1&limit=10", warehouse);
      assert.equal(list.total, 1);
      assert.equal(list.items[0].hasScopedStock, false);
      assert.equal((await api("GET", `/lots?warehouseId=${wh("WH03")._id}`, warehouse)).status, 403);
      const detail = await ok("GET", `/lots/${createdLot.id}`, warehouse);
      assert.deepEqual(detail.stock, []);
      const unknown = await ok("GET", "/lots?identificationStatus=UNKNOWN&limit=100", owner);
      assert.ok(unknown.items.some((item) => item.manufacturerLot === "UNKNOWN"));
    });

    await t.test("UC-27 referenced lot identity locks before later identity edits", async () => {
      const lot = await models.Lot.create({
        productId: demoProduct._id,
        manufacturerLot: "IT1-LOCK",
        tone: "LOCK-T",
        calibre: "LOCK-C",
        identificationStatus: "VERIFIED",
        verificationReference: "Initial",
        createdBy: owner._id,
        version: 1,
        identityLocked: false,
      });
      const location = await models.Location.findOne({
        warehouseId: wh("WH01")._id,
        kind: "STORAGE",
      }).lean();
      const account = await models.StockAccount.findOne({ locationId: location._id }).lean();
      await models.StockBalance.create({
        accountId: account._id,
        lotId: lot._id,
        qualityCode: "GOOD",
        ownerPartyId: store._id,
        qtyBase: "0",
        version: 0,
      });
      identityLockedLot = await ok("PUT", `/lots/${lot._id}`, owner, {
        expectedVersion: 1,
        notes: "Touch referenced lot",
      });
      assert.equal(identityLockedLot.identityLocked, true);
      const rejected = await api("PUT", `/lots/${lot._id}`, owner, {
        expectedVersion: 2,
        manufacturerLot: "CHANGED",
        identificationStatus: "VERIFIED",
        verificationReference: "New evidence",
      });
      assert.equal(rejected.status, 409);
      assert.equal(rejected.body.code, "ERR-LOT-409-001");
      assert.equal(rejected.body.details.currentVersion, 2);
    });

    await t.test("UC-25 movement history requires stock permission and hides out-of-scope endpoints", async () => {
      const movementLot = await models.Lot.create({
        productId: demoProduct._id,
        manufacturerLot: "IT1-MOVE",
        tone: "MOVE-T",
        calibre: "MOVE-C",
        identificationStatus: "VERIFIED",
        verificationReference: "Movement",
        createdBy: owner._id,
        version: 1,
      });
      const conversion = await models.ProductUomVersion.findOne({
        productId: demoProduct._id,
        uomId: piece._id,
      }).sort({ version: -1 }).lean();
      for (const code of ["WH01", "WH03"]) {
        const warehouseId = wh(code)._id;
        const location = await models.Location.findOne({
          warehouseId,
          kind: "STORAGE",
        }).lean();
        const account = await models.StockAccount.findOne({ locationId: location._id }).lean();
        const gr = await models.BusinessDocument.create({
          documentNo: `IT1-MOVE-GR-${code}`,
          documentKind: "GR_PURCHASE",
          workflowStatus: "POSTED",
          createdBy: warehouse._id,
          header: { warehouseId, receiptKind: "PURCHASE" },
        });
        const grLine = await models.DocumentLine.create({
          documentId: gr._id,
          lineNo: 1,
          productId: demoProduct._id,
          conversionId: conversion._id,
          enteredQty: "5",
          conversionSnapshot: "1",
          qtyBase: "5",
          productNameSnapshot: demoProduct.name,
        });
        await models.StockBalance.create({
          accountId: account._id,
          lotId: movementLot._id,
          qualityCode: "GOOD",
          ownerPartyId: store._id,
          qtyBase: "5",
          version: 1,
        });
        const batch = await models.PostingBatch.create({
          documentId: gr._id,
          operation: "POST",
          operationKey: `it1:${code}`,
          idempotencyKey: `it1:${code}`,
          payloadHash: "a".repeat(64),
          postedBy: warehouse._id,
        });
        const balance = await models.StockBalance.findOne({
          accountId: account._id,
          lotId: movementLot._id,
        }).lean();
        await models.StockMovement.create({
          batchId: batch._id,
          documentId: gr._id,
          lineId: grLine._id,
          toBalanceId: balance._id,
          qtyBase: "5",
          toBefore: "0",
          toAfter: "5",
        });
      }
      const warehouseDetail = await ok("GET", `/lots/${movementLot._id}`, warehouse);
      assert.deepEqual(
        new Set(warehouseDetail.stock.map((row) => row.warehouse.code)),
        new Set(["WH01", "WH02"].filter((code) => code === "WH01")),
      );
      const warehouseHistory = await ok(
        "GET",
        `/lots/${movementLot._id}/movements?limit=100`,
        warehouse,
      );
      assert.equal(warehouseHistory.total, 1);
      assert.equal(warehouseHistory.items[0].document.access, "READABLE");
      const ownerHistory = await ok(
        "GET",
        `/lots/${movementLot._id}/movements?limit=100`,
        owner,
      );
      assert.equal(ownerHistory.total, 2);
      assert.equal((await api("GET", `/lots/${movementLot._id}/movements`, sales)).status, 403);
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  }
});