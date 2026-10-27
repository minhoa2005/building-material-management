# Report 3 — 28 active screen requirements

All replacement content is included below. Do not ask for a baseline file, upload, repository path or external comparison document. Replace the named sections with the English text inside each <replacement_text> block; the wrapper tags are editing markers and must not appear in the report. Preserve the document template and convert Markdown tables into document tables. Preserve existing content outside the specified replacement scope. Do not claim to have changed embedded images or tested software unless those actions were actually completed.

Replace III completely. Remove the old pricing, invoice and refund screens and their navigation entries. The included field contracts and outcomes replace the old requirements; retain the existing visual template when updating mockups.

Remove UC-23–25, UC-42, UC-59–62, UC-74–78 and UC-106 from active catalogues, permissions, detailed specifications, diagrams and navigation. Remove SC-25–27 from active screen requirements. Preserve the original IDs of the 97 remaining use cases and 28 active screens; do not renumber them. Keep UC-108 external document references and UC-111 external payment-receipt confirmation in scope.

## Replacement content

<replacement_text>

III. Functional Requirements
The following screen layouts, field contracts, actions and recovery rules define the active functional requirements. Existing mockup images must be updated to match these requirements. Responsive phone use supports actual BOX/PIECE/m² input, location references and photographs; native/offline applications or automatic barcode integration are not assumed.
Shared field contract: external provider version is optional if unavailable; internal document/verification version and stable nonblank correlation are retained without inventing a provider revision. ObjectId references, Decimal128 quantities/factors, whole actual pieces for whole-base-unit products, immutable conversion snapshots, UTC Date events displayed in Vietnam time. Required fields are those at the linked UC stage. No invented quantity/factor/deadline/warehouse defaults. Filters optional/nonpersistent; derived balances/approval actor/time/before-after read-only. Positive execution quantity, zero count allowed, blank uncounted, signed nonzero adjustment. Finite states use String enums; version/attempt uses positive Int32, active/found flags Boolean, identifiers/text are trimmed nonblank String where required, evidence uses controlled object-key/hash references.

SC-01: Sign In
State: ACTIVE. Linked UCs: UC-94.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: username required; password masked input-only/hash verification; active/role/scope derived.
Actions/outcomes:
- UC-94: Session created; business stock unchanged.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-02: Accounts and Permissions
State: ACTIVE. Linked UCs: UC-95, UC-96, UC-97, UC-98.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: userId/warehouseIds references; username unique; displayName; active; five role codes; fixed operation permissions; audit actor/time.
Actions/outcomes:
- UC-95: Read-only scoped list/detail; no state or stock effect.
- UC-96: Read-only scoped list/detail; no state or stock effect.
- UC-97: Account saved; stock/history unchanged.
- UC-98: Access configuration saved; no business/stock posting.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-03: Products and Packaging
State: ACTIVE. Linked UCs: UC-11, UC-12, UC-13.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: sku/name/material/nominalSize; optional brand/category; baseUom/wholeBaseUnits; positive conversionVersion/piecesPerBox/m2PerPiece; warehouse minimum≥0; active. No guessed SKU factors.
Actions/outcomes:
- UC-11: Read-only scoped list/detail; no state or stock effect.
- UC-12: Read-only scoped list/detail; no state or stock effect.
- UC-13: Master/version/minimum saved; no prices, automatic PO or inventory movement.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-04: Product Lots
State: ACTIVE. Linked UCs: UC-14, UC-15, UC-16.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: product/manufacturerLot/tone/calibre; identificationStatus VERIFIED/UNKNOWN; optional productionDate/evidence. No nominal-size substitution for calibre.
Actions/outcomes:
- UC-14: Read-only scoped list/detail; no state or stock effect.
- UC-15: Read-only scoped list/detail; no state or stock effect.
- UC-16: Lot master saved; quantity/quality unchanged.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-05: Suppliers
State: ACTIVE. Linked UCs: UC-17, UC-18, UC-19.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: code/name/contact/active. Accountant identity create/update versus Owner activation/deactivation.
Actions/outcomes:
- UC-17: Read-only scoped list/detail; no state or stock effect.
- UC-18: Read-only scoped list/detail; no state or stock effect.
- UC-19: Supplier master audited; no stock/payment effect.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-06: Replenishment Requests
State: ACTIVE. Linked UCs: UC-01, UC-02, UC-03, UC-04.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: warehouse/product/source; requestedQty/unit/conversion; neededOn/reason; covered supply derived; creator/version/decision.
Actions/outcomes:
- UC-01: Read-only scoped list/detail; no state or stock effect.
- UC-02: Read-only scoped list/detail; no state or stock effect.
- UC-03: Pending RR saved; physical and available stock unchanged.
- UC-04: Decision saved; no stock or PO posting.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-07: Purchase Orders
State: ACTIVE. Linked UCs: UC-05, UC-06, UC-07.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: supplier/warehouse/RR lines; ordered/confirmed qty/dates; supplier evidence; accepted/outstanding/cancelled derived/history; short-closure authorization.
Actions/outcomes:
- UC-05: Read-only scoped list/detail; no state or stock effect.
- UC-06: Read-only scoped list/detail; no state or stock effect.
- UC-07: PO/confirmation/outstanding history saved; no inventory or supplier-payment posting.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-08: Goods Receipt, Inspection and Put-away
State: ACTIVE. Linked UCs: UC-08, UC-09, UC-10, UC-26, UC-32, UC-33.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: PO/arrival/sourceLine; delivered/accepted/custody/rejected qty by homogeneous line; actual pieces/unit/conversion snapshot; lot/tone/calibre; packaging SEALED/OPENED/TORN/UNKNOWN; quality PENDING/GOOD/DAMAGED/BLOCKED; owner; inspector/time/evidence; put-away task/from/to/actualQty.
Actions/outcomes:
- UC-08: Read-only scoped list/detail; no state or stock effect.
- UC-09: Read-only scoped list/detail; no state or stock effect.
- UC-10: Draft/arrival saved; no owned-stock increase on draft creation.
- UC-26: Owned GR increases actual accepted quantity once; custody separate; availability requires verified GOOD and eligible put-away location.
- UC-32: Task saved; no stock movement or approval layer.
- UC-33: Equal source/destination quantity; total unchanged; eligible GOOD stock becomes available.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-09: Warehouse Locations
State: ACTIVE. Linked UCs: UC-27, UC-28, UC-29.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: warehouse/code unique; kind RECEIVING/STORAGE/STAGING/QUARANTINE/CUSTODY; allocatable only STORAGE; active; nonempty deactivation prohibited.
Actions/outcomes:
- UC-27: Read-only scoped list/detail; no state or stock effect.
- UC-28: Read-only scoped list/detail; no state or stock effect.
- UC-29: Location metadata saved; quantities/reservations unchanged.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-10: Inventory and Shortage Options
State: ACTIVE. Linked UCs: UC-30, UC-31, UC-103.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: warehouse/location/lot/quality/owner; derived physical/reserved/available/custody/transit; freeze; compatible stock/incoming allocations/dates; direct issue/transfer/replenishment choice. Sales sees permitted availability/progress only.
Actions/outcomes:
- UC-30: Read-only scoped list/detail; no state or stock effect.
- UC-31: Read-only scoped list/detail; no state or stock effect.
- UC-103: Option/demand link saved; holds/movements occur only in authorized downstream UC.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-11: Defective Goods and Disposition
State: ACTIVE. Linked UCs: UC-63, UC-64, UC-65, UC-66, UC-67.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: source/DC/owner/lot/location/qty, evidence, immediate defectHold; frozen ST/plan link; outside-freeze scoped release/regrade/scrap decision. RETURN_SUPPLIER routes to Owner-free BF-08; B1 quality/location posts only UC-93.
Actions/outcomes:
- UC-65: Hold reduces availability without changing ownership/quantity; frozen quality/location changes wait closure batch.
- UC-66: Decision only; no stock deduction or extra BF-08 authorization.
- UC-67: Regrade preserves total; actual scrap deducts once. No double deduction or B1 ordinary posting.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-12: Location Movements
State: ACTIVE. Linked UCs: UC-34, UC-35, UC-36, UC-37.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: task/from/to in same warehouse; lot/quality/owner; requested/actual qty; reservations; actor/time/freeze. No Owner approval.
Actions/outcomes:
- UC-34: Read-only scoped list/detail; no state or stock effect.
- UC-35: Read-only scoped list/detail; no state or stock effect.
- UC-36: Instruction saved; no movement until actual confirmation.
- UC-37: Warehouse total unchanged; location/reservation updated once.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-13: Warehouse Transfers, Dispatch and Receipt
State: ACTIVE. Linked UCs: UC-38, UC-39, UC-40, UC-41, UC-43, UC-44, UC-104.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: TR/current Owner approval/source/destination/qty; TD DRAFT before picking; actual picking TO confirmation if staging, HO/post; independent MWTR/quality and put-away TO; request remainder/transit/variance/TO unresolved closure guards.
Actions/outcomes:
- UC-43: Draft no stock; posting transfers source to transit once, never destination receipt.
- UC-44: Execution/read-only outcome remains defined in UC-44.
- UC-104: Execution/read-only outcome remains defined in UC-104.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-14: Stocktake Sessions, Count Sheet and Counts
State: ACTIVE. Linked UCs: UC-84, UC-85, UC-86, UC-87, UC-88, UC-105.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: scope/counters/date, FROZEN immutable snapshot/cutoff, count and append-only recount attempts, blank versus zero, foundAfterCutoff; immediate balance-neutral defectHold/evidence; direct substantiated explanation or Start/Enter Recount.
Actions/outcomes:
- UC-87: Snapshot/count/hold saved; no quantity adjustment or ordinary quality/location posting.
- UC-88: Reconciliation/plan only; quality-only never becomes fictitious shortage or ADJ0.
- UC-105: Execution/read-only outcome remains defined in UC-105.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-15: Stocktake Resolution and Clear Difference
State: ACTIVE. Linked UCs: UC-89, UC-90, UC-91, UC-92, UC-93.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: ST_RESOLUTION ID/version and selected count/hold; nonzero actual DELTA if any plus RECLASS/RELOCATE source/destination/positiveQty; Warehouse executedBy/at/evidence, Owner UC-92 decision and UC-93 closure batch. Quality-only no ADJ=0. Freeze/holds/tasks must resolve before unlock.
Actions/outcomes:
- UC-91: Versioned plan/execution evidence saved; freeze/hold retained, no ordinary posting.
- UC-92: Decision only; freeze/hold remains until authorized closure batch commits.
- UC-93: Approved actual delta changes total once; RECLASS/location preserves total; resolved freeze/holds release only with completed committed closure.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-16: Copied Sales Orders and Progress
State: ACTIVE. Linked UCs: UC-45, UC-46, UC-47, UC-48, UC-103.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: unique verified external source/lines, evidence, SO/version/cancellation history, original WIR/OD; gross PGI, GR-FD and net fulfilment/reopened/not-redelivered qty; replacement OD commitment history; delivery/PAY-CFM current version. Cancel only eligible unexecuted/received-back remainder.
Actions/outcomes:
- UC-48: No inventory movement; cancellation releases only eligible commitments/holds.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-17: Goods Issue and Actual Handover
State: ACTIVE. Linked UCs: UC-56, UC-57, UC-58.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: GI-S DRAFT from OD before picking; planned/staged/actual handover qty and lot/location; TO execution, carrier/recipient/time/evidence; operation/hash; gross dispatch, valid GR-FD and net allowance. Post only actual handover; print never reposts.
Actions/outcomes:
- UC-58: Draft no stock; actual PGI deducts once. Redelivery retains gross dispatch/GR-FD history and net allowance.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-18: Customer Return and Failed-Delivery Intake
State: ACTIVE. Linked UCs: UC-68, UC-69, UC-70, UC-71, UC-72, UC-73.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: mode CR/FD; CR customer-received POD/GI XOR verified historical delivered line, custody, D6 assessment/version and Sales STANDARD_ACCEPTANCE or Owner eligible EXCEPTION_APPROVAL. FD valid undelivered GI-S/failure evidence/ARR/INS/actual quality/qty, no D6/Owner/customer custody. Shared OPEN/CONSUMED claims, GR-CR/GR-FD and atomic source/net reopening; no refund amount/default days.
Actions/outcomes:
- UC-70: CR/claim only; no owned receipt, refund or automatic demand reopening.
- UC-71: Decision only; Warehouse UC-73 posts GR-CR. No refund or FD decision.
- UC-72: Inspection/claims do not post owned stock or reopen demand; no customer-custody assumption for FD.
- UC-73: GR-CR increases accepted ownership only; GR-FD increases actual received stock and exact net demand once. No refund/payment execution.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-19: Supplier Return, Agreement and Acknowledgement
State: ACTIVE. Linked UCs: UC-79, UC-80, UC-81, UC-82, UC-83, UC-107.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: supplier/source/owner/lot/location/qty; Accountant-verified agreement version/qty/evidence; actual Warehouse GI-SR or custody release/HO; later ACK/outcome/variance and Accountant UC-83 closure. No Owner authorization is required. External Invoice/Credit Note and financial status independent.
Actions/outcomes:
- UC-81: Proposal/hold only; actual deduction at UC-82.
- UC-82: Owned dispatch deducts once; custody reduces custody only; ACK/closure never deducts again.
- UC-83: Warehouse closure only; no stock or money posting, no Owner approval.
- UC-107: Agreement/ACK/resolution evidence only, no inventory or monetary settlement.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-20: Operational Reports
State: ACTIVE. Linked UCs: UC-99.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: optional ordered date/warehouse/lot/location filters; scoped reportGroup and derived physical/available/reserved/custody/transit/shortage/variance, SO/WIR issued/delivered/outstanding and DELIVERED/COMPLETED/cancelled progress; Owner all groups, Accountant movement/purchase-receipt, Warehouse movement/stock/transfer/stocktake. No revenue/profit.
Actions/outcomes:
- UC-99: Read-only scoped list/detail; no state or stock effect.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-21: Stock Movement and Lot Trace
State: ACTIVE. Linked UCs: UC-100, UC-101, UC-102.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: batch/source/external refs/product/lot/location/quality/owner/qty; before/after/actor/time; correction links; scoped read-only trace/export/evidence.
Actions/outcomes:
- UC-100: Read-only scoped list/detail; no state or stock effect.
- UC-101: Read-only scoped list/detail; no state or stock effect.
- UC-102: Read-only scoped list/detail; no state or stock effect.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-22: Outbound Deliveries
State: ACTIVE. Linked UCs: UC-49, UC-50, UC-51.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: WIR/SO source lines and version; one warehouse/release; original OD net allowance/reopened GR-FD qty or replacement commitment transfer; partial/substitution consent, reservation/task/GI history. Claims alone never reopen.
Actions/outcomes:
- UC-51: OD/holds only; no physical deduction until actual PGI.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-23: Picking Tasks
State: ACTIVE. Linked UCs: UC-52, UC-53, UC-54, UC-55.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: existing draft GI-S/OD or draft TD before picking; task source/staging/lot/quality/owner/reservation, actual partial/unpick qty, TO execution actor/time/evidence, immutable units. No Owner task approval or total deduction.
Actions/outcomes:
- UC-54: Instruction/hold only; no total deduction.
- UC-55: Execution/read-only outcome remains defined in UC-55.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-24: Customer Delivery References
State: ACTIVE. Linked UCs: UC-20, UC-21, UC-22.
Layout: scoped worklist/filter→source-linked detail→authorized entry/review/confirmation→committed result/history. Distinguish Save, approval, physical posting and Print.
Field contract: external customer code/name/contact/address/source references. Delivery/source matching only, no CRM/debt.
Actions/outcomes:
- UC-20: Read-only scoped list/detail; no state or stock effect.
- UC-21: Read-only scoped list/detail; no state or stock effect.
- UC-22: Customer delivery master saved; no sales/debt/refund/stock effect.
Validation/recovery: exact linked UC source/version/qty/identity/scope/freeze guards. Keep valid draft inputs on validation failure; unknown commit looks up existing result before retry. Private evidence, mandatory evidence before confirmation.

SC-28: External Document References
State: ACTIVE. Linked UCs: UC-108.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: external system/kind/number/date/line, optional provider revision, stable correlation; purchase/GI-SR/matchedQty and Invoice/Credit Note evidence, verifier/time, independent financial outcome/status; historical eligible deliveredQty, no invented source or monetary workflow.
Actions/outcomes:
- UC-108: Reference/follow-up only; no receipt/issue, refund/payment/debt or SO completion in place of UC-111.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-29: Linked Warehouse Issue Requests
State: ACTIVE. Linked UCs: UC-109.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: saved original SO/line/current version, WIR/release/warehouse/date/qty, cumulative commitment and valid PGI less GR-FD net fulfilment, reopened/not-redelivered remainder; original/replacement OD source/version transfers without duplicate demand.
Actions/outcomes:
- UC-109: WIR/commitment changes no stock by itself; actual GR-FD updates reopening with receipt transaction.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-30: Customer Delivery and Photo Evidence
State: ACTIVE. Linked UCs: UC-110.
Layout: scoped list → source-linked detail → authorized draft/inspection/decision/execution/post → committed result/history; show only permitted actions.
Field contract: SO/warehouse/current source version, valid POSTED GI-S line, recipient/time/qty and successfully stored same-POD private photo; effective POD/GR-FD/OPEN FD source cap; DRAFT/CONFIRMED/VOIDED correction history/dependency checks. Later customer return uses CR.
Actions/outcomes:
- UC-110: No inventory/reservation movement; ordinary CR preserves original delivery/payment history.
Other linked UCs retain their defined scoped read/execution behavior.
Validation/recovery: proper role/sub-operation/kind/version, source caps, scope, freeze and mandatory evidence. Failed transaction has no partial effect; unknown commit lookup before same-key retry.

SC-31: External Payment Receipt Confirmation
State: ACTIVE. Linked UCs: UC-111.
Layout: scoped order → evidence/confirmation → committed result/history.
Field contract: SO/current delivered version, fullPaymentReceived=true, external receipt reference OR evidence OR nonempty note; confirmer/time, expected version, operation key/hash; DRAFT/CONFIRMED/VOIDED with correction reason/history.
Actions/outcomes: only Sales confirms UC-111 after current DELIVERED checks. Unpaid/partial/unclear or early receipt cannot complete. CONFIRMED atomically sets COMPLETED; VOIDED correction recomputes progress. No payment, price, stock or financial-ledger execution.
Validation/recovery: operation/warehouse/order/evidence scope, current version and stable idempotency key; rollback on failure; lookup unknown commit.

</replacement_text>
