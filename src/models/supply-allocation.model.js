import {
  Schema,
  options,
  text,
  ref,
  decimal,
  date,
  rules,
  exact,
} from "./model-utils.js";
import { version, zero } from "./schema-helpers.js";

import { createSourceReferenceSchema } from "./embedded/source-reference.model.js";

// Collection: supply_allocations
export function createSupplyAllocationSchema() {
  const allocations = new Schema(
    {
      demandRef: { type: createSourceReferenceSchema(), required: true },
      sourceRef: { type: createSourceReferenceSchema(), required: true },
      destinationWarehouseId: ref("Warehouse"),
      allocatedQty: decimal({ positive: true }),
      receivedAssignedQty: zero(),
      releasedQty: zero(),
      neededBy: date(),
      creationKey: text(160, { unique: true }),
      createdBy: ref("User"),
      updatedBy: ref("User", false),
      version: version(),
    },
    options("supply_allocations"),
  );
  rules(allocations, function () {
    if (
      this.allocatedQty &&
      exact(this.receivedAssignedQty)
        .plus(String(this.releasedQty))
        .gt(String(this.allocatedQty))
    ) {
      this.invalidate(
        "allocatedQty",
        "Received and released quantities exceed the allocation",
      );
    }
    if (
      this.sourceRef &&
      !["purchase_orders", "warehouse_transfer_requests"].includes(
        this.sourceRef.documentType,
      )
    ) {
      this.invalidate(
        "sourceRef",
        "Expected supply must reference an eligible PO or TR",
      );
    }
  });
  return allocations;
}
