import {
  Schema,
  options,
  embeddedOptions,
  model,
  text,
  ref,
  code,
  integer,
  decimal,
  date,
  appendOnly,
} from "../model-utils.js";
import { REPLENISHMENT_TRIGGER_TYPES } from "../constants.js";

const submissionLineSchema = new Schema({
  lineId: ref("DocumentLine"),
  lineNo: integer(1),
  productId: ref("Product"),
  productSkuSnapshot: text(60),
  productNameSnapshot: text(200),
  baseUomId: ref("Uom"),
  baseUomCodeSnapshot: text(12),
  enteredUomId: ref("Uom"),
  enteredUomCodeSnapshot: text(12),
  conversionId: ref("ProductUomVersion"),
  conversionVersion: integer(1),
  enteredQty: decimal({ positive: true }),
  conversionSnapshot: decimal({ positive: true, precision: 24, scale: 12 }),
  qtyBase: decimal({ positive: true }),
  triggerType: code(REPLENISHMENT_TRIGGER_TYPES),
  reasonNote: text(2000),
}, embeddedOptions);

const submissionSchema = new Schema(
  {
    documentId: ref("BusinessDocument"),
    documentVersion: integer(1),
    submittedBy: ref("User"),
    submittedAt: date(),
    warehouseId: ref("Warehouse"),
    warehouseCodeSnapshot: text(30),
    warehouseNameSnapshot: text(200),
    neededOn: date(),
    triggerReason: text(200),
    note: text(2000, { required: false }),
    lines: {
      type: [submissionLineSchema],
      required: true,
      validate: {
        validator: (lines) => lines.length >= 1 && lines.length <= 100,
        message: "A submission must contain 1-100 lines",
      },
    },
  },
  options("replenishment_submissions"),
);
submissionSchema.index(
  { documentId: 1, documentVersion: 1 },
  { unique: true },
);
submissionSchema.index({ documentId: 1, submittedAt: -1 });
appendOnly(submissionSchema);

export const ReplenishmentSubmission = model(
  "ReplenishmentSubmission",
  submissionSchema,
);