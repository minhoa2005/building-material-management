import { createSourceReferenceSchema } from "./source-reference.model.js";
import {
  Schema,
  embeddedOptions,
  text,
  ref,
  decimal,
  date,
} from "../model-utils.js";
import { str } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createPortionEventSchema() {
  const schema = new Schema(
    {
      kind: text(40),
      quantityBase: decimal({ positive: true }),
      sourceRef: createSourceReferenceSchema(),
      performedBy: ref("User"),
      performedAt: date(),
      reason: str(1000),
    },
    embeddedOptions,
  );
  return schema;
}
