import { Schema, options, text, ref, integer } from "./model-utils.js";
import { id, documentId, version } from "./schema-helpers.js";

// Collection: return_source_locks
export function createReturnSourceLockSchema() {
  const returnLocks = new Schema(
    {
      sourceKey: text(200, { unique: true }),
      sourceKind: text(80),
      sourceDocumentId: documentId(),
      sourceItemId: id(),
      version: integer(0, { default: 0 }),
      lastOperationId: ref("OperationRecord", false),
    },
    options("return_source_locks"),
  );
  return returnLocks;
}
