# Kiểm chứng triển khai native Iteration 1 — 06/11/2026

Đã giải quyết 5 conflict trên nền main 49d0aac; không tạo merge commit. Giữ nguyên product.mapper.js và các tài liệu/test untracked ngoài phạm vi. Không đổi FE runtime. Model mới 60 collections, thêm Uom, metadata, quyết định giữ hộ và provenance bao bì trên movement. Contract: [Iteration 1 native](ITERATION1_NATIVE_2026-11-06.md).

## Kết quả thực chạy

- Bộ BE hiện hành (các test có trong index Git và test migration mới), RUN_NATIVE_API_TESTS=1: 84 tests; 75 pass, 9 skip, 0 fail. Có HTTP thực bằng Express/fetch và MongoDB replica set rs0 tại 127.0.0.1:27017, DB wmsd_api_test_<random> riêng, dọn sau test.
- Test native gồm mua/nhập/cất từng phần; Warehouse đảo trực tiếp có replay; chuyển kho đầy đủ; hàng mở phải khai quy cách thực đo; giữ hộ → nhập sở hữu → đảo → trả NCC; replay RR mất scope; HTTP UOM/NCC/product/ẩn giá; kiểm lại chất lượng/role/evidence/stale/concurrent custody; tranh chấp RR→PO và rollback khi freeze.
- Test migration pure: giữ lịch sử, báo nhiều PO cho RR, map NCC và từ chối remote/shared DB trước kết nối.
- Thử migration dry-run rồi --apply trên wmsd_migration_test_<timestamp> mới: 3 đơn vị, 111 permission; sau đó dọn chính DB thử. Không ghi Atlas/demo. Migration bổ sung permission và quyền mặc định vào role hiện có bằng addToSet, giữ quyền tùy chỉnh.
- npm run docs:check đạt: 3 instruction files đồng nhất, 60 collections, liên kết và changelog signals.
- npm test quét cả test local chưa commit: hai file iteration1-foundation.test.js và iteration1-master.integration.test.js vẫn import src/migrations/iteration-1.js hoặc src/seeds/data/demo.data.js đã bị main xóa. Giữ nguyên các file này; không coi lỗi import đó là test nghiệp vụ đã chạy. Không khôi phục persistence cũ để làm chúng pass.

## Giới hạn

9 test bị skip theo điều kiện môi trường riêng; chưa kiểm FE/browser, Cloudinary live, tải thực, Atlas hoặc toàn bộ nghiệp vụ ngoài các router trong scope. FE cũ chưa tương thích API native. Không tự commit/push; merge còn cần commit được người dùng cho phép sau review.

Full npm test cuối với RUN_NATIVE_API_TESTS=1: 87 tests, 76 pass, 2 lỗi import legacy untracked, 9 skip. Bộ hiện hành không gồm hai file legacy đó: 84 tests, 75 pass/9 skip/0 fail. Những lần chạy trước thêm test được thay bằng kết quả cuối này.
