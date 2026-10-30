# Model changelog

Record future changes to model files here, including the date, affected models, and a concise description of the change. This log starts on 2026-10-28; it does not reconstruct earlier model history.

## 2026-10-30 — Iteration 1 master, lot, RR snapshot and audit history

- Product: version and optional tile metadata/dimensions; status index.
- ProductUomVersion: createdBy/verificationReference and current-version index.
- Party: version, supplier contact fields, cooperationStatus/statusReason and
  supplier status index.
- Lot: version/createdBy/notes/verification facts/identityLocked.
- Approval line: optional reason.
- BusinessOperation: optional result.workflowStatus/approvalId.
- AuditEvent: optional entityType/entityId/changes and entity history index.
- New append-only ReplenishmentSubmission collection
  (`replenishment_submissions`), unique per document/version.
- REPLENISHMENT line details: optional removedAt.
- Collection representation changes from 39 to 40.
- Migration: `npm run migrate:iteration-1` (dry-run default).

## 2026-10-29 — UC-35 / UC-36 relocation source and planning guard

- WAREHOUSE_TASK details add optional sourceBalanceId, sourceBalanceVersion and ownerPartyId. New UC-36 tasks always record them; existing tasks remain readable. No quantity or reservation is changed on creation.
- Location adds planningVersion (default 0) to serialize overlapping task planners. Existing rows acquire it on the first guarded write; no bulk migration or new collection/index is required. Future stocktake/task/posting writers must share this guard.
- API and verification contract: [location movements](../modules/location-movements/README.md).
