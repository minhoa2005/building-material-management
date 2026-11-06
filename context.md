> Quyết định mới 06/11/2026: [Iteration 1 native](git_doc/docs/08_api/ITERATION1_NATIVE_2026-11-06.md) thay quy tắc UOM, NCC, giữ hộ và đảo nhập ở các phần lịch sử bên dưới. Danh mục UOM được khôi phục; không có bảng conversion. Warehouse tự đảo nhận mua; Accountant quyết định xử lý giữ hộ.

# Backend context

The runtime uses one registry: `src/models/index.js` exports `registerModels(connection)`; `runtime.js` supplies API models. There are 60 collection schemas (`*.model.js`) and 96 nested schemas (`*.schema.js`) directly under `src/models`. Nested schemas do not create collections. `registerReviewedModels` is a compatibility alias. No legacy profile or migration-model registration remains. Pure historical transforms and synthetic fixtures under `src/migrations/rebuild` and `src/seeds/rebuild` remain for regression checks.

Start with [PROJECT_GUIDE](git_doc/PROJECT_GUIDE.md), [MODEL_MAP](git_doc/MODEL_MAP.md), [native runtime contract](git_doc/docs/08_api/NATIVE_MODEL_RUNTIME.md) and [documentation rules](git_doc/DOCUMENTATION_RULES.md). The paired frontend is `../../FE/NameUi`.

No automatic commit/push. No remote writes as part of the model synchronization. Preserve dated deployment evidence. D07/D08 remains unresolved.
