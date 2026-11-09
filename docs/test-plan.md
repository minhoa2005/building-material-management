# Test Plan

**Status:** Approved project baseline — 2026-11-09. Repository CI enforces the changed-line coverage gate for pull requests.

## Test strategy

Choose test scope from the changed behavior and risk. Unit/component tests are the normal minimum for local logic and UI behavior. Use API/database integration tests for authorization, warehouse scope, transactions, inventory effects, persistence, and concurrency. Use end-to-end tests for critical user workflows where an E2E harness is available. Passing unit tests alone does not prove a cross-layer workflow.

Use synthetic fixtures only. Isolate integration data from shared or production databases. Record which checks ran, which could not run, why, and what the missing check leaves unverified. Link evidence to the UC in the repository's RTM.

## Changed-line coverage gate

- Require at least **80% line coverage of changed executable lines** in every pull request that changes application source under the repository's `src/**` tree.
- Ignore documentation, test files, configuration, scripts, lockfiles, and non-executable lines for this gate. PRs with no changed application-source lines have no coverage denominator.
- BE runs the Node test suite under `c8` and emits LCOV. FE runs Vitest with the V8 coverage provider and emits LCOV. `diff-cover` checks the LCOV report against `origin/main` with an 80% minimum.
- The CI checkout must include the PR base branch so the comparison is valid. Coverage output is generated under `coverage/` and is not committed.
- This is a changed-line threshold; there is no repository-wide percentage target. The required CI job blocks a PR below threshold; only a manual gate can be waived by the project owner, not the coverage check.

## Current repository test setup

- **BE:** CI runs `npm run docs:check` and Node tests. Database integration tests may require a MongoDB replica set and use isolated test databases where their module guidance specifies.
- **FE:** CI runs `pnpm build` and Vitest tests. Tests use Vitest, React Testing Library, and MSW. ESLint remains advisory.
- **Cross-repository:** For API/permission changes, verify the BE contract and FE consumer in their respective repositories; keep the two RTM evidence records separate.

## Evidence expectations

The CI result is the evidence for the automated gate. The author records relevant integration/manual scenarios in the PR or task and links them from the local RTM. Do not claim a test passed unless it ran and passed.
