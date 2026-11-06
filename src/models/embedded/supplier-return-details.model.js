import {
  Schema,
  embeddedOptions,
  ref,
  integer,
  decimal,
  date,
} from "../model-utils.js";

// Embedded schema; no standalone collection.
export function createSupplierReturnDetailsSchema() {
  const schema = new Schema(
    {
      originLineId: ref("DocumentLine"),
      ownerPartyId: ref("Party"),
      agreedQty: decimal(),
      agreementVersion: integer(1),
      agreementVerifiedBy: ref("User"),
      agreementVerifiedAt: date(),
      agreementEvidenceId: ref("Evidence"),
    },
    embeddedOptions,
  );
  return schema;
}
