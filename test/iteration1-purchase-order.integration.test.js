import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import * as models from "../src/models/index.js";
import { buildDemoData } from "../src/seeds/data/demo.data.js";

const id = () => new mongoose.Types.ObjectId();
const str = (value) => String(value);

test("UC-07 PO list derives receipt/outstanding quantities from effective STORE ledger", {
  skip: !process.env.MONGODB_TEST_URI,
  timeout: 300_000,
}, async (t) => {
  const dbName = `sep490_iteration1_po_${id()}`;
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
    const warehouse2 = user("warehouse2@ceratile.vn");
    const warehouses = await models.Warehouse.find().lean();
    const wh = (code) => warehouses.find((item) => item.code === code);
    const supplier = await models.Party.findOne({ kind: "SUPPLIER" }).lean();
    const store = await models.Party.findOne({ kind: "STORE" }).lean();
    const product = await models.Product.findOne({ sku: "GACH-DEMO-1" }).lean();
    const piece = await models.Uom.findOne({ code: "PIECE" }).lean();
    const conversion = await models.ProductUomVersion.findOne({
      productId: product._id,
      uomId: piece._id,
    }).sort({ validFrom: -1, version: -1 }).lean();
    const receivingLocation = await models.Location.findOne({
      warehouseId: wh("WH01")._id,
      kind: "RECEIVING",
    }).lean();
    const receivingAccount = await models.StockAccount.findOne({
      locationId: receivingLocation._id,
    }).lean();

    let sequence = 0;
    async function link(source, target) {
      await models.LineLink.create({
        sourceLineId: source._id,
        targetLineId: target._id,
        relationCode: "SOURCE",
        linkedQty: target.qtyBase,
      });
    }
    async function receiptChain(poLine, receiptIndex, receipt) {
      const chainNo = ++sequence;
      const day = new Date(`2026-10-${String(10 + receiptIndex).padStart(2, "0")}T08:00:00Z`);
      const arrival = await models.BusinessDocument.create({
        documentNo: `IT1-ARRIVAL-${chainNo}`,
        documentKind: "ARRIVAL",
        workflowStatus: "COMPLETED",
        createdBy: warehouse._id,
        header: {
          warehouseId: wh("WH01")._id,
          supplierId: supplier._id,
          arrivedAt: day,
          deliveryReference: `DELIVERY-${chainNo}`,
        },
      });
      const arrivalLine = await models.DocumentLine.create({
        documentId: arrival._id,
        lineNo: 1,
        productId: product._id,
        conversionId: conversion._id,
        enteredQty: receipt.qty,
        conversionSnapshot: conversion.basePerUnit,
        qtyBase: receipt.qty,
        productNameSnapshot: product.name,
      });
      await link(poLine, arrivalLine);
      const inspection = await models.BusinessDocument.create({
        documentNo: `IT1-INSPECTION-${chainNo}`,
        documentKind: "INSPECTION",
        workflowStatus: "COMPLETED",
        createdBy: warehouse._id,
      });
      const inspectionLine = await models.DocumentLine.create({
        documentId: inspection._id,
        lineNo: 1,
        lineKind: "INSPECTION",
        productId: product._id,
        conversionId: conversion._id,
        enteredQty: receipt.qty,
        conversionSnapshot: conversion.basePerUnit,
        qtyBase: receipt.qty,
        productNameSnapshot: product.name,
        details: {
          inspectedSourceLineId: arrivalLine._id,
          qualityCode: "GOOD",
          ownershipDecision: receipt.custody ? "CUSTODY" : "ACCEPT",
          inspectedBy: warehouse._id,
          inspectedAt: day,
          packagingCondition: "SEALED",
        },
      });
      await link(arrivalLine, inspectionLine);
      const gr = await models.BusinessDocument.create({
        documentNo: `IT1-GR-${chainNo}`,
        documentKind: "GR_PURCHASE",
        workflowStatus: receipt.status,
        createdBy: warehouse._id,
        header: { warehouseId: wh("WH01")._id, receiptKind: "PURCHASE" },
      });
      const grLine = await models.DocumentLine.create({
        documentId: gr._id,
        lineNo: 1,
        productId: product._id,
        conversionId: conversion._id,
        enteredQty: receipt.qty,
        conversionSnapshot: conversion.basePerUnit,
        qtyBase: receipt.qty,
        productNameSnapshot: product.name,
      });
      await link(inspectionLine, grLine);
      if (receipt.status !== "POSTED") return;
      const lot = await models.Lot.create({
        productId: product._id,
        manufacturerLot: `IT1-PO-LOT-${chainNo}`,
        tone: `T-${chainNo}`,
        calibre: `C-${chainNo}`,
        identificationStatus: "VERIFIED",
        verificationReference: "PO integration lot",
        createdBy: warehouse._id,
        version: 1,
      });
      const finalQty = receipt.reverseQty
        ? String(Number(receipt.qty) - Number(receipt.reverseQty))
        : receipt.qty;
      const balance = await models.StockBalance.create({
        accountId: receivingAccount._id,
        lotId: lot._id,
        qualityCode: "GOOD",
        ownerPartyId: receipt.custody ? supplier._id : store._id,
        qtyBase: finalQty,
        version: receipt.reverseQty ? 2 : 1,
      });
      const rootBatch = await models.PostingBatch.create({
        documentId: gr._id,
        operation: "POST",
        operationKey: `it1:po:${chainNo}:post`,
        idempotencyKey: `it1:po:${chainNo}:post`,
        payloadHash: "c".repeat(64),
        postedBy: warehouse._id,
        postedAt: day,
      });
      await models.StockMovement.create({
        batchId: rootBatch._id,
        documentId: gr._id,
        lineId: grLine._id,
        toBalanceId: balance._id,
        qtyBase: receipt.qty,
        toBefore: "0",
        toAfter: receipt.qty,
      });
      if (receipt.reverseQty) {
        const reversal = await models.PostingBatch.create({
          documentId: gr._id,
          operation: "REVERSE",
          operationKey: `it1:po:${chainNo}:reverse`,
          idempotencyKey: `it1:po:${chainNo}:reverse`,
          payloadHash: "d".repeat(64),
          postedBy: warehouse._id,
          postedAt: new Date(day.getTime() + 3_600_000),
          reversalOf: rootBatch._id,
        });
        await models.StockMovement.create({
          batchId: reversal._id,
          documentId: gr._id,
          lineId: grLine._id,
          fromBalanceId: balance._id,
          qtyBase: receipt.reverseQty,
          fromBefore: receipt.qty,
          fromAfter: finalQty,
        });
      }
    }
    async function createPo({ key, ordered, receipts = [], workflowStatus = "OPEN", directGr = false }) {
      const po = await models.BusinessDocument.create({
        documentNo: `IT1-PO-${key}`,
        documentKind: "PO",
        workflowStatus,
        version: 1,
        createdBy: accountant._id,
        header: {
          warehouseId: wh("WH01")._id,
          supplierId: supplier._id,
          expectedOn: new Date("2026-11-15T00:00:00+07:00"),
          supplierConfirmation: "Text-only confirmation",
        },
      });
      const poLine = await models.DocumentLine.create({
        documentId: po._id,
        lineNo: 1,
        productId: product._id,
        conversionId: conversion._id,
        enteredQty: ordered,
        conversionSnapshot: conversion.basePerUnit,
        qtyBase: ordered,
        productNameSnapshot: product.name,
      });
      if (directGr) {
        const directSequence = ++sequence;
        const gr = await models.BusinessDocument.create({
          documentNo: `IT1-BROKEN-GR-${directSequence}`,
          documentKind: "GR_PURCHASE",
          workflowStatus: "DRAFT",
          createdBy: warehouse._id,
          header: { warehouseId: wh("WH01")._id, receiptKind: "PURCHASE" },
        });
        const grLine = await models.DocumentLine.create({
          documentId: gr._id,
          lineNo: 1,
          productId: product._id,
          conversionId: conversion._id,
          enteredQty: ordered,
          conversionSnapshot: conversion.basePerUnit,
          qtyBase: ordered,
          productNameSnapshot: product.name,
        });
        await link(poLine, grLine);
      }
      for (const [index, receipt] of receipts.entries()) {
        await receiptChain(poLine, index, receipt);
      }
      return { po, poLine };
    }

    const partial = await createPo({
      key: "PARTIAL",
      ordered: "100",
      receipts: [
        { qty: "60", status: "POSTED" },
        { qty: "30", status: "DRAFT" },
      ],
    });
    const reversed = await createPo({
      key: "REVERSED",
      ordered: "100",
      receipts: [{ qty: "60", status: "POSTED", reverseQty: "20" }],
    });
    const custody = await createPo({
      key: "CUSTODY",
      ordered: "100",
      receipts: [{ qty: "80", status: "POSTED", custody: true }],
    });
    const complete = await createPo({
      key: "COMPLETE",
      ordered: "100",
      receipts: [{ qty: "100", status: "POSTED" }],
    });
    const over = await createPo({
      key: "OVER",
      ordered: "100",
      receipts: [{ qty: "110", status: "POSTED" }],
    });
    const closed = await createPo({
      key: "CLOSED",
      ordered: "100",
      workflowStatus: "CLOSED",
      receipts: [{ qty: "60", status: "POSTED" }],
    });
    const broken = await createPo({
      key: "BROKEN",
      ordered: "100",
      directGr: true,
    });

    process.env.JWT_SECRET = "iteration1-po-integration-only";
    const { default: app } = await import("../src/app.js");
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const token = (account) => jwt.sign({ userId: str(account._id) }, process.env.JWT_SECRET);
    async function request(path, account) {
      const response = await fetch(`${base}${path}`, {
        headers: account ? { Authorization: `Bearer ${token(account)}` } : {},
      });
      return { status: response.status, body: await response.json() };
    }
    async function ok(path, account) {
      const result = await request(path, account);
      assert.equal(result.status, 200, JSON.stringify(result.body));
      return result.body.data;
    }

    await t.test("baseline PO exposes received/outstanding quantities and no invented confirmation", async () => {
      const result = await ok("/purchase-orders?search=DEMO-PO&limit=10", owner);
      assert.equal(result.total, 1);
      const item = result.items[0];
      assert.equal(item.outstandingStatus, "NO");
      assert.equal(item.lineCount, 1);
      assert.equal(item.linePreview.length, 1);
      const line = item.linePreview[0];
      assert.equal(line.orderedQtyBase, "120");
      assert.equal(line.confirmedQtyBase, null);
      assert.equal(line.receivedQtyBase, "120");
      assert.equal(line.outstandingQtyBase, "0");
      assert.equal(line.quantityState, "KNOWN");
      assert.equal(line.product.sku, product.sku);
      assert.equal(line.baseUom.code, "PIECE");
      assert.equal(Object.hasOwn(item, "supplierConfirmation"), false);
    });

    await t.test("draft receipts do not reduce outstanding and effective reversals do", async () => {
      const partialResult = await ok("/purchase-orders?search=IT1-PO-PARTIAL&limit=10", owner);
      const partialLine = partialResult.items[0].linePreview[0];
      assert.equal(partialLine.receivedQtyBase, "60");
      assert.equal(partialLine.outstandingQtyBase, "40");
      assert.equal(partialLine.quantityState, "KNOWN");
      const reversedResult = await ok("/purchase-orders?search=IT1-PO-REVERSED&limit=10", owner);
      const reversedLine = reversedResult.items[0].linePreview[0];
      assert.equal(reversedLine.receivedQtyBase, "40");
      assert.equal(reversedLine.outstandingQtyBase, "60");
      assert.equal(reversedResult.items[0].outstandingStatus, "YES");
    });

    await t.test("custody is not owned receipt; over-receipt and closed POs are incomplete", async () => {
      const custodyResult = await ok("/purchase-orders?search=IT1-PO-CUSTODY&limit=10", owner);
      assert.equal(custodyResult.items[0].linePreview[0].receivedQtyBase, "0");
      assert.equal(custodyResult.items[0].linePreview[0].outstandingQtyBase, "100");
      const overResult = await ok("/purchase-orders?search=IT1-PO-OVER&limit=10", owner);
      assert.equal(overResult.items[0].outstandingStatus, "UNKNOWN");
      assert.equal(overResult.items[0].linePreview[0].quantityState, "INCOMPLETE");
      assert.equal(overResult.items[0].linePreview[0].receivedQtyBase, null);
      assert.equal(overResult.items[0].linePreview[0].outstandingQtyBase, null);
      const closedResult = await ok("/purchase-orders?search=IT1-PO-CLOSED&limit=10", owner);
      assert.equal(closedResult.items[0].outstandingStatus, "UNKNOWN");
      const brokenResult = await ok("/purchase-orders?search=IT1-PO-BROKEN&limit=10", owner);
      assert.equal(brokenResult.items[0].outstandingStatus, "UNKNOWN");
      const completeResult = await ok("/purchase-orders?search=IT1-PO-COMPLETE&limit=10", owner);
      assert.equal(completeResult.items[0].outstandingStatus, "NO");
      assert.equal(completeResult.items[0].linePreview[0].receivedQtyBase, "100");
    });

    await t.test("outstanding filter runs before count/pagination and status literals stay filters", async () => {
      const yes = await ok("/purchase-orders?search=IT1-PO&outstanding=YES&limit=1", owner);
      assert.equal(yes.total, 3);
      assert.equal(yes.items.length, 1);
      const no = await ok("/purchase-orders?search=IT1-PO&outstanding=NO&limit=10", owner);
      assert.equal(no.total, 1);
      assert.ok(no.items.every((item) => item.outstandingStatus === "NO"));
      const unknown = await ok("/purchase-orders?search=IT1-PO&outstanding=UNKNOWN&limit=10", owner);
      assert.equal(unknown.total, 3);
      assert.ok(unknown.items.every((item) => item.outstandingStatus === "UNKNOWN"));
      const closed = await ok("/purchase-orders?search=IT1-PO-CLOSED&status=CLOSED", owner);
      assert.equal(closed.total, 1);
      const supplierFiltered = await ok(`/purchase-orders?supplierId=${supplier._id}&search=IT1-PO-PARTIAL`, owner);
      assert.equal(supplierFiltered.total, 1);
      assert.equal((await ok("/purchase-orders?search=%5B", owner)).total, 0);
      assert.equal((await request("/purchase-orders", sales)).status, 403);
      assert.equal((await request("/purchase-orders", null)).status, 401);
    });

    await t.test("warehouse scope limits receiving projection and explicit foreign warehouse is denied", async () => {
      const list = await ok("/purchase-orders?search=IT1-PO&limit=100", warehouse);
      assert.ok(list.items.length > 0);
      assert.ok(list.items.every((item) => item.warehouse.code === "WH01"));
      const foreign = await ok("/purchase-orders?search=IT1-PO&limit=100", warehouse2);
      assert.equal(foreign.total, 0);
      assert.equal((await request(`/purchase-orders?warehouseId=${wh("WH01")._id}`, warehouse2)).status, 403);
      const accountantList = await ok("/purchase-orders?search=IT1-PO&limit=100", accountant);
      assert.ok(accountantList.total >= 6);
    });

    await t.test("PO reads do not mutate stock or receipt history", async () => {
      const collections = [
        models.StockBalance,
        models.PostingBatch,
        models.StockMovement,
        models.Reservation,
        models.DemandSupplyAllocation,
      ];
      const before = new Map();
      for (const Model of collections) {
        before.set(
          Model.modelName,
          mongoose.mongo.BSON.EJSON.stringify(
            await Model.find().sort({ _id: 1 }).lean(),
            { relaxed: false },
          ),
        );
      }
      await ok("/purchase-orders?search=IT1-PO&limit=100", owner);
      await ok("/purchase-orders?search=DEMO-PO&limit=10", warehouse);
      for (const Model of collections) {
        const after = mongoose.mongo.BSON.EJSON.stringify(
          await Model.find().sort({ _id: 1 }).lean(),
          { relaxed: false },
        );
        assert.equal(after, before.get(Model.modelName), Model.modelName);
      }
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === dbName) {
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
  }
});