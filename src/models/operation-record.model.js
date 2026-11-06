import {
  Schema,
  options,
  text,
  ref,
  code,
  integer,
  date,
  appendOnly,
} from "./model-utils.js";
import { optional, subject } from "./schema-helpers.js";

import { createSourceReferenceSchema } from "./source-reference.schema.js";

// Collection: operation_records
export function createOperationRecordSchema() {
  const operations = new Schema(
    {
      actorType: code(["USER", "SYSTEM"]),
      actorId: ref("User", false),
      operationCode: text(100),
      requestKey: text(160),
      requestHash: text(64, { match: /^[a-f\d]{64}$/i }),
      operationKey: text(200),
      ...subject(),
      versionBefore: integer(0),
      versionAfter: integer(1),
      resultRefs: [createSourceReferenceSchema()],
      resultCode: text(60),
      completedAt: date(),
      stockTransactionId: ref("StockTransaction", false),
      decisionId: ref("ApprovalHistory", false),
      correlationId: optional(160),
    },
    options("operation_records"),
  );
  operations.index(
    { actorType: 1, actorId: 1, operationCode: 1, requestKey: 1 },
    { unique: true },
  );
  operations.index({ operationKey: 1 }, { unique: true });
  appendOnly(operations);
  return operations;
}
