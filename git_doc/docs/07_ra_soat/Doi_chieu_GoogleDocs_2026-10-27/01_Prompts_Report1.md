# Report 1 — Self-contained English replacement text

All replacement content is included below. Do not ask for a baseline file, upload, repository path or external comparison document. Replace the named sections with the English text inside each <replacement_text> block; the wrapper tags are editing markers and must not appear in the report. Preserve the document template and convert Markdown tables into document tables. Preserve existing content outside the specified replacement scope. Do not claim to have changed embedded images or tested software unless those actions were actually completed.

Target: WMSD_Report1_Fix.docx. Keep I.3 Project Stakeholders and the unchanged KiotViet/MISA product profiles. Replace I.1–I.2, II, III.3, IV and V with the blocks below. Correct any reference to the major-feature list so it points to V.1. Remove UC-23–25, UC-42, UC-59–62, UC-74–78 and UC-106 from active catalogues, permissions, detailed specifications, diagrams and navigation. Remove SC-25–27 from active screen requirements. Preserve the original IDs of the 97 remaining use cases and 28 active screens; do not renumber them. Keep UC-108 external document references and UC-111 external payment-receipt confirmation in scope.

## Definitions and Acronyms

<replacement_text>

Definition and Acronyms
SO = copied external Sales Order; POD = photo Proof of Delivery; PAY-CFM = external payment-receipt confirmation; WIR = Warehouse Issue Request; OD = Outbound Delivery; PGI = Post Goods Issue; TD = Transfer Dispatch; MWTR = destination transfer receipt; FD/GR-FD = failed-delivery case/actual return receipt; RECLASS = total-preserving quality/location posting at B1 closure. Custody is physically held stock owned by another party. Warehouse Staff is the canonical application-role name.

| Acronym | Definition |
|---|---|
| WMSD | Warehouse Management System Development — project name and code. |
| PO | Purchase Order — supplier order for products and quantities. |
| GAP | Unmet operational control in the store workflow relative to available retail-software functions. |
| FE | Feature identifier for an in-scope function in Section V. |
| LI | Limitation or exclusion identifier for a capability outside this release. |

</replacement_text>

## I.1 Project Information and I.2 Project Purpose

<replacement_text>

1. Project Information
– English name: Warehouse Management System Development
– Vietnamese name: Phát Triển Ứng Dụng Quản Lý Kho
– Project code: WMSD
– Group name: SEP490_G56
– Software type: Responsive Web Application – warehouse operations for one retail store
– Baseline scope: One retail store; the survey reports three or more warehouses with coded areas/racks. Exact warehouse list, addresses and staffing remain to be verified.
2. Project Purpose
Warehouse Management System Development (WMSD) supports the physical warehouse operations of Cửa hàng gạch ốp lát Tân Thương: replenishment needs, purchasing, receiving/inspection, put-away, location movement, inter-warehouse transfer, issue fulfilment, defects, returns and stocktake. Exactly five application roles are Store Owner, Sales Staff, Warehouse Staff, Accountant and Administrator. Each department uses its own personal accounts to record and confirm its work.
The release serves one store and its configured warehouses. Track product, lot, tone, verified actual calibre where available, location, quality, owner/custody, reservations and transit, with versioned BOX/PIECE/m² conversions. Survey-recorded nominal size does not prove actual calibre has already been collected; unknown identity is kept explicit and unavailable for allocation.
WMSD stores an SO manually copied from a verified MISA/paper source, then linked WIR releases. Warehouse reserves, picks, posts actual handover/PGI once, and confirms customer delivery with mandatory photo POD. Fully delivered remaining quantities set DELIVERED; only Sales confirms full money receipt outside WMSD (PAY-CFM) to set COMPLETED. These confirmations do not change inventory or execute financial transactions. D1 reconciliation explains external order-time deduction versus physical WMS dispatch.
MISA and external processes retain commercial Sales Orders, selling prices, internal/tax invoices, refunds, payment, receivables and full accounting. WMSD records source references and external outcomes without creating, calculating, approving or paying a refund. Live MISA synchronization and general-purpose business-policy editing are excluded. Fixed thresholds and compatible-stock suggestions assist decisions without automatically purchasing or posting stock.

</replacement_text>

## II. Product Background

<replacement_text>

II. Product Background
The store supplies wall/floor tiles for construction and renovation. Earlier project notes place it at Phố Tân An, xã Tân An, Yên Dũng, Bắc Giang; the 20 October survey does not independently verify that address or provide individual warehouse addresses.

Evidence baseline: one response submitted at 09:04:25 on 20 October 2026 (GMT+7). It reports three or more warehouses, clear areas/racks and position codes; MISA for sales/orders/invoices, stock movements/balances and party information. The reported difficulties are stock not matching reality and tracking customer-held, defective and returned quantities. The survey does not justify claiming that storage positions or lot/colour/size records are absent.

Observed activities (As-is; external personnel here are business participants, not extra WMSD roles):
| Activity | Survey evidence and limits |
|---|---|
| Replenishment and purchase | Sales/Warehouse report needs; Owner/management or purchasing personnel decide; Accountant orders from suppliers. Exact approval/delegation settings are not supplied. |
| Supplier receipt | Warehouse counts/checks quality; Owner/Accountant may co-inspect; shortages, excess, wrong sample or breakage have photos/records and are discussed with supplier for replacement or return. |
| Identity and units | Lot, colour and size are recorded in software or carton photos; receipt/count uses boxes, sales uses boxes/pieces/m². MISA/Excel holds factors; loose pieces and open cartons are counted. Torn packaging with intact tiles may still be sold. Actual calibre and SKU factors remain unverified. |
| Defects | Isolate, mark/block, photograph or record; Owner/delegate decides supplier return, regrade or destruction. Dynamic delegation is not selected for WMSD (D3). |
| Transfers | The response selects both transfer and no-transfer options. D4 explicitly resolves this for the proposal: retain physical inter-warehouse transfer and independent dispatch/receipt. Do not edit the contradictory survey record. |
| Stocktake | Monthly counts; MISA comparison, pausing the area, separate movement records if movement continues, recount/cause and Owner/delegate approval are reported. WMSD selects frozen scope until resolution (D5); concurrent-movement counting is not selected. |
| Issue fulfilment | Requests arrive via MISA/software, paper, Zalo/phone/verbal channels. Reserved stock is marked; partial delivery/outstanding quantities are followed. Current deduction is at order/request creation; D1 selects physical deduction at actual handover/PGI. |
| Customer return | Sealed cartons and unused loose tiles are case-by-case; installed, customer-damaged or overdue goods are not accepted. Warehouse counts/checks quality; refund is recorded in MISA. No numerical return deadline is supplied. |
| Supplier return | Accountant/purchasing personnel or Owner contacts supplier; agreement is required before dispatch, with internal authorization, issue/handover evidence and supplier receipt acknowledgement. |
| Entry and device | Survey selects Accountant/one shared operator and immediate entry using a phone. D2 instead retains separate departmental entry/personal accounts; D3 retains five roles without new purchasing/delivery roles. Responsive phone use is required, without inferring native/offline software. |

The selected design decisions distinguish proposed controls from survey evidence. Custody, staging/put-away, compatible FIFO, versioned decisions, atomic posting and idempotency are proposed controls; this report does not assert they are already deployed.

### Selected design decisions

| Decision | Selected To-be rule |
|---|---|
| D1 | Deduct physical warehouse stock at actual handover/PGI; reconcile the copied external order reference with retail records rather than copying the retail system's order-time deduction. |
| D2 | Each department records its own work using personal accounts and assigned operation/warehouse permissions. |
| D3 | Keep exactly five application roles; external purchasing/delivery participants and survey-reported delegation do not create new roles or dynamic approval rights. |
| D4 | Retain physical inter-warehouse transfers with separate dispatch and independent destination receipt. |
| D5 | Freeze the selected stocktake scope from snapshot activation through authorized resolution; concurrent-movement stocktake is not the selected MVP. |
| D6 | Assess sealed cartons and unused loose tiles individually. Installed, customer-damaged or verified-overdue returns are ineligible; unknown conditions remain pending. No numerical return period is assumed. These conditions do not apply to failed-delivery goods never received by the customer. |
| D7 | Torn/open packaging alone is not tile damage. Count actual loose pieces and inspect condition; use verified, versioned BOX/PIECE/m² conversions. |
| External-system boundary | Preserve the warehouse/retail boundary using verified external source references, explicit warehouse events and separately recorded external financial outcomes; do not introduce live synchronization or financial execution. |

</replacement_text>

## III.3 Consolidated Gaps and Section Summary

<replacement_text>

3. Consolidated Gaps and Section Summary

| Gap ID | Operational mismatch with existing solutions and store practice | Business impact |
|---|---|---|
| GAP-01 | Partial supplier delivery reconciliation: KiotViet already documents partial goods receipts; MISA provides purchase-related receiving. At Tân Thương, delivered, quality-accepted, defective and outstanding quantities are not currently consolidated by supplier confirmation and each arrival. | A purchase order can appear settled while goods remain to be received or resolved. |
| GAP-02 | Tile-specific identity and unit consistency: The platforms support standard item attributes and lot-related inventory. The store needs its lot, tone, actual calibre, packaging specification and box/piece/m² equivalent recorded and validated together when goods are handled. | A matching item code can conceal a wrong tile batch or inconsistent stock quantity. |
| GAP-03 | Inspection-to-usable-stock separation: Retail receipts exist, but the store also checks packaging, tone, calibre and damage manually. Its separate notes do not consistently connect each inspection outcome to accepted, waiting, damaged or rejected quantity. | Unverified stock can be presented as available for picking. |
| GAP-04 | Position-level stock and movement trace: MISA eShop documents hierarchical storage positions; the survey confirms coded areas/racks, while consistent linkage of every move to lot/status and evidence remains the proposed control. | Staff cannot reliably locate the intended lot or explain a misplaced quantity. |
| GAP-05 | Transfer checkpoints and exception ownership: KiotViet documents dispatch/receipt and difference notes; MISA documents transfer orders. The store needs attributable evidence for dispatch, carrier handover and destination receipt, followed by a documented resolution of short or damaged quantities. | It is difficult to establish where a transfer discrepancy occurred and who must resolve it. |
| GAP-06 | Actual warehouse picking and issue: Existing retail sales and stock-issue functions do not replace the store's need to tie a physical issue request to the exact picked lot, location, quality status and issued quantity. | The posted issue may differ from what was actually handed over. |
| GAP-07 | Warehouse treatment of returns: Both products support returns as retail transactions. Tân Thương needs an independent physical check for customer-return quality and supplier-return quarantine, with accepted and rejected quantities recorded before stock disposition. | Damaged or unresolved returned goods may be mixed with usable stock. |
| GAP-08 | Stocktake cut-off and controlled adjustment: Both products support stock counts and variance handling. The survey reports monthly counts, area pauses, recount/cause and approval; durable software snapshot/attempt history and frozen scope through resolution are proposed controls. | Discrepancies cannot be reconstructed reliably after a stock adjustment. |
| GAP-09 | Unified physical warehouse audit trail: MISA eShop provides retail documents and reports, but the store's physical inspection, bins, handovers and exception evidence remain partly in separate records. WMSD will keep source-document references rather than duplicate retail or financial processing. | An individual quantity cannot be followed across receiving, storage, movement, issue and return. |

Section Summary. KiotViet and MISA eShop already offer established retail and inventory functions. The nine GAPs describe the store's unresolved physical controls and fragmented records. WMSD addresses tile-specific inspection, traceable stock events, exception resolution and count accountability, together with source-linked warehouse issue fulfilment and external-document reconciliation. Financial accounting and sales payment/debt management remain outside WMSD.

</replacement_text>

## IV. Proposed Solution

<replacement_text>

IV. Proposed Solution
The selected solution implements nine features across eight linked warehouse processes under baseline 3.1.0. Its functional scope comprises 97 active use cases, five application roles, 28 active screens and BR-01–33. Commercial sales pricing, invoicing, refund execution, payments and accounting remain outside WMSD.

| Gap | Feature | Proposed operational handling |
|---|---|---|
| GAP-01 | FE-01 — Purchase Delivery and Partial Receiving | Sales/Warehouse demand and finite thresholds; Owner-approved replenishment; Accountant PO and supplier confirmation; multiple receipts and outstanding quantities. |
| GAP-02 | FE-02 — Master Data and Tile Traceability | Product, lot/tone/verified calibre, versioned BOX/PIECE/m² factors, parties and controlled minimum quantities. Selling-price maintenance is excluded. |
| GAP-03 | FE-03 — Goods Receiving Quality Control | Per-quantity inspection, packaging observation, ownership/custody, good/pending/defective/rejected outcomes, discrepancy evidence and eligible receipt. |
| GAP-04 | FE-04 — Bin-level Inventory and Location Movement | Coded warehouses/locations, stock by owner/lot/quality, put-away and same-warehouse movements that preserve total and reservations without Owner approval. |
| GAP-05 | FE-05 — Warehouse Transfer and Discrepancy Management | Approved TR → draft TD before picking → TO execution if staging → actual TD/HO → independent MWTR/put-away. Preserve allocations and resolve request remainder/transit/variances/tasks before whole-TR closure. |
| GAP-06 | FE-06 — Copied Sales Order, Warehouse Fulfilment and Completion | Verified external source → copied SO → linked WIR/OD → draft GI-S before picking/TO → actual PGI → photo POD/DELIVERED → Sales PAY-CFM/COMPLETED. GR-FD reopens exact original net demand without duplicate replacement OD commitments. No pricing/invoice/payment execution. |
| GAP-07 | FE-07 — Defective Goods and Physical Returns | Immediate defect hold; Sales ordinary CR acceptance or eligible Owner exception after Warehouse inspection; GI-linked failed-delivery GR-FD with net reopening; Accountant agreement/reconciliation/closure and Warehouse actual supplier return without Owner. External finance references remain separate. |
| GAP-08 | FE-08 — Stocktake and Inventory Adjustment | Owner plans monthly/targeted sessions; atomic freeze/snapshot and count sheets; direct substantiated explanation or append-only recount; B1 immediate hold, Warehouse resolution/execution and Owner UC-92/93 actual delta plus RECLASS/location batch before unlock. No ADJ=0. |
| GAP-09 | FE-09 — Access Administration, Audit and Operational Reporting | Five roles, personal accounts and warehouse scope; immutable stock ledger, evidence and external-source trace; physical/available/custody/transit and exception reports. |

BF-01 — Replenishment, purchasing and goods receipt
Main flow: Sales/Warehouse raises uncovered demand; Owner reviews; Accountant creates PO/confirmation; Warehouse records each arrival, inspection and accepted GR, then creates/confirms put-away TO.
Alternate/exception outcomes: Separate accepted ownership, custody and immediate rejection. Rejected goods do not pass through owned GR/put-away. Partial supply and replacements preserve actual source/evidence; no GR0 or double receipt.

BF-02 — Defect detection, isolation and disposition
Main flow: Warehouse records evidence and blocks affected allocation immediately. Outside frozen stocktake, Owner approves scoped scrap/regrade/release; Warehouse executes. Supplier return routes directly to BF-08 without Owner authorization.
Alternate/exception outcomes: B1 records balance-neutral hold/evidence, retaining snapshot and freeze; quality/location posts only in approved UC-93 closure batch, without duplicate UC-66 approval. Scrap deducts actual destruction once; supplier return deducts only at UC-82.

BF-03 — Same-warehouse relocation
Main flow: Warehouse creates/confirms TO-RELOCATE actual quantity and locations in one warehouse, preserving identity/quality/owner/reservations and total. No Owner approval, TR, TD or MWTR.
Alternate/exception outcomes: Different warehouse uses BF-04; frozen/short source blocks confirmation; partial tasks retain or traceably cancel remainder.

BF-04 — Inter-warehouse transfer and discrepancies
Main flow: Owner-approved TR → source TD draft before picking → actual TO confirmation if staging → TD/HO at handover → independent destination MWTR → created/confirmed put-away TO.
Alternate/exception outcomes: Repeat dispatch/receipt for partial trips. A matched TD60 against TR100 leaves unissued40 open; it is not transit. Close only after request remainder, transit, variances and all tasks resolve. Direct customer dispatch from another warehouse uses BF-06 without fictitious receipt.

BF-05 — Stocktake, reconciliation and B1 resolution
Main flow: Owner plans; Warehouse resolves open tasks, atomically freezes/snapshots and counts. Substantiated differences may go directly to explanation/plan; unclear/chosen recount uses Start Recount → Enter Recount → comparison with history.
Alternate/exception outcomes: Record defect hold/evidence immediately without changing balance under freeze. Warehouse proposes/confirms execution, Owner UC-92 approves and UC-93 posts actual nonzero delta plus total-preserving RECLASS/location. Book50/count48GOOD+2broken means RECLASS2/total50; count46GOOD+2broken means delta−2 plus RECLASS2/total48. No ADJ0, false shortage or ordinary freeze bypass. Failure/open holds/tasks prevent unlock.

BF-06 — Copied SO, issue, customer delivery and completion
Main flow: Sales copies verified external SO and creates linked WIR/OD; Warehouse drafts GI-S before picking, confirms actual TO execution and posts PGI at handover; Warehouse photo POD establishes customer receipt/DELIVERED; Sales full external receipt PAY-CFM establishes COMPLETED.
Alternate/exception outcomes: Preserve original SO/WIR, net fulfilment and versioned OD commitments. Valid PGI less valid GR-FD stays within source allowance; effective POD + posted GR-FD + OPEN FD claims ≤ valid PGI per GI line. Partial delivery remains PARTIALLY_DELIVERED; missing photo or early/partial payment cannot complete. Only unexecuted or received-back, not-redelivered quantity may be cancelled; unresolved off-site quantity cannot. GR-FD/changed delivery invalidates stale completion authority.

BF-07 — Post-receipt customer return and failed-delivery intake
Main flow CR: Customer-received POD or verified historical delivery → Sales CR → Warehouse custody/inspection/D6 → Sales STANDARD_ACCEPTANCE for ordinary GOOD/UNUSED, proven-term cases, including own CR; Owner EXCEPTION_APPROVAL only for eligible exceptions with distinct requester → Warehouse GR-CR/put-away or actual handback.
Main flow FD (A1): Valid undelivered GI-S plus failure evidence → Warehouse ARR/INS → actual GR-FD by quality, without D6, fabricated POD, Owner approval or customer custody. Commit receipt/claim consumption and exact original SO/WIR/OD net reopening/version together; Sales then chooses wait/redelivery/cancel received-back remainder.
Alternate/exception outcomes: CR + OPEN CR claims cannot exceed eligible customer-received quantity. FD and POD share source caps, consuming a claim never counts it again with receipt. SO10/PGI10/GR-FD10/redelivery10 retains gross dispatch20/receipt10/net10. Ordinary CR never reopens demand. D6 exclusions block both Sales and Owner; UNKNOWN waits. Reversal checks dependent POD/claims/redelivery; finance remains external.

BF-08 — Supplier return and quantity reconciliation
Main flow: Warehouse proposes/isolates; Accountant verifies source/quantity/agreement; Warehouse posts actual GI-SR or custody release/HO; Accountant records later ACK, reconciles outcomes and closes accounted warehouse quantity through UC-83/107.
Alternate/exception outcomes: No Owner dispatch, variance or closure approval and no prior BF-02 approval prerequisite. Missing agreement or unresolved disputes keep work open. ACK/closure never deduct again; replacement/returned goods require actual receipt. External Invoice/Credit Note and financial status remain independent. On-site destruction/regrade/release still requires BF-02/B1 authority.

Shared failure handling: enforce role/sub-operation/warehouse/source/version and proper decision_kind on the server. Owner approvals require distinct requester; C2 explicitly permits Sales ordinary acceptance of own inspected CR. Transfer receiver is independent of dispatcher. Failed batches roll back fully; unknown commit requires stable operation-key lookup before retry. Photo/upload/email retry cannot post stock again.

</replacement_text>

## V. Project Scope & Limitations

<replacement_text>

V. Project Scope & Limitations
1. Major Features
| ID | Major feature | Capability | Gap |
|---|---|---|---|
| FE-01 | Purchase Delivery and Partial Receiving | Sales/Warehouse demand and finite thresholds; Owner-approved replenishment; Accountant PO and supplier confirmation; multiple receipts and outstanding quantities. | GAP-01 |
| FE-02 | Master Data and Tile Traceability | Product, lot/tone/verified calibre, versioned BOX/PIECE/m² factors, parties and controlled minimum quantities. Selling-price maintenance is excluded. | GAP-02 |
| FE-03 | Goods Receiving Quality Control | Per-quantity inspection, packaging observation, ownership/custody, good/pending/defective/rejected outcomes, discrepancy evidence and eligible receipt. | GAP-03 |
| FE-04 | Bin-level Inventory and Location Movement | Coded warehouses/locations, stock by owner/lot/quality, put-away and same-warehouse movements that preserve total and reservations without Owner approval. | GAP-04 |
| FE-05 | Warehouse Transfer and Discrepancy Management | Approved TR → draft TD before picking → TO execution if staging → actual TD/HO → independent MWTR/put-away. Preserve allocations and resolve request remainder/transit/variances/tasks before whole-TR closure. | GAP-05 |
| FE-06 | Copied Sales Order, Warehouse Fulfilment and Completion | Verified external source → copied SO → linked WIR/OD → draft GI-S before picking/TO → actual PGI → photo POD/DELIVERED → Sales PAY-CFM/COMPLETED. GR-FD reopens exact original net demand without duplicate replacement OD commitments. No pricing/invoice/payment execution. | GAP-06 |
| FE-07 | Defective Goods and Physical Returns | Immediate defect hold; Sales ordinary CR acceptance or eligible Owner exception after Warehouse inspection; GI-linked failed-delivery GR-FD with net reopening; Accountant agreement/reconciliation/closure and Warehouse actual supplier return without Owner. External finance references remain separate. | GAP-07 |
| FE-08 | Stocktake and Inventory Adjustment | Owner plans monthly/targeted sessions; atomic freeze/snapshot and count sheets; direct substantiated explanation or append-only recount; B1 immediate hold, Warehouse resolution/execution and Owner UC-92/93 actual delta plus RECLASS/location batch before unlock. No ADJ=0. | GAP-08 |
| FE-09 | Access Administration, Audit and Operational Reporting | Five roles, personal accounts and warehouse scope; immutable stock ledger, evidence and external-source trace; physical/available/custody/transit and exception reports. | GAP-09 |

2. Limitations & Exclusions
| ID | Excluded item | Boundary |
|---|---|---|
| LI-01 | Multi-store retail management | One store with three or more reported warehouses; no multi-branch retail administration. |
| LI-02 | Sales payments, refunds and accounting | No collection, deposits, receivables/debt, refund amount/approval/payment or financial ledgers. Accountant records verified external references/status only (UC-108). |
| LI-03 | Sales pricing, internal/tax invoicing and live MISA | Commercial SO, selling prices and internal/tax invoices remain external. No invoice generation/email or live MISA synchronization. Warehouse print/handover evidence remains in scope. |
| LI-04 | Fleet and routing | Carrier/recipient and evidence may be recorded; GPS, route optimization and fleet maintenance are excluded. |
| LI-05 | Complex approval/delegation | Only scoped Owner decisions with distinct requester; Sales ordinary inspected CR acceptance may share creator. BF-08 has no Owner approval. No extra role, dynamic delegation, tendering or multilevel approval. |
| LI-06 | Quotation, promotion, loyalty and CRM | Customer records support delivery/contact/source matching only; commercial campaigns and CRM remain external. |
| LI-07 | Omnichannel integration | Paper/Zalo/phone requests are verified and recorded as source evidence before staff copies SO and creates linked WIR; no automatic channel sync or public storefront. |
| LI-08 | Forecasting and automatic purchasing | Finite minimum-stock alerts and compatible-source suggestions are allowed. No demand forecasting, auto-created PO, automatic physical posting or pricing recommendations. |
| LI-09 | HRM and payroll | Accounts support authorized operations only; no attendance, recruitment or payroll. |
| LI-10 | General business-policy editor | No arbitrary policy, workflow or approval-chain editor. Controlled finite thresholds/conversion versions do not confer general rule-authoring rights. |

Verification limits: the survey is one response, not an inventory of all warehouse names/staff or a signed-off return period. MongoDB is runtime; the T-SQL design is a reference artifact. Document synchronization is not proof that posting services or physical controls have been implemented.

</replacement_text>

## Figure captions and diagram content

<replacement_text>

### Replacement figure captions

| Figure | Caption and required content |
|---|---|
| 1 | Proposed WMSD Replenishment, Purchasing and Goods Receipt (BF-01): Sales/Warehouse demand, Owner review, Accountant PO, Warehouse inspection/accepted GR/put-away, partial receipts and custody/rejection exceptions. |
| 2 | Proposed WMSD Defect Detection, Isolation and Disposition (BF-02): immediate blocking, on-site authorization outside stocktake, B1 hold/closure and supplier-return routing without Owner approval. |
| 3 | Proposed WMSD Same-Warehouse Relocation (BF-03): Warehouse TO-RELOCATE, actual partial execution, preserved reservations and unchanged warehouse total. |
| 4 | Proposed WMSD Inter-Warehouse Transfer and Discrepancy Resolution (BF-04): approved TR, draft TD before picking, actual TD/HO, independent MWTR, put-away and unresolved remainders. |
| 5 | Proposed WMSD Stocktake, Reconciliation and B1 Resolution (BF-05): frozen snapshot, count/recount or direct explanation, hold, Warehouse resolution/execution and Owner approval/closure batch. |
| 6 | Proposed WMSD Copied Sales Order and Warehouse Fulfilment (BF-06): copied SO, linked WIR/OD, draft GI-S before picking, PGI, photo POD/DELIVERED and Sales PAY-CFM/COMPLETED. |
| 7 | Proposed WMSD Customer Return and Failed-Delivery Intake (BF-07): distinguish ordinary CR/C2 from FD/A1, including actual GR-FD and atomic net-demand reopening. |
| 8 | Proposed WMSD Supplier Return and Quantity Reconciliation (BF-08): Accountant agreement/ACK/reconciliation/closure and Warehouse actual dispatch, without Owner approval. |

Historical As-is figures must be labelled as historical and remain consistent with the survey evidence above. The To-be diagrams must use the eight process definitions in Section IV. Update figure numbering and every in-text reference consistently; a changed caption alone does not update a diagram's actors or flow.

</replacement_text>
