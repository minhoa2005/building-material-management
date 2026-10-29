# Shared Mongoose models

Import models from `src/models/index.js` in application modules:

```js
import { User, BusinessDocument, DocumentLine, StockBalance } from '../../models/index.js';
```

Each model is registered once on the default Mongoose connection. Importing the
entry point registers schemas; it does not connect, seed data or post inventory.
Model references use registered model names, with ObjectId identifiers. Field
names are camelCase; timestamps use UTC Date values.

## Source and mapping decisions

Aligned with the user-provided `WMSD_SQL_schema.sql`, revision 3.3.0
(27 October 2026), with the single-role decision of 28 October 2026. The SQL is a relational design reference; persistence stays
MongoDB. All 84 SQL tables have a representation below, using 40 collections,
35 document discriminators and 19 line discriminators. Representation does not
mean that all foreign keys or business workflows are enforced by these schemas.

| SQL tables | MongoDB model / representation |
| --- | --- |
| app_user, user_warehouse | User; required scalar roleId references Role; warehouseIds remains a unique reference array |
| app_role, role_permission | Role; permissionIds holds unique references |
| permission | Permission |
| warehouse, location, party | Warehouse, Location, Party |
| uom, product, product_uom_version, product_warehouse_policy, lot | Uom, Product, ProductUomVersion, ProductWarehousePolicy, Lot |
| quality_status | QUALITY_STATUSES / QUALITY_CODES; finite code catalogue |
| document, document_external_reference | BusinessDocument; externalReferenceIds holds unique references |
| replenishment_request, purchase_order, arrival, goods_receipt | REPLENISHMENT, PO, ARRIVAL, GR_PURCHASE / GR_CUSTOMER_RETURN / GR_FAILED_DELIVERY typed document headers |
| transfer_request, transfer_dispatch, transfer_receipt, handover | TRANSFER_REQUEST, TRANSFER_DISPATCH, MWTR, HANDOVER typed headers |
| issue_request, outbound_delivery, goods_issue, warehouse_task | ISSUE_REQUEST, OUTBOUND_DELIVERY, GI_SALE / GI_SUPPLIER_RETURN, TO typed headers |
| sales_order, customer_delivery, external_payment_confirmation | SALES_ORDER, DELIVERY_CONFIRMATION, PAYMENT_CONFIRMATION typed headers |
| business_operation, sales_order_cancellation | BusinessOperation, SalesOrderCancellation; separate append-only collections |
| defect_case, customer_return, supplier_return | DEFECT_CASE, CUSTOMER_RETURN, SUPPLIER_RETURN typed headers |
| stocktake, stocktake_scope | STOCKTAKE typed header; header.scopeLocationIds stores unique scope IDs |
| document_line | DocumentLine; independently addressable lines with their own ObjectId |
| inspection_line, transfer_receipt_line, issue_request_line, warehouse_task_line | INSPECTION, TRANSFER_RECEIPT, ISSUE_REQUEST, WAREHOUSE_TASK typed line details |
| sales_order_line, outbound_delivery_line, sales_goods_issue_line, customer_delivery_line | SALES_ORDER, OUTBOUND_DELIVERY, SALES_GOODS_ISSUE, DELIVERY_CONFIRMATION typed line details |
| disposition_line, customer_return_line, supplier_return_line | DISPOSITION, CUSTOMER_RETURN, SUPPLIER_RETURN typed line details |
| supplier_ack_line, discrepancy_line, adjustment_line | SUPPLIER_ACK, DISCREPANCY, ADJUSTMENT typed line details |
| customer_return_assessment | CustomerReturnAssessment; separate append-only versioned assessments |
| failed_delivery, failed_delivery_line, failed_delivery_receipt_line | FAILED_DELIVERY typed header; FAILED_DELIVERY and FAILED_DELIVERY_RECEIPT typed line details |
| return_source_claim, demand_reopening, od_commitment_transfer | ReturnSourceClaim, DemandReopening, OdCommitmentTransfer; separate collections |
| return_source_guard | ReturnSourceGuard; per-issued-line write token serializes concurrent customer-return claim caps |
| defect_hold, stocktake_resolution, stocktake_resolution_line | DefectHold collection; ST_RESOLUTION typed header and line details |
| document_link, line_link | DocumentLink, LineLink |
| approval, approval_line | Approval with bounded lines belonging to one decision |
| evidence | Evidence; private object key, hash, MIME type and uploader |
| external_reference, external_reference_line | ExternalReference, ExternalReferenceLine |
| stock_account, stock_balance, posting_batch, stock_movement | StockAccount, StockBalance, PostingBatch, StockMovement |
| reservation, demand_supply_allocation | Reservation, DemandSupplyAllocation |
| location_lock, stocktake_snapshot, count_attempt | LocationLock, StocktakeSnapshot, CountAttempt |
| audit_event, outbox_event | AuditEvent, OutboxEvent |
| replenishment_line | REPLENISHMENT typed DocumentLine details |
| notification | Notification; per-recipient history/readAt, no stored live alert |
| replenishment_planning_guard | ReplenishmentPlanningGuard; one warehouse/product version guard |

Document headers share the `business_documents` collection through internal
Mongoose discriminators keyed by `documentKind`. Use the exported base model;
the constructor selects the appropriate typed schema. Document lines use
`lineKind` (default STANDARD), with typed data under `details`, and share the
`document_lines` collection. They remain separate from documents because many
source, approval, ledger and return records refer to individual lines. No
unbounded ledger, audit or count history is embedded in a document.

The parent SQL subtype IDs (`sales_order_id` on a sales order line,
`issue_request_id` on a WIR line, `delivery_id` on a POD line, etc.) are the
existing `DocumentLine.documentId`, not duplicate fields inside `details`.
Redundant ancestor IDs used in SQL composite foreign keys are resolved from
typed headers/source lines. Services must verify that those references belong
to the same chain. SQL code-based foreign keys (UOM, roles, permissions) use
ObjectId references to the corresponding catalogue models.

```js
const po = new BusinessDocument({
  documentNo: 'PO-2026-0001', documentKind: 'PO', createdBy: userId,
  header: { supplierId, warehouseId },
});

const inspection = new DocumentLine({
  documentId: inspectionDocumentId, lineNo: 1, lineKind: 'INSPECTION',
  productId, lotId, conversionId,
  enteredQty: '3', conversionSnapshot: '4', qtyBase: '12',
  productNameSnapshot: 'Historical product name',
  details: {
    inspectedSourceLineId: arrivalLineId, qualityCode: 'GOOD',
    ownershipDecision: 'ACCEPT', inspectedBy: userId, inspectedAt: new Date(),
  },
});
```

## Numeric, identity and history contracts

- Quantities use Decimal128 with NUMERIC(20,6) limits; conversion factors use
  NUMERIC(24,12) limits. Supply decimal strings or Decimal128; fractional JS
  numbers are rejected. decimal.js performs exact comparisons, conversion
  rounding and movement before/after checks without binary floating point.
- User keeps existing fullName, passwordHash, phone and isActive names.
  passwordHash is excluded from normal query selection. SQL display_name,
  credential_hash and active map to those fields.
- User.roleId is a required scalar Role reference with a non-unique index; roleIds is removed. Role.code follows the supplied design:
  OWNER, SALES, WAREHOUSE, ACCOUNTANT, ADMIN. Existing legacy role data requires
  the explicit single-role migration/role assignment before starting the updated backend.
  No migration or automatic role/permission seeding runs on import.
- Uom.code is extensible; PIECE, BOX and M2 are initial design examples, not a
  restriction to tile products. Quality is PENDING/GOOD/DAMAGED/BLOCKED;
  transit is represented by StockAccount, not by a quality code.
- Unique indexes cover natural identities, document lines, stock dimensions,
  source release keys, posting operation/idempotency keys, reversals and counts.
  Optional unique references use partial ObjectId indexes so absent/null values
  do not collide. Only one STORE party and one live lock per location are allowed.
- ProductUomVersion, Approval, Evidence, PostingBatch, StockMovement,
  StocktakeSnapshot, CountAttempt, AuditEvent, BusinessOperation,
  SalesOrderCancellation, CustomerReturnAssessment, DemandReopening and
  OdCommitmentTransfer reject Mongoose update/delete
  operations and re-saving existing records. Insert corrections/new versions.
  Outbox delivery attempts, active reservations, ReturnSourceClaim.status and
  DefectHold.status remain mutable. Claim/hold source facts are immutable paths.

## Revision 3.1 contracts

- SALES_ORDER.header requires externalReferenceId, customerId, neededOn and
  deliveryAddressSnapshot. Source reference and source line are each unique
  within the SO subtype. ISSUE_REQUEST.header requires salesOrderId;
  ISSUE_REQUEST line details require salesOrderLineId and releaseKey. Release
  uniqueness is `(salesOrderLineId, releaseKey)`, including across WIR documents.
- OD line details reference issueRequestLineId; SALES_GOODS_ISSUE line details
  reference outboundDeliveryLineId. DELIVERY_CONFIRMATION line details require
  salesIssueLineId and photoEvidenceId, unique per `(documentId, salesIssueLineId)`.
  POD headers record salesOrderId, warehouseId, recipientName, deliveredAt,
  confirmedBy/confirmedAt and operationId. Photo ownership, actual image content,
  upload success, assigned Warehouse actor and posted GI coverage are service checks.
- PAYMENT_CONFIRMATION.header requires salesOrderId, deliveredOrderVersion,
  fullPaymentReceived=true, confirmedBy/confirmedAt and operationId. At least one
  of externalReceiptReference, receiptEvidenceId or confirmationNote is required.
  `(salesOrderId, deliveredOrderVersion)` is unique within this subtype. Each
  confirmation subtype also has a unique operationId. VOIDED confirmations keep
  their data and uniqueness; re-confirmation uses a new SO version/operation.
- SO workflowStatus is DRAFT/OPEN/IN_PROGRESS/PARTIALLY_DELIVERED/DELIVERED/
  COMPLETED/CANCELLED. POD/PAY-CFM status is DRAFT/CONFIRMED/VOIDED. Other
  document kinds keep their existing extensible workflow status field.
- BusinessOperation stores stable operation/idempotency keys, a SHA-256
  payloadHash, documentVersion, performedBy/performedAt and optional reason.
  It records non-stock operations independently of PostingBatch. Cancellation
  facts reference an operation and positive cancelledQtyBase, with actor/reason.
- ExternalReference requires a unique nonblank correlationId; referenceDate and
  provider sourceVersion are optional. Do not invent a provider revision.
- Inspection details record packagingCondition (SEALED/OPENED/TORN/UNKNOWN,
  default UNKNOWN) independently of quality/ownership. Supplier-return details
  require agreementVersion, agreementVerifiedBy/At and agreementEvidenceId;
  there is no Owner authorizationId field for BF-08.
- CustomerReturnAssessment stores an immutable, numbered assessment for a return
  line and document version. Installed/customer-damaged/overdue conditions imply
  INELIGIBLE; otherwise missing conditions imply PENDING; fully known eligible
  conditions imply CASE_REVIEW. Known deadlines require deadlineReference.
  CASE_REVIEW is not acceptance. Approval permits the SQL self-decision exception
  only for decisionKind=STANDARD_ACCEPTANCE; the service must still verify Sales,
  ordinary CR conditions, Warehouse inspection and latest assessment. Owner
  EXCEPTION_APPROVAL requires a different requester. No assessment applies to FD.
- FAILED_DELIVERY.header needs warehouseId, failureEvidenceId and reason. Its
  lines require salesIssueLineId. GR_FAILED_DELIVERY uses receiptKind=FAILED_DELIVERY;
  FAILED_DELIVERY_RECEIPT line details need failedDeliveryLineId, salesIssueLineId,
  inspectionLineId and optional claimId. ReturnSourceClaim permits exactly one
  sales issue/historical external source; FD always requires a sales issue.
  Claims reserve source allowance, not stock; status is OPEN/CONSUMED/RELEASED.
- DemandReopening has a unique receiptLineId and stores the original SO/WIR/OD
  line chain, positive reopenedQty, sourceVersion and postingBatchId.
  OdCommitmentTransfer.reopeningReceiptLineId is a DocumentLine reference and
  logically joins DemandReopening.receiptLineId, not DemandReopening._id.
  Transfers require distinct fromOdLineId/toOdLineId, qtyBase, both versions and
  operationId. Ordinary customer returns do not reopen demand.
- DefectHold stores balance, defect document, optional stocktake, quantity,
  evidence and actor/time; status is ACTIVE/RESOLVED. As in SQL available_stock,
  any ACTIVE hold excludes that balance from new allocation, without changing
  its quantity or quality. The available-stock aggregation is a service concern.
- ST_RESOLUTION.header stores stocktakeId, planVersion and optional approvalId/
  closureBatchId. Its line details require countId and actionKind. DELTA has one
  endpoint matching its nonzero deltaQty sign, and qtyBase=abs(deltaQty).
  RECLASS/RELOCATE have two distinct endpoints and no deltaQty. Execution actor,
  time and evidence are all present or all absent. RECLASS2 plus shortage2 is
  separate from shortage4; a quality-only correction never creates ADJUSTMENT0.

## Revision 3.3 contracts

| Component | 3.3.0 contract |
|---|---|
| ProductWarehousePolicy | productId/warehouseId unique; Decimal128 minimumQty/targetQty; target defaults to minimum and must be >= minimum; version >=1 and optional updatedBy |
| REPLENISHMENT header | creationKey, textual triggerReason; submittedBy/submittedAt together; unique (createdBy, creationKey) only for RR string keys |
| REPLENISHMENT line | triggerType SALES_SHORTAGE/STOCKTAKE_LOW_STOCK/MANUAL_OTHER; direct SO-line/version or stocktake/version/policy/version; evaluationKey/evaluatedAt, coverage snapshots, positive suggestedQty, reasonNote, quantityAdjustmentReason when changed |
| Source links | REPLENISHES_SALES_ORDER, REPLENISHES_DEMAND, RELATED_ISSUE_REQUEST, STOCKTAKE_REPLENISHMENT, REPLENISHMENT_PURCHASE; childDocumentId reverse index; service validates types/product/warehouse/quantity |
| DemandSupplyAllocation | Canonical sales demand is SO line; resolve existing WIR allocations to the same obligation, never duplicate SO/WIR allocations for the same quantity |
| ReplenishmentPlanningGuard | Unique warehouseId/productId with integer version; shared conditional writes in coverage-changing transactions, no copied stock totals |
| Notification | recipientId/type/title/message/warehouseId/sourceDocumentId/sourceDocumentVersion/eventKey/evaluatedAt/readAt/dedupKey; warehouse required after stocktake; unique derived dedupKey; recipient/time and unread indexes |
| OutboxEvent | documentVersion required for STOCKTAKE_CLOSED/SALES_ORDER_SAVED; commit with source, process afterward; retries do not repeat stock or RR commands |

MongoDB mapping: **40 collections, 35 document discriminators, 19 line discriminators**. Relational reference: **84 tables and 2 views**; new tables replenishment_line, notification and replenishment_planning_guard. SQL remains a reference, not the runtime or an executed migration. Notification metadata is not a BusinessDocument and has no SYSTEM-created RR actor.


The user approved application of proposal 1.4.0 on 27 October 2026: [source-backed replenishment](../../git_doc/docs/03_thiet_ke/De_xuat_bo_sung_hang_theo_nguon_2026-10-27.md). Business revision 3.3.0 retains eight BFs, five roles and 111 UCs (97 active/14 retired), extending UC-03/13/47/48/88/93/103/109 and BR-03/25 without adding UC IDs.

1. After a valid SO save, evaluate compatible, timely, uncommitted local stock, feasible other-warehouse options and incoming PO/transfer supply. The SO line is the original demand; WIR is optional context, and SO/WIR/OD releases must not multiply demand.
2. Evaluate low stock only after committed stocktake closure, updated balances and scope unlock, including zero-stock SKUs. Defer while relevant freezes remain. Warehouse prepares/confirms execution; Owner approves/posts differences through UC-92/93. A no-variance closure remains valid under BF-05. Owner closure triggers evaluation, not RR creation.
3. Alert when available < minimum; target >= minimum and defaults to minimum. Subtract valid coverage and saved pending RRs once. Sales shortages and reserve needs remain separate; other-warehouse possibilities become commitments only through a selected, validated fulfilment option.
4. Create request opens one prefilled form. Users edit, add source-backed or reasoned extra products, then Save draft or Submit. Opening/cancelling/Later persists no RR. Changed evaluations preserve entered fields for review; source references and reasons remain per line.
5. Sales/Warehouse submits; a different Owner approves; Accountant creates the PO after approval. Closing a stocktake grants no new RR creation right to Owner. Link SO→RR or Stocktake→RR, SO-line→RR-line and RR→PO; no invented external/evidence document is required for a low-stock reason.
6. Commit STOCKTAKE_CLOSED/SALES_ORDER_SAVED and source version to the outbox with the source command. After commit, the consumer evaluates and persists per-recipient Notifications. Stable dedupKey prevents duplicate delivery without resetting readAt or creating an RR. Active Warehouse staff with current warehouse/source access receive a count summary; SO notices remain scoped to authorized handlers.
7. Notification stores historical message/source/recipient/evaluatedAt/readAt. Listing, unread counts and source access enforce current permissions. Reading is independent of resolving a shortage. Opening a warning or creating an RR reevaluates current stock and coverage. Later neither hides demand nor creates pending coverage. MVP has no StockAlert collection; assignment, snoozing, reasoned dismissal or alert-state history would require a later design.

Example without sales demand: available18/min50/target50/incoming10 suggests22 but creates no RR. Opening the form persists nothing; Save draft records DRAFT22 with count source and reason; pending RR22 prevents another22. A previous Notification remains historical while the detail page shows current coverage.

Only model validation/index definitions and synthetic seed data are implemented here; proposed endpoints, outbox consumers, authorization checks and planning transactions remain service work. Schema validation cannot prove closure state, current coverage, source existence or permissions.


**Unified prefilled RR form (approved proposal1.4.0, baseline3.3.0):** Select warning lines and choose Create request, or open the menu and choose a source/other need. Prefill verified product, warehouse, suggested quantity, reason and references. Users edit quantity, need date and reasons; source product/warehouse/references are fixed until the context is reselected and reevaluated. One RR has one receiving warehouse/need date; other groups require separate reviewed requests.

- Opening/cancelling the form or choosing Later persists no RR, links or pending coverage. Save draft creates DRAFT; Submit validates then records SUBMITTED with the actual user. Editing an existing draft updates its ID/version. A different Owner approves; Accountant PO follows approval.
- After successful SO save, check compatible timely local/other-warehouse/incoming sources and existing RRs. An uncovered quantity prompts: “The order was saved; some quantity has no suitable timely source. Create a replenishment request?” Users select lines and open the form. Handle both no supply and partial supply; covered demand links to its existing source/RR. Display feasible unselected source options before declaring no suitable source.
- Evaluation pending/failed is not zero supply and does not fail the saved SO. Prompt once per demand-affecting save; refresh, retry or note-only edits do not reopen it. Warnings and Create request remain available on SO details.
- Extra products are allowed: each needs its own valid source or MANUAL_OTHER reason. Products outside the SO never inherit its sales-line quantity link. Different sources/reasons may have separate lines; duplicate identical source lines must be merged/corrected.
- Save/submit reevaluates source versions and coverage. Show old/new values and retain entered fields for reconfirmation, rather than overwriting quantities. Cancelled, unauthorized or no-longer-needed sources must be corrected/removed; never silently detach a source or reclassify it. Excess above a sales shortage is a separate other-need line.
- Create contracts use action SAVE_DRAFT/SUBMIT, creationKey, warehouse/date/reasons and per-line source. No creation-method classification is stored. Permissions, Notification/readAt, guards and payload hashes retain their purpose; form opening/notification reading never posts stock. Reserve need dates without evidence are explicitly chosen by the user.

## Service/database responsibilities

These schemas validate documents through `validate()` / `save()` and define
indexes; they do not implement the eight business flows or database foreign
keys. Query updates, direct collection access and bulk operations can bypass
document validation. Use validated documents in the transaction service, never
accept arbitrary client-provided update operators. Apply and verify indexes as
part of database deployment; unique is an index declaration, not a validator.

The following remain service/transaction requirements: reference existence and
source kinds; product/lot/conversion and warehouse compatibility; actual actor
and warehouse authorization; approved version/quantity ceilings; independent
transfer receipt; whole-base-unit enforcement from Product; cumulative source
limits and reservations; frozen scope membership and posting races; immutable
posted documents/lines and used master-data identity; verified external sources;
and atomic posting of batch, movements, balances, reservations, status, audit
and outbox. Increment/filter document and balance versions atomically. Enforce
append-only history through database access controls as well as Mongoose guards.

In particular, source caps and concurrent POD/CR/FD claims need a common
conditional write guard on the source line in a MongoDB transaction. Consume a
claim, post the receipt, update net SO/WIR/OD progress/version, write reopening,
audit and outbox atomically. The same transaction rule applies to stocktake
closure: recheck latest plan/count/Owner decision, post delta/transfers, resolve
holds and release locks only on successful closure. These services are not
implemented by model definitions. Transactions require a replica set or sharded
cluster. Mongoose refs and indexes do not enforce compound foreign keys.

The two SQL views (`inventory_ledger`, `available_stock`) require reporting
aggregations/services; they are not collections and are not implemented here.
An uncounted item has no CountAttempt; a real zero count is an explicit record.
An ADJUSTMENT line stores a nonzero signed details.deltaQty; qtyBase is its
absolute value. Model tests run without connecting to MongoDB via `npm test`.
Set `MONGODB_TEST_URI` to opt into the MongoDB integration checks. They override
the database name with a random `sep490_model_verification_<ObjectId>` database
and drop only that temporary database afterward.

## Schema deployment

Deploy the declared current collections/indexes explicitly after reviewing the target database. Fresh demo seeding writes only to an entirely empty database and never fills a populated one. Update the permission catalogue and existing role assignments explicitly; seed:sync-permissions requires all permission records to exist before changing roles. No model import performs database maintenance. Transaction services must enforce current source kinds, scope, coverage and idempotency; form DTO/schema definitions alone do not implement those operations.

## Single-role decision — 28 October 2026

Each user, including inactive accounts, must have exactly one of OWNER/SALES/WAREHOUSE/ACCOUNTANT/ADMIN; many users may share a role. Permissions come only from the current role, with no combined roles or session role switching. Assigned warehouses remain independent and may include multiple warehouses. Role changes affect subsequent requests and never rewrite historical actors or decisions. Response role, roles=[role] and primaryRole=role use lowercase codes; uppercase roleCode remains the write input. These aliases are not persisted. Legacy arrays never grant rights. See [migration instructions](../../README.md#single-role-migration).
