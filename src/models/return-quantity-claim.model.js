import {
  Schema,
  options,
  ref,
  code,
  decimal,
  rules,
  exact,
} from "./model-utils.js";
import { id, version } from "./schema-helpers.js";

import { createPortionEventSchema } from "./portion-event.schema.js";

// Collection: return_quantity_claims
export function createReturnQuantityClaimSchema() {
  const claims = new Schema(
    {
      claimKind: code(["FD", "CR"]),
      requestLineId: id(),
      sourceKind: code(["GOODS_ISSUE", "DELIVERY_CONFIRMATION", "EXTERNAL"]),
      sourceLineId: id(),
      claimedQtyBase: decimal({ positive: true }),
      createdBy: ref("User"),
      operationId: ref("OperationRecord"),
      version: version(),
      events: [createPortionEventSchema()],
    },
    options("return_quantity_claims"),
  );
  rules(claims, function () {
    const resolved = this.events.filter((event) =>
      ["RECEIVED", "RELEASED"].includes(event.kind),
    );
    if (
      this.claimedQtyBase &&
      resolved
        .reduce((sum, event) => sum.plus(String(event.quantityBase)), exact(0))
        .gt(String(this.claimedQtyBase))
    ) {
      this.invalidate("events", "Resolved quantities exceed the claim");
    }
  });
  return claims;
}
