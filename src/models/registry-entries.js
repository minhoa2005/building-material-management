import { createUserSchema } from "./user.model.js";
import { createRoleSchema } from "./role.model.js";
import { createPermissionSchema } from "./permission.model.js";
import { createWarehouseSchema } from "./warehouse.model.js";
import { createWarehouseLocationSchema } from "./warehouse-location.model.js";
import { createProductSchema } from "./product.model.js";
import { createCategorySchema } from "./category.model.js";
import { createCustomerSchema } from "./customer.model.js";
import { createSupplierSchema } from "./supplier.model.js";
import { createStockHoldingPointSchema } from "./stock-holding-point.model.js";
import { createInventoryBalanceSchema } from "./inventory-balance.model.js";
import { createStockTransactionSchema } from "./stock-transaction.model.js";
import { createStockReservationSchema } from "./stock-reservation.model.js";
import { createSupplyAllocationSchema } from "./supply-allocation.model.js";
import { createApprovalHistorySchema } from "./approval-history.model.js";
import { createAttachmentSchema } from "./attachment.model.js";
import { createReturnQuantityClaimSchema } from "./return-quantity-claim.model.js";
import { createStocktakeSnapshotSchema } from "./stocktake-snapshot.model.js";
import { createStocktakeCountSchema } from "./stocktake-count.model.js";
import { createStocktakeLocationLockSchema } from "./stocktake-location-lock.model.js";
import { createNotificationSchema } from "./notification.model.js";
import { createAuditLogSchema } from "./audit-log.model.js";
import { createSystemEventSchema } from "./system-event.model.js";
import { createOperationRecordSchema } from "./operation-record.model.js";
import { createReplenishmentLockSchema } from "./replenishment-lock.model.js";
import { createReturnSourceLockSchema } from "./return-source-lock.model.js";
import { createExternalReferenceSchema } from "./external-reference.model.js";
import { createProductBatchSchema } from "./product-batch.model.js";
import { createReplenishmentRequestSchema } from "./replenishment-request.model.js";
import { createPurchaseOrderSchema } from "./purchase-order.model.js";
import { createGoodsArrivalSchema } from "./goods-arrival.model.js";
import { createGoodsInspectionSchema } from "./goods-inspection.model.js";
import { createGoodsReceiptSchema } from './goods-receipt.model.js';
import { createTransferOrderSchema } from "./transfer-order.model.js";
import { createWarehouseTransferRequestSchema } from "./warehouse-transfer-request.model.js";
import { createInternalTransferRequirementSchema } from "./internal-transfer-requirement.model.js";
import { createTransferDispatchSchema } from "./transfer-dispatch.model.js";
import { createSalesOrderSchema } from "./sales-order.model.js";
import { createWarehouseIssueRequestSchema } from "./warehouse-issue-request.model.js";
import { createDeliveryOrderSchema } from "./delivery-order.model.js";
import { createSalesGoodsIssueSchema } from "./sales-goods-issue.model.js";
import { createDefectReportSchema } from "./defect-report.model.js";
import { createStockScrapRecordSchema } from "./stock-scrap-record.model.js";
import { createStocktakeSchema } from "./stocktake.model.js";
import { createStockAdjustmentSchema } from "./stock-adjustment.model.js";
import { createFailedDeliverySchema } from "./failed-delivery.model.js";
import { createStockQualityChangeSchema } from "./stock-quality-change.model.js";
import { createCustomerReturnSchema } from "./customer-return.model.js";
import { createSupplierReturnSchema } from "./supplier-return.model.js";
import { createSupplierReturnIssueSchema } from "./supplier-return-issue.model.js";
import { createStockDiscrepancySchema } from "./stock-discrepancy.model.js";
import { createCustodyReceiptSchema } from "./custody-receipt.model.js";
import { createCustodyReleaseSchema } from "./custody-release.model.js";
import { createStockReversalSchema } from "./stock-reversal.model.js";
import { createOpeningStockSchema } from "./opening-stock.model.js";
import { createSalesInvoiceSchema } from "./sales-invoice.model.js";

import { createUomSchema } from './uom.model.js';
import { createConversionSchema } from './conversion.model.js';
export function modelSchemaEntries() {
  return [{name:"Uom",collection:"uoms",schema:createUomSchema()},
    { name: 'Conversion', collection: 'conversions', schema: createConversionSchema() },
    { name: "Category", collection: "categories", schema: createCategorySchema() },
    { name: "User", collection: "users", schema: createUserSchema() },
    { name: "Role", collection: "roles", schema: createRoleSchema() },
    {
      name: "Permission",
      collection: "permissions",
      schema: createPermissionSchema(),
    },
    {
      name: "Warehouse",
      collection: "warehouses",
      schema: createWarehouseSchema(),
    },
    {
      name: "WarehouseLocation",
      collection: "warehouse_locations",
      schema: createWarehouseLocationSchema(),
    },
    { name: "Product", collection: "products", schema: createProductSchema() },
    {
      name: "Customer",
      collection: "customers",
      schema: createCustomerSchema(),
    },
    {
      name: "Supplier",
      collection: "suppliers",
      schema: createSupplierSchema(),
    },
    {
      name: "StockHoldingPoint",
      collection: "stock_holding_points",
      schema: createStockHoldingPointSchema(),
    },
    {
      name: "InventoryBalance",
      collection: "inventory_balances",
      schema: createInventoryBalanceSchema(),
    },
    {
      name: "StockTransaction",
      collection: "stock_transactions",
      schema: createStockTransactionSchema(),
    },
    {
      name: "StockReservation",
      collection: "stock_reservations",
      schema: createStockReservationSchema(),
    },
    {
      name: "SupplyAllocation",
      collection: "supply_allocations",
      schema: createSupplyAllocationSchema(),
    },
    {
      name: "ApprovalHistory",
      collection: "approval_history",
      schema: createApprovalHistorySchema(),
    },
    {
      name: "Attachment",
      collection: "attachments",
      schema: createAttachmentSchema(),
    },
    {
      name: "ReturnQuantityClaim",
      collection: "return_quantity_claims",
      schema: createReturnQuantityClaimSchema(),
    },
    {
      name: "StocktakeSnapshot",
      collection: "stocktake_snapshots",
      schema: createStocktakeSnapshotSchema(),
    },
    {
      name: "StocktakeCount",
      collection: "stocktake_counts",
      schema: createStocktakeCountSchema(),
    },
    {
      name: "StocktakeLocationLock",
      collection: "stocktake_location_locks",
      schema: createStocktakeLocationLockSchema(),
    },
    {
      name: "Notification",
      collection: "notifications",
      schema: createNotificationSchema(),
    },
    {
      name: "AuditLog",
      collection: "audit_logs",
      schema: createAuditLogSchema(),
    },
    {
      name: "SystemEvent",
      collection: "system_events",
      schema: createSystemEventSchema(),
    },
    {
      name: "OperationRecord",
      collection: "operation_records",
      schema: createOperationRecordSchema(),
    },
    {
      name: "ReplenishmentLock",
      collection: "replenishment_locks",
      schema: createReplenishmentLockSchema(),
    },
    {
      name: "ReturnSourceLock",
      collection: "return_source_locks",
      schema: createReturnSourceLockSchema(),
    },
    {
      name: "ExternalReference",
      collection: "external_references",
      schema: createExternalReferenceSchema(),
    },
    {
      name: "ProductBatch",
      collection: "product_batches",
      schema: createProductBatchSchema(),
    },
    {
      name: "ReplenishmentRequest",
      collection: "replenishment_requests",
      schema: createReplenishmentRequestSchema(),
    },
    {
      name: "PurchaseOrder",
      collection: "purchase_orders",
      schema: createPurchaseOrderSchema(),
    },
    {
      name: "GoodsArrival",
      collection: "goods_arrivals",
      schema: createGoodsArrivalSchema(),
    },
    {
      name: "GoodsInspection",
      collection: "goods_inspections",
      schema: createGoodsInspectionSchema(),
    },
    {
      name: "GoodsReceipt",
      collection: "goods_receipts",
      schema: createGoodsReceiptSchema(),
    },
    {
      name: "TransferOrder",
      collection: "transfer_orders",
      schema: createTransferOrderSchema(),
    },
    {
      name: "WarehouseTransferRequest",
      collection: "warehouse_transfer_requests",
      schema: createWarehouseTransferRequestSchema(),
    },
    {
      name: "InternalTransferRequirement",
      collection: "internal_transfer_requirements",
      schema: createInternalTransferRequirementSchema(),
    },
    {
      name: "TransferDispatch",
      collection: "transfer_dispatches",
      schema: createTransferDispatchSchema(),
    },
    {
      name: "SalesOrder",
      collection: "sales_orders",
      schema: createSalesOrderSchema(),
    },
    {
      name: "WarehouseIssueRequest",
      collection: "warehouse_issue_requests",
      schema: createWarehouseIssueRequestSchema(),
    },
    {
      name: "DeliveryOrder",
      collection: "delivery_orders",
      schema: createDeliveryOrderSchema(),
    },
    {
      name: "SalesGoodsIssue",
      collection: "sales_goods_issues",
      schema: createSalesGoodsIssueSchema(),
    },
    {
      name: "DefectReport",
      collection: "defect_reports",
      schema: createDefectReportSchema(),
    },
    {
      name: "StockScrapRecord",
      collection: "stock_scrap_records",
      schema: createStockScrapRecordSchema(),
    },
    {
      name: "Stocktake",
      collection: "stocktakes",
      schema: createStocktakeSchema(),
    },
    {
      name: "StockAdjustment",
      collection: "stock_adjustments",
      schema: createStockAdjustmentSchema(),
    },
    {
      name: "FailedDelivery",
      collection: "failed_deliveries",
      schema: createFailedDeliverySchema(),
    },
    {
      name: "StockQualityChange",
      collection: "stock_quality_changes",
      schema: createStockQualityChangeSchema(),
    },
    {
      name: "CustomerReturn",
      collection: "customer_returns",
      schema: createCustomerReturnSchema(),
    },
    {
      name: "SupplierReturn",
      collection: "supplier_returns",
      schema: createSupplierReturnSchema(),
    },
    {
      name: "SupplierReturnIssue",
      collection: "supplier_return_issues",
      schema: createSupplierReturnIssueSchema(),
    },
    {
      name: "StockDiscrepancy",
      collection: "stock_discrepancies",
      schema: createStockDiscrepancySchema(),
    },
    {
      name: "CustodyReceipt",
      collection: "custody_receipts",
      schema: createCustodyReceiptSchema(),
    },
    {
      name: "CustodyRelease",
      collection: "custody_releases",
      schema: createCustodyReleaseSchema(),
    },
    {
      name: "StockReversal",
      collection: "stock_reversals",
      schema: createStockReversalSchema(),
    },
    {
      name: "OpeningStock",
      collection: "opening_stocks",
      schema: createOpeningStockSchema(),
    },
    {
      name: "SalesInvoice",
      collection: "sales_invoices",
      schema: createSalesInvoiceSchema(),
    },
  ];
}
