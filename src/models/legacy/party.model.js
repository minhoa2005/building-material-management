import {
  Schema,
  options,
  model,
  text,
  code,
  integer,
} from "../model-utils.js";

const optionalText = (maxlength, extra = {}) =>
  text(maxlength, { required: false, ...extra });

const partySchema = new Schema(
  {
    code: text(40, { unique: true, uppercase: true }),
    name: text(200),
    kind: code(["STORE", "SUPPLIER", "CUSTOMER", "CARRIER"]),
    contactReference: optionalText(500),
    phone: optionalText(30),
    email: optionalText(254, {
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    }),
    address: optionalText(500),
    taxCode: optionalText(50),
    contactPerson: optionalText(160),
    notes: optionalText(2000),
    cooperationStatus: code(["ACTIVE", "SUSPENDED", "TERMINATED"], {
      required: false,
      default: "ACTIVE",
    }),
    statusReason: optionalText(2000),
    isActive: { type: Boolean, required: true, default: true },
    version: integer(1, { default: 1 }),
  },
  options("parties"),
);
partySchema.index(
  { kind: 1 },
  { unique: true, partialFilterExpression: { kind: "STORE" } },
);
partySchema.index({ kind: 1, cooperationStatus: 1, createdAt: -1, _id: -1 });

export const Party = model("Party", partySchema);