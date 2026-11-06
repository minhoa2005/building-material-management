import { Schema, embeddedOptions, ref, code } from "../model-utils.js";
import { opt, warehouse } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createInternalTransferRequirementHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      sourceDocumentId: ref("BusinessDocument"),
      taskKind: code(["PICK", "PUTAWAY"]),
    },
    embeddedOptions,
  );
  schema.add({ sourceType: opt(80) });
  return schema;
}
