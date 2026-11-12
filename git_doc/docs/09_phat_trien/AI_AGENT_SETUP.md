# Workspace AI agent setup

The BachDoAn workspace provides Claude Code and Pi configuration without changing API/runtime behavior or database state. The workspace root is outside the three Git repositories.

## Launch

Run `claude` or `pi` from the workspace root, `frontend/`, `building-material-management/` or `docs_bach/`. Review project trust; no global permissions or provider settings are changed.

The canonical setup guide is workspace [`.agents/SETUP.md`](../../../../.agents/SETUP.md). Shared policy lives in root `CLAUDE.md` with `AGENTS.md` pointing to it. Scoped rules and skills live under `.agents/`; Claude uses scoped pointers and skill links, while Pi uses a project extension. Repository-local settings reference those workspace resources.

From the workspace root, run:

```sh
node --test scripts/agent-config.test.mjs
node scripts/agent-audit.mjs
```

After changes restart Claude or use `/reload` in Pi. Both expose `/prompt-audit`; Claude also has native `/doctor prompt-audit` on supported versions.

## Safety and portability

The shared file-tool guard blocks non-template `.env` mutations and instruction files reaching 200 lines. It is not a shell sandbox and does not prove tests passed or grant publication/remote-write permission. Follow the repository's explicit-request policy for commit/push and isolated local databases for write tests.

Workspace resources are not published by committing this repository. Relative links require the complete BachDoAn layout. A standalone clone must supply that layout or replace the local configuration after review; do not treat broken workspace links as an installed guard.

No model, API contract, runtime source or shared database is changed by this setup. Structural checks and native Pi handler checks are not evidence of a live Claude/Pi model session or a skill-quality benchmark.
