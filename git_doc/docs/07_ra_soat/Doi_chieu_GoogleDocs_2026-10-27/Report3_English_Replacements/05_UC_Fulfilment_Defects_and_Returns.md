# Report 3 — 36 use cases: fulfilment, defects, returns and external references

All replacement content is included below. Do not ask for a baseline file, upload, repository path or external comparison document. Replace the named sections with the English text inside each <replacement_text> block; the wrapper tags are editing markers and must not appear in the report. Preserve the document template and convert Markdown tables into document tables. Preserve existing content outside the specified replacement scope. Do not claim to have changed embedded images or tested software unless those actions were actually completed.

In II, replace the 36 use-case specifications whose full text is supplied below. Insert missing use cases under their existing feature group. Preserve the feature groups and use-case identifiers. This message contains every replacement specification; no other file is required.

Remove UC-23–25, UC-42, UC-59–62, UC-74–78 and UC-106 from active catalogues, permissions, detailed specifications, diagrams and navigation. Remove SC-25–27 from active screen requirements. Preserve the original IDs of the 97 remaining use cases and 28 active screens; do not renumber them. Keep UC-108 external document references and UC-111 external payment-receipt confirmation in scope.

The shared contract and failure table below are included as reference within this prompt. Use them for every replacement specification; place them once in the report, at II introduction and I.2.9 respectively.

All active operations require authenticated active user, exact server-side operation/sub-operation and warehouse/record/evidence scope. View does not grant mutation. Source/version is rechecked; typed decisions bind document/version/line/qty and proper actual users; C2 allows Sales own ordinary CR, while Owner approvals require distinct requester. Stock effects commit source/balance/ledger/reservation/status/audit/outbox atomically with stable operation/idempotency keys. Failed confirmation leaves no partial change. Freeze blocks mutation except explicitly authorized clearing.

2.9 — Shared failures across all processes

| ID | Condition | Required outcome |
|---|---|---|
| EX-01 | Wrong role/warehouse, self-approval or transfer receiver equals dispatcher | Reject server-side, protect evidence scope and leave data/stock unchanged. |
| EX-02 | Version conflict or competing claims on the same quantity | Recheck version/source/approval in transaction; roll back the whole failed batch, refresh and handle the remainder. |
| EX-03 | Retry after connection loss with unknown commit | Look up idempotency and operation keys; return committed result or retry the uncommitted operation with the same key; changed payload conflicts. |
| EX-04 | Stocktake-frozen location | Block ordinary quantity/location/quality postings and backdating. Allow balance-neutral defect hold/evidence; only version-matched UC-92-approved B1 plan/UC-93 closure with Warehouse evidence may post. Retain freeze until batch/holds/tasks resolve; failure rolls back without unlock. |
| EX-05 | Upload/print/email failure | Required evidence missing blocks posting; post-commit notification failure retries outbox only, without rollback or repeat stock posting. |

Accept each branch by its BF-xx-A/E ID above and EX-01–05. These are implementation acceptance criteria, not reported backend test results.

## Replacement content

<replacement_text>

UC-45: View Copied Sales Order List
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Related execution; Sales Staff — Own / assigned demand.
Screen(s): SC-16.
Description: Read scoped SO source, customer, issued/delivered/outstanding quantities and DELIVERED/COMPLETED progress.
Preconditions / required inputs: Authenticated user with authorized order/customer/evidence scope.
Normal flow:
1. Apply order/source/customer/date/state filters server-side.
2. Read SO lines, derived issued/customer-delivered/remaining amounts and linked confirmations/corrections.
3. Return only permitted source/attachment and document links.
Alternate/exception flows: Empty result remains a valid read; invalid/unauthorized input does not expose other warehouse/customer records.
Business branch coverage: BF-06-A1, BF-06-A3.
Shared failures: EX-01 role/scope; EX-02 source/version/concurrency; EX-03 unknown-commit lookup using stable operation key; EX-04 freeze where stock/holds change; EX-05 evidence/output failure. See I.2.9.
Postconditions / exact inventory effect: Read-only; no reservation, stock or state mutation.

UC-46: View Copied Sales Order Details
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Related execution; Sales Staff — Own / assigned demand.
Screen(s): SC-16.
Description: Read copied source lines, WIR/OD/GI/POD/PAY-CFM history and cancellations; no pricing, invoice or payment calculation.
Preconditions / required inputs: Authenticated user with authorized order/customer/evidence scope.
Normal flow:
1. Apply order/source/customer/date/state filters server-side.
2. Read SO lines, derived issued/customer-delivered/remaining amounts and linked confirmations/corrections.
3. Return only permitted source/attachment and document links.
Alternate/exception flows: Empty result remains a valid read; invalid/unauthorized input does not expose other warehouse/customer records.
Business branch coverage: BF-06-A1, BF-06-A3.
Shared failures: EX-01 role/scope; EX-02 source/version/concurrency; EX-03 unknown-commit lookup using stable operation key; EX-04 freeze where stock/holds change; EX-05 evidence/output failure. See I.2.9.
Postconditions / exact inventory effect: Read-only; no reservation, stock or state mutation.

UC-47: Create Copied Sales Order
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Sales Staff — create copied SO.
Screen(s): SC-16.
Description: Sales manually copies a verified external order with source line identity and evidence. Reject duplicate source orders/lines; entry changes no stock.
Preconditions / required inputs: Verified external system/document/line and source evidence; phone/Zalo instructions require a recorded source order.
Normal flow:
1. Capture customer/address/date, product/quantity/UoM/conversion version, tone/calibre requirement and source identity.
2. Check unique source order and lines; verify source/version/quantity without fabricating an external revision.
3. Save SO/lines with creator/time/version, business operation and audit; open the same SO for linked WIR creation.
Alternate/exception flows: Duplicate source returns existing SO or conflict; unverified source stays pending. No independent commercial order, pricing or MISA sync.
Business branch coverage: BF-06-E1.
Shared failures: EX-01 role/scope; EX-02 source/version/concurrency; EX-03 unknown-commit lookup using stable operation key; EX-04 freeze where stock/holds change; EX-05 evidence/output failure. See I.2.9.
Postconditions / exact inventory effect: SO saved; no stock/balance/reservation change.

UC-48: Update or Cancel Unissued Sales Order Remainder
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Sales Staff — Edit/cancel unexecuted or GR-FD-received-back, not-redelivered quantity.
Screen(s): SC-16.
Description: Sales changes only unexecuted or posted-GR-FD-received-back, not-redelivered quantity on the original SO. Preserve source and gross ledger; unresolved off-site stock cannot be cancelled.
Preconditions / required inputs: Original SO/current version; exact eligible remainder and dependent task/OD/reservation state.
Normal flow:
1. Validate unexecuted plus GR-FD-received-back, not-redelivered allowance.
2. Resolve tasks and versioned OD/WIR commitments and reservations before changing/cancelling remainder.
3. Append cancellation/business operation and recompute SO/version; invalidate stale PAY-CFM authority.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-06-A1, BF-06-A2, BF-06-A3.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: No inventory movement; cancellation releases only eligible commitments/holds.

UC-49: View Outbound Delivery List
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Related execution; Sales Staff — Own / assigned demand.
Screen(s): SC-22.
Description: Read-only outbound delivery search and listing.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve WIR/OD/warehouse/date/status, planned and outstanding quantities; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-50: View Outbound Delivery Details
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Related execution; Sales Staff — Own / assigned demand.
Screen(s): SC-22.
Description: Read-only outbound delivery details.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve selected OD source lines, holds, picking and actual GI quantities; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-51: Create Outbound Delivery
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Sales Staff — Plan OD/reuse or transfer reopened commitment without duplicate demand.
Screen(s): SC-22.
Description: Sales plans OD within net WIR allowance; redelivery reuses original OD or traceably transfers reopened commitment to replacement OD without new demand.
Preconditions / required inputs: Saved SO/WIR lines, current versions and available net fulfilment allowance.
Normal flow:
1. Create release for one warehouse from exact WIR line.
2. Use net valid PGI less valid posted GR-FD; never reopen from claim alone.
3. Reuse original OD or transfer exact reopened commitment to replacement with source/version history.
4. Reserve compatible free stock once; do not add original and replacement as independent demand.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-04-A1, BF-06-E1, BF-06-A1.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: OD/holds only; no physical deduction until actual PGI.

UC-52: View Picking Task List
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouse; Sales Staff — Related progress.
Screen(s): SC-23.
Description: Read authorized warehouse picking tasks associated with outbound delivery releases.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve OD/task/source warehouse/lot/locations/status and requested/picked/remainder; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-53: View Picking Task Details
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouse; Sales Staff — Related progress.
Screen(s): SC-23.
Description: Read required lot/location, assigned quantities, reservations, actual picks and shortage/defect evidence.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve selected task/reservation/source and staging location, actual pieces/quality/owner, discrepancy/unpick history; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-54: Create Picking Task
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Warehouse Staff — Perform; PGI only on actual handover.
Screen(s): SC-23.
Description: Warehouse creates picking TO against existing draft GI-S/OD, with compatible stock and FIFO within compatibility; task is execution, not Owner approval.
Preconditions / required inputs: Existing OD and draft GI-S, assigned warehouse and eligible stock/reservation.
Normal flow:
1. Validate draft GI-S/OD source and current version.
2. Suggest compatible lot/location then FIFO; create picking TO with reservation/staging.
3. Record permitted substitution consent/reason and partial quantity.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Instruction/hold only; no total deduction.

UC-55: Confirm Picking Task
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Warehouse Staff — Perform; PGI only on actual handover.
Screen(s): SC-23.
Description: Warehouse Staff confirms actual BOX/PIECE quantities into staging and preserves reservations and total stock. Shortage/damage routes to BF-02/05 or replanning; no silent stock correction.
Preconditions / required inputs: Open picking task and actual staged goods in assigned unfrozen warehouse.
Normal flow:
1. Count lot/pieces/quality; split partial/defective quantities.
2. Confirm actual storage→staging movement with reservation.
3. Record evidence; notify Sales, route defects BF-02 and unexplained mismatch targeted BF-05.
4. Retain remainder or document unpick after failed handover.
Alternate/exception flows: No silent balance/lot change; partial pick cannot authorize full PGI; no handover means no PGI.
Business branch coverage: BF-06-E2, BF-06-A2.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Picking/unpick changes location/reservation; total unchanged; staged stock not free supply.

UC-56: View goods issue list
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouse; Sales Staff — Related progress.
Screen(s): SC-17.
Description: Search by source request, issue date, and status.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Source request, issue date, status. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Issue no., source request, actual qty, status. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Issue no., source request, actual qty, status; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.
Additional display requirements: distinguish actual owned/physical/available/held/custody/transit and outstanding quantity in the related source chain; do not pool ownership or treat transit as a quality grade.

UC-57: View goods issue details
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouse; Sales Staff — Related progress.
Screen(s): SC-17.
Description: Display lot, location, prepared quantity, and actual issued quantity by line.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Issue number. A specific record must be selected before its details can be displayed.
Display fields: Lot, location, prepared/actual issued quantities. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Lot, location, prepared/actual issued quantities; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.
Additional display requirements: distinguish actual owned/physical/available/held/custody/transit and outstanding quantity in the related source chain; do not pool ownership or treat transit as a quality grade.

UC-58: Post Goods Issue
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Warehouse Staff — Draft GI-S before picking; post actual handover once.
Screen(s): SC-17.
Description: Warehouse creates/updates GI-S draft before picking, then posts actual confirmed handover once. Draft changes no stock; PGI does not itself mean DELIVERED/COMPLETED.
Preconditions / required inputs: OD/current source version; draft permitted before picking; posting requires actual picked quantity, TO execution when used, handover evidence and sufficient unfrozen source.
Normal flow:
1. Create/update GI-S DRAFT from OD before picking under draft permission/state checks.
2. Create/confirm actual picking TO; retain staged or traceably unpicked quantities before handover.
3. At handover record recipient/carrier/time/actual quantity and recheck net PGI less GR-FD allowance, version, source, reservation and freeze.
4. Commit PGI/ledger/balance/reservation/progress/audit/outbox once; print committed snapshot. Failed delivery after PGI uses BF-07-FD, without fabricated POD or erasing issue.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-06-A2, BF-06-E3.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Draft no stock; actual PGI deducts once. Redelivery retains gross dispatch/GR-FD history and net allowance.

UC-103: View and Select Shortage Fulfilment Options
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Store Owner — View; Warehouse Staff — View / select stock option; Sales Staff — View / confirm customer fulfilment.
Screen(s): SC-10, SC-16.
Description: Sales/Warehouse compares compatible available stock by warehouse and selects direct dispatch, physical transfer or replenishment. Link BF-01/04/06; suggestions do not automatically order or post.
Preconditions / required inputs: Sales/Warehouse shortage context; Owner view-only right.
Normal flow:
1. Compare compatible free stock, holds and timely allocated supply.
2. Offer direct dispatch/transfer/replenishment/waiting.
3. Sales records customer choice; Warehouse TR or Sales/Warehouse RR through its UC.
Alternate/exception flows: Compatibility before FIFO; planned inbound unavailable; choice does not auto-buy/post; Owner cannot select with view right.
Business branch coverage: BF-01-A1, BF-02-E1, BF-04-A1, BF-06-A1.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Option/demand link saved; holds/movements occur only in authorized downstream UC.

UC-109: Manage Linked Warehouse Issue Request
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Related execution view; Sales Staff — Manage net WIR/reopened demand; cancel eligible remainder.
Screen(s): SC-29.
Description: Sales manages original SO-linked WIR and net reopened demand after posted GR-FD. Reuse original SO/WIR and source versions; replacement OD commitment is transferred, not new demand.
Preconditions / required inputs: Saved verified SO/lines and matching current source/version; GR-FD posting required for received-back reopening.
Normal flow:
1. Create/update WIR within original SO less valid cancellations, including already fulfilled commitments.
2. Recheck net valid PGI minus valid GR-FD and exact reopened line quantity; claims alone do not reopen.
3. Reuse OD or traceably transfer replacement commitment without duplicating demand.
4. Cancel only unexecuted or received-back, not-redelivered quantity after task/hold/version resolution; unresolved off-site stock cannot be cancelled.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-06-E1, BF-06-A1.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: WIR/commitment changes no stock by itself; actual GR-FD updates reopening with receipt transaction.

UC-110: Confirm Customer Delivery with Photo Evidence
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Confirm / correct POD in assigned warehouse; Sales Staff — Related progress view.
Screen(s): SC-30.
Description: Assigned Warehouse confirms actual customer receipt against valid posted GI-S with photo. Share source cap with FD/GR-FD; received quantity uses CR for later return.
Preconditions / required inputs: Actual customer receipt, valid original SO–WIR–OD–GI chain/current version and successfully stored same-POD image.
Normal flow:
1. Record recipient/time/actual quantity per GI-S line and private stored photo belonging to POD.
2. Contend on shared GI/SO guard: effective POD + valid posted GR-FD + OPEN FD claims ≤ valid PGI.
3. Commit confirmation/business operation/progress/audit/outbox; full positive active obligation sets DELIVERED, partial remains PARTIALLY_DELIVERED.
4. Traceably VOID mistaken POD with reason/history and dependency checks, recompute SO/version; old PAY-CFM never authorizes changed version.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-06-E3, BF-06-A2.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: No inventory/reservation movement; ordinary CR preserves original delivery/payment history.

UC-111: Confirm Full External Payment Receipt
Status: ACTIVE. Feature: FE-06.
Primary actors and operations: Sales Staff — confirm/correct full external receipt after DELIVERED; Store Owner — view; Accountant — reconciliation scope, no confirmation; Warehouse Staff — related progress view, no confirmation. Administrator has no right.
Screen(s): SC-31.
Description: Only Sales confirms full money receipt outside WMSD after rechecking current-version DELIVERED. Reference/evidence/note and user/time are required; atomically set COMPLETED without stock or payment execution.
Preconditions / required inputs: Current-version SO is DELIVERED with positive fulfilled obligation and valid photos; full money receipt occurred outside WMSD.
Normal flow:
1. Capture fullPaymentReceived=true, external receipt reference OR evidence OR nonempty note, actor/time and current delivered SO version.
2. Recheck delivery/quantity/version/role and unique receipt confirmation for that version in the transaction; unpaid/partial/early receipt is insufficient.
3. Save CONFIRMED PAY-CFM and business operation with SO=COMPLETED, audit/outbox. Do not collect or calculate money.
4. Correct mistakes with reasoned VOIDED confirmation/history and SO version/progress recomputation; old confirmations cannot complete a changed SO.
Alternate/exception flows: Unpaid/partial/unclear receipt leaves DELIVERED. Prepayment may be noted but cannot complete before full delivery. Wrong-role, stale version or conflicting key/payload fails atomically.
Business branch coverage: BF-06-A3.
Shared failures: EX-01 role/scope; EX-02 source/version/concurrency; EX-03 unknown-commit lookup using stable operation key; EX-04 freeze where stock/holds change; EX-05 evidence/output failure. See I.2.9.
Postconditions / exact inventory effect: No stock/reservation effect, payment execution, invoice, receivable or refund.

UC-63: View defective goods list
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Store Owner — View; Warehouse Staff — View.
Screen(s): SC-11.
Description: Filter defect cases by source, product/lot/location, ownership, evidence, unresolved quantity and disposition.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Warehouse, lot, status, reason. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Case no., lot, defect qty, disposition status. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Case no., lot, defect qty, disposition status; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-64: View defective goods details
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Store Owner — View; Warehouse Staff — View.
Screen(s): SC-11.
Description: Show affected quantity, ownership/custody, inspector, evidence, approval and related outcomes; no duplicate deduction across cases.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Case ID. A specific record must be selected before its details can be displayed.
Display fields: Lot/location, cause, qty, proposal and decision. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Lot/location, cause, qty, proposal and decision; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-65: Inspect Defective Goods and Submit Disposition
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Warehouse Staff — Inspect / isolate / propose.
Screen(s): SC-11.
Description: Warehouse immediately blocks suspect stock and records evidence; within B1 freeze record balance-neutral defect_hold without ordinary quality/location posting.
Preconditions / required inputs: Actual defect/source/lot/location/owner/quantity and evidence; current stocktake scope if frozen.
Normal flow:
1. Record defect/evidence and block affected allocation immediately; inform Sales/replan reservations.
2. Outside freeze inspect/propose release/regrade/scrap to Owner; supplier return routes directly to BF-08 agreement.
3. Inside B1 retain snapshot/balance, link hold to ST and propose resolution for UC-92/93.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-02-E1, BF-02-A1, BF-06-E2.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Hold reduces availability without changing ownership/quantity; frozen quality/location changes wait closure batch.

UC-66: Approve or reject defective goods disposition
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Store Owner — Approve on-site scrap/regrade/release outside ST; not requester.
Screen(s): SC-11.
Description: Owner decides scoped destruction/regrade/release outside stocktake; supplier return uses BF-08 without Owner. B1 quality/location approval is UC-92, not duplicate UC-66.
Preconditions / required inputs: Non-stocktake disposition requiring Owner; current version, evidence and distinct requester.
Normal flow:
1. Approve/reject/return exact destruction/regrade/release quantity with reason.
2. Keep unresolved goods blocked; route supplier return to Accountant agreement without this approval.
3. Route B1 plans to UC-92/93 rather than ordinary disposition.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-02-A2, BF-08-A2.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Decision only; no stock deduction or extra BF-08 authorization.

UC-67: Record approved defective goods disposition
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Warehouse Staff — Execute approved on-site action outside freeze; B1 through UC-93.
Screen(s): SC-11.
Description: Warehouse executes approved destruction/regrade/release outside freeze. Supplier return deducts only at UC-82; B1 quality/location posts only in UC-93 batch.
Preconditions / required inputs: Current appropriate disposition decision and actual execution/evidence outside frozen scope.
Normal flow:
1. Validate exact action/version/quantity and no ordinary freeze bypass.
2. Record actual approved scrap/regrade/release once with evidence; scrap only actual destruction.
3. Supplier return routes BF-08 without deduction here; B1 execution evidence links to ST closure, not ordinary posting.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-02-A2, BF-02-E2, BF-08-A2.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Regrade preserves total; actual scrap deducts once. No double deduction or B1 ordinary posting.

UC-68: View customer return list
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Store Owner — View; Accountant — External follow-up; Warehouse Staff — Inspection / receipt scope; Sales Staff — Own / assigned returns.
Screen(s): SC-18.
Description: Search CR/FD by mode, source, reason and inspection/receipt status.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Source document, return reason, inspection status. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Mode contract: CR shows customer-received source/custody/D6 and proper C2 decision; FD shows valid undelivered GI-S, failure evidence, ARR/INS/GR-FD and net reopening without customer custody/D6/Owner decision.
Display fields: Return no., lot, quantity, decision state. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Operation scope: Sales Staff may view only return cases related to its authorized sales records; neither unrestricted return records nor inspection/approval/posting rights are granted.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve return source/customer/date/status, custody, latest D6 eligibility, quality and decision; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-69: View customer return details
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Store Owner — View; Accountant — External follow-up; Warehouse Staff — Inspection / receipt scope; Sales Staff — Own / assigned returns.
Screen(s): SC-18.
Description: Show source, custody/ownership, quantity, physical condition, per-line D6 assessment versions/evidence, proper Sales ordinary/Owner exception decision, FD source/receipt/net reopening and external financial-reference status.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Return no.. A specific record must be selected before its details can be displayed.
Mode contract: CR shows customer-received source/custody/D6 and proper C2 decision; FD shows valid undelivered GI-S, failure evidence, ARR/INS/GR-FD and net reopening without customer custody/D6/Owner decision.
Display fields: Source, lot, qty, condition, proposed disposition. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Operation scope: Sales Staff may view only the details and evidence of return cases related to its authorized sales records. Apply the same scope on direct requests and downloads; no return processing rights are granted.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve selected return lines/assessments/versions/inspection/approval, accepted/handed-back/unresolved custody; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-70: Create Customer Return Request
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Sales Staff — Create / check source and conditions.
Screen(s): SC-18.
Description: Sales creates commercial CR only against customer-received POD or verified historical delivery, with D6 terms and source caps. FD requires no Sales CR and uses Warehouse UC-72/73.
Preconditions / required inputs: Customer-received source/quantity/reason; Accountant verifies historical delivery when needed.
Normal flow:
1. Record CR source and per-quantity D6 evidence.
2. Atomically check received quantity less posted GR-CR and OPEN CR claims, coordinating with FD/POD source guard.
3. Create ordinary or eligible exception case for Warehouse inspection; proven exclusion blocks GR-CR and UNKNOWN waits.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-06-E3, BF-07-A1, BF-07-E2, BF-07-A3.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: CR/claim only; no owned receipt, refund or automatic demand reopening.

UC-71: Decide Customer Return Acceptance
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Store Owner — Eligible EXCEPTION_APPROVAL only; not requester; Sales Staff — STANDARD_ACCEPTANCE after inspection; own ordinary CR allowed.
Screen(s): SC-18.
Description: C2: Sales accepts/rejects ordinary CR after Warehouse inspection, including own creation. Owner only decides eligible exceptions with distinct requester. Neither overrides D6 exclusions; FD bypasses commercial acceptance.
Preconditions / required inputs: Current inspection and latest assessment/version; eligible customer-received source/quantity; decision_kind and actor appropriate to ordinary/exception case.
Normal flow:
1. Verify ordinary GOOD/UNUSED, proven terms/deadline, no dispute/deviation and source cap after inspection.
2. Sales records STANDARD_ACCEPTANCE for ordinary case; Owner records EXCEPTION_APPROVAL only for eligible exception and is not its requester.
3. Approve all/some/none by line/quantity/version with reason; reject/return as appropriate. Changed kind/conditions/version requires fresh proper-role decision.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-07-E1, BF-07-A2, BF-07-E2.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Decision only; Warehouse UC-73 posts GR-CR. No refund or FD decision.

UC-72: Inspect Return or Failed-Delivery Intake
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Warehouse Staff — Inspect CR/custody/D6 or GI-linked FD without customer custody.
Screen(s): SC-18.
Description: Warehouse distinguishes CR after customer receipt from FD before receipt. CR records customer custody/D6; FD uses posted GI-S/failure evidence and ARR/INS, without D6, fictitious POD, Owner approval or customer custody.
Preconditions / required inputs: CR source and actual held goods, or valid undelivered GI-S/failure evidence and actual FD arrival; assigned receiving warehouse.
Normal flow:
1. Select CR/FD mode and validate exact source, actual pieces, lot/quality/owner and evidence.
2. CR: record custody, split conditions and append latest D6 assessment with verified deadline; UNKNOWN waits.
3. FD: record ARR/INS against GI-S and split actual quality; check effective POD + posted GR-FD + OPEN FD ≤ valid PGI.
4. Insufficient source/evidence retains pending case without receipt; route CR to proper UC-71 decision, FD directly to UC-73 when substantiated.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-07-E1, BF-07-A2.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Inspection/claims do not post owned stock or reopen demand; no customer-custody assumption for FD.

UC-73: Post Customer Return or Failed-Delivery Receipt
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Warehouse Staff — Post GR-CR under proper decision or GR-FD with atomic net reopening.
Screen(s): SC-18.
Description: Warehouse posts GR-CR under proper Sales ordinary/Owner exception decision; FD posts GR-FD from actual eligible GI-linked receipt without commercial approval, atomically reopening exact original net demand.
Preconditions / required inputs: CR current D6/inspection and kind/role/version-matched decision, or FD actual arrival/inspection/failure evidence/source cap; sufficient identity/quality and assigned unfrozen receiving scope.
Normal flow:
1. Recheck shared GI-line guard: POD + valid GR-FD + OPEN FD ≤ valid PGI; GR-CR + OPEN CR ≤ eligible customer-received source.
2. CR: post accepted GR-CR once, converting matching customer custody without double physical arrival; keep rejected goods custody until actual handback.
3. FD: post actual GR-FD by quality, consume matching claim without double counting, record demand_reopening and original SO/WIR/OD net progress/version in the SAME inventory commit.
4. Put away eligible goods or quarantine defects; GR-FD permits Sales wait/redelivery/cancel received-back remainder. Ordinary GR-CR never reopens demand.
5. Reversal checks POD/claims/reopening/redelivery; unresolved downstream dependency blocks invalid reversal.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-06-E3, BF-07-E1, BF-07-A2, BF-07-E2, BF-07-A3.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: GR-CR increases accepted ownership only; GR-FD increases actual received stock and exact net demand once. No refund/payment execution.

UC-79: View supplier return request list
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Store Owner — View; Accountant — Agreement / reconciliation scope; Warehouse Staff — Assigned warehouse.
Screen(s): SC-19.
Description: Search by supplier, lot, reason, agreement and reconciliation status.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Supplier, lot, reason, agreement/reconciliation status. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Return request, original receipt, qty, status. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve supplier/source/date/status, proposed/agreed/dispatched/acknowledged/unresolved quantities; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-80: View supplier return request details
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Store Owner — View; Accountant — Agreement / reconciliation scope; Warehouse Staff — Assigned warehouse.
Screen(s): SC-19.
Description: Display lot, location, quantity, source receipt, verified supplier agreement, ACK and Accountant reconciliation outcome.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Return request no.. A specific record must be selected before its details can be displayed.
Display fields: Lot/location, original receipt, evidence, decision. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve selected supplier return sources/ownership, verified agreement, GI/ACK lines and Accountant variance/closure evidence; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-81: Create Supplier Return Request
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Warehouse Staff — Propose/isolate; Accountant agreement, no Owner.
Screen(s): SC-19.
Description: Warehouse proposes source-linked SR and isolates defects/reserves good goods. Accountant verifies supplier agreement; there is no Owner dispatch/variance/closure approval.
Preconditions / required inputs: Supplier/source receipt/PO/lot/location/owner/quantity/reason/evidence.
Normal flow:
1. Create SR and exact source quantities.
2. Block defects or reserve proposed good stock.
3. Request Accountant UC-107 agreement verification; do not require Owner approval or a prior BF-02 authorization.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-08-A1.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Proposal/hold only; actual deduction at UC-82.

UC-82: Confirm Supplier Return Dispatch
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Warehouse Staff — Post actual agreed GI-SR/custody release; no Owner.
Screen(s): SC-19.
Description: Warehouse posts actual GI-SR or supplier-custody release within Accountant-verified agreement/source quantity, without Owner authorization. ACK is a later event.
Preconditions / required inputs: Verified agreement/current version/evidence and eligible source/actual handover; no Owner prerequisite.
Normal flow:
1. Recheck agreed source/qty/version, owner, freeze and actual picking/handover.
2. Post owned GI-SR once, or CUS-OUT for custody without owned deduction; consume hold.
3. Preserve handover evidence and await later UC-107 ACK/reconciliation.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-02-E2, BF-08-E1.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Owned dispatch deducts once; custody reduces custody only; ACK/closure never deducts again.

UC-83: Review Supplier Return Closure
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Store Owner — View; Accountant — Reconcile and close accounted warehouse quantities.
Screen(s): SC-19.
Description: Accountant reconciles and closes accounted supplier-return warehouse quantity under UC-83/107 without Owner. Unresolved disputes stay open; external financial status is independent.
Preconditions / required inputs: All source/GI-SR/ACK and agreed resolution outcomes evidenced; Accountant closure right.
Normal flow:
1. Compare actual dispatch, ACK and documented resolution quantities without rewriting ledger.
2. Keep missing/refused/disputed unresolved quantities open; Warehouse posts any actual incoming/outgoing event.
3. Close accounted warehouse portion; record pending/verified external Invoice/Credit Note separately through UC-108.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-08-E2, BF-08-A3.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Warehouse closure only; no stock or money posting, no Owner approval.

UC-107: Record Supplier Agreement and Receipt Acknowledgement
Status: ACTIVE. Feature: FE-07.
Primary actors and operations: Accountant — Record / verify external evidence.
Screen(s): SC-19.
Description: Accountant verifies pre-dispatch agreement and separately records later ACK, reconciles variances and closes through UC-83 without Owner approval.
Preconditions / required inputs: Supplier/source/quantity/version and authentic agreement or ACK evidence at the proper stage.
Normal flow:
1. Record verified agreement/refusal/qty/schedule/handover/evidence before dispatch.
2. After Warehouse dispatch, separately record actual ACK/outcome/quantity/time per source line.
3. Reconcile mismatch with supplier and record documented resolution; unresolved remains open, actual stock events belong to Warehouse.
4. Accountant UC-83 closes accounted warehouse work; UC-108 links external financial follow-up independently.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-08-A1, BF-08-E2.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Agreement/ACK/resolution evidence only, no inventory or monetary settlement.

UC-108: Record External Document References
Status: ACTIVE. Feature: FE-09.
Primary actors and operations: Accountant — Record / verify external evidence.
Screen(s): SC-28.
Description: Accountant verifies historical delivered sources and records external Invoice/Credit Note/refund/reconciliation kind, number/date, purchase/GI-SR source, matched quantity, evidence and status independently of warehouse closure.
Preconditions / required inputs: Authorized source documents and verifiable evidence; no invented provider revision or return deadline.
Normal flow:
1. Record external system/kind/number/date/line, provider version only when supplied, stable correlation and evidence.
2. Verify historical customer-delivered quantity or link purchase/GI-SR and matched quantities to external Invoice/Credit Note/outcome.
3. Retain verifier/time/history and independent NOT_RECORDED/PENDING_EXTERNAL/RECORDED_EXTERNAL status; unknown source waits.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-06-E1, BF-07-A1, BF-07-A3, BF-08-A3.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Reference/follow-up only; no receipt/issue, refund/payment/debt or SO completion in place of UC-111.

</replacement_text>
