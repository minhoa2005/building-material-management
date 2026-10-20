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
  sameId,
  uniqueValues,
  rules,
  appendOnly,
} from "./model-utils.js";

const approvalLineSchema = new Schema(
  {
    lineId: ref("DocumentLine"),
    approvedQty: decimal(),
    outcome: text(30),
  },
  embeddedOptions,
);

const approvalSchema = new Schema(
  {
    documentId: ref("BusinessDocument"),
    documentVersion: integer(1),
    decisionKind: text(30),
    decision: code(["APPROVE", "REJECT", "REVISE"]),
    requestedBy: ref("User"),
    decidedBy: ref("User"),
    decidedAt: date(true, { default: Date.now }),
    reason: text(2000),
    lines: {
      type: [approvalLineSchema],
      default: [],
      validate: {
        validator: (lines) => uniqueValues(lines.map((line) => line.lineId)),
        message: "Approval line IDs must be unique",
      },
    },
  },
  options("approvals"),
);
approvalSchema.index(
  { documentId: 1, documentVersion: 1, decisionKind: 1 },
  { unique: true },
);
rules(approvalSchema, function preventSelfApproval() {
  if (sameId(this.requestedBy, this.decidedBy))
    this.invalidate("decidedBy", "Requester and approver must differ");
});
appendOnly(approvalSchema);

export const Approval = model("Approval", approvalSchema);
