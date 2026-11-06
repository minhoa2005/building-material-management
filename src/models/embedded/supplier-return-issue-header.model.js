import { Schema, embeddedOptions, ref, code, date } from "../model-utils.js";
import { opt, warehouse } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createSupplierReturnIssueHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      issueKind: code(["SUPPLIER_RETURN"], { default: "SUPPLIER_RETURN" }),
    },
    embeddedOptions,
  );
  schema.add({
    supplierReturnId: ref("SupplierReturn", false),
    issuedAt: date(false),
    issuedBy: ref("User", false),
    receivedByName: opt(160),
    operationId: ref("OperationRecord", false),
  });
  return schema;
}
