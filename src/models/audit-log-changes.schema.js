import { Schema, embeddedOptions, text } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createAuditLogChangesSchema() {
  const schema = new Schema(
    { field: text(150), before: Schema.Types.Mixed, after: Schema.Types.Mixed },
    embeddedOptions,
  );
  return schema;
}
