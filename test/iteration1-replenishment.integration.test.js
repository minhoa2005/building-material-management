import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import * as models from "../src/models/index.js";
import { exact } from "../src/models/model-utils.js";
import { buildDemoData } from "../src/seeds/data/demo.data.js";
import { saigonDateOnly } from "../src/shared/utils/domain.js";

const id = () => new mongoose.Types.ObjectId();
const str = (value) => String(value);
const futureDay = () =>
  saigonDateOnly(new Date(Date.now() + 10 * 86_400_000));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("Iteration 1 replenishment commands are scoped, versioned, idempotent and stock-neutral", {
  skip: !process.env.MONGODB_TEST_URI,
  timeout: 300_000,
}, async (t) => {
  const dbName = `sep490_iteration1_rr_${id()}`;
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
    const warehouses = await models.Warehouse.find().lean();
    const wh = (code) => warehouses.find((item) => item.code === code);
    const roles = await models.Role.find().lean();
    const role = (code) => roles.find((item) => item.code === code);
    const products = await models.Product.find().sort({ sku: 1 }).lean();
    const product1 = products.find((item) => item.sku === "GACH-DEMO-1");
    const product2 = products.find((item) => item.sku === "GACH-DEMO-2");
    const piece = await models.Uom.findOne({ code: "PIECE" }).lean();
    const box = await models.Uom.findOne({ code: "BOX" }).lean();
    const conversion = async (productId, uomId) =>
      models.ProductUomVersion.findOne({
        productId,
        uomId,
        validFrom: { $lte: new Date() },
      }).sort({ validFrom: -1, version: -1 }).lean();
    const piece1 = await conversion(product1._id, piece._id);
    const piece2 = await conversion(product2._id, piece._id);
    const box2 = await conversion(product2._id, box._id);
    const stockCollections = [
      models.StockBalance,
      models.PostingBatch,
      models.StockMovement,
      models.Reservation,
      models.DemandSupplyAllocation,
    ];
    const stockBefore = new Map();
    for (const Model of stockCollections) {
      stockBefore.set(
        Model.modelName,
        mongoose.mongo.BSON.EJSON.stringify(
          await Model.find().sort({ _id: 1 }).lean(),
          { relaxed: false },
        ),
      );
    }

    process.env.JWT_SECRET = "iteration1-rr-integration-only";
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
    const neededOn = futureDay();
    const line = (product, selectedConversion, enteredQty, reasonNote) => ({
      productId: str(product._id),
      conversionId: str(selectedConversion._id),
      enteredQty,
      reasonNote,
    });
    const createBody = (key, action, lines, extra = {}) => ({
      action,
      creationKey: key,
      warehouseId: str(wh("WH01")._id),
      neededOn,
      triggerReason: "Iteration 1 replenishment",
      note: "Created by integration test",
      lines,
      ...extra,
    });
    const header = (version, operationKey, lines, extra = {}) => ({
      expectedVersion: version,
      operationKey,
      warehouseId: str(wh("WH01")._id),
      neededOn,
      triggerReason: "Iteration 1 replenishment updated",
      note: "Updated by integration test",
      lines,
      ...extra,
    });
    const review = (version, operationKey, decision, lines = [], reason = "Review reason") => ({
      expectedVersion: version,
      operationKey,
      decision,
      reason,
      lines,
    });
    const approvalLines = (snapshot, zeroIndexes = new Set([1])) =>
      snapshot.lines.map((lineItem, index) => ({
        lineId: lineItem.lineId,
        approvedQtyBase: zeroIndexes.has(index) ? "0" : lineItem.qtyBase,
        reason: zeroIndexes.has(index) ? "Not needed now" : "Approved",
      }));

    await t.test("options and creation/update commands enforce role, warehouse and idempotency scope", async () => {
      const salesOptions = await ok("GET", "/replenishments/options?mode=CREATE", sales);
      assert.ok(salesOptions.warehouses.every((item) => item.isActive));
      assert.ok(salesOptions.warehouses.some((item) => item.code === "WH01"));
      assert.equal((await api("GET", "/replenishments/options?mode=CREATE", owner)).status, 403);
      const filterOptions = await ok("GET", "/replenishments/options?mode=FILTER", owner);
      assert.ok(filterOptions.warehouses.some((item) => item.code === "WH03"));
      assert.equal((await api("POST", "/replenishments", owner, createBody(
        "it1:owner-denied",
        "SAVE_DRAFT",
        [line(product1, piece1, "1", "Owner denied")],
      ))).status, 403);
      assert.equal((await api("POST", "/replenishments", accountant, createBody(
        "it1:accountant-denied",
        "SAVE_DRAFT",
        [line(product1, piece1, "1", "Accountant denied")],
      ))).status, 403);
      assert.equal((await api("POST", "/replenishments", sales, createBody(
        "it1:duplicate-line",
        "SAVE_DRAFT",
        [
          line(product1, piece1, "1", "Same line"),
          line(product1, piece1, "2", "Same line"),
        ],
      ))).status, 400);
      assert.equal((await api("POST", "/replenishments", sales, createBody(
        "it1:qtybase-denied",
        "SAVE_DRAFT",
        [{ ...line(product1, piece1, "1", "Rejected"), qtyBase: "1" }],
      ))).status, 400);
      assert.equal((await api("POST", "/replenishments", sales, createBody(
        "it1:missing-reason",
        "SAVE_DRAFT",
        [{ productId: str(product1._id), conversionId: str(piece1._id), enteredQty: "1" }],
      ))).status, 400);
      assert.equal((await api("POST", "/replenishments", sales, createBody(
        "it1:past-submit",
        "SUBMIT",
        [line(product1, piece1, "1", "Past date")],
        { neededOn: "2020-01-01" },
      ))).status, 400);
      const pastDraft = await api("POST", "/replenishments", sales, createBody(
        "it1:past-draft",
        "SAVE_DRAFT",
        [line(product1, piece1, "1", "Past draft date")],
        { neededOn: "2020-01-01" },
      ));
      assert.equal(pastDraft.status, 201, JSON.stringify(pastDraft.body));
      assert.equal((await api("POST", `/replenishments/${pastDraft.body.data.id}/submit`, sales, {
        expectedVersion: 1,
        operationKey: "it1:past-submit-key",
      })).status, 400);
    });

    let draft;
    let updateBody;
    await t.test("UC-03/04 draft create, replay, edit, soft-delete, new line numbers and conflicts", async () => {
      const createPayload = createBody("it1:draft-create", "SAVE_DRAFT", [
        line(product1, piece1, "10", "Reserve product one"),
        line(product2, piece2, "5", "Reserve product two"),
      ]);
      const created = await api("POST", "/replenishments", sales, createPayload);
      assert.equal(created.status, 201, JSON.stringify(created.body));
      draft = created.body.data;
      assert.equal(draft.workflowStatus, "DRAFT");
      assert.equal(draft.version, 1);
      const replay = await api("POST", "/replenishments", sales, createPayload);
      assert.equal(replay.status, 200, JSON.stringify(replay.body));
      assert.equal(replay.body.data.id, draft.id);
      assert.equal(replay.body.data.replayed, true);
      const changedAction = await api("POST", "/replenishments", sales, {
        ...createPayload,
        action: "SUBMIT",
      });
      assert.equal(changedAction.status, 409);
      assert.equal(changedAction.body.code, "ERR-CORE-409-003");

      const detail = await ok("GET", `/replenishments/${draft.id}`, sales);
      assert.equal(detail.lines.length, 2);
      assert.equal(detail.submissionHistoryAvailable, false);
      const [first, second] = detail.lines;
      updateBody = header(1, "it1:update-1", [
        {
          id: first.id,
          productId: first.product.id,
          conversionId: first.conversionId,
          enteredQty: "12",
          reasonNote: "Reserve product one edited",
        },
        line(product2, box2, "2", "Reserve product two in boxes"),
      ]);
      const updated = await ok("PUT", `/replenishments/${draft.id}`, sales, updateBody);
      assert.equal(updated.version, 2);
      assert.equal(updated.workflowStatus, "DRAFT");
      const updatedDetail = await ok("GET", `/replenishments/${draft.id}`, sales);
      assert.equal(updatedDetail.lines.length, 2);
      assert.equal(updatedDetail.lines[0].id, first.id);
      assert.equal(updatedDetail.lines[0].enteredQty, "12");
      assert.ok(updatedDetail.lines[1].lineNo > 2);
      const removed = await models.DocumentLine.findById(second.id).lean();
      assert.ok(removed.details.removedAt instanceof Date);
      const replayUpdate = await ok("PUT", `/replenishments/${draft.id}`, sales, updateBody);
      assert.equal(replayUpdate.replayed, true);
      assert.equal(replayUpdate.version, 2);
      assert.equal((await api("PUT", `/replenishments/${draft.id}`, sales, {
        ...updateBody,
        triggerReason: "Different payload",
      })).status, 409);
      assert.equal((await api("PUT", `/replenishments/${draft.id}`, sales, {
        ...updateBody,
        operationKey: "it1:update-stale",
        expectedVersion: 1,
      })).status, 409);
      assert.equal((await api("PUT", `/replenishments/${draft.id}`, sales, {
        ...updateBody,
        operationKey: "it1:update-wrong-product",
        expectedVersion: 2,
        lines: [{
          id: first.id,
          productId: str(product2._id),
          conversionId: str(piece2._id),
          enteredQty: "1",
          reasonNote: "Wrong product",
        }],
      })).status, 400);
      await models.User.collection.updateOne(
        { _id: sales._id },
        { $set: { warehouseIds: [] } },
      );
      try {
        assert.equal((await api("PUT", `/replenishments/${draft.id}`, sales, {
          ...updateBody,
          operationKey: "it1:update-no-scope",
          expectedVersion: 2,
        })).status, 403);
      } finally {
        await models.User.collection.updateOne(
          { _id: sales._id },
          { $set: { warehouseIds: sales.warehouseIds } },
        );
      }
    });

    await t.test('RV-03 creation replay enforces current warehouse scope', async()=>{
      const body=createBody('rv03-replay-scope','SAVE_DRAFT',[line(product1,piece1,'2','Scope regression')]);
      const created=await ok('POST','/replenishments',sales,body,201);
      await models.User.updateOne({_id:sales._id},{$set:{warehouseIds:[]}});
      try {assert.equal((await api('POST','/replenishments',sales,body)).status,403);}
      finally {await models.User.updateOne({_id:sales._id},{$set:{warehouseIds:sales.warehouseIds}});}
      assert.equal((await ok('POST','/replenishments',sales,body)).id,created.id);
    });

    await t.test("UC-05 submit writes an immutable snapshot and submission history", async () => {
      const submitted = await ok("POST", `/replenishments/${draft.id}/submit`, sales, {
        expectedVersion: 2,
        operationKey: "it1:submit-1",
      });
      assert.equal(submitted.version, 3);
      assert.equal(submitted.workflowStatus, "SUBMITTED");
      const replay = await ok("POST", `/replenishments/${draft.id}/submit`, sales, {
        expectedVersion: 2,
        operationKey: "it1:submit-1",
      });
      assert.equal(replay.replayed, true);
      assert.equal(replay.version, 3);
      const detail = await ok("GET", `/replenishments/${draft.id}`, sales);
      assert.equal(detail.submissionHistoryAvailable, true);
      assert.equal(detail.submissionCount, 1);
      assert.ok(detail.submittedBy.id);
      const submissions = await ok("GET", `/replenishments/${draft.id}/submissions?limit=10`, sales);
      assert.equal(submissions.total, 1);
      assert.equal(submissions.items[0].documentVersion, 3);
      const snapshot = await ok("GET", `/replenishments/${draft.id}/submissions/3`, sales);
      assert.equal(snapshot.available, true);
      assert.equal(snapshot.snapshot.lines.length, 2);
      assert.equal(snapshot.snapshot.lines[0].reasonNote, "Reserve product one edited");
      assert.equal(snapshot.snapshot.lines[0].qtyBase, "12");
      assert.equal(
        snapshot.snapshot.lines[1].qtyBase,
        exact(box2.basePerUnit).mul(2).toString(),
      );
      draft.snapshot = snapshot.snapshot;
    });

    await t.test("UC-06 partial approval keeps requested quantities and records per-line reasons", async () => {
      const snapshot = draft.snapshot;
      const lines = approvalLines(snapshot);
      const result = await ok("POST", `/replenishments/${draft.id}/review`, owner, {
        expectedVersion: 3,
        operationKey: "it1:review-1",
        decision: "APPROVE",
        reason: "Approved partially",
        lines,
      });
      assert.equal(result.workflowStatus, "APPROVED");
      assert.equal(result.version, 3);
      assert.ok(result.approvalId);
      const detail = await ok("GET", `/replenishments/${draft.id}`, sales);
      assert.equal(detail.lines[0].qtyBase, snapshot.lines[0].qtyBase);
      assert.equal(detail.lines[0].approvedQtyBase, snapshot.lines[0].qtyBase);
      assert.equal(detail.lines[1].approvedQtyBase, "0");
      assert.equal(detail.latestDecision.decision, "APPROVE");
      assert.ok(detail.approvalHistory[0].lines[1].reason);
      const unchanged = await ok("GET", `/replenishments/${draft.id}/submissions/3`, sales);
      assert.deepEqual(
        unchanged.snapshot.lines.map((lineItem) => lineItem.qtyBase),
        snapshot.lines.map((lineItem) => lineItem.qtyBase),
      );
    });

    await t.test("revise/update/resubmit creates separate snapshots; all-zero approval is blocked", async () => {
      const direct = await api("POST", "/replenishments", sales, createBody(
        "it1:revision-request",
        "SUBMIT",
        [line(product2, piece2, "7", "Revision flow")],
      ));
      assert.equal(direct.status, 201, JSON.stringify(direct.body));
      const requestId = direct.body.data.id;
      const firstSnapshot = await ok("GET", `/replenishments/${requestId}/submissions/1`, sales);
      assert.equal(firstSnapshot.available, true);
      const over = await api("POST", `/replenishments/${requestId}/review`, owner, {
        ...review(1, "it1:over-approve", "APPROVE", [{
          lineId: firstSnapshot.snapshot.lines[0].lineId,
          approvedQtyBase: "8",
          reason: "Too much",
        }]),
      });
      assert.equal(over.status, 400);
      assert.equal(over.body.code, "ERR-RR-400-001");
      const missingReductionReason = await api("POST", `/replenishments/${requestId}/review`, owner, {
        ...review(1, "it1:missing-line-reason", "APPROVE", [{
          lineId: firstSnapshot.snapshot.lines[0].lineId,
          approvedQtyBase: "6",
        }]),
      });
      assert.equal(missingReductionReason.status, 400);
      assert.equal(missingReductionReason.body.code, "ERR-RR-400-001");
      const allZero = await api("POST", `/replenishments/${requestId}/review`, owner, {
        ...review(1, "it1:all-zero", "APPROVE", [{
          lineId: firstSnapshot.snapshot.lines[0].lineId,
          approvedQtyBase: "0",
          reason: "None",
        }]),
      });
      assert.equal(allZero.status, 400);
      assert.equal(allZero.body.code, "ERR-RR-400-001");
      const revised = await ok("POST", `/replenishments/${requestId}/review`, owner, {
        ...review(1, "it1:revise", "REVISE", [], "Please adjust the reason"),
      });
      assert.equal(revised.workflowStatus, "REVISION_REQUIRED");
      assert.equal(revised.version, 1);
      const detail = await ok("GET", `/replenishments/${requestId}`, sales);
      const update = header(1, "it1:revised-update", [{
        id: detail.lines[0].id,
        productId: detail.lines[0].product.id,
        conversionId: detail.lines[0].conversionId,
        enteredQty: "8",
        reasonNote: "Adjusted after return",
      }]);
      const updated = await ok("PUT", `/replenishments/${requestId}`, sales, update);
      assert.equal(updated.version, 2);
      assert.equal(updated.workflowStatus, "REVISION_REQUIRED");
      const resubmitted = await ok("POST", `/replenishments/${requestId}/submit`, sales, {
        expectedVersion: 2,
        operationKey: "it1:resubmit",
      });
      assert.equal(resubmitted.version, 3);
      const submissions = await ok("GET", `/replenishments/${requestId}/submissions?limit=10`, sales);
      assert.deepEqual(
        submissions.items.map((item) => item.documentVersion),
        [3, 1],
      );
      const latest = await ok("GET", `/replenishments/${requestId}/submissions/3`, sales);
      const approved = await ok("POST", `/replenishments/${requestId}/review`, owner, {
        ...review(3, "it1:approve-revision", "APPROVE", [{
          lineId: latest.snapshot.lines[0].lineId,
          approvedQtyBase: latest.snapshot.lines[0].qtyBase,
        }]),
      });
      assert.equal(approved.workflowStatus, "APPROVED");
    });

    await t.test("REJECT blocks edit/resubmit and self-approval is denied after a role change", async () => {
      const rejectedRequest = await api("POST", "/replenishments", sales, createBody(
        "it1:reject-request",
        "SUBMIT",
        [line(product1, piece1, "3", "Reject flow")],
      ));
      assert.equal(rejectedRequest.status, 201, JSON.stringify(rejectedRequest.body));
      const rejectedId = rejectedRequest.body.data.id;
      const rejected = await ok("POST", `/replenishments/${rejectedId}/review`, owner, {
        ...review(1, "it1:reject", "REJECT", [], "Rejected"),
      });
      assert.equal(rejected.workflowStatus, "REJECTED");
      assert.equal((await api("PUT", `/replenishments/${rejectedId}`, sales, header(1, "it1:rejected-update", [
        line(product1, piece1, "4", "No"),
      ]))).status, 409);
      assert.equal((await api("POST", `/replenishments/${rejectedId}/submit`, sales, {
        expectedVersion: 1,
        operationKey: "it1:rejected-submit",
      })).status, 409);

      const selfRequest = await api("POST", "/replenishments", sales, createBody(
        "it1:self-request",
        "SUBMIT",
        [line(product1, piece1, "2", "Self approval")],
      ));
      assert.equal(selfRequest.status, 201, JSON.stringify(selfRequest.body));
      const selfId = selfRequest.body.data.id;
      await models.User.collection.updateOne(
        { _id: sales._id },
        { $set: { roleId: role("OWNER")._id } },
      );
      try {
        const denied = await api("POST", `/replenishments/${selfId}/review`, sales, {
          ...review(1, "it1:self-review", "APPROVE", [{
            lineId: (await ok("GET", `/replenishments/${selfId}/submissions/1`, sales))
              .snapshot.lines[0].lineId,
            approvedQtyBase: "2",
          }]),
        });
        assert.equal(denied.status, 403);
        assert.equal(denied.body.code, "ERR-RR-403-001");
      } finally {
        await models.User.collection.updateOne(
          { _id: sales._id },
          { $set: { roleId: role("SALES")._id } },
        );
      }
    });

    await t.test("submit rejects a conversion that changed after the draft was created", async () => {
      const draftCreate = await api("POST", "/replenishments", sales, createBody(
        "it1:conversion-drift",
        "SAVE_DRAFT",
        [line(product2, box2, "2", "Conversion drift")],
      ));
      assert.equal(draftCreate.status, 201, JSON.stringify(draftCreate.body));
      const currentProduct = await models.Product.findById(product2._id).lean();
      const future = new Date(Date.now() + 150).toISOString();
      const conversionResult = await api("POST", `/products/${product2._id}/conversions`, owner, {
        expectedProductVersion: currentProduct.version,
        uomId: str(box._id),
        basePerUnit: "9",
        validFrom: future,
        verificationReference: "New verified factor",
      });
      assert.equal(conversionResult.status, 201, JSON.stringify(conversionResult.body));
      await sleep(200);
      const result = await api("POST", `/replenishments/${draftCreate.body.data.id}/submit`, sales, {
        expectedVersion: 1,
        operationKey: "it1:conversion-drift-submit",
      });
      assert.equal(result.status, 409);
      assert.equal(result.body.code, "ERR-RR-409-002");
      const unchanged = await models.BusinessDocument.findById(draftCreate.body.data.id).lean();
      assert.equal(unchanged.workflowStatus, "DRAFT");
      assert.equal(unchanged.version, 1);
      assert.equal(await models.ReplenishmentSubmission.countDocuments({
        documentId: unchanged._id,
      }), 0);
      assert.equal(await models.BusinessOperation.countDocuments({
        documentId: unchanged._id,
      }), 1, "Only the create operation exists after a failed submit");
    });

    await t.test("competing Owner reviews create exactly one approval", async () => {
      const created = await api("POST", "/replenishments", sales, createBody(
        "it1:review-race",
        "SUBMIT",
        [line(product1, piece1, "6", "Review race")],
      ));
      assert.equal(created.status, 201, JSON.stringify(created.body));
      const requestId = created.body.data.id;
      const snapshot = await ok("GET", `/replenishments/${requestId}/submissions/1`, sales);
      const lines = [{
        lineId: snapshot.snapshot.lines[0].lineId,
        approvedQtyBase: snapshot.snapshot.lines[0].qtyBase,
      }];
      const [first, second] = await Promise.all([
        api("POST", `/replenishments/${requestId}/review`, owner, {
          ...review(1, "it1:review-race-a", "APPROVE", lines),
        }),
        api("POST", `/replenishments/${requestId}/review`, owner, {
          ...review(1, "it1:review-race-b", "APPROVE", lines),
        }),
      ]);
      assert.deepEqual([first.status, second.status].sort(), [200, 409]);
      const document = await models.BusinessDocument.findById(requestId).lean();
      assert.equal(document.workflowStatus, "APPROVED");
      assert.equal(document.version, 1);
      assert.equal(await models.Approval.countDocuments({
        documentId: document._id,
        decisionKind: "REPLENISHMENT_APPROVAL",
      }), 1);
    });

    await t.test("two concurrent submits create one transition and one snapshot", async () => {
      const draftCreate = await api("POST", "/replenishments", sales, createBody(
        "it1:submit-race",
        "SAVE_DRAFT",
        [line(product1, piece1, "4", "Submit race")],
      ));
      assert.equal(draftCreate.status, 201, JSON.stringify(draftCreate.body));
      const requestId = draftCreate.body.data.id;
      const [first, second] = await Promise.all([
        api("POST", `/replenishments/${requestId}/submit`, sales, {
          expectedVersion: 1,
          operationKey: "it1:race-a",
        }),
        api("POST", `/replenishments/${requestId}/submit`, sales, {
          expectedVersion: 1,
          operationKey: "it1:race-b",
        }),
      ]);
      assert.deepEqual([first.status, second.status].sort(), [200, 409]);
      const document = await models.BusinessDocument.findById(requestId).lean();
      assert.equal(document.workflowStatus, "SUBMITTED");
      assert.equal(document.version, 2);
      assert.equal(await models.ReplenishmentSubmission.countDocuments({
        documentId: document._id,
        documentVersion: 2,
      }), 1);
      assert.equal(await models.ReplenishmentSubmission.countDocuments({
        documentId: document._id,
      }), 1);
    });

    await t.test("legacy sourced RRs remain readable but manual commands are rejected", async () => {
      const sourceDocument = await models.BusinessDocument.findOne({ documentNo: "DEMO-RR-SALES" }).lean();
      const sourceLine = await models.DocumentLine.findOne({
        documentId: sourceDocument._id,
        "details.triggerType": "SALES_SHORTAGE",
      }).lean();
      const document = await models.BusinessDocument.create({
        documentNo: "IT1-SOURCE-DRAFT",
        documentKind: "REPLENISHMENT",
        workflowStatus: "DRAFT",
        version: 1,
        createdBy: sales._id,
        header: {
          warehouseId: wh("WH01")._id,
          neededOn: new Date(`${neededOn}T00:00:00+07:00`),
          triggerReason: "Legacy source draft",
          creationKey: "it1:source-draft",
        },
      });
      await models.DocumentLine.create({
        documentId: document._id,
        lineNo: 1,
        lineKind: "REPLENISHMENT",
        productId: sourceLine.productId,
        conversionId: sourceLine.conversionId,
        enteredQty: sourceLine.enteredQty,
        conversionSnapshot: sourceLine.conversionSnapshot,
        qtyBase: sourceLine.qtyBase,
        productNameSnapshot: sourceLine.productNameSnapshot,
        details: sourceLine.details,
      });
      const result = await api("PUT", `/replenishments/${document._id}`, sales, header(1, "it1:manual-on-source", [
        line(product1, piece1, "1", "Manual edit"),
      ]));
      assert.equal(result.status, 409);
      assert.equal(result.body.code, "ERR-RR-409-003");
      const legacy = await models.BusinessDocument.findOne({ documentNo: "DEMO-RR" }).lean();
      const legacyDetail = await ok("GET", `/replenishments/${legacy._id}`, owner);
      assert.equal(legacyDetail.submissionHistoryAvailable, false);
      const unavailable = await ok("GET", `/replenishments/${legacy._id}/submissions/1`, owner);
      assert.equal(unavailable.available, false);
      assert.equal(unavailable.snapshot, null);
    });

    await t.test("all replenishment commands remain stock- and ledger-neutral", async () => {
      for (const Model of stockCollections) {
        const after = mongoose.mongo.BSON.EJSON.stringify(
          await Model.find().sort({ _id: 1 }).lean(),
          { relaxed: false },
        );
        assert.equal(after, stockBefore.get(Model.modelName), Model.modelName);
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
