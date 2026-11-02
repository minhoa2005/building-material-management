# Replenishment request backend — UC-01–UC-06

This module reads and writes `BusinessDocument` / `DocumentLine` REPLENISHMENT
discriminators. It never changes stock, reservations, allocations, posting batches,
stock movements, approvals of other kinds, notifications or POs.

Full wire contract: [Iteration 1 API reference](../../../docs/api/iteration-1/README.md).

## Routes

| Method/path | Permission | Notes |
|---|---|---|
| GET `/api/replenishments` | read | scoped list, max 3 current-line preview |
| GET `/api/replenishments/options?mode=CREATE|FILTER` | create/update or read | warehouse lookup only |
| POST `/api/replenishments` | create | SAVE_DRAFT or direct SUBMIT |
| GET `/api/replenishments/:id` | read | current lines, approvals, live stock, submission summary |
| PUT `/api/replenishments/:id` | update | creator edits DRAFT/REVISION_REQUIRED |
| POST `/:id/submit` | update | saved RR submit + snapshot |
| POST `/:id/review` | approve | Owner decision |
| GET `/:id/submissions` | read | paged snapshots, newest version first |
| GET `/:id/submissions/:version` | read | immutable snapshot + approval; unavailable when historical data is missing |

Routes are declared before `/:id` where needed. Validation is strict, quantities are
decimal strings and dates are Asia/Saigon calendar dates on the wire.

## Scope

- Owner reads/reviews all warehouses.
- Accountant reads assigned warehouses.
- Sales/Warehouse read only their own records in assigned warehouses.
- RR write is creator-only, with the current Warehouse/Sales role and permission;
  the current/new warehouse must be active and assigned.
- Review requires a different userId from both `createdBy` and submittedBy, even
  after a role change.

## Manual form

- Every new line has `triggerType=MANUAL_OTHER` and a nonblank reason.
- One to 100 current lines.
- Product must be active; selected conversion must be the current version for the
  same product/UOM; quantity is calculated exactly and whole-piece output must be
  integral.
- A RR may include a product above minimum; no shortage/coverage check is made.
- New source/SO/stocktake RR creation is not part of this iteration.

## State, version and history

```text
DRAFT -> SUBMITTED -> APPROVED | REJECTED | REVISION_REQUIRED
REVISION_REQUIRED -> (edit) REVISION_REQUIRED -> SUBMITTED
```

- Create v1; edit/submit increment version; review does not.
- Only DRAFT/REVISION_REQUIRED can be edited/submitted.
- Omitted current lines are soft-deleted via `details.removedAt`; IDs are never
  reused and a new line number exceeds all historical line numbers.
- Submit stores an immutable ReplenishmentSubmission for that exact version with
  warehouse/product/UOM/conversion/quantity/reason snapshots.
- Review uses that snapshot, not current conversions/stock; a partial approval keeps
  requested and approved quantities separately.
- Approval lines use approvedQty>0 => APPROVE, 0 => REJECT; per-line reason is
  required if reduced/zero. All-zero approval is rejected; use REJECT instead.

## Transactions and idempotency

RR commands write document/lines, snapshot when submitting, approval when reviewing,
BusinessOperation and AuditEvent under one MongoDB transaction
(`snapshot` read concern, `majority` write concern). No parallel operations run in
the transaction.

- `creationKey` is unique per creator; same payload replays the committed receipt,
  changed payload/action conflicts.
- Existing-document commands hash `operationKey` per actor and compare a canonical
  payload (action, actor, target, expectedVersion, ordered line business fields).
- Replay is checked before expectedVersion, so a lost-response retry returns the
  previous result. A changed payload uses a new key.
- Conditional document filters include `_id`, state, version and creator.

## Read behavior

List filters intersect role scope; removed lines are excluded from count/preview.
Detail returns:

- current line snapshots and approved quantity only from the APPROVE decision for
  the current version;
- live availability as an independent reference;
- approval history and submission count/history availability.

A sourced historical RR remains readable and keeps source links; manual commands
on its current non-MANUAL_OTHER lines return `ERR-RR-409-003`. It is never converted
to manual. Missing historical submission snapshots return `available=false`; the
reader does not invent history from current data.

## Tests

- `test/replenishment.test.js`
- `test/replenishment-read.test.js`
- `test/replenishment-read.integration.test.js`
- `test/iteration1-replenishment.integration.test.js`
- `test/iteration1-foundation.test.js`
