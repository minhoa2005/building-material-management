import { Schema, options, model, text, code } from "./model-utils.js";

const partySchema = new Schema(
  {
    code: text(40, { unique: true }),
    name: text(200),
    kind: code(["STORE", "SUPPLIER", "CUSTOMER", "CARRIER"]),
    contactReference: text(500, { required: false }),
    isActive: { type: Boolean, required: true, default: true },
  },
  options("parties"),
);
partySchema.index(
  { kind: 1 },
  { unique: true, partialFilterExpression: { kind: "STORE" } },
);

export const Party = model("Party", partySchema);
