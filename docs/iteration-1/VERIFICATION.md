# Iteration 1 verification report

Date: 2026-10-30.  
Backend branch: `codex/uc-01-32-iteration-1`.  
No commit/push of implementation changes was performed.

## Environment

- Node `v26.3.0`.
- Local MongoDB replica set `rs0` at `127.0.0.1` for opt-in integration runs.
- Every integration suite used a unique random database name and dropped only
  that database.
- The Iteration 1 migration was exercised only against an isolated random test
  database. It was **not** applied to the shared/dev database.
- No frontend source was changed, so no FE typecheck/build was required.
- The backend has no `build` or `lint` script; `node --test` is the project test
  command.

## Commands and results

### Unit/non-database run

```bash
npm test
```

Result: **90 tests, 75 passed, 15 skipped, 0 failed**. The 15 skips are opt-in
MongoDB/live-provider tests when `MONGODB_TEST_URI` is absent.

### Full local replica-set run

```bash
MONGODB_TEST_URI="<local rs0 URI>" npm test
```

Result: **158 tests, 157 passed, 1 skipped, 0 failed**. The only remaining skip
is the pre-existing live Cloudinary smoke test that requires provider
credentials/assets outside this package.

Focused Iteration 1 suites also passed independently:

- `iteration1-foundation.test.js`
- `iteration1-master.integration.test.js`
- `iteration1-replenishment.integration.test.js`
- `iteration1-purchase-order.integration.test.js`
- `iteration1-migration.integration.test.js`

## Acceptance coverage

| Area | Covered behavior |
|---|---|
| Product | create/base conversion atomicity; SKU normalization and concurrent duplicate; metadata PUT/version/snapshot preservation; no-op and real status changes; future/current conversion; factor/whole-piece validation; conversion race; Owner-only policy; default target; policy conflict |
| Lot | Owner/Warehouse create; Warehouse update denial; duplicate identity; VERIFIED evidence; explicit UNKNOWN; future manufacture date; scoped list/detail; referenced identity lock; insufficient stock outside scope unavailable; source-document permission in movement history |
| Supplier | create ACTIVE by Accountant; Owner-only contact edit/status split; duplicate code race; contact update does not restore/alter status; TERMINATED→ACTIVE; no-op history; supplier-only query; PO/GR chain documents |
| RR | draft/direct submit; replay; changed action/payload conflict; update ID preservation/soft delete/new lineNo; lost assignment; submit snapshot; history versions; revision flow; partial approval; zero quantity; over-quantity; missing reduction reason; reject blocks edits; self-approval after role change; conversion drift; competing submit; competing review; old sourced RR read-only command; stock/ledger neutrality |
| PO | seed fully received PO; ordered 100/posted60 → outstanding40; draft GR ignored; partial reversal root/reversal net; custody not owned receipt; over receipt/broken chain/closed PO UNKNOWN; confirmed null; outstanding filter before pagination; scope and receiving projection; GET side-effect free |
| Migration | dry-run no writes; duplicate normalized identifiers abort; mandatory backup; product/party/lot changes; supplier state mapping; lot lock; no fake verification/snapshot; index creation; second apply no-op; conflict fails before write |
| Cross-cutting | active user/current role/revoked permission; ADMIN no bypass; strict unknown fields; JSON number quantities rejected; decimal normalization; warehouse scope; ObjectId validation; 1 MiB JSON limit; expectedVersion conflict details; idempotent replay/conflict |

## Stock/ledger neutrality

RR and master command tests snapshot and compare:

- `StockBalance`
- `PostingBatch`
- `StockMovement`
- `Reservation`
- `DemandSupplyAllocation`

No Iteration 1 command changed these collections. PO GET also passed the same
side-effect comparison.

## Explicitly not run / not claimed

- No frontend browser/UI verification: this package changes backend only.
- No live Cloudinary/upload smoke test (pre-existing test skipped).
- No migration apply to the shared/live database.
- No PO create/update/cancel/close, receiving/posting, notification/evaluate or
  source-RR creation commands, by scope.
- No production load/performance benchmark. PO list quantity derivation currently
  runs before pagination in the service to preserve outstanding-filter correctness;
  large datasets may require a future aggregation/materialized reader.
