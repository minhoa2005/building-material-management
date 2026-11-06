# WMSD — ERD & DB Design hiện tại

Bộ ảnh/snapshot lịch sử ngày 04/11/2026, dựa trên MongoDB localhost `wmsd_demo_v2` tại thời điểm đó. Bộ model hiện hành được đăng ký từ `src/models/index.js`; database mẫu hiện hành là `localhost:27017/wmsd_demo_tile_shop`.

## Mở file nào?

- **WMSD_ERD_Current.drawio**: 14 tab. Tab **00 — Overall System ERD** trình bày 16 thực thể cốt lõi; 13 tab tiếp theo chia nhóm và bao phủ 74 collection. Entity hình chữ nhật; relationship hình tam giác; đường nét liền; nhãn 1/n ở các đầu nối. Quan hệ n–n của sản phẩm với phiếu được lưu bằng dòng nhúng.
- **WMSD_DB_Design_Current.drawio**: 94 tab: mục lục có liên kết → 74 collection → 19 kiểu dòng nhúng. Có tên trường, kiểu, required, ref, index và ghi chú. Bấm collection tại mục lục hoặc nút referenced collections để chuyển tab.
- **WMSD_Data_Dictionary.md**: toàn bộ mô tả collection/trường, enum, default, unique/partial index và cơ sở các quan hệ.
- **schema_snapshot.json**: cấu trúc được đọc tại thời điểm lập tài liệu; không xuất giá trị các bản ghi.
- **validation.json**: kết quả kiểm 74 collection, 3.327 path cơ sở, 19 kiểu details, tọa độ và đầu nối.

## Cách đọc

ERD là quan hệ nghiệp vụ, không phải sơ đồ luồng thao tác. Nhãn 1/n ghi số tối đa; ghi chú giải thích trường hợp có thể chưa có bản ghi hoặc ràng buộc điều kiện. Tab Overall lược bớt phiếu trung gian; “via” chỉ quan hệ đi qua các phiếu đó. Các tab nhóm và Data Dictionary cho biết đường liên kết cụ thể.

Trong DB Design, `header`, `items[]`, `handovers[]`, các snapshot/decision nằm trong document là **embedded**, không phải collection riêng. `*` nghĩa required trong Mongoose; `C` có điều kiện; `I` immutable. Root `_id` là PK; `_id` trong mảng là mã dòng. Từng dòng giữ quy đổi tại thời điểm lập phiếu; không còn bảng UOM/UOMVersion.

`REF` là ref khai báo trực tiếp trong model. `LOGIC` là liên kết giải thích theo nghiệp vụ/trường loại nguồn, kể cả khi model không khai báo ref cụ thể. Cả hai đều không phải khóa ngoại được MongoDB tự kiểm tra.

## Điểm đang mở trong cấu trúc hiện tại

- D07/D08: quy trình xác minh hồ sơ nguồn chưa được người phụ trách chốt.
- `stocktakes.header.scopeLocationIds[]` đang ref `Location`, trong khi registry mới đăng ký `WarehouseLocation`.
- Một ITR → tối đa một TO là quy tắc đã duyệt nhưng chưa có unique index ở `transfer_orders.header.requirementId`.
- Các loại phiếu đang chia sẻ toàn bộ 19 loại item discriminator; phải kiểm loại dòng phù hợp tại tầng nghiệp vụ.
- DB chưa có MongoDB JSON Schema validator; model Mongoose và index là hai lớp kiểm tra khác nhau.
- Snapshot này có marker lịch sử, nhưng marker đã bị loại khỏi cấu trúc hiện hành. Sơ đồ vẫn không xác nhận mọi API đã được chuyển đổi.

Không sửa DB, backend hay ghi đè ERD/database-design cũ trong tác vụ này.
