import { Schema, embeddedOptions, text, ref } from "./model-utils.js";

// Embedded schema; no standalone collection.
export function createSalesOrderDetailsSchema() {
  const schema = new Schema(
    {
      externalReferenceId: ref("ExternalReference"),
      externalLineId: ref("ExternalReferenceLine"),
      requiredTone: text(60, { required: false }),
      requiredCalibre: text(60, { required: false }),
    },
    embeddedOptions,
  );
  return schema;
}
