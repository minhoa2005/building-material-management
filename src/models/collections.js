export const documentCollections = Object.freeze({
  REPLENISHMENT: 'replenishment_requests', PO: 'purchase_orders',
  ARRIVAL: 'goods_arrivals', INSPECTION: 'goods_inspections', GR_PURCHASE: 'purchase_receipts',
  TO: 'transfer_orders', TRANSFER_REQUEST: 'warehouse_transfer_requests',
  INTERNAL_TRANSFER_REQUIREMENT: 'internal_transfer_requirements',
  TRANSFER_DISPATCH: 'transfer_dispatches', MWTR: 'transfer_receipts',
  SALES_ORDER: 'sales_orders', ISSUE_REQUEST: 'warehouse_issue_requests',
  OUTBOUND_DELIVERY: 'delivery_orders', GI_SALE: 'sales_goods_issues',
  DELIVERY_CONFIRMATION: 'delivery_confirmations', PAYMENT_CONFIRMATION: 'external_payment_confirmations',
  DEFECT_CASE: 'defect_reports', DISPOSITION: 'defect_resolution_plans', SCRAP: 'stock_scrap_records',
  STOCKTAKE: 'stocktakes', ADJUSTMENT: 'stock_adjustments', FAILED_DELIVERY: 'failed_deliveries',
  GR_FAILED_DELIVERY: 'failed_delivery_receipts', ST_RESOLUTION: 'stocktake_resolution_plans',
  RECLASS: 'stock_quality_changes', CUSTOMER_RETURN: 'customer_returns',
  GR_CUSTOMER_RETURN: 'customer_return_receipts', SUPPLIER_RETURN: 'supplier_returns',
  GI_SUPPLIER_RETURN: 'supplier_return_issues', SUPPLIER_ACK: 'supplier_acknowledgements',
  DISCREPANCY: 'stock_discrepancies', CUSTODY_RECEIPT: 'custody_receipts',
  CUSTODY_RELEASE: 'custody_releases', REVERSAL: 'stock_reversals', OPENING: 'opening_stocks',
});

export const collectionNames = Object.freeze({
  users: 'users', roles: 'roles', permissions: 'permissions', warehouses: 'warehouses',
  locations: 'warehouse_locations', products: 'products', lots: 'product_batches',
  product_warehouse_policies: 'stock_thresholds', stock_accounts: 'stock_holding_points',
  stock_balances: 'inventory_balances', posting_batches: 'stock_transactions',
  stock_movements: 'stock_movements', reservations: 'stock_reservations',
  demand_supply_allocations: 'supply_allocations', approvals: 'approval_history',
  evidence_refs: 'attachments', external_references: 'external_references',
  external_reference_lines: 'external_reference_lines', customer_return_assessments: 'return_inspections',
  return_source_claims: 'return_quantity_claims', demand_reopenings: 'delivery_demand_reopenings',
  od_commitment_transfers: 'delivery_commitment_transfers', sales_order_cancellations: 'sales_order_cancellations',
  defect_holds: 'stock_holds', stocktake_snapshots: 'stocktake_snapshots', count_attempts: 'stocktake_counts',
  location_locks: 'stocktake_location_locks', notifications: 'notifications', audit_events: 'audit_logs',
  outbox_events: 'system_events', business_operations: 'operation_records',
  replenishment_planning_guards: 'replenishment_locks', return_source_guards: 'return_source_locks',
});

export const splitSources = [
  'parties', 'uoms', 'product_uom_versions', 'business_documents', 'document_lines',
  'document_links', 'line_links', 'replenishment_submissions',
];

export const migrationCollections = [
  ...Object.values(collectionNames), ...Object.values(documentCollections),
  'customers', 'suppliers', 'storage_stacks', 'storage_stack_items', 'sales_invoices',
];

import { removedCollections } from './consolidation.js';
// Categories belong to the current design; the historical migration profile
// deliberately retains its original collection/field contract.
export const newCollections = [...migrationCollections.filter(name => !removedCollections.includes(name)), 'categories'];

export const workflowModelNames = Object.freeze({
  REPLENISHMENT: 'ReplenishmentRequest', PO: 'PurchaseOrder', ARRIVAL: 'GoodsArrival',
  INSPECTION: 'GoodsInspection', GR_PURCHASE: 'PurchaseReceipt', TO: 'TransferOrder',
  TRANSFER_REQUEST: 'WarehouseTransferRequest', INTERNAL_TRANSFER_REQUIREMENT: 'InternalTransferRequirement',
  TRANSFER_DISPATCH: 'TransferDispatch', MWTR: 'TransferReceipt', SALES_ORDER: 'SalesOrder',
  ISSUE_REQUEST: 'WarehouseIssueRequest', OUTBOUND_DELIVERY: 'DeliveryOrder', GI_SALE: 'SalesGoodsIssue',
  DELIVERY_CONFIRMATION: 'DeliveryConfirmation', PAYMENT_CONFIRMATION: 'ExternalPaymentConfirmation',
  DEFECT_CASE: 'DefectReport', DISPOSITION: 'DefectResolutionPlan', SCRAP: 'StockScrapRecord',
  STOCKTAKE: 'Stocktake', ADJUSTMENT: 'StockAdjustment', FAILED_DELIVERY: 'FailedDelivery',
  GR_FAILED_DELIVERY: 'FailedDeliveryReceipt', ST_RESOLUTION: 'StocktakeResolutionPlan',
  RECLASS: 'StockQualityChange', CUSTOMER_RETURN: 'CustomerReturn', GR_CUSTOMER_RETURN: 'CustomerReturnReceipt',
  SUPPLIER_RETURN: 'SupplierReturn', GI_SUPPLIER_RETURN: 'SupplierReturnIssue', SUPPLIER_ACK: 'SupplierAcknowledgement',
  DISCREPANCY: 'StockDiscrepancy', CUSTODY_RECEIPT: 'CustodyReceipt', CUSTODY_RELEASE: 'CustodyRelease',
  REVERSAL: 'StockReversal', OPENING: 'OpeningStock',
});

export const modelNames = Object.freeze({
  Location: 'WarehouseLocation', Lot: 'ProductBatch', ProductWarehousePolicy: 'StockThreshold',
  StockAccount: 'StockHoldingPoint', StockBalance: 'InventoryBalance', PostingBatch: 'StockTransaction',
  Reservation: 'StockReservation', DemandSupplyAllocation: 'SupplyAllocation', Approval: 'ApprovalHistory',
  Evidence: 'Attachment', CustomerReturnAssessment: 'ReturnInspection', ReturnSourceClaim: 'ReturnQuantityClaim',
  DemandReopening: 'DeliveryDemandReopening', OdCommitmentTransfer: 'DeliveryCommitmentTransfer',
  DefectHold: 'StockHold', CountAttempt: 'StocktakeCount', LocationLock: 'StocktakeLocationLock',
  AuditEvent: 'AuditLog', OutboxEvent: 'SystemEvent', BusinessOperation: 'OperationRecord',
  ReplenishmentPlanningGuard: 'ReplenishmentLock',
});
