import { Schema, embeddedOptions, ref, date } from "../model-utils.js";
import { warehouse, financialStatus } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createCustomerReturnHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      customerId: ref("Party"),
      financialFollowupStatus: financialStatus(),
    },
    embeddedOptions,
  );
  schema.add({ openedBy: ref("User", false), openedAt: date(false) });
  return schema;
}
