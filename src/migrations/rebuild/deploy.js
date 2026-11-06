import { seedFingerprint } from "../../seeds/rebuild/database.js";

export class DeploymentGuardError extends Error {
  constructor(code) {
    super(code);
    this.name = "DeploymentGuardError";
    this.code = code;
  }
}

// A populated target is accepted only when it is already an exact copy.
// Never merge fixture rows into an active database or overwrite its records.
export function planReviewedDeployment(source, target, expectedCollections) {
  const names = Object.keys(target);
  if (names.some((name) => !expectedCollections.includes(name))) {
    throw new DeploymentGuardError("TARGET_HAS_UNEXPECTED_COLLECTIONS");
  }
  const sourceHash = seedFingerprint(source);
  const targetCount = Object.values(target).reduce(
    (sum, rows) => sum + rows.length,
    0,
  );
  if (!targetCount) return { action: "CREATE", sourceHash };
  if (
    names.length !== expectedCollections.length ||
    seedFingerprint(target) !== sourceHash
  ) {
    throw new DeploymentGuardError("TARGET_HAS_DIFFERENT_DATA");
  }
  return { action: "VERIFY_ONLY", sourceHash };
}

export function deploymentIndexes(schema) {
  return schema.indexes().map(([key, options]) => {
    const { _autoIndex, background, ...settings } = options;
    return { key, ...settings };
  });
}

function containsOptions(actual, expected) {
  if (expected && typeof expected === "object") {
    return Object.entries(expected).every(([key, value]) =>
      containsOptions(actual?.[key], value),
    );
  }
  return actual === expected;
}

export async function verifyDeploymentIndexes(db, models) {
  for (const [name, Model] of models) {
    const actual = await db.collection(name).listIndexes().toArray();
    for (const expected of deploymentIndexes(Model.schema)) {
      const found = actual.some(
        (index) =>
          JSON.stringify(index.key) === JSON.stringify(expected.key) &&
          Object.entries(expected).every(
            ([key, value]) =>
              key === "key" || containsOptions(index[key], value),
          ),
      );
      if (!found) throw new DeploymentGuardError("TARGET_INDEX_MISMATCH");
    }
  }
}
