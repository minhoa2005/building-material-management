import { Schema, embeddedOptions, text, decimal } from "./model-utils.js";
import { objectId, documentId } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createDocumentSourceSchema() {
  const link = new Schema(
    {
      documentId: documentId(),
      subjectCollection: text(80),
      relationCode: text(40),
      handoverId: objectId,
      createdAt: Date,
      updatedAt: Date,
      itemId: objectId,
      linkedQty: decimal({ positive: true, required: false }),
    },
    { ...embeddedOptions, _id: true },
  );
  return link;
}
