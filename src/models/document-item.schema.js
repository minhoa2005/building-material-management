import {
  Schema,
  text,
  ref,
  code,
  integer,
  decimal,
  rules,
  exact,
} from "./model-utils.js";

import { LINE_KINDS } from "./constants.js";
import { createPackagingSchema } from "./packaging.schema.js";
import { createDocumentSourceSchema } from "./document-source.schema.js";

// Embedded schema; no standalone collection.
export function createDocumentItemSchema() {
  const schema = new Schema(
    {
      lineNo: integer(1),
      lineKind: code(LINE_KINDS),
      productId: ref("Product"),
      lotId: ref("Lot", false),
      enteredUnit: text(60),
      baseUnitSnapshot: text(60),
      baseUnitsPerUnit: decimal({ positive: true, precision: 24, scale: 12 }),
      packagingSnapshot: createPackagingSchema(),
      enteredQty: decimal({ positive: true }),
      qtyBase: decimal({ positive: true }),
      productNameSnapshot: text(200),
      sources: { type: [createDocumentSourceSchema()], default: undefined },
      createdAt: Date,
      updatedAt: Date,
    },
    { discriminatorKey: "lineKind", strict: "throw", versionKey: false },
  );
  rules(schema, function () {
    if (!(this.enteredQty && this.baseUnitsPerUnit && this.qtyBase)) return;
    const converted = exact(this.enteredQty).mul(exact(this.baseUnitsPerUnit));
    const qtyBase = exact(this.qtyBase);
    // Exact, or the area-unit rule of toBaseQuantity (shared/utils/conversions.js): whole pieces = ceil(round(x, 6)).
    // Services decide when that rule applies; the schema only accepts its result.
    const areaRounded = qtyBase.isInteger() && qtyBase.eq(converted.toDecimalPlaces(6).ceil());
    if (!converted.eq(qtyBase) && !areaRounded) {
      this.invalidate(
        "qtyBase",
        "Quantity must equal the historical conversion, or its area rounding up to whole base units",
      );
    }
  });
  return schema;
}
