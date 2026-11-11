# Seed bổ sung để thử BF03 — 07/11/2026

`scripts/seed-bf03.mjs` bổ sung fixture riêng vào kho đã tồn tại, không reset
database hoặc đổi dữ liệu/tài khoản hiện có. Chọn rõ database và mã kho; mặc định
chỉ xem trước. Script không lấy tên DB mặc định trong URI làm đích ngầm định.

```powershell
node scripts/seed-bf03.mjs --database wmsd_database --warehouse K-GACH-01
```

Sau khi kiểm local và được người dùng duyệt nạp lên đúng DB remote:

```powershell
node scripts/seed-bf03.mjs --database wmsd_database --warehouse K-GACH-01 --apply --allow-remote
```

URI lấy từ `MONGODB_URI`; không lưu URI/mật khẩu vào tài liệu. `--allow-remote`
chỉ được dùng khi có chỉ định nạp remote. Seed đòi replica set, kiểm schema và
ghi nguyên tử 9 bản ghi (10 nếu DB chưa có category hoạt động). Nếu trùng mã vị
trí/ID, dừng thay vì ghi đè. Chạy lại khi đã có phiếu tồn đầu kỳ chỉ báo số dư
hiện tại, không cộng lại lượng người dùng đã chuyển.

## Dữ liệu mẫu

| Thành phần | Giá trị |
| --- | --- |
| Kho | K-GACH-01 — Kho gạch trung tâm |
| Tài khoản được tìm trong kho | Warehouse Staff đang hoạt động; preview hiện trả thukho01 |
| Sản phẩm | BF03-DEMO-6060 — Gạch mẫu chuyển vị trí BF03 60×60 |
| Lô | BF03-DEMO-LOT-01, VERIFIED, 4 viên/thùng |
| Nguồn | BF03-A, STORAGE hoạt động, tồn ban đầu 10 thùng = 40 viên |
| Đích | BF03-B, STORAGE hoạt động, ban đầu trống |
| Phiếu gốc | BF03-OPENING-K-GACH-01, POSTED; có StockTransaction/movement |

Vào FE `/location-moves`, dùng tài khoản được phân công K-GACH-01, chọn kho đó
→ Tạo Transfer Order → tồn nguồn có SKU BF03-DEMO-6060 tại BF03-A → đích BF03-B
→ đơn vị BOX → lượng 1 → Lưu lệnh → Xác nhận thực chuyển → Xác nhận và cập nhật
tồn. Kỳ vọng còn 36 viên ở A, 4 viên ở B. Chỉ chạy thao tác này khi muốn tiêu thụ
dữ liệu mẫu; lần kiểm script không tự chuyển hàng trên DB remote.

## Vì sao tồn nguồn trống?

BF03 chỉ hiển thị số dư dương liên kết đủ chuỗi balance → holding point → vị trí
hoạt động đúng kho và batch VERIFIED → product hoạt động. Tạo danh mục sản phẩm
hoặc tạo vị trí riêng lẻ chưa tạo ra tồn. Kiểm thêm warehouseIds/quyền tài khoản,
query warehouseId và database backend thực sự đang chạy.

Đọc thực tế 07/11: `wmsd_database` đã có 52 vị trí, 39 lô, 51 số dư; số nguồn
đủ điều kiện tại K-GACH-01/02/03 là 23/19/1 trước seed này. `.env` của checkout
tại thời điểm đọc vẫn trỏ tên DB `sep490`; DB đó không có vị trí/lô/số dư. Đây là
hai DB khác nhau, chưa khẳng định process đang phục vụ FE dùng DB nào. Không tự
đổi `.env` hoặc khởi động lại process của người dùng.

Kiểm local: `RUN_NATIVE_API_TESTS=1 node --test test/native-api.integration.test.js`;
bài seed kiểm preview không ghi, options thấy nguồn, chuyển đúng 1 thùng, và chạy
lại không khôi phục 4 viên đã chuyển. DB test ngẫu nhiên ở localhost:27028.

Kết quả 07/11/2026: 6/6 native integration đạt. Sau chấp thuận rõ của người dùng,
đã nạp 9 bản ghi vào `wmsd_database`, K-GACH-01 (SEEDED). Đọc lại qua chính
`locationMovementOptions` với tài khoản thukho01 thấy product hoạt động, batch
VERIFIED, nguồn BF03-A hoạt động có 40 viên, đích BF03-B hoạt động. Không thực
hiện TO chuyển thử trên remote. `docs:check` và `git diff --check` đạt. Process
HTTP/phiên đăng nhập FE hiện tại vẫn cần đối chiếu nếu giao diện còn trống.

## Tương thích Conversion từ main — 11/11/2026

Fixture mới dùng baseUnit PIECE, tái sử dụng UOM PIECE/BOX đang hoạt động (chỉ tạo nếu chưa có) và tạo Conversion theo lô 1 BOX = 4 PIECE cùng transaction. Không sửa UOM có sẵn hoặc đặt lại tồn. Fixture cũ đã nạp vẫn trả ALREADY_SEEDED; muốn dùng với runtime Conversion mới phải theo hướng dẫn backfill chung, không chạy lại seed để sửa tồn. Kiểm chứng bằng ca BF03 additive seed trong native-api.integration.test.js.
