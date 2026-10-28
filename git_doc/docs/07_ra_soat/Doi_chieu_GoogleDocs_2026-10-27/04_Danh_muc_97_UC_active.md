# Danh mục chuẩn: 97 UC và 28 màn hình đang hoạt động

Nguồn duy nhất: [Report 3 chuẩn](../../01_bao_cao/WMSD_Report3_Fix.docx.txt), baseline 3.1.0, đồng bộ 25/10/2026. Bảng này được trích trực tiếp từ catalogue, permission matrix và screen inventory của nguồn; không phải yêu cầu mới.

Chỉ liệt kê UC ACTIVE. Không đánh lại ID để lấp khoảng trống. Tên vai trò chuẩn: Warehouse Staff. Quyền xem không bao hàm quyền sửa/xác nhận; giữ nguyên phạm vi thao tác, kho, phiên bản và chứng từ.

## 1. Catalogue UC active

| ID | Tên chuẩn | Feature | Mô tả chuẩn |
|---|---|---|---|
| UC-01 | View replenishment request list | FE-01 | Sales and Warehouse Staff view their own/assigned replenishment needs; Owner and Accountant view within responsibility and warehouse scope. |
| UC-02 | View replenishment request details | FE-01 | Show requested and available quantities, source demand, pending supply allocations and versioned approval history within authorized scope. |
| UC-03 | Create replenishment request | FE-01 | Sales Staff raises customer shortages; Warehouse Staff raises stock needs after checking compatible stock, existing PO/transfer supply and minimum levels. Accountant does not originate operational demand. |
| UC-04 | Approve or reject replenishment request | FE-01 | Store Owner approves, rejects or returns the exact request version for revision. Requester and approver must be different userIds; no PO before approval. |
| UC-05 | View purchase order list | FE-01 | Filter orders by supplier, date, status, and outstanding quantity. |
| UC-06 | View purchase order details | FE-01 | Display order lines, supplier confirmations, and partial receipt history. Display ordered, confirmed, received, accepted and outstanding quantities with source receipts. This is read-only, not a separate outstanding-quantity UC. |
| UC-07 | Manage Purchase Order and Supplier Confirmation | FE-01 | Accountant creates a PO against approved replenishment lines, records supplier confirmation and tracks partial receipts. Changes beyond approval require reapproval; no supplier payment. |
| UC-08 | View goods receipt list | FE-01 | Search deliveries associated with purchase orders and their processing status. |
| UC-09 | View goods receipt details | FE-01 | Display delivered, accepted, pending inspection, defective, and rejected quantities. |
| UC-10 | Create goods receipt from purchase order | FE-01 | Warehouse Staff records each delivery against PO lines, including actual quantities, discrepancies and evidence; creating the draft does not post inventory. |
| UC-11 | View product list | FE-02 | Search products by item code, name, size, and status. |
| UC-12 | View product details | FE-02 | Display tile attributes, packaging specifications, and units of measure. |
| UC-13 | Maintain Product and Packaging | FE-02 | Maintain versioned BOX/PIECE/M2 conversions and controlled minimum stock parameters. Preserve transaction snapshots; count remaining pieces in open boxes. Torn packaging alone does not mean damaged tiles. |
| UC-14 | View lot list | FE-02 | Search lots by product, lot number, tone, and actual calibre. |
| UC-15 | View lot details | FE-02 | Display production date, tone, actual calibre, and related transaction history. |
| UC-16 | Maintain Product Lot | FE-02 | Maintain product/lot/tone/actual-calibre identity with evidence and history. Do not overwrite transacted identity to conceal shortages. Survey size is not proof of actual-calibre tracking. |
| UC-17 | View supplier list | FE-02 | Search suppliers by code, name, and cooperation status. |
| UC-18 | View supplier details | FE-02 | Display contact information and related purchases, receipts, and returns. |
| UC-19 | Maintain Supplier | FE-02 | Maintain supplier identity/contact data and control supplier availability with separate operation permissions. |
| UC-20 | View Customer List | FE-02 | Search delivery/contact references and external MISA customer identifiers within authorized scope; no CRM or commercial account ledger. |
| UC-21 | View Customer Details | FE-02 | Read customer delivery/contact and source-document references; no sales pricing or receivables. |
| UC-22 | Maintain Customer | FE-02 | Sales Staff maintains basic customer delivery/contact data and external identifiers; no commercial sales or CRM workflow. |
| UC-26 | Inspect and Post Goods Receipt | FE-03 | Warehouse Staff inspects each delivered quantity and posts only accepted ownership by quality/location once. Owner/Accountant may assist physically and be recorded in evidence; they do not inherit GR posting rights. Custody is separate; torn packaging alone is not damage. |
| UC-27 | View warehouse and location list | FE-04 | Search by warehouse, area, aisle, rack, and location code. |
| UC-28 | View storage location details | FE-04 | Display capacity, status, and lot-level quantities at a location. |
| UC-29 | Maintain Storage Location | FE-04 | Create, update or deactivate storage locations. |
| UC-30 | View stock by lot, location, and quality status | FE-04 | Show stock by warehouse/location/lot/quality/ownership, with reserved, available and in-transit quantities separated and restricted by data scope. |
| UC-31 | View inventory balance details | FE-04 | Display physical, usable, reserved, available, custody and transit balances with source movements; do not double count staging/reservations. |
| UC-32 | Create Put-away Task | FE-04 | Create or accept a suggested internal put-away task from a posted receipt; no second receiving or approval document. |
| UC-33 | Confirm Put-away Task | FE-04 | Warehouse Staff confirms actual placement, preserving total owned quantity and quality. Make accepted stock allocatable only in a suitable location. |
| UC-34 | View location movement list | FE-04 | Search same-warehouse movements by lot and status. |
| UC-35 | View location movement details | FE-04 | Display source, destination, and actual transferred quantities. |
| UC-36 | Create location movement | FE-04 | Warehouse Staff selects compatible source/destination locations in the same warehouse and checks quantity, reservations and stocktake locks; no Owner approval or inter-warehouse TR. |
| UC-37 | Confirm actual location movement | FE-04 | Confirm actual relocation atomically: source minus q, destination plus q, same lot/quality/owner and total. Carry reservations and block locked locations. |
| UC-38 | View warehouse transfer list | FE-05 | View transfers between the configured warehouses; D4 confirms inter-warehouse movements. Sales sees progress related to its issue requests. |
| UC-39 | View warehouse transfer details | FE-05 | Show requested/approved, dispatched, received by quality, in-transit and unresolved quantities with separate dispatch and receipt documents. |
| UC-40 | Create Transfer Request | FE-05 | Warehouse Staff requests physical movement between distinct warehouses after considering direct customer dispatch or other compatible sources. Same-warehouse relocation uses UC-36/37. |
| UC-41 | Review Transfer Request | FE-05 | Store Owner approves/rejects/returns the TR version; requester differs from approver. Approved TR authorizes execution and controlled source reservation; no extra inter-warehouse TO approval. |
| UC-43 | Record Transfer Dispatch | FE-05 | Warehouse drafts TD from approved TR before picking; confirms actual picking TO when staging applies, then posts TD/HO only at handover. No second GI or Owner task approval. |
| UC-44 | Review Transfer Difference Resolution | FE-05 | Store Owner reviews inter-warehouse discrepancies from UC-43/104. Resolve through linked documents without editing posted quantities; keep unmatched amounts open. |
| UC-45 | View Copied Sales Order List | FE-06 | Read scoped SO source, customer, issued/delivered/outstanding quantities and DELIVERED/COMPLETED progress. |
| UC-46 | View Copied Sales Order Details | FE-06 | Read copied source lines, WIR/OD/GI/POD/PAY-CFM history and cancellations; no pricing, invoice or payment calculation. |
| UC-47 | Create Copied Sales Order | FE-06 | Sales manually copies a verified external order with source line identity and evidence. Reject duplicate source orders/lines; entry changes no stock. |
| UC-48 | Update or Cancel Unissued Sales Order Remainder | FE-06 | Sales changes only unexecuted or posted-GR-FD-received-back, not-redelivered quantity on the original SO. Preserve source and gross ledger; unresolved off-site stock cannot be cancelled. |
| UC-49 | View Outbound Delivery List | FE-06 | Read-only outbound delivery search and listing. |
| UC-50 | View Outbound Delivery Details | FE-06 | Read-only outbound delivery details. |
| UC-51 | Create Outbound Delivery | FE-06 | Sales plans OD within net WIR allowance; redelivery reuses original OD or traceably transfers reopened commitment to replacement OD without new demand. |
| UC-52 | View Picking Task List | FE-06 | Read authorized warehouse picking tasks associated with outbound delivery releases. |
| UC-53 | View Picking Task Details | FE-06 | Read required lot/location, assigned quantities, reservations, actual picks and shortage/defect evidence. |
| UC-54 | Create Picking Task | FE-06 | Warehouse creates picking TO against existing draft GI-S/OD, with compatible stock and FIFO within compatibility; task is execution, not Owner approval. |
| UC-55 | Confirm Picking Task | FE-06 | Warehouse Staff confirms actual BOX/PIECE quantities into staging and preserves reservations and total stock. Shortage/damage routes to BF-02/05 or replanning; no silent stock correction. |
| UC-56 | View goods issue list | FE-06 | Search by source request, issue date, and status. |
| UC-57 | View goods issue details | FE-06 | Display lot, location, prepared quantity, and actual issued quantity by line. |
| UC-58 | Post Goods Issue | FE-06 | Warehouse creates/updates GI-S draft before picking, then posts actual confirmed handover once. Draft changes no stock; PGI does not itself mean DELIVERED/COMPLETED. |
| UC-63 | View defective goods list | FE-07 | Filter defect cases by source, product/lot/location, ownership, evidence, unresolved quantity and disposition. |
| UC-64 | View defective goods details | FE-07 | Show affected quantity, ownership/custody, inspector, evidence, approval and related outcomes; no duplicate deduction across cases. |
| UC-65 | Inspect Defective Goods and Submit Disposition | FE-07 | Warehouse immediately blocks suspect stock and records evidence; within B1 freeze record balance-neutral defect_hold without ordinary quality/location posting. |
| UC-66 | Approve or reject defective goods disposition | FE-07 | Owner decides scoped destruction/regrade/release outside stocktake; supplier return uses BF-08 without Owner. B1 quality/location approval is UC-92, not duplicate UC-66. |
| UC-67 | Record approved defective goods disposition | FE-07 | Warehouse executes approved destruction/regrade/release outside freeze. Supplier return deducts only at UC-82; B1 quality/location posts only in UC-93 batch. |
| UC-68 | View customer return list | FE-07 | Search CR/FD by mode, source, reason and inspection/receipt status. |
| UC-69 | View customer return details | FE-07 | Show source, custody/ownership, quantity, physical condition, per-line D6 assessment versions/evidence, proper Sales ordinary/Owner exception decision, FD source/receipt/net reopening and external financial-reference status. |
| UC-70 | Create Customer Return Request | FE-07 | Sales creates commercial CR only against customer-received POD or verified historical delivery, with D6 terms and source caps. FD requires no Sales CR and uses Warehouse UC-72/73. |
| UC-71 | Decide Customer Return Acceptance | FE-07 | C2: Sales accepts/rejects ordinary CR after Warehouse inspection, including own creation. Owner only decides eligible exceptions with distinct requester. Neither overrides D6 exclusions; FD bypasses commercial acceptance. |
| UC-72 | Inspect Return or Failed-Delivery Intake | FE-07 | Warehouse distinguishes CR after customer receipt from FD before receipt. CR records customer custody/D6; FD uses posted GI-S/failure evidence and ARR/INS, without D6, fictitious POD, Owner approval or customer custody. |
| UC-73 | Post Customer Return or Failed-Delivery Receipt | FE-07 | Warehouse posts GR-CR under proper Sales ordinary/Owner exception decision; FD posts GR-FD from actual eligible GI-linked receipt without commercial approval, atomically reopening exact original net demand. |
| UC-79 | View supplier return request list | FE-07 | Search by supplier, lot, reason, agreement and reconciliation status. |
| UC-80 | View supplier return request details | FE-07 | Display lot, location, quantity, source receipt, verified supplier agreement, ACK and Accountant reconciliation outcome. |
| UC-81 | Create Supplier Return Request | FE-07 | Warehouse proposes source-linked SR and isolates defects/reserves good goods. Accountant verifies supplier agreement; there is no Owner dispatch/variance/closure approval. |
| UC-82 | Confirm Supplier Return Dispatch | FE-07 | Warehouse posts actual GI-SR or supplier-custody release within Accountant-verified agreement/source quantity, without Owner authorization. ACK is a later event. |
| UC-83 | Review Supplier Return Closure | FE-07 | Accountant reconciles and closes accounted supplier-return warehouse quantity under UC-83/107 without Owner. Unresolved disputes stay open; external financial status is independent. |
| UC-84 | View stocktake list | FE-08 | Search stocktakes by warehouse, scope, cutoff time, and status. |
| UC-85 | View stocktake details | FE-08 | View included lots/locations, system snapshot, counted quantities, and variances. |
| UC-86 | Create Stocktake Session | FE-08 | Store Owner plans monthly or targeted stocktakes, scope and counters. Planning does not take a snapshot or post stock; no new automatic scheduling job. |
| UC-87 | Perform Stocktake Count and Record Results | FE-08 | Warehouse activates immutable snapshot/freeze, counts and retains attempts. Defects discovered under B1 produce immediate hold/evidence without balance changes. |
| UC-88 | Reconcile Stocktake | FE-08 | Warehouse compares quantity/quality/location; substantiated variance may proceed directly to plan, while unclear/chosen recount repeats Start/Enter Recount. Quality-only B1 still needs resolution. |
| UC-89 | View inventory adjustment request list | FE-08 | Search by stocktake, lot, location, variance reason, and approval status. |
| UC-90 | View inventory adjustment request details | FE-08 | Display before/after quantities, cause, creator, evidence, and approval decision. |
| UC-91 | Create Inventory Adjustment Request | FE-08 | Warehouse proposes B1 stocktake resolution with actual nonzero total delta and separate total-preserving RECLASS/location lines. Quality-only uses ST_RESOLUTION without ADJ=0. |
| UC-92 | Approve Stocktake Resolution | FE-08 | Owner approves/returns versioned B1 plan including actual delta, RECLASS and controlled locations with distinct requester; approval never bypasses freeze or posts stock. |
| UC-93 | Clear Stocktake Difference | FE-08 | Owner posts one approved B1 closure batch: actual nonzero delta if any plus total-preserving RECLASS/location, after Warehouse execution. Unlock only resolved scope; no ADJ=0. |
| UC-94 | Sign in to the system | FE-09 | Access authorized functions according to the assigned account and role. |
| UC-95 | View account list | FE-09 | Search and filter accounts by name, role, and active status. |
| UC-96 | View account details | FE-09 | Display the selected account's information, assigned role, and status. |
| UC-97 | Maintain Staff Account | FE-09 | Create, update, activate or deactivate staff accounts; role assignment remains separately controlled. |
| UC-98 | Assign roles and operation permissions | FE-09 | Maintain exactly the existing five roles, operation rights and assigned warehouse scope. No purchasing/delivery role, proxy entry or dynamic delegation workflow is introduced. Each user has exactly one role. Owner approvals still require a different requester, including after a role change. |
| UC-99 | View Operational Reports | FE-09 | Run authorized physical/available/reserved/custody/transit, outstanding receipt/issue, customer-received quantities, DELIVERED pending receipt, COMPLETED/cancelled orders, defect, transfer, return and stocktake reports; no revenue/profit reports. |
| UC-100 | View stock movement log | FE-09 | Filter movements by product, lot, location, transaction type, and time. |
| UC-101 | View stock movement details | FE-09 | Display source document, before/after quantity, operator, time, and reason. |
| UC-102 | Trace a product lot through source documents | FE-09 | Trace lots across external source → SO → WIR → OD → GI-S → POD → PAY-CFM and linked receipts, reservations, movements, returns and adjustments with evidence and user/time history. |
| UC-103 | View and Select Shortage Fulfilment Options | FE-06 | Sales/Warehouse compares compatible available stock by warehouse and selects direct dispatch, physical transfer or replenishment. Link BF-01/04/06; suggestions do not automatically order or post. |
| UC-104 | Inspect and Post Transfer Receipt | FE-05 | Destination Warehouse Staff independently verifies actual quantities against dispatch lines and posts MWTR by quality. Move received quantities from transit to destination, retain demand allocation, put away and keep discrepancies open. |
| UC-105 | Export or Print Stocktake Count Sheet | FE-08 | Warehouse Staff/Owner obtains the activated session's snapshot-based list by location/lot/quality, with cutoff and space for counts and newly found items. Printing does not post stock. |
| UC-107 | Record Supplier Agreement and Receipt Acknowledgement | FE-07 | Accountant verifies pre-dispatch agreement and separately records later ACK, reconciles variances and closes through UC-83 without Owner approval. |
| UC-108 | Record External Document References | FE-09 | Accountant verifies historical delivered sources and records external Invoice/Credit Note/refund/reconciliation kind, number/date, purchase/GI-SR source, matched quantity, evidence and status independently of warehouse closure. |
| UC-109 | Manage Linked Warehouse Issue Request | FE-06 | Sales manages original SO-linked WIR and net reopened demand after posted GR-FD. Reuse original SO/WIR and source versions; replacement OD commitment is transferred, not new demand. |
| UC-110 | Confirm Customer Delivery with Photo Evidence | FE-06 | Assigned Warehouse confirms actual customer receipt against valid posted GI-S with photo. Share source cap with FD/GR-FD; received quantity uses CR for later return. |
| UC-111 | Confirm Full External Payment Receipt | FE-06 | Only Sales confirms full money receipt outside WMSD after rechecking current-version DELIVERED. Reference/evidence/note and user/time are required; atomically set COMPLETED without stock or payment execution. |

## 2. Permission matrix active

| UC | Operation | Store Owner | Accountant | Warehouse Staff | Sales Staff | Administrator |
|---|---|---|---|---|---|---|
| UC-01 | View replenishment request list | View | View | Own / assigned scope | Own / assigned scope | — |
| UC-02 | View replenishment request details | View | View | Own / assigned scope | Own / assigned scope | — |
| UC-03 | Create replenishment request | — | — | Create | Create | — |
| UC-04 | Approve or reject replenishment request | Approve / reject / return; not requester | — | — | — | — |
| UC-05 | View purchase order list | View | View | Receiving scope only | — | — |
| UC-06 | View purchase order details | View | View | Receiving scope only | — | — |
| UC-07 | Manage Purchase Order and Supplier Confirmation | — | Perform | — | — | — |
| UC-08 | View goods receipt list | View | View | View | — | — |
| UC-09 | View goods receipt details | View | View | View | — | — |
| UC-10 | Create goods receipt from purchase order | — | — | Perform in assigned warehouse | — | — |
| UC-11 | View product list | View | View | View | View | — |
| UC-12 | View product details | View | View | View | View | — |
| UC-13 | Maintain Product and Packaging | Perform | — | — | — | — |
| UC-14 | View lot list | View | — | View | — | — |
| UC-15 | View lot details | View | — | View | — | — |
| UC-16 | Maintain Product Lot | Create / Update | — | Create only | — | — |
| UC-17 | View supplier list | View | View | — | — | — |
| UC-18 | View supplier details | View | View | — | — | — |
| UC-19 | Maintain Supplier | Activate / Deactivate | Create / Update | — | — | — |
| UC-20 | View Customer List | View | Reference scope | Delivery scope | View | — |
| UC-21 | View Customer Details | View | Reference scope | Delivery scope | View | — |
| UC-22 | Maintain Customer | — | — | — | Maintain contact / delivery reference | — |
| UC-26 | Inspect and Post Goods Receipt | — | — | Perform in assigned warehouse | — | — |
| UC-27 | View warehouse and location list | View | — | View | — | — |
| UC-28 | View storage location details | View | — | View | — | — |
| UC-29 | Maintain Storage Location | Perform | — | — | — | — |
| UC-30 | View stock by lot, location, and quality status | View | Reconciliation scope | Assigned warehouse | Available / related demand only | — |
| UC-31 | View inventory balance details | View | Reconciliation scope | Assigned warehouse | Available / related demand only | — |
| UC-32 | Create Put-away Task | — | — | Perform in assigned warehouse | — | — |
| UC-33 | Confirm Put-away Task | — | — | Perform in assigned warehouse | — | — |
| UC-34 | View location movement list | View | — | View | — | — |
| UC-35 | View location movement details | View | — | View | — | — |
| UC-36 | Create location movement | — | — | Perform in assigned warehouse | — | — |
| UC-37 | Confirm actual location movement | — | — | Perform in assigned warehouse | — | — |
| UC-38 | View warehouse transfer list | View | Reconciliation scope | Assigned warehouses | Related demand progress | — |
| UC-39 | View warehouse transfer details | View | Reconciliation scope | Assigned warehouses | Related demand progress | — |
| UC-40 | Create Transfer Request | — | — | Create | — | — |
| UC-41 | Review Transfer Request | Approve / reject / return; not requester | — | — | — | — |
| UC-43 | Record Transfer Dispatch | — | — | Draft TD before picking; confirm TO execution; post actual handover | — | — |
| UC-44 | Review Transfer Difference Resolution | Review transfer variance | — | — | — | — |
| UC-45 | View Copied Sales Order List | View | Reconciliation scope | Related execution | Own / assigned demand | — |
| UC-46 | View Copied Sales Order Details | View | Reconciliation scope | Related execution | Own / assigned demand | — |
| UC-47 | Create Copied Sales Order | — | — | — | Perform within unexecuted quantity | — |
| UC-48 | Update or Cancel Unissued Sales Order Remainder | — | — | — | Edit/cancel unexecuted or GR-FD-received-back, not-redelivered quantity | — |
| UC-49 | View Outbound Delivery List | View | Reconciliation scope | Related execution | Own / assigned demand | — |
| UC-50 | View Outbound Delivery Details | View | Reconciliation scope | Related execution | Own / assigned demand | — |
| UC-51 | Create Outbound Delivery | — | — | — | Plan OD/reuse or transfer reopened commitment without duplicate demand | — |
| UC-52 | View Picking Task List | View | Reconciliation scope | Assigned warehouse | Related progress | — |
| UC-53 | View Picking Task Details | View | Reconciliation scope | Assigned warehouse | Related progress | — |
| UC-54 | Create Picking Task | — | — | Perform; PGI only on actual handover | — | — |
| UC-55 | Confirm Picking Task | — | — | Perform; PGI only on actual handover | — | — |
| UC-56 | View goods issue list | View | Reconciliation scope | Assigned warehouse | Related progress | — |
| UC-57 | View goods issue details | View | Reconciliation scope | Assigned warehouse | Related progress | — |
| UC-58 | Post Goods Issue | — | — | Draft GI-S before picking; post actual handover once | — | — |
| UC-63 | View defective goods list | View | — | View | — | — |
| UC-64 | View defective goods details | View | — | View | — | — |
| UC-65 | Inspect Defective Goods and Submit Disposition | — | — | Inspect / isolate / propose | — | — |
| UC-66 | Approve or reject defective goods disposition | Approve on-site scrap/regrade/release outside ST; not requester | — | — | — | — |
| UC-67 | Record approved defective goods disposition | — | — | Execute approved on-site action outside freeze; B1 through UC-93 | — | — |
| UC-68 | View customer return list | View | External follow-up | Inspection / receipt scope | Own / assigned returns | — |
| UC-69 | View customer return details | View | External follow-up | Inspection / receipt scope | Own / assigned returns | — |
| UC-70 | Create Customer Return Request | — | — | — | Create / check source and conditions | — |
| UC-71 | Decide Customer Return Acceptance | Eligible EXCEPTION_APPROVAL only; not requester | — | — | STANDARD_ACCEPTANCE after inspection; own ordinary CR allowed | — |
| UC-72 | Inspect Return or Failed-Delivery Intake | — | — | Inspect CR/custody/D6 or GI-linked FD without customer custody | — | — |
| UC-73 | Post Customer Return or Failed-Delivery Receipt | — | — | Post GR-CR under proper decision or GR-FD with atomic net reopening | — | — |
| UC-79 | View supplier return request list | View | Agreement / reconciliation scope | Assigned warehouse | — | — |
| UC-80 | View supplier return request details | View | Agreement / reconciliation scope | Assigned warehouse | — | — |
| UC-81 | Create Supplier Return Request | — | — | Propose/isolate; Accountant agreement, no Owner | — | — |
| UC-82 | Confirm Supplier Return Dispatch | — | — | Post actual agreed GI-SR/custody release; no Owner | — | — |
| UC-83 | Review Supplier Return Closure | View | Reconcile and close accounted warehouse quantities | — | — | — |
| UC-84 | View stocktake list | View | — | View | — | — |
| UC-85 | View stocktake details | View | — | View | — | — |
| UC-86 | Create Stocktake Session | Plan session | — | — | — | — |
| UC-87 | Perform Stocktake Count and Record Results | — | — | Count / reconcile / propose within locked scope | — | — |
| UC-88 | Reconcile Stocktake | — | — | Count / reconcile / propose within locked scope | — | — |
| UC-89 | View inventory adjustment request list | View | — | View | — | — |
| UC-90 | View inventory adjustment request details | View | — | View | — | — |
| UC-91 | Create Inventory Adjustment Request | — | — | Propose B1 delta/RECLASS/location and confirm execution | — | — |
| UC-92 | Approve Stocktake Resolution | Approve/return current B1 resolution; not requester | — | — | — | — |
| UC-93 | Clear Stocktake Difference | Post approved B1 batch after Warehouse execution; unlock resolved scope | — | — | — | — |
| UC-94 | Sign in to the system | Use | Use | Use | Use | Use |
| UC-95 | View account list | — | — | — | — | View |
| UC-96 | View account details | — | — | — | — | View |
| UC-97 | Maintain Staff Account | — | — | — | — | Perform |
| UC-98 | Assign roles and operation permissions | — | — | — | — | Maintain existing role / operation / warehouse scope |
| UC-99 | View Operational Reports | All report groups | Movement; purchase/receipt | Movement; stock; transfer; stocktake | — | — |
| UC-100 | View stock movement log | View | Purchase / supplier scope | View | — | — |
| UC-101 | View stock movement details | View | Purchase / supplier scope | View | — | — |
| UC-102 | Trace a product lot through source documents | View | Purchase / supplier scope | View | — | — |
| UC-103 | View and Select Shortage Fulfilment Options | View | — | View / select stock option | View / confirm customer fulfilment | — |
| UC-104 | Inspect and Post Transfer Receipt | — | — | Destination receive/post; independent from dispatcher | — | — |
| UC-105 | Export or Print Stocktake Count Sheet | Export / print | — | Export / print assigned scope | — | — |
| UC-107 | Record Supplier Agreement and Receipt Acknowledgement | — | Record / verify external evidence | — | — | — |
| UC-108 | Record External Document References | — | Record / verify external evidence | — | — | — |
| UC-109 | Manage Linked Warehouse Issue Request | View | Reconciliation scope | Related execution view | Manage net WIR/reopened demand; cancel eligible remainder | — |
| UC-110 | Confirm Customer Delivery with Photo Evidence | View | Reconciliation scope | Confirm / correct POD in assigned warehouse | Related progress view | — |
| UC-111 | Confirm Full External Payment Receipt | View | Reconciliation scope; no confirmation | Related progress view; no confirmation | Confirm / correct full external receipt after DELIVERED | — |

## 3. Màn hình active

| ID | Screen | State | Linked UC |
|---|---|---|---|
| SC-01 | Sign In | ACTIVE | UC-94 |
| SC-02 | Accounts and Permissions | ACTIVE | UC-95, UC-96, UC-97, UC-98 |
| SC-03 | Products and Packaging | ACTIVE | UC-11, UC-12, UC-13 |
| SC-04 | Product Lots | ACTIVE | UC-14, UC-15, UC-16 |
| SC-05 | Suppliers | ACTIVE | UC-17, UC-18, UC-19 |
| SC-06 | Replenishment Requests | ACTIVE | UC-01, UC-02, UC-03, UC-04 |
| SC-07 | Purchase Orders | ACTIVE | UC-05, UC-06, UC-07 |
| SC-08 | Goods Receipt, Inspection and Put-away | ACTIVE | UC-08, UC-09, UC-10, UC-26, UC-32, UC-33 |
| SC-09 | Warehouse Locations | ACTIVE | UC-27, UC-28, UC-29 |
| SC-10 | Inventory and Shortage Options | ACTIVE | UC-30, UC-31, UC-103 |
| SC-11 | Defective Goods and Disposition | ACTIVE | UC-63, UC-64, UC-65, UC-66, UC-67 |
| SC-12 | Location Movements | ACTIVE | UC-34, UC-35, UC-36, UC-37 |
| SC-13 | Warehouse Transfers, Dispatch and Receipt | ACTIVE | UC-38, UC-39, UC-40, UC-41, UC-43, UC-44, UC-104 |
| SC-14 | Stocktake Sessions, Count Sheet and Counts | ACTIVE | UC-84, UC-85, UC-86, UC-87, UC-88, UC-105 |
| SC-15 | Stocktake Resolution and Clear Difference | ACTIVE | UC-89, UC-90, UC-91, UC-92, UC-93 |
| SC-16 | Copied Sales Orders and Progress | ACTIVE | UC-45, UC-46, UC-47, UC-48, UC-103 |
| SC-17 | Goods Issue and Actual Handover | ACTIVE | UC-56, UC-57, UC-58 |
| SC-18 | Customer Return and Failed-Delivery Intake | ACTIVE | UC-68, UC-69, UC-70, UC-71, UC-72, UC-73 |
| SC-19 | Supplier Return, Agreement and Acknowledgement | ACTIVE | UC-79, UC-80, UC-81, UC-82, UC-83, UC-107 |
| SC-20 | Operational Reports | ACTIVE | UC-99 |
| SC-21 | Stock Movement and Lot Trace | ACTIVE | UC-100, UC-101, UC-102 |
| SC-22 | Outbound Deliveries | ACTIVE | UC-49, UC-50, UC-51 |
| SC-23 | Picking Tasks | ACTIVE | UC-52, UC-53, UC-54, UC-55 |
| SC-24 | Customer Delivery References | ACTIVE | UC-20, UC-21, UC-22 |
| SC-28 | External Document References | ACTIVE | UC-108 |
| SC-29 | Linked Warehouse Issue Requests | ACTIVE | UC-109 |
| SC-30 | Customer Delivery and Photo Evidence | ACTIVE | UC-110 |
| SC-31 | External Payment Receipt Confirmation | ACTIVE | UC-111 |

## 4. Kiểm đếm

| Nhóm | Số UC active |
|---|---:|
| FE-01 | 10 |
| FE-02 | 12 |
| FE-03 | 1 |
| FE-04 | 11 |
| FE-05 | 7 |
| FE-06 | 18 |
| FE-07 | 17 |
| FE-08 | 11 |
| FE-09 | 10 |
| **Tổng** | **97** |

Tổng màn hình active: **28**. Không suy ra UC mới từ khoảng trống ID. Đọc đặc tả chi tiết, field contracts, business rules và ngoại lệ trong Report 3 chuẩn khi sửa từng mục; catalogue này không thay thế đặc tả.

