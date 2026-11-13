import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { subscribe, unsubscribe } from "node:diagnostics_channel";
import { transaction, dto } from "../src/shared/utils/persistence.js";

const enabled = process.env.RUN_NATIVE_API_TESTS === "1";
const run = (name, fn) => test(name, { skip: !enabled }, fn);
const prefix = "wmsd_persistence_tx_test_";

test.before(async () => {
  if (!enabled) return;
  // A new isolated test database each run. Never use the application's URI.
  const isolated = process.env.RUN_HIEUDT_TESTS === "1";
  const port = isolated ? 27018 : 27017;
  const replicaSet = isolated ? "hieudt-test" : "rs0";
  await mongoose.connect(
    `mongodb://127.0.0.1:${port}/${prefix}${new mongoose.Types.ObjectId()}?replicaSet=${replicaSet}`,
    { serverSelectionTimeoutMS: 5000 },
  );
});
test.after(async () => {
  if (!enabled) return;
  if (!mongoose.connection.name.startsWith(prefix)) throw Error("Unsafe test DB");
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

function duplicate(keyValue) {
  return Object.assign(new Error("E11000 duplicate key"), { code: 11000, keyValue });
}

run("a document-number collision retries the whole transaction with a fresh session", async () => {
  const events = [];
  const listener = (message) => events.push(message);
  subscribe("wmsd.replenishment", listener);
  try {
    const sessions = [];
    const result = await transaction(async (session) => {
      sessions.push(session);
      assert.ok(session.documentNumbers instanceof Map);
      if (sessions.length === 1) throw duplicate({ _id: "YCBS-TEST-261112-000001" });
      if (sessions.length === 2) throw duplicate({ documentNo: "PO - TEST - 261112 - 000002" });
      return "committed";
    });
    assert.equal(result, "committed");
    assert.equal(sessions.length, 3);
    assert.notEqual(sessions[0], sessions[2]);
    assert.deepEqual(
      events.filter((e) => e.reason === "document_number_collision").map((e) => e.attempt),
      [1, 2],
    );
  } finally {
    unsubscribe("wmsd.replenishment", listener);
  }
});

run("other duplicate keys and errors are not retried", async () => {
  let calls = 0;
  await assert.rejects(
    transaction(async () => {
      calls++;
      throw duplicate({ username: "taken" });
    }),
    (error) => error.code === 11000,
  );
  assert.equal(calls, 1);
  await assert.rejects(transaction(async () => { calls++; throw new Error("boom"); }), /boom/);
  assert.equal(calls, 2);
});

test("dto safely returns null when row is null or undefined without throwing on _id", () => {
  assert.equal(dto(null), null);
  assert.equal(dto(undefined), null);
  const sampleId = new mongoose.Types.ObjectId("6720bf443c5f6f40b286ef10");
  assert.deepEqual(dto({ _id: sampleId, name: "sample" }), {
    id: "6720bf443c5f6f40b286ef10",
    _id: "6720bf443c5f6f40b286ef10",
    name: "sample",
  });
});
