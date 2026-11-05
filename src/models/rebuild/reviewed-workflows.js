import { Schema, code, date, decimal, embeddedOptions, integer, ref, refs, text } from '../model-utils.js';
import { sourceReference } from './reviewed-support.js';
import { QUALITY_CODES } from '../constants.js';

const id = () => ({ type: Schema.Types.ObjectId, required: false });
const opt = length => text(length, { required: false });
const embedded = fields => new Schema(fields, embeddedOptions);
const signed = () => decimal({ signed: true, required: false });
const quantity = () => decimal({ required: false });
const revision = () => integer(1, { required: false });
const review = embedded({
  decisionId: ref('ApprovalHistory'), revision: integer(1), reviewedBy: ref('User'), reviewedAt: date(),
  decision: code(['APPROVE','REJECT','REVISE']), reason: text(2000),
});
const execution = embedded({
  itemId: { type: Schema.Types.ObjectId, required: true }, performedBy: ref('User'), performedAt: date(),
  quantityBase: decimal(), transactionId: ref('StockTransaction', false), evidenceIds: refs('Attachment'), note: opt(2000),
});
const postedKinds = new Set(['GR_PURCHASE','TO','TRANSFER_DISPATCH','MWTR','GI_SALE','SCRAP','ADJUSTMENT',
  'GR_FAILED_DELIVERY','RECLASS','GR_CUSTOMER_RETURN','GI_SUPPLIER_RETURN','CUSTODY_RECEIPT','CUSTODY_RELEASE','REVERSAL','OPENING']);

export function addReviewedWorkflowFields(schema, kind) {
  schema.add({
    updatedBy: ref('User', false), revision: revision(), evidenceIds: refs('Attachment'),
    cancelledBy: ref('User', false), cancelledAt: date(false), cancelReason: opt(2000),
  });
  if (postedKinds.has(kind)) schema.add({
    stockTransactionId: ref('StockTransaction', false), postedBy: ref('User', false), postedAt: date(false),
  });
  const header = schema.path('header')?.schema;
  function addHeader(fields) {
    if (header) header.add(fields);
    else schema.add({ header: { type: embedded(fields), required: true } });
  }
  const item = schema.path('items').schema;
  // Embedded discriminators were compiled with the base schema. Extend both.
  function addItemFields(fields) {
    item.add(fields);
    for (const child of Object.values(item.discriminators || {})) child.add(fields);
  }
  addItemFields({ note: opt(2000), evidenceIds: refs('Attachment') });
  switch (kind) {
    case 'REPLENISHMENT':
      addHeader({ approvedRevision: revision(), latestDecisionId: ref('ApprovalHistory', false) });
      addItemFields({ approvedQtyBase: quantity(), requiredBatchId: ref('ProductBatch', false), neededBy: date(false) });
      break;
    case 'PO':
      addHeader({ approvedRequestRevision: revision(), orderDate: date(false), issuedAt: date(false),
        closedAt: date(false), closureDecisionId: ref('ApprovalHistory', false), closureReason: opt(2000),
        supplierSnapshot: embedded({ code: text(60), name: text(200), phone: opt(30) }) });
      addItemFields({ requestItemId: id(), supplierConfirmedQtyBase: quantity(), supplierConfirmedBy: ref('User', false),
        supplierConfirmedAt: date(false), cancelledRemainderQtyBase: quantity(), cancellationDecisionId: ref('ApprovalHistory', false),
        deliverySchedule: [new Schema({ quantityBase: decimal(), expectedAt: date(), supplierReference: opt(160) }, embeddedOptions)] });
      break;
    case 'ARRIVAL':
      addHeader({ purchaseOrderId: ref('PurchaseOrder', false), recordedAt: date(false), deliveredBy: opt(160), vehicleReference: opt(100) });
      addItemFields({ purchaseOrderItemId: id(), expectedProductId: ref('Product', false), observedLabel: opt(500), lotLabelSnapshot: opt(200), packagingCondition: opt(30) });
      break;
    case 'INSPECTION':
      addHeader({ arrivalId: ref('GoodsArrival', false), warehouseId: ref('Warehouse', false), previousInspectionId: ref('GoodsInspection', false),
        correctionReason: opt(2000), participants: refs('User'), confirmedBy: ref('User', false), confirmedAt: date(false) });
      break;
    case 'GR_PURCHASE':
      addHeader({ purchaseOrderId: ref('PurchaseOrder', false), arrivalId: ref('GoodsArrival', false),
        supplierId: ref('Supplier', false), receivedAt: date(false) });
      addItemFields({ purchaseOrderItemId: id(), arrivalItemId: id(), inspectionId: ref('GoodsInspection', false),
        inspectionResultId: id(), destinationLocationId: ref('WarehouseLocation', false),
        custodyReceiptRef: sourceReference, custodyBalanceId: ref('InventoryBalance', false), supplierScheduleId: id() });
      break;
    case 'TO':
      addHeader({ requirementId: ref('InternalTransferRequirement', false), reason: opt(2000),
        confirmedBy: ref('User', false), confirmedAt: date(false) });
      break;
    case 'TRANSFER_REQUEST':
      addHeader({ approvedRevision: revision(), requestedBy: ref('User', false), requestedAt: date(false), reason: opt(2000),
        approvalStatus: opt(40), executionStatus: opt(40), reviewedBy: ref('User', false), reviewedAt: date(false),
        rejectionReason: opt(2000), closedBy: ref('User', false), closedAt: date(false) });
      addItemFields({ approvedQtyBase: quantity() });
      break;
    case 'INTERNAL_TRANSFER_REQUIREMENT':
      addHeader({ sourceType: opt(80) });
      break;
    case 'TRANSFER_DISPATCH':
      addHeader({ approvedRevision: revision(), sourceWarehouseId: ref('Warehouse', false), destinationWarehouseId: ref('Warehouse', false) });
      break;
    case 'MWTR':
      addHeader({ warehouseId: ref('Warehouse', false), putawayStatus: opt(40), damageReportIds: refs('DefectReport') });
      break;
    case 'SALES_ORDER':
      addHeader({ recipientName: opt(160), recipientPhone: opt(30) });
      addItemFields({ priceRevision: revision() });
      break;
    case 'ISSUE_REQUEST':
      addHeader({ salesOrderVersion: revision(), requestedBy: ref('User', false), requestedAt: date(false) });
      break;
    case 'OUTBOUND_DELIVERY':
      addHeader({ recipientName: opt(160), recipientPhone: opt(30), deliveryAddress: opt(500), deliveryInstructions: opt(2000),
        releasedBy: ref('User', false), releasedAt: date(false), replacesDeliveryOrderId: ref('DeliveryOrder', false) });
      break;
    case 'GI_SALE':
      addHeader({ deliveryOrderId: ref('DeliveryOrder', false), issuedAt: date(false), issuedBy: ref('User', false) });
      addItemFields({ salesOrderItemId: id(), salePriceSnapshot: embedded({
        saleUnit: text(60), baseUnitsPerSaleUnit: decimal({ positive: true, precision: 24, scale: 12 }),
        unitSellingPrice: decimal(), salesOrderRevision: integer(1),
      }) });
      break;
    case 'DELIVERY_CONFIRMATION':
      addHeader({ goodsIssueId: ref('SalesGoodsIssue', false), correctsConfirmationId: ref('DeliveryConfirmation', false) });
      break;
    case 'PAYMENT_CONFIRMATION':
      addHeader({ voidedBy: ref('User', false), voidedAt: date(false), voidReason: opt(2000), replacesId: ref('ExternalPaymentConfirmation', false) });
      break;
    case 'DEFECT_CASE':
      addHeader({ warehouseId: ref('Warehouse', false), reportedBy: ref('User', false), recordedAt: date(false), sourceRef: sourceReference });
      addItemFields({ sourceRef: sourceReference, balanceId: ref('InventoryBalance', false), ownerType: opt(30), ownerId: id() });
      schema.add({ inspections: [execution] });
      break;
    case 'DISPOSITION':
      addHeader({ defectReportId: ref('DefectReport', false), proposedBy: ref('User', false), submittedAt: date(false), previousPlanId: ref('DefectResolutionPlan', false) });
      schema.add({ reviewDecisions: [review] });
      addItemFields({ approvedQtyBase: quantity() });
      break;
    case 'SCRAP':
      addHeader({ warehouseId: ref('Warehouse', false), planId: ref('DefectResolutionPlan', false), approvedRevision: revision(),
        destroyedBy: ref('User', false), destroyedAt: date(false) });
      break;
    case 'STOCKTAKE':
      addHeader({ reason: opt(2000), plannedAt: date(false), scopeVersion: revision(),
        scope: embedded({ locationIds: refs('WarehouseLocation'), batchIds: refs('ProductBatch'), productIds: refs('Product'), areaCodes: [String] }),
        assignedCounterIds: refs('User'), activatedBy: ref('User', false), activatedAt: date(false),
        closedBy: ref('User', false), closureReferenceId: id() });
      break;
    case 'ST_RESOLUTION':
      addHeader({ scopeVersion: revision(), previousPlanId: ref('StocktakeResolutionPlan', false), reason: opt(2000),
        proposedBy: ref('User', false), proposedAt: date(false), closedBy: ref('User', false), closedAt: date(false) });
      schema.add({ selectedCounts: [embedded({ snapshotId: ref('StocktakeSnapshot'), countId: ref('StocktakeCount') })],
        reviewDecisions: [review], executionRecords: [execution] });
      break;
    case 'ADJUSTMENT':
      addHeader({ stocktakeId: ref('Stocktake', false), resolutionPlanId: ref('StocktakeResolutionPlan', false), warehouseId: ref('Warehouse', false) });
      addItemFields({ planItemId: id(), snapshotIds: refs('StocktakeSnapshot'), countIds: refs('StocktakeCount'),
        stockBalanceId: ref('InventoryBalance', false), quantityDeltaBase: signed(), beforeQty: quantity(), afterQty: quantity(), reason: opt(1000) });
      break;
    case 'FAILED_DELIVERY':
      addHeader({ goodsIssueId: ref('SalesGoodsIssue', false), reportedBy: ref('User', false), recordedAt: date(false) });
      addItemFields({ holderName: opt(160) });
      break;
    case 'GR_FAILED_DELIVERY':
      addHeader({ failedDeliveryId: ref('FailedDelivery', false), receivedAt: date(false), receivedBy: ref('User', false) });
      break;
    case 'RECLASS':
      addHeader({ warehouseId: ref('Warehouse', false), operationId: ref('OperationRecord', false), planId: ref('DefectResolutionPlan', false) });
      addItemFields({ fromBalanceId: ref('InventoryBalance', false), toBalanceId: ref('InventoryBalance', false),
        previousQuality: code(QUALITY_CODES, { required: false }), targetQuality: code(QUALITY_CODES, { required: false }) });
      break;
    case 'CUSTOMER_RETURN':
      addHeader({ openedBy: ref('User', false), openedAt: date(false) });
      schema.add({ decisions: [review] });
      break;
    case 'GR_CUSTOMER_RETURN':
      addHeader({ returnId: ref('CustomerReturn', false), receivedAt: date(false), operationId: ref('OperationRecord', false) });
      addItemFields({ custodyBalanceId: ref('InventoryBalance', false), inspectionId: ref('ReturnInspection', false) });
      break;
    case 'SUPPLIER_RETURN':
      schema.add({ agreements: [embedded({ itemId: { type: Schema.Types.ObjectId, required: true }, agreedQtyBase: decimal(),
        verifiedBy: ref('User'), verifiedAt: date(), version: integer(1), evidenceIds: refs('Attachment') })],
        closure: embedded({ closedBy: ref('User'), closedAt: date(), reason: text(2000) }) });
      break;
    case 'GI_SUPPLIER_RETURN':
      addHeader({ supplierReturnId: ref('SupplierReturn', false), issuedAt: date(false), issuedBy: ref('User', false),
        receivedByName: opt(160), operationId: ref('OperationRecord', false) });
      break;
    case 'SUPPLIER_ACK':
      addHeader({ supplierReturnId: ref('SupplierReturn', false), supplierId: ref('Supplier', false), acknowledgedAt: date(false),
        supplierContact: opt(160), recordedBy: ref('User', false), recordedAt: date(false) });
      schema.add({ reconciliations: [execution] });
      break;
    case 'DISCREPANCY':
      addHeader({ sourceRef: sourceReference, warehouseId: ref('Warehouse', false), reportedBy: ref('User', false), reportedAt: date(false) });
      schema.add({ resolutionEvents: [execution] });
      break;
    case 'CUSTODY_RECEIPT':
    case 'CUSTODY_RELEASE':
      addHeader({ warehouseId: ref('Warehouse', false), ownerType: code(['CUSTOMER','SUPPLIER'], { required: false }), ownerId: id(),
        receivedAt: date(false), receivedBy: ref('User', false), handedOverBy: opt(160),
        releasedAt: date(false), releasedBy: ref('User', false), recipientName: opt(160), operationId: ref('OperationRecord', false) });
      break;
    case 'REVERSAL':
      addHeader({ originalTransactionId: ref('StockTransaction', false), sourceDocument: sourceReference, sourceVersion: revision(),
        warehouseIds: refs('Warehouse'), requestedBy: ref('User', false), requestedAt: date(false), reason: opt(2000),
        replacementDocument: sourceReference });
      schema.add({ approvalDecision: review });
      break;
    case 'OPENING':
      addHeader({ warehouseId: ref('Warehouse', false), cutoverKey: opt(160), openingAt: date(false), coveredLocationIds: refs('WarehouseLocation'),
        sourceDescription: opt(2000), preparedBy: ref('User', false), preparedAt: date(false), verifiedBy: ref('User', false),
        verifiedAt: date(false), verifiedVersion: revision(), verificationNote: opt(2000) });
      addItemFields({ locationId: ref('WarehouseLocation', false), ownerType: opt(30), ownerId: id(), qualityStatus: opt(30) });
      break;
  }
  if (kind === 'TRANSFER_DISPATCH' || kind === 'GI_SALE') {
    const handover = schema.path('handovers').schema;
    handover.path('header').schema.add({ teamNameAtHandover: opt(200) });
  }
  return schema;
}
