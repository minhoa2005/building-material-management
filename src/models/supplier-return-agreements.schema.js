import {
  Schema,
  embeddedOptions,
  ref,
  refs,
  integer,
  decimal,
  date,
} from "./model-utils.js";
import { version } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createSupplierReturnAgreementsSchema() {
  const schema = new Schema(
    {
      itemId: { type: Schema.Types.ObjectId, required: true },
      agreedQtyBase: decimal(),
      verifiedBy: ref("User"),
      verifiedAt: date(),
      version: integer(1),
      evidenceIds: refs("Attachment"),
    },
    embeddedOptions,
  );
  return schema;
}
