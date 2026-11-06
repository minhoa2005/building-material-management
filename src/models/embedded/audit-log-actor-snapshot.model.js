import { Schema, embeddedOptions, text } from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createAuditLogActorSnapshotSchema() {
  const schema = new Schema(
    { username: text(100), roleCode: text(60) },
    embeddedOptions,
  );
  return schema;
}
