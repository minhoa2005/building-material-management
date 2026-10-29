import test from "node:test";
import assert from "node:assert/strict";
import {
  createCustomerReturnSchema,
  inspectCustomerReturnSchema,
} from "../src/modules/customer-returns/customer-return.validation.js";
import { createDefectSchema } from "../src/modules/defects/defect.validation.js";

const id = "64b000000000000000000001";

test("customer return request requires unique posted-source line claims and exact positive quantities", () => {
  const valid = {
    body: {
      customerId: id,
      warehouseId: id,
      idempotencyKey: "customer-return-create-0001",
      lines: [{ salesIssueLineId: id, qtyBase: "1.250000", reason: "Unused material" }],
    },
  };
  assert.equal(createCustomerReturnSchema.safeParse(valid).success, true);
  assert.equal(createCustomerReturnSchema.safeParse({ ...valid, body: { ...valid.body, lines: [
    ...valid.body.lines, ...valid.body.lines,
  ] } }).success, false);
  assert.equal(createCustomerReturnSchema.safeParse({ ...valid, body: { ...valid.body, lines: [
    { ...valid.body.lines[0], qtyBase: "0" },
  ] } }).success, false);
});

test("warehouse inspection records each line and allows zero received quantity for a documented non-arrival", () => {
  const valid = {
    params: { id },
    body: {
      expectedVersion: 1,
      idempotencyKey: "customer-return-inspect-001",
      custodyLocationId: id,
      evidenceIds: [id],
      lines: [{
        returnLineId: id, qtyReceived: "0", packagingCondition: "UNKNOWN",
        installationStatus: "UNKNOWN", damageCause: "UNKNOWN", deadlineStatus: "UNKNOWN",
        assessmentReason: "No item was physically returned for this line.",
      }],
    },
  };
  assert.equal(inspectCustomerReturnSchema.safeParse(valid).success, true);
  assert.equal(inspectCustomerReturnSchema.safeParse({ ...valid, body: { ...valid.body, lines: [
    ...valid.body.lines, ...valid.body.lines,
  ] } }).success, false);
});

test("defect inspection requires a disposition outside stocktake and forbids it during a freeze", () => {
  const base = {
    body: {
      warehouseId: id, balanceId: id, quantity: "2", sourceKind: "MANUAL", reason: "Broken stock",
      disposition: { outcome: "SCRAP", quantity: "2", reason: "Unusable" },
    },
  };
  assert.equal(createDefectSchema.safeParse(base).success, true);
  assert.equal(createDefectSchema.safeParse({ body: {
    ...base.body, sourceKind: "STOCKTAKE", stocktakeId: id,
  } }).success, false);
  assert.equal(createDefectSchema.safeParse({ body: {
    ...base.body, disposition: undefined,
  } }).success, false);
});
