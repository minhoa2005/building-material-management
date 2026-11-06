import mongoose from "mongoose";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { registerReviewedModels } from "../src/models/index.js";
import {
  LOCAL_DEMO_DATABASE,
  LOCAL_SEED_URI,
  isLoopbackMongoUri,
} from "../src/config/local-mongo.js";
import {
  readDemoSnapshot,
  seedFingerprint,
  verifyDemoDatabase,
} from "../src/seeds/rebuild/database.js";
import { validateReviewedDemo } from "../src/seeds/rebuild/validate.js";
import {
  DeploymentGuardError,
  deploymentIndexes,
  planReviewedDeployment,
  verifyDeploymentIndexes,
} from "../src/migrations/rebuild/deploy.js";

async function main() {
  const options = {};
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (["--apply", "--verify"].includes(key)) options[key] = true;
    else if (
      ["--source", "--target", "--report"].includes(key) &&
      args[i + 1] &&
      !args[i + 1].startsWith("--")
    )
      options[key] = args[++i];
    else throw new DeploymentGuardError("INVALID_ARGUMENT");
  }
  if (options["--apply"] && options["--verify"])
    throw new DeploymentGuardError("CHOOSE_APPLY_OR_VERIFY");
  const targetName = options["--target"];
  if (targetName !== "wmsd_database")
    throw new DeploymentGuardError("UNAPPROVED_TARGET_NAME");
  if (!process.env.MONGODB_TARGET_URI)
    throw new DeploymentGuardError("MONGODB_TARGET_URI_REQUIRED");
  const sourceUri = process.env.MONGODB_SOURCE_URI || LOCAL_SEED_URI;
  if (!isLoopbackMongoUri(sourceUri))
    throw new DeploymentGuardError("SOURCE_MUST_BE_LOCAL");
  const sourceName = options["--source"] || LOCAL_DEMO_DATABASE;
  if (!/^wmsd_demo_[a-z0-9_]+$/.test(sourceName))
    throw new DeploymentGuardError("SOURCE_MUST_BE_DEMO_DATABASE");
  const sourceClient = new mongoose.mongo.MongoClient(sourceUri, {
    serverSelectionTimeoutMS: 12000,
  });
  const targetClient = new mongoose.mongo.MongoClient(
    process.env.MONGODB_TARGET_URI,
    { serverSelectionTimeoutMS: 12000 },
  );
  const connection = mongoose.createConnection();
  const models = registerReviewedModels(connection);
  try {
    await sourceClient.connect();
    const source = await verifyDemoDatabase(
      sourceClient,
      sourceClient.db(sourceName),
      models,
    );
    await targetClient.connect();
    const targetDb = targetClient.db(targetName);
    const names = (
      await targetDb.listCollections({}, { nameOnly: true }).toArray()
    ).map((row) => row.name);
    if (names.some((name) => !models.has(name)))
      throw new DeploymentGuardError("TARGET_HAS_UNEXPECTED_COLLECTIONS");
    const current = {};
    for (const name of names)
      current[name] = await targetDb.collection(name).find({}).toArray();
    const plan = planReviewedDeployment(source.data, current, [
      ...models.keys(),
    ]);
    let status = "PREVIEW";
    if (options["--verify"] && plan.action !== "VERIFY_ONLY")
      throw new DeploymentGuardError("TARGET_NOT_DEPLOYED");
    if (options["--apply"] && plan.action === "CREATE") {
      const hello = await targetDb.admin().command({ hello: 1 });
      if (!hello.setName && hello.msg !== "isdbgrid")
        throw new DeploymentGuardError("TARGET_REQUIRES_TRANSACTIONS");
      for (const [name, Model] of models) {
        if (!names.includes(name)) await targetDb.createCollection(name);
        const indexes = deploymentIndexes(Model.schema);
        if (indexes.length)
          await targetDb.collection(name).createIndexes(indexes);
      }
      const session = targetClient.startSession();
      try {
        await session.withTransaction(
          async () => {
            // Recheck after index preparation; concurrent writers must not be overwritten.
            for (const name of models.keys()) {
              if (
                await targetDb.collection(name).countDocuments({}, { session })
              )
                throw new DeploymentGuardError(
                  "TARGET_CHANGED_DURING_DEPLOYMENT",
                );
            }
            for (const [name, rows] of Object.entries(source.data)) {
              if (rows.length)
                await targetDb.collection(name).insertMany(rows, { session });
            }
          },
          {
            readConcern: { level: "snapshot" },
            writeConcern: { w: "majority" },
          },
        );
      } finally {
        await session.endSession();
      }
      status = "DEPLOYED";
    } else if (plan.action === "VERIFY_ONLY") status = "ALREADY_DEPLOYED";
    let validation = source.validation;
    if (status !== "PREVIEW") {
      const target = await readDemoSnapshot(targetClient, targetDb, models);
      if (seedFingerprint(target.data) !== plan.sourceHash)
        throw new DeploymentGuardError("READBACK_HASH_MISMATCH");
      validation = await validateReviewedDemo(target.data, models);
      await verifyDeploymentIndexes(targetDb, models);
      if (options["--verify"]) status = "VERIFIED";
    }
    const report = {
      status,
      sourceDatabase: sourceName,
      targetDatabase: targetName,
      sourceHash: plan.sourceHash,
      validation,
      recordedAt: new Date().toISOString(),
      applicationStatus:
        "Legacy APIs have not been ported; application connection unchanged",
    };
    if (options["--report"]) {
      const file = resolve(options["--report"]);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, JSON.stringify(report, null, 2) + "\n", {
        flag: "wx",
      });
    }
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await connection.close();
    await sourceClient.close();
    await targetClient.close();
  }
}

main().catch((error) => {
  // Driver messages may include connection strings. Never print them.
  console.error(
    "Reviewed DB deployment failed:",
    error.name,
    error instanceof DeploymentGuardError
      ? error.code
      : String(error.code || "CHECK_CONNECTION_OR_SERVER"),
  );
  process.exitCode = 1;
});
