# AI Assistance Log

**Status:** Approved project baseline — 2026-11-09. Entries in this file are for BE work only; FE maintains its own log in `fe/docs/ai-log.md`.

## When to log

Add an entry when AI makes a material contribution to code, tests, requirements/design analysis, business rules, security analysis, or project documentation. Routine lookup, brainstorming that is not used, and minor wording/formatting assistance do not require an entry.

## What to record

Use a concise, sanitized summary. Do not store a full conversation transcript. Never include Sensitive or Secret information; only Public or Internal information may be submitted to an AI tool.

Each entry records the date, work item, tool/model when known, prompt summary, result used, intervention label, human changes, affected files, and validation performed. The author records validation accurately, including checks not run and their reason.

Use one intervention label:

- **Adopted** — used the AI output with no material change.
- **Edited** — used it after limited changes.
- **Rewritten** — used it as a starting point but substantially changed it.
- **Rejected** — did not use the output.

## Entry template

```text
Date:
Work item / change:
Tool and model (if known):
Prompt summary (sanitized):
Result used:
Intervention: Adopted | Edited | Rewritten | Rejected
Human changes / reason for rejection:
Files affected:
Validation performed / not performed:
```

## Log entries

### 2026-11-09 — Governance documents and BE coverage gate

- **Work item:** Finalize the approved WMSD governance-document rules and add changed-line coverage CI.
- **Tool/model:** Codex AI (GPT-6 family; exact variant not surfaced).
- **Prompt summary:** Create paired governance documents, then apply the decisions made with the user; require 80% coverage on changed application-source lines using LCOV and diff-cover.
- **Result used:** Updated the BE governance documents and BE CI/package setup for `c8` LCOV and the PR coverage gate.
- **Intervention:** Edited.
- **Human changes:** The user chose the disclosure, data-handling, DoD, repository, RTM, quality-gate, test, and threat-model rules, including the 80% changed-line target.
- **Files affected:** `be/docs/*.md` (excluding the deferred release checklist), `be/package.json`, `be/package-lock.json`, `be/.github/workflows/ci.yml`, `be/.gitignore`.
- **Validation:** `npm run test:coverage` passed 96 tests; 62 database/service integration tests were skipped by their environment conditions. LCOV was generated. The local diff-cover command was not run because Python is not installed on this workstation.
