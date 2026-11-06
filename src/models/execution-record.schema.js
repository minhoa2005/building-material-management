import {
  Schema,
  embeddedOptions,
  ref,
  refs,
  decimal,
  date,
} from "./model-utils.js";
import { opt } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createExecutionRecordSchema() {
  const schema = new Schema(
    {
      itemId: { type: Schema.Types.ObjectId, required: true },
      performedBy: ref("User"),
      performedAt: date(),
      quantityBase: decimal(),
      transactionId: ref("StockTransaction", false),
      evidenceIds: refs("Attachment"),
      note: opt(2000),
    },
    embeddedOptions,
  );
  return schema;
}
