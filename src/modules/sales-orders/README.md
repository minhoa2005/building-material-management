# FE-06 Iteration 1 — sales creation and reads

Implemented routes (authenticated):

| UC | Method / path | Permission |
| --- | --- | --- |
| UC-47 | POST /api/sales-orders | sales_order:create |
| UC-47 evidence | POST /api/sales-orders/source-evidence | sales_order:create |
| UC-46 | GET /api/sales-orders/:id | sales_order:read |
| UC-46 evidence | GET /api/sales-orders/:id/evidence/:evidenceId | sales_order:read, source scope |
| UC-49 | GET /api/outbound-deliveries | outbound_delivery:read |
| UC-50 | GET /api/outbound-deliveries/:id | outbound_delivery:read |

UC-47 follows the confirmed single-form source-entry decision. Sales uploads an
image using POST /api/sales-orders/source-evidence (multipart `file`, max 5 MB).
Cloudinary stores authenticated evidence and returns an actor-bound signed
`receipt` valid for 24 hours. No public URL is returned. Unused uploads after
abandoned forms currently require manual cleanup.

POST /api/sales-orders accepts `idempotencyKey`, `customerId`, ISO `neededOn`,
`deliveryAddress`, `evidenceReceipt`, `source`, `lines`.
Source contains `sourceSystem` (MISA/PAPER), `referenceNo`, optional ISO
`referenceDate` and real `sourceVersion`. Each line contains `sourceLineKey`,
`productId`, `conversionId`, positive decimal-string `quantity` and optional
`requiredTone`/`requiredCalibre`. Source recording does not fabricate Accountant
verification. Source/SO/lines/evidence/audit/operation/outbox commit atomically.
Duplicate sources return 409; identical actor/key/payload retries return the
existing SO. No stock or reservation changes occur. SALES_ORDER_SAVED carries
document version; the shortage consumer is not implemented, so the response
reports evaluation PENDING. The opt-in Cloudinary smoke test verifies private
upload, signed download, denied unsigned access and cleanup of its synthetic image.

Update/cancel, WIR/OD creation, picking,
posting, POD and payment confirmations are separate commands, not performed by GET.

## Scope and input

OWNER and ACCOUNTANT can reconcile business documents. SALES sees SOs created
by that user and ODs linked through those SOs' WIRs. The current schema has no
assigned-sales field; assignment access is not inferred. WAREHOUSE sees ODs in
assigned warehouses and SO lines related to its WIR/OD execution only. ADMIN
has no business access. Inaccessible and missing details both return 404.

The OD list accepts optional literal case-insensitive document-number search `q`, `warehouseId`, `salesOrderId`, `issueRequestId`,
uppercase `status`, ISO date-time `from`/`to` (inclusive creation-time range),
`page` (default 1) and `limit` (default 20, maximum 100). Invalid or unknown
parameters return 400. List totals are computed after access filtering.

## Response contract

Standard `{success,message,data}` envelope. List data contains
`{items,total,page,limit}`. Decimal quantities are strings; IDs are strings.
Document metadata contains `id`, `documentNo`, `documentKind`, `status`,
`version`, `createdAt`. Stored workflow status is not recalculated by GET.

SO detail contains source reference metadata, line conversion snapshots,
WIR/OD history, cancellations, failed-delivery reopenings and payment
confirmation metadata. Warehouse responses omit external-source and evidence
metadata. Evidence entries never expose storage keys, hashes or download URLs.
Internal notes and financial amounts are not projected.
The evidence endpoint applies the same source access rules, excludes Warehouse,
and returns a signed private download URL valid for 60 seconds with no-store headers.

OD detail contains WIR/SO links, lines, reservations, picking task references,
GI/POD/failed-delivery receipt histories and replacement commitment transfers.
For each line, `grossIssuedQtyBase` is ledger-posted GI quantity after full
batch reversals; `returnedFailedDeliveryQtyBase` is ledger-posted GR-FD quantity
after reversals; `netIssuedQtyBase` is their difference. `deliveredQtyBase`
comes from confirmed POD lines. Replacement ODs keep their original WIR/SO-line
identity; their commitments are not added to original customer demand.
Different product/base-UOM quantities are never summed into one document total.

Reads use a MongoDB snapshot transaction, requiring a replica set or Atlas.
They do not change documents, stock, reservations, ledger or status. Cross-document
source identities are validated before projecting details. Historical inconsistencies
are not repaired or silently overwritten by read APIs.

## Tests

`node --test test/sales-validation.test.js` validates query/ID parsing.
Set `MONGODB_TEST_URI` to a local test replica set and run
`node --test test/sales-iteration1.integration.test.js` for authenticated HTTP,
role/warehouse/source scope, FD/replacement progress, reversal and read-only checks.
The integration test creates a randomly named database and removes only that
database; it never uses the URI's existing database as its test target.

`sales-create.integration.test.js` covers authenticated upload and creation over
HTTP, concurrent idempotent replay, wrong roles/actors, evidence retrieval scope,
rollback, duplicate source, decimal/whole-unit guards and stale conversion.
Cloudinary is mocked only in the HTTP suite. For live storage verification run
`LIVE_SALES_EVIDENCE_TEST=true node --import dotenv/config --test test/sales-evidence.live.test.js`.
See [the Thunder Client pack](../../../docs/api/fe06-iteration1/README.md) for
importable requests, synthetic IDs and the isolated demo server.
