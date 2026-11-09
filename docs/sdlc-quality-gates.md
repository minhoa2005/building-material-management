# SDLC Quality Gates

**Status:** Approved project baseline — 2026-11-09.

Use lightweight, risk-based checklists. The task author records evidence and self-confirms each gate; this project does not require a formal approver at every stage.

| Stage | Gate evidence | Result |
| --- | --- | --- |
| Requirements | Scope, actors, acceptance criteria, source decision, and unresolved dependencies are recorded. Material unapproved business decisions block dependent work. | Pass / Defer / Block |
| Design | Relevant data/API/permission/security impacts, FE/BE compatibility, and migration or rollback needs are identified. | Pass / Defer / Block |
| Implementation | Definition of Done is met; required docs and RTM entries are updated; no unreviewed AI output is treated as evidence. | Pass / Defer / Block |
| Verification | Required repository CI checks pass; risk-appropriate tests and evidence are recorded. The PR coverage gate applies to changed application-source lines. | Pass / Defer / Block |
| Release | Release readiness and operational checks are recorded when the release checklist is finalized. This gate's detailed procedure is pending. | Pass / Defer / Block |

## Exceptions

A project owner may waive a manual checklist item only. Record the waived item, scope, rationale, residual risk, owner, and follow-up. An exception never waives required CI, changes branch protection, or permits bypassing a required check. Required CI failures block merge.

## Repository notes

- BE verification includes `npm run docs:check`, Node tests, and the changed-line coverage gate; use DB/API integration tests when the behavior requires them.
- FE verification includes `pnpm build`, Vitest tests, and the changed-line coverage gate. Lint is advisory.
- Cross-repository changes must pass the required checks in each affected repository and retain compatible API/permission contracts.
