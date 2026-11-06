import { Schema, embeddedOptions, text, ref, date } from "./model-utils.js";
import { warehouse, financialStatus } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createSupplierReturnHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      supplierId: ref("Party"),
      agreementReference: text(300, { required: false }),
      agreedAt: date(false),
      financialFollowupStatus: financialStatus(),
    },
    embeddedOptions,
  );
  return schema;
}
