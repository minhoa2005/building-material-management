# Model runtime và dữ liệu thử

The runtime uses one registry: `src/models/index.js` exports `registerModels(connection)`; `runtime.js` supplies API models. There are 59 collection schemas (`*.model.js`) and 96 nested schemas (`*.schema.js`) directly under `src/models`. Nested schemas do not create collections. `registerReviewedModels` is a compatibility alias. No legacy profile or migration-model registration remains. Pure historical transforms and synthetic fixtures under `src/migrations/rebuild` and `src/seeds/rebuild` remain for regression checks.

Bộ mẫu mới mang seedVersion wmsd-tile-shop-20261106-v9, 59 collection/642 bản ghi; mặc định local là wmsd_demo_tile_shop_v9. V9 cập nhật catalogue quyền và role theo runtime mới. Không tự ghi đè v8 hoặc Atlas. Dữ liệu đã triển khai trước đây giữ nguyên trạng thái lịch sử trong báo cáo tương ứng.

- npm test: kiểm schema, fixture và dịch vụ không cần DB; test tích hợp phải bật riêng.
- npm run test:db-rebuild: kiểm mẫu/registry.
- npm run db:local:start rồi npm run db:local:status: chuẩn bị/kiểm MongoDB local.
- npm run db:local:seed: ghi dữ liệu tổng hợp vào đích local của công cụ, chỉ chạy sau khi xem đích.
- npm run db:local:verify: xác minh dữ liệu.
- RUN_NATIVE_API_TESTS=1 node --test test/native-api.integration.test.js: kiểm giao dịch trên replica set `rs0` tại `127.0.0.1:27017`; mỗi lượt tạo DB wmsd_api_test_* riêng. Trong PowerShell đặt biến môi trường trước câu lệnh Node.
- npm run docs:check: kiểm tài liệu.

Seed khi khởi động API chỉ chạy khi SEED_ON_STARTUP được bật. Đổi URI không chuyển đổi dữ liệu legacy. Không có công cụ tự động chuyển toàn bộ DB legacy trong bản này; các transform còn giữ chỉ phục vụ fixture/regression. Cần một đợt triển khai dữ liệu có phê duyệt riêng trước dùng dữ liệu thật.

## Seed PO theo quyết định 11/11/2026

Bộ seed hiện hành dùng `header.expectedOn` trên PO mẫu `PO-202610-001` và bỏ lịch giao từng dòng. Để tạo bộ mẫu mới, chạy `npm run db:local:seed` rồi `npm run db:local:verify` trên DB demo trống. Đích mặc định là `wmsd_demo_tile_shop_v9` trên `localhost:27017`, replica set `rs0`. DB đã có seed không bị ghi đè và có thể báo khác fingerprint khi bộ mẫu đổi.

Bằng chứng trước khi bỏ lịch giao. Đã chạy `npm run db:local:seed` rồi `npm run db:local:verify` trên `localhost:27017`, replica set `rs0`, DB `wmsd_demo_tile_shop_v9`. Seed version `wmsd-tile-shop-20261109-v10` tạo 58 collection và 742 bản ghi. Kiểm trực tiếp `PO-202610-001` xác nhận có một mốc lịch giao và các trường xác nhận NCC đã được loại khỏi bản ghi.

[Hợp đồng runtime](../08_api/NATIVE_MODEL_RUNTIME.md) · [Bản đồ model](../../MODEL_MAP.md).
