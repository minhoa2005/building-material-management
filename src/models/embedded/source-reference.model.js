import { Schema, embeddedOptions, integer } from "../model-utils.js";
import { id, revision, docType } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createSourceReferenceSchema() {
  const schema = new Schema(
    {
      documentType: docType(),
      documentId: id(),
      itemId: id(false),
      revision: integer(1, { required: false }),
    },
    embeddedOptions,
  );
  return schema;
}
