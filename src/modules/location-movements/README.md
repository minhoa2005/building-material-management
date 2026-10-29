# Location movements — UC-35 / UC-36

Implemented endpoints use `/api` and the existing `{success,message,data}` envelope.
They operate on `BusinessDocument(documentKind=TO, header.taskKind=RELOCATE)` and
`DocumentLine(lineKind=WAREHOUSE_TASK)`. No new document collection, TR or Owner
approval is introduced. UC-34 list and UC-37 confirmation are separate work.

## Access

- POST requires an active WAREHOUSE user with `stock_relocation:create` and the
  selected warehouse in the user's actual `warehouseIds`.
- GET requires `stock_relocation:read`: OWNER can view store-wide; WAREHOUSE only
  assigned warehouses. ADMIN, ACCOUNTANT and SALES cannot use these endpoints.
- Current roles/permissions are reloaded by authentication. Caller-supplied actor,
  owner, status, product/lot and calculated base quantities are not accepted.
- Unknown records, other TO kinds and records outside read scope return 404.

## Create

`POST /api/location-movements`

```json
{
  "idempotencyKey": "relocate-device-request-001",
  "warehouseId": "0123456789abcdef01234567",
  "reason": "Consolidate the same lot into one storage area",
  "lines": [
    {
      "sourceBalanceId": "1123456789abcdef01234567",
      "sourceBalanceVersion": 0,
      "toLocationId": "2123456789abcdef01234567",
      "conversionId": "3123456789abcdef01234567",
      "enteredQty": "2.5"
    }
  ]
}
```

IDs above are placeholders; use persisted MongoDB IDs, including the version from
the source balance. Source location, lot, product, quality and ownership come from
that balance, never a client snapshot. Conversion resolves the entered UOM; the
current effective ProductUomVersion and its exact factor are snapshotted.
No rounding of fractional pieces or quantities beyond six decimal places occurs.

The body accepts 1–100 lines. Quantities are **decimal strings**, not JS numbers.
Same source/destination lines must be combined. Multiple destinations can share a
source only if their combined planned base quantity fits the remaining stock.

Checks include active warehouse/product/locations, distinct locations in the
selected warehouse, current source version and conversion, stocktake locks,
active defect holds, reservation consistency and outstanding warehouse tasks.
Relocation preserves location kind; cross-kind receiving/storage/staging/
quarantine transitions belong to put-away, picking or disposition. An allocatable
destination only accepts STORE-owned GOOD stock from a VERIFIED lot. Product-
specific physical capacity restrictions are not invented; the current Location
model does not contain capacity or product compatibility rules.

Reserved stock can be relocated (BF-03-A1). Creation neither releases nor moves
reservations, and does not subtract the same reserved quantity a second time as
an open task. UC-37 must recheck and carry reservations when actually moving it.
Open tasks for the same source/lot/quality/owner consume planning allowance;
legacy tasks without owner metadata are treated conservatively as conflicts.

A successful transaction creates the OPEN TO, lines, BusinessOperation and
AuditEvent. It does **not** write balances, stock ledger, posting batches or
reservations. `assignedTo` and `createdBy` are the authenticated creator.

Response: HTTP 201, `data={id,documentNo,documentKind,taskKind,warehouseId,
workflowStatus,version,operationId,replayed:false}`. A retry by the same user with
the same key and normalized body returns the same document with HTTP 200 and
`replayed:true`; the response contains the document's current status/version.
Reusing that key with a different body returns 409. Keep the key through a timeout
or refresh retry. Resolve the previous result before submitting changed input.

## Detail

`GET /api/location-movements/:id`

The result contains `id`, `documentNo`, `documentKind`, `taskKind`, `warehouseId`,
`warehouseName`, `workflowStatus`, `version`, `reason`, `createdBy`, `assignedTo`,
`createdAt`, `lines` and `postings`.

Each line includes IDs and labels for product/lot/source/destination, quality,
owner, source balance/version, entered quantity/UOM/conversion version and factor,
`plannedQtyBase`, `actualQtyBase` and `remainingQtyBase`. All quantities/factors
are strings. Product name and conversion factor use the saved snapshots.
Historical inactive references remain readable; missing descriptive references
return null labels while keeping their IDs.

Actual quantity is derived from committed StockMovement rows linked to the TO
and line. A two-sided ledger row counts once. Reversals reduce the net actual
quantity; reversing a reversal restores it. An OPEN order with no postings shows
actual `"0"`, never the planned quantity. Posting history includes batch IDs,
operation keys, actor/time, reversal links and movement endpoints/before/after.
Endpoint warehouse scope is also checked. GET performs no writes.

## Errors and frontend integration

- 400: invalid DTO/ID/quantity, incompatible product conversion or warehouse/location.
- 401: missing/invalid authentication or inactive account.
- 403: wrong operation/role or unassigned create warehouse.
- 404: unavailable or out-of-scope detail, mismatched historical scope.
- 409: changed source/conversion, shortage/conflicting tasks, lock/hold,
  unsuitable destination or idempotency payload mismatch.

Errors retain the current `{success:false,message}` contract; no new error-code
or fieldErrors contract is assumed. The existing FE `locationMoveStore.ts` is a
local mock and is not wired by this BE-only change. Its display-name actors,
`quantityBoxes:number` and demo warehouse IDs must not be sent to this API.
Map real stock-balance/UOM IDs and decimal strings; render OPEN/PARTIAL/CONFIRMED
explicitly instead of assuming the FE's demo status vocabulary is authoritative.

## Transactions and deployment

MongoDB replica set/Atlas is required. Existing unique indexes on documentNo,
document/lineNo and BusinessOperation idempotency keys must be deployed. No
production migration, seed, index deletion or database rewrite runs in this task.

Two additive schema changes preserve historical records:

- WAREHOUSE_TASK details optionally retain sourceBalanceId/sourceBalanceVersion/
  ownerPartyId; UC-36 always writes these fields for new tasks.
- Location.planningVersion is a nonnegative guard, default zero. `$inc` also
  initializes the field on existing locations, so no bulk backfill is needed.

Create locks the source/destination Location guard rows in ascending ID order
inside the transaction. Concurrent UC-36 planners therefore recheck open tasks
after write conflicts. Stock-balance quantity/version is not changed to plan a
task. Future UC-32/54/87/37 and posting/hold writers must participate in the same
location guard protocol for cross-module races; those services are not yet
implemented in this checkout. Confirmation must revalidate live stock,
reservations, holds, locks, permissions and versions; create is not permission to
move stock later without checks.

## Verification

```powershell
node --test test/location-movements.test.js
$env:MONGODB_TEST_URI = 'mongodb://127.0.0.1:27136/?replicaSet=uc36test'
node --test test/location-movements.integration.test.js
```

Integration uses a unique `sep490_relocation_verification_<ObjectId>` database
and drops only that test database. It checks real HTTP authentication/authorization,
schema/index persistence, exact conversions, stock-neutral creation, idempotency,
competing plans, rollback, frozen/held stock, historical detail and posting totals.

Verified on 29 October 2026: the full `node --test` suite passed 86 tests with
MONGODB_TEST_URI pointing at an isolated local MongoDB 8.2 replica set (zero
failures/skips). A separate `src/index.js` startup smoke check, with seeding
disabled, connected to the test database and returned health 200 / unauthenticated
detail 401. This is backend verification, not a frontend end-to-end test.
