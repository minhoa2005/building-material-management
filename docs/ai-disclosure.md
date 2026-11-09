# AI Use Disclosure

**Status:** Approved project baseline — 2026-11-09.

## Audience and purpose

This disclosure is for the WMSD project team and its evaluators. It describes the project's general use of AI assistance; it is not a per-pull-request or per-code-fragment label.

## Project disclosure

AI tools may assist with software development, tests, and project documentation. People remain responsible for deciding requirements, checking generated material against approved project sources, verifying behavior, and approving project outcomes. AI output does not approve a business or security decision and is not evidence that code or tests work until independently checked.

Material AI contributions are recorded in the repository-specific `ai-log.md`. The disclosure does not list individual tools or models; the log records a tool/model when known.

## Data boundary

Only Public or Internal information may be included in AI prompts. Sensitive and Secret information—including identifiable real business data, private evidence, credentials, and database exports—must not be submitted. See `data-handling.md` for the project classifications.

## Backend repository notes

AI assistance may apply to API, model, permission, inventory behavior, test, and documentation work. Backend changes must still be checked against approved business decisions and current runtime behavior.

## Frontend repository notes

AI assistance may apply to UI, API-contract integration, permission presentation, tests, and documentation. Frontend behavior must still be checked against the current backend contract; the backend remains the authorization boundary.
