# Report 2 — Self-contained English replacement text

All replacement content is included below. Do not ask for a baseline file, upload, repository path or external comparison document. Replace the named sections with the English text inside each <replacement_text> block; the wrapper tags are editing markers and must not appear in the report. Preserve the document template and convert Markdown tables into document tables. Preserve existing content outside the specified replacement scope. Do not claim to have changed embedded images or tested software unless those actions were actually completed.

Target: WMSD_Report2.docx. Replace the current 14-week forward plan with the complete remaining-work plan below. Retain historical change-log rows and append a revision entry describing this five-week planning alignment. Do not invent actual effort, passed tests, a fixed rehearsal date or a monetary budget. Remove UC-23–25, UC-42, UC-59–62, UC-74–78 and UC-106 from active catalogues, permissions, detailed specifications, diagrams and navigation. Remove SC-25–27 from active screen requirements. Preserve the original IDs of the 97 remaining use cases and 28 active screens; do not renumber them. Keep UC-108 external document references and UC-111 external payment-receipt confirmation in scope.

## Cover and planning identifier

<replacement_text>

CAPSTONE PROJECT REPORT
Report 2 – Project Management Plan
Warehouse Management System Development (WMSD)
SEP490_G56 – Cửa hàng điện nước gạch ốp lát Tân Thương
Planning revision: 26 October 2026

</replacement_text>

## I. Project Overview and II. Management Approach

<replacement_text>

I. Project Overview
1. Scope and Purpose
Warehouse Management System Development (WMSD) is a responsive web application for the warehouse operations of Cửa hàng điện nước gạch ốp lát Tân Thương. The project focuses on physical-stock accuracy and traceability for one business establishment with configured warehouse areas and storage locations. The system records and links replenishment requests, purchase orders, supplier confirmations, goods receiving and inspection, lot/location inventory, defective goods, stock movements and transfers, stocktake and approved adjustments, warehouse issues, customer returns, supplier returns, reports and audit history.
Tile inventory is controlled by product, unit of measure, lot, tone, actual calibre, quality status and storage location. Box, piece and square-metre quantities follow the product conversion rule. Stock-affecting transactions preserve their source document, responsible user, time, quantity and status so warehouse staff can trace how recorded inventory changed.
Out of scope for the first release are full accounting, customer debt management, statutory electronic invoicing, and live integration with MISA eShop. MISA eShop remains the store’s existing retail system; WMSD keeps the references required to reconcile warehouse operations without replacing the full retail/accounting solution.
WMSD is developed as the project’s warehouse-focused operational layer and follows the selected Report 1/SRS process baseline 3.1.0, synchronized 25 October 2026: eight BFs, nine features, five application roles, 97 active use cases, BR-01–33 and 28 active screens.
Current fulfilment: verified external order → copied SO → linked WIR/OD → GI-S draft before picking/TO → actual PGI → Warehouse photo POD/DELIVERED → Sales full external receipt PAY-CFM/COMPLETED. No sales pricing, internal invoicing, refund/payment execution or live MISA synchronization.
A1 adds Warehouse failed-delivery intake/GR-FD against undelivered GI-S, without D6, fictitious POD, Owner or customer custody; actual receipt atomically reopens original SO/WIR/OD net demand/version. Claims alone cannot reopen. Preserve gross ledger and transfer replacement OD commitments without duplicate demand; ordinary GR-CR does not reopen.
B1 retains FROZEN immutable snapshot; Warehouse records immediate balance-neutral defect hold, proposes/confirms resolution execution; Owner UC-92/93 approves/posts actual nonzero delta plus RECLASS/location before resolved-scope unlock. Substantiated differences may proceed directly; unclear/chosen recount retains attempt history. Quality-only requires no ADJ=0.
C2 permits Sales to accept/reject own ordinary CR after Warehouse inspection under verified D6 conditions; Owner only eligible exceptions with distinct requester, never overriding D6 exclusions/UNKNOWN. BF-08 has no Owner dispatch/variance/closure approval: Accountant verifies agreement/reconciles/closes UC-83/107, Warehouse posts actual stock events. Supplier-return closure is an Accountant operation.

This revision controls only the remaining five-week implementation and documentation window, from Monday 26 October to Sunday 29 November 2026, corresponding to project Weeks 8–12. Planned working days are Monday–Friday, with the internal delivery due Friday 27 November. Project Week 13 is 30 November–6 December; the team expects a rehearsal review during that week, possibly near its end, but its exact date is not confirmed. Week 13 contributes no implementation capacity to this plan. Earlier capstone stages remain historical context and are not re-estimated as new work.

All 97 active use cases remain in delivery scope. Excluded functions are not counted in development effort or the active-UC completion denominator. Authentication, administration and UI mockups were reported complete by the team as of 26 October; UC-94–98 have zero remaining feature-build estimate but require explicit regression work. This report does not independently verify their implementation, permissions or test results. A mockup does not establish completion of a business use case.

The project tracker contains the 97 active use cases once each in its WBS, with coding/unit-test effort, iteration, document/test assignments and deadlines. The 25 person-days of shared documentation, integration and release work are included in this plan. Existing template fields and sheets are retained.

2. Assumptions & Constraints
Item | Confirmed planning basis | Effect on the plan
--- | --- | ---
Delivery window | 26 Oct–29 Nov 2026; project Weeks 8–12 | Five calendar weeks; work and document completion due 27 Nov on the agreed Mon–Fri working calendar.
Rehearsal review | Project Week 13, 30 Nov–6 Dec; exact day TBC | Track confirmation as an open action. No fixed appointment or extra delivery capacity is assumed.
Team | trungph, minhtd, hieudt, danghh and bachhm | Business-group ownership spans frontend, backend, rules, unit tests and documentation.
Availability | 40 hours/person/week, Monday–Friday; 20% reserve | Confirmed by the team. One person-day is 8 hours. No weekend overtime is budgeted.
Existing foundation | Authentication, administration and UI mockups completed according to team report | Retain existing work; verify integration, operation/warehouse permissions and regression. Historical actual effort is unknown.
Scope | All 97 active UC; Excluded functions outside delivery scope | No silent scope reduction. Any proposed change requires explicit impact assessment and approval.
Business boundary | One establishment with configured warehouses/locations; external retail and accounting retained | No live MISA integration, payment/refund execution, sales-pricing or statutory invoicing module.
Technology | ReactJS frontend; Node.js and MongoDB from current report; Cloudinary configured in backend | Reuse configured image storage. Exact backend framework, API test tooling and deployment target still require confirmation.

3. Cost & Time Estimations
Estimates describe remaining work only. They are planning estimates derived from the active catalogue and existing foundation, not measured velocity or historical actuals. Simple list/detail UC are initially sized at 0.25 pd; ordinary maintenance at 0.75 pd; rule-heavy functions at 1.00 pd; stock posting, reservation, freeze or reconciliation functions at 1.50 pd; UC-73 and UC-93 at 2.00 pd each. The WBS records the specific estimate for every UC. Actual effort remains blank until recorded. Re-estimate after the first working slice rather than treating these values as a fixed delivery guarantee.

Owner | Business-group UC | Active UC | Remaining UC build (pd) | Support (pd) | Total (pd)
--- | --- | --- | --- | --- | ---
minhtd | Purchase, receiving and put-away | 22 | 13.00 | 5.00 | 18.00
hieudt | Inventory, relocation and warehouse transfer | 18 | 11.75 | 5.00 | 16.75
danghh | Sales order and goods issue | 18 | 13.50 | 5.00 | 18.50
trungph | Defects, customer and supplier returns | 19 | 16.75 | 3.00 | 19.75
bachhm | Stocktake, adjustment, reports and customer master | 20 | 12.25 | 7.00 | 19.25
Total | All active baseline UC | 97 | 67.25 | 25.00 | 92.25

The 25.00 pd support allocation includes module contracts and seed-data coordination (2.50 pd), first integration tests (2.50 pd), documentation synchronization (3.75 pd), cross-module/exception testing (3.75 pd), final regression and fixes (7.50 pd), and final documentation, deployment/demo preparation and handover (5.00 pd). Planned testing and document work are included in this estimate; they are not an additional uncounted stage. bachhm executes 2.00 pd of returns test/document support; trungph retains all returns business and code accountability.

Delivery week | Calendar window | Working days | Iteration | Planned exit / deliverable | Effort (pd)
--- | --- | --- | --- | --- | ---
W1 / Project Week 8 | 26 Oct–1 Nov 2026 | 26–30 Oct | Iteration 1 | Contracts, master-data and first operational slices; verify existing auth/admin and Cloudinary configuration | 20.00
W2 / Project Week 9 | 2–8 Nov 2026 | 2–6 Nov | Iteration 1 | First module APIs/UI and integration on seeded data; review first package and remaining purchase/receipt dependencies | 20.00
W3 / Project Week 10 | 9–15 Nov 2026 | 9–13 Nov | Iteration 2 | Continue purchase/receiving, relocation/transfer, returns, stocktake and sales rules; synchronize SRS/SDS/tests | 20.00
W4 / Project Week 11 | 16–22 Nov 2026 | 16–20 Nov | Iteration 2 | Connect end-to-end stock operations and exception flows; review partial receipts, failed delivery and stocktake resolution | 17.75
W5 / Project Week 12 | 23–29 Nov 2026 | 23–27 Nov | Iteration 3 | Finish source/version/concurrency and delivery/payment/reference controls; run final regression, fix defects, finalize documents and deploy/handover | 14.50

Iteration 1 totals 40.00 pd, Iteration 2 totals 37.75 pd and Iteration 3 totals 14.50 pd. Review the packages on 6 November, 20 November and 27 November respectively as internal planning targets; these are not confirmed supervisor appointments. Some final source/version and external-reference work extends into Week 12, so final integration/regression must run after those changes. Do not mark earlier seeded-data or mock integrations as complete end-to-end acceptance.

The WBS Planned column assigns each UC to the iteration in which its primary implementation is scheduled to finish. The existing SRS/IT columns use the following internal preparation and verification deadlines. These are planned dates; they do not imply completed documents or passed tests.

Iteration | Project weeks | Calendar window | SRS review/update due (L) | IT cases ready due (O) | IT execution due (R) | UC count
--- | --- | --- | --- | --- | --- | ---
Iteration 1 | Weeks 8–9 | 26 Oct–8 Nov 2026 | 30 Oct 2026 | 4 Nov 2026 | 6 Nov 2026 | 63
Iteration 2 | Weeks 10–11 | 9–22 Nov 2026 | 13 Nov 2026 | 18 Nov 2026 | 20 Nov 2026 | 31
Iteration 3 | Week 12 | 23–29 Nov 2026 | 25 Nov 2026 | 25 Nov 2026 | 27 Nov 2026 | 3

The 63 UC in Iteration 1 include the five pre-existing auth/admin UC, whose remaining coding estimate is zero. Iteration 3 also regresses all 97 active UC and completes documents/release work; its three UC are only the remaining primary implementation deliveries. The template's pivot groups each UC's full coding/unit-test estimate by its finishing iteration (33.75 / 30.50 / 3.00 pd). The weekly capacity plan above allocates work as it occurs, including work spanning iterations and the separate 25 pd of support tasks; its iteration totals therefore use a different basis.

No monetary labor rate, hosting budget or Cloudinary plan has been provided. This report estimates effort and available time only; it does not invent a monetary project cost. Track any confirmed service cost separately when a provider/plan is selected.

4. Capacity Planning
Item | Calculation | Capacity
--- | --- | ---
Hours per person per week | 8 h/day × 5 days | 40 h
Team weekly gross capacity | 5 people × 40 h | 200 h / 25 pd
Window | 5 weeks, project Weeks 8–12 | 25 working days/person
Gross capacity | 5 × 5 × 40 h | 1,000 h / 125 pd
Coordination and interruption reserve | 20% × 1,000 h | 200 h / 25 pd
Effective delivery capacity | 1,000 − 200 h | 800 h / 100 pd
Planned remaining effort | 92.25 pd × 8 h | 738 h / 92.25 pd
Unallocated effective capacity | 800 − 738 h | 62 h / 7.75 pd

The 20% reserve covers routine coordination and unplanned review/interruptions; the explicitly estimated integration, regression and documentation tasks remain in planned delivery effort. The additional 7.75 pd is unassigned effective capacity, separate from the reserve. Each member has 20.00 effective pd across five weeks and a maximum planned load of 4.00 pd/week. Neither weekend capacity nor the tentative Week-13 review window is counted.

Task owner | Week 8 | Week 9 | Week 10 | Week 11 | Week 12 | Total | Effective capacity | Unallocated
--- | --- | --- | --- | --- | --- | --- | --- | ---
minhtd | 4.00 | 4.00 | 4.00 | 3.50 | 2.50 | 18.00 | 20.00 | 2.00
hieudt | 4.00 | 4.00 | 4.00 | 2.25 | 2.50 | 16.75 | 20.00 | 3.25
danghh | 4.00 | 4.00 | 4.00 | 4.00 | 2.50 | 18.50 | 20.00 | 1.50
trungph | 4.00 | 4.00 | 4.00 | 4.00 | 3.75 | 19.75 | 20.00 | 0.25
bachhm | 4.00 | 4.00 | 4.00 | 4.00 | 3.25 | 19.25 | 20.00 | 0.75
Team | 20.00 | 20.00 | 20.00 | 17.75 | 14.50 | 92.25 | 100.00 | 7.75

trungph has 0.25 pd of unallocated capacity; bachhm has 0.75 pd after taking the customer-master work, and danghh has 1.50 pd. Raise blockers the same working day and use available peer support for review, testing or fixes. A material estimate increase must trigger re-planning and explicit discussion of scope, staffing or deadline tradeoffs.

5. Project Objectives
Planned objectives and actual evidence are tracked separately. No runtime tests were executed as part of preparing this management plan.
Metric | Planned target | Actual as of 26 Oct 2026 | Measurement
--- | --- | --- | ---
Active-UC delivery | 97/97 active UC accepted by internal release | 0 accepted UC evidenced; 5 auth/admin UC reported coded | Acceptance requires implemented FE/API/rules, reviewed SRS/design, ready test cases, passed relevant integration tests and peer verification.
Excluded-function control | No active operations, routes, permissions or screen actions for excluded functions | Source/runtime verification pending | Verify the delivery scope and active permission/screen inventory before release.
Effort | 92.25 pd planned within 100 effective pd | Actual effort not supplied | Record actual pd in the team effort log linked to the UC; sum once by owner/week.
Critical/high release defects | 0 open inventory-corruption, authorization or main-flow blockers at release | Test evidence not supplied | Record observed defects and severity in the defect description; close after re-test only.
Requirements and tests | Every active UC linked to its SRS, implementation and test evidence | Pending verification | Coverage includes normal, error, permission and stock-affecting alternatives. UI mockups do not count as acceptance.
Documentation | Module SRS/SDS/test evidence and user/install guides synchronized by 27 Nov | Existing baseline available; implementation changes pending | Each business owner updates its module; peer reviewer checks consistency.
Schedule | Internal package ready 27 Nov; code/document window ends 29 Nov | Not yet due | Compare completed deliverables with dated WBS; confirm Week-13 rehearsal separately.

6. Risks and Mitigations
ID | Risk | Probability / Impact | Mitigation and owner
--- | --- | --- | ---
R01 | Full scope may exceed the remaining five-week capacity; estimates are not calibrated against measured velocity. | High / High | bachhm maintains the planning record; all owners compare actuals at each weekly review. Re-estimate after the first slice, escalate blockers and require approval for material scope/date changes.
R02 | Shared stock/UOM/reservation/source/freeze logic differs across modules, causing duplicate posting or inventory mismatch. | Medium / High | hieudt coordinates the posting contract; minhtd owns conversion/master-data rules, danghh reservation/demand, trungph source claims and bachhm freeze/closure rules. Review stock-affecting changes and test reconciliation, concurrency, retries and rollback.
R03 | CR/FD, B1 stocktake and supplier-return exceptions remain happy-path implementations, with little spare capacity for the returns/sales owners. | High / High | trungph and danghh expose cross-module blockers early; bachhm provides 2 pd return IT/document support. Test partial/zero acceptance, source caps, GR-FD reopening, stale decisions, B1 holds/RECLASS/atomic closure and Owner-free BF-08.
R04 | Review date, deployment configuration or evidence access is confirmed late. | Medium / High | bachhm tracks the Week-13 review confirmation; minhtd coordinates deployment/tooling selection in Week 8. Prove MongoDB transaction support and Cloudinary upload/access behavior; deliver internal package on 27 Nov independently of the review day.

II. Management Approach
1. Project Process/Methodology
The team uses an iterative Scrum-inspired delivery process for the remaining five weeks. Three iterations follow a 2–2–1-week rhythm: 26 October–8 November, 9–22 November and 23–29 November. The final iteration includes remaining complex controls, regression, defect correction, documentation and release preparation. The five developers are organized by business group rather than permanent frontend/backend/test silos. Each owner implements its ReactJS screens, Node.js APIs, business rules, unit tests and module documentation, then obtains independent review/testing from another member.

The backlog is the complete active Report 3 catalogue plus explicit shared work. Every ACTIVE UC receives exactly one accountable business owner. Excluded functions receive no active development assignment. Reuse existing authentication/admin and Cloudinary setup while verifying operation permissions, warehouse scope and evidence access. In Week 8, agree source identifiers/versions, posting/idempotency keys, UOM snapshots, reservation and freeze checks, evidence contracts, API payloads and seed fixtures before modules diverge.

Iteration planning considers both total and weekly capacity. The weekly capacity table in this report controls load; the template records iteration and the planned code week/date in Notes. Update these entries together when rescheduling. Seeded-data and API-contract work may proceed before upstream modules are integrated, but it is not acceptance evidence. First integrated slices are reviewed at the end of Iteration 1, connected warehouse flows and exceptions at the end of Iteration 2, and complete delivery gates at the end of Iteration 3.

Daily coordination covers completed work, next steps and blockers. A stock-integrity or cross-module blocker is raised the same working day. Weekly reviews compare actual effort, remaining estimates and acceptance evidence with the plan and redistribute support work where necessary. Iteration reviews demonstrate software and record feedback; retrospectives address repeated defects, unclear rules and integration delays. Supervisor/client feedback that changes behavior or scope is recorded before implementation.

Definition of Done for an active UC: frontend and API behavior are implemented; operation/warehouse permissions, state transitions and business rules match the SRS; stock changes use the agreed posting contract; relevant unit/integration tests pass; evidence is linked; SRS/SDS/test documentation is synchronized; and a different member verifies the work. Sign off an active UC only when its implementation, reviewed documents and executed tests satisfy this definition. Use the template's existing Status and SRS/IT progress fields; retain detailed verification evidence in the test documentation. Reported complete, a visible mockup or a test case without an executed result does not pass this gate.

2. Quality Management
The team applies both Quality Assurance (QA) and Quality Control (QC) throughout the project lifecycle. For WMSD, quality management does not focus only on whether a screen works; it also verifies that inventory quantities, lot/location information, quality status, approvals, and source references remain consistent across connected warehouse transactions.
| Activity | Description | Quality objective |
|---|---|---|
| Defect Prevention | • Define and review business rules before coding.<br>• Apply coding conventions and shared validation rules.<br>• Use Git-based version control and peer review to prevent accidental overwrite or inconsistent implementation.<br>• Reuse common stock/UOM validation logic instead of duplicating calculation rules in different modules. | Reduce avoidable defects, especially defects that could create incorrect inventory balances or inconsistent transaction states. |
| Requirement & Use Case Review | • Review SRS, use cases, actors, preconditions, main flows and alternative flows.<br>• Cross-check warehouse flows against confirmed client operations.<br>• Review changes before adding them to an iteration backlog. | Ensure that implemented functions remain inside the approved scope and correctly represent the real warehouse process. |
| Design & UI Review | • Review SDS, data model, sequence/flow design and important screen prototypes before implementation.<br>• Confirm that warehouse documents show the information required for traceability: source document, product, quantity, lot, location, status, actor and time where applicable. | Detect design gaps before coding and keep screen behavior consistent with the requirement specification. |
| Code Review | • Pull/merge requests are reviewed by at least one other team member before integration.<br>• Stock-affecting code, permission checks and status-transition logic receive additional review attention. | Improve maintainability and reduce the probability that one module posts inventory differently from another module. |
| Unit Testing | • Each completed module is unit-tested before integration.<br>• Tests cover validation, calculations, UOM conversion, permission checks and status rules where applicable.<br>• Defects found during unit testing are corrected before the function is merged into the iteration package. | Verify individual functions and services before they participate in end-to-end warehouse flows. |
| Integration Testing | • Integration testing is performed after related modules are combined.<br>• Test flows include purchase/inspection/put-away, multi-trip transfer, GI draft-before-pick/PGI/POD/PAY-CFM, A1 GR-FD/net redelivery, C2 CR and Owner-free BF-08; B1 hold/count/direct explanation or recount/plan/execution/closure.<br>• Each iteration maintains integration test evidence and defect results. | Verify that data, quantities, statuses and references are transferred correctly between connected modules. |
| System Testing | • Conducted progressively in project Weeks 8–12, with the complete release regression and system-test evidence due by Friday 27 November 2026. The tentative Week-13 rehearsal review is outside this five-week capacity.<br>• Tests the complete WMSD against functional and non-functional requirements.<br>• Includes normal flows and important exception cases such as shortage, surplus, damage, invalid conversion, insufficient stock and unresolved discrepancies. | Confirm that the integrated release is stable and satisfies the approved SRS before acceptance testing. |
| Regression Testing | • Re-execute affected test cases after important bug fixes or changes to stock-posting logic.<br>• Prioritize previously passed end-to-end flows that share common inventory services or database transactions. | Ensure that fixes do not break previously working warehouse functions. |
Table 2.1 Quality Management
A defect is considered closed only after the fix is implemented and verified by re-test. Critical defects that can corrupt inventory quantity, expose unauthorized operations, or block a main warehouse flow must be resolved before the related software package is accepted for the next testing stage.
Verification priorities: execute UI→API→MongoDB/evidence scenarios for wrong role/scope, source/version conflicts, concurrent POD/FD/CR claims, partial receipt, unknown-commit retry, downstream correction and failure rollback. Under B1, book50/count48GOOD+2broken retains total50; count46GOOD+2broken posts delta−2 plus RECLASS2. Verify that BF-08 contains no Owner approval gate. These are planned verification activities, not executed test results.

3. Project Training Plan
Training is short, practical and embedded in the confirmed implementation capacity. Reuse the completed foundation and focus on the module contracts and warehouse exceptions still required. Planned technical/test preparation is included in support-task estimates; routine team coordination uses the reserve.
Area | Participants / facilitator | Timing | Expected output
--- | --- | --- | ---
Baseline and shared contracts | All five owners; each explains its module | Week 8, before dependent integration | Agreed source IDs, status/version rules, UOM, posting, reservation, freeze and permission contracts.
ReactJS forms and Cloudinary evidence | All owners; reuse existing mockups/backend setup | Week 8 and before evidence-bearing UC | Working validation, scoped actions, upload/error handling and evidence linkage.
MongoDB transactions and idempotent posting | hieudt with minhtd, danghh, trungph and bachhm | Week 8, then before stock-affecting merges | Demonstrate required transaction support, retry/unknown-commit recovery and no duplicate stock posting.
A1/B1/C2 and BF-08 exceptions | trungph, bachhm and danghh; minhtd/hieudt join for interfaces | Weeks 9–11, before corresponding tests | Executable CR/FD source-cap/reopening, freeze/hold/RECLASS and supplier-return scenarios.
Test evidence and release procedure | All owners with independent peer review | Throughout; complete in Week 12 | Repeatable test data, observed results, defect re-tests, install/user instructions and demo package.

4. Responsibility Assignments
The following assignments implement the team-provided business ownership. Developer ownership is separate from the application's Sales, Warehouse, Accountant, Owner and Administrator roles; assigning a developer does not change runtime permissions or approval rules. No permanent project manager or supervisor appointment is inferred from a member's planning task.
Business owner | Module and supporting responsibilities | Active UC IDs | Peer reviewer
--- | --- | --- | ---
minhtd | Purchase/replenishment, supplier confirmation, receiving/inspection, put-away; product/UOM/lot/supplier masters | UC-01–19, UC-26, UC-32–33 | hieudt
hieudt | Warehouse/location and stock views, intra-warehouse relocation, inter-warehouse transfer, stock movement log; common posting interface | UC-27–31, UC-34–41, UC-43–44, UC-100–101, UC-104 | bachhm
danghh | Copied SO, linked WIR, OD/picking/GI, shortage options, POD and external-payment confirmation | UC-45–58, UC-103, UC-109–111 | minhtd
trungph | Defect handling, customer return/failed-delivery intake, supplier return/agreement/closure, external references and cross-document lot trace | UC-63–73, UC-79–83, UC-102, UC-107–108 | bachhm
bachhm | Stocktake/freeze/count/reconciliation/adjustment/closure/count-sheet, operational reports, customer master, existing auth/admin regression; returns IT/doc support | UC-20–22, UC-84–99, UC-105 | trungph

Customer-master UC-20–22 are shared reference-data work assigned to bachhm after the team restricted danghh to sales and goods issue. danghh has no implementation or peer/test assignments outside UC-45–58, UC-103 and UC-109–111.

For each module the named business owner is accountable and responsible for implementation and requirements; its peer reviewer independently checks the change and test evidence. All members are consulted on shared contracts. Each owner supplies the data/events required by UC-99–102 and UC-108 rather than leaving reporting/traceability to reconstruct missing history at the end. bachhm maintains the shared planning/review-date follow-ups as a delivery task, and minhtd coordinates tooling/deployment confirmation; these are work assignments, not historical role claims.

Shared technical ownership: minhtd maintains UOM/conversion and receipt contracts; hieudt coordinates stock ledger/location/transfer contracts; danghh maintains reservation, SO/WIR/OD and delivery-state contracts; trungph maintains CR/FD/supplier-return source-claim and evidence contracts; bachhm maintains stocktake freeze/snapshot/closure and report criteria. No owner implements an independent conflicting stock-posting engine. For B1 and GR-FD interfaces the relevant owners review the same atomic operation and version/source rules together.

The 2.00 pd returns support planned for bachhm consists of first integration testing (0.50 pd), document synchronization (0.75 pd) and cross-module/exception testing (0.75 pd). trungph remains accountable for returns code and the correctness of the resulting documentation. Foundation code is pre-existing work; bachhm owns its verification during this window.

5. Project Communications
Communication | Participants | Frequency / target | Record
--- | --- | --- | ---
Daily coordination | All members | Each working day; escalate stock/cross-module blockers the same day | Group chat or short call; update assigned WBS item and issue.
Weekly capacity/progress review | All owners | Each Friday: 30 Oct, 6 Nov, 13 Nov, 20 Nov, 27 Nov | Record actual effort, remaining work, load by owner, acceptance/test evidence and decisions.
Iteration review and retrospective | All members; supervisor if available | Internal targets 6 Nov, 20 Nov and 27 Nov | Demonstrate integrated work; record feedback and follow-up actions.
Requirement / interface clarification | Affected business owners; client/supervisor when required | Before ambiguous or changed behavior is implemented | Versioned decision in Q&A, meeting note and relevant SRS/design.
Rehearsal review confirmation | bachhm follows up for the team | Follow up by 27 Nov; record the Week-13 appointment when the supervisor confirms its exact day | Current 30 Nov–6 Dec range is tentative.
Emergency coordination | Affected owners | On critical defect, inventory-integrity failure or deployment blocker | Issue/defect record, action owner and next verification step.

6. Configuration Management
6.1 Document Management
Project reports, requirements, designs, test evidence, meeting notes, user guides and release materials are version-controlled as one coordinated document set. Google Drive supports collaboration and review; Word/Excel milestone submissions retain dated versions and access controls. A local document change does not by itself confirm that a distributed copy, tracker or published document has been updated.

Each business owner updates module SRS, API/data/state design, tests and user guidance together with implementation changes. Keep business baseline 3.1.0 distinct from the management-plan revision dated 26 October 2026. Preserve survey and meeting evidence as historical records. This plan estimates the remaining five-week implementation/documentation window rather than recreating historical project effort.

The project tracker retains the four-sheet WBS, Q&A, Issues and Defects structure and the existing template layout. Its WBS contains 97 active use cases once each, using the existing effort, iteration, status, SRS/IT owner/deadline and Notes fields. Notes identify the implementation owner and planned code week/date. The SRS/IT deadlines follow the iteration table in this plan. Shared support work remains included in the 25 person-day support allocation; it must not be counted twice.

6.2 Source Code Management
Use Git/GitHub with a stable main branch and the team's integration branch. Each business owner works on a scoped feature/fix branch and obtains review from a different member before integrating relevant changes. Use meaningful commits tied to UC/task IDs and link defect fixes to the defect record.

Before merge, verify relevant build/runtime checks and unit tests, scoped authorization, UOM rules, stock/source invariants and required evidence. Shared-contract changes require affected owners to review together. Retain source/version and idempotency handling in one agreed design. Identify the code and matching document version for each iteration package and the final internal release. Re-test affected flows after a fix. Keep credentials and Cloudinary/MongoDB secrets in protected environment configuration, outside committed source.

6.3 Tools & Infrastructures
Category | Confirmed / planned tool | Status
--- | --- | ---
Frontend | ReactJS; reuse existing mockup UI | Confirmed by team. Business functionality remains to be implemented/verified.
Backend | Node.js | Existing report baseline. Exact framework not confirmed.
Database | MongoDB | Existing report baseline. Verify deployment transaction capability before stock integration.
Image storage | Cloudinary | Already configured in backend according to team. Verify upload, access, source linkage and failure behavior.
IDE / editor | VS Code | Existing report baseline.
Diagrams | Draw.io / PlantUML; current Mermaid sources as applicable | Keep process, data and permission diagrams aligned with the current business baseline.
Documentation | Microsoft Office; team Google Docs/Sheets/Slides as applicable | Maintain dated controlled versions and verify each distributed revision.
Version control | Git / GitHub | Peer review and scoped feature/fix branches.
Project tracking | Project tracking workbook: WBS, Q&A, Issues, Defects | Five-week remaining-work tracker using the existing template layout.
Testing / API verification | Tooling to be confirmed in Week 8 | Record the selected tools and actual execution evidence; no fabricated test results.
Deployment | Provider/target to be confirmed in Week 8 | Prepare repeatable configuration and final installation/deployment instructions.
Communication | Google Meet and team group chat | Record material decisions in tracker or meeting notes.

</replacement_text>
