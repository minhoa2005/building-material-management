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

Based on the user-provided `WMSD_SQL_schema.sql` and
`de_xuat_database_design_EN.md` (18 October 2026). The SQL is a relational design
reference; persistence stays MongoDB. All 63 SQL tables are represented below,
using 30 collections rather than creating a collection for every join/subtype.

| SQL tables | MongoDB model / representation |
| --- | --- |
| app_user, user_role, user_warehouse | User; roleIds and warehouseIds hold unique reference arrays |
| app_role, role_permission | Role; permissionIds holds unique references |
| permission | Permission |
| warehouse, location, party | Warehouse, Location, Party |
| uom, product, product_uom_version, product_warehouse_policy, lot | Uom, Product, ProductUomVersion, ProductWarehousePolicy, Lot |
| quality_status | QUALITY_STATUSES / QUALITY_CODES; finite code catalogue |
| document, document_external_reference | BusinessDocument; externalReferenceIds holds unique references |
| replenishment_request, purchase_order, arrival, goods_receipt | REPLENISHMENT, PO, ARRIVAL, GR_PURCHASE / GR_CUSTOMER_RETURN typed document headers |
| transfer_request, transfer_dispatch, transfer_receipt, handover | TRANSFER_REQUEST, TRANSFER_DISPATCH, MWTR, HANDOVER typed headers |
| issue_request, outbound_delivery, goods_issue, warehouse_task | ISSUE_REQUEST, OUTBOUND_DELIVERY, GI_SALE / GI_SUPPLIER_RETURN, TO typed headers |
| defect_case, customer_return, supplier_return | DEFECT_CASE, CUSTOMER_RETURN, SUPPLIER_RETURN typed headers |
| stocktake, stocktake_scope | STOCKTAKE typed header; header.scopeLocationIds stores unique scope IDs |
| document_line | DocumentLine; independently addressable lines with their own ObjectId |
| inspection_line, transfer_receipt_line, issue_request_line, warehouse_task_line | INSPECTION, TRANSFER_RECEIPT, ISSUE_REQUEST, WAREHOUSE_TASK typed line details |
| disposition_line, customer_return_line, supplier_return_line | DISPOSITION, CUSTOMER_RETURN, SUPPLIER_RETURN typed line details |
| supplier_ack_line, discrepancy_line, adjustment_line | SUPPLIER_ACK, DISCREPANCY, ADJUSTMENT typed line details |
| document_link, line_link | DocumentLink, LineLink |
| approval, approval_line | Approval with bounded lines belonging to one decision |
| evidence | Evidence; private object key, hash, MIME type and uploader |
| external_reference, external_reference_line | ExternalReference, ExternalReferenceLine |
| stock_account, stock_balance, posting_batch, stock_movement | StockAccount, StockBalance, PostingBatch, StockMovement |
| reservation, demand_supply_allocation | Reservation, DemandSupplyAllocation |
| location_lock, stocktake_snapshot, count_attempt | LocationLock, StocktakeSnapshot, CountAttempt |
| audit_event, outbox_event | AuditEvent, OutboxEvent |

Document headers share the `business_documents` collection through internal
Mongoose discriminators keyed by `documentKind`. Use the exported base model;
the constructor selects the appropriate typed schema. Document lines use
`lineKind` (default STANDARD), with typed data under `details`, and share the
`document_lines` collection. They remain separate from documents because many
source, approval, ledger and return records refer to individual lines. No
unbounded ledger, audit or count history is embedded in a document.

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
- User.role is replaced by roleIds. Role.code follows the supplied design:
  OWNER, SALES, WAREHOUSE, ACCOUNTANT, ADMIN. Existing legacy role data requires
  an explicit migration/role assignment before implementing authentication.
  No migration or automatic role/permission seeding runs on import.
- Uom.code is extensible; PIECE, BOX and M2 are initial design examples, not a
  restriction to tile products. Quality is PENDING/GOOD/DAMAGED/BLOCKED;
  transit is represented by StockAccount, not by a quality code.
- Unique indexes cover natural identities, document lines, stock dimensions,
  source release keys, posting operation/idempotency keys, reversals and counts.
  Optional unique references use partial ObjectId indexes so absent/null values
  do not collide. Only one STORE party and one live lock per location are allowed.
- ProductUomVersion, Approval, Evidence, PostingBatch, StockMovement,
  StocktakeSnapshot, CountAttempt and AuditEvent reject Mongoose update/delete
  operations and re-saving existing records. Insert corrections/new versions.
  Outbox delivery attempts and active reservations remain mutable.

## Service/database responsibilities

These schemas validate documents through `validate()` / `save()` and define
indexes; they do not implement the seven business flows or database foreign
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

The two SQL views (`inventory_ledger`, `available_stock`) require reporting
aggregations/services; they are not collections and are not implemented here.
An uncounted item has no CountAttempt; a real zero count is an explicit record.
An ADJUSTMENT line stores a nonzero signed details.deltaQty; qtyBase is its
absolute value. Model tests run without connecting to MongoDB via `npm test`.
Set `MONGODB_TEST_URI` to opt into the MongoDB integration checks. They override
the database name with a random `sep490_model_verification_<ObjectId>` database
and drop only that temporary database afterward.
