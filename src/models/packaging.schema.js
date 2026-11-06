import { Schema, embeddedOptions, text, decimal } from "./model-utils.js";
import { dimensionsTogether } from "./schema-helpers.js";

// Embedded schema; no standalone collection.
export function createPackagingSchema() {
  const packaging = new Schema(
    {
      packageUnit: text(60),
      baseUnitsPerPackage: decimal({
        positive: true,
        scale: 12,
        precision: 24,
      }),
      outerLengthMm: decimal({ positive: true, scale: 3, required: false }),
      outerWidthMm: decimal({ positive: true, scale: 3, required: false }),
      outerHeightMm: decimal({ positive: true, scale: 3, required: false }),
    },
    embeddedOptions,
  );
  dimensionsTogether(packaging, [
    "outerLengthMm",
    "outerWidthMm",
    "outerHeightMm",
  ]);
  return packaging;
}
