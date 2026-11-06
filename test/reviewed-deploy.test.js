import test from "node:test";
import assert from "node:assert/strict";
import { planReviewedDeployment } from "../src/migrations/rebuild/deploy.js";

const source = {
  products: [{ _id: "p1", name: "Gạch trắng" }],
  product_batches: [{ _id: "l1", piecesPerCarton: 4 }],
};
const expected = Object.keys(source);
test("deployment allows an empty target or empty collections from an interrupted setup", () => {
  assert.equal(planReviewedDeployment(source, {}, expected).action, "CREATE");
  assert.equal(
    planReviewedDeployment(source, { products: [] }, expected).action,
    "CREATE",
  );
});
test("deployment rerun verifies identical data without inserting it twice", () => {
  assert.equal(
    planReviewedDeployment(source, structuredClone(source), expected).action,
    "VERIFY_ONLY",
  );
});
test("deployment refuses populated targets with different values, missing or unknown collections", () => {
  const changed = structuredClone(source);
  changed.product_batches[0].piecesPerCarton = 5;
  assert.throws(
    () => planReviewedDeployment(source, changed, expected),
    /TARGET_HAS_DIFFERENT_DATA/,
  );
  assert.throws(
    () =>
      planReviewedDeployment(source, { products: source.products }, expected),
    /TARGET_HAS_DIFFERENT_DATA/,
  );
  assert.throws(
    () => planReviewedDeployment(source, { other_data: [] }, expected),
    /TARGET_HAS_UNEXPECTED_COLLECTIONS/,
  );
});
