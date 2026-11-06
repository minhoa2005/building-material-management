# DB rebuild

The approved design lives in `E:/Doan/docs_doan/docs/03_thiet_ke/DB_Rebuild_Review`.

**Current development target: localhost first.** Use
`mongodb://127.0.0.1:27018/wmsd_demo_v2?replicaSet=wmsd-local` in Compass.
Run `npm run db:local:start`, `npm run db:local:seed`, and `npm run db:local:verify`.
The separate instance does not change the existing MongoDB service on port 27017.
[Local setup, commands and runtime limitations](MONGODB_LOCAL.md).
Remote demo writes now require an explicit `--allow-remote` flag; local commands
always override the target URI with the loopback-only instance.

This package supports both an isolated migration copy and a new synthetic demo.
The application still uses the original model registry. Switching the application's
connection string to the rebuilt copy is blocked until its services are ported.

Import `registerRebuildModels` from the public model entry point and supply a fresh
Mongoose connection. The returned Map is keyed by collection name. Model names
are readable, including PurchaseOrder, ProductBatch, InventoryBalance and TransferOrder.
Registration disables automatic collection/index creation.

The implemented storage conversion includes the following.

- Separate collections for each document kind, with stable item IDs embedded in
  `items`. Document and item sources carry the target collection and original IDs.
- Transfer handovers embedded in their dispatch, including their item/source IDs.
  Sales handovers use the same embedding under the goods issue.
- Separate customers, suppliers and internal delivery teams. Stock ownership uses
  STORE with null ownerId, CUSTOMER or SUPPLIER with the corresponding ID.
- Product base units and historical line conversion snapshots. The converted DB
  has no UOM or UOM-version collections.
- Readable names for stock holding points, balances, transactions and business
  history. Existing histories retain their original IDs and timestamps.
- Warehouse/location dimensions, stacks, stack contents, product manufacturer
  keys, custom-role fields, and accepted-quantity invoice schemas.
- D07/D08 remain in their existing external-reference collections pending a
  decision by the responsible business owner.

The reviewed registry now includes the new reservation/allocation counters,
versioned decisions, evidence metadata, return claims/inspections, count attempts,
historical location locks and support/event schemas. Reviewed workflow extensions
add decision, receipt, pricing, posting, ownership and source information to the
existing typed headers/items. Embedded discriminator fields are extended as well.
The separate registerMigrationModels profile preserves the old snapshot conversion
contract; use a separate connection for each profile.

Application services still use the legacy registry. The new data is validated
offline and after writing, but transactional capacity, authorization and allowance
checks must also be ported to the runtime services before switching the API.
D07/D08 have not acquired a new business approval rule. The design review and the
running application are separate milestones.

## New synthetic database — 3 November 2026

The user confirmed that the existing data is test data and requested a fresh set.
The completed database is **wmsd_demo_v2**, on the deployment configured by the
backend's existing MONGODB_URI. It contains 74 data collections, 511 records,
79 business documents including embedded handovers, 79 embedded items and 15
inventory balances. `_db_rebuild` is a separate control collection.

Examples cover purchasing, BF03 relocation, a TR split into two dispatches,
multiple receipts for another dispatch, picking/putaway requirements and TOs,
sales and a final invoice containing two dispatch dates, failed delivery and
replacement commitments, customer/supplier returns, custody, defects and counts.
There is a custom-role example and a recount preserving the previous attempt.
Prices, phone numbers, dimensions and evidence are explicitly synthetic.

The seeder validates schema/references, complete stock movement chains, approvals,
reservation quantities, transfer quantities, bin capacity and invoiced accepted
quantities. All collections/indexes are prepared explicitly; records and completion
marker are written in one transaction. Rerunning verifies an identical stored
database without inserting again; an occupied unmarked or modified target is refused.
BSON fingerprints ignore object-field order while preserving values and array order.
Demo notification emails are SKIPPED and demo event jobs are already COMPLETED.

```powershell
npm run db:demo
npm run db:local:seed
npm run db:local:verify
npm run test:db-rebuild
npm run test:db:local
```

Preview runs without a MongoDB connection. Apply and verify use the current URI
but select the separate database explicitly. MONGODB_URI is not changed.
The current API remains blocked from connecting to this database until ported.

User guide: `E:/Doan/outputs/db_rebuild/HUONG_DAN_DB_MOI.md`.
Live verification: `E:/Doan/outputs/db_rebuild/demo_verified_20261103.json`.
Synthetic PNG evidence: `E:/Doan/outputs/db_rebuild/demo-fixtures`.
The 27 migration/demo regression tests pass. The most recent full-suite run still
has the pre-existing module-loading failures and legacy fixture coverage failure;
it is not a successful API regression. See `tests_20261103.txt` in that output folder.

## Earlier migration copy — retained for reference

Migration commands, run from the backend root, use MONGODB_URI without logging it.

```powershell
npm run db:rebuild -- --report E:/Doan/outputs/db_rebuild/preview-new.json
npm run db:rebuild -- --apply --target sep490_rebuild_NEXT --report E:/Doan/outputs/db_rebuild/apply-new.json
npm run db:rebuild -- --verify --target sep490_rebuild_20261102 --report E:/Doan/outputs/db_rebuild/verify-new.json
npm run test:db-rebuild
```

Apply requires a new target database named after the source with a `_rebuild_`
suffix. It first copies the source data, collection options and indexes to a
separate backup on the same MongoDB deployment. The source read uses a snapshot
transaction. The migration verifies the stored backup before preparing the target,
rejects source changes during the backup, and writes all target records in one
transaction. Only the completed target is marked REVIEW_REQUIRED. A failed run
can leave empty collections with a PREPARING marker. An occupied target is refused
on retry, and a completed target can be checked with --verify.

The runner checks document/item identities, all source links, typed references,
per-balance quantities and each stock movement's arithmetic. Stored BSON is
fingerprinted after writing. Missing source values are reported with IDs and field
names. Price, manufacturer, customer contact and measured capacity values are not
invented. The final source comparison detects writes occurring during migration.
A later cutover still requires a fresh snapshot or a write pause to avoid stale data.

The migration and backup are explicitly marked as unusable by the current API
and seed command. Their schema marker is checked through the native driver before
Mongoose can auto-create old collections. The default MONGODB_URI is not changed.
The database marker is migration control metadata, not an additional business entity.

On 2 November 2026, the source was sep490. The verified target is
sep490_rebuild_20261102, with 74 data collections plus one migration-control
collection. Its backup is sep490_rebuild_20261102_backup. Verification preserved
51 documents (one handover embedded), 50 items, 40 document links, 38 item links
and all 11 balances.

The latest verification report is
`E:/Doan/outputs/db_rebuild/verified_20261102.json`.
It identifies 24 data follow-ups and 10 records failing the new schema, including
missing prices, manufacturer codes, customer phone and legacy header information.

The migration regression tests pass. The full repository test run currently has
72 passes, 10 failures and 6 skips. Nine failing test files load incomplete
replenishment dependencies from main, including a missing
`src/shared/utils/domain.js`. Another test expects the demo fixture to cover
INTERNAL_TRANSFER_REQUIREMENT, which that fixture does not yet contain.
These failures prevent claiming a successful full API regression or cutover.
