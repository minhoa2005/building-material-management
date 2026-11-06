import { Schema, embeddedOptions, text, ref, date } from "../model-utils.js";
import { opt } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createHandoverHeaderSchema() {
  const schema = new Schema(
    {
      relatedDocumentId: ref("BusinessDocument"),
      recipientName: text(160),

      handedOverAt: date(),
      confirmedBy: ref("User"),
    },
    embeddedOptions,
  );
  schema.add({ vehiclePlate: opt(20) });
  return schema;
}
