# Lịch sử triển khai v7 — 06/11/2026

**Bản hiện hành là [v8 có category](CATEGORIES_V8.md): 59 collection/638 bản ghi.** Các số liệu và lệnh v7 dưới đây được giữ theo mốc trước; không dùng chúng làm trạng thái hiện tại.

Theo yêu cầu trực tiếp của người dùng, đã tạo database **wmsd_database** trên cluster **bmm-dev.xp3xmga.mongodb.net**. Đích trước khi ghi không có collection. Không lưu URI có mật khẩu trong mã nguồn, tài liệu hoặc báo cáo.

## Dữ liệu đã đưa lên

Nguồn local: `mongodb://localhost:27017/wmsd_demo_tile_shop_v7`.

| Nội dung | Kết quả |
|---|---|
| Collection / bản ghi cấp bảng | 58 / 633 |
| Sản phẩm / lô | 18 sản phẩm gạch / 39 lô |
| Số dư / giao dịch tồn / biến động nhúng | 51 / 32 / 70 |
| Hồ sơ nghiệp vụ / dòng nhúng / hóa đơn | 81 / 115 / 1 |
| Đối chiếu local với Atlas | Khớp toàn bộ dữ liệu BSON qua SHA-256, kiểm lại schema, liên kết, tồn, hạn mức, sức chứa và hóa đơn |
| Index | Đã tạo và kiểm tra với schema hiện hành |

[Báo cáo triển khai](../../outputs/wmsd_database_deployed_2026-11-06.json) · [Lần xác minh độc lập sau triển khai](../../outputs/wmsd_database_verified_2026-11-06.json).

## Làm sạch nguồn local

Hai sản phẩm mẫu lavabo và bồn cầu đã bị xóa khỏi v6 trước lượt này nhưng các bản ghi phụ thuộc vẫn còn. Người dùng chọn **chỉ giữ gạch, bỏ dữ liệu thiết bị vệ sinh liên quan**. Bản v7 sao từ dữ liệu đang có của v6, loại 4 lô, 4 số dư, 4 điểm tồn, 4 ô, 1 phiếu tồn đầu, 1 giao dịch tồn chứa 4 biến động và 1 NCC thiết bị vệ sinh. Không xóa thêm hai sản phẩm vì chúng đã không còn. Đổi tên kho mẫu thứ ba thành kho gạch dự phòng, giữ ID/kích thước và để trống hàng; đây là nhãn mô phỏng, không thay đổi dữ kiện khảo sát thực tế.

Đã chặn nếu chứng từ/giao dịch trộn hàng gạch và hàng bị loại; kiểm không còn ID tham chiếu bản ghi bị loại, sau đó chạy toàn bộ kiểm tra nghiệp vụ trước khi ghi bản mới. Các ID và dữ liệu khác giữ nguyên. Hash đọc lại v6 chứng minh nguồn không bị sửa. [Báo cáo làm sạch](../../outputs/tile_only_v7_local_2026-11-06.json). Code seed v7 cho máy khác cũng chỉ tạo hàng gạch; ID fixture có thể khác bản sao giữ ID từ v6 này.

## Mở trong Compass

Dùng kết nối Atlas được cấp riêng, chọn **wmsd_database** và Refresh Databases. Không dùng URI localhost để tìm database cloud. Local vẫn có bản v7 và các bản cũ để truy vết.

## Công cụ triển khai

`scripts/deploy-reviewed-db.mjs` nhận bí mật từ biến môi trường `MONGODB_TARGET_URI`; không đọc URI cloud từ `.env` ứng dụng. Thiết lập biến đó bằng cơ chế bí mật của máy, rồi chạy:

```powershell
# Xem trước, không ghi
npm run db:deploy -- --source wmsd_demo_tile_shop_v7 --target wmsd_database
# Triển khai nếu đích rỗng
npm run db:deploy -- --apply --source wmsd_demo_tile_shop_v7 --target wmsd_database
# Chỉ kiểm lại
npm run db:deploy -- --verify --source wmsd_demo_tile_shop_v7 --target wmsd_database
```

Nguồn phải là DB demo trên loopback. Đích được giới hạn đúng tên đã duyệt. Chỉ tạo khi đích rỗng; nếu đã có dữ liệu giống hệt thì xác minh thay vì chèn lại; nếu khác thì dừng, không merge/ghi đè. Tạo index trước, chèn trong một transaction trên Atlas, đọc lại và so sánh. Báo cáo chỉ chứa số lượng, hash và kết quả kiểm; lỗi không in URI hay thông báo driver chứa bí mật. Không tự gửi email từ fixture.

## Model theo từng file

58 collection khai báo tại `src/models/*.model.js`, mỗi file một schema. 96 schema nhúng khai báo tại `src/models/embedded/*.model.js`; không tạo thêm collection. `reviewed-registry.js` nạp các factory này. `legacy/` giữ model cho API cũ; `rebuild/` giữ đăng ký/ref/helper và profile migration lịch sử. [Bản đồ từng file](../../MODEL_MAP.md) · [Từ điển hiện hành](../03_thiet_ke/DB_Current_2026-11-06_58_v7/WMSD_Data_Dictionary.md).

Đối chiếu trước/sau tách file cho thấy không đổi metadata field/type/default/required/ref/index và không đổi dữ liệu BSON sau serialize. [Báo cáo tách model](../../outputs/model_files_split_2026-11-06.json).

## Giới hạn triển khai

Đã đưa dữ liệu test lên DB được chỉ định; **chưa chuyển các service/API legacy và chưa đổi kết nối ứng dụng**. Việc đổi model không tự chuyển query, quyền, DTO hoặc transaction của API. D07/D08 còn chờ xác minh nghiệp vụ như trước. DB/model/seed/deploy có 52 test đạt. Lần chạy toàn bộ test dự án còn 10 lỗi ở legacy: 9 lỗi import thiếu `src/shared/utils/domain.js`, 1 lỗi fixture legacy thiếu loại `INTERNAL_TRANSFER_REQUIREMENT`; 13 test bỏ qua và 114 đạt tại mốc chạy trước cập nhật seed v7. Không coi đó là kết quả kiểm API đã port.
