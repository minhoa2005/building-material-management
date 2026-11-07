# Iteration 1 migration guide

Migration ID: `iteration-1-master-data`  
Entry point: `src/migrations/iteration-1.js`  
CLI: `src/migrations/run-iteration-1.js`  
Package script: `npm run migrate:iteration-1`

The migration is **dry-run by default**. It must not be applied to a shared or
production database without the owner's explicit request.

## What it changes

Data transaction:

1. Product missing `version` gets `1`.
2. Party missing `version` gets `1`.
3. SUPPLIER missing `cooperationStatus` maps:
   - `isActive === false` -> `SUSPENDED`;
   - otherwise -> `ACTIVE`.
   - The migration never invents `TERMINATED`.
4. Lot missing `version` gets `1`; missing `identityLocked` gets `false`.
5. A lot referenced by any DocumentLine or StockBalance gets `identityLocked=true`.
6. No other Lot identity/status is changed.

It does **not**:

- Backfill `verifiedBy`, `verifiedAt` or verification references.
- Backfill ProductUomVersion createdBy/reference.
- Fabricate RR submission snapshots.
- Normalize existing codes by rewriting them.
- Drop collections, databases or indexes.
- Run `syncIndexes` or seed demo data.
- Change stock, ledger, approval, operation or document workflow rows.

## Preflight

The planner reads raw BSON and reports:

- Counts by changed collection.
- Planned index definitions.
- SKU duplicates after trim+uppercase.
- Party code duplicates after trim+uppercase.

Any duplicate normalized identifier aborts the plan and apply. Records are listed
by ID; the migration does not choose a winner. An operator must resolve those
records first.

## Dry run

```bash
npm run migrate:iteration-1
# or explicitly
npm run migrate:iteration-1 -- --dry-run
```

No collection/index/data writes occur. Exit non-zero for duplicate identifiers,
invalid arguments or connection failure.

## Apply

```bash
npm run migrate:iteration-1 -- --apply
```

Apply performs these steps:

1. Require a replica set/Atlas (`hello.setName` or `isdbgrid`).
2. Re-run the plan to reject invalid/ambiguous data before backup.
3. Write a BSON Extended JSON backup outside Git under
   `~/.codex/backups/<database>-<migration>-<timestamp>-<id>/`.
4. Create/ensure the 40 model collections and indexes. Index construction is
   deliberately separate from the data transaction and is never dropped here.
5. Open a transaction with snapshot reads and majority writes.
6. Re-plan inside the transaction, apply only the reported `$set` fields, and
   verify that a second plan is a no-op.
7. Abort/rollback data changes if verification fails.

Indexes are DDL-like: if index creation succeeds but the later data transaction
fails, already-created indexes are not removed by the transaction. Restore/review
is required; the migration does not pretend index creation is transactional with
data.

## Idempotency

Running apply again after a successful run:

- Creates no additional indexes beyond already-existing definitions.
- Reports `updatedRecords: {}`.
- Still produces a backup because apply always requires a pre-write backup.
- Does not create snapshots, stock, approvals or permissions.

## Conflict handling

Duplicate normalized SKU/code example:

```text
Duplicate normalized master identifiers require manual resolution:
{"skuDuplicates":[{"normalized":"ABC","ids":["...","..."]}],"codeDuplicates":[]}
```

Stop, inspect both records and any references, decide outside the migration which
identifier remains, then rerun. Do not edit the migration to auto-pick a record.

## Validation reference

`test/iteration1-foundation.test.js` covers dry-run planning, supplier mapping,
lot lock planning and duplicate rejection.

`test/iteration1-migration.integration.test.js` covers, on an isolated random
replica-set database:

- preview does not write;
- mandatory backup;
- product/party/lot updates;
- no fabricated verification/snapshot rows;
- index creation;
- idempotent second apply;
- duplicate rejection before backup/write;
- unrelated data preservation.
