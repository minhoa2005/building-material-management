# Definition of Done

**Status:** Approved project baseline — 2026-11-09.

A task is Done when its author has verified and recorded all applicable items below:

- The agreed acceptance criteria are met against the current approved requirement and business decisions.
- Authorization, warehouse/record scope, validation, state transitions, failure handling, and user feedback are addressed where relevant.
- Required checks for the changed behavior pass. Any check that could not run is named with its reason and residual risk; this note does not waive a required CI check.
- Relevant API, data, setup, and user-facing documentation and RTM entries are updated.
- Security/data-handling implications and release impact are considered; no known blocking issue is hidden by the Done status.
- The author performs a final self-review and records evidence. Independent peer review is not required by this project baseline.

## Repository-specific checks

- **BE:** Run applicable Node tests and `npm run docs:check`. Add DB/API integration checks when the changed behavior depends on database transactions, permissions, or persisted state; record when an external service or test database prevents them from running.
- **FE:** Run `pnpm build` and relevant Vitest tests. Confirm any changed API/permission behavior against the BE contract. `pnpm lint` remains advisory until the project changes that policy.
- **Cross-repository:** Keep BE/FE contracts and requirement identifiers consistent. Each repo records its own test evidence in its RTM.

## Review and exceptions

The task author may self-certify Done; no task requires a second reviewer under this DoD. A project owner may waive a manual checklist item by recording its scope, rationale, residual risk, and follow-up. This cannot waive a required CI check or bypass branch protection.
