import {
  Schema,
  embeddedOptions,
  ref,
  integer,
  rules,
  sameId,
} from "../model-utils.js";
import { quality } from "../schema-helpers.js";

// Embedded schema; no standalone collection.
export function createWarehouseTaskDetailsSchema() {
  const taskDetails = new Schema(
    {
      fromLocationId: ref("Location"),
      toLocationId: ref("Location"),
      qualityCode: quality(),
      // Optional for historical tasks; UC-36 always records the source identity.
      sourceBalanceId: ref("StockBalance", false),
      sourceBalanceVersion: integer(0, { required: false }),
      ownerPartyId: ref("Party", false),
    },
    embeddedOptions,
  );
  rules(taskDetails, function validateTaskEndpoints() {
    if (sameId(this.fromLocationId, this.toLocationId)) {
      this.invalidate("toLocationId", "Warehouse-task locations must differ");
    }
  });
  return taskDetails;
}
