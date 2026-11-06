import { Schema, embeddedOptions, text, ref, date } from "../model-utils.js";
import { opt, revision, warehouse } from "../schema-helpers.js";

import { createPurchaseOrderHeaderSupplierSnapshotSchema } from "./purchase-order-header-supplier-snapshot.model.js";

// Embedded schema; no standalone collection.
export function createPurchaseOrderHeaderSchema() {
  const schema = new Schema(
    {
      ...warehouse(),
      supplierId: ref("Party"),
      expectedOn: date(false),
      supplierConfirmation: text(1000, { required: false }),
    },
    embeddedOptions,
  );
  schema.add({
    approvedRequestRevision: revision(),
    orderDate: date(false),
    issuedAt: date(false),
    closedAt: date(false),
    closureDecisionId: ref("ApprovalHistory", false),
    closureReason: opt(2000),
    supplierSnapshot: createPurchaseOrderHeaderSupplierSnapshotSchema(),
  });
  return schema;
}
