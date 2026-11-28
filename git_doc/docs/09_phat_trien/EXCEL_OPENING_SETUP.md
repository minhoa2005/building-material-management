# Excel and opening-stock setup

16 November 2026, updated 27 November 2026. Source: [API contract](../08_api/EXCEL_AND_OPENING_STOCK.md).

## 27/11/2026 — partial opening stock

The backend now allows several opening documents per warehouse until it is closed. Before deploying this backend on a database that ran the earlier setup, run the setup again (preview, then `--apply`). It now:

- drops the unique index `opening_stock_file_import_once` (it would refuse the second POSTED document of a warehouse);
- still drops the older `header.warehouseId_1` index when present;
- backfills `warehouses.openingCutoffAt` with the earliest `header.openingAt` of the warehouse's POSTED opening documents, for warehouses without a cut-off;
- keeps the Owner-only grants and updates the `opening_stock:post` description to "Chủ cửa hàng xác nhận ghi tồn đầu kỳ và chốt kho".

The dry run reports `dropFileImportOnceIndex` and `cutoffBackfillWarehouses`. The duplicate-posting check was removed because duplicates are now valid. The same steps exist in `../setup-opening-stock-remote.mongosh.js`. It was **not** run on Atlas or on a local application database in this task; only the isolated test database below was used. Warehouses already initialized by the earlier version are not closed automatically: the Owner closes each one on the opening screen (or via `POST /api/opening-stocks/warehouses/:id/close`) once the counts are complete. Seed `tile-shop.js` sets the cut-off and closed state on demo warehouses that have a POSTED opening document.

The sections below describe the 16/11 setup; their statements about the file-import uniqueness index are history.

Frontend checkout for this task: `review-latest-fe`, branch `codex/excel-opening-stock`. Backend: `review-latest-be`, same branch name in the separate repository. Both branches started from the fetched main tips. Install frontend dependencies with `pnpm install --frozen-lockfile`; ExcelJS 4.4.0 is dynamically loaded for import/export. Backend has no new runtime dependency.

## Atlas or existing remote database

17 November 2026: user explicitly requested Atlas support and enabling the configured database. The setup command now loads `MONGODB_URI` from the backend environment or `.env`; do not paste credentials into commands or Git. From the backend directory:

```powershell
node scripts/setup-opening-stock.mjs --allow-remote
node scripts/setup-opening-stock.mjs --allow-remote --apply
```

The first command previews; the second installs only opening-stock permissions, Owner grants, the file-import uniqueness index and missing technical warehouse counters. It does not seed business records or change stock quantities. A database name must be explicit in the URI; admin/local/config databases are refused. The same commands support Atlas SRV and standard MongoDB connection strings. Remote targets require `--allow-remote`. After applying, sign out and back in to refresh session permissions; use the current frontend/backend containing the opening-stock routes.

Applied to the configured Atlas database `sep490` on 17 November 2026 under the user's explicit request. Read-back confirmed three permission records, all Owner roles granted, zero non-Owner opening-stock grants and the unique file-import index. No credentials are recorded here. This is setup verification, not an authenticated browser import/posting test.

## Existing local database

Use the actual local application database name. The following example uses a placeholder; it is not a database changed during this task.

```powershell
node scripts/setup-opening-stock.mjs 'mongodb://127.0.0.1:27017/YOUR_LOCAL_DATABASE?replicaSet=rs0'
node scripts/setup-opening-stock.mjs 'mongodb://127.0.0.1:27017/YOUR_LOCAL_DATABASE?replicaSet=rs0' --apply
```

The first command previews setup. The second adds only the three opening-stock permissions, their Owner-only grants, a unique index for POSTED file imports, and a zero technical stock-operation counter on warehouses missing it. Opening-stock grants are explicitly removed from all non-Owner roles, including old Warehouse or custom-role grants. All unrelated permissions/grants and business data remain intact. Re-run this setup for a local database that installed the earlier opening-stock version; it replaces that feature's broader POSTED-warehouse index after validating file-import duplicates. Historical opening records do not block index installation. Without `--allow-remote`, it refuses non-loopback URIs; duplicate/unscoped posted file imports are always refused. Restart the application and sign in again to refresh the session's frontend permissions. Do not use a full permission reseed to install this feature.

Configure the existing frontend API URL and proxy for the chosen local backend. The normal project port is 3334; backend is normally 3000. The implementation's browser verification uses isolated ports and synthetic users instead of the application's production connection.

Set the warehouse length, width and clear height before importing stock. Keep the required categories and base units active. Draft creation creates the opening-stock receiving location when needed. Configure storage areas for BF03 after posting. Only Owner can use opening stock and confirm their own draft. Each warehouse can be initialized once, including by posting an empty opening. The current frontend template requires the update described in the [API contract](../08_api/EXCEL_AND_OPENING_STOCK.md#file-and-payload).

## Isolated automated verification

`test/opening-stock.test.js` uses an isolated `opening_test_<ObjectId>` database and checks its name before cleanup. It connects to `127.0.0.1:27119` on replica set `opening-test` by default. Set `MONGODB_TEST_PORT=27017` and `MONGODB_TEST_REPLICA_SET=rs0` to use the local development replica set when available.

```powershell
$env:RUN_OPENING_TESTS='1'; $env:MONGODB_TEST_PORT='27017'; $env:MONGODB_TEST_REPLICA_SET='rs0'
node --test test/opening-stock.test.js test/product-import.test.js test/product-lookup.test.js test/opening-stock-setup.test.js test/refactor-regression.integration.test.js
```

27/11/2026: run with the local `rs0` replica set on `127.0.0.1:27017` (isolated `opening_test_*` databases, dropped afterwards): 10 passed, 1 skipped (the MongoDB part of `refactor-regression`, which needs its own flag). `npm test`: 473 tests, 326 passed, 0 failed, 147 skipped. `product-import.test.js` uses the same flag and also imports 1,000 products in bulk.

Start a dedicated local MongoDB replica set on that port before running the integration test. Without the flag, unit validation runs and the integration case reports skipped. Frontend verification commands:

```powershell
pnpm test src/features/opening-stock/OpeningStockPage.test.tsx src/app/routeAccess.test.ts src/shared/lib/excel.test.ts src/shared/components/ExcelExportButton.test.tsx src/features/opening-stock/file.test.ts src/features/stocktakes/live.test.tsx src/features/operational-reports/live.test.ts
pnpm typecheck
pnpm build
```

Run `npm run docs:check` in the backend. Keep the difference between isolated transaction tests, component tests and real browser checks explicit in verification notes. Existing project-wide lint/test/UI-script failures are not evidence that the new flow was deployed.
