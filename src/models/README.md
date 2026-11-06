# Current WMSD models

The runtime uses one registry: `src/models/index.js` exports `registerModels(connection)`; `runtime.js` supplies API models. There are 59 collection schemas (`*.model.js`) and 96 nested schemas (`*.schema.js`) directly under `src/models`. Nested schemas do not create collections. `registerReviewedModels` is a compatibility alias. No legacy profile or migration-model registration remains. Pure historical transforms and synthetic fixtures under `src/migrations/rebuild` and `src/seeds/rebuild` remain for regression checks.

Read [MODEL_MAP](../../git_doc/MODEL_MAP.md) and the [native API contract](../../git_doc/docs/08_api/NATIVE_MODEL_RUNTIME.md). The user explicitly approved removal of all three old model directories and the reviewed retirement list on 06/11/2026.

One role per user, multiple warehouses, embedded document items and exact decimal strings apply throughout runtime. Products own base units and dimensions; batches own carton specifications. Catalogue edits use expectedUpdatedAt; documents use expectedVersion. There are no UOM/UOMVersion collections.
