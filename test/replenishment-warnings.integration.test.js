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
const enabled = process.env.RUN_NATIVE_API_TESTS === "1";
const run = (name, fn) => test(name, { skip: !enabled }, fn);
let owner,
  worker,
  accountant,
  warehouse,
  product,
  supplier,
  server;
const key = () => new mongoose.Types.ObjectId().toString();
const input = () => ({ operationKey: key() });
test.before(async () => {
  if (!enabled) return;
  // A new isolated test database each run. Never use the application's URI.
  await mongoose.connect(
    "mongodb://127.0.0.1:27017/wmsd_api_test_rr_warnings_" +
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
          .filter((p) => ROLE_PERMISSIONS[code].includes(p.code) ||
          (code === "OWNER" && p.code === "replenishment_request:create"))
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
  supplier = await m.Supplier.create({
    code: "SUP",
    name: "Supplier",
    status: "ACTIVE",
  });
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
});
test.after(async () => {
  if (enabled) {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (!mongoose.connection.name.startsWith("wmsd_api_test_rr_warnings_"))
      throw Error("Unsafe test DB");
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

test.beforeEach(async () => {
  if (!enabled) return;
  await m.PurchaseOrder.deleteMany({});
  await m.ReplenishmentRequest.deleteMany({});
});

const rr = "/replenishments";
const po = "/purchase-orders";
const accepted = { independentNeedConfirmed: true, independentNeedReason: "Nhu cầu mua riêng" };
const deprecated = { evaluationKey: "0".repeat(64), quantityAdjustmentReason: "Old client" };
const draft = (fields = {}) => ({
  creationKey: key(),
  action: "SAVE_DRAFT",
  warehouseId: String(warehouse._id),
  neededOn: "2026-12-01",
  triggerReason: "Bổ sung hàng",
  lines: [{ productId: String(product._id), enteredUnit: "PIECE", enteredQty: "20" }],
  ...fields,
});

async function api(path, actor, body, method = "POST") {
  const token = actor && jwt.sign(
    { userId: String(actor._id) },
    process.env.JWT_SECRET || "wmsd_default_super_secret_jwt_key_2026",
  );
  const response = await fetch("http://127.0.0.1:" + server.address().port + "/api" + path, {
    method,
    headers: { "content-type": "application/json", ...(token && { authorization: "Bearer " + token }) },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

async function create(body = draft(), actor = worker) {
  const result = await api(rr, actor, body);
  assert.equal(result.status, 201, JSON.stringify(result.body));
  return m.ReplenishmentRequest.findById(result.body.data.id);
}

function decision(document, approvedQtyBase = "10") {
  return {
    ...input(), expectedVersion: document.version,
    decision: "APPROVE", reason: "Đã kiểm tra nhu cầu",
    lines: [{ lineId: String(document.items[0]._id), approvedQtyBase }],
  };
}

function purchaseForm(document, approvalId, enteredQty) {
  return {
    creationKey: key(),
    warehouseId: String(warehouse._id), supplierId: String(supplier._id), currency: "VND",
    expectedOn: "2026-12-15T00:00:00Z",
    lines: [{ rrLineId: String(document.items[0]._id), approvalId, enteredQty, unitPurchasePrice: "10" }],
  };
}

function warningConflict(result) {
  assert.equal(result.status, 409, JSON.stringify(result.body));
  assert.equal(result.body.code, "ERR-RR-409-004");
  assert.equal(result.body.details.requiresReview, true);
  assert.deepEqual(result.body.details.invalidLines.map((line) => line.lineNo), [1]);
  assert.deepEqual(result.body.details.latestEvaluations[0].warnings, ["OPEN_REQUEST"]);
}

run("HTTP preview is read-only and a sourced draft needs acknowledgment when an RR is open", async () => {
  await create(draft(), owner);
  const body = draft();
  Object.assign(body.lines[0], { enteredQty: "9000", source: { triggerType: "STOCK_THRESHOLD" }, ...deprecated });
  const preview = {
    warehouseId: body.warehouseId, neededOn: body.neededOn,
    lines: [{ productId: body.lines[0].productId, source: body.lines[0].source }],
  };
  assert.equal((await api(rr + "/evaluate", null, preview)).status, 401);
  const operationCount = await m.OperationRecord.countDocuments({});
  const evaluated = await api(rr + "/evaluate", worker, preview);
  assert.equal(evaluated.status, 200, JSON.stringify(evaluated.body));
  assert.deepEqual(evaluated.body.data[0].warnings, ["OPEN_REQUEST"]);
  assert.equal(evaluated.body.data[0].pendingRequestQtyBase, "20");
  assert.deepEqual(evaluated.body.data[0].relatedRequests, []);
  assert.equal(await m.OperationRecord.countDocuments({}), operationCount);
  assert.equal(await m.ReplenishmentRequest.countDocuments({}), 1);

  warningConflict(await api(rr, worker, body));
  warningConflict(await api(rr, worker, {
    ...body, lines: [{ ...body.lines[0], independentNeedConfirmed: true }],
  }));
  const saved = await create({ ...body, lines: [{ ...body.lines[0], ...accepted, reasonNote: "Lý do đã lưu" }] });
  assert.equal(String(saved.items[0].qtyBase), "9000");
  assert.equal(saved.items[0].details.evaluationKey, undefined);
  assert.equal(saved.items[0].details.quantityAdjustmentReason, undefined);
  assert.equal(saved.items[0].details.canonicalSourceKey, undefined);
  assert.equal(String(saved.items[0].details.pendingRequestCoverageQtySnapshot), "20");

  const { action, creationKey, ...form } = body;
  const edit = { ...form, ...input(), expectedVersion: saved.version,
    lines: [{ ...body.lines[0], id: String(saved.items[0]._id), enteredQty: "2" }] };
  warningConflict(await api(rr + "/" + saved._id, worker, edit, "PUT"));
  Object.assign(edit.lines[0], accepted);
  assert.equal((await api(rr + "/" + saved._id, worker, edit, "PUT")).status, 200);
  assert.equal((await m.ReplenishmentRequest.findById(saved._id)).items[0].details.reasonNote, "Lý do đã lưu");
});

run("updating an existing line keeps the selected source document and item", async () => {
  async function salesSource() {
    const order = await m.SalesOrder.create({
      documentNo: "SO-" + key(), workflowStatus: "OPEN", version: 1, createdBy: worker._id,
      header: { externalReferenceId: key(), customerId: key(), neededOn: new Date("2026-12-01"), deliveryAddressSnapshot: "Test address" },
      items: [{ lineNo: 1, lineKind: "STANDARD", productId: product._id,
        enteredUnit: "PIECE", baseUnitSnapshot: "PIECE", baseUnitsPerUnit: "1",
        enteredQty: "1", qtyBase: "1", productNameSnapshot: product.name, unitSellingPrice: "0", lineAmount: "0" }],
      orderAmount: "0", currencyCode: "VND",
    });
    return { triggerType: "SALES_SHORTAGE", documentType: "sales_orders", documentId: String(order._id),
      itemId: String(order.items[0]._id), version: order.version };
  }
  const body = draft();
  const source = await salesSource();
  const saved = await create({ ...body, lines: [{ ...body.lines[0], source }] });
  const edit = {
    ...input(), expectedVersion: saved.version, warehouseId: body.warehouseId,
    neededOn: body.neededOn, triggerReason: body.triggerReason,
    lines: [{ ...body.lines[0], id: String(saved.items[0]._id), source: await salesSource() }],
  };
  const path = rr + "/" + saved._id;
  const switched = await api(path, worker, edit, "PUT");
  assert.equal(switched.status, 400, JSON.stringify(switched.body));
  assert.match(switched.body.message, /Không đổi nguồn/);
  edit.lines[0].source = source;
  assert.equal((await api(path, worker, edit, "PUT")).status, 200);
  const { source: _dropped, ...manualLine } = edit.lines[0];
  const toManual = await api(path, worker, { ...edit, ...input(), expectedVersion: saved.version + 1, lines: [manualLine] }, "PUT");
  assert.equal(toManual.status, 400, JSON.stringify(toManual.body));
  assert.match(toManual.body.message, /Không đổi nguồn/);

  const manual = await create(draft({ lines: [{ ...body.lines[0], ...accepted }] }));
  const linked = await salesSource();
  const attached = await api(rr + "/" + manual._id, worker, {
    ...input(), expectedVersion: manual.version, warehouseId: body.warehouseId,
    neededOn: body.neededOn, triggerReason: body.triggerReason,
    lines: [{ ...body.lines[0], id: String(manual.items[0]._id), source: linked, ...accepted }],
  }, "PUT");
  assert.equal(attached.status, 200, JSON.stringify(attached.body));
  const reloaded = await m.ReplenishmentRequest.findById(manual._id);
  assert.equal(reloaded.items[0].details.triggerType, "SALES_SHORTAGE");
  assert.equal(String(reloaded.items[0].details.source.documentId), linked.documentId);
});

run("submit reevaluates the saved lines and persists confirmation and snapshots", async () => {
  const document = await create();
  await create(draft({ lines: [{ ...draft().lines[0], ...accepted }] }));
  const path = rr + "/" + document._id + "/submit";
  const submit = { ...input(), expectedVersion: document.version };
  warningConflict(await api(path, worker, submit));
  assert.equal((await m.ReplenishmentRequest.findById(document._id)).workflowStatus, "DRAFT");

  const result = await api(path, worker, {
    ...submit, evaluations: [{ lineId: String(document.items[0]._id), ...accepted, ...deprecated }],
  });
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.data.workflowStatus, "SUBMITTED");
  const saved = await m.ReplenishmentRequest.findById(document._id);
  assert.equal(saved.items[0].details.independentNeedReason, accepted.independentNeedReason);
  assert.equal(String(saved.submissions[0].lines[0].evaluation.pendingRequestCoverageQtySnapshot), "20");
  assert.equal(saved.submissions[0].lines[0].evaluation.evaluationKey, undefined);
  assert.equal(saved.submissions[0].lines[0].reasonNote, undefined);
});

run("review skips new warnings and keeps quantity and separation-of-duties checks", async () => {
  const document = await create(draft({ action: "SUBMIT" }));
  const own = await create(draft({ action: "SUBMIT", lines: [{ ...draft().lines[0], ...accepted }] }), owner);
  const reviewPath = (id) => rr + "/" + id + "/review";
  const self = await api(reviewPath(own._id), owner, decision(own));
  assert.equal(self.status, 403, JSON.stringify(self.body));
  assert.match(self.body.message, /khác người lập/);

  const excessive = await api(reviewPath(document._id), owner, decision(document, "21"));
  assert.equal(excessive.status, 400, JSON.stringify(excessive.body));
  assert.match(excessive.body.message, /vượt lượng đề nghị/);
  const preview = await api(rr + "/evaluate", owner, {
    warehouseId: String(warehouse._id), neededOn: "2026-12-01", requestId: String(document._id),
    lines: [{ productId: String(product._id) }],
  });
  assert.deepEqual(preview.body.data[0].warnings, ["OPEN_REQUEST"]);

  const approved = await api(reviewPath(document._id), owner, decision(document));
  assert.equal(approved.status, 200, JSON.stringify(approved.body));
  assert.equal(approved.body.data.workflowStatus, "APPROVED");
});

run("creation and cancellation replay their original receipts", async () => {
  const body = draft();
  const document = await create(body);
  const replay = await api(rr, worker, body);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.data.id, String(document._id));
  assert.equal(replay.body.data.replayed, true);

  const cancelPath = rr + "/" + document._id + "/cancel";
  const cancellation = { ...input(), expectedVersion: document.version, reason: "Đã xử lý nhu cầu" };
  const cancelled = await api(cancelPath, worker, cancellation);
  assert.equal(cancelled.body.data.workflowStatus, "CANCELLED");
  const repeated = await api(cancelPath, worker, cancellation);
  assert.equal(repeated.body.data.operationId, cancelled.body.data.operationId);
  assert.equal(repeated.body.data.replayed, true);
});

run("PO draft, edit and issue honor approved quantities with new RR warnings present", async () => {
  const document = await create(draft({ action: "SUBMIT" }));
  const approval = await api(rr + "/" + document._id + "/review", owner, decision(document));
  assert.equal(approval.status, 200, JSON.stringify(approval.body));
  await create(draft({ lines: [{ ...draft().lines[0], ...accepted }] }));
  const form = purchaseForm(document, approval.body.data.decisionId, "11");
  const excessive = await api(po, accountant, form);
  assert.equal(excessive.status, 400, JSON.stringify(excessive.body));
  form.lines[0].enteredQty = "8";
  const created = await api(po, accountant, form);
  assert.equal(created.status, 200, JSON.stringify(created.body));
  const { creationKey, ...draftForm } = form;
  const poPath = po + "/" + created.body.data.id;
  const updated = await api(poPath, accountant, {
    ...draftForm, ...input(), expectedVersion: created.body.data.version,
    evaluations: [{ lineId: String(document.items[0]._id), evaluationKey: "ignored" }],
  }, "PUT");
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  const issued = await api(poPath + "/confirm", accountant, {
    ...input(), expectedVersion: updated.body.data.version,
  });
  assert.equal(issued.status, 200, JSON.stringify(issued.body));
  assert.equal(issued.body.data.workflowStatus, "OPEN");
});

run("a concurrent PO creation and approved RR cancellation cannot both commit", async () => {
  const document = await create(draft({ action: "SUBMIT" }));
  const path = rr + "/" + document._id;
  const approval = await api(path + "/review", owner, decision(document));
  assert.equal(approval.status, 200, JSON.stringify(approval.body));
  const [created, cancelled] = await Promise.all([
    api(po, accountant, purchaseForm(document, approval.body.data.decisionId, "10")),
    api(path + "/cancel", owner, {
      ...input(), expectedVersion: approval.body.data.version, reason: "Không còn cần mua",
    }),
  ]);
  assert.equal(Number(created.status === 200) + Number(cancelled.status === 200), 1);
  const saved = await m.ReplenishmentRequest.findById(document._id);
  assert.equal(await m.PurchaseOrder.countDocuments({ replenishmentRequestId: document._id }), created.status === 200 ? 1 : 0);
  assert.equal(saved.workflowStatus, cancelled.status === 200 ? "CANCELLED" : "APPROVED");
});
