import {
  Schema,
  options,
  text,
  ref,
  code,
  integer,
  date,
  rules,
} from "./model-utils.js";
import { id, str, docType } from "./schema-helpers.js";

// Collection: attachments
export function createAttachmentSchema() {
  const attachments = new Schema(
    {
      ownerDocumentType: docType(),
      ownerDocumentId: id(false),
      ownerItemId: id(false),
      ownerRevision: integer(1, { required: false }),
      purpose: text(80),
      originalName: text(250),
      mediaType: code([
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ]),
      sizeBytes: integer(1, { max: 10 * 1024 * 1024 }),
      storageKey: text(600),
      checksum: text(64, { match: /^[a-f\d]{64}$/i }),
      uploadedBy: ref("User"),
      uploadedAt: date(),
      capturedAt: date(false),
      accessCategory: code([
        "BUSINESS",
        "INTERNAL",
        "PURCHASE_PRICE",
        "SALES_PRICE",
      ]),
      status: code(["TEMPORARY", "ATTACHED", "SUPERSEDED"]),
      uploadSessionId: str(160),
      expiresAt: date(false),
      replacesAttachmentId: ref("Attachment", false),
      replacementReason: str(1000),
    },
    options("attachments"),
  );
  rules(attachments, function () {
    if (this.status !== "TEMPORARY" && !this.ownerDocumentId)
      this.invalidate("ownerDocumentId", "Attached evidence requires an owner");
    if (this.replacesAttachmentId && !this.replacementReason)
      this.invalidate(
        "replacementReason",
        "Replacement evidence requires a reason",
      );
  });
  return attachments;
}
