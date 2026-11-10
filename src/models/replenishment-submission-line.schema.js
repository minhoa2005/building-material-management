import {
  Schema,
  embeddedOptions,
  text,
  ref,
  code,
  integer,
  decimal,
} from "./model-utils.js";

import { REPLENISHMENT_TRIGGER_TYPES } from "./constants.js";
import { createReplenishmentDetailsSchema } from './replenishment-details.schema.js';

// Embedded schema; no standalone collection.
export function createReplenishmentSubmissionLineSchema() {
  const submissionLineSchema = new Schema(
    {
      lineId: ref("DocumentLine"),
      lineNo: integer(1),
      productId: ref("Product"),
      productSkuSnapshot: text(60),
      productNameSnapshot: text(200),
      baseUomCodeSnapshot: text(12),
      enteredUomCodeSnapshot: text(12),
      conversionVersion: integer(1),
      enteredQty: decimal({ positive: true }),
      conversionSnapshot: decimal({ positive: true, precision: 24, scale: 12 }),
      qtyBase: decimal({ positive: true }),
      triggerType: code(REPLENISHMENT_TRIGGER_TYPES),
      evaluation: { type: createReplenishmentDetailsSchema(), required: false },
      reasonNote: text(2000, { required: false }),
      baseUnitSnapshot: text(60),
      enteredUnit: text(60),
      baseUnitsPerUnit: decimal({ positive: true, precision: 24, scale: 12 }),
    },
    embeddedOptions,
  );
  return submissionLineSchema;
}
