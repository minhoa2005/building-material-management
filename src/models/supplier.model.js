import { Schema, options, text, code } from "./model-utils.js";
import { optionalText, uniqueCode } from "./schema-helpers.js";

// Collection: suppliers
export function createSupplierSchema() {
  const suppliers = new Schema(
    {
      code: uniqueCode(),
      name: text(200),
      contactName: optionalText(160),
      taxCode: optionalText(50),
      notes: optionalText(2000),
      statusReason: optionalText(2000),
      phone: optionalText(30),
      email: optionalText(254),
      address: optionalText(500),
      status: code(["ACTIVE", "SUSPENDED", "TERMINATED"], { default: "ACTIVE" }),
    },
    options("suppliers"),
  );
  return suppliers;
}
