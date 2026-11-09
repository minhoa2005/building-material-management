# WMSD — Shared agent instructions

This file must be byte-for-byte identical to AGENTS.md, CLAUDE.md and GEMINI.md at the repository root. When changing one, update all three in the same task.

## Read before work

1. Read [context.md](context.md) and [git_doc/PROJECT_GUIDE.md](git_doc/PROJECT_GUIDE.md).
2. Read [git_doc/MODEL_MAP.md](git_doc/MODEL_MAP.md), the relevant approved review sheets and the exact source/test files for the task.
3. Read [git_doc/DOCUMENTATION_RULES.md](git_doc/DOCUMENTATION_RULES.md). The documentation index is [git_doc/README.md](git_doc/README.md).
4. When changing an API/DTO/permission contract consumed by the frontend, inspect its context and consumer too. The paired local checkout is `../fe`; on another machine locate the actual FE checkout rather than assuming a broken path.

## Authority and scope

The latest explicit user decision overrides older project documents. Approved DB review sheets are the business authority for the redesigned database. Code proves implementation state, not a new business decision. Old reports/context/SQL diagrams remain dated reference where superseded. Historical CR source verification by Accountant with uploaded evidence was confirmed on 2026-11-07; see git_doc/docs/08_api/RETURN_WORKFLOWS_NATIVE.md. Broader D07/D08 new-SO external-source decisions remain pending. Ask before implementing an unresolved business choice or an unapproved table/relationship redesign; continue independent approved work.

## Model and runtime boundaries

- Each current collection schema lives in its own `src/models/<name>.model.js`; each nested schema lives in its own `src/models/<name>.schema.js`. Keep one schema per file. Do not restore aggregate reviewed builders.

- `src/models/index.js` registers the current 58-collection model set through `registerModels(connection)`. `runtime.js` exports these models for API services; `registerReviewedModels` is a compatibility alias for the same registry.
- The legacy, rebuild and embedded model directories were removed by explicit user approval on 2026-11-06. Do not restore them or generic BusinessDocument/DocumentLine persistence. Read the current native API contract in `git_doc/docs/08_api/NATIVE_MODEL_RUNTIME.md`.
- Use Warehouse Staff terminology. Users have one role and multiple assigned warehouses. Admin may create roles and select existing permissions. Enforce permission plus warehouse, record, state, version and identity constraints.
- Each carton contains one product from one batch. Store base units on products and historical conversion/packaging on embedded document items. Product.baseUnit stores a Uom code. The 09/11 decision adds Conversion for versioned factors by product and optional batch. Keep historical factors and packaging on the document item.
- Preserve stable item IDs, source chains, quality/ownership, exact decimals, reservations, capacity, inventory history, idempotency and approved separation of duties. Full rules and BF03/BF04 are in PROJECT_GUIDE.
- Keep Node ESM/module structure and existing file style. Validate payloads and scope server-side. Model refs are not database foreign-key checks. Schema validation is not proof of API transactions.

## Mandatory documentation updates with every relevant change

Whenever code changes models, fields, relationships, indexes, APIs, permissions, business rules, workflow states, stock effects, seed/migration, configuration or setup commands, the agent MUST automatically update the corresponding current documentation in `git_doc` during the same task, before reporting completion. Do not wait for the user to request documentation and do not only append a changelog while leaving the main description wrong.

- Model changes: update MODEL_MAP, the affected Data Dictionary sections, ERD/DB Design when represented structure changes, migration/compatibility notes, relevant seed/tests, `src/models/CHANGELOG.md` and `git_doc/change_logs.md`.
- API/business changes: update the relevant contract in `git_doc/docs/08_api`, affected rules/permissions/process specifications and frontend contract. Record the decision source and any unresolved point.
- Seed/setup changes: update `git_doc/docs/09_phat_trien` with exact database, commands, example document codes and checks actually run.
- Record date, reason, affected files/models, behavior, data impact, tests and remaining limitations. Never invent approval, live data or test results. Preserve old evidence as dated history.
- Keep portable relative links. Source/module READMEs are entry points to the canonical git_doc document. Published external copies must identify their source/date.
- For reports in `git_doc/docs/01_bao_cao`, modify existing relevant sections and preserve formatting. Do not add banners, revision appendices or entries to the reports' existing Change Log tables. Use the separate documentation log.
- Run `npm run docs:check`. It checks identical instruction files, principal local links, model-map coverage and documentation-update signals. Review semantic accuracy yourself.

## Git and verification

Check branch/status/diff before editing and preserve other contributors' changes. Before code edits, fetch and safely integrate latest main into the current branch. Never discard/stash other work automatically; if integration cannot be done safely, explain the precise conflict and ask how to resolve it. Docs-only work does not require a pull.

Use localhost first for the rebuilt DB. Remote writes require an explicit rollout instruction. Do not publish secrets, .env, raw production data or private evidence. Use targeted tests and local transaction tests appropriate to the change, distinguish model/seed checks from migrated API/FE runtime proof. Record blockers and tests not run.

Do not automatically commit or push. Follow an explicit user request for those actions. On completion give the concrete outcome, relevant documentation, validation and remaining work; suggest a push when appropriate.
