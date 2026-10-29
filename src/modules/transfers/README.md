# FE-05 Iteration 1 — UC-38 / UC-39

GET `/api/warehouse-transfers` and GET `/api/warehouse-transfers/:id` use the
existing `{success,message,data}` response envelope and authentication.
There are no write endpoints in this module.

List query: optional sourceWarehouseId, destinationWarehouseId, status, from/to
(ISO timestamps with timezone), page (default 1), limit (default 20, maximum 100).
Unknown fields/operators/invalid IDs/date order return 400. Results sort by
createdAt descending then _id; filtering and authorization happen before paging.
Data is `{items,total,page,limit}`. Empty results are valid.

OWNER has store-wide access. ACCOUNTANT reads reconciliation data. WAREHOUSE
requires assignment to either source or destination. ADMIN has no business
access. SALES requires a saved, non-cancelled DemandSupplyAllocation tracing
the supply TR/TD line back to a SO created by that user (directly or through its
WIR). No assignment field for another Sales user exists in this schema.
Sales gets progress only; notes, evidence and internal decisions are omitted.
Decision confirmed on 29 October 2026: a related demand grants Sales the overall
TR progress, even when the TR serves several Sales users. Internal documents,
line details, notes, evidence, handovers and operational actors remain hidden.
Unrelated or unavailable detail returns 404; missing operation permission 403.

Requested quantities come from TR lines. Dispatch/receipt totals use POSTED TD
and POSTED MWTR lines; receipts must reference a matching product/lot dispatch
line in that same dispatch. Draft quantities do not count as actual movements.
Transit is read from stock accounts keyed by dispatch line, not guessed as the
requested quantity minus received quantity. Quantities use decimal strings.
Multiple products are listed in quantitiesByProduct; combined quantity fields
are null when products differ, to avoid adding incompatible base units.

Detail includes saved TR lines, current-version TRANSFER_APPROVAL quantities,
separate dispatch/receipt documents, handovers, source-line links, differences,
linked warehouse tasks and evidence metadata (never private objectKey/URL/hash).
Missing approval quantity is null, not implicitly equal to requested quantity.
The stored status is displayed; receiving one batch never closes a TR on read.
Read operations use a snapshot transaction and require a MongoDB replica set.

Iteration 1 supplies reads before dispatch/receipt write modules exist. Reversal,
cancellation and variance execution writers must maintain their source documents
and balances consistently. The current projection does not recalculate a complete
closure decision or authorize a new posting. There is no evidence download route
and no FE HTTP integration in this change.

Tests: `node --test test/transfer-reads.test.js` and, with a test replica-set URI
in MONGODB_TEST_URI, `node --test test/transfer-reads.integration.test.js`.
Integration creates and drops only a random sep490_transfer_read_* database.
