import {
  Schema,
  options,
  text,
  ref,
  refs,
  code,
  integer,
  date,
} from "../model-utils.js";
import { objectId, opt, version } from "../schema-helpers.js";

import { createDocumentSourceSchema } from "./document-source.model.js";
import { createDocumentItemSchema } from "./document-item.model.js";
import { createDeliveryConfirmationHeaderSchema } from "./delivery-confirmation-header.model.js";
import {
  attachDocumentItems,
  addDocumentIndexesAndRules,
} from "../document-helpers.js";

// Embedded schema; no standalone collection.
export function createDeliveryConfirmationSchema() {
  const schema = new Schema(
    {
      documentNo: text(50, { unique: true }),
      documentKind: code(["DELIVERY_CONFIRMATION"], {
        default: "DELIVERY_CONFIRMATION",
      }),
      workflowStatus: text(40),
      version: integer(1),
      createdBy: ref("User"),
      occurredAt: Date,
      note: text(2000, { required: false }),
      externalReferenceIds: [objectId],
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      header: {
        type: createDeliveryConfirmationHeaderSchema(),
        required: true,
      },
      updatedBy: ref("User", false),
      evidenceIds: refs("Attachment"),
      cancelledBy: ref("User", false),
      cancelledAt: date(false),
      cancelReason: opt(2000),
    },
    options("delivery_confirmations"),
  );
  const item = createDocumentItemSchema();
  item.add({ note: opt(2000), evidenceIds: refs("Attachment") });
  attachDocumentItems(schema, item);
  addDocumentIndexesAndRules(schema);

  return schema;
}
