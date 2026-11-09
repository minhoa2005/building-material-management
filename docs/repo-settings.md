# Repository Settings

**Status:** Approved target policy — 2026-11-09. This file documents intended settings; it does not itself change GitHub settings.

## Required policy for `main`

- Require all changes to enter `main` through a pull request.
- Require the repository's `check` CI job to pass before merge. No approval from a second reviewer is required by this project baseline.
- Disallow force-push and branch deletion on `main`. Do not allow administrator or maintainer bypass of the required PR/CI rules.
- Keep GitHub Actions permissions at least privilege. Workflows use read-only repository contents unless a separately approved task requires more.
- Pin third-party actions by full commit SHA and disable persisted checkout credentials unless a workflow explicitly needs write access.
- Keep secrets in approved GitHub environment/repository secrets or local secret storage. Never put credentials in source, workflow text, artifacts, logs, or client-side bundles.

## Repository-specific required CI

| Repository | Required `check` job contents | Advisory checks |
| --- | --- | --- |
| BE | Documentation check, Node tests, and the changed-line coverage gate | None currently identified |
| FE | Production build/type-check, Vitest tests, and the changed-line coverage gate | ESLint remains advisory (`continue-on-error`) |

## Observed configuration and open verification

The checked-in workflows run for pull requests targeting `main`, pushes to `main`, and manual dispatch. They use read-only `contents` permissions, pinned action SHAs, and `persist-credentials: false`. The actual GitHub branch protection/ruleset, membership, CODEOWNERS, and secret/environment configuration were not inspected here. An administrator must apply and verify the target rules above in GitHub Settings; until then, this document is the desired policy, not proof the settings are active.
