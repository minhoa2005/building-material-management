# Requirements Traceability Matrix

**Status:** Approved structure — initial evidence mapping pending.

## Scope and source

One row per ACTIVE UC in the approved WMSD Report 3 catalogue (UC-01–UC-130). Requirement IDs, titles, feature groups, and source status come from `be/git_doc/docs/01_bao_cao/WMSD_Report3_Fix.docx.txt`; do not create replacement IDs. The BE catalogue is the source for shared requirement identity.

This BE matrix records BE implementation and test evidence only. The other repository maintains its own evidence in its own tm.md. Blank/TBD evidence fields mean assessment has not yet been performed; they do not claim that implementation or tests are absent.

## Status values

- **Requirement state:** copied from the approved catalogue (currently ACTIVE for these rows).
- **Implementation:** Not started / In progress / Implemented.
- **Verification:** Not tested / Partial / Passed / Blocked.
- `TBD` is a temporary assessment marker, not a completion status. Replace it with an evidence-based status when the row is assessed.

## Matrix

| UC | Requirement | Feature | Requirement state | Implementation | Verification | BE test evidence | Gap / decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UC-01 | View replenishment request list | FE-01 | ACTIVE | Implemented | Passed | [native-api.integration.test.js](../test/native-api.integration.test.js), [backend tests](../test/) | `GET /api/replenishments` returns paginated list filtered by warehouseId, createdBy, status, and date range. Enriched with populated Warehouse (code, name), User (fullName), and product lines (SKU, name, imageUrls). |
| UC-02 | View replenishment request details | FE-01 | ACTIVE | Implemented | Passed | [native-api.integration.test.js](../test/native-api.integration.test.js), [backend tests](../test/) | `GET /api/replenishments/:id` returns complete request document DTO with populated Warehouse (code, name), User full names (createdBy, submittedBy, requestedBy, decidedBy), populated Product (sku, name, isActive, imageUrls) on items, and populated source documents (SalesOrder, Stocktake documentNo, status, version). |
| UC-03 | Create Replenishment Draft | FE-01 | ACTIVE | Implemented | Partial | [RR warnings integration tests](../test/replenishment-warnings.integration.test.js) | HTTP 201 when an optional line note is omitted. A warning on any source requires acknowledgment and a reason. The creator chooses the requested quantity. |
| UC-04 | Update Replenishment Draft or Returned Request | FE-01 | ACTIVE | Implemented | Partial | [RR warnings integration tests](../test/replenishment-warnings.integration.test.js) | HTTP update preserves an omitted line note on the same line ID. A new source document requires a new line. Current warnings require acknowledgment and a reason. |
| UC-05 | Submit Replenishment Request | FE-01 | ACTIVE | Implemented | Partial | [RR warnings integration tests](../test/replenishment-warnings.integration.test.js) | Submitting a draft reevaluates warnings and accepts acknowledgment by line ID. The saved submission includes evaluation snapshots and omits an absent line note. |
| UC-06 | Approve or reject replenishment request | FE-01 | ACTIVE | Implemented | Passed | [RR warnings integration tests](../test/replenishment-warnings.integration.test.js) | Review enforces independent approval and approved quantities within the requested quantity. Current warnings are available through the read-only evaluation API. |
| UC-07 | View purchase order list | FE-01 | ACTIVE | Implemented | Passed | [purchase-core.js](../src/modules/po-receiving/purchase-core.js), [backend tests](../test/) | `GET /api/purchase-orders` returns paginated list with batch-populated `warehouse` (`id`, `code`, `name`), quantities, and role-based price redaction. |
| UC-08 | View purchase order details | FE-01 | ACTIVE | Implemented | Passed | [PO HTTP integration](../test/native-api.integration.test.js), [backend tests](../test/) | PO detail includes warehouse, quantities, arrivals, receipts, authorized audit history and draft edit source lines. Tests verify that legacy `deliverySchedule` is omitted and that `receiving-summary.documents` returns linked inspections and receipts newest first, with price redaction for Warehouse Staff. FE wiring for `documents` is pending. |
| UC-09 | Create Purchase Order | FE-01 | ACTIVE | Implemented | Partial | [PO HTTP integration](../test/native-api.integration.test.js) | Tested creation from an approved RR, draft editing and issuance to `OPEN`. |
| UC-10 | Update Unreceived PO Remainder | FE-01 | ACTIVE | Implemented | Partial | [PO HTTP integration](../test/native-api.integration.test.js) | The 2026-11-11 decision permits changing the shared expected date on `OPEN` and `PARTIAL` POs. Verified `POST /api/purchase-orders/:id/expected-on`, rejection for `DRAFT` and `CLOSED`, permission denial, stale version, replay and the `RESCHEDULE_PO_EXPECTED_ON` audit entry. Evidence covers the revised date-only scope. FE action is pending. See UC-12 for closing the remainder. |
| UC-11 | Record Supplier Order Confirmation | FE-01 | ACTIVE | TBD | TBD | [PO HTTP integration](../test/native-api.integration.test.js) | Superseded by the user decision of 2026-11-11. The confirmation route returns 404 and PO detail omits the legacy supplier confirmation fields. |
| UC-12 | Cancel Unreceived PO Remainder | FE-01 | ACTIVE | Implemented | Partial | [PO HTTP integration](../test/native-api.integration.test.js) | Tested request, independent approval and execution for the outstanding quantity after a partial receipt and expected-date change. |
| UC-13 | Close Purchase Order | FE-01 | ACTIVE | Implemented | Partial | [PO HTTP integration](../test/native-api.integration.test.js) | Tested transition from `PARTIAL` to `CLOSED` after the approved close of the unreceived remainder. Inspection and receipt history remained available after closure. |
| UC-14 | View goods receipt list | FE-01 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-15 | View goods receipt details | FE-01 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-16 | Create goods receipt from purchase order | FE-01 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-17 | View product list | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-18 | View product details | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-19 | Create Product | FE-02 | ACTIVE | TBD | Partial | [native-api.integration.test.js](../test/native-api.integration.test.js) | `POST /api/products` returns 201 and `Khai báo khi tạo sản phẩm` for an initial conversion with a null reference. Evidence here covers initial conversion only. |
| UC-20 | Update Product Information | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-21 | Change Product Status | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-22 | Define Packaging Conversion Version | FE-02 | ACTIVE | Implemented | Passed | [product-conversion-validation.test.js](../test/product-conversion-validation.test.js), [native-api.integration.test.js](../test/native-api.integration.test.js) | HTTP 201 and DB assertions cover omitted, empty, whitespace-only, null, and custom references on updates. HTTP tests also cover the lot default, the 500-character limit, and version conflict. [API contract and default rules](../git_doc/docs/08_api/CONVERSIONS.md). |
| UC-23 | Configure Warehouse Stock Policy | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-24 | View lot list | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-25 | View lot details | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-26 | Create Product Lot | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-27 | Update Product Lot Information | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-28 | View supplier list | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-29 | View supplier details | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-30 | Create Supplier | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-31 | Update Supplier Information | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-32 | Change Supplier Cooperation Status | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-33 | View Customer List | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-34 | View Customer Details | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-35 | Create Customer Delivery Reference | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-36 | Update Customer Delivery Reference | FE-02 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-37 | Inspect and Post Goods Receipt | FE-03 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-38 | View warehouse and location list | FE-04 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-39 | View storage location details | FE-04 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-40 | Create Storage Location | FE-04 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-41 | Update Storage Location Information | FE-04 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-42 | Change Storage Location Status | FE-04 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-43 | View stock by lot, location, and quality status | FE-04 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-44 | View inventory balance details | FE-04 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-45 | Create Put-away Task | FE-04 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-46 | Confirm Put-away Task | FE-04 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-47 | View location movement list | FE-04 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-48 | View location movement details | FE-04 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-35; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-49 | Create location movement | FE-04 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-36; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-50 | Confirm actual location movement | FE-04 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-37; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-51 | View warehouse transfer list | FE-05 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-38; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-52 | View warehouse transfer details | FE-05 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-39; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-53 | Create Transfer Request | FE-05 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-54 | Review Transfer Request | FE-05 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-55 | Record Transfer Dispatch | FE-05 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-56 | Review Transfer Difference Resolution | FE-05 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-57 | View Copied Sales Order List | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-58 | View Copied Sales Order Details | FE-06 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-46; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-59 | Create Copied Sales Order | FE-06 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-47; current native contract. Local verification; browser E2E/live evidence not certified. New-SO source verifier D07/D08 remains undecided. |
| UC-60 | Update Eligible Sales Order Remainder | FE-06 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-48; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-61 | Cancel Eligible Sales Order Remainder | FE-06 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-48; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-62 | View Outbound Delivery List | FE-06 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-49; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-63 | View Outbound Delivery Details | FE-06 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-50; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-64 | Create Outbound Delivery | FE-06 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-51; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-65 | View Picking Task List | FE-06 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-52; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-66 | View Picking Task Details | FE-06 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-53; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-67 | Create Picking Task | FE-06 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-54; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-68 | Confirm Picking Task | FE-06 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-55; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-69 | View goods issue list | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-70 | View goods issue details | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-71 | Post Actual Goods Issue | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-72 | Prepare Goods Issue Draft | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-73 | View defective goods list | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-74 | View defective goods details | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-75 | Record Defect Inspection and Immediate Hold | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-76 | Submit Defective Goods Disposition Proposal | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-77 | Approve or reject defective goods disposition | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-78 | Record approved defective goods disposition | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-79 | View customer return list | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-80 | View customer return details | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-81 | Create Customer Return Request | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-82 | Decide Ordinary Customer Return Acceptance | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-83 | Review Eligible Customer Return Exception | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-84 | Inspect Customer Return | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-85 | Inspect Failed-Delivery Intake | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-86 | Post Customer Return Receipt | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-87 | Post Failed-Delivery Receipt | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-88 | View supplier return request list | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-89 | View supplier return request details | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-90 | Create Supplier Return Request | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-91 | Confirm Supplier Return Dispatch | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-92 | Review Supplier Return Closure | FE-07 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-93 | View stocktake list | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-94 | View stocktake details | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-95 | Create Stocktake Session | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-96 | Activate Stocktake Session | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-97 | Record Stocktake Count Attempt | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-98 | Reconcile Stocktake Results | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-99 | Close Stocktake Without Variance | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-100 | View inventory adjustment request list | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-101 | View inventory adjustment request details | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-102 | Propose Stocktake Resolution | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-103 | Confirm Stocktake Resolution Execution | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-104 | Approve Stocktake Resolution | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-105 | Clear Stocktake Difference | FE-08 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-93; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-106 | Sign in to the system | FE-09 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-107 | View account list | FE-09 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-108 | View account details | FE-09 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-109 | Create Staff Account | FE-09 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-110 | Update Staff Account Information | FE-09 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-111 | Change Staff Account Status | FE-09 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-112 | Assign roles and operation permissions | FE-09 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-113 | View Operational Reports | FE-09 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-99; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-114 | View stock movement log | FE-09 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-115 | View stock movement details | FE-09 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-116 | Trace a product lot through source documents | FE-09 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-117 | Compare Shortage Fulfilment Options | FE-06 | ACTIVE | TBD | Partial | [RR evaluation integration](../test/replenishment-evaluation.integration.test.js) | Evidence covers PO incoming supply for shortage evaluation. The test deducts posted receipts and cancelled quantity, excludes supply after the need date even when a legacy schedule was on time, and verifies that a missing expected date requires review. Full option comparison remains unassessed. |
| UC-118 | Select Warehouse Supply Option | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-119 | Confirm Customer Fulfilment Choice | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-120 | Inspect and Post Transfer Receipt | FE-05 | ACTIVE | Implemented | Partial | [HieuDT integration](../test/hieudt-iterations.integration.test.js); [native BF03/BF04](../test/native-api.integration.test.js) | HieuDT plan UC-104; current native contract. Local verification; browser E2E/live evidence not certified. |
| UC-121 | Export or Print Stocktake Count Sheet | FE-08 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-122 | Verify Historical Customer Delivery Source | FE-09 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-123 | Record External Document Reference | FE-09 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-124 | View WIR List | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-125 | View WIR Details | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-126 | Create Linked WIR | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-127 | Update Linked WIR | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-128 | Cancel Eligible WIR Remainder | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-129 | Confirm Customer Delivery with Photo Evidence | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
| UC-130 | Confirm Full External Payment Receipt | FE-06 | ACTIVE | TBD | TBD | TBD | TBD |
