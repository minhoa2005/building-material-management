# UC-01 / UC-02: replenishment read API

The module reads existing `BusinessDocument` / `DocumentLine` REPLENISHMENT
discriminators. It does not create or change requests, stock, reservations,
approvals, operations, notifications or planning guards. It does not evaluate a
new purchase requirement. Database data must already follow revision 3.3.

## Authentication and record scope

Both GETs use the existing authenticate/checkPermission middleware to require an
active user and `replenishment_request:read` on the single populated `User.roleId`.
The service derives record scope from that current role without repeating the
endpoint permission check. OWNER can read RR records in all warehouses, including
historical inactive warehouses, without requiring warehouse assignments.
ACCOUNTANT can read RR records in `User.warehouseIds`.
SALES/WAREHOUSE can read only their own (`createdBy`) RR records in those
warehouses. No per-RR assignment exists in this release. ADMIN does not bypass
business permissions. Linked documents still require their own operation through
the shared rolePermissions helper, as well as their warehouse/record scope.

Empty warehouse assignments yield an empty list and 404 detail for ACCOUNTANT,
SALES and WAREHOUSE; OWNER remains able to read all RR records. Historical
inactive masters remain readable. Inactive masters cannot contribute live stock.

## GET /api/replenishments

| Query | Meaning/default |
| --- | --- |
| page | Positive integer, default 1; bounded to a safe pagination offset |
| limit | Integer 1–100, default 10 |
| search | Literal case-insensitive RR document number search; trimmed, max 100 characters |
| warehouseId | Optional ObjectId; OWNER may filter any warehouse; an explicitly unauthorized warehouse returns 403 for other roles |
| createdBy | Optional ObjectId; intersects rather than replaces creator scope |
| status | DRAFT, SUBMITTED, APPROVED, REJECTED, REVISION_REQUIRED |
| approvalDecision | APPROVE, REJECT, REVISE, NONE; newest RR decision only |
| createdFrom / createdTo | Optional valid YYYY-MM-DD dates; inclusive Asia/Saigon calendar dates |

Unknown parameters, repeated scalar parameters, operator/object inputs and
reversed dates return 400. Dates become a UTC interval with exclusive next-day
end. Sorting is `createdAt DESC, _id DESC`. All filters precede count/pagination.

Success uses the existing envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": { "items": [], "total": 0, "page": 1, "limit": 10 }
}
```

Each item contains `id`, `documentNo`, `workflowStatus`, `version`,
`warehouse: {id, code, name}`, `createdBy: {id, fullName}`, `createdAt`, `neededOn`,
`lineCount`, `linePreview` (first three lines by lineNo) and `latestDecision`.

The latest decision is ordered by `documentVersion DESC, decidedAt DESC, _id
DESC`, with `decisionKind=REPLENISHMENT_APPROVAL`. `NONE` means no such decision,
not merely that the current version is undecided. `latestDecision` contains
`id`, `documentVersion`, `isForCurrentVersion`, `decisionKind`, `decision`,
`requestedBy`, `decidedBy`, `decidedAt` and `reason`.

## GET /api/replenishments/:id

`:id` is an ObjectId. The response `data` extends the list header with
`updatedAt`, `submittedBy`, `submittedAt`, `triggerReason`, `note` and:

| Field | Contents |
| --- | --- |
| lines | Saved quantities/conversions, source identity and evaluation snapshot; live stock kept separate |
| latestDecision | Same decision summary as the list |
| approvalHistory | Newest first; decision summaries plus `lines: [{lineId, approvedQtyBase, outcome}]` |
| reservations | ACTIVE stored records: id, demandLineId, canonicalSalesOrderLineId, qtyBase, status |
| allocations | Stored records in all statuses: same demand fields plus a permission-scoped supply reference |
| purchaseReferences | Deduplicated PO references from both header and line links |
| purchaseLineLinks | id, replenishmentLineId, purchaseLineId, linkedQtyBase, purchaseOrder |
| sourceDocumentLinks | Stored relationCode and scoped source reference |
| sourceLineLinks | Stored id, relationCode, sourceLineId, replenishmentLineId, linkedQtyBase |

### Line fields

- `id`, `lineNo`, `product: {id, sku, name, isActive}`. Name prefers the saved
  `productNameSnapshot`; SKU is current master data if available.
- `enteredQty`, `enteredUom: {id, code, name}`, `conversionId`,
  `conversionVersion`, `conversionSnapshot`, `qtyBase`, `baseUom`.
  Units come from the referenced conversion/product, never an assumed BOX/M2
  factor or the latest conversion version.
- `approvedQtyBase` comes only from APPROVE on this document version and this
  line ID. A real zero is `"0"`; no applicable approval is `null`.
- `reasonNote`, `quantityAdjustmentReason`.
- `source`: saved `triggerType`, source SO-line/WIR-line/stocktake IDs and
  versions, policy ID/version, and permission-scoped `references`.
- `evaluationSnapshot`: `evaluationKey`, `evaluatedAt`, `suggestedQtyBase`,
  `availableQtyBase`, `otherWarehouseCoverageQtyBase`, `remainingDemandQtyBase`,
  `reservedForDemandQtyBase`, `onHandCoverageQtyBase`, `incomingCoverageQtyBase`,
  `pendingRequestCoverageQtyBase`, `minimumQtyBase`, `targetQtyBase`.
  Absent historical values are null; these values are never recalculated by GET.
- `currentStock`: `warehouseId`, `productId`, `scope: PRODUCT_WAREHOUSE`,
  `baseUom`, `availableQtyBase`, `computedAt`.

Quantities/factors are decimal strings, IDs are strings and dates are UTC ISO.
No totals mix different products/units. No current shortage or current suggested
purchase quantity is returned. Multiple lines for the same product/warehouse
share the same live stock reference, not independent available capacity.

### Live stock and related records

Available means STORE-owned, GOOD, VERIFIED lot, active product/warehouse and
active allocatable STORAGE location, with no location lock or ACTIVE defect
hold. A hold excludes the entire balance. Subtract ACTIVE reservations once;
exclude transit, custody, receiving, staging and incoming PO supply. Empty
eligible stock is `"0"`; a query failure is an error, and reservation exceeding
eligible balance returns 500 rather than a fabricated zero.

Availability is a computed live reference, not a reservation or a multi-command
planning snapshot. Matching tone/calibre, delivery deadlines, outstanding demand
and coverage must be evaluated separately before a later create/submit command.

Demand records are resolved to a canonical SO line. Only typed, same-product WIR
releases in the same SO chain and with readable parent scope extend its demand
IDs. Each stored allocation/reservation ID appears once; no combined coverage
total is inferred. A source without read access yields no hydrated demand records.

RR permission never grants access to another UC. Linked references keep saved
identity with `access: UNAVAILABLE` when missing or restricted, with no document
number/status/private file URL. Readable references additionally expose only
documentNo/workflowStatus/version. PO and stocktake require their own operation,
role and warehouse scope. In UC-02, OWNER can read related metadata across
warehouses only when its separate document permission is granted. SO metadata is conservatively restricted to its creator
or responsibility-scoped OWNER/ACCOUNTANT through the authorized RR. A hidden
allocation supply is only `{access: UNAVAILABLE}`. Broken PO line links retain
purchaseLineId and use `purchaseOrder: null`.

## Errors and deployment

Errors retain `{success:false,message}`: 400 validation, 401 authentication,
403 operation/explicit warehouse filter, 404 for missing/wrong-kind/out-of-scope
RR using the same message. Missing linked records do not make the RR a 404.

The two declared compound list indexes must be deployed through the normal
schema/index procedure. GET does not migrate data or create indexes. Importing
the application in tests avoids startup seeding. Run `npm test`; set
`MONGODB_TEST_URI` to a disposable MongoDB test server to enable integration
tests, which always override the database name and clean up only their own
random database.
