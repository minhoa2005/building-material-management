import {
  Schema,
  embeddedOptions,
  ref,
  integer,
  decimal,
  date,
  code,
  rules,
} from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createSupplierReturnDetailsSchema() {
  const schema = new Schema(
    {
      phase: code(["PROPOSED", "VERIFIED"], { default: "VERIFIED" }),
      originLineId: ref("DocumentLine"),
      sourceBalanceId: ref("InventoryBalance", false),
      defectHoldId: ref("DefectHold", false),
      ownerPartyId: ref("Party"),
      agreedQty: decimal({ required: false }),
      agreementVersion: integer(1, { required: false }),
      agreementVerifiedBy: ref("User", false),
      agreementVerifiedAt: date(false),
      agreementEvidenceId: ref("Evidence", false),
    },
    embeddedOptions,
  );
  rules(schema, function () {
    if (this.phase === "VERIFIED") {
      for (const key of ["agreedQty", "agreementVersion", "agreementVerifiedBy", "agreementVerifiedAt", "agreementEvidenceId"]) {
        if (this[key] == null) this.invalidate(key, "Verified agreement requires its actual facts");
      }
    }
  });
  return schema;
}
