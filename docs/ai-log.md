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
- **Files affected:** Replenishment validation and commands in `src/modules/replenishments/`, line and snapshot schemas in `src/models/`, [RR guard tests](../test/replenishment-guards.integration.test.js), [API contract](../git_doc/docs/08_api/REPLENISHMENT_COVERAGE.md), the VI/EN process and model documentation.
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
