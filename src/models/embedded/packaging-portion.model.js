import {
  Schema,
  options,
  ref,
  code,
  integer,
  decimal,
  rules,
  exact,
} from "../model-utils.js";
import { optionalText, quantity } from "../schema-helpers.js";

import { createPackagingSchema } from "./packaging.model.js";

// Embedded schema; no standalone collection.
export function createPackagingPortionSchema() {
  const stackItems = new Schema(
    {
      packagingState: code(["SEALED", "OPEN", "LOOSE"]),
      packagingSnapshot: createPackagingSchema(),
      packagingKey: optionalText(300),
      sealedPackCount: integer(0, { required: false }),
      quantityBase: decimal(),
      createdBy: ref("User"),
      updatedBy: ref("User", false),
    },
    options("storage_stack_items"),
  );

  stackItems.add({
    measuredVolumeMm3: decimal({ required: false }),
    extraOccupiedVolumeMm3: decimal({ required: false }),
  });
  rules(stackItems, function () {
    if (this.packagingState === "SEALED") {
      const perPack = this.packagingSnapshot?.baseUnitsPerPackage;
      if (
        perPack == null ||
        this.sealedPackCount == null ||
        !exact(perPack).mul(this.sealedPackCount).eq(String(this.quantityBase))
      ) {
        this.invalidate(
          "quantityBase",
          "Sealed quantity must match pack count and conversion",
        );
      }
    } else if (this.sealedPackCount != null)
      this.invalidate("sealedPackCount", "Only sealed packs have a pack count");
  });
  stackItems.clearIndexes();
  stackItems.set("excludeIndexes", true);
  return stackItems;
}
