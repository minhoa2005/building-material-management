import { Schema, options, text, code } from "./model-utils.js";
import { uniqueCode } from "./schema-helpers.js";

// Collection: customers
export function createCustomerSchema() {
  const customers = new Schema(
    { code: uniqueCode(), name: text(200), phone: text(30) },
    options("customers"),
  );
  return customers;
}
