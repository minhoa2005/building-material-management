# Report 3 — Non-functional requirements, 33 business rules and 17 messages

All replacement content is included below. Do not ask for a baseline file, upload, repository path or external comparison document. Replace the named sections with the English text inside each <replacement_text> block; the wrapper tags are editing markers and must not appear in the report. Preserve the document template and convert Markdown tables into document tables. Preserve existing content outside the specified replacement scope. Do not claim to have changed embedded images or tested software unless those actions were actually completed.

Replace IV and V completely. Keep numeric SLAs or test results unconfirmed where the text states that no verified values are available.

Remove UC-23–25, UC-42, UC-59–62, UC-74–78 and UC-106 from active catalogues, permissions, detailed specifications, diagrams and navigation. Remove SC-25–27 from active screen requirements. Preserve the original IDs of the 97 remaining use cases and 28 active screens; do not renumber them. Keep UC-108 external document references and UC-111 external payment-receipt confirmation in scope.

## Replacement content

<replacement_text>

IV. Non-Functional Requirements
1. External Interfaces
Responsive internal web application including phone. MongoDB runtime requires supported atomic multi-document transactions. SQL Server/T-SQL is reference DDL only. Server-side SMTP API-01 and controlled evidence API-02; no MISA/payment/tax integration. Warehouse outputs derive from committed snapshots and scoped evidence access.
2. Quality Attributes
2.1 Usability
Actual boxes/loose pieces, visible conversion, warehouse/location/lot identity, phone camera/file attachments and per-quantity return/quality review. Failed/missing POD photo retains a draft; retry returns to POD without repicking/PGI. Show copied SO/WIR, PGI, DELIVERED and COMPLETED as distinct milestones. Show physical/available/reserved/custody/transit separately. Distinguish draft, review, physical post, print and external finance status. Errors identify correction without losing valid input or exposing protected data.
2.2 Performance
No signed-off numeric response SLA, concurrency count, volume or availability percentage supplied. Verify scoped list/report behavior on representative store-approved datasets; agree numeric targets before acceptance.
2.3 Security
Active personal accounts, exactly one of five fixed roles per user and server-side operation/warehouse/record/evidence scope, including direct requests/exports. Distinct requester for Owner approvals and independent transfer dispatcher/receiver; C2 Sales own ordinary CR acceptance is explicitly allowed, BF-08 Owner approval is absent. Administrator no default business rights. Protect credentials/server secrets, private evidence retrieval and administrative audit; changed access never rewrites past decisions.
2.4 Reliability and Data Integrity
3.1.0 controls: shared source guard across POD/FD/CR claims and receipts; atomic GR-FD stock/net reopening/version and replacement OD commitment; B1 balance-neutral holds, current approved plan plus Warehouse execution, delta/RECLASS batch and no early unlock. 
Atomically commit source/version, batch, movements, balance, reservations, status, audit and outbox. Stable operation/idempotency key and hash prevent duplicate stock effects; changed payload conflicts. Unknown commit resolved by lookup; transient retry uses same identity. Concurrent holds/receipts/returns respect eligible source ceilings. All in-scope quantity/quality/ownership/location changes and backdated corrections coordinate with stocktake activation/freeze; only authorized clearing changes counted balance before unlock. Interrupted session retains freeze/history. Snapshot, count attempts, posted documents/assessments remain immutable; corrections append links.
POD/PAY-CFM use stable business-operation IDs/hash, not posting_batch/movement. Atomically commit confirmation/VOIDED correction with SO version/progress, audit/outbox. Competing PODs contend on shared source/SO guards, not merely snapshot sums. PAY-CFM binds current delivered SO version; correction invalidates stale completion conditions.
Output/notification retry never repeats stock posting. SMTP uncertain timeout requires delivery reconciliation, not a claim of exactly-once email. Transit/received/resolved reconcile; custody never silently becomes owned stock.
2.5 Maintainability and Traceability
97 active UCs map to feature/permission/screen/inputs/alternates/exact inventory effect. Excluded functions have no active permission, screen or execution route. Trace external system/document/line/version→SO→WIR→OD→GI-S→POD→PAY-CFM and PO→GR/transfer→return/disposition/adjustment, with actor/time/evidence. Reconcile closing=opening+ledger delta in consistent dimensions including OPENING; no silent balance initialization/overwrite. The current 3.1.0 business branches and EX-01–05 specify acceptance criteria, not executed backend tests.

V. Requirement Appendix
1. Business Rules
BR-01–33 form the current business-rule catalogue. The general-purpose creation or editing of arbitrary business policies is excluded; controlled finite minimum quantities and versioned product conversions remain permitted.
| BR | Rule statement | Traceability |
|---|---|---|
| BR-01 | Lot identity distinguishes product/lot/tone/calibre; do not pool different tones to fill demand. | DR-01, UC-13/16/26/30/54/55/72 |
| BR-02 | Version product/packaging conversions and snapshot them on lines. Whole tiles cannot be fractional pieces. Use product area specifications; calibre does not determine m² factors. | DR-02, GB-03 |
| BR-03 | Sales/Warehouse or fixed alerts originate needs; only Owner approves. Controlled thresholds do not automatically issue POs. | UC-03/04/103, BF-01 |
| BR-04 | Do not double-count demand already covered by PO/transfer/allocation. Planned receipts are not current availability. | BF-01/04/06 |
| BR-05 | Same-user approval prohibited for RR/TR, CR exceptions, destruction/regrade and stocktake plans. C2 permits Sales ordinary acceptance of own CR after Warehouse inspection, never exception/Owner approval. BF-08 has no Owner approval. | UC-04/41/66/71/92 |
| BR-06 | Post receipt/issue/return/adjustment once, atomically with ledger/balance. No negative availability; retry returns prior result. | DR-09/10/13, GB-09/10/13 |
| BR-07 | Separate actual delivery, accepted ownership, custody and rejection. Uninspected/not-ready stock is unavailable. | DR-04, GB-04, UC-26/33/73 |
| BR-08 | PO supports multiple receipts; posted parts are immutable. Short closure/excess change requires reasons and authorization. | DR-03, GB-05, UC-07/10/26 |
| BR-09 | Local relocation preserves total/lot/quality and reservations; no Owner approval. | DR-06, GB-06, UC-36/37 |
| BR-10 | Approved TR → draft TD before picking → execution confirmation → TD/HO post at handover → MWTR → confirmed put-away TO. No Owner TO approval or additional GI for the same TD. | UC-41/43/104 |
| BR-11 | Posted TD cannot exceed approved TR after cancellation. Dispatch = valid receipt + transit/unresolved + documented other outcomes. TR closes only after demand, dispatched quantities and related TOs are resolved; a matched release alone is insufficient. | UC-43/44/104 |
| BR-12 | Destination confirmation is independent of source dispatch under verified staffing; one confirm cannot update both ends. | UC-43/104, permissions |
| BR-13 | Compatibility precedes FIFO. Record exception reasons/consent; do not assume LIFO without evidence. | UC-54/55/103 |
| BR-14 | SO/WIR/draft GI change no stock; picking TO only relocates; PGI deducts actual handover once. GR-FD increases actual receipt and reopens exact net demand; POD/PAY-CFM change no stock. Retain redelivery ledger history. | UC-47/109/55/58/73/110/111 |
| BR-15 | Picking shortage/defects block affected quantity, preserve evidence and reallocate/wait; never silently change balance. | BF-02/05/06 |
| BR-16 | Ordinary CR cap is customer-received POD/verified historical quantity less returned/open claims. FD uses PGI not covered by POD/GR-FD/open FD. Atomically share source controls; no quantity belongs to both branches. | UC-70/72/73/108/110 |
| BR-17 | Sales accepts/rejects ordinary CR after Warehouse inspection and may be creator; Owner approves eligible exceptions only. Warehouse GR-CR requires proper decision kind/version. FD needs no commercial acceptance/Owner approval. | UC-70–73 |
| BR-18 | CR splits good/quarantine/custody-rejection, preserving original POD/GI/invoice. FD uses GI/failure evidence, not customer custody or automatic refund; post GR-FD once and atomically reopen net demand. | UC-73/108/109 |
| BR-19 | Block defects immediately; outside stocktake destruction/regrade/release requires Owner. B1 retains hold until UC-93 closure. BF-08 supplier return has no Owner approval and deducts only at GI-SR, never also BF-02. | UC-65/66/67/82/93 |
| BR-20 | Supplier return requires source/quantity agreement verified by Accountant and actual Warehouse dispatch; no Owner approval. Accountant reconciles/closes UC-83/107 when all quantities resolve; UC-108 finance stays separate. Custody release never deducts owned stock. | UC-82/83/107/108 |
| BR-21 | Snapshot is immutable at activation; export count sheet with time/scope. Never replace snapshot with current balance. | DR-08, GB-08, UC-87/105 |
| BR-22 | Freeze ordinary stocktake-scope postings; record balance-neutral defect hold/evidence immediately. B1 only approved closure posts delta/RECLASS/location, retaining freeze/holds until resolution. Uncounted differs from zero; preserve recount history. | UC-87/88/92/93 |
| BR-23 | Substantiated variance may proceed directly to a plan; unclear variance recounts. Warehouse proposes, Owner approves/posts version-matched actual delta plus total-preserving RECLASS without duplicate deductions; quality-only creates no ADJ=0. | UC-88/91/92/93 |
| BR-24 | Posted documents cannot be edited/deleted to remove history. Authorized linked reversal/adjustment corrects errors; inactive masters preserve history. | DR-14, GB-02/13, UC-97/100–102 |
| BR-25 | Notification/upload retries never repeat stock posting. Email failure does not roll back committed PGI/receipt. | API-01, JOB-01, UC-58/26/110 |
| BR-26 | Carrier handover or PGI is not customer delivery (DELIVERED), and customer delivery alone is not Sales Order completion (COMPLETED); return receipt is not refund; supplier replacement agreement is not received stock. | BF-06/07/08, UC-58/110/111 |
| BR-27 | Only evidence-authorized users retrieve files; URLs are not public by default. | API-02 evidence storage, GB-NEW-02 |
| BR-28 | Source system/document/line, version and correlation ID prevent duplicate WMS/MISA recording across SO, WIR, OD, GI-S, `CR` and `EXT-REF`. | UC-47/109/51/58/70/108 |
| BR-29 | CR sealed/unused goods are individually assessed; installed/customer-damaged/verified overdue is rejected and unknown waits. C2 Sales decides eligible ordinary cases; Owner only substantiated exceptions, never excluded conditions. D6 does not apply to FD never received by customer. | BF-07, UC-70–73 |
| BR-30 | Torn/opened packaging alone is not tile damage. Count actual pieces and inspect quality. BOX/PIECE/m² conversions follow product/version, not inferred calibre. | D7, BF-01/05/06/07, UC-13/26/55/72/87 |
| BR-31 | Verified SO and line-linked WIR/OD commitments stay within SO after cancellation. Execution caps use valid PGI less posted GR-FD; redelivery reuses original SO/WIR demand without adding replacement OD as new demand. | UC-45–48/51/58/73/109 |
| BR-32 | POD requires POSTED GI-S, recipient/time/quantity/photo. Effective POD + posted GR-FD + open FD ≤ valid PGI per line. DELIVERED requires full active quantity > 0; full cancellation at zero delivery → CANCELLED. | UC-58/73/110 |
| BR-33 | Only Sales confirms full external receipt after DELIVERED to set COMPLETED. Partial payment or prepayment before full delivery cannot complete SO. POD/PAY-CFM change no stock; corrections preserve history and recalculate order progress. | BF-06, UC-48/110/111/108 |

2. System Messages
| Code | Context | Message / outcome |
|---|---|---|
| MSG-01 | Empty | No matching records; no mutation. |
| MSG-02 | Validation | Complete/correct highlighted fields; retain draft. |
| MSG-03 | Quantity/source | Exceeds eligible source, transit or available balance; no partial post. |
| MSG-04 | Authorization | Not authorized for operation/warehouse/record; no protected data disclosed. |
| MSG-05 | Version/concurrency | Record/source changed; refresh and review current version. |
| MSG-06 | Committed retry | Already completed; return existing result without repost. |
| MSG-07 | Notification | Business committed; notification failed/pending retry without stock change. |
| MSG-08 | Separation | Owner approval requires distinct requester; cannot confirm own transfer at destination. Sales ordinary CR acceptance follows the explicit C2 exception. |
| MSG-09 | Frozen scope | Location under stocktake; wait for authorized resolution/unlock. |
| MSG-10 | Identity | Wrong/unverified lot/tone/calibre; no allocation as eligible stock. |
| MSG-11 | Return conditions | Pending/ineligible conditions; no GR-CR, held quantity stays custody. |
| MSG-12 | External source | Unverified source/duplicate release; resolve before execution. |
| MSG-13 | Supplier return | Verified agreement/source or quantity reconciliation incomplete; block the affected dispatch/closure. No Owner approval prerequisite. |
| MSG-14 | Idempotency conflict | Same key, different payload; review existing result. |
| MSG-15 | Evidence | Mandatory evidence unavailable; complete upload before confirmation. |
| MSG-16 | Delivery photo/source | Valid posted GI-S and stored POD photo required; effective POD plus posted GR-FD and OPEN FD claims cannot exceed valid PGI. |
| MSG-17 | Completion | Current full delivery and Sales full external receipt required; cancelled/partially paid orders cannot complete. |

3. Other Requirements and Artifact Limits
Independent commercial selling/prices/internal-tax invoices/refund workflows, payment execution/debt/accounting, live MISA, dynamic delegation and arbitrary policy editors excluded. The five application roles and the selected warehouse/retail boundaries are retained. Do not invent warehouse names/staffing, SKU factors, actual calibre or return-day values.

</replacement_text>
