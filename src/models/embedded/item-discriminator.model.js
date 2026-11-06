import { Schema, embeddedOptions } from "../model-utils.js";
export function createItemDiscriminatorSchema(details) {
  return new Schema(
    { details: { type: details, required: true } },
    embeddedOptions,
  );
}
