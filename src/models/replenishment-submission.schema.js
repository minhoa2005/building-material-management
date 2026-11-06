import {
  Schema,
  options,
  text,
  ref,
  integer,
  date,
  appendOnly,
} from "./model-utils.js";

import { createReplenishmentSubmissionLineSchema } from "./replenishment-submission-line.schema.js";

// Embedded schema; no standalone collection.
export function createReplenishmentSubmissionSchema() {
  const submissionSchema = new Schema(
    {
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
        type: [createReplenishmentSubmissionLineSchema()],
        required: true,
        validate: {
          validator: (lines) => lines.length >= 1 && lines.length <= 100,
          message: "A submission must contain 1-100 lines",
        },
      },
    },
    options("replenishment_submissions"),
  );

  appendOnly(submissionSchema);
  submissionSchema.clearIndexes();
  return submissionSchema;
}
