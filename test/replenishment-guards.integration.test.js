import app from "../src/app.js";
import jwt from "jsonwebtoken";
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import * as m from "../src/models/runtime.js";
import {
  PERMISSION_CATALOGUE,
  ROLE_PERMISSIONS,
} from "../src/seeds/data/permissions.data.js";
import * as rr from "../src/modules/replenishments/replenishment.commands.js";
import * as po from "../src/modules/purchase-orders/purchase-order.commands.js";
import * as receiving from "../src/modules/po-receiving/po-receiving.service.js";
import * as putaway from "../src/modules/po-receiving/purchase-putaway.service.js";
import * as correction from "../src/modules/po-receiving/purchase-correction.service.js";
import { reconcilePurchasing } from "../src/modules/po-receiving/purchase-reconciliation.js";
const enabled = process.env.RUN_NATIVE_API_TESTS === "1";
const run = (name, fn) => test(name, { skip: !enabled }, fn);
let owner,
  worker,
  accountant,
  warehouse,
  product,
  batch,
  supplier,
  receivingLocation,
  storageLocation;
const key = () => new mongoose.Types.ObjectId().toString();
const input = () => ({ operationKey: key() });
test.before(async () => {
  if (!enabled) return;
  // A new isolated test database each run. Never use the application's URI.
  await mongoose.connect(
    "mongodb://127.0.0.1:27017/wmsd_api_test_rr_guards_" +
      key() +
      "?replicaSet=rs0",
    { serverSelectionTimeoutMS: 5000 },
  );
  for (const Model of m.models.values()) {
    await Model.createCollection();
    await Model.createIndexes();
  }
  await m.Uom.create([
    { code: "PIECE", name: "Viên" },
    { code: "BOX", name: "Thùng" },
    { code: "M2", name: "Mét vuông" },
  ]);
  const permissions = await m.Permission.insertMany(
    PERMISSION_CATALOGUE.map((p) => ({
      code: p.code,
      description: p.description,
      name: p.code,
    })),
  );
  const roles = [];
  for (const code of ["OWNER", "WAREHOUSE", "ACCOUNTANT"])
    roles.push(
      await m.Role.create({
        code,
        name: code,
        permissionIds: permissions
          .filter((p) => ROLE_PERMISSIONS[code].includes(p.code))
          .map((p) => p._id),
      }),
    );
  warehouse = await m.Warehouse.create({
    code: "TEST",
    name: "Test warehouse",
    lengthMm: "10000",
    widthMm: "10000",
    clearHeightMm: "3000",
  });
  const users = [];
  for (const role of roles) {
    const u = await m.User.create({
      username: role.code.toLowerCase(),
      fullName: role.code,
      passwordHash: "test-only-unused",
      roleId: role._id,
      warehouseIds: [warehouse._id],
    });
    users.push(
      await m.User.findById(u._id).populate({
        path: "roleId",
        populate: { path: "permissionIds" },
      }),
    );
  }
  [owner, worker, accountant] = users;
  const category = await m.Category.create({ code: "TILE", name: "Tile" });
  product = await m.Product.create({
    sku: "TEST",
    name: "Test tile",
    manufacturerCode: "TEST",
    categoryId: category._id,
    color: "White",
    baseUnit: "PIECE",
    wholeBaseUnits: true,
    lengthMm: "600",
    widthMm: "600",
    heightMm: "10",
  });
  batch = await m.ProductBatch.create({
    productId: product._id,
    manufacturerLot: "B1",
    identificationStatus: "VERIFIED",
    piecesPerCarton: 4,
    cartonLengthMm: "620",
    cartonWidthMm: "620",
    cartonHeightMm: "50",
  });
  supplier = await m.Supplier.create({
    code: "SUP",
    name: "Supplier",
    status: "ACTIVE",
  });
  receivingLocation = await m.WarehouseLocation.create({
    warehouseId: warehouse._id,
    code: "IN",
    locationType: "RECEIVING",
    usableLengthMm: "5000",
    usableWidthMm: "5000",
  });
  storageLocation = await m.WarehouseLocation.create({
    warehouseId: warehouse._id,
    code: "ST",
    locationType: "STORAGE",
    isPickable: true,
    usableLengthMm: "5000",
    usableWidthMm: "5000",
  });
});
test.after(async () => {
  if (enabled) {
    if (!mongoose.connection.name.startsWith("wmsd_api_test_rr_guards_"))
      throw Error("Unsafe test DB");
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

const manualBody = () => ({
  creationKey: key(),
  action: "SAVE_DRAFT",
  warehouseId: String(warehouse._id),
  neededOn: "2026-12-01",
  triggerReason: "Independent need",
  lines: [
    {
      productId: String(product._id),
      enteredUnit: "PIECE",
      enteredQty: "20",
      reasonNote: "Audited need",
    },
  ],
});
run(
  "RR guards: manual warning, replay, rollback, cancellation and invisible related metadata",
  async () => {
    const body = manualBody();
    const first = await rr.createReplenishment(worker, body);
    let guard = await m.ReplenishmentLock.findOne({
      warehouseId: warehouse._id,
      productId: product._id,
    });
    assert.equal(String(guard.lastOperationId), first.operationId);
    const version = guard.version;
    assert.equal((await rr.createReplenishment(worker, body)).id, first.id);
    assert.equal(
      (await m.ReplenishmentLock.findById(guard._id)).version,
      version,
    );
    await assert.rejects(
      rr.createReplenishment(worker, { ...manualBody() }),
      (e) =>
        e.code === "ERR-RR-409-004" &&
        e.details.latestEvaluations[0].warningRequired,
    );
    assert.equal(
      (await m.ReplenishmentLock.findById(guard._id)).version,
      version,
      "rejected command rolls guard back",
    );
    const u = await m.User.create({
      username: "second-worker",
      fullName: "Second",
      passwordHash: "unused",
      roleId: worker.roleId._id,
      warehouseIds: [warehouse._id],
    });
    const second = await m.User.findById(u._id).populate({
      path: "roleId",
      populate: { path: "permissionIds" },
    });
    const b = manualBody();
    const [assessment] = await rr.evaluateReplenishment(second, b);
    assert.equal(assessment.pendingRequestCoverageQtyBase, "20");
    assert.deepEqual(assessment.relatedRequests, []);
    await assert.rejects(
      rr.createReplenishment(second, {
        ...b,
        lines: [
          {
            ...b.lines[0],
            evaluationKey: assessment.evaluationKey,
            independentNeedConfirmed: true,
          },
        ],
      }),
      (e) => e.code === "ERR-RR-409-004",
    );
    b.lines[0] = {
      ...b.lines[0],
      evaluationKey: assessment.evaluationKey,
      independentNeedConfirmed: true,
      independentNeedReason: "Separate display installation",
    };
    const created = await rr.createReplenishment(second, b);
    assert.notEqual(first.id, created.id);
    const doc = await m.ReplenishmentRequest.findById(created.id);
    assert.equal(
      doc.items[0].details.independentNeedReason,
      "Separate display installation",
    );
    await assert.rejects(
      rr.cancelReplenishment(worker, created.id, {
        ...input(),
        expectedVersion: 1,
        reason: "Wrong owner",
      }),
    );
    await rr.cancelReplenishment(second, created.id, {
      ...input(),
      expectedVersion: 1,
      reason: "No longer needed",
    });
    await rr.cancelReplenishment(worker, first.id, {
      ...input(),
      expectedVersion: 1,
      reason: "No longer needed",
    });
    assert.equal(
      (await rr.evaluateReplenishment(worker, manualBody()))[0]
        .pendingRequestCoverageQtyBase,
      "0",
    );
  },
);
run(
  "RR guards: threshold race, saved draft coverage, source aggregate cap and guard first-upsert race",
  async () => {
    await m.Product.updateOne(
      { _id: product._id },
      {
        $set: {
          stockThresholds: [
            { warehouseId: warehouse._id, minimumQty: "20", targetQty: "20" },
          ],
        },
      },
    );
    const body = manualBody();
    body.lines[0].source = { triggerType: "STOCK_THRESHOLD" };
    const [assessment] = await rr.evaluateReplenishment(worker, body);
    assert.equal(assessment.suggestedQtyBase, "20");
    body.lines[0].evaluationKey = assessment.evaluationKey;
    await m.ReplenishmentLock.deleteMany({});
    const results = await Promise.allSettled([
      rr.createReplenishment(worker, body),
      rr.createReplenishment(worker, { ...body, creationKey: key() }),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    const failure = results.find((r) => r.status === "rejected");
    assert.equal(failure.reason.code, "ERR-RR-409-004");
    const receipt = results.find((r) => r.status === "fulfilled").value;
    const guard = await m.ReplenishmentLock.findOne({
      warehouseId: warehouse._id,
      productId: product._id,
    });
    assert.equal(String(guard.lastOperationId), receipt.operationId);
    assert.equal(
      (await rr.evaluateReplenishment(worker, body))[0].suggestedQtyBase,
      "0",
    );
    await rr.cancelReplenishment(worker, receipt.id, {
      ...input(),
      expectedVersion: 1,
      reason: "Release test need",
    });
    const evalAgain = (await rr.evaluateReplenishment(worker, body))[0];
    assert.equal(evalAgain.suggestedQtyBase, "20");
    const doubled = {
      ...body,
      creationKey: key(),
      lines: [
        {
          ...body.lines[0],
          enteredQty: "15",
          quantityAdjustmentReason: "Partial",
          evaluationKey: evalAgain.evaluationKey,
        },
        {
          ...body.lines[0],
          enteredQty: "15",
          quantityAdjustmentReason: "Partial",
          evaluationKey: evalAgain.evaluationKey,
        },
      ],
    };
    await assert.rejects(
      rr.createReplenishment(worker, doubled),
      (e) => e.code === "ERR-RR-409-004",
    );
  },
);
run(
  "RR guards: SO and WIR canonical source share coverage across warehouses without changing SO version",
  async () => {
    const customer = await m.Customer.create({
      code: "C1",
      name: "Customer",
      phone: "0900000000",
    });
    const ref = await m.ExternalReference.create({
      sourceSystem: "TEST",
      referenceKind: "SALES_ORDER",
      referenceNo: "SO1",
      correlationId: key(),
    });
    const itemId = new mongoose.Types.ObjectId();
    const so = await m.SalesOrder.create({
      documentNo: "SO-TEST",
      workflowStatus: "OPEN",
      version: 1,
      createdBy: owner._id,
      header: {
        externalReferenceId: ref._id,
        customerId: customer._id,
        neededOn: new Date("2026-12-01"),
        deliveryAddressSnapshot: "Test",
      },
      items: [
        {
          _id: itemId,
          lineNo: 1,
          lineKind: "SALES_ORDER",
          productNameSnapshot: product.name,
          productId: product._id,
          enteredQty: "20",
          enteredUnit: "PIECE",
          baseUnitsPerUnit: "1",
          qtyBase: "20",
          baseUnitSnapshot: "PIECE",
          unitSellingPrice: "1",
          lineAmount: "20",
          priceRevision: 1,
          details: {
            externalReferenceId: ref._id,
            externalLineId: new mongoose.Types.ObjectId(),
          },
        },
      ],
      orderAmount: "20",
      currencyCode: "VND",
    });
    // Source access belongs to requester; Owner-created source is visible to Owner.
    const body = manualBody();
    body.lines[0].source = {
      triggerType: "SALES_SHORTAGE",
      documentType: "sales_orders",
      documentId: String(so._id),
      itemId: String(itemId),
      version: 1,
    };
    await m.SalesOrder.updateOne(
      { _id: so._id },
      { $set: { createdBy: worker._id } },
    );
    worker.roleId.permissionIds.push(
      await m.Permission.findOne({ code: "sales_order:read" }),
    );
    // Persist source-read permission to role so command reload sees the same scope.
    await m.Role.updateOne(
      { _id: worker.roleId._id },
      {
        $addToSet: {
          permissionIds: worker.roleId.permissionIds.map((p) => p._id),
        },
      },
    );
    const soEvaluation = (await rr.evaluateReplenishment(worker, body))[0];
    const wirItemId = new mongoose.Types.ObjectId();
    const wir = await m.WarehouseIssueRequest.create({
      documentNo: "WIR-TEST",
      workflowStatus: "OPEN",
      version: 1,
      createdBy: worker._id,
      header: {
        salesOrderId: so._id,
        requestedWarehouseId: warehouse._id,
        neededOn: new Date("2026-12-01"),
        deliveryAddressSnapshot: "Test",
      },
      items: [
        {
          _id: wirItemId,
          lineNo: 1,
          lineKind: "ISSUE_REQUEST",
          productNameSnapshot: product.name,
          productId: product._id,
          enteredQty: "20",
          enteredUnit: "PIECE",
          baseUnitsPerUnit: "1",
          qtyBase: "20",
          baseUnitSnapshot: "PIECE",
          details: { salesOrderLineId: itemId, releaseKey: key() },
        },
      ],
    });
    const viaWir = {
      ...body,
      lines: [
        {
          ...body.lines[0],
          source: {
            triggerType: "SALES_SHORTAGE",
            documentType: "warehouse_issue_requests",
            documentId: String(wir._id),
            itemId: String(wirItemId),
            version: 1,
          },
        },
      ],
    };
    const wirEvaluation = (await rr.evaluateReplenishment(worker, viaWir))[0];
    assert.equal(wirEvaluation.canonicalKey, soEvaluation.canonicalKey);
    body.lines[0].evaluationKey = soEvaluation.evaluationKey;
    const created = await rr.createReplenishment(worker, body);
    const after = await m.SalesOrder.findById(so._id);
    assert.equal(after.version, 1);
    assert.ok(after.replenishmentPlanningVersion > 0);
    const doc = await m.ReplenishmentRequest.findById(created.id);
    assert.equal(
      doc.items[0].details.canonicalSourceKey,
      "SO:" + so._id + ":" + itemId,
    );
    const other = await m.Warehouse.create({
      code: "OTHER",
      name: "Other warehouse",
      lengthMm: "1000",
      widthMm: "1000",
      clearHeightMm: "1000",
    });
    await m.User.updateOne(
      { _id: worker._id },
      { $push: { warehouseIds: other._id } },
    );
    worker.warehouseIds.push(other._id);
    assert.equal(
      (await rr.evaluateReplenishment(worker, viaWir))[0].suggestedQtyBase,
      "0",
    );
    const cross = { ...body, warehouseId: String(other._id) };
    assert.equal(
      (await rr.evaluateReplenishment(worker, cross))[0].suggestedQtyBase,
      "0",
    );
  },
);

run(
  "RR guards: stale evaluation retains draft and fresh confirmation submits before partial approval",
  async () => {
    const ownProduct = await m.Product.create({
      sku: "LIFECYCLE",
      name: "Lifecycle tile",
      manufacturerCode: "TEST",
      categoryId: product.categoryId,
      color: "White",
      baseUnit: "PIECE",
      wholeBaseUnits: true,
      lengthMm: "600",
      widthMm: "600",
      heightMm: "10",
      stockThresholds: [
        { warehouseId: warehouse._id, minimumQty: "20", targetQty: "20" },
      ],
    });
    const body = manualBody();
    body.lines[0] = {
      ...body.lines[0],
      productId: String(ownProduct._id),
      source: { triggerType: "STOCK_THRESHOLD" },
    };
    body.lines[0].evaluationKey = (
      await rr.evaluateReplenishment(worker, body)
    )[0].evaluationKey;
    const created = await rr.createReplenishment(worker, body);
    await m.Product.updateOne(
      { _id: ownProduct._id },
      { $set: { "stockThresholds.0.targetQty": "30" } },
    );
    await assert.rejects(
      rr.submitReplenishment(worker, created.id, {
        ...input(),
        expectedVersion: 1,
      }),
      (e) => e.code === "ERR-RR-409-004",
    );
    let document = await m.ReplenishmentRequest.findById(created.id);
    assert.equal(document.workflowStatus, "DRAFT");
    assert.equal(document.version, 1);
    const assessment = (
      await rr.evaluateReplenishment(worker, {
        warehouseId: body.warehouseId,
        neededOn: body.neededOn,
        requestId: created.id,
        lines: body.lines,
      })
    )[0];
    const submitted = await rr.submitReplenishment(worker, created.id, {
      ...input(),
      expectedVersion: 1,
      evaluations: [
        {
          lineId: String(document.items[0]._id),
          evaluationKey: assessment.evaluationKey,
          quantityAdjustmentReason: "Only twenty needed this week",
        },
      ],
    });
    document = await m.ReplenishmentRequest.findById(created.id);
    assert.equal(document.submissions.length, 1);
    assert.equal(
      document.submissions[0].lines[0].evaluation.source.triggerType,
      "STOCK_THRESHOLD",
    );
    const decision = await rr.reviewReplenishment(owner, created.id, {
      ...input(),
      expectedVersion: submitted.version,
      decision: "APPROVE",
      reason: "Approve ten initially",
      lines: [{ lineId: String(document.items[0]._id), approvedQtyBase: "10" }],
    });
    assert.equal(
      (await rr.evaluateReplenishment(worker, body))[0]
        .pendingRequestCoverageQtyBase,
      "10",
    );
    await assert.rejects(
      rr.cancelReplenishment(worker, created.id, {
        ...input(),
        expectedVersion: decision.version,
        reason: "Not authorized",
      }),
    );
    await rr.cancelReplenishment(owner, created.id, {
      ...input(),
      expectedVersion: decision.version,
      reason: "Cancel approval before PO",
    });
    assert.equal(
      (await rr.evaluateReplenishment(worker, body))[0]
        .pendingRequestCoverageQtyBase,
      "0",
    );
  },
);

run(
  "RR HTTP evaluation is read-only and line notes are optional through create, update and submit",
  async () => {
    const ownProduct = await m.Product.create({
      sku: "HTTP-RR",
      name: "HTTP tile",
      manufacturerCode: "TEST",
      categoryId: product.categoryId,
      color: "White",
      baseUnit: "PIECE",
      wholeBaseUnits: true,
      lengthMm: "600",
      widthMm: "600",
      heightMm: "10",
      stockThresholds: [
        { warehouseId: warehouse._id, minimumQty: "20", targetQty: "20" },
      ],
    });
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const api = async (path, user, body, method = "POST") => {
      const r = await fetch(
        "http://127.0.0.1:" +
          server.address().port +
          "/api/replenishments" +
          path,
        {
          method,
          headers: {
            "content-type": "application/json",
            ...(user && {
              authorization:
                "Bearer " +
                jwt.sign(
                  { userId: String(user._id) },
                  process.env.JWT_SECRET ||
                    "wmsd_default_super_secret_jwt_key_2026",
                ),
            }),
          },
          body: JSON.stringify(body),
        },
      );
      return { status: r.status, body: await r.json() };
    };
    try {
      const request = {
        warehouseId: String(warehouse._id),
        neededOn: "2026-12-01",
        lines: [
          {
            productId: String(ownProduct._id),
            source: { triggerType: "STOCK_THRESHOLD" },
          },
        ],
      };
      assert.equal((await api("/evaluate", null, request)).status, 401);
      const before = {
        rr: await m.ReplenishmentRequest.countDocuments({}),
        lock: await m.ReplenishmentLock.countDocuments({}),
        operation: await m.OperationRecord.countDocuments({}),
      };
      const evaluation = await api("/evaluate", worker, request);
      assert.equal(evaluation.status, 200);
      assert.equal(evaluation.body.data[0].suggestedQtyBase, "20");
      assert.deepEqual(
        {
          rr: await m.ReplenishmentRequest.countDocuments({}),
          lock: await m.ReplenishmentLock.countDocuments({}),
          operation: await m.OperationRecord.countDocuments({}),
        },
        before,
      );
      assert.equal(
        (
          await api("/evaluate", worker, {
            ...request,
            lines: [{ ...request.lines[0], availableQtyBase: "999" }],
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await api("/evaluate", worker, {
            ...request,
            lines: [
              {
                ...request.lines[0],
                source: {
                  triggerType: "SALES_SHORTAGE",
                  documentType: "products",
                  documentId: String(ownProduct._id),
                  itemId: key(),
                  version: 1,
                },
              },
            ],
          })
        ).status,
        400,
      );
      const line = {
        productId: String(ownProduct._id),
        enteredUnit: "PIECE",
        enteredQty: "20",
        source: { triggerType: "STOCK_THRESHOLD" },
        evaluationKey: evaluation.body.data[0].evaluationKey,
      };
      const { action, creationKey, warehouseId, neededOn, triggerReason } =
        manualBody();
      const header = { warehouseId, neededOn, triggerReason };
      const body = { ...header, action, creationKey, lines: [line] };
      assert.equal(
        (await api("", worker, { ...body, triggerReason: undefined })).status,
        400,
      );
      for (const reasonNote of ["   ", "x".repeat(2001)]) {
        assert.equal(
          (await api("", worker, { ...body, lines: [{ ...line, reasonNote }] }))
            .status,
          400,
        );
      }
      assert.equal(
        (
          await api("", worker, {
            ...body,
            lines: [{ ...line, enteredQty: "19" }],
          })
        ).status,
        409,
      );
      const created = await api("", worker, body);
      assert.equal(created.status, 201);
      const id = created.body.data.id;
      const draft = await m.ReplenishmentRequest.findById(id);
      assert.equal(draft.items[0].details.reasonNote, undefined);
      const editEvaluation = await api("/evaluate", worker, {
        ...request,
        requestId: id,
      });
      assert.equal(editEvaluation.status, 200);
      const editLine = {
        ...line,
        id: String(draft.items[0]._id),
        evaluationKey: editEvaluation.body.data[0].evaluationKey,
      };
      assert.equal(
        (
          await api(
            "/" + id,
            worker,
            { ...header, ...input(), expectedVersion: 1, lines: [editLine] },
            "PUT",
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await api("/" + id + "/cancel", worker, {
            ...input(),
            expectedVersion: 1,
            reason: "stale",
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await api("/" + id + "/submit", worker, {
            ...input(),
            expectedVersion: 2,
          })
        ).status,
        200,
      );
      const submitted = await m.ReplenishmentRequest.findById(id);
      assert.equal(submitted.workflowStatus, "SUBMITTED");
      assert.equal(submitted.submissions[0].lines[0].reasonNote, undefined);
      assert.equal(
        (
          await api("/" + id + "/cancel", worker, {
            ...input(),
            expectedVersion: 3,
            reason: "No longer needed",
          })
        ).status,
        200,
      );

      const direct = await api("", worker, {
        ...body,
        creationKey: key(),
        action: "SUBMIT",
        lines: [{ ...line, source: { triggerType: "MANUAL_OTHER" } }],
      });
      assert.equal(direct.status, 201);
      const directId = direct.body.data.id;
      const directSubmission = await m.ReplenishmentRequest.findById(directId);
      assert.equal(directSubmission.workflowStatus, "SUBMITTED");
      assert.equal(
        directSubmission.submissions[0].lines[0].reasonNote,
        undefined,
      );
      assert.equal(
        (
          await api("/" + directId + "/cancel", worker, {
            ...input(),
            expectedVersion: 1,
            reason: "No longer needed",
          })
        ).status,
        200,
      );

      const notedLine = {
        ...line,
        source: { triggerType: "MANUAL_OTHER" },
        reasonNote: "  Existing note  ",
      };
      const noted = await api("", worker, {
        ...body,
        creationKey: key(),
        lines: [notedLine],
      });
      assert.equal(noted.status, 201);
      const notedId = noted.body.data.id;
      const notedDraft = await m.ReplenishmentRequest.findById(notedId);
      const { reasonNote, ...unchangedLine } = notedLine;
      assert.equal(notedDraft.items[0].details.reasonNote, reasonNote.trim());
      assert.equal(
        (
          await api(
            "/" + notedId,
            worker,
            {
              ...header,
              ...input(),
              expectedVersion: 1,
              lines: [
                { ...unchangedLine, id: String(notedDraft.items[0]._id) },
              ],
            },
            "PUT",
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await api("/" + notedId + "/submit", worker, {
            ...input(),
            expectedVersion: 2,
          })
        ).status,
        200,
      );
      const notedSubmission = await m.ReplenishmentRequest.findById(notedId);
      assert.equal(
        notedSubmission.submissions[0].lines[0].reasonNote,
        "Existing note",
      );
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  },
);

run(
  "sourced RR and partial PO preserve coverage through draft, confirmation and stale-policy review",
  async () => {
    const ownProduct = await m.Product.create({
      sku: "RR-PO",
      name: "RR PO tile",
      manufacturerCode: "TEST",
      categoryId: product.categoryId,
      color: "White",
      baseUnit: "PIECE",
      wholeBaseUnits: true,
      lengthMm: "600",
      widthMm: "600",
      heightMm: "10",
      stockThresholds: [
        { warehouseId: warehouse._id, minimumQty: "20", targetQty: "20" },
      ],
    });
    const body = manualBody();
    body.action = "SUBMIT";
    body.lines[0] = {
      ...body.lines[0],
      productId: String(ownProduct._id),
      source: { triggerType: "STOCK_THRESHOLD" },
    };
    body.lines[0].evaluationKey = (
      await rr.evaluateReplenishment(worker, body)
    )[0].evaluationKey;
    const created = await rr.createReplenishment(worker, body);
    let request = await m.ReplenishmentRequest.findById(created.id);
    await rr.reviewReplenishment(owner, created.id, {
      ...input(),
      expectedVersion: 1,
      decision: "APPROVE",
      reason: "Approve fifteen",
      lines: [{ lineId: String(request.items[0]._id), approvedQtyBase: "15" }],
    });
    request = await m.ReplenishmentRequest.findById(created.id);
    const purchaseInput = {
      creationKey: key(),
      warehouseId: body.warehouseId,
      supplierId: String(supplier._id),
      expectedOn: "2026-11-30",
      currency: "VND",
      lines: [
        {
          rrLineId: String(request.items[0]._id),
          approvalId: String(request.header.latestDecisionId),
          enteredQty: "10",
          unitPurchasePrice: "1000",
        },
      ],
    };
    const purchase = await po.createPurchaseOrder(accountant, purchaseInput);
    let evaluated = (await rr.evaluateReplenishment(worker, body))[0];
    assert.equal(evaluated.pendingRequestCoverageQtyBase, "15");
    assert.equal(evaluated.suggestedQtyBase, "5");
    await m.Product.updateOne(
      { _id: ownProduct._id },
      { $set: { "stockThresholds.0.targetQty": "25" } },
    );
    let conflict;
    try {
      await po.confirmPurchaseOrder(accountant, purchase.id, {
        ...input(),
        expectedVersion: 1,
      });
    } catch (error) {
      conflict = error;
    }
    assert.equal(conflict?.code, "ERR-RR-409-004");
    assert.equal(
      (await m.PurchaseOrder.findById(purchase.id)).workflowStatus,
      "DRAFT",
    );
    const latest = conflict.details.latestEvaluations[0];
    await po.confirmPurchaseOrder(accountant, purchase.id, {
      ...input(),
      expectedVersion: 1,
      evaluations: [
        {
          lineId: String(request.items[0]._id),
          evaluationKey: latest.evaluationKey,
        },
      ],
    });
    evaluated = (await rr.evaluateReplenishment(worker, body))[0];
    assert.equal(evaluated.pendingRequestCoverageQtyBase, "5");
    assert.equal(evaluated.incomingCoverageQtyBase, "10");
    assert.equal(evaluated.suggestedQtyBase, "10");
  },
);
