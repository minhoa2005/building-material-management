# Model changelog

## 2026-11-05 — promoted reviewed registry and local Compass database

- Promoted the approved 74-collection registry through `src/models/index.js` as `registerReviewedModels(connection)`. Legacy API modules now import explicitly from `src/models/legacy/index.js`, keeping the two schema profiles from sharing a connection.
- Removed the `_db_rebuild` marker and marker-based startup guard. Seed and verification now inspect only the registered business collections.
- Changed the local target to `mongodb://localhost:27017/wmsd_demo_tile_shop`. The synthetic tile-shop dataset was verified there with 74 collections and 851 records. Standalone MongoDB can seed/read the demo; transactional API commands still require a replica set or Atlas.

## 2026-11-05 — shared reviewed-model documentation and shop seed

- Centralized the approved design, field dictionary, diagrams and migration/local guidance under git_doc. MODEL_MAP covers all 74 collections and PROJECT_GUIDE explains the legacy/reviewed registry boundary.
- Root AGENTS.md, CLAUDE.md and GEMINI.md now require corresponding documentation updates in the same task as model or project changes. The module READMEs point to the canonical documents.
- The reviewed schemas are exercised by the new local tile-shop seed, including carton/lot identity, packaging snapshots, opening-stock ledger and physical stack reconciliation. Detailed changes and verification are in git_doc/change_logs.md.

## 2026-11-03 — reviewed schemas and synthetic demo

- Replaced the reused support schemas in the reviewed registry: reservations/expected supply, decisions/evidence, return inspections/claims, delivery reopening/commitment changes/cancellations, holds, stocktake snapshots/counts/lock history, notifications/audits/events and operation/concurrency records.
- Added reviewed workflow header/item fields, including frozen sale prices, source references, warehouse tasks, inspection/ownership, stocktake resolution and posting information. Fixed extensions on embedded item discriminators. Migration and reviewed profiles require separate connections.
- Added isolated wmsd_demo_v2 seeding with approved synthetic values, BF03/BF04 examples, multiple dispatch/receipt records, a two-dispatch invoice, recount history, capacity examples and a custom role. Preserved old databases and the current application URI.
- Added cross-document/quantity/capacity/permission checks, idempotent apply, canonical BSON fingerprinting and 17 focused tests (27 including prior migration tests). Legacy API migration remains pending; current API cannot use the demo schema yet.

## 2026-11-02 — isolated DB rebuild

- Added the public registerRebuildModels factory with 74 target schemas, explicit collection names and readable model names. Reuses existing typed workflow details while introducing embedded items, explicit source references, handovers, inline unit conversion, split party catalogues, typed stock ownership, warehouse dimensions, stacks and accepted-quantity invoices.
- Added native-driver snapshot migration, backup, source/reference/quantity reconciliation and post-write verification. Applied to sep490_rebuild_20261102 and retained sep490 as the application database.
- The rebuilt database remains REVIEW_REQUIRED. Missing source values and incomplete runtime/field mappings are listed in src/models/rebuild/README.md. D07/D08 retain existing schemas pending their business decision.
- Added migration regressions and a pre-connection guard against starting the legacy API or seeder on the rebuilt/backup database.

Record future changes to model files here, including the date, affected models, and a concise description of the change. This log starts on 2026-10-28; it does not reconstruct earlier model history.

## 2026-10-29 — UC-35 / UC-36 relocation source and planning guard

- WAREHOUSE_TASK details add optional sourceBalanceId, sourceBalanceVersion and ownerPartyId. New UC-36 tasks always record them; existing tasks remain readable. No quantity or reservation is changed on creation.
- Location adds planningVersion (default 0) to serialize overlapping task planners. Existing rows acquire it on the first guarded write; no bulk migration or new collection/index is required. Future stocktake/task/posting writers must share this guard.
- API and verification contract: [location movements](../modules/location-movements/README.md).

## 2026-10-30 — BF04 internal requirements

Added INTERNAL_TRANSFER_REQUIREMENT with warehouse, source document and PICK/PUTAWAY kind.
Added TRANSFER_OUTBOUND line details linking TR line, source balance and staging bin.
TRANSFER_RECEIPT optionally stores destination balance and receiving location;
TRANSFER_REQUEST optionally stores approvedVersion so read projections retain the
approved quantity after closure. Existing records remain valid. No production data migration was run.
