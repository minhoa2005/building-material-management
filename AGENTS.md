# Backend agent instructions

Before analyzing, planning, or changing the backend, read [context.md](context.md) in full. Use the shared business rules and relevant use case cards as the basis for implementation. The context describes both existing and proposed functionality, so check the current source code before drawing conclusions or making changes.

When changing APIs, permissions, data, or business rules that affect the frontend, also read the [frontend context](../fe/context.md) and keep the frontend–backend contract consistent. Preserve use case scope, source document links, assigned warehouse checks, versions, evidence, and inventory effects.

Before starting code changes, pull the latest `main` into the current working branch. Check the repository status first and preserve existing changes; if pulling would risk overwriting work or cannot be completed safely, explain the blocker and ask the user how to proceed.

When documentation changes, record the changes in [git_doc/change_logs.md](git_doc/change_logs.md). When model files change, record the changes in [src/models/CHANGELOG.md](src/models/CHANGELOG.md).

The files in `git_doc/docs/01_bao_cao/` are comparison and submission copies. Update content only within existing sections; do not add version banners, revision history lines or tables, REVISION blocks, update appendices, or synchronization or implementation notes at the end of a report. Put new requirements in the appropriate existing business, scope, data, use case, screen, or planning/testing section. Preserve existing Change Log tables without adding entries to them; use the separate documentation changelog above.

After completing a feature, suggest that the user push the code. Do not automatically commit or push.
