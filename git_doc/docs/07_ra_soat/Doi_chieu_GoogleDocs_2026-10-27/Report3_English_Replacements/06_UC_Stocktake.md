# Report 3 — 11 use cases: stocktake, resolution and count sheets

All replacement content is included below. Do not ask for a baseline file, upload, repository path or external comparison document. Replace the named sections with the English text inside each <replacement_text> block; the wrapper tags are editing markers and must not appear in the report. Preserve the document template and convert Markdown tables into document tables. Preserve existing content outside the specified replacement scope. Do not claim to have changed embedded images or tested software unless those actions were actually completed.

In II, replace the 11 use-case specifications whose full text is supplied below. Insert missing use cases under their existing feature group. Preserve the feature groups and use-case identifiers. This message contains every replacement specification; no other file is required.

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

UC-84: View stocktake list
Status: ACTIVE. Feature: FE-08.
Primary actors and operations: Store Owner — View; Warehouse Staff — View.
Screen(s): SC-14.
Description: Search stocktakes by warehouse, scope, cutoff time, and status.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Warehouse, scope, cutoff date/time, status. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Stocktake reference, scope, cutoff, status. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Stocktake reference, scope, cutoff, status; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-85: View stocktake details
Status: ACTIVE. Feature: FE-08.
Primary actors and operations: Store Owner — View; Warehouse Staff — View.
Screen(s): SC-14.
Description: View included lots/locations, system snapshot, counted quantities, and variances.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Stocktake no.. A specific record must be selected before its details can be displayed.
Display fields: Snapshot, count, recount, variance by lot/location. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Snapshot, count, recount, variance by lot/location; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-86: Create Stocktake Session
Status: ACTIVE. Feature: FE-08.
Primary actors and operations: Store Owner — Plan session.
Screen(s): SC-14.
Description: Store Owner plans monthly or targeted stocktakes, scope and counters. Planning does not take a snapshot or post stock; no new automatic scheduling job.
Preconditions / required inputs: Owner monthly/targeted count need and known scope/counters.
Normal flow:
1. Plan warehouse/locations/date/counters.
2. Check feasibility/overlap.
3. Save planned session; activation/snapshot follows UC-87.
Alternate/exception flows: Monthly cadence is not scheduler-created session; no guessed warehouse records.
Business branch coverage: BF-05-E1.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Plan saved; no freeze/snapshot/adjustment yet.

UC-87: Perform Stocktake Count and Record Results
Status: ACTIVE. Feature: FE-08.
Primary actors and operations: Warehouse Staff — Count / reconcile / propose within locked scope.
Screen(s): SC-14.
Description: Warehouse activates immutable snapshot/freeze, counts and retains attempts. Defects discovered under B1 produce immediate hold/evidence without balance changes.
Preconditions / required inputs: Owner-planned scope, tasks resolved and no overlapping active scope.
Normal flow:
1. Atomically activate freeze/snapshot after open-task checks; export UC-105 count sheet.
2. Count BOX/PIECE/quality/owner with actor/time; zero differs from blank; append every count/recount.
3. Record found-item rows within locked locations without rewriting original snapshot.
4. Record defect_hold/evidence immediately under B1; defer quality/location posting to approved closure, not UC-67 ordinary mutation.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-05-E1, BF-05-A1, BF-05-E2.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Snapshot/count/hold saved; no quantity adjustment or ordinary quality/location posting.

UC-88: Reconcile Stocktake
Status: ACTIVE. Feature: FE-08.
Primary actors and operations: Warehouse Staff — Count / reconcile / propose within locked scope.
Screen(s): SC-14.
Description: Warehouse compares quantity/quality/location; substantiated variance may proceed directly to plan, while unclear/chosen recount repeats Start/Enter Recount. Quality-only B1 still needs resolution.
Preconditions / required inputs: Required quantities counted against immutable snapshot/current selected attempts; freeze retained.
Normal flow:
1. Compare actual total and quality/location separately; investigate source/unit/cause.
2. No variance and no unresolved hold/task: close/unlock without ADJ0.
3. Substantiated discrepancy: explain and prepare real delta plus RECLASS/location plan directly; otherwise Start Recount, Enter Recount and compare again.
4. Link hold/evidence and selected counts to UC-91/92/93; retain freeze until all resolution execution commits.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-05-A1, BF-05-A2.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Reconciliation/plan only; quality-only never becomes fictitious shortage or ADJ0.

UC-89: View inventory adjustment request list
Status: ACTIVE. Feature: FE-08.
Primary actors and operations: Store Owner — View; Warehouse Staff — View.
Screen(s): SC-15.
Description: Search by stocktake, lot, location, variance reason, and approval status.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Stocktake, lot, location, approval status. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Adjustment id, difference, cause, approval state. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Adjustment id, difference, cause, approval state; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-90: View inventory adjustment request details
Status: ACTIVE. Feature: FE-08.
Primary actors and operations: Store Owner — View; Warehouse Staff — View.
Screen(s): SC-15.
Description: Display before/after quantities, cause, creator, evidence, and approval decision.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Adjustment id. A specific record must be selected before its details can be displayed.
Display fields: Snapshot/count, before/after, evidence, decision. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Snapshot/count, before/after, evidence, decision; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-91: Create Inventory Adjustment Request
Status: ACTIVE. Feature: FE-08.
Primary actors and operations: Warehouse Staff — Propose B1 delta/RECLASS/location and confirm execution.
Screen(s): SC-15.
Description: Warehouse proposes B1 stocktake resolution with actual nonzero total delta and separate total-preserving RECLASS/location lines. Quality-only uses ST_RESOLUTION without ADJ=0.
Preconditions / required inputs: Current ST snapshot/count/version, substantiated explanation/evidence and holds.
Normal flow:
1. Create versioned ST resolution linked to selected counts/holds.
2. Separate actual total delta from quality/location transfers; 50 book versus 48GOOD+2broken is RECLASS2 only, not shortage2.
3. Record Warehouse actual quarantine/execution/evidence; submit current plan to distinct Owner without direct balance change.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-05-A2.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Versioned plan/execution evidence saved; freeze/hold retained, no ordinary posting.

UC-92: Approve Stocktake Resolution
Status: ACTIVE. Feature: FE-08.
Primary actors and operations: Store Owner — Approve/return current B1 resolution; not requester.
Screen(s): SC-15.
Description: Owner approves/returns versioned B1 plan including actual delta, RECLASS and controlled locations with distinct requester; approval never bypasses freeze or posts stock.
Preconditions / required inputs: Latest plan/count/hold/evidence and distinct Owner approver.
Normal flow:
1. Review actual total separately from quality/location and validate selected attempts/source/quantities.
2. Approve exact version/action/quantity or reject/return for recount/evidence with reason.
3. Require Warehouse execution confirmation and separate UC-93 closure; quality-only approval uses ST resolution without zero adjustment.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-05-A3.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Decision only; freeze/hold remains until authorized closure batch commits.

UC-93: Clear Stocktake Difference
Status: ACTIVE. Feature: FE-08.
Primary actors and operations: Store Owner — Post approved B1 batch after Warehouse execution; unlock resolved scope.
Screen(s): SC-15.
Description: Owner posts one approved B1 closure batch: actual nonzero delta if any plus total-preserving RECLASS/location, after Warehouse execution. Unlock only resolved scope; no ADJ=0.
Preconditions / required inputs: Current plan/count/UC-92 approval and Warehouse execution/evidence; all relevant tasks/holds resolvable; scope guard/idempotency valid.
Normal flow:
1. Recheck plan/version/decision/selected count and physical execution, source/destination/owner/quantity.
2. Atomically post actual delta and RECLASS/location ledger/balance with plan/hold/progress/audit/outbox.
3. Quality-only uses RECLASS without ADJ0; 50→46GOOD+2broken is delta−2 plus RECLASS2, never shortage−4.
4. Close/unlock only when all tasks/holds/variances resolved. Failure rolls back and retains freeze; unknown commit lookup before same-key retry.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-05-A3, BF-05-E2.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Approved actual delta changes total once; RECLASS/location preserves total; resolved freeze/holds release only with completed committed closure.

UC-105: Export or Print Stocktake Count Sheet
Status: ACTIVE. Feature: FE-08.
Primary actors and operations: Store Owner — Export / print; Warehouse Staff — Export / print assigned scope.
Screen(s): SC-14.
Description: Warehouse Staff/Owner obtains the activated session's snapshot-based list by location/lot/quality, with cutoff and space for counts and newly found items. Printing does not post stock.
Preconditions / required inputs: Activated immutable snapshot; authorized Owner/Warehouse scope.
Normal flow:
1. Select session/location scope.
2. Generate snapshot-based lot/location/quality/owner sheet with cutoff, count spaces and found-item rows; prefer blind counts.
3. Print/export read-only output.
Alternate/exception flows: Unactivated session cannot export snapshot; print failure retries output only.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Sheet generated; snapshot/count/stock unchanged.

</replacement_text>
