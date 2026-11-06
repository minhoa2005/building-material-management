# Bộ model mới và quá trình chuyển DB

Cập nhật 06/11/2026: 59 collection, seed v8 tại `localhost:27017/wmsd_demo_tile_shop_v8`. [Bản đồ model](../../MODEL_MAP.md), [sản phẩm/lô/thùng](../03_thiet_ke/DB_Rebuild_Review/39_San_pham_va_lo_dang_chot.md), [gộp bảng](../03_thiet_ke/DB_Rebuild_Review/37_Gop_them_5_bang.md).

## Bộ model đã duyệt

Đây là bộ schema cho thiết kế DB mới đã được duyệt từng bảng. Nó dùng collection có tên nghiệp vụ như `purchase_orders`, `sales_orders`, `purchase_receipts`, dòng hàng nhúng có ID ổn định, thông tin quy đổi trên dòng, khách/NCC riêng, biển số trên bàn giao, giá/hóa đơn và tồn theo chủ hàng.

`src/models/index.js` là entry point của bộ 59 collection đã duyệt. Mỗi schema collection khai báo riêng tại `src/models/<name>.model.js`; schema nhúng tại `src/models/embedded/<name>.model.js`. `reviewed-registry.js` nạp bộ mới. `rebuild/` giữ registry/ref/helper và profile migration lịch sử; không sửa builder gộp cũ để thay schema reviewed hiện hành. API chưa chuyển dùng rõ `src/models/legacy/index.js` với `business_documents` và `document_lines`.

## Cách dùng model mới

Import `registerReviewedModels` từ `src/models/index.js`. Tạo Mongoose connection mới, đăng ký rồi lấy model từ Map theo tên collection. Một connection chỉ dùng một profile. `registerMigrationModels` phục vụ chuyển dữ liệu cũ và cần connection khác.

Registry tắt tự tạo collection/index. Các công cụ chuẩn bị DB gọi tạo index rõ ràng. Service phải kiểm nguồn, kho, quyền, phiên bản, hạn mức và cập nhật tồn nguyên tử. Model validate/index riêng lẻ chưa chứng minh tất cả điều đó.

Không dùng `_db_rebuild` hoặc marker tương tự. Seed kiểm DB qua đúng 59 collection, schema/index và kiểm tra nghiệp vụ; API legacy không tự được phép dùng model mới chỉ vì đổi URI.

## Local và bộ dữ liệu hiện hành

Mở `wmsd_demo_tile_shop_v8` tại `localhost:27017`.

- [Hướng dẫn Compass và lệnh local](MONGODB_LOCAL.md).
- [Bộ seed cửa hàng gạch](SEED_CUA_HANG_GACH.md).
- [Kết quả local chỉ gạch](../../outputs/tile_only_v7_local_2026-11-06.json) và [Atlas đã xác minh](ATLAS_DEPLOYMENT.md).

## Công việc còn lại khi chuyển ứng dụng

1. Chọn một luồng, kiểm model và nguồn đã duyệt, đọc service/API/consumer cũ.
2. Chuyển query và command sang collection mới, thay join dòng rời bằng items có ID ổn định.
3. Giữ hợp đồng hoặc có mapping DTO rõ ràng cho FE, quyền hiện tại, kho và phiên bản.
4. Kiểm transaction, retry, cạnh tranh tồn/hạn mức, freeze, sức chứa, lịch sử và rollback trên local.
5. Ghi module đã chuyển và kiểm thử thực tế trong contract và changelog. Chỉ đề xuất đổi DB chung sau khi các luồng phụ thuộc đủ điều kiện.

D07/D08 tiếp tục chờ người phụ trách xác minh nguồn. Khoảng trống ref Location, unique ITR→TO và loại item discriminator được ghi trong [PROJECT_GUIDE](../../PROJECT_GUIDE.md).

Dữ liệu thật cần bổ sung màu, kích thước từng viên và kích thước ngoài thùng; không suy từ nominalSize hay thể tích viên. Lô cũ khác tone cần đối chiếu productId màu trước khi gộp khóa productId + manufacturerLot. Không đổi thầm quy cách lô đã dùng; snapshot phiếu cũ giữ nguyên. Bộ mẫu là dữ liệu test. V7 chỉ giữ gạch; v6 không bị sửa. Atlas wmsd_database đã được tạo theo yêu cầu trực tiếp, các API và cấu hình ứng dụng vẫn chưa chuyển.

## Các mốc trước

- 02/11 chuyển thử nguồn `sep490` sang `sep490_rebuild_20261102`, có DB backup riêng. Đích còn REVIEW_REQUIRED vì thiếu dữ liệu nguồn.
- 03/11 tạo bộ mẫu `wmsd_demo_v2`, 74 collection/511 bản ghi và triển khai localhost trước DB nhóm.
- 04/11 tạo ERD, DB Design và snapshot schema.
- 05/11 chốt mỗi thùng một sản phẩm/một lô, tổng hợp tài liệu và tạo seed cửa hàng gạch mới.

[Hướng dẫn migration theo mốc cũ](../99_lich_su/DB_REBUILD_truoc_2026-11-05.md) · [báo cáo cũ](../../outputs/db_rebuild_20261102_03/verified_20261102.json). Kết quả test cũ là bằng chứng theo ngày, không khẳng định toàn bộ API hiện nay đã chuyển.

## Mốc category hiện hành

[Category v8](CATEGORIES_V8.md): 5 nhóm, products.categoryId bắt buộc, 59 collection/638 bản ghi. Dữ liệu local/Atlas trước đang trống khi kiểm tra nên tạo mới fixture v8; các báo cáo v7 được giữ làm lịch sử, không xác nhận DB cũ còn tồn tại. Ba builder reviewed không còn được gọi đã bỏ; các thư mục embedded/legacy/rebuild vẫn có phụ thuộc.
