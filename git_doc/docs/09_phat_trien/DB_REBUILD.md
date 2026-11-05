# Bộ model mới và quá trình chuyển DB

Cập nhật 05/11/2026. [Thiết kế đã duyệt](../03_thiet_ke/DB_Rebuild_Review/00_Hien_trang_va_cach_duyet.md) · [bản đồ 74 collection](../../MODEL_MAP.md).

## Bộ model đã duyệt

Đây là bộ schema cho thiết kế DB mới đã được duyệt từng bảng. Nó dùng collection có tên nghiệp vụ như `purchase_orders`, `sales_orders`, `purchase_receipts`, dòng hàng nhúng có ID ổn định, thông tin quy đổi trên dòng, khách/NCC/đội xe riêng, giá/hóa đơn và tồn theo chủ hàng.

`src/models/index.js` là entry point của bộ 74 collection đã duyệt. Các file khai báo còn đặt tại `src/models/rebuild` để giữ lịch sử phát triển và các link nội bộ ổn định; đây là mã triển khai chính, không phải bản backup hay model bỏ đi. API chưa chuyển dùng rõ `src/models/legacy/index.js` với `business_documents` và `document_lines`.

## Cách dùng model mới

Import `registerReviewedModels` từ `src/models/index.js`. Tạo Mongoose connection mới, đăng ký rồi lấy model từ Map theo tên collection. Một connection chỉ dùng một profile. `registerMigrationModels` phục vụ chuyển dữ liệu cũ và cần connection khác.

Registry tắt tự tạo collection/index. Các công cụ chuẩn bị DB gọi tạo index rõ ràng. Service phải kiểm nguồn, kho, quyền, phiên bản, hạn mức và cập nhật tồn nguyên tử. Model validate/index riêng lẻ chưa chứng minh tất cả điều đó.

Không dùng `_db_rebuild` hoặc marker tương tự. Seed kiểm DB qua đúng 74 collection, schema/index và kiểm tra nghiệp vụ; API legacy không tự được phép dùng model mới chỉ vì đổi URI.

## Local và bộ dữ liệu hiện hành

Mở `wmsd_demo_tile_shop` tại `localhost:27017`.

- [Hướng dẫn Compass và lệnh local](MONGODB_LOCAL.md).
- [Bộ seed cửa hàng gạch](SEED_CUA_HANG_GACH.md).
- [Kết quả ghi/đọc lại seed](../../outputs/tile_shop_seed_2026-11-05.json).

## Công việc còn lại khi chuyển ứng dụng

1. Chọn một luồng, kiểm model và nguồn đã duyệt, đọc service/API/consumer cũ.
2. Chuyển query và command sang collection mới, thay join dòng rời bằng items có ID ổn định.
3. Giữ hợp đồng hoặc có mapping DTO rõ ràng cho FE, quyền hiện tại, kho và phiên bản.
4. Kiểm transaction, retry, cạnh tranh tồn/hạn mức, freeze, sức chứa, lịch sử và rollback trên local.
5. Ghi module đã chuyển và kiểm thử thực tế trong contract và changelog. Chỉ đề xuất đổi DB chung sau khi các luồng phụ thuộc đủ điều kiện.

D07/D08 tiếp tục chờ người phụ trách xác minh nguồn. Khoảng trống ref Location, unique ITR→TO và loại item discriminator được ghi trong [PROJECT_GUIDE](../../PROJECT_GUIDE.md).

## Các mốc trước

- 02/11 chuyển thử nguồn `sep490` sang `sep490_rebuild_20261102`, có DB backup riêng. Đích còn REVIEW_REQUIRED vì thiếu dữ liệu nguồn.
- 03/11 tạo bộ mẫu `wmsd_demo_v2`, 74 collection/511 bản ghi và triển khai localhost trước DB nhóm.
- 04/11 tạo ERD, DB Design và snapshot schema.
- 05/11 chốt mỗi thùng một sản phẩm/một lô, tổng hợp tài liệu và tạo seed cửa hàng gạch mới.

[Hướng dẫn migration theo mốc cũ](../99_lich_su/DB_REBUILD_truoc_2026-11-05.md) · [báo cáo cũ](../../outputs/db_rebuild_20261102_03/verified_20261102.json). Kết quả test cũ là bằng chứng theo ngày, không khẳng định toàn bộ API hiện nay đã chuyển.
