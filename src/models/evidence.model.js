import {
  Schema,
  options,
  model,
  text,
  ref,
  date,
  appendOnly,
} from "./model-utils.js";

const evidenceSchema = new Schema(
  {
    documentId: ref("BusinessDocument"),
    objectKey: text(600),
    sha256: text(64, { match: /^[a-f\d]{64}$/i }),
    mediaType: text(100),
    uploadedBy: ref("User"),
    uploadedAt: date(true, { default: Date.now }),
  },
  options("evidence_refs"),
);
evidenceSchema.index({ documentId: 1 });
appendOnly(evidenceSchema);

export const Evidence = model("Evidence", evidenceSchema);
