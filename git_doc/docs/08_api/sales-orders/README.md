# Sales native — creation, reads and execution

> Cập nhật 10/11/2026 cho runtime native. [Hợp đồng ba iteration HieuDT](../HIEUDT_ITERATIONS_NATIVE.md) mô tả sửa/hủy phần dư, WIR/OD, picking, quyền, kiểm kê và báo cáo. Các test pack trước chuyển DB chỉ là lịch sử.

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
`productId`, optional `lotId`, `enteredUnit`, decimal-string `unitSellingPrice`
and positive decimal-string `quantity`. `currencyCode` is required on the body.
Conversion uses the current product/batch resolver from [CONVERSIONS](../CONVERSIONS.md), with factor 1 for the base unit;
no conversionId, tone or calibre is accepted. Source recording does not fabricate Accountant
verification. Source/SO/lines/evidence/audit/operation/outbox commit atomically.
Duplicate sources return 409; identical actor/key/payload retries return the
existing SO. No stock or reservation changes occur. The native command receipt returns id,
version, workflowStatus, operationId, resultRefs and replayed; it does not return
a fabricated shortage evaluation result. The opt-in Cloudinary smoke test verifies private
upload, signed download, denied unsigned access and cleanup of its synthetic image.

Update/cancel, WIR/OD creation and picking have native command routes in the linked HieuDT contract. They are never performed by GET. GI posting, POD and payment remain separate use cases.

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
Document metadata contains `id`, `documentNo`, `documentKind`, `workflowStatus`,
`version`, `createdAt`. The runtime field is `workflowStatus` (not `status`). Stored workflow status is not recalculated by GET.

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

Current native verification is `test/hieudt-iterations.integration.test.js`, including service transactions and authenticated HTTP. Run using the [isolated local test guide](../../09_phat_trien/HIEUDT_LOCAL_TESTS.md). `sales-validation.test.js` covers strict input parsing. The old `sales-iteration1.integration.test.js`, `sales-create.integration.test.js` and FE-06 test pack predate the native migration and are not current runtime proof. Live Cloudinary smoke verification remains opt-in via `LIVE_SALES_EVIDENCE_TEST=true`; it was not run in this task.
