# AI Assistance Log

**Status:** Approved project baseline — 2026-11-09. Entries in this file are for BE work only; FE maintains its own log in `fe/docs/ai-log.md`.

## When to log

Add an entry when AI makes a material contribution to code, tests, requirements/design analysis, business rules, security analysis, or project documentation. Routine lookup, brainstorming that is not used, and minor wording/formatting assistance do not require an entry.

## What to record

Use a concise, sanitized summary. Do not store a full conversation transcript. Never include Sensitive or Secret information; only Public or Internal information may be submitted to an AI tool.

Each entry records the date, work item, tool/model when known, prompt summary, result used, intervention label, human changes, affected files, and validation performed. The author records validation accurately, including checks not run and their reason.

Use one intervention label:

- **Adopted** — used the AI output with no material change.
- **Edited** — used it after limited changes.
- **Rewritten** — used it as a starting point but substantially changed it.
- **Rejected** — did not use the output.

## Entry template

```text
Date:
Work item / change:
Tool and model (if known):
Prompt summary (sanitized):
Result used:
Intervention: Adopted | Edited | Rewritten | Rejected
Human changes / reason for rejection:
Files affected:
Validation performed / not performed:
```

## Log entries

### 2026-11-14 — Area-unit (M2) conversion, rounding to whole pieces, and one PO line per RR line (UC-02–UC-05, UC-09, UC-19, UC-20, UC-22)

- **Work item:** Make an area unit (M2) convert itself and round up to whole pieces. Before this change a 600×600 tile (factor 2.777777777778) rejected every M2 quantity, even 0.36 m² (one piece), and the backfill skipped that size (`AREA_FACTOR_NOT_EXACT`):
  - **`uoms.areaMm2`**: new optional, immutable decimal (M2 = `1000000`; null = not an area unit). `POST /api/uoms` accepts it, `PUT` rejects it. The seed M2 carries it.
  - **Shared functions (`shared/utils/conversions.js`)**: `areaFactor` (`areaMm2 / (length × width)`, 12 places, `ROUND_HALF_UP`), `toBaseQuantity` (`ceil(round(enteredQty × factor, 6))` only for an area entered unit on a `wholeBaseUnits` product; carton and other units keep the exact rule) and `syncAreaConversions`.
  - **Auto-generated conversions**: `createProduct` creates the M2 conversion (`Tự tính từ kích thước sản phẩm`) and returns it; `updateProduct` appends a new version when length or width changes, but never overwrites a conversion entered by hand. `currentConversions` is sorted by `uomId`.
  - **Quantities**: `makeItem` and the RR `previewQuantity` use `toBaseQuantity`; the RR options and detail DTOs return `areaMm2`, `wholeBaseUnits`, `enteredUomAreaMm2` and `productWholeBaseUnits`.
  - **Document invariants found while testing**: `document-item.schema.js` rejected any `qtyBase ≠ enteredQty × factor`, so no M2 document could be saved; it now also accepts the whole-piece rounding result. `copyItem` (about 15 downstream copies) divided `qtyBase` by the factor and failed beyond 6 decimals; it now keeps `qtyBase` canonical when the source line is already rounded and stays strict otherwise.
  - **PO**: `draftItems` uses `toBaseQuantity` and keeps the user's `enteredQty`. Each RR line has at most one PO line; a repeated `rrLineId` returns "Gộp lượng của cùng dòng RR". The 13/11 split-line PO rule was removed on the user's decision (lots are split at inspection and receipt). The optional line `note` stays.
  - **Backfill (`migrations/conversions.js`)**: recognises area units by `areaMm2` instead of the hard-coded code list, uses the rounded 12-place factor and the same base-unit rule as `areaFactor`; `--apply` sets `areaMm2 = 1000000` on M2/M² rows.
- **Tool and model:** Claude Code (Claude Sonnet 5.5 and Opus 5.5).
- **Prompt summary:** Implement the approved plan for M2 auto-conversion and rounding up to whole pieces; then, in follow-up requests, handle the PO split of one RR line, compare PO lines in the RR entered unit with a not-exceed (≤) rule, and finally remove PO line splitting altogether.
- **Result used:** BE code, tests and documentation as listed under Files affected. The first PO-split design (checking the group in pieces) was reverted at the user's request.
- **Intervention:** Edited.
- **Human changes:** The user fixed the six design decisions in the plan; chose "not above the approved quantity, measured in the RR entered unit"; then decided that PO lines are not split because lots are split at inspection and receipt, and asked for the PO split code to be reverted. The user also asked that this log and the RTM be updated.
- **Files affected:** `be/src/models/uom.model.js`, `be/src/models/document-item.schema.js`, `be/src/shared/utils/conversions.js`, `be/src/shared/utils/document-items.js`, `be/src/shared/utils/document-copy.js`, `be/src/modules/uoms/uom.routes.js`, `be/src/modules/products/product.service.js`, `be/src/modules/purchase-orders/purchase-order.commands.js`, `be/src/modules/replenishments/{replenishment.commands,replenishment.evaluation,replenishment.service}.js`, `be/src/migrations/conversions.js`, `be/src/seeds/rebuild/data.js`, `be/test/{area-conversion,conversion-backfill,native-api.integration}.test.js`, `be/git_doc/**` (MODEL_MAP, Data Dictionary and `schema.json` of DB_Current_2026-11-12_58, CONVERSIONS, CONVERSION_BACKFILL, NATIVE_MODEL_RUNTIME, review sheet 13, change logs), `be/docs/ai-log.md`, `be/docs/rtm.md`.
- **Validation:** `RUN_NATIVE_API_TESTS=1 npm test` passed 183 tests (0 failed, 50 skipped by environment conditions) on a local MongoDB replica set; `npm run docs:check` passed. Evidence: 100 m² of a 600×600 tile saves `qtyBase` 278, 0.36 m² saves 1, 10.1 m² of a 500×500 tile saves 41, a carton still rejects a fractional result, and an RR line of 100 m² accepts a PO line of 100.08 m² but rejects 100.09 m². `backfill-conversions.mjs --dry-run` was run only on the local databases `wmsd_demo_tile_shop_v9` (13 pending) and `sep491` (14 pending), both with no review reports. Not performed: `--apply` on any database, any run against the Atlas database in `.env`, and browser or end-to-end checks.

### 2026-11-13 — Putaway Task Lookup by Code & Support for Transfer Requirement Sources (UC-45, UC-46)

- **Work item:** Fix putaway task detail query failures and 404 "Không tìm thấy dữ liệu" errors when querying putaway tasks (`GET /api/goods-receipts/purchase/putaway-tasks/:id`) by document number (e.g., `TO-202610-001`) or when tasks originate from internal transfer requirements (`internal_transfer_requirements`):
  - **Document Lookup by _id or documentNo (`purchase-core.js`)**: Updated `findPurchase` helper to detect 24-character hexadecimal strings; query `{ $or: [{ _id: id }, { documentNo: id }] }` for hex candidates or `{ documentNo: id }` otherwise, eliminating Mongoose `CastError: Cast to DocumentIdentity failed` when clients pass document numbers instead of ObjectIds.
  - **Internal Transfer Requirement Support (`purchase-putaway.service.js`)**: In `task(id)`, expanded source document filtering to permit tasks referencing `internal_transfer_requirements` alongside `goods_receipts`. In `getPutaway(id)`, resolved `receiptId` through the linked transfer requirement when the task source references an internal transfer, ensuring both purchase and transfer putaway tasks return complete task and receipt details without 404 errors.
- **Tool and model:** Antigravity AI (Gemini 3.8 Flash High).
- **Prompt summary:** Fix putaway task lookup returning 404 "Không tìm thấy dữ liệu" when opening putaway tasks by ID / document number or transfer-linked tasks; update ai-log and rtm.
- **Result used:** Updated `be/src/modules/po-receiving/purchase-core.js` and `be/src/modules/po-receiving/purchase-putaway.service.js`.
- **Intervention:** Adopted.
- **Human changes:** Directed dual `_id`/`documentNo` resolution and support for transfer requirement putaway tasks.
- **Files affected:** `be/src/modules/po-receiving/purchase-core.js`, `be/src/modules/po-receiving/purchase-putaway.service.js`, `be/docs/ai-log.md`, `be/docs/rtm.md`.
- **Validation:** Full backend test runner: `npm test` passed 126/126 tests (0 failed). Direct Node test script verified successful lookup by ObjectId, document number (`TO-202610-001`), and ITR source reference (`TO-202610-010`).

### 2026-11-12 - Vietnamese units in demo data

- **Work item and prompt:** Remove duplicate English UOMs from seed data and align dependent flows.
- **Tool and intervention:** Codex, adopted. No human edits during verification.
- **Result:** The tile-shop and BF03 seeds use Viên and Thùng. The seed keeps code `M2` with the name Mét vuông. Replenishment options expose `isCarton`, and new default packaging snapshots use Thùng.
- **Validation:** Seed and native API checks passed 44/44. A fresh local replica-set seed contained 702 records and no conversions with a missing UOM. The application DB was inspected read-only.

### 2026-11-12 - Product conversion history with missing units

- **Work item and prompt:** Fix the `_id` error on Product Detail.
- **Tool and intervention:** Codex, adopted. No human edits during verification.
- **Result:** `src/shared/utils/conversions.js` serializes a missing UOM as `null` in history. The API contract and regression assertions in `test/native-api.integration.test.js` record this behavior.
- **Validation:** Native API integration passed 18/18. Read-only HTTP checks on the running backend returned 200 for detail and history across all 18 products.

### 2026-11-12 — Inbound receipts and linked purchase documents

- **Work item:** Implement the approved inbound plan for purchase inspection, custody placement, put-away and five receipt kinds.
- **Tool/model:** Codex AI, GPT-6 family.
- **Prompt summary:** Connect the separated FE pages to native models, add scoped queries and allow edits of OTHER drafts.
- **Result used:** Added unified list and detail APIs for five receipt kinds, paginated custody and put-away lists, eligible source lookup, versioned edits to `OTHER` drafts, and an optional receiving location on purchase inspection lines. The PO receiving summary links inspections, receipts, custody receipts and put-away tasks. See the [GoodsReceipt API contract](../git_doc/docs/08_api/GOODS_RECEIPTS.md).
- **Intervention:** Adopted.
- **Human changes:** User supplied the plan and confirmed implementation on the existing FE checkout.
- **Files affected:** `src/modules/goods-receipts`, `src/modules/po-receiving`, `src/modules/return-workflows`, `src/modules/transfers`, integration tests and `git_doc`.
- **Validation:** The local MongoDB suite passed 180 tests with 32 skips. Focused purchase and receipt integration passed 19/19. The final `OTHER` draft-edit regression passed 1/1. The local browser run posted all five receipt kinds, verified stock movements, and confirmed that purchase custody stock retained supplier ownership. The browser run used simulated evidence storage. See the [BE RTM](rtm.md).

### 2026-11-12 — Auto-partition loose packaging on goods receipt posting & Putaway route schema alignment (UC-37, UC-45)

- **Work item:** Fix goods receipt posting rejection "Nhập quy cách và thể tích thực đo cho phần hàng mở/lẻ" when received quantity is not an exact multiple of carton pieces (`batch.piecesPerCarton`). Update `receiveStock` in `src/shared/utils/stock.js` to automatically partition quantity into whole cartons (`SEALED`) and loose items (`LOOSE`) with proportional `measuredVolumeMm3` calculated from batch carton dimensions. Fix putaway task creation failure "body.lines.0: Unrecognized key: expectedPlacementVersion" on `POST /api/goods-receipts/purchase/:id/putaway-tasks` by adding `expectedPlacementVersion: z.number().int().min(0).optional()` to line schema in `src/modules/po-receiving/po-receiving.routes.js`.
- **Tool and model:** Antigravity AI (Gemini 3.8 Flash High).
- **Prompt summary:** Fix error "Nhập quy cách và thể tích thực đo cho phần hàng mở/lẻ" when confirming purchase goods receipt, and fix "body.lines.0: Unrecognized key: expectedPlacementVersion" when creating putaway task; update ai-log and rtm.
- **Result used:** Updated `src/shared/utils/stock.js` and `src/modules/po-receiving/po-receiving.routes.js`.
- **Intervention:** Adopted.
- **Human changes:** Directed automatic loose carton partitioning calculation and inclusion of `expectedPlacementVersion` in the putaway route Zod schema.
- **Files affected:** `be/src/shared/utils/stock.js`, `be/src/modules/po-receiving/po-receiving.routes.js`, `be/docs/ai-log.md`, `be/docs/rtm.md`.
- **Validation:** Tested via Node.js native test runner: `node --test test/location-movements.test.js` (2/2 passed) and `test/goods-receipt.integration.test.js`.

### 2026-11-11 — Remove PO delivery schedules and track receiving documents (UC-08, UC-10, UC-12, UC-13, UC-117)

- **Work item** — Replace line-level delivery schedules with one expected date for the unreceived PO quantity.
- **Tool and model** — Codex (GPT-6 family).
- **Prompt summary** — Implement the backend plan to remove `deliverySchedule`, let Accountant change `expectedOn` on an open or partially received PO, and show inspection and receipt history.
- **Result used** — Removed the embedded schedule schema and seed field. RR evaluates the unreceived quantity using `header.expectedOn` after deducting posted receipts and cancelled quantity. `POST /api/purchase-orders/:id/expected-on` checks permission, warehouse, status and version, then records the reason and before/after dates in `AuditLog`. `receiving-summary.documents` lists inspections and purchase receipts by date and preserves quantity reporting and price access rules.
- **Intervention** — Adopted.
- **Human changes** — The user supplied the business decision and BE-only plan and requested the AI log and RTM updates.
- **Files affected** — `src/models/purchase-order.model.js`, the removed `purchase-order-delivery-schedule.schema.js`, `src/modules/purchase-orders/purchase-order.commands*.js`, `src/modules/po-receiving/purchase-read.service.js`, `src/modules/replenishments/replenishment.evaluation.js`, `src/seeds/rebuild/data.js`, the [PO API contract](../git_doc/docs/08_api/NATIVE_MODEL_RUNTIME.md#mua-và-nhập), model documentation, tests and [RTM](rtm.md).
- **Validation** — The [native API](../test/native-api.integration.test.js), [RR evaluation](../test/replenishment-evaluation.integration.test.js) and `test/replenishment-guards.integration.test.js` (historical) suites passed 34/34 on local MongoDB `rs0`. With native API and goods receipt integration enabled, `npm test` passed 149 tests with 44 skipped and 0 failures. `npm run docs:check` and `git diff --check` passed. The seed fixture was checked in memory. FE wiring and browser verification are pending. No migration or demo database reseed was needed.

### 2026-11-11 — Draft-only PO editing and removal of supplier confirmation

- **Work item** — Implement the user's backend PO plan. The Accountant agrees terms with the supplier before drafting the PO.
- **Tool and model** — Codex.
- **Result** — Removed both obsolete commands, updated PO schemas and seed, and added regression tests and documentation. The PO schema filters retired paths when serializing older records.
- **Intervention** — Pending human review. The user supplied the business decision and implementation plan.
- **Affected files** — `src/modules/purchase-orders/`, PO models, `src/seeds/rebuild/data.js`, native PO and replenishment evaluation tests, and current purchase documentation in `git_doc/`.
- **Validation** — `npm test` with native and goods receipt integration enabled passed 141 tests with 32 skipped. Seeded and verified the local demo database. FE is scheduled for a separate pass.

### 2026-11-11 — Purchase Order Warehouse Population, Draft Edit Line Sourcing, and Replenishment Approval Line Mapping (UC-06, UC-07, UC-08)

- **Work item:** Enrich purchase order queries in `src/modules/purchase-orders/purchase-order.service.js`: populate `Warehouse` (`_id`, `code`, `name`) by `header.warehouseId` for `getPurchaseOrder` and batch-populate warehouses for `listPurchaseOrders` so receiving warehouse information is not blank; construct `draftEdit` for draft purchase orders (`po.workflowStatus === 'DRAFT'`) by resolving `ReplenishmentRequest` and `ApprovalHistory` to supply `rrLineId`, `approvalId`, and entered quantities for draft PO editing. In `src/modules/replenishments/replenishment.service.js`, add `lines` mapping (`lineId`, `approvedQtyBase`, `outcome`, `reason`) to `mappedApprovals` in `getReplenishment` to match client expectations and provide seamless approval line traceability.
- **Tool/model:** Antigravity AI (Gemini 3.8 Flash High).
- **Prompt summary:** Fix "Cannot read properties of undefined (reading 'slice')" after approving replenishment request; fix missing edit / open order buttons and blank receiving warehouse on purchase order detail page; update ai-log and rtm.
- **Result used:** Updated `be/src/modules/purchase-orders/purchase-order.service.js` with `Warehouse` and `ReplenishmentRequest` population and `draftEdit` synthesis; updated `be/src/modules/replenishments/replenishment.service.js` with structured approval `lines`.
- **Intervention:** Edited.
- **Human changes:** Directed population of receiving warehouse and `draftEdit` structure for PO endpoints and structured approval lines for replenishment endpoints.
- **Files affected:** `be/src/modules/purchase-orders/purchase-order.service.js`, `be/src/modules/replenishments/replenishment.service.js`, `be/docs/rtm.md`, `be/docs/ai-log.md`.
- **Validation:** Ran backend test suites (`node --test be/test/consolidation.test.js`, `node --test be/test/native-api.integration.test.js`), 0 failures.

### 2026-11-11 — Population of Warehouse, User, Product SKU, and Linked Source Documents in Replenishment APIs (UC-01, UC-02)

- **Work item:** Enrich replenishment query APIs (`getReplenishment` and `listReplenishments` in `src/modules/replenishments/replenishment.service.js`) with complete relational context: populate `Warehouse` (`_id`, `code`, `name`) by `header.warehouseId`; populate `User` (`_id`, `fullName`) for `createdBy`, `header.submittedBy`, `approvals.requestedBy`, and `approvals.decidedBy`; populate `Product` (`_id`, `sku`, `name`, `isActive`, `imageUrls`) for all lines so `productSkuSnapshot` and product thumbnail are returned; and populate source documents (`SalesOrder`, `Stocktake`) for `details.source.documentId` so `documentNo`, `workflowStatus`, and `version` are attached to source references instead of returning raw ObjectIds.
- **Tool/model:** Antigravity AI (Gemini 3.8 Flash High).
- **Prompt summary:** Fix warehouse showing mongodb ID; fix creator showing system; fix product SKU showing N/A and source document snapshot displaying raw ID in replenishment detail; update ai-log and rtm.
- **Result used:** Updated `src/modules/replenishments/replenishment.service.js` with batch `$in` population for warehouses, users, products, sales orders, and stocktakes.
- **Intervention:** Edited.
- **Human changes:** Directed population of warehouse and user full names, product SKU and image URLs, and source document numbers across detail and list endpoints.
- **Files affected:** `be/src/modules/replenishments/replenishment.service.js`, `be/docs/rtm.md`, `be/docs/ai-log.md`.
- **Validation:** Ran full backend test suite (`node --test test/*.test.js`), 103/103 tests passed.

### 2026-11-10 — Product imageUrls projection for replenishment request options (UC-03)

- **Work item:** Add `imageUrls` to the Product query projection in `getReplenishmentOptions` (`src/modules/replenishments/replenishment.commands.js`) to support product thumbnail display in the frontend replenishment creation UI.
- **Tool/model:** Antigravity AI (Gemini 3.8 Flash High).
- **Prompt summary:** Redesign replenishment creation UI to display product images in search auto-suggest and product table.
- **Result used:** Included `imageUrls` in `Product.find({ isActive: true }).select('_id sku name baseUnit lengthMm widthMm imageUrls').lean()`.
- **Intervention:** Adopted.
- **Human changes:** Directed by user requirement for product image display in the replenishment create screen.
- **Files affected:** `be/src/modules/replenishments/replenishment.commands.js`, `be/docs/ai-log.md`.
- **Validation:** Ran backend test suite (`node --test test/*.test.js`), 103/103 tests passed.

### 2026-11-10 — Optional line notes in replenishment request APIs (UC-03–UC-05)

- **Work item:** Remove the mandatory per-line reason from the BE replenishment request workflow.
- **Tool/model:** Codex (GPT-6 family).
- **Prompt summary:** Remove required reason for each product line when creating a replenishment request.
- **Result used:** The API accepts omitted notes and validates supplied notes after trimming. Updating the same line without the field preserves its saved note. Submission snapshots accept missing notes and retain supplied ones. No migration is needed.
- **Intervention:** Adopted.
- **Human changes:** The user chose the BE-only scope, supplied the implementation plan, and requested the AI log and RTM update.
- **Files affected:** Replenishment validation and commands in `src/modules/replenishments/`, line and snapshot schemas in `src/models/`, `test/replenishment-guards.integration.test.js` (historical), [API contract](../git_doc/docs/08_api/REPLENISHMENT_COVERAGE.md), the VI/EN process and model documentation.
- **Validation:** The RR guards and evaluation integration suites passed 14/14 on a local MongoDB replica set with `RUN_NATIVE_API_TESTS=1`. `npm run docs:check` passed. The FE form still requires a note on each line.

### 2026-11-10 — Packaging Conversion Version Backend Handling & Optional Verification Reference (UC-22)

- **Work item:** Make `verificationReference` optional with intelligent auto-default fallback in `configureConversion`, update Zod validation schema, and analyze dual conversion storage architecture (`product_batches` vs `conversions`).
- **Tool/model:** Antigravity AI (Gemini 3.8 Flash High).
- **Prompt summary:** Analyze how backend handles conversions across product-batch and conversion tables (/plan); make verification reference optional conforming to ERP industry standards; add dedicated unit and integration tests.
- **Result used:** Updated `createConversionSchema` in `be/src/modules/products/product.validation.js` to accept nullish/empty strings, updated `configureConversion` in `be/src/shared/utils/conversions.js` to fallback to smart defaults (`"Cập nhật quy cách thủ công"` / `"Khai báo khi tạo sản phẩm"`), updated `native-api.integration.test.js`, and added `be/test/product-conversion-validation.test.js`.
- **Intervention:** Edited.
- **Human changes:** User selected Option A (optional reference with auto-default per ERP standards), requested backend-first implementation, and reviewed test code assertions.
- **Files affected:** `be/src/modules/products/product.validation.js`, `be/src/shared/utils/conversions.js`, `be/test/product-conversion-validation.test.js`, `be/test/native-api.integration.test.js`, `be/docs/rtm.md`, `be/docs/ai-log.md`.
- **Validation:** `node --test be/test/product-conversion-validation.test.js` passed 7/7 tests; `npm test --prefix be` passed 103/103 tests (0 failed).

### 2026-11-09 — Optional verification reference in conversion APIs (UC-19, UC-22)

- **Work item:** Review and implement the requested backend plan for optional `verificationReference`.
- **Tool/model:** Codex (GPT-6 family).
- **Prompt summary:** Evaluate the proposed API change, apply the defaults for initial, updated, and lot-scoped conversions, and verify persistence.
- **Result used:** The create-product API and the create-conversion API accept omitted, null, and blank references. The service stores the trimmed custom value or chooses the default for the lot, existing product/UOM scope, or first product/UOM version. The Mongoose field remains required. Updated the API contract and added HTTP and database assertions.
- **Intervention:** Adopted.
- **Human changes:** The user chose the optional field and specified the three default values. The user requested this traceability update on 2026-11-10.
- **Files affected:** `src/modules/products/product.validation.js`, `src/shared/utils/conversions.js`, `test/native-api.integration.test.js`, `git_doc/docs/08_api/CONVERSIONS.md`, `git_doc/change_logs.md`, `docs/ai-log.md`, and `docs/rtm.md`.
- **Validation on 2026-11-09:** Native API integration suite passed 13/13 with `RUN_NATIVE_API_TESTS=1` on the local MongoDB replica set. The full BE suite passed 131 tests with 32 skipped and 0 failures with `RUN_NATIVE_API_TESTS=1` and `RUN_GOODS_RECEIPT_TESTS=1`. `npm run docs:check --prefix be` and `git diff --check` passed. Evidence covers the backend.
- **Recheck on 2026-11-10:** With both integration flags enabled, the full BE suite passed 138 tests, including the 7 conversion validation tests, with 32 skipped and 0 failures.

### 2026-11-09 — Governance documents and BE coverage gate

- **Work item:** Finalize the approved WMSD governance-document rules and add changed-line coverage CI.
- **Tool/model:** Codex AI (GPT-6 family; exact variant not surfaced).
- **Prompt summary:** Create paired governance documents, then apply the decisions made with the user; require 80% coverage on changed application-source lines using LCOV and diff-cover.
- **Result used:** Updated the BE governance documents and BE CI/package setup for `c8` LCOV and the PR coverage gate.
- **Intervention:** Edited.
- **Human changes:** The user chose the disclosure, data-handling, DoD, repository, RTM, quality-gate, test, and threat-model rules, including the 80% changed-line target.
- **Files affected:** `be/docs/*.md` (excluding the deferred release checklist), `be/package.json`, `be/package-lock.json`, `be/.github/workflows/ci.yml`, `be/.gitignore`.
- **Validation:** `npm run test:coverage` passed 96 tests; 62 database/service integration tests were skipped by their environment conditions. LCOV was generated. The local diff-cover command was not run because Python is not installed on this workstation.
