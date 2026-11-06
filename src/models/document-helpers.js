import { rules } from "./model-utils.js";
import { createItemDiscriminatorSchema } from "./item-discriminator.schema.js";
import { createReplenishmentDetailsSchema } from "./replenishment-details.schema.js";
import { createSalesOrderDetailsSchema } from "./sales-order-details.schema.js";
import { createOutboundDeliveryDetailsSchema } from "./outbound-delivery-details.schema.js";
import { createSalesGoodsIssueDetailsSchema } from "./sales-goods-issue-details.schema.js";
import { createDeliveryConfirmationDetailsSchema } from "./delivery-confirmation-details.schema.js";
import { createFailedDeliveryDetailsSchema } from "./failed-delivery-details.schema.js";
import { createFailedDeliveryReceiptDetailsSchema } from "./failed-delivery-receipt-details.schema.js";
import { createStocktakeResolutionDetailsSchema } from "./stocktake-resolution-details.schema.js";
import { createInspectionDetailsSchema } from "./inspection-details.schema.js";
import { createTransferReceiptDetailsSchema } from "./transfer-receipt-details.schema.js";
import { createTransferOutboundDetailsSchema } from "./transfer-outbound-details.schema.js";
import { createIssueRequestDetailsSchema } from "./issue-request-details.schema.js";
import { createWarehouseTaskDetailsSchema } from "./warehouse-task-details.schema.js";
import { createDispositionDetailsSchema } from "./disposition-details.schema.js";
import { createCustomerReturnDetailsSchema } from "./customer-return-details.schema.js";
import { createSupplierReturnDetailsSchema } from "./supplier-return-details.schema.js";
import { createSupplierAckDetailsSchema } from "./supplier-ack-details.schema.js";
import { createDiscrepancyDetailsSchema } from "./discrepancy-details.schema.js";
import { createAdjustmentDetailsSchema } from "./adjustment-details.schema.js";
export function attachDocumentItems(parent, item) {
  parent.add({ items: { type: [item], default: [] } });
  parent
    .path("items")
    .discriminator(
      "DocumentLine_REPLENISHMENT",
      createItemDiscriminatorSchema(createReplenishmentDetailsSchema()),
      { value: "REPLENISHMENT" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_SALES_ORDER",
      createItemDiscriminatorSchema(createSalesOrderDetailsSchema()),
      { value: "SALES_ORDER" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_OUTBOUND_DELIVERY",
      createItemDiscriminatorSchema(createOutboundDeliveryDetailsSchema()),
      { value: "OUTBOUND_DELIVERY" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_SALES_GOODS_ISSUE",
      createItemDiscriminatorSchema(createSalesGoodsIssueDetailsSchema()),
      { value: "SALES_GOODS_ISSUE" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_DELIVERY_CONFIRMATION",
      createItemDiscriminatorSchema(createDeliveryConfirmationDetailsSchema()),
      { value: "DELIVERY_CONFIRMATION" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_FAILED_DELIVERY",
      createItemDiscriminatorSchema(createFailedDeliveryDetailsSchema()),
      { value: "FAILED_DELIVERY" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_FAILED_DELIVERY_RECEIPT",
      createItemDiscriminatorSchema(createFailedDeliveryReceiptDetailsSchema()),
      { value: "FAILED_DELIVERY_RECEIPT" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_ST_RESOLUTION",
      createItemDiscriminatorSchema(createStocktakeResolutionDetailsSchema()),
      { value: "ST_RESOLUTION" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_INSPECTION",
      createItemDiscriminatorSchema(createInspectionDetailsSchema()),
      { value: "INSPECTION" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_TRANSFER_RECEIPT",
      createItemDiscriminatorSchema(createTransferReceiptDetailsSchema()),
      { value: "TRANSFER_RECEIPT" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_TRANSFER_OUTBOUND",
      createItemDiscriminatorSchema(createTransferOutboundDetailsSchema()),
      { value: "TRANSFER_OUTBOUND" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_ISSUE_REQUEST",
      createItemDiscriminatorSchema(createIssueRequestDetailsSchema()),
      { value: "ISSUE_REQUEST" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_WAREHOUSE_TASK",
      createItemDiscriminatorSchema(createWarehouseTaskDetailsSchema()),
      { value: "WAREHOUSE_TASK" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_DISPOSITION",
      createItemDiscriminatorSchema(createDispositionDetailsSchema()),
      { value: "DISPOSITION" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_CUSTOMER_RETURN",
      createItemDiscriminatorSchema(createCustomerReturnDetailsSchema()),
      { value: "CUSTOMER_RETURN" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_SUPPLIER_RETURN",
      createItemDiscriminatorSchema(createSupplierReturnDetailsSchema()),
      { value: "SUPPLIER_RETURN" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_SUPPLIER_ACK",
      createItemDiscriminatorSchema(createSupplierAckDetailsSchema()),
      { value: "SUPPLIER_ACK" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_DISCREPANCY",
      createItemDiscriminatorSchema(createDiscrepancyDetailsSchema()),
      { value: "DISCREPANCY" },
    );
  parent
    .path("items")
    .discriminator(
      "DocumentLine_ADJUSTMENT",
      createItemDiscriminatorSchema(createAdjustmentDetailsSchema()),
      { value: "ADJUSTMENT" },
    );
}
export function addDocumentIndexesAndRules(schema) {
  schema.index({ "items._id": 1 });
  schema.index({ "sources.documentId": 1 });
  schema.index({ "items.sources.itemId": 1 });
  schema.index({ workflowStatus: 1, createdAt: -1 });
  rules(schema, function () {
    if (
      new Set(this.items.map((row) => String(row._id))).size !==
        this.items.length ||
      new Set(this.items.map((row) => row.lineNo)).size !== this.items.length
    )
      this.invalidate("items", "Duplicate item ID or line number");
  });
}
