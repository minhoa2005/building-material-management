import {
  Schema,
  embeddedOptions,
  text,
  ref,
  integer,
  date,
  rules,
} from "./model-utils.js";
import { opt } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createExternalPaymentConfirmationHeaderSchema() {
  const schema = new Schema(
    {
      salesOrderId: ref("BusinessDocument"),
      deliveredOrderVersion: integer(1),
      fullPaymentReceived: {
        type: Boolean,
        required: true,
        validate: {
          validator: (value) => value === true,
          message: "Full external payment receipt must be confirmed",
        },
      },
      externalReceiptReference: text(300, { required: false }),
      receiptEvidenceId: ref("Evidence", false),
      confirmationNote: text(2000, { required: false }),
      confirmedBy: ref("User"),
      confirmedAt: date(true, { default: Date.now }),
      operationId: ref("BusinessOperation"),
    },
    embeddedOptions,
  );
  rules(schema, function requireReceiptSupport() {
    if (
      !this.externalReceiptReference &&
      !this.receiptEvidenceId &&
      !this.confirmationNote
    ) {
      this.invalidate(
        "externalReceiptReference",
        "A receipt reference, evidence or confirmation note is required",
      );
    }
  });
  schema.add({
    voidedBy: ref("User", false),
    voidedAt: date(false),
    voidReason: opt(2000),
    replacesId: ref("ExternalPaymentConfirmation", false),
  });
  return schema;
}
