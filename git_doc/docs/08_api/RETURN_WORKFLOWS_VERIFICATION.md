# Trungph return workflow verification

Updated 7 November 2026. These results are from the native-model port of Trungph's three iterations, on `codex/uc-63-71-defects-returns` after merging the fetched `main` in each repository.

## Backend

| Check | Result |
|---|---|
| `npm test` | 70 passed, 29 skipped, 0 failed (99 total). |
| `npm run test:returns` | 23 passed, 0 skipped, 0 failed. Runs against an isolated local replica set and random test database. |
| `RUN_NATIVE_API_TESTS=1 node --test test/native-api.integration.test.js` | 4 passed, 0 failed. |
| `npm run docs:check` | Passed: 3 instruction files identical, 59 collections, 649 local links, change-log signals present. |
| `git diff --check origin/main` | Passed for the branch's implementation changes. |

The return-specific run includes HTTP authentication and native DTO checks; defect execution and partial decisions; customer return claims, inspection, reassessment and custody; failed delivery source reopening; supplier-owned and store-owned handover; acknowledgement correction; historical evidence claims; replay, stale-version and quantity caps; freeze rollback; and whole-unit product rejection before claims or reservations.

## Frontend

| Check | Result |
|---|---|
| `npm run build` | Passed (`tsc --noEmit` and Vite production build). |
| Focused workflow and permission tests | 26 passed across 5 files. |
| `npm test` | 352 passed, 25 failed (377 total, 9 failing files). |

The full frontend suite is not green. A clean `main` baseline run also failed: 325 passed and 27 failed (352 total, 13 failing files). Current failures still include unrelated product-access, inventory, purchase-order and supplier-page suites; the focused return-workflow/mapping/permission test set passes. Keep the PR draft for review and triage the broader suite failures before treating the branch as merge-ready.

## Scope limits

- No Atlas write, reseed, migration, index creation or connection change was performed.
- No real browser upload against Cloudinary was exercised by these automated checks.
- Existing records with missing warehouse scope and ambiguous multi-balance holds fail closed; this implementation does not guess or backfill them.
- Broader D07/D08 decisions for new sales-order verification remain open. The user-approved Accountant-with-evidence rule applies only to historical delivery source verification for customer returns.
