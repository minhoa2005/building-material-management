# Report 3 — 50 use cases: foundation, purchasing, warehouse operations and transfers

All replacement content is included below. Do not ask for a baseline file, upload, repository path or external comparison document. Replace the named sections with the English text inside each <replacement_text> block; the wrapper tags are editing markers and must not appear in the report. Preserve the document template and convert Markdown tables into document tables. Preserve existing content outside the specified replacement scope. Do not claim to have changed embedded images or tested software unless those actions were actually completed.

In II, replace the 50 use-case specifications whose full text is supplied below. Insert missing use cases under their existing feature group. Preserve the feature groups and use-case identifiers. This message contains every replacement specification; no other file is required.

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

UC-01: View replenishment request list
Status: ACTIVE. Feature: FE-01.
Primary actors and operations: Store Owner — View; Accountant — View; Warehouse Staff — Own / assigned scope; Sales Staff — Own / assigned scope.
Screen(s): SC-06.
Description: Sales and Warehouse Staff view their own/assigned replenishment needs; Owner and Accountant view within responsibility and warehouse scope.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Creation date, creator, status, approval decision. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Request number, products, quantity, decision. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Request number, products, quantity, decision; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-02: View replenishment request details
Status: ACTIVE. Feature: FE-01.
Primary actors and operations: Store Owner — View; Accountant — View; Warehouse Staff — Own / assigned scope; Sales Staff — Own / assigned scope.
Screen(s): SC-06.
Description: Show requested and available quantities, source demand, pending supply allocations and versioned approval history within authorized scope.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Request number. A specific record must be selected before its details can be displayed.
Display fields: Product lines, available stock reference, approval history. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Product lines, available stock reference, approval history; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-03: Create replenishment request
Status: ACTIVE. Feature: FE-01.
Primary actors and operations: Warehouse Staff — Create; Sales Staff — Create.
Screen(s): SC-06.
Description: Sales Staff raises customer shortages; Warehouse Staff raises stock needs after checking compatible stock, existing PO/transfer supply and minimum levels. Accountant does not originate operational demand.
Preconditions / required inputs: Sales shortage or Warehouse stock need with visible current stock and incoming allocations.
Normal flow:
1. Select warehouse/products, need date, units and uncovered quantity.
2. Deduplicate compatible timely PO/transfer coverage; link shortage/threshold/count evidence.
3. Submit RR version to a different Owner user.
Alternate/exception flows: Covered demand reduces request; duplicate demand/invalid quantity remains draft.
Business branch coverage: BF-01-A1.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Pending RR saved; physical and available stock unchanged.

UC-04: Approve or reject replenishment request
Status: ACTIVE. Feature: FE-01.
Primary actors and operations: Store Owner — Approve / reject / return; not requester.
Screen(s): SC-06.
Description: Store Owner approves, rejects or returns the exact request version for revision. Requester and approver must be different userIds; no PO before approval.
Preconditions / required inputs: Pending RR/version; Owner differs from requester.
Normal flow:
1. Review shortage and covered supply.
2. Approve exact lines/quantities, reject or return for revision with reason.
3. Record decision/version/actor/time and PO eligibility.
Alternate/exception flows: Rejection blocks PO; revision needs new version/review; self-approval denied.
Business branch coverage: BF-01-A2.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Decision saved; no stock or PO posting.

UC-05: View purchase order list
Status: ACTIVE. Feature: FE-01.
Primary actors and operations: Store Owner — View; Accountant — View; Warehouse Staff — Receiving scope only.
Screen(s): SC-07.
Description: Filter orders by supplier, date, status, and outstanding quantity.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Supplier, order date, status, outstanding qty. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Order number, supplier, confirmed/received/outstanding. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Operation scope: Warehouse Staff may view only the PO information needed for assigned-warehouse receiving: supplier/order reference, products, units, confirmed/outstanding quantities and delivery schedule. Purchase prices, financial information and PO modification are not granted by this view.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Order number, supplier, confirmed/received/outstanding; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-06: View purchase order details
Status: ACTIVE. Feature: FE-01.
Primary actors and operations: Store Owner — View; Accountant — View; Warehouse Staff — Receiving scope only.
Screen(s): SC-07.
Description: Display order lines, supplier confirmations, and partial receipt history. Display ordered, confirmed, received, accepted and outstanding quantities with source receipts. This is read-only, not a separate outstanding-quantity UC.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Order number. A specific record must be selected before its details can be displayed.
Display fields: Product lines, ordered, confirmed, received, outstanding, receipt links. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Operation scope: Warehouse Staff may view receiving-related PO detail only within assigned warehouses; direct detail/evidence access enforces the same restriction as the list. It cannot modify the PO or view purchasing financial data.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Product lines, ordered, confirmed, received, outstanding, receipt links; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-07: Manage Purchase Order and Supplier Confirmation
Status: ACTIVE. Feature: FE-01.
Primary actors and operations: Accountant — Perform.
Screen(s): SC-07.
Description: Accountant creates a PO against approved replenishment lines, records supplier confirmation and tracks partial receipts. Changes beyond approval require reapproval; no supplier payment.
Preconditions / required inputs: Approved RR lines with remaining quantity; Accountant purchasing permission.
Normal flow:
1. Create PO from authorized RR lines with supplier/warehouse.
2. Record supplier quantities/dates and preserve confirmations/receipts.
3. Revise/cancel only unreceived remainder; obtain Owner authorization for short closure or changes beyond approval.
4. Reconcile quantities and external documents before eligible closure.
Alternate/exception flows: Partial supply stays outstanding; changes beyond approval require renewed review; received history cannot be erased.
Business branch coverage: BF-01-A3.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: PO/confirmation/outstanding history saved; no inventory or supplier-payment posting.

UC-08: View goods receipt list
Status: ACTIVE. Feature: FE-01.
Primary actors and operations: Store Owner — View; Accountant — View; Warehouse Staff — View.
Screen(s): SC-08.
Description: Search deliveries associated with purchase orders and their processing status.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: PO, receipt reference, status, date. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Receipt number, PO, delivered/inspected state. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Receipt number, PO, delivered/inspected state; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-09: View goods receipt details
Status: ACTIVE. Feature: FE-01.
Primary actors and operations: Store Owner — View; Accountant — View; Warehouse Staff — View.
Screen(s): SC-08.
Description: Display delivered, accepted, pending inspection, defective, and rejected quantities.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Receipt number. A specific record must be selected before its details can be displayed.
Display fields: Physical quantities and accepted/pending/defective/rejected parts. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Physical quantities and accepted/pending/defective/rejected parts; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-10: Create goods receipt from purchase order
Status: ACTIVE. Feature: FE-01.
Primary actors and operations: Warehouse Staff — Perform in assigned warehouse.
Screen(s): SC-08.
Description: Warehouse Staff records each delivery against PO lines, including actual quantities, discrepancies and evidence; creating the draft does not post inventory.
Preconditions / required inputs: Open PO and receiving warehouse; assigned Warehouse Staff.
Normal flow:
1. Record separate arrival/draft for each delivery.
2. Enter PO lines, actual units/pieces, packaging, lot/tone/calibre and discrepancy evidence.
3. Save draft for UC-26 inspection.
Alternate/exception flows: Zero acceptance still retains arrival evidence; wrong/excess goods stay separate pending decision.
Business branch coverage: BF-01-E2.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Draft/arrival saved; no owned-stock increase on draft creation.

UC-11: View product list
Status: ACTIVE. Feature: FE-02.
Primary actors and operations: Store Owner — View; Accountant — View; Warehouse Staff — View; Sales Staff — View.
Screen(s): SC-03.
Description: Search products by item code, name, size, and status.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Product code, name, nominal size, status. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Product code, category, size, product status. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Product code, category, size, product status; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-12: View product details
Status: ACTIVE. Feature: FE-02.
Primary actors and operations: Store Owner — View; Accountant — View; Warehouse Staff — View; Sales Staff — View.
Screen(s): SC-03.
Description: Display tile attributes, packaging specifications, and units of measure.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Product code. A specific record must be selected before its details can be displayed.
Display fields: Product identifiers, tile attributes, unit conversion. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Product identifiers, tile attributes, unit conversion; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-13: Maintain Product and Packaging
Status: ACTIVE. Feature: FE-02.
Primary actors and operations: Store Owner — Perform.
Screen(s): SC-03.
Description: Maintain versioned BOX/PIECE/M2 conversions and controlled minimum stock parameters. Preserve transaction snapshots; count remaining pieces in open boxes. Torn packaging alone does not mean damaged tiles.
Preconditions / required inputs: Store Owner product/packaging permission.
Normal flow:
1. Maintain SKU/name/material/nominal size and active status.
2. Create positive versioned BOX/PIECE/M2 factors and finite warehouse minimums from verified specifications.
3. Retain transaction snapshots; evaluate thresholds on authorized query or committed stock changes.
Alternate/exception flows: Missing factors block conversion; actual whole pieces cannot be fractional; used versions immutable.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Master/version/minimum saved; no prices, automatic PO or inventory movement.

UC-14: View lot list
Status: ACTIVE. Feature: FE-02.
Primary actors and operations: Store Owner — View; Warehouse Staff — View.
Screen(s): SC-04.
Description: Search lots by product, lot number, tone, and actual calibre.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Product, lot number, tone, actual calibre. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Product, lot, tone, calibre, quantity presence. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Product, lot, tone, calibre, quantity presence; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-15: View lot details
Status: ACTIVE. Feature: FE-02.
Primary actors and operations: Store Owner — View; Warehouse Staff — View.
Screen(s): SC-04.
Description: Display production date, tone, actual calibre, and related transaction history.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Product, lot number. A specific record must be selected before its details can be displayed.
Display fields: Lot attributes, production date, stock history. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Lot attributes, production date, stock history; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-16: Maintain Product Lot
Status: ACTIVE. Feature: FE-02.
Primary actors and operations: Store Owner — Create / Update; Warehouse Staff — Create only.
Screen(s): SC-04.
Description: Maintain product/lot/tone/actual-calibre identity with evidence and history. Do not overwrite transacted identity to conceal shortages. Survey size is not proof of actual-calibre tracking.
Preconditions / required inputs: Owner create/update or Warehouse create-only permission; product exists.
Normal flow:
1. Record product/manufacturer lot/tone and verified calibre or explicit UNKNOWN identification.
2. Validate duplicate identity and evidence.
3. Preserve transacted identity; use inspection/disposition for quality changes.
Alternate/exception flows: Nominal dimensions cannot substitute for unverified calibre; UNKNOWN lots unavailable for allocation.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Lot master saved; quantity/quality unchanged.

UC-17: View supplier list
Status: ACTIVE. Feature: FE-02.
Primary actors and operations: Store Owner — View; Accountant — View.
Screen(s): SC-05.
Description: Search suppliers by code, name, and cooperation status.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Supplier code, name, cooperation status. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Supplier identity, contact summary, active status. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Supplier identity, contact summary, active status; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-18: View supplier details
Status: ACTIVE. Feature: FE-02.
Primary actors and operations: Store Owner — View; Accountant — View.
Screen(s): SC-05.
Description: Display contact information and related purchases, receipts, and returns.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Supplier code. A specific record must be selected before its details can be displayed.
Display fields: Contact fields, related purchases, receipts, returns. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Contact fields, related purchases, receipts, returns; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-19: Maintain Supplier
Status: ACTIVE. Feature: FE-02.
Primary actors and operations: Store Owner — Activate / Deactivate; Accountant — Create / Update.
Screen(s): SC-05.
Description: Maintain supplier identity/contact data and control supplier availability with separate operation permissions.
Preconditions / required inputs: Accountant create/update identity/contact; Owner activate/deactivate existing supplier only.
Normal flow:
1. Select permitted sub-operation and supplier.
2. Validate identity/contact and historical references.
3. Save under matching operation permission.
Alternate/exception flows: Merged UC grants neither Owner identity-edit rights nor Accountant activation; inactive supplier unavailable for new PO.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Supplier master audited; no stock/payment effect.

UC-20: View Customer List
Status: ACTIVE. Feature: FE-02.
Primary actors and operations: Store Owner — View; Accountant — Reference scope; Warehouse Staff — Delivery scope; Sales Staff — View.
Screen(s): SC-24.
Description: Search delivery/contact references and external MISA customer identifiers within authorized scope; no CRM or commercial account ledger.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve SKU/packaging/conversion versions, lot/tone/calibre, supplier/customer delivery references and status; display persisted source links and derived quantities.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-21: View Customer Details
Status: ACTIVE. Feature: FE-02.
Primary actors and operations: Store Owner — View; Accountant — Reference scope; Warehouse Staff — Delivery scope; Sales Staff — View.
Screen(s): SC-24.
Description: Read customer delivery/contact and source-document references; no sales pricing or receivables.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve SKU/packaging/conversion versions, lot/tone/calibre, supplier/customer delivery references and status; display persisted source links and derived quantities.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-22: Maintain Customer
Status: ACTIVE. Feature: FE-02.
Primary actors and operations: Sales Staff — Maintain contact / delivery reference.
Screen(s): SC-24.
Description: Sales Staff maintains basic customer delivery/contact data and external identifiers; no commercial sales or CRM workflow.
Preconditions / required inputs: Sales Staff customer contact/delivery-reference maintenance permission.
Normal flow:
1. Maintain delivery/contact, external customer code and source matching only.
2. Validate identity and preserve WIR/return references.
3. Save scoped record without CRM/commercial pricing.
Alternate/exception flows: Resolve duplicate identities; do not delete referenced history.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Customer delivery master saved; no sales/debt/refund/stock effect.

UC-26: Inspect and Post Goods Receipt
Status: ACTIVE. Feature: FE-03.
Primary actors and operations: Warehouse Staff — Perform in assigned warehouse.
Screen(s): SC-08.
Description: Warehouse Staff inspects each delivered quantity and posts only accepted ownership by quality/location once. Owner/Accountant may assist physically and be recorded in evidence; they do not inherit GR posting rights. Custody is separate; torn packaging alone is not damage.
Preconditions / required inputs: Draft PO receipt; actual delivery present; assigned Warehouse.
Normal flow:
1. Count actual pieces/boxes and record lot identity, packaging, quality, actor/time.
2. Split quantity by ownership and quality: accepted, pending custody, defective accepted or rejected/handback.
3. Check cumulative PO allowance and required decision/evidence; post actual accepted ownership once to receiving/quarantine.
4. Record held supplier custody separately; immediate rejection needs no fictitious owned receipt.
5. Update PO outstanding and prepare UC-32/33.
Alternate/exception flows: Excess/wrong delivery needs evidence/authorization; no GR0; TORN alone is not DAMAGED; co-inspection grants no posting rights.
Business branch coverage: BF-01-A3, BF-01-E1, BF-01-E2, BF-01-A4.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Owned GR increases actual accepted quantity once; custody separate; availability requires verified GOOD and eligible put-away location.

UC-27: View warehouse and location list
Status: ACTIVE. Feature: FE-04.
Primary actors and operations: Store Owner — View; Warehouse Staff — View.
Screen(s): SC-09.
Description: Search by warehouse, area, aisle, rack, and location code.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Warehouse, area, location code, status. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Warehouse, location code, rack, current status. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Warehouse, location code, rack, current status; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-28: View storage location details
Status: ACTIVE. Feature: FE-04.
Primary actors and operations: Store Owner — View; Warehouse Staff — View.
Screen(s): SC-09.
Description: Display capacity, status, and lot-level quantities at a location.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Warehouse + location code. A specific record must be selected before its details can be displayed.
Display fields: Area, aisle, rack, status, stock by lot/quality. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Area, aisle, rack, status, stock by lot/quality; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-29: Maintain Storage Location
Status: ACTIVE. Feature: FE-04.
Primary actors and operations: Store Owner — Perform.
Screen(s): SC-09.
Description: Create, update or deactivate storage locations.
Preconditions / required inputs: Store Owner has storage-location maintenance permission; Warehouse list/detail rights do not grant maintenance.
Normal flow:
1. Maintain code/kind/active/allocatable within warehouse.
2. Allow allocation only in STORAGE.
3. Check stock and open references before deactivation.
Alternate/exception flows: Nonempty location cannot deactivate; master edit cannot move stock/bypass freeze.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Location metadata saved; quantities/reservations unchanged.

UC-30: View stock by lot, location, and quality status
Status: ACTIVE. Feature: FE-04.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouse; Sales Staff — Available / related demand only.
Screen(s): SC-10.
Description: Show stock by warehouse/location/lot/quality/ownership, with reserved, available and in-transit quantities separated and restricted by data scope.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Warehouse, product, lot, location, quality status. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Lot, location, actual/usable qty, status. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Lot, location, actual/usable qty, status; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.
Additional display requirements: distinguish actual owned/physical/available/held/custody/transit and outstanding quantity in the related source chain; do not pool ownership or treat transit as a quality grade.

UC-31: View inventory balance details
Status: ACTIVE. Feature: FE-04.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouse; Sales Staff — Available / related demand only.
Screen(s): SC-10.
Description: Display physical, usable, reserved, available, custody and transit balances with source movements; do not double count staging/reservations.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Product, lot, location, quality status. A specific record must be selected before its details can be displayed.
Display fields: Qty and UoM, source documents, last movement. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Qty and UoM, source documents, last movement; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.
Additional display requirements: distinguish actual owned/physical/available/held/custody/transit and outstanding quantity in the related source chain; do not pool ownership or treat transit as a quality grade.

UC-32: Create Put-away Task
Status: ACTIVE. Feature: FE-04.
Primary actors and operations: Warehouse Staff — Perform in assigned warehouse.
Screen(s): SC-08.
Description: Create or accept a suggested internal put-away task from a posted receipt; no second receiving or approval document.
Preconditions / required inputs: Accepted receipt has unplaced quantity and Warehouse assignment.
Normal flow:
1. Select receipt lines, quality and suitable storage.
2. Create put-away task within unplaced quantity.
3. Assign execution and location references.
Alternate/exception flows: Frozen/blocked destination waits or reselects.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Task saved; no stock movement or approval layer.

UC-33: Confirm Put-away Task
Status: ACTIVE. Feature: FE-04.
Primary actors and operations: Warehouse Staff — Perform in assigned warehouse.
Screen(s): SC-08.
Description: Warehouse Staff confirms actual placement, preserving total owned quantity and quality. Make accepted stock allocatable only in a suitable location.
Preconditions / required inputs: Open put-away, actual placement and eligible unfrozen locations.
Normal flow:
1. Verify actual lot/quality/owner/quantity.
2. Atomically move receiving→storage and linked reservation.
3. Update task and eligible availability.
Alternate/exception flows: Partial placement keeps remainder; retry returns committed result; wrong lot/freeze blocks movement.
Business branch coverage: BF-01-A4.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Equal source/destination quantity; total unchanged; eligible GOOD stock becomes available.

UC-34: View location movement list
Status: ACTIVE. Feature: FE-04.
Primary actors and operations: Store Owner — View; Warehouse Staff — View.
Screen(s): SC-12.
Description: Search same-warehouse movements by lot and status.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Warehouse, movement reference, date/status. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Source/destination locations, planned/actual qty. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Source/destination locations, planned/actual qty; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-35: View location movement details
Status: ACTIVE. Feature: FE-04.
Primary actors and operations: Store Owner — View; Warehouse Staff — View.
Screen(s): SC-12.
Description: Display source, destination, and actual transferred quantities.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Movement no.. A specific record must be selected before its details can be displayed.
Display fields: Lot, source/destination, planned/actual qty, postings. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Lot, source/destination, planned/actual qty, postings; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-36: Create location movement
Status: ACTIVE. Feature: FE-04.
Primary actors and operations: Warehouse Staff — Perform in assigned warehouse.
Screen(s): SC-12.
Description: Warehouse Staff selects compatible source/destination locations in the same warehouse and checks quantity, reservations and stocktake locks; no Owner approval or inter-warehouse TR.
Preconditions / required inputs: Movable quantity in assigned warehouse and suitable locations.
Normal flow:
1. Select same-warehouse source/destination, lot/quality/owner/quantity.
2. Check reservations and freeze.
3. Save relocation without Owner approval/TR.
Alternate/exception flows: Different warehouse uses BF-04; short/locked stock blocks execution.
Business branch coverage: BF-03-A1, BF-03-E1.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Instruction saved; no movement until actual confirmation.

UC-37: Confirm actual location movement
Status: ACTIVE. Feature: FE-04.
Primary actors and operations: Warehouse Staff — Perform in assigned warehouse.
Screen(s): SC-12.
Description: Confirm actual relocation atomically: source minus q, destination plus q, same lot/quality/owner and total. Carry reservations and block locked locations.
Preconditions / required inputs: Open relocation; actual movement; both locations in same assigned unfrozen warehouse.
Normal flow:
1. Verify actual lot/quality/owner/quantity.
2. Post equal source decrease and destination increase, moving reservations with stock.
3. Save position/actor/time/history.
Alternate/exception flows: Partial move retains remainder; do not silently change lot/quality/owner or free reserved stock.
Business branch coverage: BF-03-A1, BF-03-E1.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Warehouse total unchanged; location/reservation updated once.

UC-38: View warehouse transfer list
Status: ACTIVE. Feature: FE-05.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouses; Sales Staff — Related demand progress.
Screen(s): SC-13.
Description: View transfers between the configured warehouses; D4 confirms inter-warehouse movements. Sales sees progress related to its issue requests.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Source/destination warehouse, status. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Transfer no., dispatched/received qty, status. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Transfer no., dispatched/received qty, status; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.
Additional display requirements: distinguish actual owned/physical/available/held/custody/transit and outstanding quantity in the related source chain; do not pool ownership or treat transit as a quality grade.

UC-39: View warehouse transfer details
Status: ACTIVE. Feature: FE-05.
Primary actors and operations: Store Owner — View; Accountant — Reconciliation scope; Warehouse Staff — Assigned warehouses; Sales Staff — Related demand progress.
Screen(s): SC-13.
Description: Show requested/approved, dispatched, received by quality, in-transit and unresolved quantities with separate dispatch and receipt documents.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Transfer no.. A specific record must be selected before its details can be displayed.
Display fields: Source/destination, dispatch/handover/receipt, differences. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Source/destination, dispatch/handover/receipt, differences; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.
Additional display requirements: distinguish actual owned/physical/available/held/custody/transit and outstanding quantity in the related source chain; do not pool ownership or treat transit as a quality grade.

UC-40: Create Transfer Request
Status: ACTIVE. Feature: FE-05.
Primary actors and operations: Warehouse Staff — Create.
Screen(s): SC-13.
Description: Warehouse Staff requests physical movement between distinct warehouses after considering direct customer dispatch or other compatible sources. Same-warehouse relocation uses UC-36/37.
Preconditions / required inputs: Physical transfer need between distinct warehouses; compatible source reviewed.
Normal flow:
1. Review UC-103 options and customer fulfilment choice if related.
2. Create TR with source/destination, product/lot, qty/reason/date.
3. Submit version to Owner.
Alternate/exception flows: Local relocation uses UC-36/37; direct issue elsewhere uses BF-06.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: TR pending; no source deduction or receipt.

UC-41: Review Transfer Request
Status: ACTIVE. Feature: FE-05.
Primary actors and operations: Store Owner — Approve / reject / return; not requester.
Screen(s): SC-13.
Description: Store Owner approves/rejects/returns the TR version; requester differs from approver. Approved TR authorizes execution and controlled source reservation; no extra inter-warehouse TO approval.
Preconditions / required inputs: Pending TR; Owner differs from requester.
Normal flow:
1. Review source, destination need/date and independent receiver arrangement.
2. Approve quantity/version and atomically reserve eligible source, or reject/return with reason.
3. Release approved TR directly for UC-43.
Alternate/exception flows: Recheck changed stock/freeze; no independent receiver means wait; no redundant TO approval.
Business branch coverage: BF-04-E1.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Approved hold reduces availability only; total unchanged.

UC-43: Record Transfer Dispatch
Status: ACTIVE. Feature: FE-05.
Primary actors and operations: Warehouse Staff — Draft TD before picking; confirm TO execution; post actual handover.
Screen(s): SC-13.
Description: Warehouse drafts TD from approved TR before picking; confirms actual picking TO when staging applies, then posts TD/HO only at handover. No second GI or Owner task approval.
Preconditions / required inputs: Approved TR/source version, sufficient unfrozen stock, actual handover for posting.
Normal flow:
1. Create/update TD draft before picking; draft changes no stock.
2. Confirm actual lot/quantity/staging TO if used; otherwise record picked quantity on TD.
3. At handover post TD once: source to transit, preserving demand allocation.
4. Continue partial TD/MWTR cycles; close TR only after request remainder, transit, variances and all TOs resolve.
Alternate/exception flows: Reject wrong role/scope/source/version, excess quantity or missing mandatory evidence; retain valid draft/pending state. Recount/revision keeps freeze. Unknown commit requires lookup before same-key retry.
Business branch coverage: BF-04-E1, BF-04-E3.
Shared failures: apply EX-01–05 in I.2.9. Customer-return and failed-delivery branches are specified in I.2.7; direct stocktake resolution and recount alternatives are specified in I.2.5.
Postconditions / exact inventory effect: Draft no stock; posting transfers source to transit once, never destination receipt.

UC-44: Review Transfer Difference Resolution
Status: ACTIVE. Feature: FE-05.
Primary actors and operations: Store Owner — Review transfer variance.
Screen(s): SC-13.
Description: Store Owner reviews inter-warehouse discrepancies from UC-43/104. Resolve through linked documents without editing posted quantities; keep unmatched amounts open.
Preconditions / required inputs: Transfer discrepancy/TD/MWTR evidence; Owner not resolution requester.
Normal flow:
1. Review short/over/damaged/wrong-lot amounts.
2. Record versioned approval/rejection/revision for recovery, receipt, return-source or evidenced loss.
3. Warehouse executes linked authorized documents; close fully accounted quantities only.
Alternate/exception flows: Physically received damaged goods are not also lost transit; rejected decision remains open; preserve original TD/MWTR.
Business branch coverage: BF-04-E3.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Decision alone no stock effect; execution accounts for variance once.

UC-104: Inspect and Post Transfer Receipt
Status: ACTIVE. Feature: FE-05.
Primary actors and operations: Warehouse Staff — Destination receive/post; independent from dispatcher.
Screen(s): SC-13.
Description: Destination Warehouse Staff independently verifies actual quantities against dispatch lines and posts MWTR by quality. Move received quantities from transit to destination, retain demand allocation, put away and keep discrepancies open.
Preconditions / required inputs: Destination Warehouse differs from dispatcher; correct TD/TR/destination and remaining transit.
Normal flow:
1. Inspect actual quantity/lot/packaging/quality/evidence.
2. Split receipt by quality; validate transit ceiling.
3. Post MWTR transit→destination receiving/quarantine once; retain demand allocation.
4. Put away eligible stock and report discrepancy UC-44.
Alternate/exception flows: TD100/receive95GOOD+3DAMAGED leaves transit2; over-receipt cannot make negative transit; dispatcher user cannot receive.
Business branch coverage: BF-04-E1, BF-04-E2, BF-04-E3.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Actual received quantity leaves transit; damaged received stock at destination quarantine; unresolved transit remains open.

UC-94: Sign in to the system
Status: ACTIVE. Feature: FE-09.
Primary actors and operations: Store Owner — Use; Accountant — Use; Warehouse Staff — Use; Sales Staff — Use; Administrator — Use.
Screen(s): SC-01.
Description: Access authorized functions according to the assigned account and role.
Preconditions / required inputs: Active internal account.
Normal flow:
1. Enter username/masked credential.
2. Verify hash and activation server-side.
3. Start session with assigned five-role operation/warehouse scope.
Alternate/exception flows: Invalid/inactive account denied; no credential logging or default Admin business rights.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Session created; business stock unchanged.

UC-95: View account list
Status: ACTIVE. Feature: FE-09.
Primary actors and operations: Administrator — View.
Screen(s): SC-02.
Description: Search and filter accounts by name, role, and active status.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Name, role, active/inactive status. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Account identifier, staff name, role, status. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Account identifier, staff name, role, status; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-96: View account details
Status: ACTIVE. Feature: FE-09.
Primary actors and operations: Administrator — View.
Screen(s): SC-02.
Description: Display the selected account's information, assigned role, and status.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Account identifier. A specific record must be selected before its details can be displayed.
Display fields: Staff name, role, account status, permitted operations. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Staff name, role, account status, permitted operations; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-97: Maintain Staff Account
Status: ACTIVE. Feature: FE-09.
Primary actors and operations: Administrator — Perform.
Screen(s): SC-02.
Description: Create, update, activate or deactivate staff accounts; role assignment remains separately controlled.
Preconditions / required inputs: Administrator account-maintenance right.
Normal flow:
1. Create/update unique identity/active flag/protected credentials.
2. Preserve historical actor references.
3. Audit; role/warehouse assignment uses UC-98.
Alternate/exception flows: Inactive cannot sign in; account maintenance grants no business approval.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Account saved; stock/history unchanged.

UC-98: Assign roles and operation permissions
Status: ACTIVE. Feature: FE-09.
Primary actors and operations: Administrator — Maintain existing role / operation / warehouse scope.
Screen(s): SC-02.
Description: Maintain exactly the existing five roles, operation rights and assigned warehouse scope. No purchasing/delivery role, proxy entry or dynamic delegation workflow is introduced. Multiple roles do not permit self-approval.
Preconditions / required inputs: Administrator role/operation/warehouse assignment right.
Normal flow:
1. Assign only OWNER/SALES/WAREHOUSE/ACCOUNTANT/ADMIN.
2. Select fixed permitted operations and warehouses.
3. Audit changes and enforce on later requests.
Alternate/exception flows: No retired UC/new role/arbitrary policy; multi-role user still cannot self-approve.
Shared failures: applicable EX-01 permission/identity, EX-02 version/source concurrency, EX-03 unknown-commit retry, EX-04 freeze, EX-05 evidence/output failure use I.2.9 state/recovery. Read-only export does not itself require posting key.
Postconditions / exact inventory effect: Access configuration saved; no business/stock posting.

UC-99: View Operational Reports
Status: ACTIVE. Feature: FE-09.
Primary actors and operations: Store Owner — All report groups; Accountant — Movement; purchase/receipt; Warehouse Staff — Movement; stock; transfer; stocktake.
Screen(s): SC-20.
Description: Run authorized physical/available/reserved/custody/transit, outstanding receipt/issue, customer-received quantities, DELIVERED pending receipt, COMPLETED/cancelled orders, defect, transfer, return and stocktake reports; no revenue/profit reports.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope. Owner all report groups; Accountant movement/purchase-receipt; Warehouse assigned movement/stock/transfer/stocktake; no revenue/profit.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve permitted accounts/roles/scope or operational quantity reports, movements and source-linked trace; display persisted source links and derived quantities.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.

UC-100: View stock movement log
Status: ACTIVE. Feature: FE-09.
Primary actors and operations: Store Owner — View; Accountant — Purchase / supplier scope; Warehouse Staff — View.
Screen(s): SC-21.
Description: Filter movements by product, lot, location, transaction type, and time.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Product, lot, warehouse, location, type, time. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Movement no., source doc, before/after, operator. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Movement no., source doc, before/after, operator; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.
Additional display requirements: distinguish actual owned/physical/available/held/custody/transit and outstanding quantity in the related source chain; do not pool ownership or treat transit as a quality grade.

UC-101: View stock movement details
Status: ACTIVE. Feature: FE-09.
Primary actors and operations: Store Owner — View; Accountant — Purchase / supplier scope; Warehouse Staff — View.
Screen(s): SC-21.
Description: Display source document, before/after quantity, operator, time, and reason.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Required navigation input: Movement id. A specific record must be selected before its details can be displayed.
Display fields: Source doc, product, lot/location, before/after, user/time. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Source doc, product, lot/location, before/after, user/time; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.
Additional display requirements: distinguish actual owned/physical/available/held/custody/transit and outstanding quantity in the related source chain; do not pool ownership or treat transit as a quality grade.

UC-102: Trace a product lot through source documents
Status: ACTIVE. Feature: FE-09.
Primary actors and operations: Store Owner — View; Accountant — Purchase / supplier scope; Warehouse Staff — View.
Screen(s): SC-21.
Description: Trace lots across external source → SO → WIR → OD → GI-S → POD → PAY-CFM and linked receipts, reservations, movements, returns and adjustments with evidence and user/time history.
Preconditions / input: Authorized scoped records; optional list/date/status/identity filters or required selected ID for detail. Historical/inactive references remain readable within scope.
Record-specific input/display contract:
Optional search/filter inputs: Product, lot, time range. No filters are mandatory; the actor may run an unfiltered list/report within permission scope.
Display fields: Linked receipts, transfers, issues, returns, adjustments in sequence. Values are retrieved from saved records; any displayed quantity is reconciled from the corresponding business transactions.
Normal flow:
1. Open permitted screen and filter/select record.
2. Server applies operation/warehouse/record/evidence scope and validates filters/date order.
3. Retrieve Linked receipts, transfers, issues, returns, adjustments in sequence; display persisted source links and current derived quantities within the exact rights above.
4. Apply same scope to detail/export/evidence links.
Alternate flows: empty→MSG-01; invalid filter→MSG-02 and no mutation; unauthorized→MSG-04 without disclosure; unavailable historical link retains identity without fabricated record.
Postconditions: Information displayed; no creation, decision, reservation, status transition or inventory movement.
Additional display requirements: distinguish actual owned/physical/available/held/custody/transit and outstanding quantity in the related source chain; do not pool ownership or treat transit as a quality grade.

</replacement_text>
